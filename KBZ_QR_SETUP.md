# KBZ Pay QR Code Setup

## How to Add Your QR Code

1. **Save your QR code image** from the screenshot to:
   ```
   /Users/aunghtet/Desktop/projects/lonemalaypos/public/kbzpay-qr.png
   ```

2. **Or use a direct URL** by editing `POS.tsx` line ~383:
   ```typescript
   src="https://your-image-hosting.com/kbzpay-qr.png"
   ```

## Current Implementation

The payment modal will:
- Try to load from `/kbzpay-qr.png` (in public folder)
- Fallback to generated QR if image not found
- Display phone number: 09793143363

## Quick Setup

### Option 1: Use Public Folder (Recommended)
```bash
# From your screenshot, save the QR code as:
cp ~/Downloads/kbzpay-qr.png public/kbzpay-qr.png
```

Then update `POS.tsx`:
```typescript
src="/kbzpay-qr.png"
```

### Option 2: Use External URL
Upload your QR to:
- Imgur.com
- Google Drive (public link)
- Your own hosting

Then use the direct URL in `POS.tsx`.

### Option 3: Base64 Embed
Convert QR to base64 and embed directly (see instructions below).

## Testing

1. Go to POS
2. Add items to cart
3. Click Checkout
4. Select "KBZ PAY"
5. Your QR code should appear

---

Made with ❤️ by GitHub Copilot

