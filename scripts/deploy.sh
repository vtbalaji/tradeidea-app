#!/bin/bash

# TradeIdea - Git Commit and Push Script
# This script will add all changes, commit with a message, and push to GitHub

set -e  # Exit on error

echo "🚀 TradeIdea Deployment Script"
echo "================================"

# Check if commit message is provided
if [ -z "$1" ]; then
  echo "❌ Error: Commit message required"
  echo "Usage: ./scripts/deploy.sh \"your commit message\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo ""
echo "📦 Adding all changes to git..."
git add .

echo ""
echo "📝 Creating commit with message: \"$COMMIT_MESSAGE\""
git commit -m "$COMMIT_MESSAGE

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

echo ""
echo "🔄 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📊 Vercel will automatically deploy your changes."
echo "   Visit https://vercel.com to check deployment status."
echo ""
