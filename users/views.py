from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import User, ClientProfile
from .permissions import IsClient, IsChef
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    ClientProfileSerializer, ClientProfileCreateUpdateSerializer,
    UserUpdateSerializer, PasswordChangeSerializer
)

# Import models at module level to avoid circular imports inside functions
# We use string references where possible, but for dashboard we need to query
from bookings.models import Booking
from chefs.models import ChefProfile


class UserRegistrationView(generics.CreateAPIView):
    """User registration endpoint"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create token for the user
        token, created = Token.objects.get_or_create(user=user)
        
        # Create client profile if user is a client
        if user.role == 'client':
            ClientProfile.objects.create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class UserLoginView(generics.GenericAPIView):
    """User login endpoint"""
    serializer_class = UserLoginSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view and update"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class ClientProfileView(generics.RetrieveUpdateAPIView):
    """Client profile view and update"""
    permission_classes = [permissions.IsAuthenticated, IsClient]
    
    def get_object(self):
        profile, created = ClientProfile.objects.get_or_create(user=self.request.user)
        return profile
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClientProfileSerializer
        return ClientProfileCreateUpdateSerializer


class PasswordChangeView(generics.GenericAPIView):
    """Change user password"""
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout endpoint"""
    try:
        token = Token.objects.get(user=request.user)
        token.delete()
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)
    except Token.DoesNotExist:
        return Response({
            'message': 'Token not found'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """User dashboard with basic stats"""
    user = request.user
    
    if user.role == 'client':
        # Client dashboard data
        bookings = Booking.objects.filter(client=user)
        
        dashboard_data = {
            'user': UserSerializer(user).data,
            'stats': {
                'total_bookings': bookings.count(),
                'pending_bookings': bookings.filter(status='pending').count(),
                'completed_bookings': bookings.filter(status='completed').count(),
                'upcoming_bookings': bookings.filter(
                    status__in=['confirmed', 'in_progress']
                ).count(),
            },
            'recent_bookings': []  # Add recent bookings serializer data
        }
        
    elif user.role == 'chef':
        # Chef dashboard data
        try:
            chef_profile = ChefProfile.objects.get(user=user)
            bookings = chef_profile.bookings.all()
            
            dashboard_data = {
                'user': UserSerializer(user).data,
                'chef_profile': {
                    'id': chef_profile.id,
                    'average_rating': chef_profile.average_rating,
                    'total_reviews': chef_profile.total_reviews,
                    'is_verified': chef_profile.is_verified,
                },
                'stats': {
                    'total_bookings': bookings.count(),
                    'pending_bookings': bookings.filter(status='pending').count(),
                    'completed_bookings': bookings.filter(status='completed').count(),
                    'monthly_earnings': 0,  # Calculate monthly earnings
                },
                'recent_bookings': []  # Add recent bookings serializer data
            }
        except ChefProfile.DoesNotExist:
            dashboard_data = {
                'user': UserSerializer(user).data,
                'message': 'Chef profile not found. Please complete your profile setup.'
            }
    
    else:
        # Admin dashboard data
        dashboard_data = {
            'user': UserSerializer(user).data,
            'stats': {
                'total_users': User.objects.count(),
                'total_chefs': User.objects.filter(role='chef').count(),
                'total_clients': User.objects.filter(role='client').count(),
            }
        }
    
    return Response(dashboard_data, status=status.HTTP_200_OK)
