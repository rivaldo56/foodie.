-- 1. Migrate existing menu course data to meals and menu_meals
DO $$
DECLARE
    m RECORD;
    starter_id UUID;
    main_id UUID;
    dessert_id UUID;
BEGIN
    FOR m IN SELECT id, starter_title, starter_image_url, main_title, main_image_url, dessert_title, dessert_image_url FROM menus LOOP
        -- Starter
        IF m.starter_title IS NOT NULL OR m.starter_image_url IS NOT NULL THEN
            INSERT INTO meals (name, category, image_url, is_active)
            VALUES (COALESCE(m.starter_title, 'Starter'), 'starter', m.starter_image_url, true)
            RETURNING id INTO starter_id;

            INSERT INTO menu_meals (menu_id, meal_id, course_type, order_index)
            VALUES (m.id, starter_id, 'starter', 0);
        END IF;

        -- Main
        IF m.main_title IS NOT NULL OR m.main_image_url IS NOT NULL THEN
            INSERT INTO meals (name, category, image_url, is_active)
            VALUES (COALESCE(m.main_title, 'Main Course'), 'main', m.main_image_url, true)
            RETURNING id INTO main_id;

            INSERT INTO menu_meals (menu_id, meal_id, course_type, order_index)
            VALUES (m.id, main_id, 'main', 1);
        END IF;

        -- Dessert
        IF m.dessert_title IS NOT NULL OR m.dessert_image_url IS NOT NULL THEN
            INSERT INTO meals (name, category, image_url, is_active)
            VALUES (COALESCE(m.dessert_title, 'Dessert'), 'dessert', m.dessert_image_url, true)
            RETURNING id INTO dessert_id;

            INSERT INTO menu_meals (menu_id, meal_id, course_type, order_index)
            VALUES (m.id, dessert_id, 'dessert', 2);
        END IF;
    END LOOP;
END $$;

-- 2. Remove legacy fields from menus table
ALTER TABLE menus
DROP COLUMN IF EXISTS starter_image_url,
DROP COLUMN IF EXISTS main_image_url,
DROP COLUMN IF EXISTS dessert_image_url,
DROP COLUMN IF EXISTS starter_title,
DROP COLUMN IF EXISTS main_title,
DROP COLUMN IF EXISTS dessert_title;
