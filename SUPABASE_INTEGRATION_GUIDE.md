# Supabase Integration Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your Service Role Key

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **qfhiurggryjzvyjfugcy**
3. Go to **Settings** → **API**
4. Copy the **service_role** key (keep this secret!)

### Step 2: Update Environment Variables

Open `.env.local` and replace `YOUR_SERVICE_ROLE_KEY_HERE` with your actual service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
```

### Step 3: Setup Database Schema

You have **two options**:

#### Option A: Automatic Setup (Recommended)
```bash
npm run db:setup
```

#### Option B: Manual Setup via Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. Copy the contents of `supabase/migrations/0001_init.sql`
3. Paste and click "Run"

### Step 4: Test Connection

```bash
npm run test:connection
```

You should see: ✅ Connection successful!

### Step 5: Start Your Application

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend API (optional):**
```bash
npm run backend
```

**Open:** http://localhost:3000

---

## 📚 Supabase CLI Commands

### Link to Remote Project
```bash
npm run supabase:link
```
Then enter your project ref: `qfhiurggryjzvyjfugcy`

### Check Status
```bash
npm run supabase:status
```

### Push Migrations to Remote Database
```bash
npm run supabase:push
```

### Start Local Supabase (for development)
```bash
npm run supabase:start
```

### Stop Local Supabase
```bash
npm run supabase:stop
```

---

## 🔧 Architecture Overview

### Frontend (React + Vite)
- **Port:** 3000
- **Supabase Client:** `services/supabaseClient.ts`
- **Uses:** Anon key (public, safe for frontend)

### Backend (Express API)
- **Port:** 4000
- **File:** `backend/server.js`
- **Uses:** Service role key (private, full access)

### Database Tables
1. **ingredients** - Store raw materials
2. **menu_items** - Restaurant menu items
3. **menu_item_ingredients** - Junction table (many-to-many)
4. **orders** - Completed orders
5. **order_items** - Items in each order

---

## 🔐 Security Notes

### Row Level Security (RLS)
Your database has RLS enabled with development policies. For production:

1. Go to Supabase Dashboard → Authentication
2. Set up user authentication
3. Update policies in `supabase/migrations/0001_init.sql`
4. Replace `using (true)` with proper user checks

### Environment Variables
- ✅ **Frontend:** `VITE_*` variables (safe to expose)
- ❌ **Backend:** `SUPABASE_SERVICE_ROLE_KEY` (NEVER expose to frontend)

---

## 🐛 Troubleshooting

### White Screen on Frontend?
1. Check browser console (F12) for errors
2. Verify `.env.local` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server: `npm run dev`

### Backend Connection Failed?
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
2. Check if tables exist: Run `npm run test:connection`
3. If no tables, run: `npm run db:setup`

### Migration Errors?
1. Check Supabase Dashboard → Database → Tables
2. If tables already exist, you're good!
3. If not, use manual setup (Option B above)

---

## 📖 Next Steps

1. ✅ Set up service role key
2. ✅ Run database setup
3. ✅ Test connection
4. 🔄 Start development servers
5. 🎨 Customize your POS system
6. 🚀 Deploy to production

---

## 🆘 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **This Project:** Check `QUICK_START.md` and `README.md`
- **CLI Reference:** `supabase --help`

---

**Your Supabase Project:**
- URL: https://qfhiurggryjzvyjfugcy.supabase.co
- Project Ref: qfhiurggryjzvyjfugcy
- Dashboard: https://app.supabase.com/project/qfhiurggryjzvyjfugcy

