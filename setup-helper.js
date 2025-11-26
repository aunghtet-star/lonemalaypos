#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║   Supabase Setup Helper - Database Configuration    ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('\nPlease ensure .env.local contains:');
  console.log('  VITE_SUPABASE_URL=your_url');
  console.log('  VITE_SUPABASE_ANON_KEY=your_key\n');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key: ${ANON_KEY.substring(0, 20)}...\n`);

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkSetup() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 STEP 1: Check Database Tables\n');

  const tables = ['ingredients', 'menu_items', 'menu_item_ingredients', 'orders', 'order_items'];
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table.padEnd(25)} - NOT FOUND`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ ${table.padEnd(25)} - ${count || 0} rows`);
      }
    } catch (e) {
      console.log(`   ❌ ${table.padEnd(25)} - ERROR: ${e.message}`);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n❌ TABLES MISSING! Please create them:\n');
    console.log('Option 1: Using Supabase Dashboard (Recommended)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`1. Go to: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
    console.log('2. Copy the SQL from: supabase/migrations/0001_init.sql');
    console.log('3. Paste and run it in the SQL Editor');
    console.log('4. Copy the SQL from: enable-rls.sql');
    console.log('5. Paste and run it to enable Row Level Security\n');

    console.log('Option 2: Manual SQL Execution');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Run these files in order:');
    console.log('  1. supabase/migrations/0001_init.sql');
    console.log('  2. enable-rls.sql\n');

    console.log('Then run: node setup-helper.js\n');
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 STEP 2: Check Row Level Security (RLS)\n');

  // Try to insert a test record
  const testIngredient = {
    name: '_test_ingredient_' + Date.now(),
    unit: 'test',
    stock: 0,
    min_stock_level: 0,
    cost_per_unit: 0
  };

  const { data: testData, error: testError } = await supabase
    .from('ingredients')
    .insert(testIngredient)
    .select();

  if (testError) {
    console.log('   ❌ Cannot insert data - RLS may be blocking access');
    console.log(`      Error: ${testError.message}\n`);
    console.log('Please run the SQL from enable-rls.sql in Supabase Dashboard\n');
    process.exit(1);
  } else {
    console.log('   ✅ RLS configured correctly - data can be inserted\n');

    // Clean up test data
    await supabase
      .from('ingredients')
      .delete()
      .eq('id', testData[0].id);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📋 STEP 3: Check if data needs seeding\n');

  const { count: menuCount } = await supabase
    .from('menu_items')
    .select('*', { count: 'exact', head: true });

  const { count: ingredientCount } = await supabase
    .from('ingredients')
    .select('*', { count: 'exact', head: true });

  if (menuCount === 0 && ingredientCount === 0) {
    console.log('   ⚠️  Database is empty - needs seeding\n');
    console.log('Run: node seed-database.js\n');
  } else {
    console.log(`   ✅ Database has data:`);
    console.log(`      - ${ingredientCount} ingredients`);
    console.log(`      - ${menuCount} menu items\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✨ Setup Complete! Your database is ready.\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3001');
  console.log('  3. Start using the POS system!\n');
}

checkSetup().catch(err => {
  console.error('\n❌ Error during setup check:', err.message);
  process.exit(1);
});

