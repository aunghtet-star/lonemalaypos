# Product Variant Feature Implementation

## Overview
The POS system now supports product variants, allowing a single menu item (like Fried Rice) to have multiple protein options (Chicken, Pork, Seafood) without creating separate menu entries for each variant.

## ✨ What's New

### 1. **Menu Item Variants**
- Menu items can now have multiple variants (e.g., protein choices)
- Each variant can have its own price modifier
- Customers select their preferred variant when ordering

### 2. **Persistent Table Orders**
- Active orders are now saved to localStorage
- Orders persist when switching between tabs
- Never lose an in-progress order when navigating the app

## 🎯 How to Use

### Adding a Product with Variants

1. **Navigate to Menu Management**
   - Go to the "Edit Menu" tab

2. **Create or Edit a Menu Item**
   - Click "Add New Dish" or edit an existing item
   - Fill in the basic details (name, category, price, etc.)

3. **Enable Variants**
   - Check the "Has Protein Variants" checkbox
   - Default variants (Chicken, Pork, Seafood) will be added automatically

4. **Configure Variants**
   - For each variant, set:
     - **Name**: The variant name (e.g., "Chicken", "Pork", "Seafood")
     - **Price Modifier**: Amount to add to base price
       - Use `0` for no price change
       - Use positive numbers to increase price (e.g., `500` for +500 Ks)
       - Example: Seafood variant might cost +1000 Ks more

5. **Add More Variants**
   - Click "+ Add Variant" to create additional options
   - Remove unwanted variants with the trash icon

6. **Save**
   - Click "Add Item" or "Update Item" to save

### Ordering Items with Variants

1. **In the POS (Register) Screen**
   - Select a table or parcel location
   - Click on a menu item that has variants

2. **Choose Variant - Modal Appears EVERY TIME** ⭐
   - **Important**: The variant selection modal appears **every single time** you tap the item
   - This allows you to add different variants to the same order
   - Example: Tap "Fried Rice" → Select Chicken → Tap "Fried Rice" again → Select Pork
   - Both variants will be in the cart separately

3. **Variant Selection Modal Shows:**
   - Protein icon (🐔 for Chicken, 🐷 for Pork, 🦐 for Seafood)
   - Final price with modifier applied
   - Click on your preferred variant to add to cart

4. **Item Added to Cart**
   - The item appears in the cart with the variant name
   - Example: "Fried Rice (Chicken)"
   - Price reflects the variant modifier
   - **You can have multiple variants of the same item in cart**
     - Fried Rice (Chicken) x2
     - Fried Rice (Pork) x1
     - Fried Rice (Seafood) x3

## 📊 Example Use Cases

### Fried Rice with Proteins
```
Base Item: Fried Rice - 3000 Ks

Variants:
- Chicken: +0 Ks → Final: 3000 Ks
- Pork: +500 Ks → Final: 3500 Ks  
- Seafood: +1000 Ks → Final: 4000 Ks
```

### Curry Dishes
```
Base Item: Curry - 5000 Ks

Variants:
- Chicken: +0 Ks → Final: 5000 Ks
- Mutton: +1500 Ks → Final: 6500 Ks
- Fish: +1000 Ks → Final: 6000 Ks
```

## 🗄️ Database Setup

To enable variants in your Supabase database, run the migration:

1. Open Supabase SQL Editor
2. Run the file: `add-variant-support.sql`
3. This adds:
   - `has_variants` column (boolean)
   - `variants` column (jsonb)
   - `base_price` column (numeric)
   - Indexes for performance

## 💾 Data Structure

### Menu Item with Variants
```typescript
{
  id: "item123",
  name: "Fried Rice",
  category: "တရုတ်",
  price: 3000,  // Base price
  hasVariants: true,
  variants: [
    { id: "chicken", name: "Chicken", priceModifier: 0 },
    { id: "pork", name: "Pork", priceModifier: 500 },
    { id: "seafood", name: "Seafood", priceModifier: 1000 }
  ]
}
```

### Cart Item with Selected Variant
```typescript
{
  id: "item123",
  name: "Fried Rice (Seafood)",  // Variant shown in name
  price: 4000,  // Base + modifier
  quantity: 2,
  variantId: "seafood",
  selectedVariant: { id: "seafood", name: "Seafood", priceModifier: 1000 }
}
```

## 🔄 Order Persistence

### How It Works
1. **Active Orders Saved**: All in-progress orders stored in localStorage
2. **Auto-Restore**: Orders automatically reload when returning to POS tab
3. **Multi-Location**: Each table/parcel maintains its own order

### Storage Keys
- `pos_active_orders` - Map of location → order data
- `pos_current_location` - Currently selected location

## 🎨 UI/UX Features

### Variant Selection Modal
- Clean, intuitive interface
- Color-coded protein icons
- Price changes clearly displayed
- Easy to add to cart or cancel

### Cart Display
- Variant name shown in parentheses
- Individual quantity controls per variant
- Correct pricing reflected

### Order Badges
- Active orders show item count badge
- Visual indication of pending orders
- Quick switching between locations

## 🚀 Benefits

1. **Reduced Menu Clutter**: One item instead of multiple entries
2. **Easier Management**: Update base item once, applies to all variants
3. **Better UX**: Customers choose exactly what they want
4. **Accurate Pricing**: Automatic price calculation with modifiers
5. **Order Persistence**: Never lose in-progress orders

## 🔧 Technical Notes

### Files Modified
- `types.ts` - Added `MenuItemVariant`, `hasVariants`, `variants` fields
- `components/POS.tsx` - Added variant modal and selection logic
- `components/MenuManager.tsx` - Added variant configuration UI
- `components/SupabaseSync.tsx` - Added variant parsing from database
- `services/supabaseClient.ts` - Updated DB interfaces

### New Files
- `add-variant-support.sql` - Database migration for variants
- `VARIANT_FEATURE_GUIDE.md` - This documentation

## 🐛 Troubleshooting

**Problem**: Variants not showing in POS
- **Solution**: Make sure `hasVariants` is checked and at least one variant is configured

**Problem**: Variant modal doesn't appear
- **Solution**: Verify the menu item has `hasVariants: true` and `variants` array is populated

**Problem**: Orders disappearing when switching tabs
- **Solution**: This should be fixed! Orders persist in localStorage now

**Problem**: Variants not syncing to database
- **Solution**: Run the `add-variant-support.sql` migration in Supabase

## 📝 Future Enhancements

Potential additions:
- Size variants (Small, Medium, Large)
- Multiple variant categories (Size + Protein)
- Variant-specific images
- Variant availability tracking
- Default variant selection

---

**Last Updated**: November 28, 2025
**Version**: 1.0.0

