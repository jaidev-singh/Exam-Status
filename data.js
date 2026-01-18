// Data Management Module
const DataManager = {
    trackingData: [],
    studentInfo: {
        name: 'Gravit Chaudhary',
        class: '7',
        reviewDate: '2026-01-14'
    },
    subjects: ['Maths', 'Science', 'English', 'Social Studies'],
    learningMethods: ['School', 'Tuition', 'Online App', 'Self Study'],
    examTypes: ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test'],
    dailyPlans: [], // Today's planned tasks
    dailyHistory: [], // Historical daily completions

    // Initialize with default data
    init() {
        this.loadData();
    },

    // Save data to localStorage
    saveData() {
        const data = {
            studentInfo: this.studentInfo,
            trackingData: this.trackingData,
            subjects: this.subjects,
            learningMethods: this.learningMethods,
            examTypes: this.examTypes,
            dailyPlans: this.dailyPlans,
            dailyHistory: this.dailyHistory
        };
        localStorage.setItem('examTrackingData', JSON.stringify(data));
    },

    // Load data from localStorage
    loadData() {
        const savedData = localStorage.getItem('examTrackingData');
        const defaultExamTypes = ['Half Yearly', 'Annual', 'Unit Test 1', 'Unit Test 2', 'Weekly Test'];
        
        if (savedData) {
            const data = JSON.parse(savedData);
            this.studentInfo = data.studentInfo || this.studentInfo;
            this.trackingData = data.trackingData || [];
            this.subjects = data.subjects || this.subjects;
            this.learningMethods = data.learningMethods || this.learningMethods;
            this.dailyPlans = data.dailyPlans || [];
            this.dailyHistory = data.dailyHistory || [];
            
            // Merge exam types: keep user's custom ones + ensure all defaults are present
            if (Array.isArray(data.examTypes)) {
                this.examTypes = [...new Set([...data.examTypes, ...defaultExamTypes])];
            } else {
                this.examTypes = defaultExamTypes;
            }
            
            // Save updated data with merged exam types
            this.saveData();
        } else {
            // Initialize with sample data
            this.trackingData = [
                {
                    id: 1,
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
                    id: 2,
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
                    id: 3,
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
                    confidence: 'Low',
                    notes: 'Diagrams need practice',
                    lastUpdated: new Date().toISOString()
                }
            ];
        }
    },

    // Add a new subject
    addSubject(subjectName) {
        const trimmed = subjectName.trim();
        if (trimmed && !this.subjects.includes(trimmed)) {
            this.subjects.push(trimmed);
            this.saveData();
            return true;
        }
        return false;
    },

    // Remove a subject
    removeSubject(subjectName) {
        const index = this.subjects.indexOf(subjectName);
        if (index > -1) {
            // Remove subject
            this.subjects.splice(index, 1);
            // Remove all chapters of this subject
            this.trackingData = this.trackingData.filter(row => row.subject !== subjectName);
            this.saveData();
            return true;
        }
        return false;
    },

    // Add a new learning method
    addLearningMethod(methodName) {
        const trimmed = methodName.trim();
        if (trimmed && !this.learningMethods.includes(trimmed)) {
            this.learningMethods.push(trimmed);
            // Add this method to all existing chapters
            this.trackingData.forEach(row => {
                if (!row.learningStatus) row.learningStatus = {};
                row.learningStatus[trimmed] = 'Not Started';
            });
            this.saveData();
            return true;
        }
        return false;
    },

    // Remove a learning method
    removeLearningMethod(methodName) {
        const index = this.learningMethods.indexOf(methodName);
        if (index > -1) {
            this.learningMethods.splice(index, 1);
            // Remove this method from all chapters
            this.trackingData.forEach(row => {
                if (row.learningStatus && row.learningStatus[methodName] !== undefined) {
                    delete row.learningStatus[methodName];
                }
            });
            this.saveData();
            return true;
        }
        return false;
    },

    // Add a new exam type
    addExamType(examName) {
        const trimmed = examName.trim();
        if (trimmed && !this.examTypes.includes(trimmed)) {
            this.examTypes.push(trimmed);
            this.saveData();
            return true;
        }
        return false;
    },

    // Remove an exam type
    removeExamType(examName) {
        const index = this.examTypes.indexOf(examName);
        if (index > -1) {
            this.examTypes.splice(index, 1);
            // Remove exam type from chapters that have it
            this.trackingData.forEach(row => {
                if (!row.examTypes) row.examTypes = [];
                if (Array.isArray(row.examTypes)) {
                    const examIndex = row.examTypes.indexOf(examName);
                    if (examIndex > -1) {
                        row.examTypes.splice(examIndex, 1);
                    }
                } else if (row.examType === examName) {
                    // Migrate old single value to array
                    row.examTypes = [];
                    delete row.examType;
                }
            });
            this.saveData();
            return true;
        }
        return false;
    },

    // Add a new chapter row
    addChapter() {
        const learningStatus = {};
        this.learningMethods.forEach(method => {
            learningStatus[method] = 'Not Started';
        });

        const newRow = {
            id: Date.now(),
            subject: '',
            chapterNo: '',
            chapterName: '',
            examTypes: [],
            learningStatus: learningStatus,
            writingDone: 'No',
            confidence: 'None',
            notes: '',
            lastUpdated: null  // Don't set timestamp until actual progress is made
        };
        
        this.trackingData.push(newRow);
        this.saveData();
        return newRow;
    },

    // Delete a chapter
    deleteChapter(id) {
        this.trackingData = this.trackingData.filter(row => row.id !== id);
        this.saveData();
    },

    // Update chapter data
    updateChapter(id, field, value) {
        const row = this.trackingData.find(r => r.id === id);
        if (row) {
            const oldValue = row[field];
            row[field] = value;
            
            // Only update lastUpdated for confidence upgrades (not downgrades)
            if (field === 'confidence') {
                const confidenceLevels = ['None', 'Low', 'Medium', 'Good', 'Excellent'];
                const oldIndex = confidenceLevels.indexOf(oldValue);
                const newIndex = confidenceLevels.indexOf(value);
                
                // Only update if it's an upgrade (moving to higher index)
                if (newIndex > oldIndex) {
                    row.lastUpdated = new Date().toISOString();
                }
            }
            
            this.saveData();
        }
    },

    // Update learning method status
    updateLearningStatus(id, method, value) {
        const row = this.trackingData.find(r => r.id === id);
        if (row) {
            if (!row.learningStatus) row.learningStatus = {};
            
            const oldValue = row.learningStatus[method] || 'Not Started';
            row.learningStatus[method] = value;
            
            // Only update lastUpdated for upgrades (Not Started → In Progress → Completed)
            // Status hierarchy: Not Started < In Progress < Completed
            // Not Required is treated as no change
            const statusLevels = {
                'Not Started': 0,
                'In Progress': 1,
                'Completed': 2,
                'Not Required': -1  // Special case, doesn't trigger update
            };
            
            const oldLevel = statusLevels[oldValue] || 0;
            const newLevel = statusLevels[value] || 0;
            
            // Only update if it's an upgrade and not switching to/from 'Not Required'
            if (newLevel > oldLevel && newLevel !== -1 && oldLevel !== -1) {
                row.lastUpdated = new Date().toISOString();
            }
            
            this.saveData();
        }
    },

    // Update student info
    updateStudentInfo(field, value) {
        this.studentInfo[field] = value;
        this.saveData();
    },

    // Export data as JSON (for backup/restore)
    exportData() {
        const data = {
            studentInfo: this.studentInfo,
            trackingData: this.trackingData,
            subjects: this.subjects,
            learningMethods: this.learningMethods,
            examTypes: this.examTypes,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-tracker-${this.studentInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },

    // Export data as Excel (CSV format)
    exportToExcel() {
        // CSV Header
        let csv = 'Subject,Chapter No,Chapter Name,Exam Types';
        
        // Add learning methods to header
        this.learningMethods.forEach(method => {
            csv += `,${method}`;
        });
        
        csv += ',Writing Done,Confidence,Last Updated,Notes\n';
        
        // Add data rows
        this.trackingData.forEach(row => {
            const examTypes = Array.isArray(row.examTypes) ? row.examTypes.join('; ') : '';
            const chapterName = `"${(row.chapterName || '').replace(/"/g, '""')}"`;
            const notes = `"${(row.notes || '').replace(/"/g, '""')}"`;
            
            csv += `${row.subject},${row.chapterNo},${chapterName},"${examTypes}"`;
            
            // Add learning status for each method
            this.learningMethods.forEach(method => {
                const status = row.learningStatus[method] || 'Not Started';
                csv += `,${status}`;
            });
            
            const lastUpdated = row.lastUpdated ? new Date(row.lastUpdated).toLocaleString() : 'Never';
            csv += `,${row.writingDone},${row.confidence},"${lastUpdated}",${notes}\n`;
        });
        
        // Create and download CSV file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exam-tracker-${this.studentInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    },

    // Clear all data
    clearAllData() {
        this.trackingData = [];
        this.subjects = ['Maths', 'Science'];
        this.learningMethods = ['School', 'Tuition', 'Online App', 'Self Study'];
        this.examTypes = ['Half Yearly', 'Annual', 'Unit Test 1'];
        localStorage.removeItem('examTrackingData');
        this.saveData();
    },

    // Get unique subjects from tracking data
    getActiveSubjects() {
        const subjects = this.trackingData
            .map(row => row.subject.trim())
            .filter(subject => subject !== '');
        return [...new Set(subjects)];
    },

    // ===== DAILY WORK METHODS =====
    
    // Add task to today's plan
    addDailyTask(subject, task, chapterId = null) {
        const today = new Date().toISOString().split('T')[0];
        this.dailyPlans.push({
            id: Date.now(),
            date: today,
            subject: subject,
            task: task,
            chapterId: chapterId, // Link to chapter if applicable
            status: 'pending', // pending, done, partial, notDone
            actualWork: ''
        });
        this.saveData();
    },

    // Remove task from today's plan
    removeDailyTask(taskId) {
        this.dailyPlans = this.dailyPlans.filter(t => t.id !== taskId);
        this.saveData();
    },

    // Update task status and actual work
    updateDailyTask(taskId, status, actualWork) {
        const task = this.dailyPlans.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            task.actualWork = actualWork || task.task;
            this.saveData();
        }
    },

    // Save today's work and move to history
    saveDailyCompletion() {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.dailyPlans.filter(t => t.date === today);
        
        if (todayTasks.length === 0) return 0;
        
        // Calculate today's score
        let totalScore = 0;
        todayTasks.forEach(task => {
            if (task.status === 'done') totalScore += 1;
            else if (task.status === 'partial') totalScore += 0.5;
        });
        const percentage = Math.round((totalScore / todayTasks.length) * 100);
        
        // Save to history
        const existing = this.dailyHistory.find(h => h.date === today);
        if (existing) {
            existing.tasks = todayTasks;
            existing.score = percentage;
        } else {
            this.dailyHistory.push({
                date: today,
                tasks: todayTasks,
                score: percentage
            });
        }
        
        // Clear today's plans
        this.dailyPlans = this.dailyPlans.filter(t => t.date !== today);
        this.saveData();
        
        return percentage;
    },

    // Get today's plan
    getTodaysPlan() {
        const today = new Date().toISOString().split('T')[0];
        return this.dailyPlans.filter(t => t.date === today);
    },

    // Get week's history (last 7 days)
    getWeekHistory() {
        const weekData = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            const historyEntry = this.dailyHistory.find(h => h.date === dateStr);
            weekData.push({
                date: dateStr,
                day: dayName,
                score: historyEntry ? historyEntry.score : null,
                tasks: historyEntry ? historyEntry.tasks : []
            });
        }
        
        return weekData;
    },

    // Get weekly stats
    getWeeklyStats() {
        const weekData = this.getWeekHistory();
        const daysWithData = weekData.filter(d => d.score !== null);
        
        if (daysWithData.length === 0) {
            return { average: 0, daysWorked: 0, subjectFrequency: {} };
        }
        
        const average = Math.round(
            daysWithData.reduce((sum, d) => sum + d.score, 0) / daysWithData.length
        );
        
        // Calculate subject frequency
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
    }
};
