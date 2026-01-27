/**
 * Task Operations
 * CRUD operations and task manipulation logic
 */

const taskOperations = {
    /**
     * Create a new task
     * @param {string} title - Task title
     * @param {string} priority - Task priority (low/medium/high)
     * @param {string} dueDate - Due date
     * @returns {Object} Created task
     */
    create: (title, priority, dueDate) => {
        const task = {
            id: utils.generateId(),
            title: title.trim(),
            completed: false,
            priority: priority || 'medium',
            dueDate: utils.formatDate(dueDate),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        APP_STATE.tasks.unshift(task);
        storage.save(APP_STATE.tasks);
        ui.render();
        ui.showToast('✨ Task created successfully!');
        return task;
    },
    
    /**
     * Toggle task completion status
     * @param {string} id - Task ID
     */
    toggle: (id) => {
        const task = APP_STATE.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.updatedAt = new Date().toISOString();
            storage.save(APP_STATE.tasks);
            ui.render();
            
            if (task.completed) {
                ui.showToast('🎉 Great job! Task completed!');
            } else {
                ui.showToast('📝 Task marked as incomplete');
            }
        }
    },
    
    /**
     * Delete a task with undo capability
     * @param {string} id - Task ID
     */
    delete: (id) => {
        const taskIndex = APP_STATE.tasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
            APP_STATE.lastDeletedTask = {
                task: APP_STATE.tasks[taskIndex],
                index: taskIndex
            };
            APP_STATE.tasks.splice(taskIndex, 1);
            storage.save(APP_STATE.tasks);
            ui.render();
            ui.showUndoBar();
        }
    },
    
    /**
     * Undo last delete operation
     */
    undo: () => {
        if (APP_STATE.lastDeletedTask) {
            APP_STATE.tasks.splice(
                APP_STATE.lastDeletedTask.index,
                0,
                APP_STATE.lastDeletedTask.task
            );
            APP_STATE.lastDeletedTask = null;
            storage.save(APP_STATE.tasks);
            ui.render();
            ui.hideUndoBar();
            ui.showToast('🔄 Task restored!');
        }
    },
    
    /**
     * Update a task
     * @param {string} id - Task ID
     * @param {Object} updates - Fields to update
     */
    update: (id, updates) => {
        const task = APP_STATE.tasks.find(t => t.id === id);
        if (task) {
            Object.assign(task, updates, {
                updatedAt: new Date().toISOString()
            });
            storage.save(APP_STATE.tasks);
            ui.render();
        }
    },
    
    /**
     * Filter tasks by type
     * @param {Array} tasks - Tasks to filter
     * @param {string} filterType - Filter type
     * @returns {Array} Filtered tasks
     */
    filter: (tasks, filterType) => {
        switch (filterType) {
            case 'today':
                return tasks.filter(t => !t.completed && utils.isToday(t.dueDate));
            case 'upcoming':
                return tasks.filter(t => !t.completed && utils.isUpcoming(t.dueDate));
            case 'completed':
                return tasks.filter(t => t.completed);
            case 'overdue':
                return tasks.filter(t => !t.completed && utils.isOverdue(t.dueDate));
            default:
                return tasks;
        }
    },
    
    /**
     * Sort tasks intelligently
     * @param {Array} tasks - Tasks to sort
     * @returns {Array} Sorted tasks
     */
    sort: (tasks) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        
        return [...tasks].sort((a, b) => {
            // Completed tasks go last
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
            // Then by priority
            if (a.priority !== b.priority) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Then by due date
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            // Finally by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    },

    /**
     * Clear all completed tasks
     */
    clearCompleted: () => {
        const beforeCount = APP_STATE.tasks.length;
        APP_STATE.tasks = APP_STATE.tasks.filter(t => !t.completed);
        const clearedCount = beforeCount - APP_STATE.tasks.length;
        
        if (clearedCount > 0) {
            storage.save(APP_STATE.tasks);
            ui.render();
            ui.showToast(`🗑️ Cleared ${clearedCount} completed task${clearedCount !== 1 ? 's' : ''}`);
        }
    }
};