"""
TikTok-Style Recommendation Algorithm for Foodie
Uses collaborative filtering, content-based filtering, and user behavior tracking
"""
from django.db.models import Count, Q, F, Avg
from django.contrib.contenttypes.models import ContentType
from collections import defaultdict
import math
from datetime import timedelta
from django.utils import timezone


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
        
        Args:
            content_type: 'chef' or 'meal'
            limit: Number of recommendations
        
        Returns:
            List of recommended items with scores
        """
        if content_type == 'chef':
            return self._get_chef_recommendations(limit)
        else:
            return self._get_meal_recommendations(limit)
    
    def _get_chef_recommendations(self, limit):
        """Get personalized chef recommendations"""
        from chefs.models import ChefProfile, FavoriteChef
        from bookings.models import Booking
        from ai.models import UserInteraction
        
        # Get user's interaction history
        user_favorites = set(FavoriteChef.objects.filter(
            user=self.user
        ).values_list('chef_id', flat=True))
        
        user_bookings = set(Booking.objects.filter(
            client=self.user
        ).values_list('chef_id', flat=True))
        
        # Get all chefs
        all_chefs = ChefProfile.objects.filter(is_available=True)
        
        # Exclude already interacted chefs (for discovery)
        exclude_ids = user_favorites.union(user_bookings)
        candidate_chefs = all_chefs.exclude(id__in=exclude_ids)
        
        # Calculate scores for each chef
        scored_chefs = []
        
        for chef in candidate_chefs:
            score = 0.0
            
            # 1. Collaborative Filtering Score
            collab_score = self._collaborative_filtering_score(chef, user_favorites, user_bookings)
            score += collab_score * self.weights['collaborative']
            
            # 2. Content-Based Score
            content_score = self._content_based_score_chef(chef)
            score += content_score * self.weights['content_based']
            
            # 3. Popularity Score
            popularity_score = self._popularity_score_chef(chef)
            score += popularity_score * self.weights['popularity']
            
            # 4. Recency Score
            recency_score = self._recency_score(chef.created_at)
            score += recency_score * self.weights['recency']
            
            # 5. Diversity Score (based on specialties)
            diversity_score = self._diversity_score_chef(chef, scored_chefs)
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
        
        # Sort by score and return top N
        scored_chefs.sort(key=lambda x: x['score'], reverse=True)
        return scored_chefs[:limit]
    
    def _collaborative_filtering_score(self, chef, user_favorites, user_bookings):
        """
        Find users similar to current user and see what they liked
        "Users who liked chefs you liked also liked this chef"
        """
        from chefs.models import FavoriteChef
        from bookings.models import Booking
        
        if not user_favorites and not user_bookings:
            return 0.5  # Neutral score for new users
        
        # Find users who favorited/booked same chefs as current user
        similar_users = set()
        
        if user_favorites:
            similar_users.update(
                FavoriteChef.objects.filter(
                    chef_id__in=user_favorites
                ).exclude(user=self.user).values_list('user_id', flat=True)
            )
        
        if user_bookings:
            similar_users.update(
                Booking.objects.filter(
                    chef_id__in=user_bookings
                ).exclude(client=self.user).values_list('client_id', flat=True)
            )
        
        if not similar_users:
            return 0.5
        
        # Count how many similar users interacted with this chef
        interactions = FavoriteChef.objects.filter(
            chef=chef,
            user_id__in=similar_users
        ).count()
        
        interactions += Booking.objects.filter(
            chef=chef,
            client_id__in=similar_users
        ).count()
        
        # Normalize score (0-1)
        max_possible = len(similar_users)
        return min(interactions / max(max_possible, 1), 1.0)
    
    def _content_based_score_chef(self, chef):
        """
        Score based on chef attributes matching user preferences
        """
        from ai.models import UserPreferenceLearning
        
        try:
            user_prefs = UserPreferenceLearning.objects.get(user=self.user)
            preferred_cuisines = user_prefs.preferred_cuisines or []
            preferred_price_range = user_prefs.preferred_price_range or {}
        except:
            return 0.5  # Neutral for new users
        
        score = 0.0
        
        # Match specialties with preferred cuisines
        if preferred_cuisines and chef.specialties:
            matches = len(set(chef.specialties) & set(preferred_cuisines))
            score += min(matches / len(preferred_cuisines), 1.0) * 0.6
        
        # Match price range
        if preferred_price_range:
            min_price = preferred_price_range.get('min', 0)
            max_price = preferred_price_range.get('max', float('inf'))
            
            if min_price <= chef.hourly_rate <= max_price:
                score += 0.4
        
        return min(score, 1.0)
    
    def _popularity_score_chef(self, chef):
        """
        Score based on chef popularity (ratings, bookings, favorites)
        """
        # Normalize rating (0-5 to 0-1)
        rating_score = float(chef.average_rating) / 5.0
        
        # Normalize bookings (log scale to prevent outliers)
        booking_score = math.log(chef.total_bookings + 1) / math.log(100)
        booking_score = min(booking_score, 1.0)
        
        # Combine
        return (rating_score * 0.6) + (booking_score * 0.4)
    
    def _recency_score(self, created_at):
        """
        Boost newer content (TikTok-style)
        """
        now = timezone.now()
        age_days = (now - created_at).days
        
        # Exponential decay: newer = higher score
        # 0 days = 1.0, 30 days = 0.5, 90 days = 0.1
        return math.exp(-age_days / 30.0)
    
    def _diversity_score_chef(self, chef, already_scored):
        """
        Promote diversity in recommendations
        Penalize if too many similar chefs already in feed
        """
        if not already_scored:
            return 1.0
        
        # Count how many chefs with overlapping specialties
        similar_count = 0
        for item in already_scored[-5:]:  # Check last 5
            other_chef = item['chef']
            if chef.specialties and other_chef.specialties:
                overlap = len(set(chef.specialties) & set(other_chef.specialties))
                if overlap > 0:
                    similar_count += 1
        
        # Penalize if too similar
        return max(1.0 - (similar_count * 0.2), 0.0)
    
    def _get_meal_recommendations(self, limit):
        """Get personalized meal recommendations"""
        from bookings.models import MenuItem
        
        # Similar logic to chefs but for meals
        # Implementation would follow same pattern
        pass
    
    def track_interaction(self, content_type, content_id, interaction_type):
        """
        Track user interactions for learning
        
        Args:
            content_type: 'chef' or 'meal'
            content_id: ID of the content
            interaction_type: 'view', 'like', 'book', 'share'
        """
        from ai.models import UserInteraction
        
        # Weight different interactions
        weights = {
            'view': 1,
            'like': 3,
            'book': 5,
            'share': 4
        }
        
        UserInteraction.objects.create(
            user=self.user,
            content_type=content_type,
            content_id=content_id,
            interaction_type=interaction_type,
            weight=weights.get(interaction_type, 1)
        )
        
        # Update user preferences based on interaction
        self._update_user_preferences(content_type, content_id, interaction_type)
    
    def _update_user_preferences(self, content_type, content_id, interaction_type):
        """
        Learn from user behavior and update preferences
        """
        from ai.models import UserPreferenceLearning
        from chefs.models import ChefProfile
        
        user_prefs, created = UserPreferenceLearning.objects.get_or_create(
            user=self.user
        )
        
        if content_type == 'chef':
            try:
                chef = ChefProfile.objects.get(id=content_id)
                
                # Update preferred cuisines
                current_cuisines = user_prefs.preferred_cuisines or []
                for specialty in chef.specialties:
                    if specialty not in current_cuisines:
                        current_cuisines.append(specialty)
                
                user_prefs.preferred_cuisines = current_cuisines
                
                # Update price range
                current_range = user_prefs.preferred_price_range or {}
                rate = float(chef.hourly_rate)
                
                if 'min' not in current_range or rate < current_range['min']:
                    current_range['min'] = rate
                if 'max' not in current_range or rate > current_range['max']:
                    current_range['max'] = rate
                
                user_prefs.preferred_price_range = current_range
                user_prefs.save()
                
            except ChefProfile.DoesNotExist:
                pass


class TrendingCalculator:
    """Calculate trending chefs/meals (TikTok-style viral detection)"""
    
    @staticmethod
    def get_trending_chefs(limit=10):
        """
        Get trending chefs based on recent engagement velocity
        """
        from chefs.models import ChefProfile
        from bookings.models import Booking
        from ai.models import UserInteraction
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        trending_scores = []
        
        for chef in ChefProfile.objects.filter(is_available=True):
            # Recent bookings
            recent_bookings = Booking.objects.filter(
                chef=chef,
                created_at__gte=last_24h
            ).count()
            
            # Recent interactions
            recent_interactions = UserInteraction.objects.filter(
                content_type='chef',
                content_id=chef.id,
                created_at__gte=last_24h
            ).count()
            
            # Historical baseline (7 days)
            historical_bookings = Booking.objects.filter(
                chef=chef,
                created_at__gte=last_7d,
                created_at__lt=last_24h
            ).count() / 7  # Daily average
            
            # Calculate velocity (growth rate)
            if historical_bookings > 0:
                velocity = (recent_bookings - historical_bookings) / historical_bookings
            else:
                velocity = recent_bookings  # New chef with activity
            
            # Combine metrics
            trending_score = (
                recent_bookings * 2 +
                recent_interactions +
                velocity * 10
            )
            
            if trending_score > 0:
                trending_scores.append({
                    'chef': chef,
                    'score': trending_score,
                    'recent_bookings': recent_bookings,
                    'velocity': velocity
                })
        
        # Sort by trending score
        trending_scores.sort(key=lambda x: x['score'], reverse=True)
        return trending_scores[:limit]
