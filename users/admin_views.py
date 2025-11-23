"""
Admin Panel Views
Platform oversight and management endpoints
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from users.models import User
from chefs.models import ChefProfile, ChefReview
from bookings.models import Booking
from decimal import Decimal


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class AdminDashboardView(generics.GenericAPIView):
    """Platform-wide analytics for admin dashboard"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=now.weekday())
        
        # User statistics
        total_users = User.objects.count()
        total_clients = User.objects.filter(role='client').count()
        total_chefs = User.objects.filter(role='chef').count()
        new_users_this_month = User.objects.filter(date_joined__gte=month_start).count()
        
        # Chef statistics
        verified_chefs = ChefProfile.objects.filter(is_verified=True).count()
        pending_verification = ChefProfile.objects.filter(is_verified=False).count()
        
        # Booking statistics
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        bookings_this_month = Booking.objects.filter(created_at__gte=month_start).count()
        
        # Revenue statistics
        total_revenue = Booking.objects.filter(
            status__in=['completed', 'confirmed']
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        month_revenue = Booking.objects.filter(
            status__in=['completed', 'confirmed'],
            created_at__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        # Average ratings
        avg_platform_rating = ChefReview.objects.aggregate(
            avg=Avg('rating')
        )['avg'] or 0
        
        # Growth metrics (last 30 days)
        thirty_days_ago = now - timedelta(days=30)
        daily_signups = []
        daily_bookings = []
        
        for i in range(30):
            day = thirty_days_ago + timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            signups = User.objects.filter(
                date_joined__gte=day_start,
                date_joined__lt=day_end
            ).count()
            
            bookings = Booking.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            
            daily_signups.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': signups
            })
            
            daily_bookings.append({
                'date': day.strftime('%Y-%m-%d'),
                'count': bookings
            })
        
        return Response({
            'users': {
                'total': total_users,
                'clients': total_clients,
                'chefs': total_chefs,
                'new_this_month': new_users_this_month,
                'daily_signups': daily_signups
            },
            'chefs': {
                'total': total_chefs,
                'verified': verified_chefs,
                'pending_verification': pending_verification
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
                'completed': completed_bookings,
                'this_month': bookings_this_month,
                'daily_bookings': daily_bookings
            },
            'revenue': {
                'total': float(total_revenue),
                'this_month': float(month_revenue)
            },
            'ratings': {
                'average_platform_rating': round(avg_platform_rating, 2)
            }
        }, status=status.HTTP_200_OK)


class AdminUserListView(generics.GenericAPIView):
    """List and manage users"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        search = request.query_params.get('search', '')
        role = request.query_params.get('role', '')
        
        users = User.objects.all()
        
        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(full_name__icontains=search) |
                Q(username__icontains=search)
            )
        
        if role:
            users = users.filter(role=role)
        
        users_data = [{
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'username': user.username,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None
        } for user in users[:100]]  # Limit to 100 users
        
        return Response({
            'users': users_data,
            'total': users.count()
        }, status=status.HTTP_200_OK)


class AdminUserDetailView(generics.GenericAPIView):
    """Get user details and perform actions"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get user statistics
        if user.role == 'chef':
            try:
                chef_profile = ChefProfile.objects.get(user=user)
                chef_data = {
                    'is_verified': chef_profile.is_verified,
                    'average_rating': float(chef_profile.average_rating),
                    'total_bookings': chef_profile.total_bookings,
                    'hourly_rate': float(chef_profile.hourly_rate)
                }
            except ChefProfile.DoesNotExist:
                chef_data = None
        else:
            chef_data = None
        
        bookings_count = Booking.objects.filter(
            Q(client=user) | Q(chef__user=user)
        ).count()
        
        return Response({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'username': user.username,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'bookings_count': bookings_count,
            'chef_profile': chef_data
        }, status=status.HTTP_200_OK)
    
    def patch(self, request, user_id):
        """Update user (suspend/activate)"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = is_active
            user.save()
        
        return Response({
            'message': 'User updated successfully',
            'is_active': user.is_active
        }, status=status.HTTP_200_OK)


class AdminChefVerificationView(generics.GenericAPIView):
    """Verify or reject chef applications"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """List chefs pending verification"""
        pending_chefs = ChefProfile.objects.filter(is_verified=False)
        
        chefs_data = [{
            'id': chef.id,
            'user_id': chef.user.id,
            'name': chef.user.full_name,
            'email': chef.user.email,
            'experience_level': chef.experience_level,
            'years_of_experience': chef.years_of_experience,
            'specialties': chef.specialties,
            'hourly_rate': float(chef.hourly_rate),
            'created_at': chef.created_at.isoformat()
        } for chef in pending_chefs]
        
        return Response({
            'pending_chefs': chefs_data,
            'total': pending_chefs.count()
        }, status=status.HTTP_200_OK)
    
    def post(self, request, chef_id):
        """Verify or reject a chef"""
        try:
            chef = ChefProfile.objects.get(id=chef_id)
        except ChefProfile.DoesNotExist:
            return Response(
                {'error': 'Chef not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action')  # 'verify' or 'reject'
        
        if action == 'verify':
            chef.is_verified = True
            chef.save()
            return Response({
                'message': 'Chef verified successfully'
            }, status=status.HTTP_200_OK)
        elif action == 'reject':
            # In a real app, you might want to send an email or keep a record
            return Response({
                'message': 'Chef verification rejected'
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminBookingOversightView(generics.GenericAPIView):
    """Oversee and manage bookings"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        status_filter = request.query_params.get('status', '')
        
        bookings = Booking.objects.all()
        
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        
        bookings_data = [{
            'id': booking.id,
            'client': booking.client.full_name,
            'chef': booking.chef.user.full_name,
            'service_type': booking.service_type,
            'booking_date': booking.booking_date.isoformat(),
            'total_amount': float(booking.total_amount),
            'status': booking.status,
            'created_at': booking.created_at.isoformat()
        } for booking in bookings[:100]]
        
        return Response({
            'bookings': bookings_data,
            'total': bookings.count()
        }, status=status.HTTP_200_OK)
