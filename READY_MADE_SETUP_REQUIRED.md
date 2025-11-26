# ✅ Ready-Made Drinks Feature - Database Setup Required

## Problem Solved
The ready-made drinks were disappearing because the database table `menu_items` was missing the columns to store `is_ready_made` and `ready_made_stock_id`.

## What Changed
1. **Database Schema**: Added 2 new columns to `menu_items` table
   - `is_ready_made` (boolean) - marks if item is ready-made
   - `ready_made_stock_id` (uuid) - links to inventory stock

2. **Code Updated**:
   - `SupabaseSync.tsx` - reads/writes ready-made fields
   - `MenuManager.tsx` - saves ready-made metadata  
   - `supabaseClient.ts` - interface updated

## 🚀 Required Action: Run SQL in Supabase

**You MUST run this SQL script in Supabase Dashboard:**

1. Open: https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new

2. Copy the entire content from: `setup-ready-made-drinks.sql`

3. Paste and click "Run" (or Cmd+Enter)

This script will:
- ✅ Add `is_ready_made` and `ready_made_stock_id` columns
- ✅ Add CRUD policies  
- ✅ Insert 4 inventory items (Coca-Cola, Sprite, Water, Juice)
- ✅ Insert 4 menu items with ready-made flags
- ✅ Reload schema cache

## What the SQL Does

```sql
-- Adds columns
ALTER TABLE menu_items 
ADD COLUMN is_ready_made boolean DEFAULT false,
ADD COLUMN ready_made_stock_id uuid REFERENCES ingredients(id);

-- Inserts inventory
INSERT INTO ingredients (name, unit, stock, ...)
VALUES ('Coca-Cola Can', 'cans', 50, ...);

-- Inserts menu items with links
INSERT INTO menu_items (name, category, is_ready_made, ready_made_stock_id, ...)
VALUES ('Coca-Cola', 'Drinks', true, <ingredient_id>, ...);
```

## After Running SQL

1. **Refresh your app** (hard refresh: Cmd+Shift+R)

2. **Go to POS → Drinks category**

3. **You should see:**
   - Coca-Cola with blue "🥤 READY" badge + "50 left"
   - Sprite with blue "🥤 READY" badge + "50 left"
   - Mineral Water with blue "🥤 READY" badge + "100 left"
   - Orange Juice with blue "🥤 READY" badge + "30 left"

4. **They will NOT disappear** - they're now persisted in database

## How It Works Now

```
User adds Coca-Cola to cart
↓
POS checks: is_ready_made = true
↓
POS looks up: ready_made_stock_id → finds "Coca-Cola Can" in inventory
↓
POS shows: "50 left" (from inventory stock)
↓
User completes order
↓
System deducts: Coca-Cola Can stock -1 (now 49)
↓
Next customer sees: "49 left"
```

## Verification Steps

After running SQL:

```bash
# 1. Check database (in Supabase SQL Editor):
SELECT name, is_ready_made, ready_made_stock_id 
FROM menu_items 
WHERE is_ready_made = true;

# Should show 4 rows: Coca-Cola, Sprite, Mineral Water, Orange Juice

# 2. Check inventory:
SELECT name, unit, stock 
FROM ingredients 
WHERE name LIKE '%Can%' OR name LIKE '%Bottle%' OR name LIKE '%Box%';

# Should show 4 rows with stock counts
```

## Files Created/Updated

**Created:**
- `setup-ready-made-drinks.sql` - Run this in Supabase!
- `supabase/migrations/0002_add_ready_made_support.sql` - Migration file

**Updated:**
- `components/SupabaseSync.tsx` - reads `is_ready_made`, `ready_made_stock_id`
- `components/MenuManager.tsx` - saves ready-made fields
- `services/supabaseClient.ts` - DbMenuItem interface updated

## Why It Was Disappearing Before

**Problem:**
- Ready-made drinks existed in `INITIAL_MENU` (constants.ts)
- They appeared briefly from local cache
- SupabaseSync fetched from database
- Database didn't have `is_ready_made`/`ready_made_stock_id` columns
- Drinks loaded but without ready-made flags
- POS couldn't find stock link → treated as unavailable
- Disappeared after 1 second

**Solution:**
- Database now stores ready-made metadata
- SupabaseSync reads it correctly
- POS finds stock link
- Drinks persist permanently

## Build Status

```
✅ TypeScript: No errors
✅ Build: Successful (797.80 KB)
✅ Code: Ready to use
⚠️  Database: Needs SQL script (setup-ready-made-drinks.sql)
```

## Quick Checklist

- [ ] Run `setup-ready-made-drinks.sql` in Supabase Dashboard
- [ ] Wait for "Success" message
- [ ] Hard refresh browser (Cmd+Shift+R)
- [ ] Open POS → Drinks category
- [ ] See 4 ready-made drinks with badges
- [ ] Click one, add to cart
- [ ] See stock counter decrease
- [ ] Complete order
- [ ] Check inventory - stock decreased
- [ ] Refresh page - drinks still there! ✅

## Need Help?

**SQL Script Location:**
`/Users/aunghtet/Desktop/projects/lonemalaypos/setup-ready-made-drinks.sql`

**Supabase Dashboard:**
https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new

**Just copy the entire SQL file content and run it!**

---

Made with ❤️ by GitHub Copilot  
Date: November 25, 2025

