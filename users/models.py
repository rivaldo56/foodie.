from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator


class User(AbstractUser):
    """Custom User model with role-based authentication"""
    
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('chef', 'Chef'),
        ('admin', 'Admin'),
    ]
    
    email = models.EmailField(unique=True)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(validators=[phone_regex], max_length=17, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    is_verified = models.BooleanField(default=False)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    def __str__(self):
        return f"{self.email} ({self.role})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class ClientProfile(models.Model):
    """Extended profile for clients"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='client_profile')
    dietary_preferences = models.JSONField(default=list, blank=True)  # ['vegetarian', 'gluten-free', etc.]
    allergies = models.JSONField(default=list, blank=True)  # ['nuts', 'dairy', etc.]
    preferred_cuisines = models.JSONField(default=list, blank=True)  # ['italian', 'asian', etc.]
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=17, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Client Profile - {self.user.full_name}"
