/**
 * Local Storage Management
 * Handles data persistence with versioning
 */

const storage = {
    STORAGE_KEY: 'taskflow_v1',
    
    /**
     * Save tasks to localStorage
     * @param {Array} data - Tasks array to save
     */
    save: (data) => {
        try {
            localStorage.setItem(storage.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            // Handle quota exceeded or other storage errors
            ui.showToast('⚠️ Storage error. Could not save tasks.');
        }
    },
    
    /**
     * Load tasks from localStorage
     * @returns {Array|null} Tasks array or null if empty/corrupted
     */
    load: () => {
        try {
            const data = localStorage.getItem(storage.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            // Handle corrupted data
            ui.showToast('⚠️ Could not load saved tasks. Starting fresh.');
            return null;
        }
    },
    
    /**
     * Clear all tasks from localStorage
     */
    clear: () => {
        localStorage.removeItem(storage.STORAGE_KEY);
    },

    /**
     * Export tasks as JSON file
     * @param {Array} tasks - Tasks to export
     */
    export: (tasks) => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Import tasks from JSON file
     * @param {File} file - File to import
     * @returns {Promise<Array>} Imported tasks
     */
    import: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const tasks = JSON.parse(e.target.result);
                    resolve(tasks);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
};