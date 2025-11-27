import json
import unittest
from decimal import Decimal
from unittest.mock import patch, Mock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token

from bookings.models import Booking
from chefs.models import ChefProfile
from payments.models import Payment, MpesaPayment
from payments.services import StripePaymentService, PaymentProcessingService
from payments.mpesa_service import MpesaService, MpesaPaymentService

User = get_user_model()


@unittest.skip("Stripe disabled")
class StripePaymentServiceTestCase(TestCase):
    """Test cases for Stripe payment service"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='testpass123',
            role='client'
        )
        
        self.chef_user = User.objects.create_user(
            email='chef@example.com',
            username='chef',
            password='testpass123',
            role='chef'
        )
        
        self.chef_profile = ChefProfile.objects.create(
            user=self.chef_user,
            bio='Test chef',
            experience_years=5,
            hourly_rate=Decimal('50.00')
        )
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent_success(self, mock_create):
        """Test successful payment intent creation"""
        mock_create.return_value = Mock(
            id='pi_test123',
            client_secret='pi_test123_secret_test'
        )
        
        result = StripePaymentService.create_payment_intent(
            amount=Decimal('100.00'),
            metadata={'test': 'data'}
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['payment_intent_id'], 'pi_test123')
        self.assertEqual(result['client_secret'], 'pi_test123_secret_test')
        
        mock_create.assert_called_once_with(
            amount=10000,  # $100.00 in cents
            currency='usd',
            metadata={'test': 'data'},
            automatic_payment_methods={'enabled': True}
        )
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment_intent_failure(self, mock_create):
        """Test payment intent creation failure"""
        mock_create.side_effect = Exception('Stripe error')
        
        result = StripePaymentService.create_payment_intent(amount=Decimal('100.00'))
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    @patch('stripe.Customer.create')
    def test_create_customer_success(self, mock_create):
        """Test successful customer creation"""
        mock_create.return_value = Mock(id='cus_test123')
        
        result = StripePaymentService.create_customer(self.user)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['customer_id'], 'cus_test123')
        
        mock_create.assert_called_once_with(
            email=self.user.email,
            name=f"{self.user.first_name} {self.user.last_name}",
            metadata={'user_id': self.user.id}
        )


class MpesaServiceTestCase(TestCase):
    """Test cases for M-Pesa service"""
    
    def setUp(self):
        self.mpesa_service = MpesaService()
        self.user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='testpass123',
            role='client'
        )
    
    @patch('requests.get')
    def test_get_access_token_success(self, mock_get):
        """Test successful access token retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'access_token': 'test_token_123'}
        mock_get.return_value = mock_response
        
        result = self.mpesa_service.get_access_token()
        
        self.assertTrue(result['success'])
        self.assertEqual(result['access_token'], 'test_token_123')
    
    @patch('requests.get')
    def test_get_access_token_failure(self, mock_get):
        """Test access token retrieval failure"""
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.text = 'Error message'
        mock_get.return_value = mock_response
        
        result = self.mpesa_service.get_access_token()
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
    
    def test_generate_password(self):
        """Test password generation for STK push"""
        timestamp = '20231201120000'
        password = self.mpesa_service.generate_password(timestamp)
        
        self.assertIsInstance(password, str)
        self.assertTrue(len(password) > 0)
    
    @patch.object(MpesaService, 'get_access_token')
    @patch('requests.post')
    def test_initiate_stk_push_success(self, mock_post, mock_token):
        """Test successful STK push initiation"""
        mock_token.return_value = {'success': True, 'access_token': 'test_token'}
        
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'ResponseCode': '0',
            'CheckoutRequestID': 'ws_CO_test123',
            'MerchantRequestID': 'mr_test123',
            'ResponseDescription': 'Success'
        }
        mock_post.return_value = mock_response
        
        result = self.mpesa_service.initiate_stk_push(
            phone_number='254712345678',
            amount=100,
            account_reference='TEST123',
            transaction_desc='Test payment'
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['checkout_request_id'], 'ws_CO_test123')
        self.assertEqual(result['merchant_request_id'], 'mr_test123')


class PaymentAPITestCase(APITestCase):
    """Test cases for payment API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='testpass123',
            role='client'
        )
        
        self.chef_user = User.objects.create_user(
            email='chef@example.com',
            username='chef',
            password='testpass123',
            role='chef'
        )
        
        self.chef_profile = ChefProfile.objects.create(
            user=self.chef_user,
            bio='Test chef',
            experience_years=5,
            hourly_rate=Decimal('50.00')
        )
        
        self.booking = Booking.objects.create(
            client=self.user,
            chef=self.chef_profile,
            booking_date='2024-01-15T18:00:00Z',
            number_of_guests=4,
            base_price=Decimal('200.00'),
            total_amount=Decimal('200.00'),
            status='pending'
        )
        
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
    
    def test_payment_list_authenticated(self):
        """Test payment list for authenticated user"""
        # Create a payment for the user
        Payment.objects.create(
            booking=self.booking,
            client=self.user,
            amount=Decimal('210.00'),
            platform_fee=Decimal('10.00'),
            status='completed'
        )
        
        response = self.client.get('/api/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_payment_list_unauthenticated(self):
        """Test payment list for unauthenticated user"""
        self.client.credentials()  # Remove authentication
        response = self.client.get('/api/payments/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @unittest.skip("Stripe disabled")
    @patch.object(PaymentProcessingService, 'process_booking_payment')
    def test_stripe_payment_creation_success(self, mock_process):
        """Test successful Stripe payment creation"""
        mock_process.return_value = {
            'success': True,
            'payment_id': 1,
            'booking_id': self.booking.id,
            'amount': Decimal('210.00')
        }
        
        data = {
            'booking_id': self.booking.id,
            'payment_method_id': 'pm_test123'
        }
        
        response = self.client.post('/api/payments/stripe/create-intent/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['booking_id'], self.booking.id)
    
    @unittest.skip("Stripe disabled")
    @patch.object(PaymentProcessingService, 'process_booking_payment')
    def test_stripe_payment_creation_failure(self, mock_process):
        """Test Stripe payment creation failure"""
        mock_process.return_value = {
            'success': False,
            'error': 'Payment processing failed'
        }
        
        data = {
            'booking_id': self.booking.id,
            'payment_method_id': 'pm_test123'
        }
        
        response = self.client.post('/api/payments/stripe/create-intent/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('error', response.data)
    
    @patch.object(MpesaPaymentService, 'process_booking_payment')
    def test_mpesa_payment_creation_success(self, mock_process):
        """Test successful M-Pesa payment creation"""
        mock_process.return_value = {
            'success': True,
            'payment_id': 1,
            'mpesa_payment_id': 1,
            'checkout_request_id': 'ws_CO_test123',
            'message': 'STK push sent'
        }
        
        data = {
            'booking_id': self.booking.id,
            'phone_number': '254712345678'
        }
        
        response = self.client.post('/api/payments/mpesa/pay/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['checkout_request_id'], 'ws_CO_test123')
    
    def test_mpesa_payment_missing_data(self):
        """Test M-Pesa payment with missing required data"""
        data = {
            'booking_id': self.booking.id
            # Missing phone_number
        }
        
        response = self.client.post('/api/payments/mpesa/pay/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    @patch.object(MpesaPaymentService, 'check_payment_status')
    def test_mpesa_status_check(self, mock_check):
        """Test M-Pesa payment status check"""
        # Create M-Pesa payment
        payment = Payment.objects.create(
            booking=self.booking,
            client=self.user,
            amount=Decimal('210.00'),
            platform_fee=Decimal('10.00'),
            payment_method='mpesa',
            status='pending'
        )
        
        mpesa_payment = MpesaPayment.objects.create(
            payment=payment,
            phone_number='254712345678',
            checkout_request_id='ws_CO_test123',
            merchant_request_id='mr_test123',
            status='pending'
        )
        
        mock_check.return_value = {
            'success': True,
            'status': 'completed',
            'receipt_number': 'MPesa123'
        }
        
        response = self.client.get(f'/api/payments/mpesa/status/{mpesa_payment.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['status'], 'completed')


class PaymentProcessingTestCase(TestCase):
    """Test cases for payment processing logic"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='testpass123',
            role='client'
        )
        
        self.chef_user = User.objects.create_user(
            email='chef@example.com',
            username='chef',
            password='testpass123',
            role='chef'
        )
        
        self.chef_profile = ChefProfile.objects.create(
            user=self.chef_user,
            bio='Test chef',
            experience_years=5,
            hourly_rate=Decimal('50.00')
        )
        
        self.booking = Booking.objects.create(
            client=self.user,
            chef=self.chef_profile,
            booking_date='2024-01-15T18:00:00Z',
            number_of_guests=4,
            base_price=Decimal('200.00'),
            total_amount=Decimal('200.00'),
            status='pending'
        )
    
    @patch.object(StripePaymentService, 'create_payment_intent')
    @patch.object(StripePaymentService, 'confirm_payment')
    def test_booking_payment_processing_success(self, mock_confirm, mock_create):
        """Test successful booking payment processing"""
        mock_create.return_value = {
            'success': True,
            'payment_intent_id': 'pi_test123',
            'client_secret': 'pi_test123_secret'
        }
        
        mock_confirm.return_value = {
            'success': True,
            'status': 'succeeded',
            'payment_intent': Mock()
        }
        
        result = PaymentProcessingService.process_booking_payment(
            booking_id=self.booking.id,
            payment_method_id='pm_test123'
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['booking_id'], self.booking.id)
        
        # Verify payment was created
        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.status, 'completed')
        self.assertEqual(payment.amount, Decimal('210.00'))  # 200 + 5% fee
        
        # Verify booking was updated
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
    
    def test_booking_payment_processing_invalid_booking(self):
        """Test payment processing with invalid booking ID"""
        result = PaymentProcessingService.process_booking_payment(
            booking_id=99999,  # Non-existent booking
            payment_method_id='pm_test123'
        )
        
        self.assertFalse(result['success'])
        self.assertIn('Booking not found', result['error'])

    @patch.object(MpesaService, 'initiate_stk_push')
    def test_mpesa_payment_idempotency(self, mock_push):
        """Test M-Pesa payment idempotency (prevent double charge)"""
        mock_push.return_value = {
            'success': True,
            'checkout_request_id': 'ws_CO_test123',
            'merchant_request_id': 'mr_test123',
            'ResponseDescription': 'Success'
        }
        
        service = MpesaPaymentService()
        
        # First call - should initiate payment
        result1 = service.process_booking_payment(self.booking.id, '254712345678')
        if not result1['success']:
            print(f"Payment failed: {result1}")
        self.assertTrue(result1['success'])
        self.assertEqual(Payment.objects.count(), 1)
        
        # Second call - should return existing payment
        result2 = service.process_booking_payment(self.booking.id, '254712345678')
        self.assertTrue(result2['success'])
        self.assertEqual(result2['message'], 'Pending payment already exists. Please check your phone.')
        self.assertEqual(Payment.objects.count(), 1)  # Count should still be 1
        
        # Verify mock was only called once
        mock_push.assert_called_once()
