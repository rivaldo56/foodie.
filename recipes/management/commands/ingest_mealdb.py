import requests
import string
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from recipes.models import Recipe, RecipeCategory, RecipeIngredient, RecipeInstruction

class Command(BaseCommand):
    help = 'Ingest recipes from MealDB'

    def handle(self, *args, **options):
        self.stdout.write('Starting MealDB ingestion...')
        
        # 1. Create Base Categories
        categories_map = {
            'Morning': {'time': 'morning', 'moods': ['energizing', 'breakfast'], 'icon': 'sunrise'},
            'Quick 30': {'time': 'any', 'moods': ['quick', 'easy'], 'icon': 'timer'},
            'Lunch Fusion': {'time': 'afternoon', 'moods': ['fusion', 'adventurous'], 'icon': 'utensils'},
            'Comfort Bowls': {'time': 'evening', 'moods': ['comfort', 'warm'], 'icon': 'soup'},
            'Light Dinners': {'time': 'evening', 'moods': ['light', 'healthy'], 'icon': 'leaf'},
            'Sweet Treats': {'time': 'evening', 'moods': ['sweet', 'dessert'], 'icon': 'cake'},
        }
        
        db_categories = {}
        for name, data in categories_map.items():
            cat, created = RecipeCategory.objects.get_or_create(
                slug=slugify(name),
                defaults={
                    'name': name,
                    'time_of_day': data['time'],
                    'mood_tags': data['moods'],
                    'icon': data['icon']
                }
            )
            db_categories[name] = cat
            if created:
                self.stdout.write(f'Created category: {name}')

        # 2. Fetch Recipes (Iterate by letter to get many)
        # Using a subset of letters to avoid overwhelming the free API if rate limited, 
        # but MealDB is quite generous.
        letters = list(string.ascii_lowercase)[:5] # a-e for now
        
        for letter in letters:
            url = f"https://www.themealdb.com/api/json/v1/1/search.php?f={letter}"
            response = requests.get(url)
            data = response.json()
            
            meals = data.get('meals') or []
            self.stdout.write(f"Fetching letter '{letter}': Found {len(meals)} meals")
            
            for meal in meals:
                self.process_meal(meal, db_categories)

    def process_meal(self, meal, db_categories):
        external_id = meal.get('idMeal')
        title = meal.get('strMeal')
        
        # Check if exists
        recipe = Recipe.objects.filter(external_id=external_id).first()
        
        # If recipe exists and has ingredients, skip
        if recipe and recipe.ingredients.exists() and recipe.instructions.exists():
            return

        self.stdout.write(f"Processing {'update' if recipe else 'create'} for: {title}")

        # Categorization Logic
        meal_cat = meal.get('strCategory', '')
        meal_area = meal.get('strArea', '')
        assigned_cat = None
        
        if meal_cat == 'Breakfast':
            assigned_cat = db_categories.get('Morning')
        elif meal_cat == 'Dessert':
            assigned_cat = db_categories.get('Sweet Treats')
        elif meal_cat in ['Starter', 'Side']:
            assigned_cat = db_categories.get('Quick 30')
        elif meal_cat in ['Beef', 'Chicken', 'Lamb', 'Pork']:
            assigned_cat = db_categories.get('Comfort Bowls')
        elif meal_cat in ['Seafood', 'Vegetarian', 'Vegan']:
            assigned_cat = db_categories.get('Light Dinners')
        else:
            assigned_cat = db_categories.get('Lunch Fusion')
        
        # Default to Lunch Fusion if None
        if not assigned_cat:
             assigned_cat = db_categories.get('Lunch Fusion')

        try:
            if not recipe:
                recipe = Recipe.objects.create(
                    title=title,
                    slug=slugify(f"{title}-{external_id}"),
                    description=f"A delicious {meal_area} {meal_cat} dish.",
                    prep_time_minutes=15, 
                    cook_time_minutes=30, 
                    difficulty='medium',
                    image_url=meal.get('strMealThumb') or '',
                    video_url=meal.get('strYoutube') or '',
                    category=assigned_cat,
                    source_name='MealDB',
                    source_url=meal.get('strSource'),
                    external_id=external_id
                )
            else:
                # Update essential fields if needed
                recipe.category = assigned_cat
                recipe.image_url = meal.get('strMealThumb') or ''
                recipe.save()
            
            # Clear existing to re-ingest (safe update)
            recipe.ingredients.all().delete()
            recipe.instructions.all().delete()
            
            # Ingredients
            for i in range(1, 21):
                ing_name = meal.get(f'strIngredient{i}')
                ing_measure = meal.get(f'strMeasure{i}')
                
                if ing_name and ing_name.strip():
                    RecipeIngredient.objects.create(
                        recipe=recipe,
                        name=ing_name.strip(),
                        amount=ing_measure.strip() if ing_measure else ''
                    )
            
            # Instructions
            # Handle different line endings more robustly
            raw_instructions = meal.get('strInstructions', '')
            if not raw_instructions:
                raw_instructions = ""
                
            steps = []
            if '\r\n' in raw_instructions:
                steps = raw_instructions.split('\r\n')
            elif '\n' in raw_instructions:
                steps = raw_instructions.split('\n')
            else:
                steps = raw_instructions.split('. ') # Fallback for single line paragraphs
                
            steps = [s.strip() for s in steps if s.strip() and len(s) > 3]
            
            for index, step in enumerate(steps, 1):
                RecipeInstruction.objects.create(
                    recipe=recipe,
                    step_number=index,
                    instruction_text=step
                )
                
            self.stdout.write(f"Successfully saved data for: {title}")
            
        except Exception as e:
            self.stderr.write(f"Error saving {title}: {e}")
