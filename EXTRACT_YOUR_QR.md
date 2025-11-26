# 📱 STEP-BY-STEP: Extract Your Exact QR Code

## What You Need to Do

From your screenshot, you need to crop **ONLY the black and white QR square** and save it as `kbzpay-qr.png`.

---

## 🎯 Exact Steps (On Mac)

### Step 1: Locate Your Screenshot
Find your KBZ Pay screenshot (the one you showed me)

### Step 2: Open in Preview
1. Right-click the screenshot
2. Select "Open With" → "Preview"

### Step 3: Select the QR Code
1. Click the **"Show Markup Toolbar"** button (pen icon) or press `Cmd+Shift+A`
2. Click the **rectangular selection tool** (looks like a dotted rectangle)
3. **Carefully draw a box** around ONLY the QR code square:
   - Include the 3 corner squares (top-left, top-right, bottom-left)
   - Include all the black and white pixels
   - **DO NOT include:**
     - Blue background
     - White text ("Use KBZPay Scan to pay me")
     - Gray circle in the middle (that's just a watermark)
     - Account name text
     - KBZ logo at bottom

### Visual Guide - What to Select:

```
Your Full Screenshot:
┌─────────────────────────────────────────┐
│ 🔵🔵🔵 Blue Background 🔵🔵🔵           │ ← Don't include
│                                         │
│  "Use KBZPay Scan to pay me"            │ ← Don't include
│                                         │
│  ╔═════════════════════════════════╗   │
│  ║  START SELECTING FROM HERE ──┐  ║   │
│  ║  │                           │  ║   │
│  ║  │  ▓▓▓▓  ▓  ▓▓▓▓  ▓  ▓▓▓▓  │  ║   │
│  ║  │  ▓   ▓ ▓▓ ▓   ▓ ▓▓ ▓   ▓ │  ║   │
│  ║  │  ▓ ▓ ▓ ▓  ▓ ▓ ▓ ▓  ▓ ▓ ▓ │  ║   │ ← Select ONLY this area
│  ║  │  ▓   ▓ ▓▓ ▓   ▓ ▓▓ ▓   ▓ │  ║   │
│  ║  │  ▓▓▓▓  ▓  ▓▓▓▓  ▓  ▓▓▓▓  │  ║   │
│  ║  │                           │  ║   │
│  ║  └─────────────────────────────┘  ║   │
│  ╚═════════════════════════════════╝   │
│                                         │
│  Nwe Nwe Yee(******3363)                │ ← Don't include
│                                         │
│  [KBZ Pay Logo]                         │ ← Don't include
└─────────────────────────────────────────┘
```

### Step 4: Crop
1. Press **Cmd+K** (or go to Tools → Crop)
2. The image is now cropped to just the QR code!

### Step 5: Save
1. Press **Cmd+S** (or File → Save)
2. Change the name to: **kbzpay-qr.png**
3. Make sure format is: **PNG**
4. Save location: **Desktop** (for now)

### Step 6: Move to Project
1. Open Finder
2. Navigate to: `/Users/aunghtet/Desktop/projects/lonemalaypos/public/`
3. Drag your **kbzpay-qr.png** into this folder

---

## 🎯 Exact Steps (On Windows)

### Step 1: Open in Paint
1. Right-click your screenshot
2. Select "Edit with Paint"

### Step 2: Select QR Code
1. Click the **"Select"** tool (rectangle icon)
2. Draw a rectangle around **ONLY** the QR code square
   - Just the black and white pattern
   - No blue background
   - No text
   - No logo

### Step 3: Crop
1. Click **"Crop"** button in the toolbar
2. Or go to Image → Crop

### Step 4: Save
1. File → Save As → **PNG picture**
2. Name: **kbzpay-qr.png**
3. Save to Desktop

### Step 5: Move to Project
1. Copy the file
2. Navigate to: `C:\...\lonemalaypos\public\`
3. Paste **kbzpay-qr.png**

---

## ✅ Verification

After saving the QR code:

### Check File Location
```bash
ls -lh /Users/aunghtet/Desktop/projects/lonemalaypos/public/kbzpay-qr.png
```

Should show:
```
-rw-r--r--  1 user  staff    15K Nov 25 16:30 public/kbzpay-qr.png
```

### Test in App
1. **Refresh** your browser (Cmd+Shift+R)
2. **Go to POS** → Add items → Checkout
3. **Select "KBZ PAY"**
4. **Your QR code appears!** ✅
5. **Scan with KBZ Pay app** → Should work!

---

## 🎨 What Your Cropped QR Should Look Like

### ✅ CORRECT:
```
┌─────────────────────────┐
│ ▓▓▓▓  ▓  ▓  ▓  ▓▓▓▓   │
│ ▓   ▓ ▓▓▓▓▓ ▓  ▓   ▓   │
│ ▓ ▓ ▓ ▓  ▓  ▓▓ ▓ ▓ ▓   │
│ ▓ ▓ ▓ ▓▓ ▓▓ ▓  ▓ ▓ ▓   │
│ ▓   ▓ ▓  ▓  ▓▓ ▓   ▓   │
│ ▓▓▓▓  ▓▓ ▓▓ ▓  ▓▓▓▓   │
│   ▓▓▓ ▓  ▓▓ ▓▓   ▓     │
│ ▓▓ ▓  ▓▓ ▓  ▓  ▓▓ ▓▓  │
│ ▓▓ ▓▓ ▓  ▓▓ ▓  ▓  ▓   │
│ ▓  ▓  ▓▓ ▓  ▓▓ ▓▓▓▓   │
│ ▓▓▓▓  ▓  ▓  ▓  ▓▓▓▓   │
└─────────────────────────┘
```
**Pure QR code - scannable!** ✅

### ❌ WRONG:
```
┌─────────────────────────────────┐
│ [Blue background with text]     │
│ [QR code buried inside]         │
│ [More text and logos]           │
└─────────────────────────────────┘
```
**Too much extra stuff - won't scan!** ❌

---

## 🚨 Important Notes

### The Gray Circle
You might see a **gray circle with a person icon** in the middle of your QR code in the screenshot. **This is OK!**
- It's just a watermark/profile overlay
- The actual QR data is underneath
- When you crop and save, it becomes part of the image
- The QR code will still work!

### File Requirements
- **Format:** PNG (not JPG)
- **Name:** Exactly `kbzpay-qr.png` (lowercase)
- **Location:** `/Users/aunghtet/Desktop/projects/lonemalaypos/public/`
- **Size:** At least 200x200 pixels (bigger is better)

### If QR Still Doesn't Scan
The issue might be that the gray circle is blocking the QR data. If that happens:
1. Try to get a screenshot without the gray circle, OR
2. Use a QR code reader app to extract the data, OR
3. Contact KBZ Pay support for a clean QR code image

---

## 🎬 Quick Summary

1. **Open** screenshot in Preview/Paint
2. **Select** only the QR code square
3. **Crop** (Cmd+K on Mac)
4. **Save** as `kbzpay-qr.png`
5. **Move** to `public/` folder
6. **Refresh** app
7. **Test** ✅

---

## 📞 Need Help?

If you're having trouble:

### Option 1: Screenshot Different
Take a new screenshot of your KBZ Pay QR code:
1. Open KBZ Pay app
2. Go to your QR code
3. Take a **clean screenshot** (no UI overlay if possible)
4. Follow the cropping steps above

### Option 2: Use QR Scanner
1. Scan your current QR with any QR scanner app
2. Copy the data it shows
3. Let me know what format it is
4. I can help generate a clean QR from that data

---

**Ready to try? Follow the steps above and your exact QR code will appear in the app!** 🎉

