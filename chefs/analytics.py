"""
Analytics module for chef dashboard
Provides revenue, booking, and review statistics
"""
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from bookings.models import Booking
from chefs.models import ChefReview


class ChefAnalytics:
    """Calculate analytics for chef dashboard"""
    
    def __init__(self, chef_profile):
        self.chef = chef_profile
        self.now = timezone.now()
    
    def get_revenue_stats(self):
        """Calculate revenue statistics"""
        # Total revenue
        total_revenue = Booking.objects.filter(
            chef=self.chef,
            status__in=['completed', 'confirmed']
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        # This month revenue
        month_start = self.now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_revenue = Booking.objects.filter(
            chef=self.chef,
            status__in=['completed', 'confirmed'],
            created_at__gte=month_start
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        # This week revenue
        week_start = self.now - timedelta(days=self.now.weekday())
        week_revenue = Booking.objects.filter(
            chef=self.chef,
            status__in=['completed', 'confirmed'],
            created_at__gte=week_start
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        # Last 30 days daily revenue for chart
        thirty_days_ago = self.now - timedelta(days=30)
        daily_revenue = []
        
        for i in range(30):
            day = thirty_days_ago + timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            revenue = Booking.objects.filter(
                chef=self.chef,
                status__in=['completed', 'confirmed'],
                created_at__gte=day_start,
                created_at__lt=day_end
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            daily_revenue.append({
                'date': day.strftime('%Y-%m-%d'),
                'revenue': float(revenue)
            })
        
        return {
            'total_revenue': float(total_revenue),
            'month_revenue': float(month_revenue),
            'week_revenue': float(week_revenue),
            'daily_revenue': daily_revenue
        }
    
    def get_booking_stats(self):
        """Calculate booking statistics"""
        # Total bookings
        total_bookings = Booking.objects.filter(chef=self.chef).count()
        
        # Status breakdown
        pending = Booking.objects.filter(chef=self.chef, status='pending').count()
        confirmed = Booking.objects.filter(chef=self.chef, status='confirmed').count()
        completed = Booking.objects.filter(chef=self.chef, status='completed').count()
        cancelled = Booking.objects.filter(chef=self.chef, status='cancelled').count()
        
        # This month bookings
        month_start = self.now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_bookings = Booking.objects.filter(
            chef=self.chef,
            created_at__gte=month_start
        ).count()
        
        # Upcoming bookings (next 7 days)
        upcoming = Booking.objects.filter(
            chef=self.chef,
            status__in=['pending', 'confirmed'],
            booking_date__gte=self.now,
            booking_date__lte=self.now + timedelta(days=7)
        ).order_by('booking_date')[:5]
        
        upcoming_list = [{
            'id': booking.id,
            'client_name': booking.client.full_name,
            'booking_date': booking.booking_date.isoformat(),
            'service_type': booking.service_type,
            'number_of_guests': booking.number_of_guests,
            'total_amount': float(booking.total_amount),
            'status': booking.status,
            'confirmation_code': booking.confirmation_code
        } for booking in upcoming]
        
        return {
            'total_bookings': total_bookings,
            'pending': pending,
            'confirmed': confirmed,
            'completed': completed,
            'cancelled': cancelled,
            'month_bookings': month_bookings,
            'upcoming_bookings': upcoming_list
        }
    
    def get_review_stats(self):
        """Calculate review statistics"""
        reviews = ChefReview.objects.filter(chef=self.chef)
        
        # Average ratings
        avg_rating = reviews.aggregate(avg=Avg('rating'))['avg'] or 0
        avg_food_quality = reviews.aggregate(avg=Avg('food_quality'))['avg'] or 0
        avg_professionalism = reviews.aggregate(avg=Avg('professionalism'))['avg'] or 0
        avg_punctuality = reviews.aggregate(avg=Avg('punctuality'))['avg'] or 0
        
        # Total reviews
        total_reviews = reviews.count()
        
        # Rating distribution
        rating_distribution = {
            '5': reviews.filter(rating=5).count(),
            '4': reviews.filter(rating=4).count(),
            '3': reviews.filter(rating=3).count(),
            '2': reviews.filter(rating=2).count(),
            '1': reviews.filter(rating=1).count(),
        }
        
        # Recent reviews
        recent = reviews.order_by('-created_at')[:5]
        recent_list = [{
            'id': review.id,
            'client_name': review.client.full_name,
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at.isoformat(),
            'food_quality': review.food_quality,
            'professionalism': review.professionalism,
            'punctuality': review.punctuality
        } for review in recent]
        
        return {
            'average_rating': round(avg_rating, 2),
            'average_food_quality': round(avg_food_quality, 2),
            'average_professionalism': round(avg_professionalism, 2),
            'average_punctuality': round(avg_punctuality, 2),
            'total_reviews': total_reviews,
            'rating_distribution': rating_distribution,
            'recent_reviews': recent_list
        }
    
    def get_dashboard_data(self):
        """Get complete dashboard analytics"""
        return {
            'revenue': self.get_revenue_stats(),
            'bookings': self.get_booking_stats(),
            'reviews': self.get_review_stats(),
            'chef': {
                'id': self.chef.id,
                'name': self.chef.user.full_name,
                'average_rating': float(self.chef.average_rating),
                'total_bookings': self.chef.total_bookings,
                'is_verified': self.chef.is_verified
            }
        }
