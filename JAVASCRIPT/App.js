/**
 * TaskFlow Application
 * Main initialization and app lifecycle
 */

/**
 * Initialize the application
 */
function initApp() {
    console.log('🚀 Initializing TaskFlow...');
    
    // Initialize UI elements
    ui.init();
    
    // Load tasks from storage
    const savedTasks = storage.load();
    if (savedTasks && Array.isArray(savedTasks)) {
        APP_STATE.tasks = savedTasks;
        console.log(`✅ Loaded ${savedTasks.length} tasks from storage`);
    } else {
        console.log('📝 Starting with empty task list');
    }
    
    // Initial render
    ui.render();
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-focus task input
    ui.elements.taskInput.focus();
    
    // Show welcome message
    if (APP_STATE.tasks.length === 0) {
        setTimeout(() => {
            ui.showToast('👋 Welcome to TaskFlow! Create your first task to get started.');
        }, 500);
    }
    
    console.log('✨ TaskFlow initialized successfully');
}

/**
 * Service Worker registration (PWA support)
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Uncomment to enable PWA functionality
        /*
        navigator.serviceWorker
            .register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
        */
    }
}

/**
 * Handle page visibility changes
 * Useful for pausing timers when tab is hidden
 */
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page is hidden - pause focus timer if running
            if (APP_STATE.focusTimer && APP_STATE.focusMode) {
                focusMode.stop();
            }
        }
    });
}

/**
 * Handle before unload (optional data backup)
 */
function handleBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
        // Save one last time before closing
        if (APP_STATE.tasks.length > 0) {
            storage.save(APP_STATE.tasks);
        }
    });
}

/**
 * Development helpers (remove in production)
 */
const dev = {
    clearAll: () => {
        if (confirm('Clear all tasks? This cannot be undone.')) {
            APP_STATE.tasks = [];
            storage.save(APP_STATE.tasks);
            ui.render();
            ui.showToast('🗑️ All tasks cleared');
        }
    },
    
    addSampleTasks: () => {
        const samples = [
            { title: 'Review pull requests', priority: 'high', dueDate: new Date() },
            { title: 'Update documentation', priority: 'medium', dueDate: new Date(Date.now() + 86400000) },
            { title: 'Buy groceries', priority: 'low', dueDate: new Date(Date.now() + 172800000) },
            { title: 'Plan team meeting', priority: 'medium', dueDate: new Date() },
            { title: 'Exercise for 30 minutes', priority: 'high', dueDate: new Date() }
        ];
        
        samples.forEach(s => {
            taskOperations.create(s.title, s.priority, s.dueDate);
        });
        
        ui.showToast('✨ Added sample tasks');
    },
    
    exportTasks: () => {
        storage.export(APP_STATE.tasks);
        ui.showToast('💾 Tasks exported');
    }
};

// Make dev helpers available in console
if (typeof window !== 'undefined') {
    window.TaskFlowDev = dev;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    registerServiceWorker();
    handleVisibilityChange();
    handleBeforeUnload();
});