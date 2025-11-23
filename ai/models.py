from django.db import models
from users.models import User
from chefs.models import ChefProfile
from bookings.models import Booking


class AIRecommendation(models.Model):
    """AI-powered recommendations for users"""
    
    RECOMMENDATION_TYPE_CHOICES = [
        ('chef', 'Chef Recommendation'),
        ('menu', 'Menu Recommendation'),
        ('cuisine', 'Cuisine Recommendation'),
        ('meal_plan', 'Meal Plan Recommendation'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_recommendations')
    recommendation_type = models.CharField(max_length=20, choices=RECOMMENDATION_TYPE_CHOICES)
    
    # Input data for recommendation
    user_preferences = models.JSONField(default=dict, blank=True)
    dietary_restrictions = models.JSONField(default=list, blank=True)
    budget_range = models.JSONField(default=dict, blank=True)  # {'min': 50, 'max': 200}
    occasion = models.CharField(max_length=100, blank=True)
    location = models.JSONField(default=dict, blank=True)
    
    # AI Response
    recommendations = models.JSONField(default=list, blank=True)
    confidence_score = models.FloatField(default=0.0)
    reasoning = models.TextField(blank=True)
    
    # Tracking
    is_accepted = models.BooleanField(default=False)
    feedback_rating = models.PositiveIntegerField(null=True, blank=True)  # 1-5 rating
    feedback_comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        username = self.user.username if self.user else ''
        return f"{self.recommendation_type} recommendation for {username} ({self.confidence_score})"


class ChatSession(models.Model):
    """AI chat sessions with Gemini"""
    
    SESSION_TYPE_CHOICES = [
        ('general', 'General Chat'),
        ('menu_planning', 'Menu Planning'),
        ('chef_discovery', 'Chef Discovery'),
        ('dietary_advice', 'Dietary Advice'),
        ('cooking_tips', 'Cooking Tips'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chat_sessions', null=True, blank=True)
    session_name = models.CharField(max_length=255, blank=True, null=True)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='general')
    title = models.CharField(max_length=200, blank=True)
    
    # Session context
    context_data = models.JSONField(default=dict, blank=True)
    booking_context = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    chef_context = models.ForeignKey(ChefProfile, on_delete=models.SET_NULL, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.session_name:
            return f"Chat Session: {self.session_name} - {self.user.username if self.user else 'Unknown'}"
        if self.user:
            return f"AI Chat: {self.user.full_name} - {self.session_type}"
        return "ChatSession"


class ChatMessageQuerySet(models.QuerySet):
    """Custom QuerySet to support message_type filtering"""
    def filter(self, *args, **kwargs):
        # Translate message_type to sender for filtering
        if 'message_type' in kwargs:
            kwargs['sender'] = kwargs.pop('message_type')
        return super().filter(*args, **kwargs)


class ChatMessage(models.Model):
    """Individual messages in AI chat sessions"""
    
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI Assistant'),
        ('system', 'System'),
    ]
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    
    objects = ChatMessageQuerySet.as_manager()
    
    def __init__(self, *args, **kwargs):
        # Support message/message_type as aliases for content/sender in object creation
        if 'message' in kwargs:
            kwargs['content'] = kwargs.pop('message')
        if 'message_type' in kwargs:
            kwargs['sender'] = kwargs.pop('message_type')
        super().__init__(*args, **kwargs)
    
    # AI metadata
    ai_model_version = models.CharField(max_length=50, blank=True)
    token_count = models.PositiveIntegerField(default=0)
    processing_time = models.FloatField(default=0.0)  # in seconds
    
    # Message metadata
    message_metadata = models.JSONField(default=dict, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}..."
    
    @property
    def message(self):
        """Alias for content"""
        return self.content
    
    @property
    def message_type(self):
        """Alias for sender"""
        return self.sender


class UserPreferenceLearning(models.Model):
    """Learning user preferences from interactions"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preference_learning')
    
    # Learned preferences
    preferred_cuisines = models.JSONField(default=list, blank=True)  # ['italian', 'asian', 'mexican']
    preferred_price_range = models.JSONField(default=dict, blank=True)  # {'min': 500, 'max': 5000}
    dietary_patterns = models.JSONField(default=dict, blank=True)
    price_sensitivity = models.FloatField(default=0.5)  # 0-1 scale
    booking_patterns = models.JSONField(default=dict, blank=True)
    chef_preferences = models.JSONField(default=dict, blank=True)
    
    # Learning metadata
    interaction_count = models.PositiveIntegerField(default=0)
    last_learning_update = models.DateTimeField(auto_now=True)
    confidence_level = models.FloatField(default=0.0)  # 0-1 scale
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Preferences for {self.user.full_name} (confidence: {self.confidence_level:.2f})"


class UserInteraction(models.Model):
    """Track user interactions for recommendation learning"""
    
    INTERACTION_TYPE_CHOICES = [
        ('view', 'View'),
        ('like', 'Like/Favorite'),
        ('book', 'Booking'),
        ('share', 'Share'),
        ('skip', 'Skip'),
    ]
    
    CONTENT_TYPE_CHOICES = [
        ('chef', 'Chef'),
        ('meal', 'Meal'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interactions')
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPE_CHOICES)
    content_id = models.PositiveIntegerField()
    interaction_type = models.CharField(max_length=10, choices=INTERACTION_TYPE_CHOICES)
    weight = models.PositiveIntegerField(default=1)  # Importance of interaction
    
    # Context
    session_id = models.CharField(max_length=100, blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)  # Time spent viewing
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'content_type', '-created_at']),
            models.Index(fields=['content_type', 'content_id']),
        ]
    
    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.content_type} #{self.content_id}"



class AIAnalytics(models.Model):
    """Analytics for AI performance and usage"""
    
    METRIC_TYPE_CHOICES = [
        ('recommendation_accuracy', 'Recommendation Accuracy'),
        ('user_satisfaction', 'User Satisfaction'),
        ('response_time', 'Response Time'),
        ('token_usage', 'Token Usage'),
        ('error_rate', 'Error Rate'),
    ]
    
    metric_type = models.CharField(max_length=30, choices=METRIC_TYPE_CHOICES)
    metric_value = models.FloatField()
    metric_data = models.JSONField(default=dict, blank=True)
    
    # Context
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, null=True, blank=True)
    
    recorded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.metric_type}: {self.metric_value}"
