from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from chefs.models import ChefProfile, FavoriteChef

User = get_user_model()

class FavoriteChefTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.user = User.objects.create_user(
            email='user@example.com',
            username='user',
            password='password123',
            first_name='Test',
            last_name='User'
        )
        self.chef_user = User.objects.create_user(
            email='chef@example.com',
            username='chef',
            password='password123',
            first_name='Chef',
            last_name='Cook',
            role='chef'
        )
        
        # Create chef profile
        self.chef_profile = ChefProfile.objects.create(
            user=self.chef_user,
            bio='Test Bio',
            years_of_experience=5
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)

    def test_toggle_favorite(self):
        # Test adding favorite
        url = f'/api/chefs/{self.chef_profile.id}/favorite/'
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_favorited'])
        self.assertTrue(FavoriteChef.objects.filter(user=self.user, chef=self.chef_profile).exists())
        
        # Test removing favorite
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_favorited'])
        self.assertFalse(FavoriteChef.objects.filter(user=self.user, chef=self.chef_profile).exists())

    def test_list_favorites(self):
        # Add favorite
        FavoriteChef.objects.create(user=self.user, chef=self.chef_profile)
        
        # Test list
        url = '/api/chefs/favorites/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['chef'], self.chef_profile.id)
