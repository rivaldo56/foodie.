from rest_framework import serializers
from .models import Ingredient, KitchenInventory, MealSession

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class KitchenInventorySerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = KitchenInventory
        fields = ['id', 'ingredient', 'ingredient_details', 'quantity', 'unit', 'is_essential']
        read_only_fields = ['user']

class MealSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealSession
        fields = '__all__'
        read_only_fields = ['user', 'timestamp']
