# Testing Guide: Variant Selection Feature

## Quick Test Steps

### Prerequisites
1. Make sure dev server is running: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Login with passcode: `7777`

### Test 1: Create Menu Item with Variants

1. **Navigate to "Edit Menu" tab**
2. Click "Add New Dish"
3. Fill in:
   - Name: `Test Fried Rice`
   - Category: `တရုတ်`
   - Price: `3000`
   - Cost: `1000`
4. **Check the "Has Protein Variants" checkbox** ✅
5. You should see 3 default variants:
   - Chicken: +0
   - Pork: +500
   - Seafood: +1000
6. Click "Add Item"
7. ✅ Verify item appears in menu grid

### Test 2: Verify Modal Appears on Every Tap

1. **Go to "Register (POS)" tab**
2. Click "New Order" button
3. Select "Table 1"
4. **Tap "Test Fried Rice"** in menu grid
   - ✅ Modal should appear with "Choose Protein" title
   - ✅ Should show 3 options: Chicken, Pork, Seafood
5. **Select "Chicken"**
   - ✅ Modal closes
   - ✅ Cart shows: "Test Fried Rice (Chicken) x1 - 3000 Ks"
6. **Tap "Test Fried Rice" AGAIN**
   - ✅ Modal appears AGAIN (not skipped!)
7. **Select "Chicken" again**
   - ✅ Cart now shows: "Test Fried Rice (Chicken) x2 - 6000 Ks"
8. **Tap "Test Fried Rice" THIRD TIME**
   - ✅ Modal appears AGAIN
9. **Select "Pork" this time**
   - ✅ Cart now shows TWO separate items:
     - Test Fried Rice (Chicken) x2 - 6000 Ks
     - Test Fried Rice (Pork) x1 - 3500 Ks

### Test 3: Verify Different Variants Track Separately

1. Continue from Test 2
2. **Tap "Test Fried Rice" again**
3. **Select "Seafood"**
4. ✅ Cart should now have THREE separate line items:
   - Test Fried Rice (Chicken) x2
   - Test Fried Rice (Pork) x1
   - Test Fried Rice (Seafood) x1
5. **Tap "Test Fried Rice" again**
6. **Select "Seafood" again**
7. ✅ Seafood quantity increases to x2

### Test 4: Verify Order Persistence

1. Continue from Test 3 (cart has multiple items)
2. **Click "Sales Overview" tab**
3. Wait 2 seconds
4. **Click "Register (POS)" tab**
5. ✅ Verify order is still there with all items
6. ✅ Table 1 badge shows correct item count

### Test 5: Verify Multi-Table Orders

1. Continue from Test 4
2. **Click "New Order" button**
3. **Select "Table 2"**
4. Add some items with variants
5. ✅ Table 2 badge appears with orange background
6. **Click Table 1 badge** (at top)
7. ✅ Switches back to Table 1 order
8. **Click Table 2 badge**
9. ✅ Switches to Table 2 order
10. **Click "Sales Overview" tab**
11. **Return to POS**
12. ✅ Both orders still present

### Test 6: Complete Order

1. Select Table 1 (with the test order)
2. **Click "Checkout" button**
3. Select payment method
4. **Click "Confirm Payment"**
5. ✅ Receipt shows variant names in parentheses
6. ✅ Prices are correct
7. Close receipt
8. ✅ Table 1 badge disappears (order cleared)
9. ✅ Table 2 order still active

## Expected Results

### ✅ Pass Criteria
- [ ] Modal appears EVERY time variant item is tapped
- [ ] Same variant increases quantity
- [ ] Different variants create separate cart items
- [ ] Variant names shown in parentheses in cart
- [ ] Prices calculated correctly with modifiers
- [ ] Orders persist when switching tabs
- [ ] Multiple table orders work simultaneously
- [ ] Completed orders clear properly

### ❌ Fail Scenarios (Should NOT Happen)
- Modal only appears first time, then auto-adds
- Variants overwrite each other
- Variant name not showing
- Wrong prices
- Orders disappear when switching tabs
- All tables share same order

## Troubleshooting

### Modal Not Appearing
**Cause**: Item doesn't have variants enabled
**Fix**: 
1. Edit menu item
2. Check "Has Protein Variants"
3. Add at least one variant
4. Save

### Modal Appears But No Variants Listed
**Cause**: Variants array is empty
**Fix**:
1. Edit menu item
2. Click "+ Add Variant"
3. Enter name and price modifier
4. Save

### Orders Disappearing
**Cause**: localStorage might be disabled
**Fix**:
1. Open browser console (F12)
2. Check for errors
3. Verify localStorage is available: `typeof localStorage`
4. Clear and try again: `localStorage.clear()`

### Variants Not Syncing to Database
**Cause**: Database migration not run
**Fix**:
1. Open Supabase SQL Editor
2. Run `add-variant-support.sql`
3. Refresh app

## Browser Console Commands

### Check Active Orders
```javascript
JSON.parse(localStorage.getItem('pos_active_orders'))
```

### Check Current Location
```javascript
localStorage.getItem('pos_current_location')
```

### Clear All Data (Start Fresh)
```javascript
localStorage.clear()
location.reload()
```

### Check Menu Items
```javascript
JSON.parse(localStorage.getItem('pos_db_menu'))
```

## Performance Check

### Expected Performance
- Modal opens: < 100ms
- Variant selection adds to cart: < 50ms
- Switch between tables: < 100ms
- Tab switching: < 200ms

### If Slow
1. Check browser console for errors
2. Check if too many items in cart (>50)
3. Clear old orders from localStorage
4. Restart dev server

---

## ✅ All Tests Passed?

Congratulations! The variant feature is working perfectly. 

**Every tap WILL show the modal** - this is the correct behavior! 🎉

