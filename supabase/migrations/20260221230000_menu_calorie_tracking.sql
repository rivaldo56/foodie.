-- Add total_kcal to menus
ALTER TABLE menus ADD COLUMN IF NOT EXISTS total_kcal integer DEFAULT 0;

-- Function to calculate total kcal for a menu
CREATE OR REPLACE FUNCTION calculate_menu_total_kcal(menu_id_input uuid)
RETURNS integer AS $$
DECLARE
    total_val integer;
BEGIN
    SELECT COALESCE(SUM(m.kcal), 0)
    INTO total_val
    FROM menu_meals mm
    JOIN meals m ON mm.meal_id = m.id
    WHERE mm.menu_id = menu_id_input;
    
    RETURN total_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update menus.total_kcal
CREATE OR REPLACE FUNCTION update_menu_total_kcal_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE menus
        SET total_kcal = calculate_menu_total_kcal(OLD.menu_id)
        WHERE id = OLD.menu_id;
        RETURN OLD;
    ELSE
        UPDATE menus
        SET total_kcal = calculate_menu_total_kcal(NEW.menu_id)
        WHERE id = NEW.menu_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on menu_meals
DROP TRIGGER IF EXISTS tr_update_menu_kcal ON menu_meals;
CREATE TRIGGER tr_update_menu_kcal
AFTER INSERT OR UPDATE OR DELETE ON menu_meals
FOR EACH ROW EXECUTE FUNCTION update_menu_total_kcal_trigger();

-- Initialize existing menus
UPDATE menus
SET total_kcal = calculate_menu_total_kcal(id);
