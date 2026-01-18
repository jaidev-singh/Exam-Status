# 📚 Exam Readiness Tracker - Calculation Methodology

## Overview
This application calculates a **Readiness Score out of 10** for each subject based on multiple factors that indicate true exam preparation.

---

## 🧮 Scoring System

### Points Breakdown (Per Chapter)

Each chapter is scored based on three main categories:

#### 1. **Learning Methods** (Variable Points)
Points depend on how many learning methods you have configured (default: 4 methods).

| Status | Points |
|--------|--------|
| ✅ Completed | 1.0 point per method |
| 🔄 In Progress | 0.5 points per method |
| ⭕ Not Started | 0 points |
| ➖ Not Required | 0 points (doesn't penalize) |

**Default Methods:**
- School
- Tuition
- Online App
- Self Study

**Max Points:** Number of learning methods (e.g., 4 methods = 4 points max)

---

#### 2. **Writing Practice** (Max 1 Point)

| Status | Points |
|--------|--------|
| ✅ Yes | 1.0 point |
| 📝 Partial | 0.5 points |
| ❌ No | 0 points |

---

#### 3. **Confidence Level** (Max 4 Points)

| Level | Points |
|-------|--------|
| 😄 Excellent | 4 points |
| 🙂 Good | 3 points |
| 😐 Medium | 2 points |
| 😰 Low | 1 point |

---

## 📊 Calculation Formula

### Per Chapter Score
```
Chapter Score = (Learning Methods Points) + (Writing Points) + (Confidence Points)
Max Chapter Score = (Number of Methods) + 1 + 4
```

**Example with 4 learning methods:**
- Max Score per Chapter = 4 + 1 + 4 = **9 points**

### Subject Readiness Score
```
Total Score = Sum of all chapter scores in subject
Max Possible Score = Number of chapters × Max Chapter Score

Percentage = (Total Score / Max Possible Score) × 100
Readiness Score = Percentage / 10
```

**Result:** Score out of 10 (e.g., 7.5/10)

---

## 💡 Example Calculation

### Scenario: Maths Subject with 2 Chapters

**Learning Methods:** School, Tuition, Online App, Self Study (4 methods)

#### Chapter 1: Integers
- **Learning Methods:**
  - School: Completed (1.0)
  - Tuition: Completed (1.0)
  - Online App: In Progress (0.5)
  - Self Study: Not Started (0.0)
- **Writing:** Yes (1.0)
- **Confidence:** Good (3.0)

**Chapter 1 Score:** 1 + 1 + 0.5 + 0 + 1 + 3 = **6.5 / 9**

#### Chapter 2: Fractions
- **Learning Methods:**
  - School: Completed (1.0)
  - Tuition: Not Required (0.0)
  - Online App: In Progress (0.5)
  - Self Study: Not Started (0.0)
- **Writing:** Partial (0.5)
- **Confidence:** Medium (2.0)

**Chapter 2 Score:** 1 + 0 + 0.5 + 0 + 0.5 + 2 = **4.0 / 9**

### Final Calculation
```
Total Score = 6.5 + 4.0 = 10.5
Max Possible = 2 chapters × 9 = 18

Percentage = (10.5 / 18) × 100 = 58.33%
Readiness Score = 58.33 / 10 = 5.8

Maths Readiness: 5.8/10 ⚠️
```

---

## 🎯 Readiness Indicators

| Score | Emoji | Status | Meaning |
|-------|-------|--------|---------|
| 8.0 - 10.0 | ✅ | Excellent | Fully prepared, exam ready |
| 6.0 - 7.9 | ⚠️ | Warning | Good progress, needs improvement |
| 0.0 - 5.9 | ❌ | Critical | Requires immediate attention |

---

## 🔧 Customization

### Adding/Removing Learning Methods
- Go to **All Subjects** tab
- Click **"🎯 Manage Learning Methods"**
- Add or remove methods as needed
- The calculation automatically adjusts to your configuration

### Why "Not Required" Exists
Some students may not attend tuition or use certain learning methods. "Not Required" ensures those methods don't penalize the readiness score.

---

## 📝 Best Practices

1. **Update Regularly:** Mark learning statuses as you progress
2. **Be Honest:** Accurate confidence levels give better readiness assessment
3. **Complete Writing:** Writing practice significantly improves retention
4. **Track In Progress:** The "Summary" tab shows what needs immediate attention
5. **Use Exam Filters:** Focus on specific exams like "Half Yearly" or "Unit Test 1"

---

## 🎓 Philosophy

The scoring system is designed to measure **true readiness**, not just completion. A chapter is only fully ready (contributing ~8-9 points) when:
- Multiple learning sources are completed
- Writing practice is done
- Student feels confident

This multi-dimensional approach gives a realistic assessment of exam preparedness.

---

## 📁 File Structure

```
exam-tracker/
├── index.html          # Main UI
├── style.css           # Styling
├── app.js              # Main application logic
├── data.js             # Data management & localStorage
├── calculations.js     # Readiness scoring logic
├── ui.js               # UI rendering functions
└── README.md           # This file
```

---

## 💾 Data Storage

**NEW: Now using Dexie.js (IndexedDB) for enhanced protection!**

All data is stored in browser's `IndexedDB`:
- ✅ **Protected:** Survives browser cache clearing
- 🔄 **Auto-Backup:** Daily automatic backups (keeps last 10)
- 💾 **Large Storage:** Multiple GBs available (vs 5-10MB in localStorage)
- 📥 **Export/Import:** Save to cloud or USB for extra safety
- ↩️ **Restore:** Rollback to any previous backup
- 🔐 **Secure:** Encrypted on disk by browser
- 📊 **Fast:** Better performance for complex queries

### Backup Management
Access via **🔐 Backups & Safety** button:
- View all auto-backups
- Export full database
- Import from file
- Restore any backup
- Weekly export reminders

### Migration from localStorage
Your existing data is automatically migrated on first load. Old localStorage data is kept as backup.

---

**Last Updated:** January 16, 2026  
**Version:** 2.0 (Dexie Upgrade)  
**For:** Home Use - Gravit Chaudhary, Class 7
