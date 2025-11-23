from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User


class ChefProfile(models.Model):
    """Extended profile for chefs"""
    
    EXPERIENCE_CHOICES = [
        ('beginner', '0-2 years'),
        ('intermediate', '3-5 years'),
        ('experienced', '6-10 years'),
        ('expert', '10+ years'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='chef_profile')
    bio = models.TextField(max_length=1000, blank=True)
    specialties = models.JSONField(default=list, blank=True)  # ['italian', 'french', 'vegan', etc.]
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_CHOICES, default='beginner')
    years_of_experience = models.PositiveIntegerField(default=0)
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    service_radius = models.PositiveIntegerField(default=10, help_text="Service radius in miles")
    
    # Location
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Verification and ratings
    is_verified = models.BooleanField(default=False)
    background_check_completed = models.BooleanField(default=False)
    average_rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0.00), MaxValueValidator(5.00)]
    )
    total_reviews = models.PositiveIntegerField(default=0)
    total_bookings = models.PositiveIntegerField(default=0)
    
    # Availability
    is_available = models.BooleanField(default=True)
    availability_schedule = models.JSONField(default=dict, blank=True)  # Weekly schedule
    
    # Portfolio
    portfolio_images = models.JSONField(default=list, blank=True)  # URLs to images
    certifications = models.JSONField(default=list, blank=True)  # Culinary certifications
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-average_rating', '-total_bookings']
    
    def __init__(self, *args, **kwargs):
        # Support experience_years as alias for years_of_experience
        if 'experience_years' in kwargs:
            kwargs['years_of_experience'] = kwargs.pop('experience_years')
        super().__init__(*args, **kwargs)
    
    def __str__(self):
        return f"Chef {self.user.full_name} - {self.experience_level}"
    
    @property
    def rating_display(self):
        return f"{self.average_rating}/5.0 ({self.total_reviews} reviews)"
    
    @property
    def experience_years(self):
        """Alias for years_of_experience to support test compatibility"""
        return self.years_of_experience
    
    @property
    def get_badge(self):
        """Calculate chef badge based on performance"""
        from bookings.models import MenuItem
        from datetime import timedelta
        from django.utils import timezone
        
        # Count dishes posted by this chef
        dish_count = MenuItem.objects.filter(chef=self).count()
        
        # Check account age
        account_age_months = (timezone.now() - self.created_at).days / 30
        
        # Badge Logic
        if dish_count >= 20 and self.average_rating >= 4.8:
            return 'michelin'  # Michelin Star
        elif dish_count >= 5 and self.average_rating >= 4.0:
            return 'rising'  # Rising Chef
        else:
            return 'new'  # New Chef


class ChefCertification(models.Model):
    """Chef certifications and credentials"""
    
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='chef_certifications')
    name = models.CharField(max_length=200)
    issuing_organization = models.CharField(max_length=200)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    certificate_image = models.ImageField(upload_to='certifications/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.chef.user.full_name} - {self.name}"


class ChefReview(models.Model):
    """Reviews for chefs"""
    
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='reviews')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chef_reviews_given')
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='review')
    
    rating = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(max_length=1000, blank=True)
    food_quality = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    professionalism = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    punctuality = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True, blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['chef', 'client', 'booking']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review for {self.chef.user.full_name} by {self.client.full_name} - {self.rating}/5"


class FavoriteChef(models.Model):
    """User's favorite chefs"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_chefs')
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'chef']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.full_name} favorites {self.chef.user.full_name}"


class ChefEvent(models.Model):
    """Personal events for chefs (e.g., vacation, prep time)"""
    
    chef = models.ForeignKey(ChefProfile, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    description = models.TextField(blank=True)
    is_all_day = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
        
    def __str__(self):
        return f"{self.chef.user.full_name} - {self.title}"
