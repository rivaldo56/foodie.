from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()


class UserProfileSmokeTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='smoke@example.com',
            username='smoketest',
            password='password123',
            role='client',
        )
        self.token, _ = Token.objects.get_or_create(user=self.user)

    def test_profile_endpoint_returns_200_for_authenticated_user(self):
        url = reverse('users:profile')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('email'), self.user.email)
