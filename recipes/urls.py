from django.urls import path
from .views import RecipeFeedView, CategoryListView, RecipeDetailView, RecipeListView

urlpatterns = [
    path('feed/', RecipeFeedView.as_view(), name='recipe-feed'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('list/', RecipeListView.as_view(), name='recipe-list'),
    path('recipes/<slug:slug>/', RecipeDetailView.as_view(), name='recipe-detail'),
]
