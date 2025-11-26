# Supabase Integration Guide for Lone Malay POS

This guide will help you connect your POS system to Supabase database for persistent cloud storage.

## Prerequisites

- Node.js installed
- A Supabase account (free tier works fine)
- Your Supabase project created

## Step-by-Step Setup

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click on your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long string starting with `eyJ...`)

### 2. Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Important:** Never commit `.env.local` to version control! It's already in `.gitignore`.

### 3. Set Up Database Tables

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-setup.sql` file
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

This will:
- ✅ Create all necessary tables (ingredients, menu_items, orders, etc.)
- ✅ Set up Row Level Security (RLS)
- ✅ Create security policies
- ✅ Add performance indexes
- ✅ Verify the setup

### 4. Verify Database Setup

After running the SQL script, you should see:

```
✓ 5 tables created
✓ RLS enabled on all tables
✓ Security policies created
✓ Indexes created
```

You can verify by going to **Table Editor** in Supabase and you should see:
- ingredients
- menu_items
- menu_item_ingredients
- orders
- order_items

### 5. Install Dependencies (if not already done)

```bash
npm install
```

This will install `@supabase/supabase-js` (already in package.json).

### 6. Run the Application

```bash
npm run dev
```

The application will:
1. Try to connect to Supabase
2. Load menu and inventory from the cloud database
3. Fall back to local data if connection fails
4. Show sync status in the UI

### 7. Test the Connection

1. Open your app in the browser (usually `http://localhost:5173`)
2. Check the browser console for any Supabase warnings
3. If you see "Syncing remote data..." → Connection is working!
4. If you see an error → Check your credentials in `.env.local`

## How It Works

### Data Flow

```
Local App ←→ Supabase Client (supabaseClient.ts) ←→ Supabase Cloud Database
```

### Key Files

- **`services/supabaseClient.ts`** - Supabase client configuration and database helpers
- **`components/SupabaseSync.tsx`** - Loads data from Supabase on app start
- **`.env.local`** - Your private configuration (not committed to git)
- **`supabase-setup.sql`** - Database schema and policies

### Features

✅ **Real-time sync** - Data is stored in the cloud
✅ **Offline support** - Falls back to local data if offline
✅ **Type-safe** - Full TypeScript support
✅ **Secure** - Row Level Security policies
✅ **Scalable** - Uses Supabase's PostgreSQL database

## API Operations

The `supabaseClient.ts` provides these helper functions:

```typescript
// Fetch menu with ingredients
const { menu, refs } = await fetchMenuWithIngredients();

// Fetch inventory
const inventory = await fetchInventory();

// Create an order with items
const order = await createOrder(orderData, orderItems);
```

## Troubleshooting

### "Supabase env vars missing" warning

- ✅ Make sure `.env.local` exists in project root
- ✅ Check that variable names start with `VITE_`
- ✅ Restart the dev server after changing `.env.local`

### "Remote sync failed" error

- ✅ Verify your Supabase URL and key are correct
- ✅ Check that database tables are created
- ✅ Ensure RLS policies are set up
- ✅ Check browser console for detailed error

### Tables not appearing in Supabase

- ✅ Make sure you ran the SQL script in the SQL Editor
- ✅ Check that you're looking at the correct project
- ✅ Try running the verification queries at the end of the SQL script

### Data not syncing

1. Open browser DevTools → Console
2. Look for errors related to Supabase
3. Check Network tab for failed API calls
4. Verify RLS policies allow your operations

## Security Notes

### Current Setup (Development)

The current policies allow **public access** for development purposes. This is fine for testing but should be restricted for production.

### Production Recommendations

1. **Enable Authentication**
   ```sql
   -- Example: Restrict to authenticated users only
   CREATE POLICY "Authenticated read" ON ingredients 
   FOR SELECT USING (auth.role() = 'authenticated');
   ```

2. **Add User Roles**
   - Cashiers: Can create orders, view menu
   - Managers: Can edit menu, view reports
   - Admins: Full access

3. **Use Environment Variables in Production**
   - For Netlify/Vercel: Add env vars in dashboard
   - Never commit `.env.local` to git

## Data Migration

### Import Existing Data

If you have existing data in localStorage:

1. The app will continue to work with localStorage
2. To migrate to Supabase:
   - Export data from localStorage
   - Insert into Supabase tables via SQL Editor or API
   - Disable localStorage fallback

### Export from Supabase

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

## Next Steps

- [ ] Add your Supabase credentials to `.env.local`
- [ ] Run the SQL setup script
- [ ] Test the connection with `npm run dev`
- [ ] Optionally add sample data
- [ ] Set up authentication (optional)
- [ ] Deploy to production

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Community: https://github.com/supabase/supabase/discussions
- Project Issues: Check your project's README

---

**Ready to go?** Follow steps 1-6 above to get started! 🚀

