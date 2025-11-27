from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from users.permissions import IsChef, IsClient
from .models import ChefProfile, ChefCertification, ChefReview, FavoriteChef, ChefEvent
from .serializers import (
    ChefProfileSerializer, ChefCertificationSerializer, ChefReviewSerializer,
    FavoriteChefSerializer, ChefEventSerializer
)
from bookings.models import MenuItem
from bookings.serializers import MenuItemSerializer


class ChefListView(generics.ListAPIView):
    """List all chefs"""
    queryset = ChefProfile.objects.all()
    serializer_class = ChefProfileSerializer
    permission_classes = [permissions.AllowAny]


class ChefSearchView(generics.ListAPIView):
    """Search chefs with filters"""
    serializer_class = ChefProfileSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        # TODO: Implement search logic
        return ChefProfile.objects.all()


class ChefDetailView(generics.RetrieveAPIView):
    """Chef detail view"""
    queryset = ChefProfile.objects.all()
    serializer_class = ChefProfileSerializer
    permission_classes = [permissions.AllowAny]


class ChefProfileView(generics.RetrieveUpdateAPIView):
    """Chef profile management"""
    serializer_class = ChefProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsChef]
    
    def get_object(self):
        profile, created = ChefProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def update(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        logger.info(f"Received update request with data: {request.data}")
        
        # Handle profile_picture update on User model
        if 'profile_picture' in request.data:
            user = request.user
            profile_picture_url = request.data.get('profile_picture')
            logger.info(f"Updating user profile_picture to: {profile_picture_url}")
            user.profile_picture = profile_picture_url
            user.save()
            logger.info(f"User profile_picture saved successfully")
        
        # Handle bio update on ChefProfile
        if 'bio' in request.data:
            instance.bio = request.data.get('bio')
            instance.save()
            logger.info(f"ChefProfile bio updated: {instance.bio}")
        
        # Return updated serializer data
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ChefReviewListView(generics.ListAPIView):
    """List chef reviews"""
    serializer_class = ChefReviewSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        chef_id = self.kwargs['chef_id']
        return ChefReview.objects.filter(chef_id=chef_id)


class ChefReviewCreateView(generics.CreateAPIView):
    """Create chef review"""
    serializer_class = ChefReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsClient]


class ChefReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Chef review detail"""
    queryset = ChefReview.objects.all()
    serializer_class = ChefReviewSerializer
    permission_classes = [permissions.IsAuthenticated]


class ChefCertificationListView(generics.ListAPIView):
    """List chef certifications"""
    serializer_class = ChefCertificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsChef]
    
    def get_queryset(self):
        return ChefCertification.objects.filter(chef__user=self.request.user)


class ChefCertificationCreateView(generics.CreateAPIView):
    """Create chef certification"""
    serializer_class = ChefCertificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsChef]


class ChefCertificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Chef certification detail"""
    serializer_class = ChefCertificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsChef]
    
    def get_queryset(self):
        return ChefCertification.objects.filter(chef__user=self.request.user)


class MenuItemListView(generics.ListAPIView):
    """List menu items"""
    permission_classes = [permissions.AllowAny]
    serializer_class = MenuItemSerializer
    
    def get_queryset(self):
        return MenuItem.objects.all()


class MenuItemCreateView(generics.CreateAPIView):
    """Create menu item"""
    permission_classes = [permissions.IsAuthenticated, IsChef]
    serializer_class = MenuItemSerializer


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Menu item detail"""
    permission_classes = [permissions.IsAuthenticated, IsChef]
    serializer_class = MenuItemSerializer
    
    def get_queryset(self):
        return MenuItem.objects.filter(chef__user=self.request.user)


class FavoriteChefToggleView(generics.GenericAPIView):
    """Toggle favorite status for a chef"""
    permission_classes = [permissions.IsAuthenticated, IsClient]
    
    def post(self, request, chef_id):
        chef = get_object_or_404(ChefProfile, id=chef_id)
        
        favorite, created = FavoriteChef.objects.get_or_create(user=request.user, chef=chef)
        
        if not created:
            favorite.delete()
            return Response({'status': 'removed', 'is_favorited': False})
            
        return Response({'status': 'added', 'is_favorited': True})


class FavoriteChefListView(generics.ListAPIView):
    """List user's favorite chefs"""
    permission_classes = [permissions.IsAuthenticated, IsClient]
    serializer_class = FavoriteChefSerializer
        
    def get_queryset(self):
        return FavoriteChef.objects.filter(user=self.request.user)


class ChefAnalyticsView(generics.GenericAPIView):
    """Get chef dashboard analytics"""
    permission_classes = [permissions.IsAuthenticated, IsChef]
    
    def get(self, request):
        # Get chef profile for authenticated user
        try:
            chef_profile = ChefProfile.objects.get(user=request.user)
        except ChefProfile.DoesNotExist:
            return Response(
                {'error': 'Chef profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Import analytics module
        from .analytics import ChefAnalytics
        
        # Get analytics data
        analytics = ChefAnalytics(chef_profile)
        data = analytics.get_dashboard_data()
        
        return Response(data, status=status.HTTP_200_OK)


class ChefEventViewSet(viewsets.ModelViewSet):
    """Manage chef personal events"""
    serializer_class = ChefEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsChef]
    
    def get_queryset(self):
        return ChefEvent.objects.filter(chef__user=self.request.user)
    
    def perform_create(self, serializer):
        chef_profile = ChefProfile.objects.get(user=self.request.user)
        serializer.save(chef=chef_profile)
