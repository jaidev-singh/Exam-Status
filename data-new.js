// Enhanced Data Manager using Dexie (IndexedDB)
// This maintains the same API as the old localStorage version
const DataManager = {
    version: '2.1.0', // Version tracking for cache issues
    trackingData: [],
    studentInfo: {
        name: '',
        class: '',
        reviewDate: '2026-01-14',
        locked: false  // Once true, name & class can't be changed
    },
    subjects: ['Maths', 'Science', 'English', 'Social Studies'],
    learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
    examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test'],
    dailyPlans: [],
    dailyHistory: [],
    
    isInitialized: false,

    // Initialize with IndexedDB
    async init() {
        if (this.isInitialized) return;
        
        await DBManager.init();
        await this.loadData();
        
        // Check for backup reminders
        const showReminder = await DBManager.checkBackupReminder();
        if (showReminder) {
            this.showBackupReminder();
        }
        
        this.isInitialized = true;
    },

    // Load data from IndexedDB
    async loadData() {
        try {
            this.studentInfo = await DBManager.getStudentInfo();
            this.trackingData = await DBManager.getAllTrackingData();
            this.subjects = await DBManager.getConfig('subjects');
            this.learningMethods = await DBManager.getConfig('learningMethods');
            this.examTypes = await DBManager.getConfig('examTypes');
            this.dailyPlans = await DBManager.getTodaysPlan();
            this.dailyHistory = (await DBManager.getWeekHistory()).filter(h => h.tasks.length > 0);

            // No default sample data - user will load defaults via Lock button
        } catch (error) {
            console.error('Error loading data:', error);
        }
    },

    // Initialize with sample data
    async initializeSampleData() {
        const sampleData = [
            {
                subject: 'Maths',
                chapterNo: '1',
                chapterName: 'Integers',
                examTypes: ['Half Yearly', 'Annual'],
                learningStatus: {
                    'School': 'Completed',
                    'Tuition': 'Completed',
                    'Online App': 'In Progress',
                    'Self Study': 'Not Started'
                },
                writingDone: 'Yes',
                confidence: 'Good',
                notes: 'Need to practice more word problems',
                lastUpdated: new Date().toISOString()
            },
            {
                subject: 'Maths',
                chapterNo: '2',
                chapterName: 'Fractions and Decimals',
                examTypes: ['Half Yearly', 'Annual'],
                learningStatus: {
                    'School': 'Completed',
                    'Tuition': 'Not Required',
                    'Online App': 'In Progress',
                    'Self Study': 'Not Started'
                },
                writingDone: 'Partial',
                confidence: 'Medium',
                notes: 'Practice decimal division',
                lastUpdated: new Date().toISOString()
            },
            {
                subject: 'Science',
                chapterNo: '1',
                chapterName: 'Nutrition in Plants',
                examTypes: ['Unit Test 1', 'Half Yearly'],
                learningStatus: {
                    'School': 'In Progress',
                    'Tuition': 'Not Required',
                    'Online App': 'Not Started',
                    'Self Study': 'Not Started'
                },
                writingDone: 'No',
                confidence: 'None',
                notes: 'Diagrams need practice',
                lastUpdated: new Date().toISOString()
            }
        ];

        for (const chapter of sampleData) {
            await DBManager.addChapter(chapter);
        }
        
        this.trackingData = await DBManager.getAllTrackingData();
    },

    // Save data (automatically saves to IndexedDB)
    async saveData() {
        // Auto-backup happens in background
        await DBManager.setupAutoBackup();
    },

    // Add a new subject
    async addSubject(subjectName) {
        const trimmed = subjectName.trim();
        if (trimmed && !this.subjects.includes(trimmed)) {
            this.subjects.push(trimmed);
            await DBManager.updateConfig('subjects', this.subjects);
            return true;
        }
        return false;
    },

    // Remove a subject
    async removeSubject(subjectName) {
        const index = this.subjects.indexOf(subjectName);
        if (index > -1) {
            this.subjects.splice(index, 1);
            await DBManager.updateConfig('subjects', this.subjects);
            
            // Remove all chapters of this subject
            const chaptersToDelete = this.trackingData.filter(row => row.subject === subjectName);
            for (const chapter of chaptersToDelete) {
                await DBManager.deleteChapter(chapter.id);
            }
            this.trackingData = this.trackingData.filter(row => row.subject !== subjectName);
            return true;
        }
        return false;
    },

    // Add a new learning method
    async addLearningMethod(methodName) {
        const trimmed = methodName.trim();
        if (trimmed && !this.learningMethods.includes(trimmed)) {
            this.learningMethods.push(trimmed);
            await DBManager.updateConfig('learningMethods', this.learningMethods);
            
            // Add this method to all existing chapters
            for (const row of this.trackingData) {
                if (!row.learningStatus) row.learningStatus = {};
                row.learningStatus[trimmed] = 'Not Started';
                await DBManager.updateChapter(row.id, { learningStatus: row.learningStatus });
            }
            return true;
        }
        return false;
    },

    // Remove a learning method
    async removeLearningMethod(methodName) {
        const index = this.learningMethods.indexOf(methodName);
        if (index > -1) {
            this.learningMethods.splice(index, 1);
            await DBManager.updateConfig('learningMethods', this.learningMethods);
            
            // Remove this method from all chapters
            for (const row of this.trackingData) {
                if (row.learningStatus && row.learningStatus[methodName] !== undefined) {
                    delete row.learningStatus[methodName];
                    await DBManager.updateChapter(row.id, { learningStatus: row.learningStatus });
                }
            }
            return true;
        }
        return false;
    },

    // Add a new exam type
    async addExamType(examName) {
        const trimmed = examName.trim();
        if (trimmed && !this.examTypes.includes(trimmed)) {
            this.examTypes.push(trimmed);
            await DBManager.updateConfig('examTypes', this.examTypes);
            return true;
        }
        return false;
    },

    // Remove an exam type
    async removeExamType(examName) {
        const index = this.examTypes.indexOf(examName);
        if (index > -1) {
            this.examTypes.splice(index, 1);
            await DBManager.updateConfig('examTypes', this.examTypes);
            
            // Remove exam type from chapters
            for (const row of this.trackingData) {
                if (!row.examTypes) row.examTypes = [];
                if (Array.isArray(row.examTypes)) {
                    const examIndex = row.examTypes.indexOf(examName);
                    if (examIndex > -1) {
                        row.examTypes.splice(examIndex, 1);
                        await DBManager.updateChapter(row.id, { examTypes: row.examTypes });
                    }
                }
            }
            return true;
        }
        return false;
    },

    // Add a new chapter row
    async addChapter() {
        const learningStatus = {};
        this.learningMethods.forEach(method => {
            learningStatus[method] = 'Not Started';
        });

        const newRow = {
            subject: '',
            chapterNo: '',
            chapterName: '',
            examTypes: [],
            learningStatus: learningStatus,
            writingDone: 'No',
            confidence: 'None',
            notes: '',
            lastUpdated: null
        };
        
        const addedRow = await DBManager.addChapter(newRow);
        this.trackingData.push(addedRow);
        return addedRow;
    },

    // Delete a chapter
    async deleteChapter(id) {
        await DBManager.deleteChapter(id);
        this.trackingData = this.trackingData.filter(row => row.id !== id);
    },

    // Update chapter data
    async updateChapter(id, field, value) {
        const row = this.trackingData.find(r => r.id === id);
        if (row) {
            const oldValue = row[field];
            row[field] = value;
            
            // Only update lastUpdated for confidence upgrades
            if (field === 'confidence') {
                const confidenceLevels = ['None', 'Low', 'Medium', 'Good', 'Excellent'];
                const oldIndex = confidenceLevels.indexOf(oldValue);
                const newIndex = confidenceLevels.indexOf(value);
                
                if (newIndex > oldIndex) {
                    row.lastUpdated = new Date().toISOString();
                }
            }
            
            await DBManager.updateChapter(id, { [field]: value, lastUpdated: row.lastUpdated });
        }
    },

    // Update learning method status
    async updateLearningStatus(id, method, value) {
        const row = this.trackingData.find(r => r.id === id);
        if (row) {
            if (!row.learningStatus) row.learningStatus = {};
            
            const oldValue = row.learningStatus[method] || 'Not Started';
            row.learningStatus[method] = value;
            
            const statusLevels = {
                'Not Started': 0,
                'In Progress': 1,
                'Completed': 2,
                'Not Required': -1
            };
            
            const oldLevel = statusLevels[oldValue] || 0;
            const newLevel = statusLevels[value] || 0;
            
            if (newLevel > oldLevel && newLevel !== -1 && oldLevel !== -1) {
                row.lastUpdated = new Date().toISOString();
            }
            
            await DBManager.updateChapter(id, { 
                learningStatus: row.learningStatus,
                lastUpdated: row.lastUpdated
            });
        }
    },

    // Update student info
    async updateStudentInfo(field, value) {
        // Don't allow changes to name or class if locked
        if (this.studentInfo.locked && (field === 'name' || field === 'class')) {
            console.warn('Student info is locked - cannot change name or class');
            return false;
        }
        
        this.studentInfo[field] = value;
        await DBManager.updateStudentInfo(field, value);        
        // If class changed, offer to load default subjects
        if (field === 'class') {
            return await this.handleClassChange(value);
        }
    },

    // Lock student info (called after initial setup is complete)
    async lockStudentInfo() {
        this.studentInfo.locked = true;
        await DBManager.updateStudentInfo('locked', true);
        console.log('🔒 Student info locked - name and class are now fixed');
    },

    // Update subject name in all user chapters (for when admin changes subject names)
    async updateSubjectInChapters(oldSubject, newSubject) {
        let updatedCount = 0;
        
        for (const chapter of this.trackingData) {
            if (chapter.subject === oldSubject) {
                chapter.subject = newSubject;
                await DBManager.updateChapter(chapter.id, { subject: newSubject });
                updatedCount++;
            }
        }
        
        console.log(`✅ Updated ${updatedCount} chapter(s) from "${oldSubject}" to "${newSubject}"`);
        return updatedCount;
    },

    // Sync subjects with current class defaults (update orphaned chapters)
    async syncSubjectsFromDefaults() {
        const className = this.studentInfo.class;
        if (!className) {
            alert('⚠️ Please select a class first');
            return;
        }
        
        const defaults = await DBManager.getClassDefaults(className);
        if (!defaults || !defaults.subjects) {
            alert('⚠️ No defaults found for this class');
            return;
        }
        
        // Find chapters with subjects not in current defaults
        const orphanedChapters = this.trackingData.filter(ch => 
            ch.subject && !defaults.subjects.includes(ch.subject)
        );
        
        if (orphanedChapters.length === 0) {
            alert('✅ All chapters are already synced with current subjects!');
            return;
        }
        
        // Group by subject
        const orphanedBySubject = {};
        orphanedChapters.forEach(ch => {
            if (!orphanedBySubject[ch.subject]) {
                orphanedBySubject[ch.subject] = [];
            }
            orphanedBySubject[ch.subject].push(ch);
        });
        
        // Show report and offer to update
        let report = `Found ${orphanedChapters.length} chapter(s) with outdated subjects:\n\n`;
        for (const [oldSubject, chapters] of Object.entries(orphanedBySubject)) {
            report += `• "${oldSubject}" (${chapters.length} chapters)\n`;
        }
        report += `\nCurrent subjects: ${defaults.subjects.join(', ')}\n\n`;
        report += `Update these chapters manually in the table.`;
        
        alert(report);
        return orphanedBySubject;
    },

    // Handle class change - load defaults for the selected class
    async handleClassChange(className) {
        // Skip if class is empty or invalid
        if (!className || className.trim() === '') {
            return false;
        }
        
        // If student info is locked, don't load defaults (user already set up)
        if (this.studentInfo.locked) {
            console.log('🔒 Student info locked - class change ignored');
            return false;
        }

        const defaults = await DBManager.getClassDefaults(className);
        console.log(`📋 Fetched defaults for Class ${className}:`, defaults);
        
        if (!defaults) {
            console.warn(`⚠️ No defaults found for class ${className}`);
            alert(`⚠️ No defaults found for Class ${className}. Please check class-defaults.json file.`);
            return false;
        }

        // Auto-load defaults whenever class changes and not locked
        // This ensures UI always refreshes with the selected class defaults
        console.log(`📦 Loading defaults for Class ${className}...`);
        
        // Auto-load subjects
        this.subjects = [...defaults.subjects];
        await DBManager.updateConfig('subjects', this.subjects);
        console.log(`✅ Subjects loaded (${this.subjects.length}):`, this.subjects);

        // Auto-load learning methods
        this.learningMethods = [...defaults.learningMethods];
        await DBManager.updateConfig('learningMethods', this.learningMethods);
        console.log(`✅ Learning methods loaded (${this.learningMethods.length}):`, this.learningMethods);

        // Auto-load exam types
        this.examTypes = [...defaults.examTypes];
        await DBManager.updateConfig('examTypes', this.examTypes);
        console.log(`✅ Exam types loaded (${this.examTypes.length}):`, this.examTypes);

        // Load default chapters (since user just selected class for first time)
        console.log(`📖 Loading default chapters for Class ${className}...`);
        const chaptersAdded = await this.loadDefaultChapters(className, true);
        console.log(`✅ Default chapters loaded: ${chaptersAdded} chapters added`);
        
        console.log(`✅ Class ${className} defaults loaded completely`);
        return true; // Always indicate that defaults were loaded
    },

    // Load default chapters for the class
    async loadDefaultChapters(className, autoLoad = false) {
        const defaultChapters = await DBManager.getDefaultChapters(className);
        
        if (defaultChapters && defaultChapters.length > 0) {
            // Auto-load mode (first-time setup) or ask for confirmation
            let shouldLoad = autoLoad;
            
            if (!autoLoad) {
                const chapterList = defaultChapters.map(ch => `  • ${ch.subject} - Ch ${ch.chapterNo}: ${ch.chapterName}`).join('\n');
                const message = `📚 Found ${defaultChapters.length} default chapter${defaultChapters.length > 1 ? 's' : ''} for Class ${className}:\n\n${chapterList}\n\nAdd these chapters to your tracking?`;
                shouldLoad = confirm(message);
            }
            
            if (shouldLoad) {
                let added = 0;
                for (const chapter of defaultChapters) {
                    const learningStatus = {};
                    this.learningMethods.forEach(method => {
                        learningStatus[method] = 'Not Started';
                    });

                    const newChapter = {
                        subject: chapter.subject,
                        chapterNo: chapter.chapterNo,
                        chapterName: chapter.chapterName,
                        examTypes: [],
                        learningStatus: learningStatus,
                        writingDone: 'No',
                        confidence: 'None',
                        notes: chapter.description || '',
                        lastUpdated: null
                    };
                    
                    const addedChapter = await DBManager.addChapter(newChapter);
                    this.trackingData.push(addedChapter);
                    added++;
                }
                
                return added;
            }
        }
        return 0;
    },

    // Export data (enhanced with backups)
    async exportData() {
        await DBManager.exportFullDatabase();
    },

    // Export to Excel
    async exportToExcel() {
        let csv = 'Subject,Chapter No,Chapter Name,Exam Types';
        
        this.learningMethods.forEach(method => {
            csv += `,${method}`;
        });
        
        csv += ',Writing Done,Confidence,Last Updated,Notes\n';
        
        this.trackingData.forEach(row => {
            const examTypes = Array.isArray(row.examTypes) ? row.examTypes.join('; ') : '';
            const chapterName = `"${(row.chapterName || '').replace(/"/g, '""')}"`;
            const notes = `"${(row.notes || '').replace(/"/g, '""')}"`;
            
            csv += `${row.subject},${row.chapterNo},${chapterName},"${examTypes}"`;
            
            this.learningMethods.forEach(method => {
                const status = row.learningStatus[method] || 'Not Started';
                csv += `,${status}`;
            });
            
            const lastUpdated = row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : 'Never';
            csv += `,${row.writingDone},${row.confidence},"${lastUpdated}",${notes}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-tracker-${this.studentInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    },

    // Clear all data (with confirmation)
    async clearAllData() {
        // Create backup before clearing
        await DBManager.createBackup('Pre-clear backup');
        
        // Clear in-memory data
        this.trackingData = [];
        this.subjects = ['Maths', 'Science'];
        this.learningMethods = ['School', 'Tuition', 'Online App', 'Self Study'];
        this.examTypes = ['Half Yearly', 'Annual', 'Unit Test 1'];
        
        // Clear database
        await db.trackingData.clear();
        await DBManager.updateConfig('subjects', this.subjects);
        await DBManager.updateConfig('learningMethods', this.learningMethods);
        await DBManager.updateConfig('examTypes', this.examTypes);
    },

    // Get unique subjects
    getActiveSubjects() {
        const subjects = this.trackingData
            .map(row => row.subject.trim())
            .filter(subject => subject !== '');
        return [...new Set(subjects)];
    },

    // === DAILY WORK METHODS ===
    
    async addDailyTask(subject, task, chapterId = null, date = null) {
        const taskDate = date || UIDaily.currentSelectedDate || new Date().toISOString().split('T')[0];
        const newTask = {
            date: taskDate,
            subject: subject,
            task: task,
            chapterId: chapterId,
            status: 'pending',
            actualWork: ''
        };
        
        const id = await DBManager.addDailyTask(newTask);
        this.dailyPlans.push({ ...newTask, id });
    },

    async removeDailyTask(taskId) {
        await DBManager.removeDailyTask(taskId);
        this.dailyPlans = this.dailyPlans.filter(t => t.id !== taskId);
    },

    async updateDailyTask(taskId, status, actualWork) {
        // Find in memory
        let task = this.dailyPlans.find(t => t.id === taskId);
        
        // If not in memory, load from DB
        if (!task) {
            const allPlans = await db.dailyPlans.toArray();
            task = allPlans.find(t => t.id === taskId);
            if (task) {
                this.dailyPlans.push(task);
            }
        }
        
        if (task) {
            task.status = status;
            task.actualWork = actualWork || task.task;
            await DBManager.updateDailyTask(taskId, { status, actualWork: task.actualWork });
            
            // Auto-calculate and save score for this day
            await this.autoSaveDayScore(task.date);
        }
    },

    // Auto-calculate and save daily score (no manual save needed)
    async autoSaveDayScore(date) {
        const dayTasks = await this.getDailyPlanForDate(date);
        
        if (dayTasks.length === 0) return;
        
        let totalScore = 0;
        dayTasks.forEach(task => {
            if (task.status === 'done') totalScore += 1;
            else if (task.status === 'partial') totalScore += 0.5;
        });
        const percentage = Math.round((totalScore / dayTasks.length) * 100);
        
        // Save to history
        await DBManager.saveDailyCompletion(date, dayTasks, percentage);
    },

    // Get daily plan for specific date
    async getDailyPlanForDate(date) {
        // Check if in memory first
        let dateTasks = this.dailyPlans.filter(t => t.date === date);
        
        // If not in memory, load from DB
        if (dateTasks.length === 0) {
            dateTasks = await db.dailyPlans.where('date').equals(date).toArray();
            // Add to memory
            this.dailyPlans.push(...dateTasks);
        }
        
        return dateTasks;
    },

    getTodaysPlan() {
        const today = new Date().toISOString().split('T')[0];
        return this.dailyPlans.filter(t => t.date === today);
    },

    async getWeekHistory() {
        return await DBManager.getWeekHistory();
    },

    async getWeeklyStats() {
        const weekData = await this.getWeekHistory();
        const daysWithData = weekData.filter(d => d.score !== null);
        
        if (daysWithData.length === 0) {
            return { average: 0, daysWorked: 0, subjectFrequency: {} };
        }
        
        const average = Math.round(
            daysWithData.reduce((sum, d) => sum + d.score, 0) / daysWithData.length
        );
        
        const subjectFrequency = {};
        daysWithData.forEach(day => {
            day.tasks.forEach(task => {
                subjectFrequency[task.subject] = (subjectFrequency[task.subject] || 0) + 1;
            });
        });
        
        return {
            average: average,
            daysWorked: daysWithData.length,
            subjectFrequency: subjectFrequency
        };
    },

    // === BACKUP & RESTORE UI ===
    
    showBackupReminder() {
        setTimeout(() => {
            if (confirm('📥 Weekly Backup Reminder!\n\nIt\'s been a week since your last backup.\n\nWould you like to export your data now?\n\n(Recommended: Yes - keeps your data safe!)')) {
                this.exportData();
            }
        }, 2000);
    },

    async showBackupManager() {
        const backups = await DBManager.listBackups();
        
        let html = `
            <div class="backup-manager">
                <h3>🔐 Backup & Recovery Center</h3>
                <p>Your data is automatically backed up daily. IndexedDB provides better protection than localStorage.</p>
                
                <div class="backup-actions">
                    <button onclick="DataManager.exportData()" class="btn-primary">
                        📥 Export Full Backup
                    </button>
                    <button onclick="document.getElementById('importFile').click()" class="btn-secondary">
                        📤 Import Backup
                    </button>
                    <input type="file" id="importFile" accept=".json" style="display:none" 
                           onchange="DataManager.handleImport(event)">
                </div>
                
                <h4>📜 Recent Auto-Backups (${backups.length})</h4>
                <div class="backup-list">
                    ${backups.slice(0, 5).map(b => `
                        <div class="backup-item">
                            <span class="backup-date">${new Date(b.timestamp).toLocaleString()}</span>
                            <span class="backup-desc">${b.description}</span>
                            <button onclick="DataManager.restoreBackup(${b.id})" class="btn-restore">
                                ↩️ Restore
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="backup-info">
                    <p>✅ <strong>Protected:</strong> Data persists even if browser cache is cleared</p>
                    <p>💾 <strong>Auto-Backup:</strong> Every 24 hours (keeps last 10)</p>
                    <p>📥 <strong>Export:</strong> Save to Google Drive, Dropbox, or USB for extra safety</p>
                </div>
            </div>
        `;
        
        return html;
    },

    async restoreBackup(backupId) {
        if (confirm('⚠️ Are you sure?\n\nThis will replace all current data with the backup.\n\nCurrent data will be saved as a backup before restoring.')) {
            await DBManager.createBackup('Pre-restore backup');
            const success = await DBManager.restoreFromBackup(backupId);
            
            if (success) {
                alert('✅ Backup restored successfully!\n\nPage will reload now.');
                location.reload();
            } else {
                alert('❌ Restore failed. Your current data is safe.');
            }
        }
    },

    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const success = await DBManager.importFullDatabase(data);
                
                if (success) {
                    alert('✅ Data imported successfully!\n\nPage will reload now.');
                    location.reload();
                } else {
                    alert('❌ Import failed. Please check the file format.');
                }
            } catch (error) {
                alert('❌ Import error: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
};
