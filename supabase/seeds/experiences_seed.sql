-- Seed File: Premium Dining Experiences
-- This script populates the 'experiences' table with the high-end curated categories

INSERT INTO experiences (name, category, description, status, is_featured, slug)
VALUES 
(
    'Corporate Party', 
    'corporate_party', 
    'This isn’t catering. It’s a power move. A private chef turning your office, rooftop, or offsite venue into a high-end dining experience where deals close between courses and the CEO asks for seconds. Interactive stations, plated elegance, or bold themed menus that make your team feel valued instead of just fed. The kind of corporate party that makes LinkedIn jealous the next morning.',
    'published',
    true,
    'corporate-party'
),
(
    'Chama', 
    'chama', 
    'Your chama deserves more than nyama choma and plastic chairs. Imagine a private chef crafting a menu inspired by your group’s vibe, plated beautifully while you sip, laugh, and talk investments. No one disappears into the kitchen. No one burns the pilau. It’s the upgrade your chama didn’t know it could afford, but once you try it, there’s no going back.',
    'published',
    true,
    'chama'
),
(
    'Private Dinner', 
    'private_dinner', 
    'An intimate dining experience designed just for you. Candlelight, a curated menu tailored to your taste, and a chef working quietly in the background like culinary choreography. No crowded restaurants. No rushed service. Just your table, your guests, and dishes you won’t find on any public menu. It feels exclusive because it is.',
    'published',
    true,
    'private-dinner'
),
(
    'Anniversary', 
    'anniversary', 
    'Celebrate your love story with a menu written just for you. The chef recreates the flavors from your first date or designs something completely new for the next chapter. Every course feels intentional. Every bite feels personal. It’s not just dinner, it’s a memory plated beautifully and served warm.',
    'published',
    true,
    'anniversary'
),
(
    'Birthday', 
    'birthday', 
    'This is not cake-and-go. This is a headline birthday. A custom menu built around your favorite flavors, signature cocktails inspired by your personality, and a chef who turns your space into a private restaurant for the night. You host. You shine. You don’t wash a single dish.',
    'published',
    true,
    'birthday'
),
(
    'Meal Prep', 
    'meal_prep', 
    'Imagine opening your fridge and feeling like someone future-proofed your week. Fresh, chef-prepared meals tailored to your goals, your diet, your schedule. High-protein, vegan, family-friendly, or indulgent comfort. No stress. No last-minute takeout. Just ready-to-eat dishes that taste like they were made for today, because they were.',
    'published',
    true,
    'meal-prep'
),
(
    'Event Catering', 
    'event_catering', 
    'From elegant weddings to bold product launches, this is catering without compromise. Designed menus, professional presentation, and flavors that match the energy of your event. Buffets, plated dinners, grazing tables, or live cooking stations. It feels curated, not mass-produced. Guests remember the food, not just the speeches.',
    'published',
    true,
    'event-catering'
),
(
    'Cooking Class', 
    'cooking_class', 
    'Turn your kitchen into a private culinary studio. A professional chef guides you step by step through techniques, plating, and flavor secrets you won’t find on YouTube. Perfect for couples, teams, or curious food lovers. You don’t just eat the meal, you learn how to recreate the magic anytime.',
    'published',
    true,
    'cooking-class'
),
(
    'Baby Shower', 
    'baby_shower', 
    'Celebrate new beginnings with a menu as joyful as the moment. Soft pastels, playful desserts, elegant brunch spreads, or culturally inspired comfort dishes. The chef handles the flow while you focus on laughter, photos, and glowing parents-to-be. It’s warm, beautiful, and effortlessly memorable.',
    'published',
    true,
    'baby-shower'
)
ON CONFLICT (slug) DO UPDATE 
SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    is_featured = EXCLUDED.is_featured;
