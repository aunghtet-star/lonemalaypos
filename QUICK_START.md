# 🎯 Quick Start: Supabase Integration

## What I've Set Up For You

I've configured your Lone Malay POS application for Supabase integration. Here's what's ready:

### ✅ Files Created/Updated

1. **`.env.local`** - Environment variables template (needs your credentials)
2. **`supabase-setup.sql`** - Complete database schema with tables, policies, and indexes
3. **`SUPABASE_SETUP.md`** - Comprehensive setup guide
4. **`setup-supabase.sh`** - Automated setup checker script
5. **`components/SupabaseTestPanel.tsx`** - Debug panel to test connection
6. **`services/supabaseClient.ts`** - Already configured with CRUD helpers

### 📋 What You Need To Do

#### Step 1: Get Supabase Credentials (5 minutes)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project OR select existing project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (e.g., `https://abcdefghijk.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

#### Step 2: Update Environment Variables (1 minute)

Open `.env.local` in your project and replace the placeholders:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

**Important:** The file `.env.local` is already in your project root!

#### Step 3: Set Up Database Tables (2 minutes)

1. In Supabase Dashboard, click **SQL Editor**
2. Click **New Query**
3. Open the file `supabase-setup.sql` from your project
4. Copy ALL the content and paste into SQL Editor
5. Click **Run** (or press Ctrl+Enter)

This creates:
- ✅ 5 tables (ingredients, menu_items, menu_item_ingredients, orders, order_items)
- ✅ Security policies (Row Level Security)
- ✅ Performance indexes
- ✅ Verification queries

#### Step 4: Test Connection (1 minute)

Run your app:
```bash
npm run dev
```

Then open in browser and check:
- Console should show connection status
- Or temporarily add the test panel to verify

### 🔧 Optional: Add Test Panel

To visually test your connection, add this to `App.tsx`:

```typescript
import SupabaseTestPanel from './components/SupabaseTestPanel';

// Inside your component JSX:
<SupabaseTestPanel />
```

This adds a floating debug panel in the bottom-right corner with buttons to test connection and fetch data.

### 📊 Database Schema

Your database has these tables:

```
ingredients
├── id (uuid)
├── name (text)
├── unit (text)
├── stock (integer)
├── min_stock_level (integer)
├── cost_per_unit (numeric)
└── created_at (timestamp)

menu_items
├── id (uuid)
├── name (text)
├── category (text)
├── price (numeric)
├── cost (numeric)
├── image (text)
├── description (text)
└── created_at (timestamp)

menu_item_ingredients (junction table)
├── id (uuid)
├── menu_item_id (uuid) → menu_items.id
├── ingredient_id (uuid) → ingredients.id
└── quantity (numeric)

orders
├── id (uuid)
├── subtotal (numeric)
├── tax (numeric)
├── discount (numeric)
├── total (numeric)
├── payment_method (CASH|KBZ_PAY)
├── status (COMPLETED|REFUNDED)
├── cashier_name (text)
└── created_at (timestamp)

order_items
├── id (uuid)
├── order_id (uuid) → orders.id
├── menu_item_id (uuid) → menu_items.id
├── quantity (integer)
└── price_each (numeric)
```

### 🔌 Available API Functions

The `supabaseClient.ts` provides these ready-to-use functions:

```typescript
// Menu Management
await fetchMenuWithIngredients()
await addMenuItem(item)
await updateMenuItem(id, updates)
await deleteMenuItem(id)

// Inventory Management
await fetchInventory()
await addIngredient(ingredient)
await updateIngredient(id, updates)
await deleteIngredient(id)
await updateIngredientStock(id, newStock)

// Order Management
await createOrder(order, items)
await fetchOrders(limit)
await fetchOrderWithItems(orderId)

// Connection Test
await testConnection()
```

### 🎯 How It Works

```
┌─────────────┐
│   Browser   │
│    (React)  │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│ supabaseClient.ts   │  ← Your credentials from .env.local
│ (API Layer)         │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  Supabase Cloud     │
│  (PostgreSQL)       │
└─────────────────────┘
```

When you start your app:
1. `SupabaseSync.tsx` component loads
2. Tries to fetch menu and inventory from Supabase
3. If successful → uses cloud data
4. If fails → falls back to local `INITIAL_MENU` and `INITIAL_INGREDIENTS`

### ⚠️ Troubleshooting

**"Supabase env vars missing" warning:**
- Make sure `.env.local` exists in project root
- Restart dev server after editing `.env.local`
- Variables must start with `VITE_`

**"Failed to fetch" or connection errors:**
- Double-check your Supabase URL and key
- Verify tables are created in Supabase
- Check RLS policies are enabled
- Look at browser console for detailed errors

**Tables not showing up:**
- Make sure you ran the ENTIRE SQL script
- Check you're in the correct Supabase project
- Go to Table Editor to verify

### 🚀 Next Steps After Setup

1. **Add sample data** (optional):
   - Uncomment the sample data section in `supabase-setup.sql`
   - Run just that section in SQL Editor

2. **Test CRUD operations**:
   - Try adding a menu item through your UI
   - Check if it appears in Supabase Table Editor

3. **Set up authentication** (for production):
   - Enable Supabase Auth
   - Restrict RLS policies to authenticated users

4. **Deploy**:
   - Add environment variables to your hosting platform
   - Vercel/Netlify: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### 📚 Resources

- **Full Guide**: See `SUPABASE_SETUP.md` for detailed documentation
- **SQL Schema**: See `supabase-setup.sql` for database structure
- **Supabase Docs**: https://supabase.com/docs
- **Your Supabase Dashboard**: https://app.supabase.com

### ✅ Verification Checklist

- [ ] Created Supabase project
- [ ] Copied credentials to `.env.local`
- [ ] Ran SQL script in Supabase SQL Editor
- [ ] Started dev server with `npm run dev`
- [ ] Checked browser console - no connection errors
- [ ] (Optional) Tested with SupabaseTestPanel

---

**Need help?** Check `SUPABASE_SETUP.md` for troubleshooting or run `./setup-supabase.sh` to verify your setup!

**Ready to connect?** Just add your credentials to `.env.local` and run the SQL script! 🎉

