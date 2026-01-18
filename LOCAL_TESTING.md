# 🧪 Local Testing Guide

## ⚠️ Important: File Access Limitation

When opening `index.html` directly with `file://` protocol (double-clicking the file), the browser **cannot load** `class-defaults.json` due to CORS security restrictions.

**You'll see this warning:**
```
⚠️ No class-defaults.json found (this is normal for local file:// access)
ℹ️ Using built-in defaults. To load custom defaults, deploy to a web server or use Netlify.
```

This is **NORMAL** for local testing. The app will use built-in defaults instead.

## ✅ Testing Options

### Option 1: Use Built-in Defaults (Simplest)
- Just open `index.html` directly
- Built-in defaults will be used
- Good for testing core functionality

### Option 2: Run Local Web Server (To test class-defaults.json)

**Using Node.js (if installed):**
```bash
npx http-server -p 8080
```
Then open: http://localhost:8080

**Using Python (if installed):**
```bash
python -m http.server 8080
```
Then open: http://localhost:8080

**Using VS Code:**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Option 3: Deploy to Netlify (Production Testing)
The deployed version on Netlify will load `class-defaults.json` correctly.

## 📝 Testing Workflow

1. **Local testing** → Use built-in defaults
2. **Update admin panel** → Export JSON
3. **Copy JSON to project folder**
4. **Git push** → Netlify auto-deploys
5. **Test on deployed site** → Custom defaults loaded ✅

## 🔍 How to Verify Which Defaults Are Loaded

**Open browser console (F12) and check:**

- Built-in defaults: `✅ Class defaults initialized from built-in defaults`
- JSON loaded: `✅ Class defaults loaded from class-defaults.json`

## 📂 File Locations

- **Admin panel:** `admin/admin.html` (local only, not deployed)
- **Main app:** `index.html`
- **Defaults file:** `class-defaults.json` (loaded only when deployed or via web server)
