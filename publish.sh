#!/bin/bash

# Publishing script for create-vandslab-app

echo "🚀 Preparing to publish create-vandslab-app..."

# Check if logged in to npm
npm whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
pnpm build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before publishing."
    exit 1
fi

# Show current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: $CURRENT_VERSION"

# Ask for version bump
echo "Choose version bump:"
echo "1) Patch (bug fixes)"
echo "2) Minor (new features)"
echo "3) Major (breaking changes)"
echo "4) Skip version bump"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        npm version patch
        ;;
    2)
        npm version minor
        ;;
    3)
        npm version major
        ;;
    4)
        echo "Skipping version bump"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "📌 Publishing version: $NEW_VERSION"

# Confirm before publishing
read -p "Do you want to publish create-vandslab-app@$NEW_VERSION to npm? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Publishing cancelled"
    exit 1
fi

# Publish to npm
echo "🚀 Publishing to npm..."
read -p "Enter npm 2FA code (or press Enter if using token): " otp_code

if [ -n "$otp_code" ]; then
    npm publish --access public --otp="$otp_code"
else
    npm publish --access public
fi

if [ $? -eq 0 ]; then
    echo "✅ Successfully published create-vandslab-app@$NEW_VERSION"
    echo ""
    echo "Users can now run:"
    echo "  npx create-vandslab-app my-project"
    echo "  npm create vandslab-app my-project"
    echo "  pnpm create vandslab-app my-project"
    echo ""
    echo "Don't forget to:"
    echo "  - Push tags: git push --follow-tags"
    echo "  - Create GitHub release"
else
    echo "❌ Publishing failed"
    exit 1
fi