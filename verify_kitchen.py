
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chefconnect.settings")
django.setup()

from django.test.utils import setup_test_environment
setup_test_environment()

from django.contrib.auth import get_user_model
from kitchen.models import Ingredient, KitchenInventory, MealSession
from recipes.models import Recipe, RecipeIngredient, RecipeCategory
from rest_framework.test import APIClient

def run_verification():
    print(">>> Setting up test data...")
    User = get_user_model()
    user, created = User.objects.get_or_create(username="testcook", email="cook@test.com")
    
    # Create Ingredients
    eggs, _ = Ingredient.objects.get_or_create(name="Eggs", category="dairy")
    flour, _ = Ingredient.objects.get_or_create(name="Flour", category="pantry")
    milk, _ = Ingredient.objects.get_or_create(name="Milk", category="dairy")
    
    # Create Recipe (Pancakes)
    cat, _ = RecipeCategory.objects.get_or_create(name="Breakfast", slug="breakfast")
    pancakes, _ = Recipe.objects.get_or_create(
        title="Fluffy Pancakes", 
        slug="fluffy-pancakes",
        prep_time_minutes=10,
        cook_time_minutes=15,
        category=cat
    )
    
    # Link ingredients
    RecipeIngredient.objects.get_or_create(recipe=pancakes, ingredient=eggs, amount="2")
    RecipeIngredient.objects.get_or_create(recipe=pancakes, ingredient=flour, amount="2 cups")
    RecipeIngredient.objects.get_or_create(recipe=pancakes, ingredient=milk, amount="1 cup")
    
    # Add to User Inventory (Missing Milk)
    KitchenInventory.objects.update_or_create(user=user, ingredient=eggs, defaults={'quantity': 6})
    KitchenInventory.objects.update_or_create(user=user, ingredient=flour, defaults={'quantity': 1})
    
    print(">>> Data created. Verifying Recommendation Engine...")
    
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Call Recommendation Endpoint
    response = client.get('/api/kitchen/recommendations/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"Recommend Response: {data}")
        
        # Verify Pancakes is in list
        found = next((r for r in data if r['title'] == "Fluffy Pancakes"), None)
        if found:
            print(f"SUCCESS: Found 'Fluffy Pancakes' with score {found['match_score']}%")
            # Should be 66.6% (2/3 ingredients)
            if 60 <= found['match_score'] <= 70:
                 print("Score is logically correct!")
            else:
                 print(f"WARNING: Score {found['match_score']} seems off. Expected ~66.6")
        else:
             print("FAILED: Pancakes not found in recommendations.")
             
    else:
        print(f"FAILED: API Error {response.status_code} - {response.content}")

if __name__ == "__main__":
    run_verification()
