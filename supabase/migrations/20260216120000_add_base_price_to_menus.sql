-- Add base_price field to menus table for dual pricing model
-- Pricing formula: total_price = base_price + (guest_count × price_per_person)

ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add index for potential price-based queries
CREATE INDEX IF NOT EXISTS idx_menus_base_price ON menus(base_price);

-- Update comment for clarity
COMMENT ON COLUMN menus.base_price IS 'Fixed base price for the menu, independent of guest count';
COMMENT ON COLUMN menus.price_per_person IS 'Additional price per guest (formerly price_per_person)';
