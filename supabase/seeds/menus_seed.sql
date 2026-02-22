-- Comprehensive Seed File: Global Menu Options
-- This script populates the 'menus' table with diverse options for all experience categories.

DELETE FROM menus; -- Clear existing menus to prevent conflicts during full seed

INSERT INTO menus (
  experience_id,
  name,
  description,
  base_price,
  price_per_person,
  guest_min,
  guest_max,
  dietary_tags,
  featured,
  status,
  starter_title,
  main_title,
  dessert_title
)
SELECT
  e.id,
  m.name,
  m.description,
  m.base_price,
  m.price_per_person,
  m.guest_min,
  m.guest_max,
  m.dietary_tags,
  m.featured,
  'active',
  m.starter_title,
  m.main_title,
  m.dessert_title
FROM experiences e
JOIN (
  VALUES
  -- BABY SHOWER
  ('baby-shower', 'Blush Garden Brunch', 'Light, elegant, photo-friendly brunch spread.', 6000, 1800, 10, 40, ARRAY['vegetarian optional'], false, 'Smoked Salmon & Avocado Tea Toasts', 'Lemon Herb Chicken with Baby Potatoes', 'Vanilla Bean Cupcakes with Pink Buttercream'),
  ('baby-shower', 'Sweet Celebration Buffet', 'Comfort-forward, crowd-pleasing buffet.', 8000, 2200, 15, 60, ARRAY['halal optional'], false, 'Mini Caprese Skewers', 'Creamy Tuscan Chicken Pasta', 'Strawberry Cheesecake Cups'),
  ('baby-shower', 'Golden High Tea Affair', 'Luxury afternoon tea aesthetic.', 10000, 2800, 10, 30, ARRAY['vegetarian'], true, 'Cucumber & Dill Finger Sandwiches', 'Chicken & Mushroom Vol-au-Vent', 'Assorted French Macarons'),

  -- ANNIVERSARY
  ('anniversary', 'Romantic Italian Escape', 'Intimate candlelit Italian romance.', 5000, 2500, 2, 6, ARRAY['customizable'], false, 'Burrata with Heirloom Tomatoes', 'Lobster Tagliatelle', 'Classic Tiramisu'),
  ('anniversary', ' Parisian Love Story', 'Fine dining celebration.', 7000, 3000, 2, 8, ARRAY['customizable'], false, 'French Onion Soup', 'Herb-Crusted Rack of Lamb', 'Chocolate Lava Cake'),
  ('anniversary', 'Chef’s Signature Tasting', 'Elegant milestone dining.', 12000, 4500, 2, 10, ARRAY['customizable'], true, 'Seared Scallops with Citrus Foam', 'Filet Mignon with Truffle Mash', 'Pistachio Crème Brûlée'),

  -- CORPORATE EVENT
  ('corporate-party', 'Executive Lunch', 'Professional and balanced.', 15000, 2800, 10, 50, ARRAY['healthy'], false, 'Roasted Pumpkin Soup', 'Grilled Chicken with Garlic Rice', 'Lemon Drizzle Cake'),
  ('corporate-party', 'Networking Cocktail Evening', 'Casual upscale networking.', 12000, 3500, 20, 100, ARRAY['finger foods'], false, 'Beef Sliders', 'Live Pasta Station (Penne Arrabbiata & Alfredo)', 'Chocolate Brownie Bites'),
  ('corporate-party', 'Boardroom Premium Dining', 'Executive sophistication.', 25000, 6500, 5, 20, ARRAY['premium'], true, 'Shrimp Cocktail', 'Pan-Seared Salmon with Asparagus', 'New York Cheesecake'),

  -- BIRTHDAY PARTY
  ('birthday', 'Celebration Feast', 'Classic festive crowd energy.', 8000, 2000, 10, 40, ARRAY['family friendly'], false, 'BBQ Chicken Wings', 'Slow-Roasted Beef with Gravy', 'Chocolate Birthday Cake'),
  ('birthday', 'Grill & Chill Party', 'Fun, social, lively.', 10000, 2500, 15, 60, ARRAY['outdoor'], false, 'Loaded Nachos', 'Nyama Choma Platter', 'Pineapple Upside-Down Cake'),
  ('birthday', 'Luxe Birthday Soirée', 'Elevated birthday glam.', 15000, 4500, 10, 30, ARRAY['upscale'], true, 'Prawn Tempura', 'Butter Garlic Lobster', 'Red Velvet Cake'),

  -- EVENT CATERING
  ('event-catering', 'Classic Event Buffet', 'Large-scale traditional comfort.', 20000, 1500, 50, 200, ARRAY['traditional'], false, 'Coleslaw & Garden Salad', 'Beef Stew with Pilau', 'Caramel Pudding'),
  ('event-catering', 'Live Chef Stations', 'Interactive catering experience.', 30000, 3500, 30, 150, ARRAY['interactive'], false, 'Sushi Rolls Selection', 'Carving Station Roast Lamb', 'Waffle Station with Toppings'),
  ('event-catering', 'Grand Wedding Package', 'Full-scale luxury wedding dining.', 50000, 5500, 50, 300, ARRAY['premium', 'wedding'], true, 'Smoked Salmon Canapés', 'Herb-Roasted Beef Tenderloin', 'Three-Tier Wedding Cake'),

  -- CATERING (GENERAL)
  ('event-catering', 'Family Gathering Spread', 'Cultural warmth.', 10000, 1500, 20, 100, ARRAY['family'], false, 'Samosas & Spring Rolls', 'Chicken Biryani', 'Gulab Jamun'),
  ('event-catering', 'Weekend Feast Package', 'Local + comfort blend.', 8000, 2000, 10, 50, ARRAY['comfort'], false, 'Creamy Mushroom Soup', 'Grilled Tilapia with Ugali', 'Coconut Cake'),
  ('event-catering', 'Premium Catering Experience', 'Upscale multi-event solution.', 15000, 3500, 15, 60, ARRAY['premium'], false, 'Bruschetta Trio', 'Lamb Shank with Mash', 'Chocolate Mousse'),

  -- MEAL PREP
  ('meal-prep', 'Balanced Weekly Plan', 'Clean, nutritious.', 0, 12000, 1, 1, ARRAY['healthy'], false, 'Greek Salad', 'Grilled Chicken & Quinoa Bowl', 'Chia Seed Pudding'),
  ('meal-prep', 'High-Protein Fitness Plan', 'Gym-focused performance fuel.', 0, 15000, 1, 1, ARRAY['high protein'], false, 'Egg White & Spinach Wrap', 'Beef Stir Fry with Brown Rice', 'Protein Energy Bites'),
  ('meal-prep', 'Family Prep Bundle', 'Healthy family rotation.', 2000, 25000, 1, 1, ARRAY['family'], true, 'Creamy Tomato Soup', 'Baked Chicken & Veggies', 'Banana Oat Muffins'),

  -- CHAMA
  ('chama', 'Investment Brunch', 'Stylish monthly meeting.', 5000, 1800, 5, 20, ARRAY['brunch'], false, 'Avocado Crostini', 'Creamy Chicken Alfredo', 'Mini Pavlovas'),
  ('chama', 'Nyama Choma Social', 'Relaxed social energy.', 7000, 2200, 10, 30, ARRAY['local'], false, 'Grilled Sausages', 'Mixed Meat Platter', 'Mango Sorbet'),
  ('chama', 'Premium Chama Soirée', 'Celebration of milestones.', 12000, 3500, 5, 15, ARRAY['premium'], true, 'Prawn Cocktail', 'Roast Duck with Orange Glaze', 'Dark Chocolate Tart'),

  -- PRIVATE DINNER
  ('private-dinner', 'Classic Romantic Evening', 'Intimate comfort luxury.', 5000, 3500, 2, 4, ARRAY['romantic'], false, 'Caprese Salad', 'Herb Butter Steak', 'Molten Chocolate Cake'),
  ('private-dinner', 'Mediterranean Night', 'Coastal elegance.', 8000, 4000, 2, 10, ARRAY['mediterranean'], false, 'Hummus & Warm Pita', 'Grilled Sea Bass', 'Baklava'),
  ('private-dinner', 'Chef’s Signature Experience', 'Modern fine dining.', 15000, 7500, 2, 8, ARRAY['fine dining'], true, 'Tuna Tartare', 'Truffle Risotto with Seared Steak', 'Vanilla Crème Brûlée')

) AS m(slug, name, description, base_price, price_per_person, guest_min, guest_max, dietary_tags, featured, starter_title, main_title, dessert_title)
ON e.slug = m.slug;
