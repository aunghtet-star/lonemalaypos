-- Migration: Add variant support to menu_items table
-- Run this in Supabase SQL Editor to add variant columns

-- Add columns for variant support
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT NULL;

-- Add columns for ready-made items if they don't exist
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS is_ready_made boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ready_made_stock_id uuid REFERENCES ingredients(id) ON DELETE SET NULL;

-- Add location columns to orders table if they don't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS location text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location_type text CHECK (location_type IN ('TABLE', 'PARCEL')) DEFAULT NULL;

-- Add variant tracking to order_items if needed
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variant_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS variant_name text DEFAULT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_has_variants ON menu_items(has_variants) WHERE has_variants = true;
CREATE INDEX IF NOT EXISTS idx_menu_items_is_ready_made ON menu_items(is_ready_made) WHERE is_ready_made = true;
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Notify schema cache to reload
NOTIFY pgrst, 'reload schema';

-- Done! Your database now supports variants for menu items

