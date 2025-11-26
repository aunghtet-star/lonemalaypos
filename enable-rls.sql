-- Enable Row Level Security and set policies for all tables
-- Run this in Supabase SQL Editor

-- Enable RLS on all tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for anon users (adjust based on your security needs)
-- For development, we'll allow all operations. For production, restrict as needed.

-- Ingredients policies
CREATE POLICY "Allow all access to ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);

-- Menu items policies
CREATE POLICY "Allow all access to menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);

-- Menu item ingredients policies
CREATE POLICY "Allow all access to menu_item_ingredients" ON menu_item_ingredients FOR ALL USING (true) WITH CHECK (true);

-- Orders policies
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order items policies
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

