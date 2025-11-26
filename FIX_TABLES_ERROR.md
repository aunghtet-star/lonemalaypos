# 🔧 Fix: "Could not find the table 'public.menu_items'"

## The Problem
Your Supabase database doesn't have the required tables yet. The migration needs to be applied.

## ✅ Solution: Apply Migration via Supabase Dashboard

### Step 1: Open SQL Editor
Go to: **https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new**

### Step 2: Copy the SQL Below

```sql
-- Initial schema migration
-- Creates all required tables for the POS system

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,
  stock integer not null default 0,
  min_stock_level integer not null default 0,
  cost_per_unit numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price numeric not null,
  cost numeric not null,
  image text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists menu_item_ingredients (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  quantity numeric not null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  subtotal numeric not null,
  tax numeric not null,
  discount numeric not null,
  total numeric not null,
  payment_method text check (payment_method in ('CASH','KBZ_PAY')) not null,
  status text check (status in ('COMPLETED','REFUNDED')) not null,
  cashier_name text not null,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  quantity integer not null,
  price_each numeric not null
);

-- Enable Row Level Security
alter table ingredients enable row level security;
alter table menu_items enable row level security;
alter table menu_item_ingredients enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Development policies (allows all operations)
create policy "dev_all_ing" on ingredients for all using (true) with check (true);
create policy "dev_all_menu" on menu_items for all using (true) with check (true);
create policy "dev_all_refs" on menu_item_ingredients for all using (true) with check (true);
create policy "dev_all_orders" on orders for all using (true) with check (true);
create policy "dev_all_order_items" on order_items for all using (true) with check (true);
```

### Step 3: Run the SQL
1. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
2. Wait for "Success. No rows returned" message
3. Check the Tables view to verify all tables are created

### Step 4: Verify Tables Created
Go to: **https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/editor**

You should see these 5 tables:
- ✅ ingredients
- ✅ menu_items
- ✅ menu_item_ingredients
- ✅ orders
- ✅ order_items

### Step 5: Test Connection
```bash
npm run test:connection
```

You should now see: ✅ All tables found!

### Step 6: Restart Dev Server
```bash
pkill -f vite
npm run dev
```

Open: **http://localhost:3000**

The "Supabase sync failed" error should be gone! 🎉

---

## Alternative: Use Management API (if you have service key)

If you've added your service role key to `.env.local`:

```bash
node setup-database.js
```

---

## Quick Links

- **SQL Editor:** https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new
- **Tables View:** https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/editor
- **API Settings:** https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/settings/api

---

## Why This Happened

The `test-connection.js` script showed 0 rows but didn't actually check if the tables exist. The Supabase client was failing silently. Now with the tables created, your app will work properly!

