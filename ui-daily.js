// UI Daily Work Module
const UIDaily = {
    currentSelectedDate: new Date().toISOString().split('T')[0], // Track selected date

    // Render daily work view
    async renderDailyWork() {
        this.initializeDateSelector();
        await this.renderTodaysPlan();
        await this.renderTodaysCompletion();
        await this.renderWeeklyOverview();
        this.populateTaskSubjects();
    },

    // Initialize date selector with constraints
    initializeDateSelector() {
        const dateInput = document.getElementById('selectedDailyDate');
        if (!dateInput) return;

        // Set current date or selected date
        dateInput.value = this.currentSelectedDate;

        // Set min/max dates (2 days back, 7 days forward)
        const today = new Date();
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() - 2);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 7);

        dateInput.min = minDate.toISOString().split('T')[0];
        dateInput.max = maxDate.toISOString().split('T')[0];

        // Update current date display
        this.updateCurrentDateDisplay();
    },

    // Update the date display
    updateCurrentDateDisplay() {
        const display = document.getElementById('currentDateDisplay');
        if (!display) return;

        const selectedDate = new Date(this.currentSelectedDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        
        const dayName = dayNames[selectedDate.getDay()];
        const monthName = monthNames[selectedDate.getMonth()];
        const date = selectedDate.getDate();
        const year = selectedDate.getFullYear();

        let badge = '';
        if (selected.getTime() === today.getTime()) {
            badge = '<span style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-left: 10px;">TODAY</span>';
        } else if (selected < today) {
            const daysAgo = Math.floor((today - selected) / (1000 * 60 * 60 * 24));
            badge = `<span style="background: #ff9800; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-left: 10px;">${daysAgo} day${daysAgo > 1 ? 's' : ''} ago</span>`;
        } else {
            const daysAhead = Math.floor((selected - today) / (1000 * 60 * 60 * 24));
            badge = `<span style="background: #2196f3; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-left: 10px;">In ${daysAhead} day${daysAhead > 1 ? 's' : ''}</span>`;
        }

        display.innerHTML = `${dayName}, ${monthName} ${date}, ${year} ${badge}`;
    },

    // Populate subject dropdown for tasks
    populateTaskSubjects() {
        const select = document.getElementById('taskSubject');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select Subject...</option>';
        DataManager.subjects.forEach(subject => {
            select.innerHTML += `<option value="${subject}">${subject}</option>`;
        });
    },

    // Render today's plan (for selected date)
    async renderTodaysPlan() {
        const container = document.getElementById('todaysPlan');
        if (!container) return;
        
        const plan = await DataManager.getDailyPlanForDate(this.currentSelectedDate);
        
        if (plan.length === 0) {
            container.innerHTML = '<div class="empty-tasks">No tasks planned for this day. Add your first task above!</div>';
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

    // Render today's completion tracking (for selected date)
    async renderTodaysCompletion() {
        const container = document.getElementById('todaysCompletion');
        if (!container) return;
        
        const plan = await DataManager.getDailyPlanForDate(this.currentSelectedDate);
        
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

    // Update today's score display
    async updateTodayScore() {
        const scoreDiv = document.getElementById('todayScore');
        if (!scoreDiv) return;
        
        const plan = await DataManager.getDailyPlanForDate(this.currentSelectedDate);
        if (plan.length === 0) {
            scoreDiv.innerHTML = '';
            return;
        }
        
        let totalScore = 0;
        plan.forEach(task => {
            if (task.status === 'done') totalScore += 1;
            else if (task.status === 'partial') totalScore += 0.5;
        });
        
        const percentage = Math.round((totalScore / plan.length) * 100);
        const scoreClass = percentage >= 80 ? 'score-excellent' : 
                          percentage >= 60 ? 'score-good' : 'score-needs-work';
        
        scoreDiv.innerHTML = `
            <div class="score-display ${scoreClass}">
                <span class="score-label">Today's Score:</span>
                <span class="score-value">${percentage}%</span>
            </div>
        `;
    },

    // Render weekly overview
    async renderWeeklyOverview() {
        const weekData = await DataManager.getWeekHistory();
        const stats = await DataManager.getWeeklyStats();
        
        // Render week dates
        const datesDiv = document.getElementById('weekDates');
        if (datesDiv) {
            const today = new Date().toISOString().split('T')[0];
            const startDate = new Date(weekData[0].date);
            const endDate = new Date(weekData[6].date);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            datesDiv.innerHTML = `<strong>Week:</strong> ${monthNames[startDate.getMonth()]} ${startDate.getDate()}-${endDate.getDate()}`;
        }
        
        // Render week bars
        const barsDiv = document.getElementById('weekBars');
        if (barsDiv) {
            barsDiv.innerHTML = weekData.map(day => {
                const barClass = day.score === null ? 'no-data' :
                                day.score >= 80 ? 'bar-excellent' :
                                day.score >= 60 ? 'bar-good' : 'bar-needs-work';
                const barWidth = day.score || 0;
                const displayText = day.score === null ? '--' : `${day.score}%`;
                
                return `
                    <div class="week-day-bar">
                        <div class="day-label">${day.day}</div>
                        <div class="bar-container">
                            <div class="bar-fill ${barClass}" style="width: ${barWidth}%"></div>
                        </div>
                        <div class="bar-value">${displayText}</div>
                    </div>
                `;
            }).join('');
        }
        
        // Render weekly stats
        const statsDiv = document.getElementById('weekStats');
        if (statsDiv) {
            const avgClass = stats.average >= 80 ? 'avg-excellent' :
                            stats.average >= 60 ? 'avg-good' : 'avg-needs-work';
            
            let subjectList = '';
            Object.entries(stats.subjectFrequency).forEach(([subject, count]) => {
                const emoji = subject === 'Maths' ? '📘' :
                             subject === 'Science' ? '📗' :
                             subject === 'English' ? '📕' : '📙';
                subjectList += `<div class="subject-freq">${emoji} ${subject}: ${count} days</div>`;
            });
            
            statsDiv.innerHTML = `
                <div class="weekly-stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Weekly Average:</div>
                        <div class="stat-value ${avgClass}">${stats.average}%</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Days Worked:</div>
                        <div class="stat-value">${stats.daysWorked}/7</div>
                    </div>
                </div>
                ${subjectList ? `<div class="subjects-worked"><strong>Subjects worked on:</strong>${subjectList}</div>` : ''}
            `;
        }
    }
};
