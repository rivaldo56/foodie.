import requests
import base64
import json
import logging
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Payment, MpesaPayment
from bookings.models import Booking

User = get_user_model()
logger = logging.getLogger(__name__)


class MpesaService:
    """Service class for handling M-Pesa payments via Safaricom Daraja API"""
    
    def __init__(self):
        self.consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.business_short_code = getattr(settings, 'MPESA_BUSINESS_SHORT_CODE', '')
        self.passkey = getattr(settings, 'MPESA_PASSKEY', '')
        self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', '')
        self.environment = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')  # sandbox or production
        
        # Set API URLs based on environment
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
    
    def get_access_token(self):
        """Get OAuth access token from M-Pesa API"""
        try:
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            
            # Create basic auth header
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'access_token': data['access_token']
                }
            else:
                logger.error(f"M-Pesa token request failed: {response.text}")
                return {
                    'success': False,
                    'error': 'Failed to get access token'
                }
                
        except Exception as e:
            logger.error(f"M-Pesa token request error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_password(self, timestamp):
        """Generate password for STK push"""
        password_string = f"{self.business_short_code}{self.passkey}{timestamp}"
        return base64.b64encode(password_string.encode()).decode()
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK push for payment"""
        try:
            # Get access token
            token_result = self.get_access_token()
            if not token_result['success']:
                return token_result
            
            access_token = token_result['access_token']
            
            # Generate timestamp and password
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            # Format phone number (remove + and ensure it starts with 254)
            if phone_number.startswith('+'):
                phone_number = phone_number[1:]
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            if not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.business_short_code,
                'PhoneNumber': phone_number,
                'CallBackURL': self.callback_url,
                'AccountReference': account_reference,
                'TransactionDesc': transaction_desc
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ResponseCode') == '0':
                    return {
                        'success': True,
                        'checkout_request_id': data['CheckoutRequestID'],
                        'merchant_request_id': data['MerchantRequestID'],
                        'response_description': data['ResponseDescription']
                    }
                else:
                    return {
                        'success': False,
                        'error': data.get('ResponseDescription', 'STK push failed')
                    }
            else:
                logger.error(f"M-Pesa STK push failed: {response.text}")
                return {
                    'success': False,
                    'error': 'STK push request failed'
                }
                
        except Exception as e:
            logger.error(f"M-Pesa STK push error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def query_stk_status(self, checkout_request_id):
        """Query STK push status"""
        try:
            # Get access token
            token_result = self.get_access_token()
            if not token_result['success']:
                return token_result
            
            access_token = token_result['access_token']
            
            # Generate timestamp and password
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = self.generate_password(timestamp)
            
            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'result_code': data.get('ResultCode'),
                    'result_desc': data.get('ResultDesc'),
                    'data': data
                }
            else:
                logger.error(f"M-Pesa status query failed: {response.text}")
                return {
                    'success': False,
                    'error': 'Status query failed'
                }
                
        except Exception as e:
            logger.error(f"M-Pesa status query error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class MpesaPaymentService:
    """Service for processing M-Pesa payments"""
    
    def __init__(self):
        self.mpesa = MpesaService()
    
    def process_booking_payment(self, booking_id, phone_number):
        """Process M-Pesa payment for a booking"""
        try:
            booking = Booking.objects.get(id=booking_id)
            
            # Idempotency Check: Check for existing pending payment
            existing_payment = Payment.objects.filter(
                booking=booking, 
                status='pending',
                payment_method='mpesa'
            ).first()
            
            if existing_payment:
                # Check if there's a corresponding M-Pesa record
                mpesa_record = MpesaPayment.objects.filter(payment=existing_payment).first()
                if mpesa_record:
                    return {
                        'success': True,
                        'payment_id': existing_payment.id,
                        'mpesa_payment_id': mpesa_record.id,
                        'checkout_request_id': mpesa_record.checkout_request_id,
                        'message': 'Pending payment already exists. Please check your phone.'
                    }
            
            # Calculate total amount
            if booking.is_priority and booking.down_payment_amount > 0:
                # Priority booking: Pay down payment only
                subtotal = booking.down_payment_amount
                transaction_desc = f"Down payment for booking {booking.id}"
            else:
                # Regular booking: Pay full amount + fee
                subtotal = booking.total_amount
                transaction_desc = f"Payment for booking {booking.id}"
            
            platform_fee = subtotal * Decimal('0.05')  # 5% platform fee
            total_amount = subtotal + platform_fee
            
            # Create account reference
            account_reference = f"BOOKING-{booking.id}"
            
            # Initiate STK push
            stk_result = self.mpesa.initiate_stk_push(
                phone_number=phone_number,
                amount=total_amount,
                account_reference=account_reference,
                transaction_desc=transaction_desc
            )
            
            if stk_result['success']:
                # Create payment record
                payment = Payment.objects.create(
                    booking=booking,
                    client=booking.client,
                    amount=total_amount,
                    platform_fee=platform_fee,
                    payment_method='mpesa',
                    status='pending'
                )
                
                # Create M-Pesa specific record
                mpesa_payment = MpesaPayment.objects.create(
                    payment=payment,
                    phone_number=phone_number,
                    checkout_request_id=stk_result['checkout_request_id'],
                    merchant_request_id=stk_result['merchant_request_id'],
                    status='pending'
                )
                
                return {
                    'success': True,
                    'payment_id': payment.id,
                    'mpesa_payment_id': mpesa_payment.id,
                    'checkout_request_id': stk_result['checkout_request_id'],
                    'message': 'STK push sent. Please check your phone and enter M-Pesa PIN.'
                }
            else:
                return stk_result
                
        except Booking.DoesNotExist:
            return {
                'success': False,
                'error': 'Booking not found'
            }
        except Exception as e:
            logger.error(f"M-Pesa payment processing failed: {str(e)}")
            return {
                'success': False,
                'error': 'Payment processing failed'
            }
    
    def check_payment_status(self, mpesa_payment_id):
        """Check M-Pesa payment status"""
        try:
            mpesa_payment = MpesaPayment.objects.get(id=mpesa_payment_id)
            
            # Query STK status
            status_result = self.mpesa.query_stk_status(
                mpesa_payment.checkout_request_id
            )
            
            if status_result['success']:
                result_code = status_result['result_code']
                
                if result_code == '0':  # Success
                    # Update payment status
                    mpesa_payment.status = 'completed'
                    mpesa_payment.mpesa_receipt_number = status_result['data'].get('MpesaReceiptNumber', '')
                    mpesa_payment.save()
                    
                    # Update main payment
                    payment = mpesa_payment.payment
                    payment.status = 'completed'
                    payment.save()
                    
                    # Update booking
                    payment.booking.status = 'confirmed'
                    payment.booking.save()
                    
                    return {
                        'success': True,
                        'status': 'completed',
                        'receipt_number': mpesa_payment.mpesa_receipt_number
                    }
                elif result_code == '1032':  # User cancelled
                    mpesa_payment.status = 'cancelled'
                    mpesa_payment.save()
                    
                    payment = mpesa_payment.payment
                    payment.status = 'cancelled'
                    payment.save()
                    
                    return {
                        'success': True,
                        'status': 'cancelled',
                        'message': 'Payment was cancelled by user'
                    }
                else:  # Other failure codes
                    mpesa_payment.status = 'failed'
                    mpesa_payment.save()
                    
                    payment = mpesa_payment.payment
                    payment.status = 'failed'
                    payment.save()
                    
                    return {
                        'success': True,
                        'status': 'failed',
                        'message': status_result['result_desc']
                    }
            else:
                return status_result
                
        except MpesaPayment.DoesNotExist:
            return {
                'success': False,
                'error': 'M-Pesa payment not found'
            }
        except Exception as e:
            logger.error(f"M-Pesa status check failed: {str(e)}")
            return {
                'success': False,
                'error': 'Status check failed'
            }
    
    def handle_callback(self, callback_data):
        """Handle M-Pesa callback"""
        try:
            # Extract callback data
            stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            
            if not checkout_request_id:
                return {
                    'success': False,
                    'error': 'Invalid callback data'
                }
            
            # Find M-Pesa payment record
            try:
                mpesa_payment = MpesaPayment.objects.get(
                    checkout_request_id=checkout_request_id
                )
            except MpesaPayment.DoesNotExist:
                logger.error(f"M-Pesa payment not found for checkout request: {checkout_request_id}")
                return {
                    'success': False,
                    'error': 'Payment record not found'
                }
            
            # SECURITY: Verify the transaction status with M-Pesa directly
            # This prevents callback spoofing attacks
            verification = self.mpesa.query_stk_status(checkout_request_id)
            
            if not verification['success']:
                logger.warning(f"Could not verify payment status with M-Pesa: {verification.get('error')}")
                # If verification fails (e.g. network issue), we log it but might still process if critical
                # For high security, we should probably fail or mark as 'verification_needed'
                # Here we will fail to be safe
                return {
                    'success': False,
                    'error': 'Payment verification failed'
                }
                
            # Check if verification result matches success
            if verification.get('result_code') != '0':
                logger.error(f"Payment verification returned non-success: {verification.get('result_code')}")
                # If verification says failed, we treat it as failed regardless of callback content
                result_code = 1  # Force failure
                result_desc = verification.get('result_desc', 'Verification failed')

            if result_code == 0:  # Success
                # Extract transaction details
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                receipt_number = ''
                transaction_date = ''
                phone_number = ''
                
                for item in callback_metadata:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        receipt_number = item.get('Value', '')
                    elif item.get('Name') == 'TransactionDate':
                        transaction_date = item.get('Value', '')
                    elif item.get('Name') == 'PhoneNumber':
                        phone_number = item.get('Value', '')
                
                # Update M-Pesa payment
                mpesa_payment.status = 'completed'
                mpesa_payment.mpesa_receipt_number = receipt_number
                mpesa_payment.transaction_date = transaction_date
                mpesa_payment.save()
                
                # Update main payment
                payment = mpesa_payment.payment
                payment.status = 'completed'
                payment.save()
                
                # Update booking
                payment.booking.status = 'confirmed'
                payment.booking.save()
                
                logger.info(f"M-Pesa payment {mpesa_payment.id} completed successfully")
                
            else:  # Failed
                mpesa_payment.status = 'failed'
                mpesa_payment.failure_reason = result_desc
                mpesa_payment.save()
                
                # Update main payment
                payment = mpesa_payment.payment
                payment.status = 'failed'
                payment.save()
                
                logger.info(f"M-Pesa payment {mpesa_payment.id} failed: {result_desc}")
            
            return {
                'success': True,
                'message': 'Callback processed successfully'
            }
            
        except Exception as e:
            logger.error(f"M-Pesa callback processing failed: {str(e)}")
            return {
                'success': False,
                'error': 'Callback processing failed'
            }
