-- Complete Setup: Add Ready-Made Drinks Support
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Step 1: Add columns to menu_items table
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_ready_made boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ready_made_stock_id uuid REFERENCES ingredients(id) ON DELETE SET NULL;

-- Step 2: Add unique constraints on name columns (needed for upserts)
ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_name_unique;
ALTER TABLE ingredients ADD CONSTRAINT ingredients_name_unique UNIQUE (name);

ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_name_unique;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_name_unique UNIQUE (name);

-- Step 3: Add missing CRUD policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "dev_update_menu" ON menu_items;
DROP POLICY IF EXISTS "dev_insert_menu" ON menu_items;
DROP POLICY IF EXISTS "dev_delete_menu" ON menu_items;
DROP POLICY IF EXISTS "dev_insert_ing" ON ingredients;
DROP POLICY IF EXISTS "dev_update_ing" ON ingredients;
DROP POLICY IF EXISTS "dev_delete_ing" ON ingredients;

CREATE POLICY "dev_update_menu" ON menu_items FOR UPDATE USING (true);
CREATE POLICY "dev_insert_menu" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_delete_menu" ON menu_items FOR DELETE USING (true);

CREATE POLICY "dev_insert_ing" ON ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_ing" ON ingredients FOR UPDATE USING (true);
CREATE POLICY "dev_delete_ing" ON ingredients FOR DELETE USING (true);

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_ready_made ON menu_items(is_ready_made) WHERE is_ready_made = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_stock_id ON menu_items(ready_made_stock_id) WHERE ready_made_stock_id IS NOT NULL;

-- Step 5: Insert ready-made drink inventory items
INSERT INTO ingredients (name, unit, stock, min_stock_level, cost_per_unit)
VALUES
  ('Coca-Cola Can', 'cans', 50, 10, 800),
  ('Sprite Can', 'cans', 50, 10, 800),
  ('Mineral Water Bottle', 'bottles', 100, 20, 500),
  ('Orange Juice Box', 'boxes', 30, 5, 1200)
ON CONFLICT (name) DO NOTHING;

-- Step 6: Insert ready-made drink menu items
-- Get ingredient IDs and insert menu items
DO $$
DECLARE
  cocacola_id uuid;
  sprite_id uuid;
  water_id uuid;
  juice_id uuid;
BEGIN
  -- Get ingredient IDs
  SELECT id INTO cocacola_id FROM ingredients WHERE name = 'Coca-Cola Can' LIMIT 1;
  SELECT id INTO sprite_id FROM ingredients WHERE name = 'Sprite Can' LIMIT 1;
  SELECT id INTO water_id FROM ingredients WHERE name = 'Mineral Water Bottle' LIMIT 1;
  SELECT id INTO juice_id FROM ingredients WHERE name = 'Orange Juice Box' LIMIT 1;

  -- Insert or update menu items with ready-made flags
  INSERT INTO menu_items (name, category, price, cost, image, description, is_ready_made, ready_made_stock_id)
  VALUES
    ('Coca-Cola', 'Drinks', 1500, 800, '', 'Chilled Coca-Cola can.', true, cocacola_id),
    ('Sprite', 'Drinks', 1500, 800, '', 'Chilled Sprite can.', true, sprite_id),
    ('Mineral Water', 'Drinks', 1000, 500, '', 'Pure mineral water bottle.', true, water_id),
    ('Orange Juice', 'Drinks', 2500, 1200, '', 'Fresh orange juice box.', true, juice_id)
  ON CONFLICT (name) DO UPDATE SET
    is_ready_made = EXCLUDED.is_ready_made,
    ready_made_stock_id = EXCLUDED.ready_made_stock_id,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description;
END $$;

-- Step 7: Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verification queries (run these separately after main script succeeds)
-- SELECT * FROM ingredients WHERE name LIKE '%Can%' OR name LIKE '%Bottle%' OR name LIKE '%Box%';
-- SELECT id, name, category, is_ready_made, ready_made_stock_id FROM menu_items WHERE is_ready_made = true;
