// UI Management Modules (Subjects, Methods, Exams)
const UIManagers = {
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

    // Render subject filter dropdown
    renderSubjectFilter() {
        const subjectSelect = document.getElementById('subjectFilter');
        const examSelect = document.getElementById('examFilter');
        const examSummarySelect = document.getElementById('examSummarySelect');
        
        // Use all configured subjects, not just active ones
        let subjectOptions = '<option value="all">All Subjects</option>';
        const subjectsList = Array.isArray(DataManager.subjects) ? DataManager.subjects : [];
        subjectsList.forEach(subject => {
            subjectOptions += `<option value="${subject}">${subject}</option>`;
        });
        
        let examOptions = '<option value="all">All Exams</option>';
        const examTypesList = Array.isArray(DataManager.examTypes) ? DataManager.examTypes : [];
        examTypesList.forEach(exam => {
            examOptions += `<option value="${exam}">${exam}</option>`;
        });
        
        let examSummaryOptions = '<option value="">Choose an exam...</option>';
        examTypesList.forEach(exam => {
            examSummaryOptions += `<option value="${exam}">${exam}</option>`;
        });
        
        if (subjectSelect) subjectSelect.innerHTML = subjectOptions;
        if (examSelect) examSelect.innerHTML = examOptions;
        if (examSummarySelect) examSummarySelect.innerHTML = examSummaryOptions;
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
    }
};
