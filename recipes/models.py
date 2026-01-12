from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from chefs.models import ChefProfile

class RecipeCategory(models.Model):
    """
    Categories for browsing recipes (e.g., 'Morning', 'Comfort Bowls').
    """
    TIME_OF_DAY_CHOICES = [
        ('morning', 'Morning'),
        ('afternoon', 'Afternoon'),
        ('evening', 'Evening'),
        ('any', 'Any Time'),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, help_text="Lucide icon name or emoji", blank=True)
    description = models.TextField(blank=True)
    
    # Smart categorization
    time_of_day = models.CharField(max_length=20, choices=TIME_OF_DAY_CHOICES, default='any')
    # mood_tags as JSON list for flexible filtering like ['cozy', 'healthy', 'quick']
    mood_tags = models.JSONField(default=list, blank=True)
    
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Recipe Categories"
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.name} ({self.time_of_day})"


class Recipe(models.Model):
    """
    Core recipe model. Can be from MealDB or a Chef.
    """
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=250)
    description = models.TextField(blank=True)
    
    # Metadata
    prep_time_minutes = models.PositiveIntegerField(help_text="Prep time in minutes")
    cook_time_minutes = models.PositiveIntegerField(help_text="Cooking time in minutes")
    total_time_minutes = models.PositiveIntegerField(help_text="Total time (auto-calc optional)", blank=True, null=True)
    
    servings = models.PositiveIntegerField(default=2)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    calories = models.PositiveIntegerField(help_text="Calories per serving", null=True, blank=True)
    
    # Media
    image_url = models.URLField(max_length=500, blank=True)
    video_url = models.URLField(max_length=500, blank=True, null=True)
    
    # Relations
    category = models.ForeignKey(RecipeCategory, on_delete=models.SET_NULL, null=True, related_name='recipes')
    # Optional link to a specific Chef (if this is their signature dish)
    chef = models.ForeignKey(ChefProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='recipes')
    
    # Source info
    source_name = models.CharField(max_length=100, default='Foodie Original') # e.g. "MealDB", "Chef Mario"
    source_url = models.URLField(blank=True, null=True)
    external_id = models.CharField(max_length=100, blank=True, null=True, db_index=True) # ID from MealDB
    
    # Stats
    likes_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.total_time_minutes and self.prep_time_minutes and self.cook_time_minutes:
            self.total_time_minutes = self.prep_time_minutes + self.cook_time_minutes
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class RecipeIngredient(models.Model):
    """
    Individual ingredient for a recipe.
    """
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    # Link to global Ingredient model for AI matching (Future)
    # ingredient = models.ForeignKey('kitchen.Ingredient', ... )
    
    name = models.CharField(max_length=200, help_text="Display name if different from standard") 
    amount = models.CharField(max_length=100, blank=True) # e.g. "2 cups", "500g"
    notes = models.CharField(max_length=200, blank=True) # e.g. "diced", "peeled"
    
    def __str__(self):
        if self.ingredient:
            return f"{self.amount} {self.ingredient.name} ({self.notes})"
        return f"{self.amount} {self.name}"


class RecipeInstruction(models.Model):
    """
    Step-by-step instructions.
    """
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='instructions')
    step_number = models.PositiveIntegerField()
    instruction_text = models.TextField()
    
    class Meta:
        ordering = ['step_number']
        unique_together = ['recipe', 'step_number']

    def __str__(self):
        return f"{self.recipe.title} - Step {self.step_number}"
