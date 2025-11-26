-- Initial schema migration derived from supabase-setup.sql
-- Run: npm run supabase:db:push

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

-- Enable RLS
alter table ingredients enable row level security;
alter table menu_items enable row level security;
alter table menu_item_ingredients enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Development policies (loose)
create policy "dev_select_ing" on ingredients for select using (true);
create policy "dev_select_menu" on menu_items for select using (true);
create policy "dev_select_refs" on menu_item_ingredients for select using (true);
create policy "dev_select_orders" on orders for select using (true);
create policy "dev_select_order_items" on order_items for select using (true);
create policy "dev_insert_orders" on orders for insert with check (true);
create policy "dev_insert_order_items" on order_items for insert with check (true);

