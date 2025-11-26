#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function seedDatabase() {
  try {
    // First check if we can access the tables
    console.log('\n🔍 Checking table access...');
    const { count: ingredientCount, error: checkError } = await supabase
      .from('ingredients')
      .select('*', { count: 'exact', head: true });

    if (checkError) {
      console.error('❌ Cannot access tables:', checkError.message);
      console.log('\n📋 Please ensure tables are created:');
      console.log('1. Go to: https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new');
      console.log('2. Copy SQL from: supabase/migrations/0001_init.sql');
      console.log('3. Run it in the SQL Editor');
      console.log('4. Then run this script again');
      process.exit(1);
    }

    console.log(`✅ Tables accessible (${ingredientCount || 0} existing ingredients)`);

    console.log('\n🌱 Seeding ingredients...');

    const ingredients = [
      { name: 'Burger Bun', unit: 'pcs', stock: 100, min_stock_level: 20, cost_per_unit: 500 },
      { name: 'Beef Patty', unit: 'pcs', stock: 80, min_stock_level: 20, cost_per_unit: 1500 },
      { name: 'Cheese Slice', unit: 'pcs', stock: 200, min_stock_level: 50, cost_per_unit: 200 },
      { name: 'Lettuce', unit: 'g', stock: 5000, min_stock_level: 1000, cost_per_unit: 10 },
      { name: 'Coffee Beans', unit: 'g', stock: 2000, min_stock_level: 500, cost_per_unit: 50 },
      { name: 'Milk', unit: 'ml', stock: 10000, min_stock_level: 2000, cost_per_unit: 2 }
    ];

    const { data: ingredientsData, error: ingredientsError } = await supabase
      .from('ingredients')
      .insert(ingredients)
      .select();

    if (ingredientsError) {
      console.error('❌ Error seeding ingredients:', ingredientsError.message);
    } else {
      console.log(`✅ Seeded ${ingredientsData?.length || 0} ingredients`);
    }

    console.log('\n🌱 Seeding menu items...');

    const menuItems = [
      { name: 'Classic Cheeseburger', category: 'Food', price: 9000, cost: 3500, image: 'https://picsum.photos/200/200?random=1', description: 'Juicy beef patty with cheddar cheese.' },
      { name: 'Double Bacon Burger', category: 'Food', price: 13000, cost: 5500, image: 'https://picsum.photos/200/200?random=2', description: 'Double patty, crispy bacon.' },
      { name: 'Latte', category: 'Drinks', price: 4500, cost: 1200, image: 'https://picsum.photos/200/200?random=3', description: 'Steamed milk with espresso.' },
      { name: 'Cappuccino', category: 'Drinks', price: 4500, cost: 1200, image: 'https://picsum.photos/200/200?random=4', description: 'Espresso with frothy milk.' },
      { name: 'Caesar Salad', category: 'Food', price: 9500, cost: 2500, image: 'https://picsum.photos/200/200?random=5', description: 'Fresh romaine with croutons.' }
    ];

    const { data: menuData, error: menuError } = await supabase
      .from('menu_items')
      .insert(menuItems)
      .select();

    if (menuError) {
      console.error('❌ Error seeding menu items:', menuError.message);
    } else {
      console.log(`✅ Seeded ${menuData?.length || 0} menu items`);
    }

    console.log('\n✨ Database seeded successfully!');
    console.log('   Run: npm run test:connection');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedDatabase();

