# 🧪 Testing Guide - Backend Integration

## Quick Test Checklist

### ✅ Test 1: Add Stock (5 minutes)

**Steps:**
1. Open http://localhost:3001
2. Login (click "Open Register")
3. Click "Inventory" in sidebar
4. Find any ingredient (e.g., "Burger Bun")
5. Click "Add Stock" button
6. Enter amount: `25`
7. Click "Add Stock" button
8. **Expected Results:**
   - ✅ Button shows spinner with "Updating..."
   - ✅ Success message appears (green banner)
   - ✅ Stock number increases in table
   - ✅ Modal closes automatically after 1.5s
   - ✅ Refresh page - stock persists!

**Verify in Supabase:**
1. Go to https://supabase.com/dashboard/project/qfhiurggryjzvyjfugcy/editor
2. Click on `ingredients` table
3. Find the ingredient you updated
4. ✅ Stock value matches what you see in app

---

### ✅ Test 2: Add New Ingredient (5 minutes)

**Steps:**
1. Navigate to Inventory tab
2. Click "Add New Ingredient" (top right, purple button)
3. Fill in the form:
   - **Name:** `Garlic`
   - **Unit:** `kg` (select from dropdown)
   - **Initial Stock:** `15`
   - **Min Stock Level:** `3`
   - **Cost Per Unit:** `800`
4. Click "Add Ingredient" button
5. **Expected Results:**
   - ✅ Button shows spinner with "Adding..."
   - ✅ Success message appears (green banner)
   - ✅ New row appears in table
   - ✅ Modal closes automatically
   - ✅ Refresh page - ingredient still there!

**Verify in Supabase:**
1. Go to Supabase Table Editor
2. Find `Garlic` in ingredients table
3. ✅ All fields match what you entered

---

### ✅ Test 3: Error Handling (3 minutes)

**Test Network Error:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Select "Offline" mode
4. Try to add stock
5. **Expected Results:**
   - ✅ Error message appears (red banner)
   - ✅ Button returns to normal state
   - ✅ Can try again
   - ✅ Local state still updates

**Test Invalid Data:**
1. Click "Add New Ingredient"
2. Leave name empty
3. Try to submit
4. **Expected Results:**
   - ✅ Browser validation stops submission
   - ✅ "Please fill out this field" message

---

### ✅ Test 4: Quick Add Buttons (2 minutes)

**Steps:**
1. Click "Add Stock" on any ingredient
2. Don't type anything
3. Click the `[+50]` quick add button
4. **Expected Results:**
   - ✅ Amount field fills with `50`
   - ✅ Preview shows new stock level
5. Click `[+100]` button
6. **Expected Results:**
   - ✅ Amount changes to `100`
   - ✅ Preview updates
7. Click "Add Stock"
8. **Expected Results:**
   - ✅ Stock increases by 100
   - ✅ Saves to database

---

### ✅ Test 5: Loading States (1 minute)

**Steps:**
1. Click "Add Stock"
2. Enter any amount
3. Watch the submit button when you click it
4. **Expected Results:**
   - ✅ Button disabled during save
   - ✅ Spinner appears
   - ✅ Text changes to "Updating..."
   - ✅ Can't click cancel during save
   - ✅ Success message appears when done

---

### ✅ Test 6: Data Persistence (2 minutes)

**Steps:**
1. Add stock to an ingredient (e.g., +50 to Coffee Beans)
2. Note the new stock value
3. **Hard refresh** the page (Cmd+Shift+R / Ctrl+Shift+F5)
4. Check the ingredient
5. **Expected Results:**
   - ✅ Stock value is still increased
   - ✅ Data persists across refreshes
6. Close browser completely
7. Reopen and login
8. **Expected Results:**
   - ✅ Data still there

---

## 🎨 Visual Checklist

### Success Message (Green)
```
┌────────────────────────────────────────────┐
│ ✓ Successfully added 50 pcs to Burger Bun │
│                                            │
│ [Shows for 1.5 seconds then auto-closes]  │
└────────────────────────────────────────────┘
```

### Error Message (Red)
```
┌────────────────────────────────────────────┐
│ ⚠ Failed to update stock. Network error.  │
│                                            │
│ [Stays visible until user closes modal]   │
└────────────────────────────────────────────┘
```

### Loading Button
```
Before:  [Add Stock]
During:  [◐ Updating...]  (spinning, disabled)
After:   Success message → Modal closes
```

---

## 📊 Expected Behavior Summary

| Action | Local State | Supabase | UI Feedback |
|--------|-------------|----------|-------------|
| Add Stock | ✅ Updates | ✅ Updates | ✅ Success msg |
| Add Ingredient | ✅ Adds | ✅ Inserts | ✅ Success msg |
| Network Error | ✅ Updates | ❌ Fails | ✅ Error msg |
| Invalid Input | ❌ Blocked | ❌ Not sent | ✅ Validation |
| Refresh Page | ✅ Loads | ✅ Fetches | ✅ Shows data |

---

## 🐛 Troubleshooting

### Issue: "Could not find table"
**Solution:**
```sql
-- Run in Supabase SQL Editor
NOTIFY pgrst, 'reload schema';
```

### Issue: Success message doesn't appear
**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check network tab for API calls
4. Verify Supabase connection: `npm run test:connection`

### Issue: Modal doesn't close
**Check:**
1. Look for JavaScript errors in console
2. Try clicking outside modal
3. Press ESC key
4. Hard refresh page

### Issue: Stock doesn't update
**Check:**
1. Verify Supabase connection
2. Check RLS policies are set up
3. Look for errors in console
4. Try `npm run test:connection`

---

## 📱 Mobile Testing

**On Phone/Tablet:**
1. Open app on mobile browser
2. Test add stock - should work
3. Test add ingredient - keyboard should appear
4. Success messages should be readable
5. Buttons should be easy to tap
6. ✅ Everything should work smoothly

---

## ⏱️ Performance Expectations

| Operation | Expected Time |
|-----------|---------------|
| Add Stock | < 2 seconds |
| Add Ingredient | < 3 seconds |
| Refresh Data | < 2 seconds |
| Modal Open | < 100ms |
| Success Display | 1.5 seconds |

If operations take longer:
- Check internet speed
- Check Supabase status
- Look for network throttling

---

## ✅ All Tests Passed?

If all tests pass, you have successfully:
- ✅ Connected inventory to Supabase
- ✅ Implemented add stock functionality
- ✅ Implemented add ingredient functionality
- ✅ Added error handling
- ✅ Added loading states
- ✅ Added success messages
- ✅ Ensured data persistence

**Your backend integration is complete! 🎉**

---

## 📸 Screenshots to Look For

### Add Stock Modal
- Current stock info box (gray background)
- Amount input field (large, centered)
- Quick add buttons (+10, +25, +50, +100)
- Notes textarea
- Cancel and "Add Stock" buttons

### Add Ingredient Modal
- All form fields visible
- Dropdown for unit selection
- Number inputs for stock/cost
- Helper text under fields
- Cancel and "Add Ingredient" buttons

### Success State
- Green banner at top of modal
- Check circle icon
- Success message text
- Modal closes automatically

### Loading State
- Spinning circle on button
- "Updating..." or "Adding..." text
- Disabled buttons
- Gray overlay on form

### Error State
- Red banner at top of modal
- Exclamation icon
- Error message text
- Form still editable
- Can retry

---

**Testing Complete?** 
→ Move on to production deployment or add more features!

Made with ❤️ by GitHub Copilot

