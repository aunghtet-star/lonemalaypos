#!/usr/bin/env node
// Improved Supabase Connection Test
// Run: node test-connection.js [--json]

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local (Vite style) & fallback .env
dotenv.config({ path: join(__dirname, '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const flags = process.argv.slice(2);
const OUTPUT_JSON = flags.includes('--json');

function exitJson(ok, msg, extra = {}) {
  if (OUTPUT_JSON) {
    console.log(JSON.stringify({ success: ok, message: msg, ...extra }, null, 2));
  } else {
    if (ok) console.log(`✅ ${msg}`); else console.error(`❌ ${msg}`);
  }
  if (!ok) process.exit(1);
}

console.log('🔍 Testing Supabase Connection...');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  exitJson(false, 'Missing environment variables', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY
  });
}

if (!/^https?:\/\/.+supabase\.co/.test(SUPABASE_URL)) {
  console.warn('⚠️ URL format suspicious:', SUPABASE_URL);
}
if (!SUPABASE_ANON_KEY.startsWith('ey')) {
  console.warn('⚠️ Key does not appear to be a JWT (starts with "ey")');
}

console.log('✅ Env vars loaded');
console.log('   URL:', SUPABASE_URL);
console.log('   Key (first 12 chars):', SUPABASE_ANON_KEY.slice(0, 12) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function headCount(table) {
  const t0 = performance.now();
  const { error, count } = await supabase
    .from(table)
    .select('*', { head: true, count: 'exact' });
  const ms = Math.round(performance.now() - t0);
  if (error) throw Object.assign(error, { table });
  return { table, count: count ?? 0, ms };
}

(async () => {
  try {
    // Basic probe (menu_items)
    const probe = await headCount('menu_items');
    exitJson(true, `Connected. menu_items rows: ${probe.count}`);
  } catch (e) {
    exitJson(false, `Initial probe failed: ${e.message}`);
  }

  const tables = ['ingredients','menu_items','menu_item_ingredients','orders','order_items'];
  console.log('\n📊 Table counts:');
  const results = [];
  for (const t of tables) {
    try {
      const r = await headCount(t);
      results.push(r);
      console.log(`   ✅ ${t.padEnd(24)} ${String(r.count).padStart(5)} rows (${r.ms}ms)`);
    } catch (e) {
      console.log(`   ❌ ${t.padEnd(24)} error: ${e.message}`);
    }
  }

  const slow = results.filter(r => r.ms > 800);
  if (slow.length) {
    console.log('\n⚠️ Slow queries detected (>800ms):', slow.map(s => `${s.table}(${s.ms}ms)`).join(', '));
  }

  console.log('\n✨ Done. Next steps:');
  console.log('   1. Seed data if counts are 0');
  console.log('   2. Tighten RLS policies before production');
  console.log('   3. Implement RPC for atomic order creation');
  console.log('   4. Use service_role key only in secure server code');
})();
