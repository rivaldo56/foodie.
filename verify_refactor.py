import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chefconnect.settings')
django.setup()

from django.contrib.auth import get_user_model
from chefs.models import ChefProfile
from bookings.models import Booking, MenuItem
from payments.models import Payment, MpesaPayment
from ai.models import AIRecommendation

User = get_user_model()

def verify_refactor():
    print("Verifying Refactor...")

    # 1. Verify Users and Chef Profile
    print("\n1. Verifying Users and Chef Profile...")
    client_email = "test_client_refactor@example.com"
    chef_email = "test_chef_refactor@example.com"

    client, _ = User.objects.get_or_create(
        email=client_email,
        defaults={'username': 'test_client_refactor', 'role': 'client', 'first_name': 'Test', 'last_name': 'Client'}
    )
    chef_user, _ = User.objects.get_or_create(
        email=chef_email,
        defaults={'username': 'test_chef_refactor', 'role': 'chef', 'first_name': 'Test', 'last_name': 'Chef'}
    )
    
    chef_profile, _ = ChefProfile.objects.get_or_create(
        user=chef_user,
        defaults={
            'hourly_rate': 50.00,
            'experience_level': ChefProfile.ExperienceLevel.INTERMEDIATE,
            'city': 'Nairobi'
        }
    )
    print(f"   Client: {client}")
    print(f"   Chef: {chef_profile}")

    # 2. Verify Menu Item
    print("\n2. Verifying Menu Item...")
    menu_item, _ = MenuItem.objects.get_or_create(
        chef=chef_profile,
        name="Test Dish",
        defaults={'price_per_serving': 20.00, 'description': "A test dish", 'preparation_time': 30}
    )
    print(f"   Menu Item: {menu_item}")

    # 3. Verify Booking
    print("\n3. Verifying Booking...")
    booking = Booking.objects.create(
        client=client,
        chef=chef_profile,
        booking_date="2025-12-25 18:00:00",
        duration_hours=3,
        service_address="Test Location",
        service_city="Nairobi",
        service_state="Nairobi",
        service_zip_code="00100",
        base_price=100.00,
        total_amount=100.00,
        status='pending'
    )
    print(f"   Booking created: {booking}")

    # 4. Verify Payment (M-Pesa)
    print("\n4. Verifying Payment (M-Pesa)...")
    payment = Payment.objects.create(
        booking=booking,
        client=client,
        amount=100.00,
        payment_method=Payment.PaymentMethod.MPESA,
        status=Payment.Status.PENDING
    )
    print(f"   Payment created: {payment}")

    mpesa_payment = MpesaPayment.objects.create(
        payment=payment,
        phone_number="254712345678",
        checkout_request_id="ws_CO_DMZ_123456789",
        merchant_request_id="12345-67890-1",
        status=MpesaPayment.Status.PENDING
    )
    print(f"   M-Pesa Payment created: {mpesa_payment}")

    # 5. Verify AI Recommendation Model
    print("\n5. Verifying AI Recommendation Model...")
    recommendation = AIRecommendation.objects.create(
        user=client,
        recommendation_type='chef',
        user_preferences={'cuisine': 'Italian'},
        recommendations=[{'chef_id': chef_profile.id, 'score': 0.9}]
    )
    print(f"   AI Recommendation created: {recommendation}")

    # 6. Verify Farmer and Market
    print("\n6. Verifying Farmer and Market...")
    from farmers.models import FarmerProfile, FarmProduct
    from market.models import IngredientOrder, OrderItem
    
    farmer_user, _ = User.objects.get_or_create(
        email="test_farmer_refactor@example.com",
        defaults={'username': 'test_farmer_refactor', 'role': 'farmer', 'first_name': 'Test', 'last_name': 'Farmer'}
    )
    
    farmer_profile, _ = FarmerProfile.objects.get_or_create(
        user=farmer_user,
        defaults={'farm_name': "Green Acres", 'location': "Nairobi"}
    )
    print(f"   Farmer: {farmer_profile}")
    
    product, _ = FarmProduct.objects.get_or_create(
        farmer=farmer_profile,
        name="Organic Tomatoes",
        defaults={
            'category': FarmProduct.Category.VEGETABLE,
            'price_per_unit': 5.00,
            'unit': FarmProduct.Unit.KILOGRAM,
            'quantity_available': 100.00
        }
    )
    print(f"   Product: {product}")
    
    order = IngredientOrder.objects.create(
        buyer=client,
        total_amount=10.00,
        status=IngredientOrder.Status.PENDING
    )
    
    order_item = OrderItem.objects.create(
        order=order,
        product=product,
        quantity=2.00,
        price_at_purchase=product.price_per_unit
    )
    print(f"   Order created: {order}")
    print(f"   Order Item: {order_item}")

    print("\nVerification Complete!")

if __name__ == "__main__":
    try:
        verify_refactor()
    except Exception as e:
        print(f"\nERROR: Verification failed: {e}")
        import traceback
        traceback.print_exc()
