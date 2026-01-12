from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q, F
from django.utils import timezone
from .models import Ingredient, KitchenInventory, MealSession
from .serializers import (
    IngredientSerializer, 
    KitchenInventorySerializer, 
    MealSessionSerializer
)
from recipes.models import Recipe

class InventoryViewSet(viewsets.ModelViewSet):
    """
    Manage user's kitchen inventory.
    """
    serializer_class = KitchenInventorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return KitchenInventory.objects.filter(user=self.request.user).select_related('ingredient')

    def perform_create(self, serializer):
        # Handle duplicate ingredient add -> update quantity instead
        ingredient = serializer.validated_data['ingredient']
        existing = KitchenInventory.objects.filter(
            user=self.request.user, 
            ingredient=ingredient
        ).first()
        
        if existing:
            # Add to existing quantity
            existing.quantity = F('quantity') + serializer.validated_data.get('quantity', 0)
            existing.save()
            # We don't save the new serializer, just return the updated one
            # But standard perform_create doesn't return response. 
            # So simpler to rely on unique_together constraint error or handle in create()
            # For simplicity here, we'll let unique constraint fail if client doesn't check,
            # or improved client logic. But let's support "upsert" logic in create().
            pass 
        else:
            serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        # Custom Upsert Logic
        ingredient_id = request.data.get('ingredient')
        quantity = float(request.data.get('quantity', 0))
        
        existing = KitchenInventory.objects.filter(
            user=request.user, 
            ingredient_id=ingredient_id
        ).first()
        
        if existing:
            existing.quantity = float(existing.quantity) + quantity
            existing.save()
            serializer = self.get_serializer(existing)
            return Response(serializer.data)
        
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Bulk update inventory (e.g. from receipt scan).
        Expects: { "items": [ {"name": "Eggs", "qty": 12}, ... ] }
        or IDs.
        """
        # simplified placeholder
        return Response({"status": "synced"}, status=status.HTTP_200_OK)


class RecommendationView(views.APIView):
    """
    The 'Quick 30' and 'What to Cook' Engine.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        time_limit = request.query_params.get('time_limit') # e.g. 30
        
        # 1. Get User Inventory IDs
        user_inventory_ids = set(
            KitchenInventory.objects.filter(user=user)
            .values_list('ingredient_id', flat=True)
        )
        
        # 2. Filter Recipes
        recipes = Recipe.objects.select_related('category', 'chef').prefetch_related('ingredients')
        
        if time_limit:
            recipes = recipes.filter(
                Q(total_time_minutes__lte=int(time_limit)) | 
                Q(total_time_minutes__isnull=True)
            )
            
        # 3. Score Recipes
        results = []
        for recipe in recipes:
            recipe_ingredients = recipe.ingredients.exclude(ingredient__isnull=True)
            total_ingredients = recipe_ingredients.count()
            
            if total_ingredients == 0:
                # If recipe has no structured ingredients, give it a base score if simple
                match_score = 50 
                missing = []
            else:
                required_ids = set(ri.ingredient_id for ri in recipe_ingredients)
                
                # Intersect
                # Note: Smart substitution logic would be here (checking substitutions M2M)
                # For MVP: Direct match
                matches = required_ids.intersection(user_inventory_ids)
                match_count = len(matches)
                match_percentage = (match_count / total_ingredients) * 100
                
                match_score = match_percentage
                
                # Identify missing
                missing_ids = required_ids - user_inventory_ids
                # We would need to fetch names for missing
                # Optimization: do this only for top N results
                missing = list(missing_ids) # simplified

            results.append({
                "id": recipe.id,
                "title": recipe.title,
                "match_score": round(match_score, 1),
                "total_time": recipe.total_time_minutes,
                "missing_ingredients_count": len(missing) if 'missing' in locals() else 0,
                "image_url": recipe.image_url
            })
            
        # Sort by score desc
        results.sort(key=lambda x: x['match_score'], reverse=True)
        
        return Response(results[:10])

