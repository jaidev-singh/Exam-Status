// Dexie Database Configuration
const db = new Dexie('ExamTrackerDB');

// Define database schema
db.version(1).stores({
    trackingData: '++id, subject, examTypes, lastUpdated',
    studentInfo: 'key',
    config: 'key', // subjects, learningMethods, examTypes
    dailyPlans: '++id, date, subject, status',
    dailyHistory: 'date',
    backups: '++id, timestamp', // Automatic backups
    classDefaults: 'className', // Default subjects for each class
    defaultChapters: '++id, className, subject' // Default chapters library
});

// Database Manager with enhanced protection
const DBManager = {
    // Initialize database
    async init() {
        try {
            await db.open();
            await this.migrateFromLocalStorage();
            await this.initializeClassDefaults();
            await this.setupAutoBackup();
            console.log('✅ Database initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            return false;
        }
    },

    // Initialize default subjects for each class
    async initializeClassDefaults() {
        // Check if already initialized
        const existing = await db.classDefaults.count();
        if (existing > 0) {
            console.log('✅ Class defaults already loaded from IndexedDB');
            return; // Already have defaults
        }

        // Try to load from deployed JSON file first
        try {
            const response = await fetch('class-defaults.json');
            if (response.ok) {
                const deployedData = await response.json();
                console.log('📦 Loading class defaults from class-defaults.json...');
                
                const defaultsToLoad = [];
                for (const [className, data] of Object.entries(deployedData.classes)) {
                    defaultsToLoad.push({
                        className: className,
                        subjects: data.subjects || [],
                        learningMethods: data.learningMethods || [],
                        examTypes: data.examTypes || []
                    });
                }
                
                await db.classDefaults.bulkPut(defaultsToLoad);
                
                // Also load default chapters if available
                if (deployedData.defaultChapters) {
                    await db.defaultChapters.bulkPut(deployedData.defaultChapters);
                    console.log(`✅ Loaded ${deployedData.defaultChapters.length} default chapters`);
                }
                
                console.log('✅ Class defaults loaded from class-defaults.json');
                return;
            }
        } catch (error) {
            console.log('⚠️ No class-defaults.json found, using built-in defaults');
            console.error(error);
        }

        // Fallback to hardcoded defaults
        const defaults = [
            {
                className: '6',
                subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Sanskrit'],
                learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
                examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test']
            },
            {
                className: '7',
                subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Sanskrit'],
                learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
                examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test']
            },
            {
                className: '8',
                subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Sanskrit'],
                learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
                examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test']
            },
            {
                className: '9',
                subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi', 'Sanskrit'],
                learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
                examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Board Exam']
            }
        ];

        await db.classDefaults.bulkPut(defaults);
        console.log('✅ Class defaults initialized from built-in defaults');
    },

    // Migrate existing localStorage data to Dexie
    async migrateFromLocalStorage() {
        try {
            const existingData = localStorage.getItem('examTrackingData');
            if (!existingData) return;

            const data = JSON.parse(existingData);
            
            // Check if already migrated
            const configExists = await db.config.get('migrated');
            if (configExists) return;

            console.log('📦 Migrating data from localStorage to IndexedDB...');

            // Migrate tracking data
            if (data.trackingData && data.trackingData.length > 0) {
                await db.trackingData.bulkPut(data.trackingData);
            }

            // Migrate student info
            if (data.studentInfo) {
                await db.studentInfo.put({ key: 'info', ...data.studentInfo });
            }

            // Migrate config
            await db.config.put({
                key: 'subjects',
                values: data.subjects || []
            });
            await db.config.put({
                key: 'learningMethods',
                values: data.learningMethods || []
            });
            await db.config.put({
                key: 'examTypes',
                values: data.examTypes || []
            });

            // Migrate daily plans
            if (data.dailyPlans && data.dailyPlans.length > 0) {
                await db.dailyPlans.bulkPut(data.dailyPlans);
            }

            // Migrate daily history
            if (data.dailyHistory && data.dailyHistory.length > 0) {
                await db.dailyHistory.bulkPut(data.dailyHistory);
            }

            // Mark as migrated
            await db.config.put({ key: 'migrated', value: true, date: new Date().toISOString() });
            
            // Create backup of localStorage data before clearing
            await this.createBackup('Initial migration from localStorage');
            
            // Keep localStorage as backup for now (don't delete immediately)
            console.log('✅ Migration completed successfully!');
            
        } catch (error) {
            console.error('Migration error:', error);
        }
    },

    // Auto-backup system (keeps last 10 backups)
    async setupAutoBackup() {
        const lastBackup = await db.config.get('lastAutoBackup');
        const now = new Date();
        
        // Auto-backup once per day
        if (!lastBackup || new Date(lastBackup.value) < new Date(now - 24 * 60 * 60 * 1000)) {
            await this.createBackup('Auto backup');
            await db.config.put({ key: 'lastAutoBackup', value: now.toISOString() });
            
            // Keep only last 10 backups
            const backups = await db.backups.orderBy('timestamp').reverse().toArray();
            if (backups.length > 10) {
                const toDelete = backups.slice(10);
                await db.backups.bulkDelete(toDelete.map(b => b.id));
            }
        }
    },

    // Create manual/auto backup
    async createBackup(description = 'Manual backup') {
        const backup = {
            timestamp: new Date().toISOString(),
            description: description,
            data: {
                trackingData: await db.trackingData.toArray(),
                studentInfo: await db.studentInfo.toArray(),
                config: await db.config.toArray(),
                dailyPlans: await db.dailyPlans.toArray(),
                dailyHistory: await db.dailyHistory.toArray()
            }
        };
        
        await db.backups.add(backup);
        console.log(`💾 Backup created: ${description}`);
        return backup;
    },

    // Force reload defaults from class-defaults.json (for admin updates)
    async reloadDefaultsFromJSON() {
        try {
            const response = await fetch('class-defaults.json?' + Date.now()); // Cache bust
            if (!response.ok) {
                throw new Error('Failed to fetch class-defaults.json');
            }
            
            const deployedData = await response.json();
            console.log('📦 Reloading class defaults from class-defaults.json...');
            
            // Clear existing defaults
            await db.classDefaults.clear();
            await db.defaultChapters.clear();
            
            // Load class defaults
            const defaultsToLoad = [];
            for (const [className, data] of Object.entries(deployedData.classes)) {
                defaultsToLoad.push({
                    className: className,
                    subjects: data.subjects || [],
                    learningMethods: data.learningMethods || [],
                    examTypes: data.examTypes || []
                });
            }
            await db.classDefaults.bulkPut(defaultsToLoad);
            
            // Load default chapters
            if (deployedData.defaultChapters && deployedData.defaultChapters.length > 0) {
                await db.defaultChapters.bulkPut(deployedData.defaultChapters);
            }
            
            console.log('✅ Class defaults reloaded successfully!');
            return true;
        } catch (error) {
            console.error('❌ Failed to reload defaults:', error);
            return false;
        }
    },

    // Restore from backup
    async restoreFromBackup(backupId) {
        try {
            const backup = await db.backups.get(backupId);
            if (!backup) throw new Error('Backup not found');

            // Clear current data
            await db.trackingData.clear();
            await db.studentInfo.clear();
            await db.config.clear();
            await db.dailyPlans.clear();
            await db.dailyHistory.clear();

            // Restore from backup
            await db.trackingData.bulkAdd(backup.data.trackingData);
            await db.studentInfo.bulkAdd(backup.data.studentInfo);
            await db.config.bulkAdd(backup.data.config);
            await db.dailyPlans.bulkAdd(backup.data.dailyPlans);
            await db.dailyHistory.bulkAdd(backup.data.dailyHistory);

            console.log('✅ Backup restored successfully!');
            return true;
        } catch (error) {
            console.error('Restore failed:', error);
            return false;
        }
    },

    // List all available backups
    async listBackups() {
        return await db.backups.orderBy('timestamp').reverse().toArray();
    },

    // Export all data (including backups) for external storage
    async exportFullDatabase() {
        const fullExport = {
            exportDate: new Date().toISOString(),
            version: 1,
            data: {
                trackingData: await db.trackingData.toArray(),
                studentInfo: await db.studentInfo.toArray(),
                config: await db.config.toArray(),
                dailyPlans: await db.dailyPlans.toArray(),
                dailyHistory: await db.dailyHistory.toArray(),
                backups: await db.backups.toArray()
            }
        };

        const dataStr = JSON.stringify(fullExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        const studentInfo = await this.getStudentInfo();
        const studentName = studentInfo?.name || 'Student';
        link.download = `exam-tracker-FULL-${studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('📥 Full database exported successfully!');
    },

    // Import full database
    async importFullDatabase(fileData) {
        try {
            const importData = typeof fileData === 'string' ? JSON.parse(fileData) : fileData;
            
            // Create backup before import
            await this.createBackup('Pre-import backup');

            // Clear existing data
            await db.trackingData.clear();
            await db.studentInfo.clear();
            await db.config.clear();
            await db.dailyPlans.clear();
            await db.dailyHistory.clear();

            // Import data
            if (importData.data.trackingData) await db.trackingData.bulkAdd(importData.data.trackingData);
            if (importData.data.studentInfo) await db.studentInfo.bulkAdd(importData.data.studentInfo);
            if (importData.data.config) await db.config.bulkAdd(importData.data.config);
            if (importData.data.dailyPlans) await db.dailyPlans.bulkAdd(importData.data.dailyPlans);
            if (importData.data.dailyHistory) await db.dailyHistory.bulkAdd(importData.data.dailyHistory);
            if (importData.data.backups) await db.backups.bulkAdd(importData.data.backups);

            console.log('✅ Database imported successfully!');
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    },

    // === CRUD Operations for Student Info ===
    async getStudentInfo() {
        const info = await db.studentInfo.get('info');
        return info || {
            name: 'Gravit Chaudhary',
            class: '7',
            reviewDate: '2026-01-14'
        };
    },

    async updateStudentInfo(field, value) {
        const info = await this.getStudentInfo();
        info[field] = value;
        info.key = 'info';
        await db.studentInfo.put(info);
    },

    // === Config Operations ===
    async getConfig(key) {
        const config = await db.config.get(key);
        
        const defaults = {
            subjects: ['Maths', 'Science', 'English', 'Social Studies'],
            learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
            examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test']
        };
        
        return config?.values || defaults[key] || [];
    },

    async updateConfig(key, values) {
        await db.config.put({ key, values });
    },

    // === Tracking Data Operations ===
    async getAllTrackingData() {
        return await db.trackingData.toArray();
    },

    async addChapter(chapterData) {
        const id = await db.trackingData.add(chapterData);
        return { ...chapterData, id };
    },

    async updateChapter(id, updates) {
        await db.trackingData.update(id, updates);
    },

    async deleteChapter(id) {
        await db.trackingData.delete(id);
    },

    async getChapterById(id) {
        return await db.trackingData.get(id);
    },

    // === Daily Plans Operations ===
    async getTodaysPlan() {
        const today = new Date().toISOString().split('T')[0];
        return await db.dailyPlans.where('date').equals(today).toArray();
    },

    async addDailyTask(task) {
        return await db.dailyPlans.add(task);
    },

    async updateDailyTask(id, updates) {
        await db.dailyPlans.update(id, updates);
    },

    async removeDailyTask(id) {
        await db.dailyPlans.delete(id);
    },

    // === Daily History Operations ===
    async getWeekHistory() {
        const weekData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            const historyEntry = await db.dailyHistory.get(dateStr);
            weekData.push({
                date: dateStr,
                day: dayName,
                score: historyEntry?.score || null,
                tasks: historyEntry?.tasks || []
            });
        }
        
        return weekData;
    },

    async saveDailyCompletion(date, tasks, score) {
        await db.dailyHistory.put({ date, tasks, score });
    },

    // === Class Defaults Operations ===
    async getClassDefaults(className) {
        return await db.classDefaults.get(className);
    },

    async getDefaultChapters(className) {
        return await db.defaultChapters.where('className').equals(className).toArray();
    },

    async addDefaultChapter(chapterData) {
        return await db.defaultChapters.add(chapterData);
    },

    async deleteDefaultChapter(id) {
        await db.defaultChapters.delete(id);
    },

    // === Backup Reminder System ===
    async checkBackupReminder() {
        const reminder = await db.config.get('lastBackupReminder');
        const now = new Date();
        
        // Remind every 7 days
        if (!reminder || new Date(reminder.value) < new Date(now - 7 * 24 * 60 * 60 * 1000)) {
            await db.config.put({ key: 'lastBackupReminder', value: now.toISOString() });
            return true; // Show reminder
        }
        return false;
    }
};
