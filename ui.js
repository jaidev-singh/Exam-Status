// UI Rendering Module
const UIRenderer = {
    // Render the main tracking table
    renderTable() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        if (DataManager.trackingData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="20" style="text-align: center; padding: 40px; color: #999;">No chapters added yet. Click "➕ Add Chapter" to start tracking!</td></tr>';
            return;
        }
        
        DataManager.trackingData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Build learning method dropdowns HTML
            let learningMethodsHTML = '';
            DataManager.learningMethods.forEach(method => {
                const currentStatus = row.learningStatus && row.learningStatus[method] ? row.learningStatus[method] : 'Not Started';
                learningMethodsHTML += `
                    <td>
                        <select onchange="handleLearningMethodChange(${row.id}, '${method}', this.value)">
                            <option value="Not Started" ${currentStatus === 'Not Started' ? 'selected' : ''}>⭕ Not Started</option>
                            <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
                            <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                            <option value="Not Required" ${currentStatus === 'Not Required' ? 'selected' : ''}>➖ Not Required</option>
                        </select>
                    </td>
                `;
            });
            
            // Subject dropdown
            const subjectOptions = DataManager.subjects.map(subject => 
                `<option value="${subject}" ${row.subject === subject ? 'selected' : ''}>${subject}</option>`
            ).join('');
            
            // Exam type custom dropdown with checkboxes
            const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
            const displayText = rowExamTypes.length > 0 ? rowExamTypes.join(', ') : 'Select Exams...';
            
            let examCheckboxOptions = '';
            DataManager.examTypes.forEach(exam => {
                const isChecked = rowExamTypes.includes(exam) ? 'checked' : '';
                examCheckboxOptions += `
                    <label class="dropdown-checkbox-item">
                        <input type="checkbox" value="${exam}" ${isChecked} 
                               onchange="updateExamCheckboxes(${row.id}, this.closest('.custom-dropdown'))">
                        <span>${exam}</span>
                    </label>
                `;
            });
            
            const examDropdown = `
                <div class="custom-dropdown" onclick="toggleDropdown(event, this)">
                    <div class="dropdown-display">${displayText}</div>
                    <div class="dropdown-panel">
                        ${examCheckboxOptions}
                    </div>
                </div>
            `;
            
            tr.innerHTML = `
                <td>
                    <select onchange="updateRowData(${row.id}, 'subject', this.value)">
                        <option value="">Select Subject</option>
                        ${subjectOptions}
                    </select>
                </td>
                <td><input type="text" value="${row.chapterNo}" onchange="updateRowData(${row.id}, 'chapterNo', this.value)" placeholder="#"></td>
                <td><input type="text" value="${row.chapterName}" onchange="updateRowData(${row.id}, 'chapterName', this.value)" placeholder="Chapter Name"></td>
                <td>
                    ${examDropdown}
                </td>
                ${learningMethodsHTML}
                <td>
                    <select onchange="updateRowData(${row.id}, 'writingDone', this.value)">
                        <option value="No" ${row.writingDone === 'No' ? 'selected' : ''}>❌ No</option>
                        <option value="Partial" ${row.writingDone === 'Partial' ? 'selected' : ''}>📝 Partial</option>
                        <option value="Yes" ${row.writingDone === 'Yes' ? 'selected' : ''}>✅ Yes</option>
                    </select>
                </td>
                <td>
                    <select onchange="updateRowData(${row.id}, 'confidence', this.value)">
                        <option value="Low" ${row.confidence === 'Low' ? 'selected' : ''}>😰 Low</option>
                        <option value="Medium" ${row.confidence === 'Medium' ? 'selected' : ''}>😐 Medium</option>
                        <option value="Good" ${row.confidence === 'Good' ? 'selected' : ''}>🙂 Good</option>
                        <option value="Excellent" ${row.confidence === 'Excellent' ? 'selected' : ''}>😄 Excellent</option>
                    </select>
                </td>
                <td class="last-updated-cell">${this.formatLastUpdated(row.lastUpdated)}</td>
                <td><textarea onchange="updateRowData(${row.id}, 'notes', this.value)" placeholder="Add notes...">${row.notes}</textarea></td>
                <td style="text-align: center;"><button class="btn btn-delete" onclick="deleteRow(${row.id})">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Format last updated time as relative time
    formatLastUpdated(timestamp) {
        if (!timestamp) return '<span class="last-updated-never">Never</span>';
        
        const now = new Date();
        const updated = new Date(timestamp);
        const diffMs = now - updated;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        let timeAgo;
        let className = 'last-updated-recent';
        
        if (diffMins < 1) {
            timeAgo = 'Just now';
        } else if (diffMins < 60) {
            timeAgo = `${diffMins}m ago`;
        } else if (diffHours < 24) {
            timeAgo = `${diffHours}h ago`;
        } else if (diffDays === 1) {
            timeAgo = 'Yesterday';
            className = 'last-updated-recent';
        } else if (diffDays < 7) {
            timeAgo = `${diffDays}d ago`;
            className = 'last-updated-week';
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            timeAgo = `${weeks}w ago`;
            className = 'last-updated-old';
        } else {
            const months = Math.floor(diffDays / 30);
            timeAgo = `${months}mo ago`;
            className = 'last-updated-old';
        }
        
        return `<span class="${className}" title="${updated.toLocaleString()}">${timeAgo}</span>`;
    },

    // Render table headers
    renderTableHeaders() {
        const thead = document.querySelector('#trackingTable thead tr');
        
        let learningMethodHeaders = '';
        DataManager.learningMethods.forEach(method => {
            learningMethodHeaders += `<th>${method}</th>`;
        });
        
        thead.innerHTML = `
            <th>Subject</th>
            <th>Chapter No</th>
            <th>Chapter Name</th>
            <th>Exam/Test</th>
            ${learningMethodHeaders}
            <th>✍️ Writing Done</th>
            <th>😐 Confidence</th>
            <th>📅 Last Updated</th>
            <th>Notes / Gaps</th>
            <th>Actions</th>
        `;
    },

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

    // Render subject management UI
    renderSubjectManager() {
        const container = document.getElementById('subjectManager');
        container.innerHTML = '';
        
        const subjectList = document.createElement('div');
        subjectList.className = 'item-list';
        
        DataManager.subjects.forEach(subject => {
            const item = document.createElement('div');
            item.className = 'item-tag';
            item.innerHTML = `
                <span>${subject}</span>
                <button onclick="removeSubject('${subject}')" class="remove-btn">✕</button>
            `;
            subjectList.appendChild(item);
        });
        
        container.appendChild(subjectList);
    },

    // Render learning methods management UI
    renderMethodManager() {
        const container = document.getElementById('methodManager');
        container.innerHTML = '';
        
        const methodList = document.createElement('div');
        methodList.className = 'item-list';
        
        DataManager.learningMethods.forEach(method => {
            const item = document.createElement('div');
            item.className = 'item-tag';
            item.innerHTML = `
                <span>${method}</span>
                <button onclick="removeLearningMethod('${method}')" class="remove-btn">✕</button>
            `;
            methodList.appendChild(item);
        });
        
        container.appendChild(methodList);
    },

    // Render exam types management UI
    renderExamManager() {
        const container = document.getElementById('examManager');
        container.innerHTML = '';
        
        const examList = document.createElement('div');
        examList.className = 'item-list';
        
        DataManager.examTypes.forEach(exam => {
            const item = document.createElement('div');
            item.className = 'item-tag item-tag-exam';
            item.innerHTML = `
                <span>${exam}</span>
                <button onclick="removeExamType('${exam}')" class="remove-btn">✕</button>
            `;
            examList.appendChild(item);
        });
        
        container.appendChild(examList);
    },

    // Show save feedback
    showSaveFeedback() {
        const saveBtn = document.querySelector('.btn-success');
        if (!saveBtn) return;
        
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✅ Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 1500);
    },

    // Render summary table (in-progress items only)
    renderSummaryTable() {
        const tbody = document.getElementById('summaryTableBody');
        tbody.innerHTML = '';
        
        // Filter chapters that have any 'In Progress' status
        const inProgressChapters = DataManager.trackingData.filter(row => {
            if (!row.learningStatus) return false;
            return Object.values(row.learningStatus).some(status => status === 'In Progress') || 
                   row.writingDone === 'Partial';
        });
        
        if (inProgressChapters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="20">
                        <div class="empty-state">
                            <div class="empty-state-icon">✨</div>
                            <h3>All Clear!</h3>
                            <p>No chapters in progress. Start working on a chapter to see it here.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        inProgressChapters.forEach(row => {
            const tr = document.createElement('tr');
            
            // Build learning method dropdowns HTML
            let learningMethodsHTML = '';
            DataManager.learningMethods.forEach(method => {
                const currentStatus = row.learningStatus && row.learningStatus[method] ? row.learningStatus[method] : 'Not Started';
                learningMethodsHTML += `
                    <td>
                        <select onchange="handleLearningMethodChange(${row.id}, '${method}', this.value)">
                            <option value="Not Started" ${currentStatus === 'Not Started' ? 'selected' : ''}>⭕ Not Started</option>
                            <option value="In Progress" ${currentStatus === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
                            <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>✅ Completed</option>
                            <option value="Not Required" ${currentStatus === 'Not Required' ? 'selected' : ''}>➖ Not Required</option>
                        </select>
                    </td>
                `;
            });
            
            // Subject display (read-only in summary)
            const subjectDisplay = row.subject || '—';
            const rowExamTypes = Array.isArray(row.examTypes) ? row.examTypes : (row.examType ? [row.examType] : []);
            const examBadges = rowExamTypes.length > 0 
                ? rowExamTypes.map(exam => `<span class="exam-badge">${exam}</span>`).join(' ')
                : '<span class="exam-badge-empty">—</span>';
            
            tr.innerHTML = `
                <td><strong>${subjectDisplay}</strong></td>
                <td>${row.chapterNo}</td>
                <td><strong>${row.chapterName}</strong></td>
                <td>${examBadges}</td>
                ${learningMethodsHTML}
                <td>
                    <select onchange="updateRowData(${row.id}, 'writingDone', this.value)">
                        <option value="No" ${row.writingDone === 'No' ? 'selected' : ''}>❌ No</option>
                        <option value="Partial" ${row.writingDone === 'Partial' ? 'selected' : ''}>📝 Partial</option>
                        <option value="Yes" ${row.writingDone === 'Yes' ? 'selected' : ''}>✅ Yes</option>
                    </select>
                </td>
                <td>
                    <select onchange="updateRowData(${row.id}, 'confidence', this.value)">
                        <option value="Low" ${row.confidence === 'Low' ? 'selected' : ''}>😰 Low</option>
                        <option value="Medium" ${row.confidence === 'Medium' ? 'selected' : ''}>😐 Medium</option>
                        <option value="Good" ${row.confidence === 'Good' ? 'selected' : ''}>🙂 Good</option>
                        <option value="Excellent" ${row.confidence === 'Excellent' ? 'selected' : ''}>😄 Excellent</option>
                    </select>
                </td>
                <td><textarea onchange="updateRowData(${row.id}, 'notes', this.value)" placeholder="Add notes...">${row.notes}</textarea></td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Render summary table headers
    renderSummaryTableHeaders() {
        const thead = document.getElementById('summaryTableHeader');
        
        let learningMethodHeaders = '';
        DataManager.learningMethods.forEach(method => {
            learningMethodHeaders += `<th>${method}</th>`;
        });
        
        thead.innerHTML = `
            <th>Subject</th>
            <th>Ch. No</th>
            <th>Chapter Name</th>
            <th>Exam/Test</th>
            ${learningMethodHeaders}
            <th>✍️ Writing</th>
            <th>😐 Confidence</th>
            <th>Notes / Gaps</th>
        `;
    },

    // Render subject filter dropdown
    renderSubjectFilter() {
        const subjectSelect = document.getElementById('subjectFilter');
        const examSelect = document.getElementById('examFilter');
        const examSummarySelect = document.getElementById('examSummarySelect');
        const subjects = DataManager.getActiveSubjects();
        
        let subjectOptions = '<option value="all">All Subjects</option>';
        subjects.forEach(subject => {
            subjectOptions += `<option value="${subject}">${subject}</option>`;
        });
        
        let examOptions = '<option value="all">All Exams</option>';
        DataManager.examTypes.forEach(exam => {
            examOptions += `<option value="${exam}">${exam}</option>`;
        });
        
        let examSummaryOptions = '<option value="">Choose an exam...</option>';
        DataManager.examTypes.forEach(exam => {
            examSummaryOptions += `<option value="${exam}">${exam}</option>`;
        });
        
        subjectSelect.innerHTML = subjectOptions;
        examSelect.innerHTML = examOptions;
        examSummarySelect.innerHTML = examSummaryOptions;
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
                const statusIcon = this.getChapterStatusIcon(chapter);
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
    },
    
    // Get status icon for a chapter
    getChapterStatusIcon(chapter) {
        if (!chapter.learningStatus) return '⭕';
        
        const statuses = Object.values(chapter.learningStatus);
        const hasCompleted = statuses.some(s => s === 'Completed');
        const hasInProgress = statuses.some(s => s === 'In Progress');
        
        if (hasCompleted && !hasInProgress && chapter.writingDone === 'Yes') {
            return '✅';
        } else if (hasInProgress || hasCompleted) {
            return '🔄';
        }
        return '⭕';
    },

    // Refresh all UI elements
    refreshAll() {
        this.renderTableHeaders();
        this.renderTable();
        this.renderSummaryTableHeaders();
        this.renderSummaryTable();
        this.renderReadinessCards();
        this.renderSubjectManager();
        this.renderMethodManager();
        this.renderExamManager();
        this.renderSubjectFilter();
    },

    // ===== DAILY WORK RENDERING =====
    
    // Render daily work view
    async renderDailyWork() {
        await UIDaily.renderDailyWork();
    },

    // Populate subject dropdown for tasks (deprecated - use UIDaily)
    populateTaskSubjects() {
        const select = document.getElementById('taskSubject');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Subject...</option>';
        DataManager.subjects.forEach(subject => {
            select.innerHTML += `<option value="${subject}">${subject}</option>`;
        });
    },

    // Render today's plan
    renderTodaysPlan() {
        const container = document.getElementById('todaysPlan');
        if (!container) return;
        
        const plan = DataManager.getTodaysPlan();
        
        if (plan.length === 0) {
            container.innerHTML = '<div class="empty-tasks">No tasks planned for today. Add your first task above!</div>';
            return;
        }
        
        container.innerHTML = plan.map(task => `
            <div class="task-item task-${task.status}">
                <div class="task-checkbox">
                    ${task.status === 'pending' ? '☐' : 
                      task.status === 'done' ? '✅' : 
                      task.status === 'partial' ? '⚠️' : '❌'}
                </div>
                <div class="task-content">
                    <span class="task-subject">${task.subject}:</span>
                    <span class="task-description">${task.task}</span>
                </div>
                <button onclick="removeDailyTask(${task.id})" class="btn-remove-task">🗑️</button>
            </div>
        `).join('');
    },

    // Render today's completion tracking
    renderTodaysCompletion() {
        const container = document.getElementById('todaysCompletion');
        if (!container) return;
        
        const plan = DataManager.getTodaysPlan();
        
        if (plan.length === 0) {
            container.innerHTML = '<div class="empty-tasks">Add tasks to your plan first!</div>';
            document.getElementById('todayScore').innerHTML = '';
            return;
        }
        
        container.innerHTML = plan.map(task => `
            <div class="completion-item">
                <div class="completion-task-info">
                    <span class="task-subject">${task.subject}:</span>
                    <span class="task-description">${task.task}</span>
                </div>
                <div class="completion-status-selector">
                    <select onchange="updateTaskStatus(${task.id}, this.value)" class="status-dropdown">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>⏸️ Pending</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>✅ Done</option>
                        <option value="partial" ${task.status === 'partial' ? 'selected' : ''}>⚠️ Partial</option>
                        <option value="notDone" ${task.status === 'notDone' ? 'selected' : ''}>❌ Not Done</option>
                    </select>
                </div>
            </div>
        `).join('');
        
        // Calculate and display today's score
        this.updateTodayScore();
    },

    // Update today's score display (delegate to UIDaily)
    async updateTodayScore() {
        await UIDaily.updateTodayScore();
    },

    // Render weekly overview (delegate to UIDaily)
    async renderWeeklyOverview() {
        await UIDaily.renderWeeklyOverview();
    }
};
