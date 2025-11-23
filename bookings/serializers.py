from rest_framework import serializers
from django.utils import timezone
from .models import Booking, MenuItem, BookingMenuItem
from users.serializers import UserSerializer
from chefs.serializers import ChefProfileSerializer


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for menu items"""
    chef_name = serializers.CharField(source='chef.user.full_name', read_only=True)
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'chef', 'chef_name', 'name', 'description', 'category',
            'price_per_serving', 'preparation_time', 'is_vegetarian', 'is_vegan',
            'is_gluten_free', 'is_dairy_free', 'allergens', 'is_available',
            'seasonal_availability', 'image', 'ingredients', 'delivery_available',
            'pickup_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_price_per_serving(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price per serving must be greater than 0")
        return value
    
    def validate_preparation_time(self, value):
        if value <= 0:
            raise serializers.ValidationError("Preparation time must be greater than 0")
        return value


class BookingMenuItemSerializer(serializers.ModelSerializer):
    """Serializer for booking menu items"""
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = BookingMenuItem
        fields = [
            'id', 'menu_item', 'menu_item_id', 'quantity', 'unit_price',
            'total_price', 'special_instructions', 'created_at'
        ]
        read_only_fields = ['id', 'total_price', 'created_at']


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for bookings"""
    client = UserSerializer(read_only=True)
    chef = ChefProfileSerializer(read_only=True)
    booking_menu_items = BookingMenuItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'client', 'chef', 'service_type', 'booking_date',
            'duration_hours', 'number_of_guests', 'service_address',
            'service_city', 'service_state', 'service_zip_code',
            'menu_items', 'dietary_requirements', 'special_requests',
            'base_price', 'additional_fees', 'total_amount', 'status',
            'confirmation_code', 'client_notes', 'chef_notes',
            'booking_menu_items', 'created_at', 'updated_at',
            'confirmed_at', 'completed_at', 'cancelled_at'
        ]
        read_only_fields = [
            'id', 'confirmation_code', 'created_at', 'updated_at',
            'confirmed_at', 'completed_at', 'cancelled_at'
        ]
    
    def validate_booking_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Booking date must be in the future")
        return value
    
    def validate_number_of_guests(self, value):
        if value < 1:
            raise serializers.ValidationError("Number of guests must be at least 1")
        return value
    
    def validate_duration_hours(self, value):
        if value < 1 or value > 12:
            raise serializers.ValidationError("Duration must be between 1 and 12 hours")
        return value


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings"""
    chef_id = serializers.IntegerField(write_only=True)
    menu_items = serializers.ListField(
        child=serializers.DictField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Booking
        fields = [
            'chef_id', 'service_type', 'booking_date', 'duration_hours',
            'number_of_guests', 'service_address', 'service_city',
            'service_state', 'service_zip_code', 'dietary_requirements',
            'special_requests', 'client_notes', 'menu_items'
        ]
    
    def validate_booking_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Booking date must be in the future")
        return value
    
    def validate_chef_id(self, value):
        from chefs.models import ChefProfile
        try:
            chef = ChefProfile.objects.get(id=value)
            if not chef.is_available:
                raise serializers.ValidationError("Chef is not available")
            return value
        except ChefProfile.DoesNotExist:
            raise serializers.ValidationError("Chef not found")
    
    def create(self, validated_data):
        chef_id = validated_data.pop('chef_id')
        menu_items_data = validated_data.pop('menu_items', [])
        
        from chefs.models import ChefProfile
        chef = ChefProfile.objects.get(id=chef_id)
        
        # Calculate pricing
        base_price = chef.hourly_rate * validated_data['duration_hours']
        total_amount = base_price
        
        booking = Booking.objects.create(
            client=self.context['request'].user,
            chef=chef,
            base_price=base_price,
            total_amount=total_amount,
            **validated_data
        )
        
        # Create menu items
        for item_data in menu_items_data:
            menu_item = MenuItem.objects.get(id=item_data['menu_item_id'])
            BookingMenuItem.objects.create(
                booking=booking,
                menu_item=menu_item,
                quantity=item_data['quantity'],
                unit_price=menu_item.price_per_serving,
                special_instructions=item_data.get('special_instructions', '')
            )
        
        return booking


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating bookings"""
    
    class Meta:
        model = Booking
        fields = [
            'booking_date', 'duration_hours', 'number_of_guests',
            'dietary_requirements', 'special_requests', 'client_notes'
        ]
    
    def validate_booking_date(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError("Booking date must be in the future")
        return value
    
    def validate(self, attrs):
        booking = self.instance
        if booking.status not in ['pending', 'confirmed']:
            raise serializers.ValidationError("Cannot update booking in current status")
        return attrs


class BookingStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating booking status"""
    
    class Meta:
        model = Booking
        fields = ['status', 'chef_notes']
    
    def validate_status(self, value):
        booking = self.instance
        user = self.context['request'].user
        
        # Define allowed status transitions
        allowed_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['in_progress', 'cancelled'],
            'in_progress': ['completed', 'cancelled'],
        }
        
        if booking.status not in allowed_transitions:
            raise serializers.ValidationError("Cannot change status from current state")
        
        if value not in allowed_transitions[booking.status]:
            raise serializers.ValidationError(f"Cannot change status from {booking.status} to {value}")
        
        # Only chef can confirm or start bookings
        if value in ['confirmed', 'in_progress'] and user != booking.chef.user:
            raise serializers.ValidationError("Only the chef can perform this action")
        
        return value
