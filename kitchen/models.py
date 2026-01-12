from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

class Ingredient(models.Model):
    """
    Global source of truth for ingredients.
    Used for standardization across recipes and user inventories.
    """
    CATEGORY_CHOICES = [
        ('produce', 'Produce'),
        ('meat', 'Meat & Poultry'),
        ('seafood', 'Seafood'),
        ('dairy', 'Dairy & Eggs'),
        ('pantry', 'Pantry & Dry Goods'),
        ('frozen', 'Frozen'),
        ('beverages', 'Beverages'),
        ('bakery', 'Bakery'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=255, unique=True, db_index=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    shelf_life_days = models.PositiveIntegerField(
        help_text="Approximate shelf life in days", 
        null=True, 
        blank=True
    )
    # Self-referential for "Lime" <-> "Lemon" substitution
    substitutions = models.ManyToManyField('self', blank=True, symmetrical=True)
    
    # Metadata
    calories_per_100g = models.PositiveIntegerField(null=True, blank=True)
    is_common = models.BooleanField(default=False, help_text="Is this a common staple?")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.name


class KitchenInventory(models.Model):
    """
    The User's digital pantry.
    Tracks what ingredients they have at home.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='inventory')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='in_kitchens')
    
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.0)
    unit = models.CharField(max_length=20, default='pcs') # g, kg, pcs, cups
    
    is_essential = models.BooleanField(default=False, help_text="Always restock this item")
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Kitchen Inventories"
        unique_together = ['user', 'ingredient']

    def __str__(self):
        return f"{self.user.username} - {self.ingredient.name} ({self.quantity} {self.unit})"


class MealSession(models.Model):
    """
    Captures the context of a cooking decision or food interaction.
    This is the core dataset for our AI recommendation engine.
    """
    SESSION_TYPE_CHOICES = [
        ('cooked', 'Cooked at Home'),
        ('booked_chef', 'Booked a Chef'),
        ('ordered', 'Ordered Ingredients'),
        ('skipped', 'Skipped/Browsed'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meal_sessions')
    
    # Can be linked to a Recipe (if cooked) or Chef (if booked)
    recipe = models.ForeignKey('recipes.Recipe', on_delete=models.SET_NULL, null=True, blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='cooked')
    
    # Context Snapshots (AI Inputs)
    time_of_day = models.CharField(max_length=20, blank=True) # e.g. "Morning"
    user_mood = models.CharField(max_length=50, blank=True)
    weather_snapshot = models.CharField(max_length=50, blank=True) # Future use
    
    # Outcome / Feedback
    was_completed = models.BooleanField(default=False)
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    difficulty_score = models.PositiveIntegerField(
        help_text="User's perceived effort (1-5)",
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    feedback_tags = models.JSONField(default=list, blank=True) # ["yummy", "too spicy", "missing ingredients"]
    
    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.session_type} on {self.timestamp.date()}"
