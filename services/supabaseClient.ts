/// <reference types="../vite-env.d.ts" />
import { createClient } from '@supabase/supabase-js';

// Vite exposes env vars prefixed with VITE_ via import.meta.env
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Remote sync disabled until provided.');
    return undefined;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = initSupabase();

// Basic typed table helpers (adjust once you enable generated types)
export interface DbIngredient {
  id: string; // uuid
  name: string;
  unit: string;
  stock: number;
  min_stock_level: number;
  cost_per_unit: number;
  created_at?: string;
}

export interface DbMenuItemIngredientRef { // junction table
  id: string; // uuid
  menu_item_id: string;
  ingredient_id: string;
  quantity: number; // numeric quantity used per menu item
}

export interface DbMenuItem {
  id: string; // uuid
  name: string;
  category: string;
  price: number;
  cost: number;
  image: string;
  description?: string;
  is_ready_made?: boolean;
  ready_made_stock_id?: string;
  created_at?: string;
}

export interface DbOrderItemRef { // order items referencing menu items
  id: string; // uuid
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_each: number; // snapshot price when ordered
}

export interface DbOrder {
  id: string; // uuid
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: 'CASH' | 'KBZ_PAY';
  status: 'COMPLETED' | 'REFUNDED';
  cashier_name: string;
  created_at: string; // timestamptz
}

// Fetch helpers
export async function fetchMenuWithIngredients() {
  // Requires a Postgres view or RPC for efficient fetch; for now do two queries
  const { data: menu, error: menuError } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (menuError) throw menuError;

  const { data: refs, error: refError } = await supabase
    .from('menu_item_ingredients')
    .select('*');

  if (refError) throw refError;

  return { menu, refs };
}

export async function fetchInventory() {
  const { data, error } = await supabase.from('ingredients').select('*');
  if (error) throw error;
  return data as DbIngredient[];
}

export async function createOrder(order: Omit<DbOrder, 'id' | 'created_at'>, items: Array<Omit<DbOrderItemRef,'id' | 'order_id'>>) {
  // NOTE: Not atomic. For production wrap in an RPC or Edge Function transaction.
  const { data: orderInserted, error: orderError } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (orderError) throw orderError;

  const orderId = orderInserted.id;
  const itemsToInsert = items.map(i => ({ ...i, order_id: orderId }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  return orderInserted as DbOrder;
}

// Additional helper functions for CRUD operations

// Menu Items
export async function addMenuItem(item: Omit<DbMenuItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data as DbMenuItem;
}

export async function updateMenuItem(id: string, updates: Partial<Omit<DbMenuItem, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbMenuItem;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Ingredients
export async function addIngredient(ingredient: Omit<DbIngredient, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('ingredients')
    .insert(ingredient)
    .select()
    .single();

  if (error) throw error;
  return data as DbIngredient;
}

export async function updateIngredient(id: string, updates: Partial<Omit<DbIngredient, 'id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('ingredients')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbIngredient;
}

export async function deleteIngredient(id: string) {
  const { error } = await supabase
    .from('ingredients')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Update ingredient stock (for inventory management)
export async function updateIngredientStock(id: string, newStock: number) {
  return updateIngredient(id, { stock: newStock });
}

// Orders
export async function fetchOrders(limit = 100) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as DbOrder[];
}

export async function fetchOrderWithItems(orderId: string) {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  return { order: order as DbOrder, items: items as DbOrderItemRef[] };
}

export async function fetchOrdersWithItems(limit = 100) {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (ordersError) throw ordersError;

  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      return {
        ...order,
        items: items || []
      };
    })
  );

  return ordersWithItems;
}

// Test connection
export async function testConnection() {
  if (!supabase) {
    return { success: false, message: 'Supabase not configured' };
  }
  try {
    const { error, count } = await supabase
      .from('menu_items')
      .select('*', { head: true, count: 'exact' });

    if (error) throw error;
    return { success: true, message: 'Connected to Supabase. menu_items count: ' + (count ?? 0) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Migration function to move local orders from localStorage to Supabase database
export async function migrateLocalOrdersToDatabase(localOrders: Order[]) {
  if (!supabase) {
    console.warn('Supabase not initialized. Cannot migrate orders.');
    return;
  }

  console.log(`🔄 Migrating ${localOrders.length} local orders to database...`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const order of localOrders) {
    try {
      // Check if order already exists in database (by ID)
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('id', order.id)
        .single();

      if (existingOrder) {
        console.log(`⏭️ Order ${order.id} already exists in database, skipping`);
        skippedCount++;
        continue;
      }

      // Convert local order format to database format
      const dbOrder = {
        subtotal: order.subtotal,
        tax: order.tax,
        discount: order.discount,
        total: order.total,
        payment_method: order.paymentMethod,
        status: order.status,
        cashier_name: order.cashierName
      };

      const orderItems = order.items.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price_each: item.price
      }));

      await createOrder(dbOrder, orderItems);
      migratedCount++;
      console.log(`✅ Migrated order ${order.id}`);
    } catch (error) {
      console.error(`❌ Failed to migrate order ${order.id}:`, error);
    }
  }

  console.log(`🎉 Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`);
  return { migratedCount, skippedCount };
}
