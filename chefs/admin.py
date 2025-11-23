from django.contrib import admin
from .models import ChefProfile, ChefCertification, ChefReview, FavoriteChef


@admin.register(ChefProfile)
class ChefProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'state', 'years_of_experience', 'hourly_rate', 'average_rating', 'is_verified', 'is_available']
    list_filter = ['is_verified', 'is_available', 'experience_level', 'city']
    search_fields = ['user__full_name', 'user__email', 'city', 'state']
    readonly_fields = ['created_at', 'updated_at', 'average_rating', 'total_reviews', 'total_bookings']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Profile Details', {
            'fields': ('bio', 'specialties', 'experience_level', 'years_of_experience', 'hourly_rate')
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'zip_code', 'service_radius', 'latitude', 'longitude')
        }),
        ('Verification & Status', {
            'fields': ('is_verified', 'background_check_completed', 'is_available')
        }),
        ('Ratings & Statistics', {
            'fields': ('average_rating', 'total_reviews', 'total_bookings')
        }),
        ('Portfolio', {
            'fields': ('portfolio_images', 'certifications', 'availability_schedule'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ChefCertification)
class ChefCertificationAdmin(admin.ModelAdmin):
    list_display = ['chef', 'name', 'issuing_organization', 'issue_date', 'expiry_date', 'is_verified']
    list_filter = ['is_verified', 'issuing_organization']
    search_fields = ['chef__user__full_name', 'name', 'issuing_organization']
    date_hierarchy = 'issue_date'


@admin.register(ChefReview)
class ChefReviewAdmin(admin.ModelAdmin):
    list_display = ['chef', 'client', 'rating', 'food_quality', 'professionalism', 'punctuality', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['chef__user__full_name', 'client__full_name', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(FavoriteChef)
class FavoriteChefAdmin(admin.ModelAdmin):
    list_display = ['user', 'chef', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__full_name', 'chef__user__full_name']
    date_hierarchy = 'created_at'
