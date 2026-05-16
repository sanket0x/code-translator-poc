// ===== Task Manager Module =====
// Handles all task-related operations: CRUD, drag-and-drop, comments

const TaskManager = {
    // ===== Task CRUD Operations =====
    
    createTask(title, description, taggedUsers = []) {
        const task = {
            id: `task-${AppState.nextTaskId}`,
            title: title.trim(),
            description: description.trim(),
            status: 'todo',
            comments: [],
            taggedUsers: taggedUsers || [],  // Array of user IDs
            createdAt: new Date().toISOString()
        };
        
        AppState.tasks.push(task);
        AppState.nextTaskId++;
        
        console.log('✅ Task created:', task.id);
        
        this.saveAndRender();
        return task;
    },
    
    updateTask(taskId, updates) {
        const task = this.getTaskById(taskId);
        
        if (!task) {
            console.error('❌ Task not found:', taskId);
            return null;
        }
        
        Object.assign(task, updates);
        console.log('📝 Task updated:', taskId);
        
        this.saveAndRender();
        return task;
    },
    
    deleteTask(taskId) {
        const index = AppState.tasks.findIndex(t => t.id === taskId);
        
        if (index === -1) {
            console.error('❌ Task not found:', taskId);
            return false;
        }
        
        AppState.tasks.splice(index, 1);
        console.log('🗑️ Task deleted:', taskId);
        
        this.saveAndRender();
        return true;
    },
    
    getTaskById(taskId) {
        return AppState.tasks.find(t => t.id === taskId);
    },
    
    getTasksByStatus(status) {
        return AppState.tasks.filter(t => t.status === status);
    },
    
    // ===== Comment Operations =====
    
    addComment(taskId, commentText, source = 'code-translator') {
        const task = this.getTaskById(taskId);
        
        if (!task) {
            console.error('❌ Task not found:', taskId);
            return null;
        }
        
        const comment = {
            id: `comment-${Date.now()}`,
            text: commentText,
            source: source,
            timestamp: new Date().toISOString()
        };
        
        task.comments.push(comment);
        console.log('💬 Comment added to', taskId);
        
        this.saveAndRender();
        return comment;
    },
    
    // ===== Status Management =====
    
    moveTask(taskId, newStatus) {
        const task = this.getTaskById(taskId);
        
        if (!task) {
            console.error('❌ Task not found:', taskId);
            return false;
        }
        
        const oldStatus = task.status;
        task.status = newStatus;
        
        console.log(`🔄 Task ${taskId} moved: ${oldStatus} → ${newStatus}`);
        
        this.saveAndRender();
        return true;
    },
    
    // ===== Rendering =====
    
    renderAllTasks() {
        // Clear all columns
        document.getElementById('todoColumn').innerHTML = '';
        document.getElementById('inProgressColumn').innerHTML = '';
        document.getElementById('doneColumn').innerHTML = '';
        
        // Render tasks by status
        this.renderTasksByStatus('todo', 'todoColumn');
        this.renderTasksByStatus('in-progress', 'inProgressColumn');
        this.renderTasksByStatus('done', 'doneColumn');
        
        // Update task counts
        this.updateTaskCounts();
        
        // Re-initialize drag and drop
        this.initDragAndDrop();
    },
    
    renderTasksByStatus(status, columnId) {
        const tasks = this.getTasksByStatus(status);
        const column = document.getElementById(columnId);
        
        if (tasks.length === 0) {
            column.innerHTML = '<div class="empty-column">No tasks</div>';
            return;
        }
        
        tasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            column.appendChild(taskCard);
        });
    },
    
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.dataset.taskId = task.id;
        
        // Truncate description for card view
        const truncatedDesc = task.description.length > 100 
            ? task.description.substring(0, 100) + '...' 
            : task.description;
        
        card.innerHTML = `
            <div class="task-id">${task.id}</div>
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-description">${this.escapeHtml(truncatedDesc)}</div>
            <div class="task-footer">
                <span class="comment-count">💬 ${task.comments.length}</span>
            </div>
        `;
        
        // Click to edit
        card.addEventListener('click', () => this.openEditTaskModal(task.id));
        
        return card;
    },
    
    updateTaskCounts() {
        const counts = {
            todo: this.getTasksByStatus('todo').length,
            'in-progress': this.getTasksByStatus('in-progress').length,
            done: this.getTasksByStatus('done').length
        };
        
        document.getElementById('todoCount').textContent = counts.todo;
        document.getElementById('inProgressCount').textContent = counts['in-progress'];
        document.getElementById('doneCount').textContent = counts.done;
    },
    
    // ===== Drag and Drop =====
    
    initDragAndDrop() {
        const cards = document.querySelectorAll('.task-card');
        const columns = document.querySelectorAll('.column-content');
        
        // Setup drag events for cards
        cards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
        
        // Setup drop zones
        columns.forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
            column.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    },
    
    handleDragStart(e) {
        const card = e.target;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', card.innerHTML);
        e.dataTransfer.setData('taskId', card.dataset.taskId);
    },
    
    handleDragEnd(e) {
        const card = e.target;
        card.classList.remove('dragging');
        
        // Remove all drag-over classes
        document.querySelectorAll('.column-content').forEach(col => {
            col.classList.remove('drag-over');
        });
    },
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const column = e.currentTarget;
        column.classList.add('drag-over');
        
        return false;
    },
    
    handleDragLeave(e) {
        const column = e.currentTarget;
        column.classList.remove('drag-over');
    },
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const column = e.currentTarget;
        column.classList.remove('drag-over');
        
        const taskId = e.dataTransfer.getData('taskId');
        const newStatus = column.parentElement.dataset.status;
        
        if (taskId && newStatus) {
            this.moveTask(taskId, newStatus);
        }
        
        return false;
    },
    
    // ===== Modal Operations =====
    
    openEditTaskModal(taskId) {
        const task = this.getTaskById(taskId);
        
        if (!task) {
            console.error('❌ Task not found:', taskId);
            return;
        }
        
        AppState.currentEditingTask = taskId;
        
        // Populate modal
        document.getElementById('modalTitle').textContent = task.id;
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description;
        
        // Update character counts
        updateCharCount('title', task.title.length, 80);
        updateCharCount('desc', task.description.length, 255);
        
        // Populate user tag dropdown and render tagged users
        if (typeof populateUserTagDropdown === 'function') {
            populateUserTagDropdown();
        }
        if (typeof renderTaggedUsers === 'function') {
            renderTaggedUsers(task);
        }
        
        // Render comments
        this.renderComments(task);
        
        // Show delete button for existing tasks
        const deleteBtn = document.getElementById('deleteTaskBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
        
        // Show modal
        document.getElementById('taskModal').classList.add('show');
        document.getElementById('modalOverlay').classList.add('show');
        
        // Focus on title
        document.getElementById('taskTitle').focus();
    },
    
    renderComments(task) {
        const commentsContainer = document.getElementById('taskComments');
        
        if (task.comments.length === 0) {
            commentsContainer.innerHTML = '';
            return;
        }
        
        let html = '<h4>Comments:</h4>';
        
        // Sort comments by timestamp (newest first)
        const sortedComments = [...task.comments].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        sortedComments.forEach(comment => {
            const timeAgo = formatDate(comment.timestamp);
            const icon = comment.source === 'code-translator' ? '🤖' : '👤';
            
            html += `
                <div class="comment">
                    <div class="comment-header">
                        <span>${icon}</span>
                        <span class="comment-source">${comment.source}</span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="comment-text">${this.formatCommentText(comment.text)}</div>
                </div>
            `;
        });
        
        commentsContainer.innerHTML = html;
    },
    
    saveTaskFromModal() {
        const taskId = AppState.currentEditingTask;
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        
        if (!title) {
            alert('Please enter a task title');
            return false;
        }
        
        if (!taskId) {
            // Should not happen with new approach
            const task = this.createTask(title, description);
        } else if (taskId.startsWith('temp-')) {
            // Converting temporary task to real task
            const taggedUsers = AppState.tempTask ? AppState.tempTask.taggedUsers : [];
            
            // Create real task with tagged users
            const task = this.createTask(title, description, taggedUsers);
            
            // Clean up temp task
            AppState.tempTask = null;
        } else {
            // Updating existing task
            const task = this.getTaskById(taskId);
            if (task) {
                // Tagged users are already saved via addUserTagToTask
                this.updateTask(taskId, { title, description });
            }
        }
        
        return true;
    },
    
    // ===== Utility Functions =====
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    formatCommentText(text) {
        // First escape HTML to prevent XSS
        let formatted = this.escapeHtml(text);
        
        // Convert markdown headers to HTML
        // ### Header 3 -> <h3>Header 3</h3>
        formatted = formatted.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.1em; font-weight: bold; margin: 0.5em 0;">$1</h3>');
        // ## Header 2 -> <h2>Header 2</h2>
        formatted = formatted.replace(/^## (.+)$/gm, '<h2 style="font-size: 1.2em; font-weight: bold; margin: 0.5em 0;">$1</h2>');
        // # Header 1 -> <h1>Header 1</h1>
        formatted = formatted.replace(/^# (.+)$/gm, '<h1 style="font-size: 1.3em; font-weight: bold; margin: 0.5em 0;">$1</h1>');
        
        // Convert **text** to <strong>text</strong>
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Convert *text* to <em>text</em>
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Convert `code` to <code>code</code>
        formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>');
        
        // Convert line breaks to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    },
    
    saveAndRender() {
        saveToLocalStorage();
        this.renderAllTasks();
    }
};

// ===== Initialize Function =====
// Called from app.js after localStorage is loaded
TaskManager.init = function() {
    this.renderAllTasks();
    console.log('✅ Task Manager initialized');
};

// Made with Bob
