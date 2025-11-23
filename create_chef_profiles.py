"""
Script to create ChefProfile entries for existing chef users.
Run this with: python manage.py shell < create_chef_profiles.py
"""

from users.models import User
from chefs.models import ChefProfile

# Find all users with role='chef'
chef_users = User.objects.filter(role='chef')

print(f"Found {chef_users.count()} chef users")

# Sample chef data
chef_data_templates = [
    {
        'bio': 'Award-winning chef with 15+ years of experience in Michelin-starred restaurants. Passionate about creating unforgettable dining experiences with fresh, local ingredients.',
        'specialties': ['French Cuisine', 'Fine Dining', 'Pastry'],
        'years_of_experience': 15,
        'hourly_rate': 5000,
        'city': 'Nairobi',
        'state': 'Kenya',
    },
    {
        'bio': 'Kenyan cuisine specialist bringing authentic flavors to modern dining. Expert in traditional dishes with a contemporary twist.',
        'specialties': ['Kenyan Cuisine', 'African Fusion', 'Grilling'],
        'years_of_experience': 10,
        'hourly_rate': 4000,
        'city': 'Nairobi',
        'state': 'Kenya',
    },
]

created_count = 0
for index, user in enumerate(chef_users):
    # Check if chef profile already exists
    if hasattr(user, 'chef_profile'):
        print(f"Chef profile already exists for {user.full_name}")
        continue
    
    # Use template data, cycling through if more users than templates
    template = chef_data_templates[index % len(chef_data_templates)]
    
    # Create chef profile
    chef_profile = ChefProfile.objects.create(
        user=user,
        bio=template['bio'],
        specialties=template['specialties'],
        years_of_experience=template['years_of_experience'],
        hourly_rate=template['hourly_rate'],
        city=template['city'],
        state=template['state'],
        is_verified=user.is_verified,
        is_available=True,
        average_rating=4.8,  # Default rating
        total_reviews=0,
        total_bookings=0,
    )
    
    created_count += 1
    print(f"✓ Created chef profile for {user.full_name}")

print(f"\n✅ Successfully created {created_count} chef profile(s)!")
print(f"\nNow check the API at: http://localhost:8000/api/chefs/")
