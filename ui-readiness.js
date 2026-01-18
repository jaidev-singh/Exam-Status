// UI Readiness Cards Module
const UIReadiness = {
    // Render readiness cards
    renderReadinessCards() {
        const container = document.getElementById('readinessCards');
        const subjects = DataManager.getActiveSubjects();
        
        if (subjects.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; width: 100%;">Add subjects and chapters to see readiness overview</p>';
            return;
        }
        
        container.innerHTML = '';
        
        subjects.forEach(subject => {
            const readiness = Calculator.calculateSubjectReadiness(subject);
            const emoji = Calculator.getReadinessEmoji(readiness);
            const colorClass = Calculator.getReadinessClass(readiness);
            const percentage = readiness * 10; // Convert back to percentage for bar width
            
            const card = document.createElement('div');
            card.className = 'readiness-card';
            card.innerHTML = `
                <h3>${subject} Readiness</h3>
                <div class="readiness-bar">
                    <div class="readiness-fill ${colorClass}" style="width: ${percentage}%">
                        ${emoji} ${readiness}/10
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Render exam summary view
    renderExamSummary(examType) {
        const container = document.getElementById('examSummaryContent');
        
        if (!examType) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>Select an Exam</h3>
                    <p>Choose an exam from the dropdown to see its readiness summary</p>
                </div>
            `;
            return;
        }
        
        const examChapters = DataManager.trackingData.filter(row => {
            const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
            return rowExamTypes.includes(examType);
        });
        
        if (examChapters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Chapters Found</h3>
                    <p>No chapters are assigned to "${examType}" exam yet.</p>
                </div>
            `;
            return;
        }
        
        // Calculate overall exam readiness
        const overallScore = Calculator.calculateExamReadiness(examType);
        const emoji = Calculator.getReadinessEmoji(overallScore);
        const colorClass = Calculator.getReadinessClass(overallScore);
        const percentage = overallScore * 10;
        
        // Get statistics
        const stats = Calculator.getExamStats(examType);
        
        // Get unique subjects in this exam
        const subjectsInExam = [...new Set(examChapters.map(ch => ch.subject).filter(s => s))];
        
        // Build HTML
        let html = `
            <div class="exam-overview">
                <div class="exam-overall-card">
                    <h2>Overall ${examType} Exam Readiness</h2>
                    <p class="exam-subtitle">${subjectsInExam.length} subject${subjectsInExam.length > 1 ? 's' : ''} • ${stats.total} chapter${stats.total > 1 ? 's' : ''}</p>
                    <div class="exam-score-display">
                        <div class="big-score ${colorClass}">${emoji} ${overallScore}/10</div>
                        <div class="readiness-bar">
                            <div class="readiness-fill ${colorClass}" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="exam-stats-cards">
                    <div class="stat-card stat-total">
                        <div class="stat-number">${stats.total}</div>
                        <div class="stat-label">Total Chapters</div>
                    </div>
                    <div class="stat-card stat-completed">
                        <div class="stat-number">${stats.completed}</div>
                        <div class="stat-label">✅ Completed</div>
                    </div>
                    <div class="stat-card stat-progress">
                        <div class="stat-number">${stats.inProgress}</div>
                        <div class="stat-label">🔄 In Progress</div>
                    </div>
                    <div class="stat-card stat-pending">
                        <div class="stat-number">${stats.notStarted}</div>
                        <div class="stat-label">⭕ Not Started</div>
                    </div>
                </div>
            </div>
            
            <div class="exam-subjects-breakdown">
                <h3>Subject-wise Breakdown for ${examType}</h3>
        `;
        
        // Group chapters by subject
        const chaptersBySubject = {};
        examChapters.forEach(chapter => {
            const subject = chapter.subject || 'Unassigned';
            if (!chaptersBySubject[subject]) {
                chaptersBySubject[subject] = [];
            }
            chaptersBySubject[subject].push(chapter);
        });
        
        // Subject readiness cards
        Object.keys(chaptersBySubject).sort().forEach(subject => {
            const subjectScore = Calculator.calculateSubjectReadiness(subject, examType);
            const subjectEmoji = Calculator.getReadinessEmoji(subjectScore);
            const subjectColorClass = Calculator.getReadinessClass(subjectScore);
            const subjectPercentage = subjectScore * 10;
            const chapterCount = chaptersBySubject[subject].length;
            
            html += `
                <div class="exam-subject-card">
                    <div class="subject-header">
                        <h4>${subject}</h4>
                        <span class="chapter-count">${chapterCount} chapter${chapterCount > 1 ? 's' : ''}</span>
                    </div>
                    <div class="subject-readiness-display">
                        <div class="readiness-score">${subjectEmoji} ${subjectScore}/10</div>
                        <div class="readiness-bar">
                            <div class="readiness-fill ${subjectColorClass}" style="width: ${subjectPercentage}%"></div>
                        </div>
                    </div>
                    <div class="chapter-list">
            `;
            
            chaptersBySubject[subject].forEach(chapter => {
                const statusIcon = UIUtils.getChapterStatusIcon(chapter);
                html += `
                    <div class="chapter-item">
                        <span class="chapter-number">Ch ${chapter.chapterNo}</span>
                        <span class="chapter-name">${chapter.chapterName}</span>
                        <span class="chapter-status">${statusIcon}</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
};
