# Deployment Checklist

## Before Deploying to Netlify

### ✅ Files to Deploy

Include these files in your deployment:

- [x] `index.html` - Main app
- [x] `app.js` - Application logic
- [x] `db.js` - Database manager
- [x] `data-new.js` - Data manager
- [x] `calculations.js` - Helper functions
- [x] `ui.js` - UI renderer
- [x] `ui-*.js` - All UI modules
- [x] `style.css` - Main styles
- [x] `style-*.css` - All style modules
- [x] **`class-defaults.json`** ← IMPORTANT: Class configuration for all users

### ❌ Files to Exclude

DO NOT deploy these:

- [ ] `admin/` folder - Keep it local only
- [ ] `.gitignore.example`
- [ ] `README.md` (optional)
- [ ] Any backup files

## Steps to Deploy

### 1. Configure Class Defaults (One Time)

```bash
# Open admin panel locally
admin/admin.html

# Configure all classes (6-9)
# Click "Export for Deployment"
# Save class-defaults.json to project root
```

### 2. Verify Files

Check that `class-defaults.json` exists in project root:
```bash
ls class-defaults.json
```

### 3. Deploy to Netlify

#### Option A: Drag & Drop
1. Select all files EXCEPT `admin/` folder
2. Drag to Netlify drop zone
3. Done!

#### Option B: Git Deploy
```bash
# Add to .gitignore
echo "admin/" >> .gitignore

# Commit
git add .
git commit -m "Deploy with class defaults"
git push

# Netlify auto-deploys from git
```

### 4. Test Deployment

1. Open your deployed site
2. Select a class from dropdown
3. Click "Load default subjects"
4. Verify subjects appear correctly

## Updating Class Defaults

When you need to change subjects for any class:

1. Open `admin/admin.html` locally
2. Make your changes
3. Click "Export for Deployment"
4. Replace `class-defaults.json` in project root
5. Redeploy to Netlify
6. All users get updated defaults!

## Troubleshooting

### Users not getting defaults?

Check:
- [ ] `class-defaults.json` is in project root
- [ ] File is deployed to Netlify
- [ ] File is accessible at: `https://your-site.netlify.app/class-defaults.json`
- [ ] JSON format is valid (no syntax errors)

### Admin panel not working?

- Only works locally (not deployed)
- Requires Dexie.js CDN access
- Check browser console for errors

## Support

For issues:
1. Check browser console (F12)
2. Verify `class-defaults.json` exists
3. Test locally before deploying
4. Clear browser cache if needed

---

**Last Updated:** 2026-01-16
