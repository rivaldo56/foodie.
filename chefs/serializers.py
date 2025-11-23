from rest_framework import serializers
from .models import ChefProfile, ChefCertification, ChefReview, FavoriteChef, ChefEvent
from users.serializers import UserSerializer


class ChefProfileSerializer(serializers.ModelSerializer):
    """Serializer for chef profile"""
    user = UserSerializer(read_only=True)
    rating_display = serializers.ReadOnlyField()
    is_favorited = serializers.SerializerMethodField()
    badge = serializers.ReadOnlyField(source='get_badge')
    
    class Meta:
        model = ChefProfile
        fields = [
            'id', 'user', 'bio', 'specialties', 'experience_level', 
            'years_of_experience', 'hourly_rate', 'service_radius',
            'address', 'city', 'state', 'zip_code', 'latitude', 'longitude',
            'is_verified', 'background_check_completed', 'average_rating',
            'total_reviews', 'total_bookings', 'is_available',
            'availability_schedule', 'portfolio_images', 'certifications',
            'rating_display', 'is_favorited', 'badge', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'is_verified', 'background_check_completed', 
            'average_rating', 'total_reviews', 'total_bookings',
            'created_at', 'updated_at'
        ]

    def get_is_favorited(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user and user.is_authenticated:
            return FavoriteChef.objects.filter(user=user, chef=obj).exists()
        return False


class ChefAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for toggling chef availability"""

    class Meta:
        model = ChefProfile
        fields = ['is_available']


class ChefProfileCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating chef profile"""
    
    class Meta:
        model = ChefProfile
        fields = [
            'bio', 'specialties', 'experience_level', 'years_of_experience',
            'hourly_rate', 'service_radius', 'address', 'city', 'state',
            'zip_code', 'latitude', 'longitude', 'is_available',
            'availability_schedule', 'portfolio_images', 'certifications'
        ]
    
    def validate_hourly_rate(self, value):
        if value < 0:
            raise serializers.ValidationError("Hourly rate cannot be negative")
        return value
    
    def validate_service_radius(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError("Service radius must be between 1 and 100 miles")
        return value


class ChefCertificationSerializer(serializers.ModelSerializer):
    """Serializer for chef certifications"""
    chef_name = serializers.CharField(source='chef.user.full_name', read_only=True)
    
    class Meta:
        model = ChefCertification
        fields = [
            'id', 'chef', 'chef_name', 'name', 'issuing_organization',
            'issue_date', 'expiry_date', 'certificate_image', 'is_verified',
            'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']


class ChefReviewSerializer(serializers.ModelSerializer):
    """Serializer for chef reviews"""
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    chef_name = serializers.CharField(source='chef.user.full_name', read_only=True)
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    
    class Meta:
        model = ChefReview
        fields = [
            'id', 'chef', 'chef_name', 'client', 'client_name', 'booking',
            'booking_id', 'rating', 'comment', 'food_quality', 'professionalism',
            'punctuality', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value
    
    def validate_food_quality(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Food quality rating must be between 1 and 5")
        return value
    
    def validate_professionalism(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Professionalism rating must be between 1 and 5")
        return value
    
    def validate_punctuality(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Punctuality rating must be between 1 and 5")
        return value


class ChefSearchSerializer(serializers.Serializer):
    """Serializer for chef search parameters"""
    cuisine = serializers.ListField(child=serializers.CharField(), required=False)
    location = serializers.CharField(required=False)
    radius = serializers.IntegerField(required=False, min_value=1, max_value=100)
    min_rating = serializers.DecimalField(max_digits=3, decimal_places=2, required=False, min_value=0, max_value=5)
    max_hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, min_value=0)
    min_hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, min_value=0)
    experience_level = serializers.ChoiceField(choices=ChefProfile.EXPERIENCE_CHOICES, required=False)
    is_available = serializers.BooleanField(required=False)
    is_verified = serializers.BooleanField(required=False)


class ChefListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for chef listings"""
    user = UserSerializer(read_only=True)
    distance = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = ChefProfile
        fields = [
            'id', 'user', 'bio', 'specialties', 'experience_level',
            'hourly_rate', 'city', 'state', 'average_rating',
            'total_reviews', 'is_available', 'is_verified', 'distance'
        ]


class FavoriteChefSerializer(serializers.ModelSerializer):
    """Serializer for favorite chefs"""
    chef_detail = ChefListSerializer(source='chef', read_only=True)
    
    class Meta:
        model = FavoriteChef
        fields = ['id', 'user', 'chef', 'chef_detail', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChefEventSerializer(serializers.ModelSerializer):
    """Serializer for chef events"""
    
    class Meta:
        model = ChefEvent
        fields = [
            'id', 'chef', 'title', 'start_time', 'end_time', 
            'description', 'is_all_day', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'chef', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Check that end_time is after start_time"""
        if data['end_time'] < data['start_time']:
            raise serializers.ValidationError("End time must be after start time")
        return data
