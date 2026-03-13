#!/bin/bash

echo "🐙 GitHub + Railway Deploy"
echo "=========================="

read -p "📝 GitHub username: " GITHUB_USER
read -p "📝 Repository name [agent-dashboard]: " REPO_NAME
REPO_NAME=${REPO_NAME:-agent-dashboard}

echo ""
echo "🔗 Setting up GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git
git branch -M main

echo ""
echo "📤 Pushing to GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Code pushed to GitHub!"
    echo ""
    echo "🚂 Next steps in Railway:"
    echo "1. Go to https://railway.app"
    echo "2. New Project → Deploy from GitHub repo"
    echo "3. Select: $GITHUB_USER/$REPO_NAME"
    echo "4. Railway will auto-detect backend + frontend"
    echo "5. Add PostgreSQL service"
    echo "6. Configure environment variables"
    echo ""
    echo "📖 See DEPLOY-GUIDE.md for detailed steps"
else
    echo ""
    echo "❌ Failed to push to GitHub"
    echo "Make sure the repository exists: https://github.com/$GITHUB_USER/$REPO_NAME"
fi