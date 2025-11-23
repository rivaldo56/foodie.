from django.db import models
from django.core.validators import MinValueValidator
from users.models import User
from chefs.models import ChefProfile


class Booking(models.Model):
    """Main booking model for chef services"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    SERVICE_TYPE_CHOICES = [
        ('personal_meal', 'Personal Meal'),
        ('event_catering', 'Event Catering'),
        ('cooking_class', 'Cooking Class'),
        ('meal_prep', 'Meal Prep'),
    ]
    
    # Core booking information
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='bookings')
    
    # Booking details
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES, default='personal_meal')
    booking_date = models.DateTimeField()
    duration_hours = models.PositiveIntegerField(default=2)
    number_of_guests = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    
    # Location
    service_address = models.TextField()
    service_city = models.CharField(max_length=100)
    service_state = models.CharField(max_length=100)
    service_zip_code = models.CharField(max_length=20)
    
    # Menu and preferences
    menu_items = models.JSONField(default=list, blank=True)  # Selected menu items
    dietary_requirements = models.JSONField(default=list, blank=True)
    special_requests = models.TextField(blank=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    additional_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status and tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    confirmation_code = models.CharField(max_length=20, unique=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    client_notes = models.TextField(blank=True)
    chef_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Booking #{self.id} - {self.client.full_name} with {self.chef.user.full_name}"
    
    def save(self, *args, **kwargs):
        if not self.confirmation_code:
            import uuid
            self.confirmation_code = str(uuid.uuid4())[:8].upper()
        super().save(*args, **kwargs)


class MenuItem(models.Model):
    """Menu items that chefs can offer"""
    
    CATEGORY_CHOICES = [
        ('appetizer', 'Appetizer'),
        ('main_course', 'Main Course'),
        ('dessert', 'Dessert'),
        ('beverage', 'Beverage'),
        ('side_dish', 'Side Dish'),
    ]
    
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='menu_items')
    name = models.CharField(max_length=200)
    description = models.TextField(max_length=500, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    price_per_serving = models.DecimalField(max_digits=8, decimal_places=2)
    preparation_time = models.PositiveIntegerField(help_text="Preparation time in minutes")
    
    # Dietary information
    is_vegetarian = models.BooleanField(default=False)
    is_vegan = models.BooleanField(default=False)
    is_gluten_free = models.BooleanField(default=False)
    is_dairy_free = models.BooleanField(default=False)
    allergens = models.JSONField(default=list, blank=True)  # ['nuts', 'shellfish', etc.]
    
    # Availability
    is_available = models.BooleanField(default=True)
    seasonal_availability = models.JSONField(default=list, blank=True)  # ['spring', 'summer', etc.]
    
    # Media
    image = models.URLField(max_length=500, blank=True, null=True)  # Cloudinary URL
    
    # Ingredients
    ingredients = models.JSONField(default=list, blank=True)  # ['ingredient1', 'ingredient2', etc.]
    
    # Fulfillment options
    delivery_available = models.BooleanField(default=True)
    pickup_available = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'name']
        
    def __str__(self):
        return f"{self.chef.user.full_name} - {self.name}"


class BookingMenuItem(models.Model):
    """Junction table for booking menu items with quantities"""
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_menu_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    special_instructions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['booking', 'menu_item']
        
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.booking.confirmation_code} - {self.menu_item.name} x{self.quantity}"
