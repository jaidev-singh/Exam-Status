// UI Utility Functions
const UIUtils = {
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
    }
};

// Main UI Renderer - Combines all modules
const UIRenderer = {
    // Refresh all UI elements
    refreshAll() {
        UITable.renderTableHeaders();
        UITable.renderTable();
        UITable.renderSummaryTableHeaders();
        UITable.renderSummaryTable();
        UIReadiness.renderReadinessCards();
        UIManagers.renderSubjectManager();
        UIManagers.renderMethodManager();
        UIManagers.renderExamManager();
        UIManagers.renderSubjectFilter();
    },

    // Delegate methods to appropriate modules
    renderTable() { return UITable.renderTable(); },
    renderTableHeaders() { return UITable.renderTableHeaders(); },
    renderSummaryTable() { return UITable.renderSummaryTable(); },
    renderSummaryTableHeaders() { return UITable.renderSummaryTableHeaders(); },
    renderReadinessCards() { return UIReadiness.renderReadinessCards(); },
    renderExamSummary(examType) { return UIReadiness.renderExamSummary(examType); },
    renderSubjectManager() { return UIManagers.renderSubjectManager(); },
    renderMethodManager() { return UIManagers.renderMethodManager(); },
    renderExamManager() { return UIManagers.renderExamManager(); },
    renderSubjectFilter() { return UIManagers.renderSubjectFilter(); },
    showSaveFeedback() { return UIManagers.showSaveFeedback(); },
    renderDailyWork() { return UIDaily.renderDailyWork(); },
    formatLastUpdated(timestamp) { return UIUtils.formatLastUpdated(timestamp); }
};
