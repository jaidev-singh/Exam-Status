// Calculations Module
const Calculator = {
    // Calculate readiness for a subject
    calculateSubjectReadiness(subject, examType = null) {
        let subjectChapters;
        
        if (examType) {
            // Filter by both subject AND exam type
            subjectChapters = DataManager.trackingData.filter(row => {
                const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
                return row.subject.toLowerCase() === subject.toLowerCase() && rowExamTypes.includes(examType);
            });
            console.log(`Subject: ${subject}, Exam: ${examType}, Chapters found: ${subjectChapters.length}`);
        } else {
            // Filter by subject only (all chapters)
            subjectChapters = DataManager.trackingData.filter(
                row => row.subject.toLowerCase() === subject.toLowerCase()
            );
        }
        
        if (subjectChapters.length === 0) return 0;
        
        let totalScore = 0;
        const learningMethodsCount = DataManager.learningMethods.length;
        const maxScorePerChapter = learningMethodsCount + 1 + 4; // methods + writing + confidence (max 4)
        
        subjectChapters.forEach(chapter => {
            let score = 0;
            
            // Learning methods (1 point each for completed, 0.5 for in progress)
            if (chapter.learningStatus) {
                DataManager.learningMethods.forEach(method => {
                    const status = chapter.learningStatus[method];
                    if (status === 'Completed') score += 1;
                    else if (status === 'In Progress') score += 0.5;
                    // 'Not Started' and 'Not Required' = 0 points
                });
            }
            
            // Writing done (1 point for Yes, 0.5 for Partial)
            if (chapter.writingDone === 'Yes') score += 1;
            else if (chapter.writingDone === 'Partial') score += 0.5;
            
            // Confidence
            switch(chapter.confidence) {                case 'None': score += 0; break;                case 'Low': score += 1; break;
                case 'Medium': score += 2; break;
                case 'Good': score += 3; break;
                case 'Excellent': score += 4; break;
            }
            
            totalScore += score;
        });
        
        const maxPossibleScore = subjectChapters.length * maxScorePerChapter;
        const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
        const finalScore = maxPossibleScore > 0 ? Math.round((percentage / 10) * 10) / 10 : 0;
        
        if (examType) {
            console.log(`${subject} (${examType}): ${totalScore}/${maxPossibleScore} = ${percentage.toFixed(1)}% = ${finalScore}/10`);
        }
        
        return finalScore;
    },

    // Get readiness emoji based on score out of 10
    getReadinessEmoji(score) {
        if (score >= 8) return '✅';
        if (score >= 6) return '⚠️';
        return '❌';
    },

    // Get readiness class for styling based on score out of 10
    getReadinessClass(score) {
        if (score >= 8) return 'excellent';
        if (score >= 6) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    },

    // Calculate readiness for a specific exam
    calculateExamReadiness(examType) {
        const examChapters = DataManager.trackingData.filter(row => {
            const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
            return rowExamTypes.includes(examType);
        });
        
        if (examChapters.length === 0) return 0;
        
        let totalScore = 0;
        const learningMethodsCount = DataManager.learningMethods.length;
        const maxScorePerChapter = learningMethodsCount + 1 + 4;
        
        examChapters.forEach(chapter => {
            let score = 0;
            
            // Learning methods
            if (chapter.learningStatus) {
                DataManager.learningMethods.forEach(method => {
                    const status = chapter.learningStatus[method];
                    if (status === 'Completed') score += 1;
                    else if (status === 'In Progress') score += 0.5;
                });
            }
            
            // Writing done
            if (chapter.writingDone === 'Yes') score += 1;
            else if (chapter.writingDone === 'Partial') score += 0.5;
            
            // Confidence
            switch(chapter.confidence) {
                case 'None': score += 0; break;
                case 'Low': score += 1; break;
                case 'Medium': score += 2; break;
                case 'Good': score += 3; break;
                case 'Excellent': score += 4; break;
            }
            
            totalScore += score;
        });
        
        const maxPossibleScore = examChapters.length * maxScorePerChapter;
        const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
        return maxPossibleScore > 0 ? Math.round((percentage / 10)) / 10 : 0;
    },

    // Get exam statistics
    getExamStats(examType) {
        const examChapters = DataManager.trackingData.filter(row => {
            const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
            return rowExamTypes.includes(examType);
        });
        
        const total = examChapters.length;
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        
        examChapters.forEach(chapter => {
            if (!chapter.learningStatus) {
                notStarted++;
                return;
            }
            
            const statuses = Object.values(chapter.learningStatus);
            const hasCompleted = statuses.some(s => s === 'Completed');
            const hasInProgress = statuses.some(s => s === 'In Progress');
            const allNotStarted = statuses.every(s => s === 'Not Started' || s === 'Not Required');
            
            if (hasCompleted && !hasInProgress && chapter.writingDone === 'Yes') {
                completed++;
            } else if (hasInProgress || hasCompleted) {
                inProgress++;
            } else if (allNotStarted) {
                notStarted++;
            } else {
                inProgress++;
            }
        });
        
        return { total, completed, inProgress, notStarted };
    }
};
