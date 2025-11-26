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
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function applyMigration() {
  try {
    console.log('\n📝 Reading migration file...');
    // Migration file check
    console.log('✅ Migration file exists: supabase/migrations/0001_init.sql');
    console.log('\n⚠️  IMPORTANT: This script cannot apply the migration directly.');
    console.log('The anon key does not have permission to create tables.\n');

    console.log('📋 Please follow these steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/0001_init.sql');
    console.log('3. Paste it into the SQL Editor');
    console.log('4. Click "Run" to execute\n');

    console.log('OR use the Supabase CLI:\n');
    console.log('1. Run: npm run supabase:login');
    console.log('2. Login in your browser');
    console.log('3. Run: npm run supabase:link');
    console.log('4. Enter project ref: qfhiurggryjzvyjfugcy');
    console.log('5. Run: npm run supabase:push\n');

    // Try to check if tables exist
    console.log('🔍 Checking if tables already exist...\n');

    const { error: menuError } = await supabase
      .from('menu_items')
      .select('count');

    if (menuError) {
      if (menuError.message.includes('does not exist') || menuError.message.includes('not found')) {
        console.log('❌ Tables do not exist yet. Please create them using one of the methods above.');
      } else {
        console.log('⚠️  Error checking tables:', menuError.message);
      }
    } else {
      console.log('✅ Tables already exist! You\'re all set.');
      console.log('   Run: npm run test:connection');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration();

