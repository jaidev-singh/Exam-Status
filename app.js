// Main Application Module

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    // Simple check - if DataManager not loaded, scripts failed
    if (typeof DataManager === 'undefined') {
        alert('⚠️ Scripts failed to load. Please refresh the page.\n\nIf this persists:\n1. Close ALL browser tabs\n2. Reopen browser\n3. Try again');
        return;
    }
    
    try {
        await DataManager.init();
        setupEventListeners();
        await UIRenderer.refreshAll();
        loadStudentInfo();
        
        console.log('✅ App initialized with Dexie IndexedDB!');
    } catch (error) {
        console.error('Initialization error:', error);
        alert('⚠️ Failed to initialize database. Please refresh the page.');
    }
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('studentName').addEventListener('change', updateStudentInfo);
    document.getElementById('studentClass').addEventListener('change', updateStudentInfo);
    document.getElementById('reviewDate').addEventListener('change', updateStudentInfo);
}

// Load student info into form
function loadStudentInfo() {
    document.getElementById('studentName').value = DataManager.studentInfo.name;
    document.getElementById('studentClass').value = DataManager.studentInfo.class;
    document.getElementById('reviewDate').value = DataManager.studentInfo.reviewDate;
    
    // Apply locked state to fields
    applyLockedState();
}

// Apply locked state to name and class fields
function applyLockedState() {
    const isLocked = DataManager.studentInfo.locked;
    const nameField = document.getElementById('studentName');
    const classField = document.getElementById('studentClass');
    const lockBtn = document.getElementById('lockStudentInfo');
    
    if (isLocked) {
        nameField.disabled = true;
        classField.disabled = true;
        nameField.classList.add('locked-field');
        classField.classList.add('locked-field');
        if (lockBtn) {
            lockBtn.style.display = 'none';
        }
    } else {
        nameField.disabled = false;
        classField.disabled = false;
        nameField.classList.remove('locked-field');
        classField.classList.remove('locked-field');
        if (lockBtn) {
            lockBtn.style.display = 'inline-block';
        }
    }
}

// Update student info
async function updateStudentInfo() {
    const name = document.getElementById('studentName').value;
    const className = document.getElementById('studentClass').value;
    
    await DataManager.updateStudentInfo('name', name);
    await DataManager.updateStudentInfo('class', className);
    await DataManager.updateStudentInfo('reviewDate', document.getElementById('reviewDate').value);
    
    // Auto-lock if name and class are filled and not already locked
    if (name && className && !DataManager.studentInfo.locked) {
        // Check if defaults were loaded (trackingData exists)
        if (DataManager.trackingData.length > 0) {
            await lockStudentInfo();
        }
    }
}

// Lock student info (name and class become fixed)
async function lockStudentInfo() {
    const name = document.getElementById('studentName').value;
    const className = document.getElementById('studentClass').value;
    
    if (!name || !className) {
        alert('⚠️ Please enter both name and class before locking.');
        return;
    }
    
    if (confirm(`Lock student info?\n\nName: ${name}\nClass: ${className}\n\nAfter locking, these fields cannot be changed.`)) {
        await DataManager.lockStudentInfo();
        applyLockedState();
        alert('🔒 Student info locked! Name and class are now fixed.');
    }
}

// Check if any chapters have outdated subject names
async function syncSubjectsCheck() {
    try {
        if (typeof DataManager === 'undefined') {
            alert('⚠️ DataManager not loaded. Please refresh the page.');
            return;
        }
        await DataManager.syncSubjectsFromDefaults();
    } catch (error) {
        console.error('Sync check error:', error);
        alert('❌ Sync check failed: ' + error.message);
    }
}

// Handle class change - triggered by dropdown
async function handleClassChange() {
    const className = document.getElementById('studentClass').value;
    
    // Only proceed if a valid class is selected
    if (!className) {
        return; // User selected "Select Class..." placeholder
    }
    
    const defaultsLoaded = await DataManager.updateStudentInfo('class', className);
    
    if (defaultsLoaded) {
        // Refresh all UI to show new subjects/methods
        await UIRenderer.refreshAll();
        
        // Auto-lock after first setup
        const name = document.getElementById('studentName').value;
        if (name && className && !DataManager.studentInfo.locked) {
            await lockStudentInfo();
        }
    }
}

// Add a new row
async function addNewRow() {
    await DataManager.addChapter();
    UIRenderer.renderTable();
    UIRenderer.renderReadinessCards();
}

// Delete a row
async function deleteRow(id) {
    if (confirm('Are you sure you want to delete this chapter?')) {
        await DataManager.deleteChapter(id);
        UIRenderer.renderTable();
        UIRenderer.renderReadinessCards();
    }
}

// Update row data
async function updateRowData(id, field, value) {
    // Preserve current filter selections
    const currentSubjectFilter = document.getElementById('subjectFilter')?.value || 'all';
    const currentExamFilter = document.getElementById('examFilter')?.value || 'all';
    const currentStatusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    await DataManager.updateChapter(id, field, value);
    // Refresh table if confidence changed to show updated timestamp
    if (field === 'confidence') {
        UIRenderer.renderTable();
        UIRenderer.renderSummaryTable();
        
        // Restore filter selections
        if (document.getElementById('subjectFilter')) {
            document.getElementById('subjectFilter').value = currentSubjectFilter;
        }
        if (document.getElementById('examFilter')) {
            document.getElementById('examFilter').value = currentExamFilter;
        }
        if (document.getElementById('statusFilter')) {
            document.getElementById('statusFilter').value = currentStatusFilter;
        }
        
        // Reapply filters
        applyAllFilters();
    }
    UIRenderer.renderReadinessCards();
}

// Handle learning method checkbox change
async function handleLearningMethodChange(id, method, value) {
    // Preserve current filter selections
    const currentSubjectFilter = document.getElementById('subjectFilter')?.value || 'all';
    const currentExamFilter = document.getElementById('examFilter')?.value || 'all';
    const currentStatusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    await DataManager.updateLearningStatus(id, method, value);
    // Refresh table to show updated timestamp
    UIRenderer.renderTable();
    UIRenderer.renderSummaryTable();
    UIRenderer.renderReadinessCards();
    
    // Restore filter selections
    if (document.getElementById('subjectFilter')) {
        document.getElementById('subjectFilter').value = currentSubjectFilter;
    }
    if (document.getElementById('examFilter')) {
        document.getElementById('examFilter').value = currentExamFilter;
    }
    if (document.getElementById('statusFilter')) {
        document.getElementById('statusFilter').value = currentStatusFilter;
    }
    
    // Reapply filters
    applyAllFilters();
}

// Add new subject
async function addSubject() {
    const input = document.getElementById('newSubjectInput');
    const subjectName = input.value.trim();
    
    if (subjectName) {
        if (await DataManager.addSubject(subjectName)) {
            input.value = '';
            UIRenderer.renderSubjectManager();
            UIRenderer.renderTable();
            closeModal('subjectModal');
        } else {
            alert('Subject already exists or invalid name!');
        }
    }
}

// Remove subject
async function removeSubject(subjectName) {
    if (confirm(`Remove "${subjectName}"? This will delete all chapters of this subject!`)) {
        await DataManager.removeSubject(subjectName);
        UIRenderer.refreshAll();
    }
}

// Add new learning method
async function addLearningMethod() {
    const input = document.getElementById('newMethodInput');
    const methodName = input.value.trim();
    
    if (methodName) {
        if (await DataManager.addLearningMethod(methodName)) {
            input.value = '';
            UIRenderer.refreshAll();
            closeModal('methodModal');
        } else {
            alert('Learning method already exists or invalid name!');
        }
    }
}

// Remove learning method
async function removeLearningMethod(methodName) {
    if (confirm(`Remove "${methodName}" from all chapters?`)) {
        await DataManager.removeLearningMethod(methodName);
        UIRenderer.refreshAll();
    }
}

// Add new exam type
async function addExamType() {
    const input = document.getElementById('newExamInput');
    const examName = input.value.trim();
    
    if (examName) {
        if (await DataManager.addExamType(examName)) {
            input.value = '';
            UIRenderer.renderExamManager();
            UIRenderer.renderTable();
            UIRenderer.renderSubjectFilter();
            closeModal('examModal');
        } else {
            alert('Exam type already exists or invalid name!');
        }
    }
}

// Remove exam type
async function removeExamType(examName) {
    if (confirm(`Remove "${examName}"? Chapters with this exam will be unassigned.`)) {
        await DataManager.removeExamType(examName);
        UIRenderer.refreshAll();
    }
}

// Toggle custom dropdown
function toggleDropdown(event, dropdown) {
    event.stopPropagation();
    
    // Close all other dropdowns
    document.querySelectorAll('.custom-dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
    });
    
    dropdown.classList.toggle('open');
}

// Update exam types from checkbox dropdown
async function updateExamCheckboxes(chapterId, dropdown) {
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
    const selectedExams = Array.from(checkboxes).map(cb => cb.value);
    
    const row = DataManager.trackingData.find(r => r.id === chapterId);
    if (row) {
        row.examTypes = selectedExams;
        // Don't update lastUpdated when changing exam types
        await DataManager.updateChapter(chapterId, 'examTypes', selectedExams);
        
        // Update display text
        const displayText = selectedExams.length > 0 ? selectedExams.join(', ') : 'Select Exams...';
        dropdown.querySelector('.dropdown-display').textContent = displayText;
        
        // Preserve current filter selections
        const currentSubjectFilter = document.getElementById('subjectFilter')?.value || 'all';
        const currentExamFilter = document.getElementById('examFilter')?.value || 'all';
        const currentStatusFilter = document.getElementById('statusFilter')?.value || 'all';
        
        // Refresh table to update display
        UIRenderer.renderTable();
        
        // Restore filter selections
        if (document.getElementById('subjectFilter')) {
            document.getElementById('subjectFilter').value = currentSubjectFilter;
        }
        if (document.getElementById('examFilter')) {
            document.getElementById('examFilter').value = currentExamFilter;
        }
        if (document.getElementById('statusFilter')) {
            document.getElementById('statusFilter').value = currentStatusFilter;
        }
        
        // Reapply filters
        applyAllFilters();
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    }
});

// Modal management
async function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    
    // Load backups list when opening backup modal
    if (modalId === 'backupModal') {
        await loadBackupsList();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Handle Enter key in input fields
function handleEnterKey(event, action) {
    if (event.key === 'Enter') {
        action();
    }
}

// Save data manually
async function saveData() {
    await DataManager.saveData();
    UIRenderer.showSaveFeedback();
}

// Export data as JSON
async function exportData() {
    await DataManager.exportData();
}

// Export data as Excel (CSV)
async function exportToExcel() {
    await DataManager.exportToExcel();
}

// Reset to sample data (safer than clear all - only in backup modal)
async function resetToSampleData() {
    if (!confirm('⚠️ DANGER: This will DELETE ALL your chapters!\n\n✅ A backup will be created first\n✅ You can restore from backup later\n\nAre you SURE you want to reset to sample data?')) {
        return;
    }
    
    if (!confirm('🚨 FINAL WARNING!\n\nThis action will:\n• Delete all your chapters\n• Delete all daily plans\n• Keep your student info\n• Keep your subjects/methods\n• Create a backup first\n\nReally proceed?')) {
        return;
    }
    
    try {
        // Create backup before clearing
        await DBManager.createBackup('Pre-reset backup');
        
        // Clear only tracking data and daily plans
        await db.trackingData.clear();
        await db.dailyPlans.clear();
        await db.dailyHistory.clear();
        
        alert('✅ Data reset complete!\n\nYou can restore from backup if needed.\n\nPage will reload to initialize sample data.');
        location.reload();
    } catch (error) {
        alert('❌ Reset failed: ' + error.message);
    }
}

// Tab switching
async function switchTab(tabName, event) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event) {
        // Support both event and element
        const btn = event.target || event;
        if (btn.classList && btn.classList.contains('tab-btn')) {
            btn.classList.add('active');
        }
    }
    
    // Update view sections
    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    
    if (tabName === 'summary') {
        document.getElementById('summaryView').classList.add('active');
        await UIRenderer.renderSummaryTable();
    } else if (tabName === 'dailyWork') {
        document.getElementById('dailyWorkView').classList.add('active');
        await UIRenderer.renderDailyWork();
    } else if (tabName === 'examSummary') {
        document.getElementById('examSummaryView').classList.add('active');
        await UIRenderer.renderSubjectFilter();
    } else if (tabName === 'subjects') {
        document.getElementById('subjectsView').classList.add('active');
    }
}

// Load exam summary
function loadExamSummary() {
    const examType = document.getElementById('examSummarySelect').value;
    UIRenderer.renderExamSummary(examType);
}

// Filter table by subject
function filterBySubject() {
    applyAllFilters();
}

// Filter table by exam
function filterByExam() {
    applyAllFilters();
}

// Apply all filters (subject, exam, and status)
function applyAllFilters() {
    const selectedSubject = document.getElementById('subjectFilter').value;
    const selectedExam = document.getElementById('examFilter').value;
    const selectedStatus = document.getElementById('statusFilter').value;
    const tbody = document.getElementById('tableBody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;
        
        const subjectCell = cells[0].querySelector('select');
        const examDropdown = cells[3].querySelector('.custom-dropdown');
        const confidenceSelect = cells[cells.length - 3].querySelector('select');
        
        let showRow = true;
        
        // Check subject filter
        if (selectedSubject !== 'all' && subjectCell && subjectCell.value !== selectedSubject) {
            showRow = false;
        }
        
        // Check exam filter
        if (selectedExam !== 'all' && examDropdown) {
            const checkedBoxes = examDropdown.querySelectorAll('input[type="checkbox"]:checked');
            const selectedExams = Array.from(checkedBoxes).map(cb => cb.value);
            if (!selectedExams.includes(selectedExam)) {
                showRow = false;
            }
        }
        
        // Check status filter
        if (selectedStatus === 'incomplete') {
            // Show only chapters with incomplete learning or writing
            let hasIncomplete = false;
            
            // Check learning method dropdowns (have onchange with 'updateLearningStatus')
            const learningDropdowns = row.querySelectorAll('select[onchange*="updateLearningStatus"]');
            learningDropdowns.forEach(dropdown => {
                const value = dropdown.value;
                if (value === 'Not Started' || value === 'In Progress') {
                    hasIncomplete = true;
                }
            });
            
            // Check writing dropdown (find by checking for writingDone in onchange)
            const writingDropdown = Array.from(row.querySelectorAll('select')).find(sel => 
                sel.getAttribute('onchange')?.includes("'writingDone'")
            );
            if (writingDropdown && (writingDropdown.value === 'No' || writingDropdown.value === 'Partial')) {
                hasIncomplete = true;
            }
            
            if (!hasIncomplete) showRow = false;
        } else if (selectedStatus === 'weak') {
            // Show only chapters with Low or Medium confidence
            if (confidenceSelect) {
                const confidence = confidenceSelect.value;
                if (confidence !== 'Low' && confidence !== 'Medium') {
                    showRow = false;
                }
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// ===== DAILY WORK FUNCTIONS =====

// Date navigation functions
function changeDailyDate(days) {
    const current = new Date(UIDaily.currentSelectedDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    const newDate = current.toISOString().split('T')[0];
    
    // Check if within range
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() - 2);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 7);
    
    const targetDate = new Date(newDate + 'T00:00:00');
    if (targetDate < minDate || targetDate > maxDate) {
        alert('Date out of range! You can view: 2 days back to 7 days ahead.');
        return;
    }
    
    UIDaily.currentSelectedDate = newDate;
    document.getElementById('selectedDailyDate').value = newDate;
    loadDailyDate();
}

function goToToday() {
    UIDaily.currentSelectedDate = new Date().toISOString().split('T')[0];
    document.getElementById('selectedDailyDate').value = UIDaily.currentSelectedDate;
    loadDailyDate();
}

async function loadDailyDate() {
    const dateInput = document.getElementById('selectedDailyDate');
    UIDaily.currentSelectedDate = dateInput.value;
    
    // Reload daily plans for selected date
    await UIDaily.renderDailyWork();
}

// Add daily task
async function addDailyTask() {
    const subjectSelect = document.getElementById('taskSubject');
    const taskInput = document.getElementById('taskDescription');
    
    const subject = subjectSelect.value;
    const task = taskInput.value.trim();
    
    if (!subject) {
        alert('Please select a subject');
        return;
    }
    
    if (!task) {
        alert('Please enter a task description');
        return;
    }
    
    await DataManager.addDailyTask(subject, task, null, UIDaily.currentSelectedDate);
    taskInput.value = '';
    subjectSelect.value = '';
    await UIDaily.renderDailyWork();
}

// Remove daily task
async function removeDailyTask(taskId) {
    if (confirm('Remove this task?')) {
        await DataManager.removeDailyTask(taskId);
        await UIDaily.renderDailyWork();
    }
}

// Update task status (auto-saves)
async function updateTaskStatus(taskId, status) {
    await DataManager.updateDailyTask(taskId, status, '');
    await UIDaily.updateTodayScore();
    await UIDaily.renderWeeklyOverview(); // Update weekly stats
}


// === BACKUP MANAGEMENT ===

// Load and display backups
async function loadBackupsList() {
    const backups = await DBManager.listBackups();
    const container = document.getElementById('backupsContainer');
    
    if (backups.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">No backups yet. Auto-backups will appear here.</p>';
        return;
    }
    
    container.innerHTML = backups.slice(0, 10).map(backup => `
        <div style="padding: 12px; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-weight: 500;">${new Date(backup.timestamp).toLocaleString()}</div>
                <div style="font-size: 13px; color: #666;">${backup.description || 'Auto backup'}</div>
            </div>
            <button onclick="restoreBackup(${backup.id})" class="btn btn-secondary" style="padding: 6px 12px; font-size: 13px;">
                ↩️ Restore
            </button>
        </div>
    `).join('');
}

// Restore from backup
async function restoreBackup(backupId) {
    if (!confirm('⚠️ Are you sure?\n\nThis will replace all current data with the backup.\n\nA backup of current data will be created before restoring.')) {
        return;
    }
    
    try {
        await DBManager.createBackup('Pre-restore backup');
        const success = await DBManager.restoreFromBackup(backupId);
        
        if (success) {
            alert('✅ Backup restored successfully!\n\nPage will reload now.');
            location.reload();
        } else {
            alert('❌ Restore failed. Your current data is safe.');
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Handle backup file import
async function handleBackupImport(event) {
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
    
    // Reset file input
    event.target.value = '';
}

// Create manual backup
async function createManualBackup() {
    try {
        await DBManager.createBackup('Manual backup by user');
        alert('✅ Backup created successfully!');
        await loadBackupsList();
    } catch (error) {
        alert('❌ Backup failed: ' + error.message);
    }
}

