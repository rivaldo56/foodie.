"""
Recommendation API Views
TikTok-style personalized feed endpoints
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .recommendation_engine import RecommendationEngine, TrendingCalculator
from .models import UserInteraction
from chefs.serializers import ChefProfileSerializer
from bookings.serializers import MenuItemSerializer


class PersonalizedFeedView(generics.GenericAPIView):
    """Get personalized feed of chefs (TikTok-style)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        content_type = request.query_params.get('type', 'chef')  # 'chef' or 'meal'
        limit = int(request.query_params.get('limit', 20))
        
        # Initialize recommendation engine
        engine = RecommendationEngine(request.user)
        
        # Get personalized recommendations
        recommendations = engine.get_personalized_feed(
            content_type=content_type,
            limit=limit
        )
        
        # Serialize results
        if content_type == 'chef':
            results = []
            for item in recommendations:
                chef_data = ChefProfileSerializer(item['chef']).data
                results.append({
                    'chef': chef_data,
                    'recommendation_score': round(item['score'], 3),
                    'score_breakdown': {
                        'collaborative': round(item['breakdown']['collaborative'], 3),
                        'content_based': round(item['breakdown']['content'], 3),
                        'popularity': round(item['breakdown']['popularity'], 3),
                        'recency': round(item['breakdown']['recency'], 3),
                        'diversity': round(item['breakdown']['diversity'], 3),
                    }
                })
            
            return Response({
                'recommendations': results,
                'total': len(results),
                'algorithm': 'hybrid_collaborative_content_based'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Meal recommendations not yet implemented'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)


class TrendingFeedView(generics.GenericAPIView):
    """Get trending chefs/meals (viral content)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        content_type = request.query_params.get('type', 'chef')
        limit = int(request.query_params.get('limit', 10))
        
        if content_type == 'chef':
            trending = TrendingCalculator.get_trending_chefs(limit=limit)
            
            results = []
            for item in trending:
                chef_data = ChefProfileSerializer(item['chef']).data
                results.append({
                    'chef': chef_data,
                    'trending_score': round(item['score'], 2),
                    'recent_bookings': item['recent_bookings'],
                    'growth_velocity': round(item['velocity'], 2),
                    'badge': '🔥' if item['score'] > 20 else '📈'
                })
            
            return Response({
                'trending': results,
                'total': len(results),
                'timeframe': 'last_24_hours'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'message': 'Meal trending not yet implemented'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)


class TrackInteractionView(generics.CreateAPIView):
    """Track user interaction for learning"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        content_type = request.data.get('content_type')  # 'chef' or 'meal'
        content_id = request.data.get('content_id')
        interaction_type = request.data.get('interaction_type')  # 'view', 'like', 'book', 'share', 'skip'
        duration = request.data.get('duration_seconds', 0)
        session_id = request.data.get('session_id', '')
        
        if not all([content_type, content_id, interaction_type]):
            return Response(
                {'error': 'content_type, content_id, and interaction_type are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Track interaction using recommendation engine
        engine = RecommendationEngine(request.user)
        engine.track_interaction(content_type, content_id, interaction_type)
        
        # Also save to database
        UserInteraction.objects.create(
            user=request.user,
            content_type=content_type,
            content_id=content_id,
            interaction_type=interaction_type,
            duration_seconds=duration,
            session_id=session_id
        )
        
        return Response({
            'message': 'Interaction tracked successfully',
            'learning_status': 'preferences_updated'
        }, status=status.HTTP_201_CREATED)


class UserPreferencesView(generics.GenericAPIView):
    """Get user's learned preferences"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        from .models import UserPreferenceLearning
        
        try:
            prefs = UserPreferenceLearning.objects.get(user=request.user)
            
            return Response({
                'preferred_cuisines': prefs.preferred_cuisines,
                'preferred_price_range': prefs.preferred_price_range,
                'dietary_patterns': prefs.dietary_patterns,
                'confidence_level': round(prefs.confidence_level, 2),
                'interaction_count': prefs.interaction_count,
                'last_updated': prefs.last_learning_update.isoformat()
            }, status=status.HTTP_200_OK)
            
        except UserPreferenceLearning.DoesNotExist:
            return Response({
                'message': 'No preferences learned yet. Start interacting with content!',
                'preferred_cuisines': [],
                'confidence_level': 0.0
            }, status=status.HTTP_200_OK)


class SimilarChefsView(generics.GenericAPIView):
    """Get chefs similar to a given chef"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, chef_id):
        from chefs.models import ChefProfile
        
        try:
            chef = ChefProfile.objects.get(id=chef_id)
        except ChefProfile.DoesNotExist:
            return Response(
                {'error': 'Chef not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find similar chefs based on specialties and attributes
        similar_chefs = ChefProfile.objects.filter(
            is_available=True,
            is_verified=True
        ).exclude(id=chef_id)
        
        # Score by specialty overlap
        scored_chefs = []
        for similar_chef in similar_chefs:
            if chef.specialties and similar_chef.specialties:
                overlap = len(set(chef.specialties) & set(similar_chef.specialties))
                if overlap > 0:
                    # Calculate similarity score
                    specialty_score = overlap / len(chef.specialties)
                    
                    # Price similarity
                    price_diff = abs(float(chef.hourly_rate) - float(similar_chef.hourly_rate))
                    price_score = 1.0 / (1.0 + price_diff / 1000)  # Normalize
                    
                    # Rating similarity
                    rating_diff = abs(float(chef.average_rating) - float(similar_chef.average_rating))
                    rating_score = 1.0 - (rating_diff / 5.0)
                    
                    # Combined score
                    total_score = (
                        specialty_score * 0.5 +
                        price_score * 0.3 +
                        rating_score * 0.2
                    )
                    
                    scored_chefs.append({
                        'chef': similar_chef,
                        'similarity_score': total_score
                    })
        
        # Sort by similarity
        scored_chefs.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Return top 5
        results = []
        for item in scored_chefs[:5]:
            chef_data = ChefProfileSerializer(item['chef']).data
            results.append({
                'chef': chef_data,
                'similarity_score': round(item['similarity_score'], 3)
            })
        
        return Response({
            'similar_chefs': results,
            'total': len(results)
        }, status=status.HTTP_200_OK)
