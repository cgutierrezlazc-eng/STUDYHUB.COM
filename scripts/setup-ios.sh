#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Conniku — iOS Setup Script
# Run this after installing Xcode and CocoaPods
# ═══════════════════════════════════════════════════════════

set -e

echo "🍎 Conniku iOS Setup"
echo "===================="

# Check prerequisites
echo ""
echo "Checking prerequisites..."

if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode is not installed."
    echo "   Install from: https://apps.apple.com/app/xcode/id497799835"
    echo "   Then run: sudo xcode-select --switch /Applications/Xcode.app"
    exit 1
fi
echo "✅ Xcode found: $(xcodebuild -version | head -1)"

if ! command -v pod &> /dev/null; then
    echo "⚠️  CocoaPods not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install cocoapods
    else
        sudo gem install cocoapods
    fi
fi
echo "✅ CocoaPods found: $(pod --version)"

# Navigate to project
cd "$(dirname "$0")/.."

# Build web assets
echo ""
echo "📦 Building web assets..."
npx vite build

# Add iOS platform
echo ""
echo "📱 Adding iOS platform..."
if [ -d "ios" ]; then
    echo "   iOS directory already exists, syncing..."
    npx cap sync ios
else
    npx cap add ios
fi

# Update iOS project settings
echo ""
echo "⚙️  Configuring iOS project..."

# Set deployment target
if [ -f "ios/App/Podfile" ]; then
    sed -i '' 's/platform :ios, .*/platform :ios, '\''15.0'\''/' ios/App/Podfile
    cd ios/App && pod install && cd ../..
fi

echo ""
echo "✅ iOS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Open in Xcode:  npx cap open ios"
echo "  2. Set your Team in Signing & Capabilities"
echo "  3. Update Bundle Identifier if needed"
echo "  4. Add your App Icon assets (1024x1024)"
echo "  5. Build and test on simulator or device"
echo "  6. Archive and upload to App Store Connect"
echo ""
echo "For App Store submission:"
echo "  - App name: Conniku"
echo "  - Bundle ID: com.conniku.app"
echo "  - Category: Education"
echo "  - Subcategory: Social Networking"
