<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1R_7JKOsYLko6F5XcTAnt7leCfKqdWB8g

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env.local` (see Supabase Integration below)
3. Run the app:
   ```bash
   npm run dev
   ```

## 🚀 Supabase Database Integration

Your app is ready for Supabase cloud database! Follow these steps:

### Quick Setup (5 minutes)

1. **Get Supabase Credentials**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create/select your project
   - Go to **Settings → API**
   - Copy your **Project URL** and **anon key**

2. **Configure Environment Variables**
   - Open `.env.local` in project root
   - Replace placeholders with your actual credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Set Up Database Tables**
   - In Supabase, go to **SQL Editor**
   - Copy content from `supabase-setup.sql`
   - Paste and run in SQL Editor

4. **Start Your App**
   ```bash
   npm run dev
   ```

**📖 For detailed instructions, see [QUICK_START.md](QUICK_START.md)**

### Files Created for You

- ✅ `.env.local` - Environment variables template
- ✅ `supabase-setup.sql` - Complete database schema
- ✅ `SUPABASE_SETUP.md` - Comprehensive guide
- ✅ `QUICK_START.md` - Quick reference
- ✅ `setup-supabase.sh` - Setup verification script
- ✅ `components/SupabaseTestPanel.tsx` - Connection tester

### Database Schema

Your database includes:

```sql
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
```
4. Enable Row Level Security and add policies (example allowing anon read, insert):

```sql
alter table ingredients enable row level security;
alter table menu_items enable row level security;
alter table menu_item_ingredients enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Basic read policies (adjust for auth later)
create policy "Public read ingredients" on ingredients for select using (true);
create policy "Public read menu" on menu_items for select using (true);
create policy "Public read menu item ingredients" on menu_item_ingredients for select using (true);
create policy "Public read orders" on orders for select using (true);
create policy "Public read order items" on order_items for select using (true);

-- Allow inserts (tighten later)
create policy "Public insert orders" on orders for insert with check (true);
create policy "Public insert order items" on order_items for insert with check (true);
```
5. Start app: `npm run dev` — remote data auto-syncs via `SupabaseSync` component.
6. Later: Replace permissive policies with authenticated ones (email magic link or service role via Edge Function) for production.

> Note: If remote rows are empty the app falls back to local constants.

## 🔗 Backend / Postgres Service Role Integration

A minimal Express backend is included to perform privileged/atomic operations (e.g., order creation) using the Supabase service role key.

### Why use a backend?
- Keep service_role key secret (never expose it to the browser)
- Perform multi-step transactional logic (orders + items)
- Add rate limiting and security headers

### Setup Steps
1. Copy `.env.example` to `.env.local` and add:
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BACKEND_PORT=4000
VITE_SUPABASE_URL=... (same as frontend)
VITE_SUPABASE_ANON_KEY=... (same as frontend)
```
2. Install dependencies (already done if you ran npm install):
```
npm install
```
3. Run backend:
```
npm run backend
```
4. Test health endpoint:
```
curl http://localhost:4000/health
```
5. Create an order (example payload):
```
curl -X POST http://localhost:4000/orders \
  -H 'Content-Type: application/json' \
  -d '{
    "order": {"subtotal":1000,"tax":0,"discount":0,"total":1000,"payment_method":"CASH","status":"COMPLETED","cashier_name":"John"},
    "items": [{"menu_item_id":"<uuid>","quantity":1,"price_each":1000}]
  }'
```

### Hardening Suggestions
- Replace naive rollback with Postgres RPC function (transaction) for atomicity.
- Introduce JWT auth and restrict RLS policies.
- Add validation (Zod / Joi) for request payloads.
- Add separate route for inventory stock deduction inside transaction.

### Next (Optional)
- Implement `create_order_with_items` RPC and call via `supabase.rpc()`.
- Add `/orders/:id` endpoint returning items + order.

---

