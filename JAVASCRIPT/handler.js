/**
 * Event Handlers
 * All user interaction handlers
 */

/**
 * Handle adding a new task
 */
function handleAddTask() {
    const title = ui.elements.taskInput.value.trim();
    
    // Validate input
    if (!title) {
        ui.elements.taskInput.focus();
        ui.showToast('⚠️ Please enter a task title');
        return;
    }
    
    const dueDate = ui.elements.dueDateInput.value;
    taskOperations.create(title, APP_STATE.currentPriority, dueDate);
    ui.clearInput();
    ui.elements.taskInput.focus();
}

/**
 * Handle toggling task completion
 * @param {string} id - Task ID
 */
function handleToggleTask(id) {
    taskOperations.toggle(id);
}

/**
 * Handle deleting a task
 * @param {string} id - Task ID
 */
function handleDeleteTask(id) {
    taskOperations.delete(id);
}

/**
 * Handle filter change
 * @param {string} filter - Filter type
 */
function handleFilterChange(filter) {
    APP_STATE.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    ui.render();
}

/**
 * Handle priority change
 * @param {string} priority - Priority level
 */
function handlePriorityChange(priority) {
    APP_STATE.currentPriority = priority;
    
    // Update active priority button
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.priority === priority);
    });
}

/**
 * Handle keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyboardShortcuts(e) {
    // Cmd/Ctrl + Enter: Add task
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAddTask();
    }
    
    // F: Focus mode
    if ((e.key === 'f' || e.key === 'F') && 
        !APP_STATE.focusMode && 
        document.activeElement !== ui.elements.taskInput &&
        document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        focusMode.enter();
    }
    
    // Escape: Exit focus mode
    if (e.key === 'Escape' && APP_STATE.focusMode) {
        focusMode.exit();
    }
    
    // Cmd/Ctrl + K: Focus task input
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        ui.elements.taskInput.focus();
        ui.elements.taskInput.select();
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Add task button
    ui.elements.addTaskBtn.addEventListener('click', handleAddTask);
    
    // Task input enter key
    ui.elements.taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddTask();
        }
    });
    
    // Priority buttons
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handlePriorityChange(btn.dataset.priority);
        });
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            handleFilterChange(btn.dataset.filter);
        });
    });
    
    // Focus mode button
    ui.elements.focusModeBtn.addEventListener('click', () => {
        focusMode.enter();
    });
    
    // Focus mode exit
    ui.elements.focusExit.addEventListener('click', () => {
        focusMode.exit();
    });
    
    // Focus mode start/pause
    ui.elements.focusStart.addEventListener('click', () => {
        focusMode.toggle();
    });
    
    // Undo button
    ui.elements.undoBtn.addEventListener('click', () => {
        taskOperations.undo();
    });
    
    // Sort button (for future implementation)
    ui.elements.sortBtn.addEventListener('click', () => {
        ui.showToast('ℹ️ Tasks are automatically sorted by priority and date');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Click outside to close focus mode
    ui.elements.focusOverlay.addEventListener('click', (e) => {
        if (e.target === ui.elements.focusOverlay) {
            focusMode.exit();
        }
    });
}