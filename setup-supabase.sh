#!/bin/bash

# Supabase Quick Setup Script for Lone Malay POS
# This script helps you verify your Supabase setup

echo "🚀 Supabase Setup Checker for Lone Malay POS"
echo "============================================="
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"

    # Check if it contains the required variables
    if grep -q "VITE_SUPABASE_URL" .env.local && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ Environment variables are configured"

        # Check if they're not placeholder values
        if grep -q "YOUR_PROJECT_ID" .env.local || grep -q "YOUR_PUBLIC_ANON_KEY" .env.local; then
            echo "⚠️  WARNING: Please replace placeholder values with your actual Supabase credentials"
        else
            echo "✅ Credentials appear to be set"
        fi
    else
        echo "❌ Missing required environment variables"
        echo "   Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local"
    fi
else
    echo "❌ .env.local file not found"
    echo "   Creating template .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
# Replace these with your actual Supabase project credentials
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY

# Gemini API Key (if using AI features)
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
EOF
    echo "✅ Created .env.local template. Please edit it with your credentials."
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Dependencies not installed. Running npm install..."
    npm install
fi

# Check if @supabase/supabase-js is installed
if [ -d "node_modules/@supabase/supabase-js" ]; then
    echo "✅ @supabase/supabase-js is installed"
else
    echo "❌ @supabase/supabase-js not found. Installing..."
    npm install @supabase/supabase-js
fi

echo ""
echo "📝 Setup Checklist:"
echo "==================="
echo ""
echo "To complete your Supabase integration:"
echo ""
echo "1. Get your Supabase credentials:"
echo "   → Go to https://app.supabase.com"
echo "   → Select your project"
echo "   → Go to Settings → API"
echo "   → Copy Project URL and anon key"
echo ""
echo "2. Update .env.local with your credentials"
echo ""
echo "3. Set up database tables:"
echo "   → Go to Supabase SQL Editor"
echo "   → Run the script from supabase-setup.sql"
echo ""
echo "4. Start your app:"
echo "   → npm run dev"
echo ""
echo "5. Test the connection:"
echo "   → Add SupabaseTestPanel component to your app"
echo "   → Or check browser console for connection status"
echo ""
echo "📖 For detailed instructions, see SUPABASE_SETUP.md"
echo ""

# Check if dev server is running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Development server is running on port 5173"
else
    echo "💡 To start the development server, run: npm run dev"
fi

echo ""
echo "Done! 🎉"

