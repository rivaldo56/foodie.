from django.db import models
from django.core.validators import MinValueValidator
from users.models import User
from bookings.models import Booking


class Payment(models.Model):
    """Payment transactions for bookings"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
        ('partially_refunded', 'Partially Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_made')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mpesa')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # External payment provider details
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True, null=True)
    stripe_charge_id = models.CharField(max_length=200, blank=True, null=True)
    paystack_reference = models.CharField(max_length=200, blank=True, null=True)
    external_transaction_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Platform fees
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    processing_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    chef_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Metadata
    payment_metadata = models.JSONField(default=dict, blank=True)
    failure_reason = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment #{self.id} - {self.amount} {self.currency} - {self.status}"
    
    @property
    def is_successful(self):
        return self.status == 'completed'


class Refund(models.Model):
    """Refund transactions"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    REFUND_TYPE_CHOICES = [
        ('full', 'Full Refund'),
        ('partial', 'Partial Refund'),
        ('cancellation', 'Cancellation Refund'),
    ]
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='refunds')
    
    # Refund details
    refund_type = models.CharField(max_length=20, choices=REFUND_TYPE_CHOICES, default='full')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # External refund details
    stripe_refund_id = models.CharField(max_length=200, blank=True, null=True)
    external_refund_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Processing
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_refunds')
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund #{self.id} - {self.amount} - {self.status}"


class ChefPayout(models.Model):
    """Payouts to chefs"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    chef = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payouts')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chef_payouts')
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='chef_payouts')
    
    # Payout details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Bank details (encrypted in production)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_routing_number = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    
    # External payout details
    stripe_transfer_id = models.CharField(max_length=200, blank=True, null=True)
    external_payout_id = models.CharField(max_length=200, blank=True, null=True)
    
    # Processing
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payouts')
    admin_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payout #{self.id} - {self.chef.full_name} - {self.amount} {self.currency}"


class MpesaPayment(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mpesa_payment')
    phone_number = models.CharField(max_length=15)
    checkout_request_id = models.CharField(max_length=255, unique=True)
    merchant_request_id = models.CharField(max_length=255)
    mpesa_receipt_number = models.CharField(max_length=255, blank=True, null=True)
    transaction_date = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled'),
        ],
        default='pending'
    )
    failure_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"M-Pesa Payment {self.checkout_request_id} - {self.status}"
