# 🚀 Quick Fix Guide - White Screen Issue

## Problem
Your browser shows a white screen because the database schema cache needs to be reloaded after creating tables.

## ✅ Solution (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/sql/new

### Step 2: Run Complete Setup SQL
1. Open the file: `complete-setup.sql` in your project
2. Copy ALL the SQL content
3. Paste it into the Supabase SQL Editor
4. Click "Run" button (or press Cmd/Ctrl + Enter)

This single SQL file will:
- ✅ Create all required tables
- ✅ Enable Row Level Security (RLS)
- ✅ Set up proper access policies
- ✅ Seed initial data (menu items and ingredients)
- ✅ Reload the schema cache

### Step 3: Verify Setup
```bash
node setup-helper.js
```

You should see all green checkmarks ✅

### Step 4: Start Development Server
```bash
npm run dev
```

Open http://localhost:3001 in your browser

## 🎯 Expected Result
You should now see:
- 🔐 Login screen with "Open Register" button
- 📊 Working POS system after clicking login
- 🍔 Menu items loaded from database
- 📦 Inventory management working

## 🔧 If Issues Persist

### Problem: Tables still not found
**Solution:** Manually refresh schema cache in Supabase
1. Go to: https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/settings/api
2. Scroll to "Connection String"
3. Click "Reset API" button
4. Wait 30 seconds
5. Retry: `node setup-helper.js`

### Problem: RLS blocking access
**Solution:** Run only the RLS section from `complete-setup.sql`
- Copy lines 70-95 (the RLS policies section)
- Run in SQL Editor

### Problem: Cannot connect to database
**Solution:** Check your `.env.local` file has correct values:
```env
VITE_SUPABASE_URL=https://qfhiurggryjzvyjfugcy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 Project Scripts

```bash
# Database Management
npm run test:connection     # Test Supabase connection
node setup-helper.js        # Check setup status
node seed-database.js       # Seed more data (after setup)

# Development
npm run dev                 # Start frontend (port 3001)
npm run backend             # Start backend (port 4000)

# Supabase CLI (Optional)
npm run supabase:login      # Login to Supabase CLI
npm run supabase:status     # Check local Supabase status
```

## 🏗️ Database Schema

### Tables Created
1. **ingredients** - Raw materials tracking
2. **menu_items** - Restaurant menu
3. **menu_item_ingredients** - Recipe compositions
4. **orders** - Customer orders
5. **order_items** - Order line items

### Default Data Seeded
- 6 ingredients (Burger Bun, Beef Patty, Cheese, etc.)
- 5 menu items (Burgers, Drinks, Salad)

## 🔐 Security Notes

**Development Mode:** All tables have permissive RLS policies (anyone can read/write)

**Before Production:** Update policies in `complete-setup.sql` to:
- Require authentication
- Restrict write access to admin roles
- Add audit logging

## 📞 Need Help?

1. Check setup status: `node setup-helper.js`
2. View detailed logs: `npm run dev` and check console
3. Test connection: `npm run test:connection`

## ✨ You're All Set!

Once setup is complete, you'll have a fully functional POS system with:
- 💳 Point of Sale interface
- 📊 Analytics dashboard
- 📦 Inventory management
- 📜 Order history
- 🍽️ Menu management
- ☁️ Cloud sync with Supabase

Happy coding! 🎉

