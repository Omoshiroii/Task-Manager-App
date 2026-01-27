/**
 * Utility Functions
 * Helper functions for common operations
 */

const utils = {
    /**
     * Generate a unique ID for tasks
     * @returns {string} Unique identifier
     */
    generateId: () => {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * Format date to ISO string
     * @param {string|Date} date - Date to format
     * @returns {string|null} Formatted date string
     */
    formatDate: (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    /**
     * Check if date is today
     * @param {string} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday: (date) => {
        if (!date) return false;
        const today = new Date();
        const taskDate = new Date(date);
        return today.toDateString() === taskDate.toDateString();
    },
    
    /**
     * Check if date is overdue
     * @param {string} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isOverdue: (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate < today;
    },
    
    /**
     * Check if date is in the future
     * @param {string} date - Date to check
     * @returns {boolean} True if date is upcoming
     */
    isUpcoming: (date) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate > today;
    },
    
    /**
     * Format seconds to MM:SS
     * @param {number} seconds - Seconds to format
     * @returns {string} Formatted time string
     */
    formatTimer: (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped HTML
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};