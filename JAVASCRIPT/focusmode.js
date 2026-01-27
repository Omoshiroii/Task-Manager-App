/**
 * Focus Mode
 * Pomodoro-style focus mode for working on tasks
 */

const focusMode = {
    /**
     * Enter focus mode
     */
    enter: () => {
        const activeTasks = APP_STATE.tasks.filter(t => !t.completed);
        
        if (activeTasks.length === 0) {
            ui.showToast('⚠️ No active tasks to focus on');
            return;
        }
        
        // Get the highest priority active task
        const sortedTasks = taskOperations.sort(activeTasks);
        const nextTask = sortedTasks[0];
        
        ui.elements.focusTaskTitle.textContent = nextTask.title;
        ui.elements.focusOverlay.classList.add('active');
        APP_STATE.focusMode = true;
        APP_STATE.focusTimeLeft = 25 * 60;
        ui.elements.focusTimer.textContent = utils.formatTimer(APP_STATE.focusTimeLeft);
        ui.elements.focusStart.textContent = 'Start';
        document.body.style.overflow = 'hidden';
    },
    
    /**
     * Exit focus mode
     */
    exit: () => {
        ui.elements.focusOverlay.classList.remove('active');
        APP_STATE.focusMode = false;
        focusMode.stop();
        document.body.style.overflow = '';
    },
    
    /**
     * Start focus timer
     */
    start: () => {
        if (APP_STATE.focusTimer) return;
        
        APP_STATE.focusTimer = setInterval(() => {
            APP_STATE.focusTimeLeft--;
            ui.elements.focusTimer.textContent = utils.formatTimer(APP_STATE.focusTimeLeft);
            
            // Timer completed
            if (APP_STATE.focusTimeLeft <= 0) {
                focusMode.stop();
                ui.showToast('🎉 Focus session completed! Great work!');
                
                // Play notification sound (optional)
                // You can add a subtle sound here
                
                focusMode.exit();
            }
        }, 1000);
        
        ui.elements.focusStart.textContent = 'Pause';
    },
    
    /**
     * Stop/pause focus timer
     */
    stop: () => {
        if (APP_STATE.focusTimer) {
            clearInterval(APP_STATE.focusTimer);
            APP_STATE.focusTimer = null;
            ui.elements.focusStart.textContent = 'Resume';
        }
    },
    
    /**
     * Reset focus timer
     */
    reset: () => {
        focusMode.stop();
        APP_STATE.focusTimeLeft = 25 * 60;
        ui.elements.focusTimer.textContent = utils.formatTimer(APP_STATE.focusTimeLeft);
        ui.elements.focusStart.textContent = 'Start';
    },
    
    /**
     * Toggle timer (start/pause)
     */
    toggle: () => {
        if (APP_STATE.focusTimer) {
            focusMode.stop();
        } else {
            focusMode.start();
        }
    }
};