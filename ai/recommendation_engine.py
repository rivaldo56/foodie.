"""
TikTok-Style Recommendation Algorithm for Foodie
Uses collaborative filtering, content-based filtering, and user behavior tracking
"""
from django.db.models import Count, Q, F, Avg, Case, When, Value, FloatField
from django.contrib.contenttypes.models import ContentType
from collections import defaultdict
import math
from datetime import timedelta
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Hybrid recommendation engine combining:
    1. Collaborative Filtering (users who liked X also liked Y)
    2. Content-Based Filtering (similar chefs/meals based on attributes)
    3. Popularity-Based (trending items)
    4. Recency Bias (newer content gets boost)
    5. Diversity (avoid showing same type repeatedly)
    """
    
    def __init__(self, user):
        self.user = user
        # Weights could be moved to settings/config model
        self.weights = {
            'collaborative': 0.35,
            'content_based': 0.25,
            'popularity': 0.20,
            'recency': 0.10,
            'diversity': 0.10
        }
    
    def get_personalized_feed(self, content_type='chef', limit=20):
        """
        Get personalized feed for user
        """
        if content_type == 'chef':
            return self._get_chef_recommendations(limit)
        else:
            return self._get_meal_recommendations(limit)
    
    def _get_chef_recommendations(self, limit):
        """Get personalized chef recommendations with optimized queries"""
        from chefs.models import ChefProfile, FavoriteChef
        from bookings.models import Booking
        from ai.models import UserPreferenceLearning, UserInteraction
        
        # 1. Get User Context (Bulk Fetch)
        user_favorites = set(FavoriteChef.objects.filter(user=self.user).values_list('chef_id', flat=True))
        user_bookings = set(Booking.objects.filter(client=self.user).values_list('chef_id', flat=True))
        
        try:
            user_prefs = UserPreferenceLearning.objects.get(user=self.user)
            preferred_cuisines = set(user_prefs.preferred_cuisines or [])
            price_range = user_prefs.preferred_price_range or {}
        except UserPreferenceLearning.DoesNotExist:
            preferred_cuisines = set()
            price_range = {}

        # 2. Candidate Selection (Filter in DB, not memory)
        # Exclude already interacted chefs
        exclude_ids = user_favorites.union(user_bookings)
        
        # Fetch candidates with related data to avoid N+1
        # Limit candidate pool for performance (e.g., top 100 by rating/recency)
        candidate_chefs = ChefProfile.objects.filter(
            is_available=True
        ).exclude(
            id__in=exclude_ids
        ).select_related(
            'user'
        ).prefetch_related(
            'favorited_by',  # For collaborative filtering
            'bookings'       # For collaborative filtering
        ).order_by('-average_rating', '-created_at')[:100]  # Limit pool size
        
        # 3. Collaborative Filtering Prep (Bulk)
        # Find similar users based on shared favorites/bookings
        similar_users = set()
        if user_favorites:
            similar_users.update(
                FavoriteChef.objects.filter(chef_id__in=user_favorites)
                .exclude(user=self.user)
                .values_list('user_id', flat=True)
            )
        if user_bookings:
            similar_users.update(
                Booking.objects.filter(chef_id__in=user_bookings)
                .exclude(client=self.user)
                .values_list('client_id', flat=True)
            )
            
        # 4. Scoring Loop (In Memory, but with prefetched data)
        scored_chefs = []
        
        for chef in candidate_chefs:
            try:
                score = 0.0
                
                # A. Collaborative Score (using prefetched sets)
                collab_score = 0.5
                if similar_users:
                    # Count interactions from similar users for this chef
                    # Note: This is still Python-side iteration but on prefetched data
                    # For massive scale, this should be a separate aggregation query
                    fav_count = sum(1 for fc in chef.favorited_by.all() if fc.user_id in similar_users)
                    book_count = sum(1 for b in chef.bookings.all() if b.client_id in similar_users)
                    interactions = fav_count + book_count
                    collab_score = min(interactions / max(len(similar_users), 1), 1.0)
                
                score += collab_score * self.weights['collaborative']
                
                # B. Content-Based Score
                content_score = 0.0
                if preferred_cuisines and chef.specialties:
                    matches = len(set(chef.specialties) & preferred_cuisines)
                    content_score += min(matches / len(preferred_cuisines), 1.0) * 0.6
                
                if price_range:
                    min_p = price_range.get('min', 0)
                    max_p = price_range.get('max', float('inf'))
                    if min_p <= (chef.hourly_rate or 0) <= max_p:
                        content_score += 0.4
                
                score += content_score * self.weights['content_based']
                
                # C. Popularity Score
                rating_score = float(chef.average_rating or 0) / 5.0
                # Use cached counts if available, else len() on prefetched (careful with large sets)
                # Ideally ChefProfile should have total_bookings field maintained by signals
                booking_score = math.log((chef.total_bookings or 0) + 1) / math.log(100)
                booking_score = min(booking_score, 1.0)
                score += ((rating_score * 0.6) + (booking_score * 0.4)) * self.weights['popularity']
                
                # D. Recency Score
                age_days = (timezone.now() - chef.created_at).days
                recency_score = math.exp(-age_days / 30.0)
                score += recency_score * self.weights['recency']
                
                # E. Diversity Score
                # Simple penalty if we already selected similar chefs
                diversity_score = 1.0
                for item in scored_chefs[-5:]:
                    other = item['chef']
                    if chef.specialties and other.specialties:
                        if set(chef.specialties) & set(other.specialties):
                            diversity_score -= 0.2
                diversity_score = max(diversity_score, 0.0)
                score += diversity_score * self.weights['diversity']
                
                scored_chefs.append({
                    'chef': chef,
                    'score': score,
                    'breakdown': {
                        'collaborative': collab_score,
                        'content': content_score,
                        'popularity': popularity_score,
                        'recency': recency_score,
                        'diversity': diversity_score
                    }
                })
                
            except Exception as e:
                logger.error(f"Error scoring chef {chef.id}: {str(e)}")
                continue
        
        # Sort and return
        scored_chefs.sort(key=lambda x: x['score'], reverse=True)
        return scored_chefs[:limit]

    def _get_meal_recommendations(self, limit):
        """Get personalized meal recommendations"""
        # Placeholder for meal recommendations
        return []
    
    def track_interaction(self, content_type, content_id, interaction_type):
        """Track user interactions for learning"""
        from ai.models import UserInteraction
        
        weights = {
            'view': 1, 'like': 3, 'book': 5, 'share': 4
        }
        
        try:
            UserInteraction.objects.create(
                user=self.user,
                content_type=content_type,
                content_id=content_id,
                interaction_type=interaction_type,
                weight=weights.get(interaction_type, 1)
            )
            self._update_user_preferences(content_type, content_id, interaction_type)
        except Exception as e:
            logger.error(f"Error tracking interaction: {str(e)}")

    def _update_user_preferences(self, content_type, content_id, interaction_type):
        """Update user preferences based on interaction"""
        from ai.models import UserPreferenceLearning
        from chefs.models import ChefProfile
        
        try:
            user_prefs, _ = UserPreferenceLearning.objects.get_or_create(user=self.user)
            
            if content_type == 'chef':
                chef = ChefProfile.objects.get(id=content_id)
                
                # Update cuisines
                current = set(user_prefs.preferred_cuisines or [])
                if chef.specialties:
                    current.update(chef.specialties)
                user_prefs.preferred_cuisines = list(current)
                
                # Update price range
                rate = float(chef.hourly_rate or 0)
                current_range = user_prefs.preferred_price_range or {}
                if 'min' not in current_range or rate < current_range['min']:
                    current_range['min'] = rate
                if 'max' not in current_range or rate > current_range['max']:
                    current_range['max'] = rate
                user_prefs.preferred_price_range = current_range
                
                user_prefs.save()
                
        except Exception as e:
            logger.error(f"Error updating preferences: {str(e)}")


class TrendingCalculator:
    """Calculate trending chefs/meals"""
    
    @staticmethod
    def get_trending_chefs(limit=10):
        from chefs.models import ChefProfile
        from bookings.models import Booking
        from ai.models import UserInteraction
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        
        # Optimize: Use aggregation instead of Python loops
        # This is a simplified version; for production, use a periodic task to update "trending_score" field
        chefs = ChefProfile.objects.filter(is_available=True).annotate(
            recent_bookings=Count('booking', filter=Q(booking__created_at__gte=last_24h)),
            # Note: UserInteraction join might be expensive, careful here
        ).order_by('-recent_bookings')[:limit]
        
        results = []
        for chef in chefs:
            results.append({
                'chef': chef,
                'score': chef.recent_bookings * 10, # Simplified score
                'recent_bookings': chef.recent_bookings,
                'velocity': 0
            })
            
        return results
