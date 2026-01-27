/**
 * Application State
 * Centralized state management for the entire app
 */

const APP_STATE = {
    // Core data
    tasks: [],
    
    // UI state
    currentFilter: 'all',
    currentPriority: 'medium',
    currentSort: 'date',
    
    // Undo functionality
    lastDeletedTask: null,
    
    // Focus mode
    focusMode: false,
    focusTimer: null,
    focusTimeLeft: 25 * 60, // 25 minutes in seconds
    
    /**
     * Get filtered tasks based on current filter
     * @returns {Array} Filtered tasks
     */
    getFilteredTasks: function() {
        return taskOperations.filter(this.tasks, this.currentFilter);
    },
    
    /**
     * Get sorted tasks
     * @returns {Array} Sorted tasks
     */
    getSortedTasks: function() {
        const filtered = this.getFilteredTasks();
        return taskOperations.sort(filtered);
    },
    
    /**
     * Get statistics
     * @returns {Object} Stats object
     */
    getStats: function() {
        return {
            total: this.tasks.length,
            active: this.tasks.filter(t => !t.completed).length,
            completed: this.tasks.filter(t => t.completed).length,
            today: this.tasks.filter(t => !t.completed && utils.isToday(t.dueDate)).length,
            upcoming: this.tasks.filter(t => !t.completed && utils.isUpcoming(t.dueDate)).length,
            overdue: this.tasks.filter(t => !t.completed && utils.isOverdue(t.dueDate)).length
        };
    }
};