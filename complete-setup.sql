-- Complete Setup SQL - Run this entire file in Supabase SQL Editor
-- This will create tables, enable RLS, and seed initial data

-- =============================================================================
-- STEP 1: Create Tables (if they don't exist)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 0,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric NOT NULL,
  cost numeric NOT NULL,
  image text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_item_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subtotal numeric NOT NULL,
  tax numeric NOT NULL,
  discount numeric NOT NULL,
  total numeric NOT NULL,
  payment_method text CHECK (payment_method IN ('CASH','KBZ_PAY')) NOT NULL,
  status text CHECK (status IN ('COMPLETED','REFUNDED')) NOT NULL,
  cashier_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL,
  price_each numeric NOT NULL
);

-- =============================================================================
-- STEP 2: Enable Row Level Security
-- =============================================================================

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 3: Create Permissive Policies (Development Mode)
-- For production, you should restrict these policies
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access to ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow all access to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow all access to menu_item_ingredients" ON menu_item_ingredients;
DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;

-- Create new policies
CREATE POLICY "Allow all access to ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to menu_item_ingredients" ON menu_item_ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- STEP 4: Seed Initial Data
-- =============================================================================

-- Insert ingredients
INSERT INTO ingredients (name, unit, stock, min_stock_level, cost_per_unit)
VALUES
  ('Burger Bun', 'pcs', 100, 20, 500),
  ('Beef Patty', 'pcs', 80, 20, 1500),
  ('Cheese Slice', 'pcs', 200, 50, 200),
  ('Lettuce', 'g', 5000, 1000, 10),
  ('Coffee Beans', 'g', 2000, 500, 50),
  ('Milk', 'ml', 10000, 2000, 2)
ON CONFLICT DO NOTHING;

-- Insert menu items
INSERT INTO menu_items (name, category, price, cost, image, description)
VALUES
  ('Classic Cheeseburger', 'Food', 9000, 3500, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', 'Juicy beef patty with cheddar cheese'),
  ('Double Bacon Burger', 'Food', 13000, 5500, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&h=200&fit=crop', 'Double patty with crispy bacon'),
  ('Latte', 'Drinks', 4500, 1200, 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=200&h=200&fit=crop', 'Steamed milk with espresso'),
  ('Cappuccino', 'Drinks', 4500, 1200, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', 'Espresso with frothy milk'),
  ('Caesar Salad', 'Food', 9500, 2500, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=200&fit=crop', 'Fresh romaine with croutons')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 5: Notify schema cache to reload
-- =============================================================================
NOTIFY pgrst, 'reload schema';

-- Done! You should now be able to use the database from your app.

