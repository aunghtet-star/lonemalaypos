-- Add ready-made drink support to menu_items table
-- This allows menu items to be marked as ready-made (canned/bottled)
-- and linked to inventory for stock tracking

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_ready_made boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ready_made_stock_id uuid REFERENCES ingredients(id) ON DELETE SET NULL;

-- Add policies for new columns
CREATE POLICY IF NOT EXISTS "dev_update_menu" ON menu_items FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_insert_menu" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_delete_menu" ON menu_items FOR DELETE USING (true);

-- Add policies for ingredients CRUD
CREATE POLICY IF NOT EXISTS "dev_insert_ing" ON ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_update_ing" ON ingredients FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_delete_ing" ON ingredients FOR DELETE USING (true);

-- Add policy for menu_item_ingredients CRUD
CREATE POLICY IF NOT EXISTS "dev_insert_refs" ON menu_item_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "dev_update_refs" ON menu_item_ingredients FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "dev_delete_refs" ON menu_item_ingredients FOR DELETE USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_ready_made ON menu_items(is_ready_made) WHERE is_ready_made = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_stock_id ON menu_items(ready_made_stock_id) WHERE ready_made_stock_id IS NOT NULL;

COMMENT ON COLUMN menu_items.is_ready_made IS 'True for ready-made drinks (canned/bottled) that have direct inventory stock';
COMMENT ON COLUMN menu_items.ready_made_stock_id IS 'Foreign key to ingredients table for ready-made items stock tracking';

