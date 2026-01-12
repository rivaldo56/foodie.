from django.contrib import admin
from .models import RecipeCategory, Recipe, RecipeIngredient, RecipeInstruction

class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1

class RecipeInstructionInline(admin.TabularInline):
    model = RecipeInstruction
    extra = 1

@admin.register(RecipeCategory)
class RecipeCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'time_of_day', 'display_order', 'is_active')
    list_filter = ('time_of_day', 'is_active')
    search_fields = ('name',)
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'difficulty', 'prep_time_minutes', 'is_published')
    list_filter = ('category', 'difficulty', 'is_published', 'source_name')
    search_fields = ('title', 'description', 'external_id')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [RecipeIngredientInline, RecipeInstructionInline]
