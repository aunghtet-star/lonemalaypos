# Quick Reference: Updated POS Configuration

## 🎯 What Changed

### Menu Categories (9 Categories)
```
When adding/editing menu items, you'll see:

┌────────────────────────────┐
│ Category: [Dropdown ▼]    │
├────────────────────────────┤
│ တရုတ် (Chinese)           │
│ အထောင်း (Steamed)         │
│ အသုပ် (Salad)              │
│ ရခိုင် (Rakhine)           │
│ ဟင်းရည် (Soup)            │
│ Snack & Drink              │
│ Ready-made Drink           │
│ သစ်သီးဖျော်ရည် (Juice)    │
│ Other                      │
└────────────────────────────┘
```

---

## 📍 Location System (30 Total Locations)

### Option 1: Parcels (Takeaway) - 10 Locations
```
📦 Parcel Orders
┌────┬────┬────┬────┬────┐
│ P1 │ P2 │ P3 │ P4 │ P5 │
├────┼────┼────┼────┼────┤
│ P6 │ P7 │ P8 │ P9 │P10 │
└────┴────┴────┴────┴────┘
🟧 Orange theme = Takeaway
```

### Option 2: Tables (Dine-In) - 20 Locations
```
🍽️ Dine-In Tables
┌────┬────┬────┬────┬────┐
│ T1 │ T2 │ T3 │ T4 │ T5 │
├────┼────┼────┼────┼────┤
│ T6 │ T7 │ T8 │ T9 │T10 │
├────┼────┼────┼────┼────┤
│T11 │T12 │T13 │T14 │T15 │
├────┼────┼────┼────┼────┤
│T16 │T17 │T18 │T19 │T20 │
└────┴────┴────┴────┴────┘
🔵 Blue theme = Dine-In
```

---

## 🎮 How to Use (POS Screen)

### Step 1: Select Location
```
Click the location button at the top of the POS screen
   ↓
Location selector modal opens
   ↓
Choose P1-P10 for takeaway OR T1-T20 for dine-in
```

### Step 2: Add Items
```
Browse menu by category
   ↓
Click items to add to cart
   ↓
Cart shows: "Parcel 5" or "Table 12" at the top
```

### Step 3: Switch Locations (Optional)
```
Multiple orders at once? No problem!
   ↓
Active orders bar shows all locations with items
   ↓
Click any location to switch instantly
   ↓
Each location keeps its own cart
```

### Step 4: Complete Order
```
Click "Checkout"
   ↓
Choose payment method (Cash or KBZ Pay)
   ↓
Confirm payment
   ↓
Receipt prints
   ↓
Location auto-clears
```

---

## 💡 Key Features

### Required Location Selection
- ⚠️ **Must select a location before adding items**
- If you try to add without selecting → Location selector opens automatically

### Multi-Order Management
- 📊 **Handle up to 30 orders at once**
- 🔄 **Quick-switch** between locations
- 🎯 **Independent carts** per location
- 🔢 **Item count badges** on active locations

### Visual Indicators
- 📦 **Orange + Box icon** = Parcel (Takeaway)
- 🍽️ **Blue + Table icon** = Table (Dine-In)
- ⚡ **Lightning icon** = Active Orders bar
- 🔴 **Red badge** = Number of items in location

---

## 📱 Screen Layout

```
┌─────────────────────────────────────────┐
│  [Location: Parcel 5 ▼]        [Menu]  │ ← Top Bar
├─────────────────────────────────────────┤
│  ⚡ Active: [P1·3] [P5·7] [T3·2]       │ ← Active Orders
├─────────────────────────────────────────┤
│  Categories: [All] [တရုတ်] [အထောင်း] │ ← Filters
├─────────────────────────────────────────┤
│  [Menu Grid with Items]                 │ ← Menu Items
│                                         │
├─────────────────────────────────────────┤
│  Cart: Parcel 5                         │ ← Cart (Right)
│  --------------------------------       │
│  Items in cart...                       │
│  Total: 12,000 Ks                       │
│  [Checkout]                             │
└─────────────────────────────────────────┘
```

---

## 🔢 Example Scenarios

### Scenario 1: Simple Takeaway
```
1. Open POS
2. Click location → Select P1
3. Add: 2x Chicken Curry, 1x Sprite
4. Checkout → Cash → Done
5. P1 cleared automatically
```

### Scenario 2: Multiple Takeaway Orders
```
1. Select P1 → Add items for Customer A
2. Select P2 → Add items for Customer B
3. Select P3 → Add items for Customer C
4. Click [P1·3] in active bar → Checkout P1
5. Click [P2·5] in active bar → Checkout P2
6. Click [P3·2] in active bar → Checkout P3
7. All cleared!
```

### Scenario 3: Busy Restaurant
```
Peak hour = 8 parcels + 12 tables active!
- P1-P8: Takeaway customers waiting
- T1-T12: Dine-in customers eating
- Server switches between locations seamlessly
- No orders lost or mixed up
- Fast service maintained
```

---

## 🎯 Pro Tips

1. **Use P1-P10 for all takeaway orders**
   - P1 = First takeaway customer
   - P2 = Second takeaway customer
   - etc.

2. **Use T1-T20 for all dine-in tables**
   - Assign real tables to numbers (e.g., T1 = Window table)
   - Reuse numbers after customers leave

3. **Check Active Orders bar**
   - See all busy locations at a glance
   - Click to quick-switch
   - Badge shows item count

4. **Burmese Categories**
   - Staff can easily find items in their language
   - Faster order processing
   - Fewer mistakes

---

## ✅ System Ready!

Your POS now supports:
- ✨ **9 Burmese menu categories**
- 📦 **10 Parcel locations** (takeaway)
- 🍽️ **20 Table locations** (dine-in)
- 🚀 **30 simultaneous orders**
- 🎯 **No location confusion**

**Start using it now!** 🎉

