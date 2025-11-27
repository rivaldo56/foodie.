from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from bookings.models import Booking, MenuItem, BookingMenuItem
from chefs.models import ChefProfile

User = get_user_model()

class BookingLifecycleTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.client_user = User.objects.create_user(
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
        
        # Create chef profile
        self.chef_profile = ChefProfile.objects.create(
            user=self.chef_user,
            bio='Test Chef',
            hourly_rate=Decimal('50.00'),
            is_available=True
        )
        
        # Create menu item
        self.menu_item = MenuItem.objects.create(
            chef=self.chef_profile,
            name='Test Dish',
            category='main_course',
            price_per_serving=Decimal('25.00'),
            preparation_time=30,
            is_available=True
        )
        
        self.client.force_authenticate(user=self.client_user)
        
    def test_create_regular_booking(self):
        """Test creating a regular booking"""
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=7)
        
        data = {
            'chef_id': self.chef_profile.id,
            'service_type': 'personal_meal',
            'booking_date': future_date.isoformat(),
            'duration_hours': 2,
            'number_of_guests': 2,
            'service_address': '123 Test St',
            'service_city': 'Test City',
            'service_state': 'Test State',
            'service_zip_code': '12345',
            'menu_items': [
                {'menu_item_id': self.menu_item.id, 'quantity': 2}
            ]
        }
        
        response = self.client.post('/api/bookings/create/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Booking.objects.count(), 1)
        
        booking = Booking.objects.first()
        self.assertEqual(booking.status, 'pending')
        self.assertFalse(booking.is_priority)
        # Base (50*2=100) + Menu (25*2=50) = 150.00
        self.assertEqual(booking.total_amount, Decimal('150.00'))

    def test_create_priority_booking(self):
        """Test creating a priority booking with down payment"""
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=7)
        
        data = {
            'chef_id': self.chef_profile.id,
            'service_type': 'personal_meal',
            'booking_date': future_date.isoformat(),
            'duration_hours': 2,
            'number_of_guests': 2,
            'service_address': '123 Test St',
            'service_city': 'Test City',
            'service_state': 'Test State',
            'service_zip_code': '12345',
            'menu_items': [
                {'menu_item_id': self.menu_item.id, 'quantity': 2}
            ],
            'is_priority': True,
            'down_payment_amount': '20.00'
        }
        
        response = self.client.post('/api/bookings/create/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        booking = Booking.objects.first()
        self.assertTrue(booking.is_priority)
        self.assertEqual(booking.down_payment_amount, Decimal('20.00'))
        self.assertEqual(booking.status, 'pending')

    def test_cancel_booking(self):
        """Test cancelling a booking"""
        from django.utils import timezone
        from datetime import timedelta
        future_date = timezone.now() + timedelta(days=7)
        
        booking = Booking.objects.create(
            client=self.client_user,
            chef=self.chef_profile,
            booking_date=future_date,
            base_price=Decimal('50.00'),
            total_amount=Decimal('50.00'),
            service_address='Test',
            service_city='Test',
            service_state='Test',
            service_zip_code='12345'
        )
        
        response = self.client.patch(f'/api/bookings/{booking.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'cancelled')
