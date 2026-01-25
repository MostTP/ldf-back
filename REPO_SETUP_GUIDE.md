# Repository Setup Guide

The frontend and backend have been separated into different git repositories.

## Current Status

✅ **Backend Repository**: Already configured
- Remote: `https://github.com/MostTP/ldf-back.git`
- Location: `/Users/user/Documents/MostTP/LDF-Projecct/`
- Contains: `ldf/` directory and root config files
- Status: Changes have been committed and pushed

✅ **Frontend Repository**: Initialized locally
- Location: `/Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund/`
- Contains: All frontend application files
- Status: Initial commit completed, ready to push

## Next Steps

### 1. Create Frontend Repository on GitHub

1. Go to https://github.com/new
2. Create a new repository (e.g., `ldf-front` or `ldf-frontend`)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

### 2. Connect Frontend to GitHub

Run these commands in your terminal:

```bash
cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund

# Add your frontend repository as remote (replace URL with your actual repo URL)
git remote add origin https://github.com/MostTP/ldf-front.git

# Push to GitHub
git push -u origin main
```

**Note**: If your GitHub repo uses a different branch name (e.g., `master`), use:
```bash
git push -u origin main:master
```

### 3. Verify Setup

**Backend Repository:**
```bash
cd /Users/user/Documents/MostTP/LDF-Projecct
git status
git remote -v
```

**Frontend Repository:**
```bash
cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund
git status
git remote -v
```

## Repository Structure

### Backend Repository (`ldf-back`)
```
LDF-Projecct/
├── ldf/                    # Backend application
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── prisma/
│   └── ...
├── ecosystem.config.js     # PM2 config
├── .gitignore
└── *.md                    # Documentation files
```

### Frontend Repository (`ldf-front`)
```
little-drop-fund/
├── src/                    # Frontend source code
├── public/                 # Static assets
├── package.json
├── vite.config.js
└── ...
```

## Future Workflow

### Working on Backend
```bash
cd /Users/user/Documents/MostTP/LDF-Projecct
# Make changes to ldf/ directory
git add .
git commit -m "Your commit message"
git push origin main
```

### Working on Frontend
```bash
cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund
# Make changes to frontend files
git add .
git commit -m "Your commit message"
git push origin main
```

## Troubleshooting

### If frontend files appear in backend repo
The `.gitignore` should exclude `little-drop-fund/`. If files still appear:
```bash
cd /Users/user/Documents/MostTP/LDF-Projecct
git rm -r --cached little-drop-fund/
git commit -m "Remove frontend from backend repo"
```

### If you need to update remotes
```bash
# Backend
cd /Users/user/Documents/MostTP/LDF-Projecct
git remote set-url origin <NEW_BACKEND_URL>

# Frontend
cd /Users/user/Documents/MostTP/LDF-Projecct/little-drop-fund
git remote set-url origin <NEW_FRONTEND_URL>
```

