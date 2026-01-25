#!/bin/bash

# Script to separate frontend and backend into different git repositories
# Backend: https://github.com/MostTP/ldf-back.git
# Frontend: (will be set up separately)

set -e

echo "🚀 Setting up separate repositories for frontend and backend..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Commit current changes
echo -e "${YELLOW}Step 1: Committing current changes...${NC}"
cd /Users/user/Documents/MostTP/LDF-Projecct
git add -A
git commit -m "Update API configuration and CORS settings" || echo "No changes to commit or already committed"

# Step 2: Set up backend repository (current repo)
echo -e "${YELLOW}Step 2: Configuring backend repository...${NC}"
cd /Users/user/Documents/MostTP/LDF-Projecct

# Create/update .gitignore to exclude frontend
if ! grep -q "^little-drop-fund/$" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Frontend - tracked in separate repo" >> .gitignore
    echo "little-drop-fund/" >> .gitignore
fi

# Remove frontend from git tracking (but keep files)
git rm -r --cached little-drop-fund/ 2>/dev/null || echo "Frontend not tracked in backend repo"

# Step 3: Set up frontend repository
echo -e "${YELLOW}Step 3: Setting up frontend repository...${NC}"
cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
    echo "Frontend git repository initialized"
else
    echo "Frontend git repository already exists"
fi

# Create .gitignore for frontend if it doesn't exist
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
EOF
    echo "Created .gitignore for frontend"
fi

# Add all frontend files
git add -A

# Initial commit if needed
if [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
    git commit -m "Initial commit: Frontend application"
    echo -e "${GREEN}✓ Frontend repository initialized and committed${NC}"
else
    echo -e "${GREEN}✓ Frontend repository already has commits${NC}"
fi

# Step 4: Instructions
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "BACKEND REPOSITORY:"
echo "  1. Add and commit the .gitignore changes:"
echo "     cd /Users/user/Documents/MostTP/LDF-Projecct"
echo "     git add .gitignore"
echo "     git commit -m 'Exclude frontend from backend repo'"
echo ""
echo "  2. Push to backend repo:"
echo "     git push origin main"
echo ""
echo "FRONTEND REPOSITORY:"
echo "  1. Add your frontend repository remote (replace URL with your frontend repo):"
echo "     cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund"
echo "     git remote add origin <YOUR_FRONTEND_REPO_URL>"
echo "     # Example: git remote add origin https://github.com/MostTP/ldf-front.git"
echo ""
echo "  2. Push to frontend repo:"
echo "     git push -u origin main"
echo ""
echo "Note: If your frontend repo uses a different branch name (e.g., 'master'), adjust accordingly."

