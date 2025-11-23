"""
Management command to create test chef data for the Foodie platform.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from chefs.models import ChefProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Creates test chef users with profiles for development/testing'

    def handle(self, *args, **options):
        test_chefs = [
            {
                'username': 'chef_maria',
                'email': 'maria@foodie.com',
                'full_name': 'Chef Maria Rodriguez',
                'password': 'FoodieChef123!',
                'bio': 'Award-winning chef with 15+ years of experience in Michelin-starred restaurants. Passionate about creating unforgettable dining experiences with fresh, local ingredients.',
                'specialties': ['French Cuisine', 'Fine Dining', 'Pastry'],
                'years_of_experience': 15,
                'hourly_rate': 5000,
                'city': 'Nairobi',
                'state': 'Kenya',
                'is_verified': True,
            },
            {
                'username': 'chef_wanjiku',
                'email': 'wanjiku@foodie.com',
                'full_name': 'Chef Wanjiku Kamau',
                'password': 'FoodieChef123!',
                'bio': 'Kenyan cuisine specialist bringing authentic flavors to modern dining. Expert in traditional dishes with a contemporary twist.',
                'specialties': ['Kenyan Cuisine', 'African Fusion', 'Grilling'],
                'years_of_experience': 10,
                'hourly_rate': 4000,
                'city': 'Nairobi',
                'state': 'Kenya',
                'is_verified': True,
            },
            {
                'username': 'chef_fatuma',
                'email': 'fatuma@foodie.com',
                'full_name': 'Chef Fatuma Ahmed',
                'password': 'FoodieChef123!',
                'bio': 'Coastal cuisine expert specializing in seafood and Swahili dishes. Bringing the flavors of the Indian Ocean to your table.',
                'specialties': ['Seafood', 'Swahili Cuisine', 'Coastal Dishes'],
                'years_of_experience': 12,
                'hourly_rate': 4500,
                'city': 'Mombasa',
                'state': 'Kenya',
                'is_verified': True,
            },
            {
                'username': 'chef_john',
                'email': 'john@foodie.com',
                'full_name': 'Chef John Omondi',
                'password': 'FoodieChef123!',
                'bio': 'International cuisine specialist with experience in Italian, Asian, and Mediterranean cooking. Creating fusion masterpieces.',
                'specialties': ['Italian Cuisine', 'Asian Fusion', 'Mediterranean'],
                'years_of_experience': 8,
                'hourly_rate': 3500,
                'city': 'Nairobi',
                'state': 'Kenya',
                'is_verified': False,
            },
        ]

        created_count = 0
        for chef_data in test_chefs:
            # Check if user already exists
            if User.objects.filter(username=chef_data['username']).exists():
                self.stdout.write(
                    self.style.WARNING(f"User {chef_data['username']} already exists, skipping...")
                )
                continue

            # Create user
            user = User.objects.create_user(
                username=chef_data['username'],
                email=chef_data['email'],
                password=chef_data['password'],
                full_name=chef_data['full_name'],
                role='chef',
                is_verified=chef_data['is_verified'],
            )

            # Create or update chef profile
            chef_profile, created = ChefProfile.objects.get_or_create(
                user=user,
                defaults={
                    'bio': chef_data['bio'],
                    'specialties': chef_data['specialties'],
                    'years_of_experience': chef_data['years_of_experience'],
                    'hourly_rate': chef_data['hourly_rate'],
                    'city': chef_data['city'],
                    'state': chef_data['state'],
                    'is_available': True,
                }
            )

            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(f"Successfully created chef: {chef_data['full_name']}")
            )

        self.stdout.write(
            self.style.SUCCESS(f"\nCreated {created_count} test chef(s) successfully!")
        )
