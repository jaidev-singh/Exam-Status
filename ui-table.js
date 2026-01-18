// UI Table Rendering Module
const UITable = {
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
            // Ensure DataManager.examTypes is an array
            const examTypesList = Array.isArray(DataManager.examTypes) ? DataManager.examTypes : [];
            examTypesList.forEach(exam => {
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
                <td class="chapter-name-cell"><input type="text" value="${row.chapterName}" onchange="updateRowData(${row.id}, 'chapterName', this.value)" placeholder="Chapter Name"></td>
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
                        <option value="None" ${row.confidence === 'None' ? 'selected' : ''}>⭕ None</option>
                        <option value="Low" ${row.confidence === 'Low' ? 'selected' : ''}>😰 Low</option>
                        <option value="Medium" ${row.confidence === 'Medium' ? 'selected' : ''}>😐 Medium</option>
                        <option value="Good" ${row.confidence === 'Good' ? 'selected' : ''}>🙂 Good</option>
                        <option value="Excellent" ${row.confidence === 'Excellent' ? 'selected' : ''}>😄 Excellent</option>
                    </select>
                </td>
                <td class="last-updated-cell">${UIUtils.formatLastUpdated(row.lastUpdated)}</td>
                <td><textarea onchange="updateRowData(${row.id}, 'notes', this.value)" placeholder="Add notes...">${row.notes}</textarea></td>
                <td style="text-align: center;"><button class="btn btn-delete" onclick="deleteRow(${row.id})">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });
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
                <td class="chapter-name-cell"><strong>${row.chapterName}</strong></td>
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
                        <option value="None" ${row.confidence === 'None' ? 'selected' : ''}>⭕ None</option>
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
    }
};
