/**
 * UI Rendering and Updates
 * Handles all DOM manipulation and rendering
 */

const ui = {
    elements: {},
    
    /**
     * Initialize UI elements and cache references
     */
    init: () => {
        ui.elements = {
            taskInput: document.getElementById('task-input'),
            addTaskBtn: document.getElementById('add-task-btn'),
            tasksList: document.getElementById('tasks-list'),
            dueDateInput: document.getElementById('due-date-input'),
            tasksTitle: document.getElementById('tasks-title'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toast-message'),
            undoBar: document.getElementById('undo-bar'),
            undoBtn: document.getElementById('undo-btn'),
            focusOverlay: document.getElementById('focus-overlay'),
            focusModeBtn: document.querySelector('.focus-mode-btn'),
            focusTaskTitle: document.getElementById('focus-task-title'),
            focusTimer: document.getElementById('focus-timer'),
            focusStart: document.getElementById('focus-start'),
            focusExit: document.getElementById('focus-exit'),
            sortBtn: document.getElementById('sort-btn')
        };
        
        // Set min date to today
        const today = new Date().toISOString().split('T')[0];
        ui.elements.dueDateInput.min = today;
    },
    
    /**
     * Render entire UI
     */
    render: () => {
        ui.renderStats();
        ui.renderTasks();
        ui.updateFilterCounts();
    },
    
    /**
     * Render statistics cards
     */
    renderStats: () => {
        const stats = APP_STATE.getStats();
        
        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-active').textContent = stats.active;
        document.getElementById('stat-completed').textContent = stats.completed;
        document.getElementById('stat-today').textContent = stats.today;
        document.getElementById('task-count').textContent = `${stats.total} task${stats.total !== 1 ? 's' : ''}`;
    },
    
    /**
     * Render tasks list
     */
    renderTasks: () => {
        const sortedTasks = APP_STATE.getSortedTasks();
        
        // Update title based on filter
        const filterTitles = {
            all: 'All Tasks',
            today: 'Today\'s Tasks',
            upcoming: 'Upcoming Tasks',
            completed: 'Completed Tasks',
            overdue: 'Overdue Tasks'
        };
        ui.elements.tasksTitle.textContent = filterTitles[APP_STATE.currentFilter];
        
        // Empty state
        if (sortedTasks.length === 0) {
            ui.elements.tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-title">No tasks here</div>
                    <div class="empty-text">
                        ${APP_STATE.currentFilter === 'completed' 
                            ? 'Complete some tasks to see them here' 
                            : 'Create a new task to get started'}
                    </div>
                </div>
            `;
            return;
        }
        
        // Render tasks
        ui.elements.tasksList.innerHTML = sortedTasks.map(task => {
            const isOverdue = utils.isOverdue(task.dueDate) && !task.completed;
            const dateText = task.dueDate 
                ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '';
            
            return `
                <div class="task-item ${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="handleToggleTask('${task.id}')">
                    </div>
                    <div class="task-main">
                        <div class="task-content">${utils.escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            <span class="task-badge priority">${task.priority}</span>
                            ${task.dueDate ? `
                                <span class="task-badge date ${isOverdue ? 'overdue' : ''}">
                                    📅 ${dateText}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn delete" 
                                onclick="handleDeleteTask('${task.id}')" 
                                aria-label="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Update filter count badges
     */
    updateFilterCounts: () => {
        const stats = APP_STATE.getStats();
        
        document.getElementById('count-all').textContent = stats.total;
        document.getElementById('count-today').textContent = stats.today;
        document.getElementById('count-upcoming').textContent = stats.upcoming;
        document.getElementById('count-completed').textContent = stats.completed;
        document.getElementById('count-overdue').textContent = stats.overdue;
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message to display
     */
    showToast: (message) => {
        ui.elements.toastMessage.textContent = message;
        ui.elements.toast.classList.add('show');
        setTimeout(() => {
            ui.elements.toast.classList.remove('show');
        }, 3000);
    },
    
    /**
     * Show undo bar
     */
    showUndoBar: () => {
        ui.elements.undoBar.classList.add('show');
        setTimeout(() => {
            ui.elements.undoBar.classList.remove('show');
            APP_STATE.lastDeletedTask = null;
        }, 5000);
    },
    
    /**
     * Hide undo bar
     */
    hideUndoBar: () => {
        ui.elements.undoBar.classList.remove('show');
    },
    
    /**
     * Clear input fields
     */
    clearInput: () => {
        ui.elements.taskInput.value = '';
        ui.elements.dueDateInput.value = '';
    }
};