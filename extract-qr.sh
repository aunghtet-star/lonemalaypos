#!/bin/bash

# KBZ Pay QR Code Extraction Helper
# This script helps you extract the QR code from your screenshot

echo "================================================"
echo "  KBZ Pay QR Code Extraction Helper"
echo "================================================"
echo ""
echo "Since the QR code from your screenshot is invalid when"
echo "scanned (because it includes extra UI elements), here"
echo "are your options:"
echo ""
echo "OPTION 1 (RECOMMENDED - USE AUTO-GENERATED QR):"
echo "-----------------------------------------------"
echo "The app now generates a VALID KBZ Pay QR code"
echo "automatically. Just:"
echo "  1. Make sure public/kbzpay-qr.png does NOT exist"
echo "  2. The app will generate a working QR code"
echo ""
echo "To use this option, run:"
echo "  rm -f public/kbzpay-qr.png"
echo ""
echo "OPTION 2 (MANUAL - CROP YOUR QR):"
echo "----------------------------------"
echo "If you want to use your actual QR from the screenshot:"
echo "  1. Open your screenshot in Preview (Mac) or Paint (Windows)"
echo "  2. Use the selection tool"
echo "  3. Draw a box around ONLY the QR code square"
echo "  4. Crop it (Cmd+K on Mac)"
echo "  5. Save as: public/kbzpay-qr.png"
echo ""
echo "What would you like to do?"
echo "  [1] Delete public/kbzpay-qr.png (use auto-generated QR)"
echo "  [2] Show me how to crop manually"
echo "  [3] Exit"
echo ""
read -p "Enter your choice (1/2/3): " choice

case $choice in
  1)
    if [ -f "public/kbzpay-qr.png" ]; then
      rm -f public/kbzpay-qr.png
      echo "✅ Deleted public/kbzpay-qr.png"
      echo "✅ The app will now use auto-generated QR code"
      echo "✅ This QR code WILL WORK with KBZ Pay!"
    else
      echo "ℹ️  File doesn't exist. Auto-generated QR will be used."
    fi
    ;;
  2)
    echo ""
    echo "To crop the QR code manually:"
    echo ""
    echo "ON MAC:"
    echo "  1. Open screenshot in Preview"
    echo "  2. Click the selection tool (rectangle)"
    echo "  3. Draw box around ONLY the QR square"
    echo "  4. Press Cmd+K to crop"
    echo "  5. Save as public/kbzpay-qr.png"
    echo ""
    echo "ON WINDOWS:"
    echo "  1. Open screenshot in Paint"
    echo "  2. Click Select tool"
    echo "  3. Draw rectangle around QR code only"
    echo "  4. Click Crop"
    echo "  5. Save as public/kbzpay-qr.png"
    echo ""
    ;;
  3)
    echo "Exiting..."
    exit 0
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "================================================"
echo "Done! Refresh your app to see the changes."
echo "================================================"

