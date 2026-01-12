from rest_framework import serializers
from .models import Recipe, RecipeCategory, RecipeIngredient, RecipeInstruction

class RecipeCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeCategory
        fields = ['id', 'name', 'slug', 'icon', 'description', 'time_of_day', 'mood_tags']

class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['name', 'amount', 'notes']

class RecipeInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeInstruction
        fields = ['step_number', 'instruction_text']

class RecipeSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for feed/lists.
    """
    category = RecipeCategorySerializer(read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'slug', 'description', 
            'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes',
            'difficulty', 'image_url', 'category', 'likes_count'
        ]

class RecipeDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single recipe view.
    """
    category = RecipeCategorySerializer(read_only=True)
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    instructions = RecipeInstructionSerializer(many=True, read_only=True)
    chef_name = serializers.CharField(source='chef.user.full_name', read_only=True)
    chef_image = serializers.CharField(source='chef.user.profile_picture', read_only=True)
    
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'slug', 'description', 
            'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes',
            'difficulty', 'calories', 'servings',
            'image_url', 'video_url', 
            'category', 'ingredients', 'instructions',
            'chef', 'chef_name', 'chef_image',
            'source_name', 'source_url',
            'likes_count', 'views_count'
        ]
