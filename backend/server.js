#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = process.env.BACKEND_PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Atomic order creation (simplified; better with Postgres transaction via RPC)
app.post('/orders', async (req, res) => {
  const { order, items } = req.body || {};
  if (!order || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'order and items array required' });
  }

  try {
    // Insert order
    const { data: insertedOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(order)
      .select()
      .single();
    if (orderError) throw orderError;

    const orderId = insertedOrder.id;
    const itemsToInsert = items.map(i => ({ ...i, order_id: orderId }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsToInsert);
    if (itemsError) {
      // Attempt rollback (best-effort)
      await supabaseAdmin.from('orders').delete().eq('id', orderId);
      throw itemsError;
    }

    res.status(201).json({ orderId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List orders with count
app.get('/orders', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ orders: data, count: data.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

