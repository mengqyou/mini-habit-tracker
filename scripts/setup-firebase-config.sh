#!/bin/bash

# Firebase configuration setup script
# This replaces placeholder values with actual API keys from environment variables
# Usage: ./scripts/setup-firebase-config.sh

echo "🔧 Setting up Firebase configuration files..."

# Check if required environment variables are set
if [[ -z "$FIREBASE_API_KEY" ]]; then
    echo "❌ Error: FIREBASE_API_KEY environment variable not set"
    echo "   Set it with: export FIREBASE_API_KEY=your_api_key_here"
    exit 1
fi

# Android google-services.json
if [[ -f "android/app/google-services.json.template" ]]; then
    echo "📱 Setting up Android Firebase config..."
    sed "s/YOUR_FIREBASE_API_KEY_HERE/$FIREBASE_API_KEY/g" \
        android/app/google-services.json.template > android/app/google-services.json
    echo "✅ Created android/app/google-services.json"
else
    echo "⚠️  Warning: android/app/google-services.json.template not found"
fi

# iOS GoogleService-Info.plist
if [[ -f "ios/MiniHabitTracker/GoogleService-Info.plist" ]]; then
    echo "🍎 Setting up iOS Firebase config..."
    # Create backup if it doesn't exist
    if [[ ! -f "ios/MiniHabitTracker/GoogleService-Info.plist.backup" ]]; then
        cp ios/MiniHabitTracker/GoogleService-Info.plist ios/MiniHabitTracker/GoogleService-Info.plist.backup
    fi
    
    # Replace placeholder with actual API key
    sed -i.tmp "s/YOUR_FIREBASE_API_KEY_HERE/$FIREBASE_API_KEY/g" \
        ios/MiniHabitTracker/GoogleService-Info.plist
    rm ios/MiniHabitTracker/GoogleService-Info.plist.tmp
    echo "✅ Updated ios/MiniHabitTracker/GoogleService-Info.plist"
else
    echo "❌ Error: ios/MiniHabitTracker/GoogleService-Info.plist not found"
    exit 1
fi

echo ""
echo "🔐 Security Notes:"
echo "   - Never commit files containing real API keys"
echo "   - The actual API key is: ${FIREBASE_API_KEY:0:15}***REDACTED***"
echo "   - Make sure your Firebase API key has proper restrictions"
echo ""
echo "✅ Firebase configuration complete!"