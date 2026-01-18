# Testing Admin Panel & Main App Sync

## How It Works

Both the admin panel and main app use the **same IndexedDB database**. Here's the flow:

### Admin Panel:
1. You configure subjects/methods/exams
2. Click "💾 Save Defaults"
3. Data saved to IndexedDB `classDefaults` table

### Main App:
1. User selects their class from dropdown
2. System calls `DBManager.getClassDefaults(className)`
3. Gets **latest data from IndexedDB** (including your admin changes!)
4. Prompts user to load defaults
5. If accepted, subjects/methods/exams are populated

## ✅ They ARE Using the Same Database!

- **Database Name:** `ExamTrackerDB`
- **Table:** `classDefaults`
- **Shared between:** Admin panel & Main app

## Testing Steps

### 1. Open Admin Panel
```
d:\projects\Exam Status\admin\admin.html
```

### 2. Configure Class 7
- Go to "Subjects & Methods" tab
- Select "Class 7"
- Add a test subject: "Computer Science"
- Click "💾 Save Defaults"

### 3. Open Main App
Click "🧪 Test in Main App" button OR open manually:
```
d:\projects\Exam Status\index.html
```

### 4. Test the Sync
- In main app, change class dropdown to "Class 6" (different class)
- Then change it back to "Class 7"
- Click "Load default subjects"
- ✅ You should see "Computer Science" in the list!

## Why It Might Seem Like Different Databases

### Common Confusion:

**Scenario 1:** You already have data in main app
- If you already loaded defaults for Class 7 before admin changes
- The main app WON'T auto-reload unless you change the class again
- **Solution:** Change to a different class, then back to Class 7

**Scenario 2:** Browser cache
- If using different browsers or incognito mode
- Each has its own IndexedDB
- **Solution:** Use same browser for both admin and main app

**Scenario 3:** First load from JSON
- On very first initialization, app loads from `class-defaults.json`
- After that, it uses IndexedDB
- **Solution:** Already initialized? It's using IndexedDB now!

## Force Refresh Test

### Method 1: Change Class
1. Admin: Update Class 7 subjects
2. Main app: Change dropdown to Class 8
3. Main app: Change back to Class 7
4. Click "Load defaults"
5. ✅ See updated subjects!

### Method 2: Clear Browser Data
1. Press F12 → Application → IndexedDB
2. Delete `ExamTrackerDB`
3. Refresh page
4. Will re-initialize from IndexedDB (which has your admin changes)

### Method 3: Direct Test
Open browser console (F12) and run:
```javascript
// Check what's in IndexedDB
DBManager.getClassDefaults('7').then(defaults => {
    console.log('Class 7 defaults:', defaults);
});
```

## Current Sync Status

✅ **Working correctly!**
- Admin saves → IndexedDB
- Main app reads → IndexedDB
- Same database, same data

📝 **Important Note:**
- Main app only loads defaults when you **change class** and click "Load defaults"
- It doesn't auto-refresh while you're already on that class
- This is by design (to avoid losing user's current work)

## Deployment Note

For production (Netlify):
1. Export from admin: "🚀 Export for Deployment"
2. Gets `class-defaults.json`
3. Deploy this JSON file
4. New users load from JSON on first visit
5. After first load, everything uses IndexedDB

---

**Bottom line:** Both use the same IndexedDB. Just change class and reload to see admin changes! 🎉
