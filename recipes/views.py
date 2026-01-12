from rest_framework import generics, status, filters, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Recipe, RecipeCategory
from .serializers import RecipeSerializer, RecipeCategorySerializer, RecipeDetailSerializer

class RecipeFeedView(APIView):
    """
    Returns time-aware and mood-aware recipe feed.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now_hour = timezone.now().hour
        
        # Determine time of day
        if 5 <= now_hour < 11:
            time_context = 'morning'
            greeting = "Good Morning"
        elif 11 <= now_hour < 16:
            time_context = 'afternoon'
            greeting = "Good Afternoon"
        else:
            time_context = 'evening'
            greeting = "Good Evening"
            
        # 1. Get Primary Category for this time
        primary_categories = RecipeCategory.objects.filter(time_of_day=time_context, is_active=True)
        # If no specific time match, fall back to 'any' or mixed
        if not primary_categories.exists():
            primary_categories = RecipeCategory.objects.filter(is_active=True).order_by('?')[:2]
            
        feed_sections = []
        
        # Add primary time-based sections
        for cat in primary_categories:
            recipes = Recipe.objects.filter(category=cat, is_published=True).order_by('?')[:6]
            if recipes.exists():
                feed_sections.append({
                    'type': 'category_row',
                    'title': f'{greeting} Picks: {cat.name}',
                    'category_slug': cat.slug,
                    'recipes': RecipeSerializer(recipes, many=True).data
                })
                
        # Add "Trending Now" (Random for now, could be views based)
        trending = Recipe.objects.filter(is_published=True).order_by('?')[:10]
        if trending.exists():
             feed_sections.append({
                'type': 'carousel',
                'title': 'Trending Now',
                'category_slug': 'trending',
                'recipes': RecipeSerializer(trending, many=True).data
            })

        # Add "Quick & Easy" fallback
        quick = Recipe.objects.filter(category__slug='quick-30', is_published=True)[:6]
        if quick.exists():
            feed_sections.append({
                'type': 'grid',
                'title': 'Quick & Easy',
                'category_slug': 'quick-30',
                'recipes': RecipeSerializer(quick, many=True).data
            })
            
        return Response({
            'greeting': greeting,
            'time_context': time_context,
            'sections': feed_sections
        })

class CategoryListView(generics.ListAPIView):
    queryset = RecipeCategory.objects.filter(is_active=True).order_by('display_order')
    serializer_class = RecipeCategorySerializer
    permission_classes = [permissions.AllowAny]

class RecipeListView(generics.ListAPIView):
    queryset = Recipe.objects.filter(is_published=True).order_by('-created_at')
    serializer_class = RecipeSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'ingredients__name', 'category__name']

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slug = self.request.query_params.get('category')
        if category_slug and category_slug != 'all':
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

class RecipeDetailView(generics.RetrieveAPIView):
    queryset = Recipe.objects.filter(is_published=True)
    serializer_class = RecipeDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
