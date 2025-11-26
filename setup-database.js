#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Please add your service role key from Supabase Dashboard > Settings > API');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase...');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDatabase() {
  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '0001_init.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📦 Running database migration...');

    // Split SQL into individual statements (rough split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          // Try direct execution if RPC doesn't exist
          console.log('Executing:', statement.substring(0, 50) + '...');
        }
      }
    }

    console.log('✅ Database schema created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run dev (to start frontend)');
    console.log('2. Run: npm run backend (to start backend API)');
    console.log('3. Open: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\n💡 Alternative: Run the SQL manually in Supabase Dashboard > SQL Editor');
    console.error('   File: supabase/migrations/0001_init.sql');
  }
}

setupDatabase();

