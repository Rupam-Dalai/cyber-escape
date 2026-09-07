/* ==========================================================================
   CodeHunt Todo - Main Application Engine
   ========================================================================== */

(function () {
  'use strict';

  // Local Storage Keys
  const STORAGE_KEY = 'code_hunt_tasks_v1';
  const STREAK_KEY = 'code_hunt_streak_v1';
  const LAST_DATE_KEY = 'code_hunt_last_date_v1';

  // Default Initial Sample Tasks if none exist
  const DEFAULT_TASKS = [
    {
      id: 'task_demo_1',
      title: 'Architect CodeHunt Todo System',
      description: 'Design glassmorphism UI layout, define color palette, and set up state management.',
      category: 'Coding',
      priority: 'HIGH',
      status: 'DONE',
      dueDate: getRelativeDate(0),
      createdAt: Date.now() - 86400000 * 2,
      subtasks: [
        { id: 'st_1', title: 'Create CSS Design System', completed: true },
        { id: 'st_2', title: 'Build HTML Shell & Controls', completed: true },
        { id: 'st_3', title: 'Implement ES6 State Logic', completed: true }
      ]
    },
    {
      id: 'task_demo_2',
      title: 'Optimize Web Application Performance',
      description: 'Ensure smooth 60fps animations, lazy event delegation, and fast render times.',
      category: 'Coding',
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      dueDate: getRelativeDate(1),
      createdAt: Date.now() - 86400000,
      subtasks: [
        { id: 'st_4', title: 'Profile DOM repaint cost', completed: true },
        { id: 'st_5', title: 'Audit local storage serialization', completed: false }
      ]
    },
    {
      id: 'task_demo_3',
      title: 'Prepare Code Hunt Presentation & Demo',
      description: 'Draft slide deck covering features: List & Kanban view, Pomodoro timer, and JSON backup.',
      category: 'Work',
      priority: 'MEDIUM',
      status: 'REVIEW',
      dueDate: getRelativeDate(2),
      createdAt: Date.now(),
      subtasks: [
        { id: 'st_6', title: 'Record HD UI Walkthrough Video', completed: false },
        { id: 'st_7', title: 'Export JSON data backup', completed: false }
      ]
    },
    {
      id: 'task_demo_4',
      title: 'Read System Architecture Documentation',
      description: 'Review modern web standards, accessibility patterns, and state persistence guidelines.',
      category: 'Study',
      priority: 'LOW',
      status: 'TODO',
      dueDate: getRelativeDate(4),
      createdAt: Date.now(),
      subtasks: []
    }
  ];

  // Application State
  let state = {
    tasks: [],
    viewMode: 'list', // 'list' or 'kanban'
    filterCategory: 'ALL',
    filterPriority: 'ALL',
    searchQuery: '',
    sortBy: 'dueDate',
    editingTaskId: null,
    streakDays: 1,
    timer: {
      interval: null,
      secondsRemaining: 25 * 60,
      totalSeconds: 25 * 60,
      isRunning: false,
      taskId: null
    }
  };

  // Helper: Relative Date YYYY-MM-DD
  function getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  }

  // Helper: Sound Synthesizer via Web Audio API
  function playNotificationSound(type = 'complete') {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'timer_done') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      // Audio context silenced or blocked by user gesture policy
    }
  }

  // Load State from LocalStorage
  function loadSavedState() {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY);
      if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
      } else {
        state.tasks = DEFAULT_TASKS;
        saveTasksToStorage();
      }

      const savedStreak = localStorage.getItem(STREAK_KEY);
      if (savedStreak) {
        state.streakDays = parseInt(savedStreak, 10) || 1;
      }

      // Check daily streak calculation
      const lastDate = localStorage.getItem(LAST_DATE_KEY);
      const today = new Date().toDateString();
      if (lastDate !== today) {
        if (lastDate) {
          const last = new Date(lastDate);
          const now = new Date();
          const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            state.streakDays += 1;
          } else if (diffDays > 1) {
            state.streakDays = 1;
          }
        }
        localStorage.setItem(LAST_DATE_KEY, today);
        localStorage.setItem(STREAK_KEY, state.streakDays.toString());
      }
    } catch (err) {
      console.error('Error loading state:', err);
      state.tasks = DEFAULT_TASKS;
    }
  }

  // Save Tasks to LocalStorage
  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
      renderStats();
    } catch (err) {
      showToast('Failed to save state to local storage', 'warning');
    }
  }

  // Toast Notification System
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Escape HTML helper
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // Filter & Sort Engine
  function getProcessedTasks() {
    return state.tasks.filter(task => {
      // Category Filter
      if (state.filterCategory !== 'ALL' && task.category !== state.filterCategory) {
        return false;
      }
      // Priority Filter
      if (state.filterPriority !== 'ALL' && task.priority !== state.filterPriority) {
        return false;
      }
      // Search Query
      if (state.searchQuery.trim() !== '') {
        const q = state.searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description ? task.description.toLowerCase().includes(q) : false;
        const matchCat = task.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      if (state.sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (state.sortBy === 'priority') {
        const pOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return pOrder[b.priority] - pOrder[a.priority];
      }
      if (state.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return b.createdAt - a.createdAt; // Created
    });
  }

  // Render Stats & Progress Bar
  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'DONE').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCompleted').textContent = completed;
    document.getElementById('statStreak').textContent = `${state.streakDays} Days`;

    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
  }

  // Render Main Views
  function render() {
    renderStats();
    const tasks = getProcessedTasks();

    if (state.viewMode === 'list') {
      document.getElementById('listView').style.display = 'flex';
      document.getElementById('kanbanView').style.display = 'none';
      renderListView(tasks);
    } else {
      document.getElementById('listView').style.display = 'none';
      document.getElementById('kanbanView').style.display = 'grid';
      renderKanbanView(tasks);
    }

    populateTimerTaskSelect();
  }

  // RENDER LIST VIEW
  function renderListView(tasks) {
    const container = document.getElementById('listView');
    container.innerHTML = '';

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-clipboard-list empty-icon"></i>
          <h3>No tasks found</h3>
          <p>No tasks match your current filter or search criteria. Click "Add Task" to create a new task.</p>
          <button class="btn btn-primary" id="emptyBtnNewTask"><i class="fa-solid fa-plus"></i> Add New Task</button>
        </div>
      `;
      document.getElementById('emptyBtnNewTask')?.addEventListener('click', openCreateTaskModal);
      return;
    }

    tasks.forEach(task => {
      const isCompleted = task.status === 'DONE';

      // Calculate subtasks completion
      let subtasksHTML = '';
      if (task.subtasks && task.subtasks.length > 0) {
        const stDone = task.subtasks.filter(s => s.completed).length;
        const stPercent = Math.round((stDone / task.subtasks.length) * 100);
        subtasksHTML = `
          <div class="subtasks-mini">
            <i class="fa-solid fa-list-check"></i>
            <span>${stDone}/${task.subtasks.length}</span>
            <div class="subtask-bar">
              <div class="subtask-fill" style="width: ${stPercent}%;"></div>
            </div>
          </div>
        `;
      }

      // Check overdue date
      let dateMetaHTML = '';
      if (task.dueDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = !isCompleted && task.dueDate < todayStr;
        dateMetaHTML = `
          <div class="task-meta-item ${isOverdue ? 'overdue' : ''}">
            <i class="fa-regular fa-calendar"></i>
            <span>${task.dueDate} ${isOverdue ? '(Overdue)' : ''}</span>
          </div>
        `;
      }

      const card = document.createElement('div');
      card.className = `task-card ${isCompleted ? 'completed' : ''}`;
      card.style.setProperty('--priority-color', getPriorityColor(task.priority));

      card.innerHTML = `
        <div class="task-left">
          <div class="custom-checkbox" data-action="toggle" data-id="${task.id}">
            <i class="fa-solid fa-check"></i>
          </div>
          <div class="task-main-info">
            <div class="task-header-row">
              <span class="task-title">${escapeHTML(task.title)}</span>
              <span class="badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
              <span class="badge badge-category">${escapeHTML(task.category)}</span>
            </div>
            ${task.description ? `<p class="task-description">${escapeHTML(task.description)}</p>` : ''}
            <div class="task-meta">
              ${dateMetaHTML}
              ${subtasksHTML}
            </div>
          </div>
        </div>

        <div class="task-actions">
          <button class="btn-icon" data-action="timer" data-id="${task.id}" title="Start Focus Timer">
            <i class="fa-solid fa-play"></i>
          </button>
          <button class="btn-icon" data-action="edit" data-id="${task.id}" title="Edit Task">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon delete" data-action="delete" data-id="${task.id}" title="Delete Task">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;

      // Event Listeners for actions
      card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          handleTaskAction(action, id);
        });
      });

      container.appendChild(card);
    });
  }

  // Priority Color Map
  function getPriorityColor(priority) {
    switch (priority) {
      case 'URGENT': return '#ef4444';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#10b981';
      case 'LOW': return '#3b82f6';
      default: return '#6366f1';
    }
  }

  // RENDER KANBAN VIEW
  function renderKanbanView(tasks) {
    const cols = {
      TODO: document.getElementById('colTodo'),
      IN_PROGRESS: document.getElementById('colInProgress'),
      REVIEW: document.getElementById('colReview'),
      DONE: document.getElementById('colDone')
    };

    const counts = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0 };

    Object.values(cols).forEach(col => col.innerHTML = '');

    tasks.forEach(task => {
      const status = task.status || 'TODO';
      counts[status] = (counts[status] || 0) + 1;
      const targetCol = cols[status] || cols.TODO;

      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.setAttribute('data-id', task.id);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <span class="badge badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
          <span class="badge badge-category">${escapeHTML(task.category)}</span>
        </div>
        <div class="kanban-card-title">${escapeHTML(task.title)}</div>
        ${task.description ? `<p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${escapeHTML(task.description).substring(0, 70)}...</p>` : ''}
        <div class="kanban-card-footer">
          <span><i class="fa-regular fa-calendar"></i> ${task.dueDate || 'No Date'}</span>
          <div style="display: flex; gap: 4px;">
            <button class="btn-icon" data-action="edit" data-id="${task.id}" style="width: 26px; height: 26px; font-size: 11px;"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icon delete" data-action="delete" data-id="${task.id}" style="width: 26px; height: 26px; font-size: 11px;"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;

      // Drag Events
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', task.id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });

      card.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          handleTaskAction(action, id);
        });
      });

      targetCol.appendChild(card);
    });

    document.getElementById('countTodo').textContent = counts.TODO || 0;
    document.getElementById('countInProgress').textContent = counts.IN_PROGRESS || 0;
    document.getElementById('countReview').textContent = counts.REVIEW || 0;
    document.getElementById('countDone').textContent = counts.DONE || 0;

    setupKanbanDragDrop();
  }

  // Setup Drag & Drop Handlers for Kanban Columns
  function setupKanbanDragDrop() {
    const columns = document.querySelectorAll('.kanban-tasks');
    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        col.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.parentElement.getAttribute('data-status');
        if (taskId && newStatus) {
          updateTaskStatus(taskId, newStatus);
        }
      });
    });
  }

  // Handle Action Router
  function handleTaskAction(action, id) {
    if (action === 'toggle') {
      const task = state.tasks.find(t => t.id === id);
      if (task) {
        task.status = task.status === 'DONE' ? 'TODO' : 'DONE';
        if (task.status === 'DONE') playNotificationSound('complete');
        saveTasksToStorage();
        render();
      }
    } else if (action === 'delete') {
      state.tasks = state.tasks.filter(t => t.id !== id);
      saveTasksToStorage();
      render();
      showToast('Task deleted', 'info');
    } else if (action === 'edit') {
      openEditTaskModal(id);
    } else if (action === 'timer') {
      openTimerModalWithTask(id);
    }
  }

  // Update Task Status
  function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      if (newStatus === 'DONE') playNotificationSound('complete');
      saveTasksToStorage();
      render();
      showToast(`Task moved to ${newStatus.replace('_', ' ')}`, 'success');
    }
  }

  // CREATE / EDIT TASK MODAL LOGIC
  function openCreateTaskModal() {
    state.editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Create New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskDueDateInput').value = getRelativeDate(1);
    document.getElementById('subtasksFormList').innerHTML = '';

    // Add 1 default empty subtask input
    addSubtaskInputField();
    openModal('taskModal');
  }

  function openEditTaskModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    state.editingTaskId = id;
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskTitleInput').value = task.title;
    document.getElementById('taskDescInput').value = task.description || '';
    document.getElementById('taskCategoryInput').value = task.category || 'Coding';
    document.getElementById('taskDueDateInput').value = task.dueDate || '';

    const priorityRadio = document.querySelector(`input[name="taskPriority"][value="${task.priority}"]`);
    if (priorityRadio) priorityRadio.checked = true;

    // Subtasks
    const container = document.getElementById('subtasksFormList');
    container.innerHTML = '';
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach(st => addSubtaskInputField(st.title, st.completed));
    } else {
      addSubtaskInputField();
    }

    openModal('taskModal');
  }

  function addSubtaskInputField(title = '', completed = false) {
    const container = document.getElementById('subtasksFormList');
    const div = document.createElement('div');
    div.className = 'subtask-input-item';
    div.innerHTML = `
      <input type="checkbox" class="subtask-item-check" ${completed ? 'checked' : ''}>
      <input type="text" class="form-control subtask-item-text" placeholder="Subtask item..." value="${escapeHTML(title)}">
      <button type="button" class="btn-icon delete" style="width: 32px; height: 32px;" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(div);
  }

  // Save Form Handler
  function handleTaskFormSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('taskTitleInput').value.trim();
    if (!title) return;

    const desc = document.getElementById('taskDescInput').value.trim();
    const category = document.getElementById('taskCategoryInput').value;
    const dueDate = document.getElementById('taskDueDateInput').value;
    const priority = document.querySelector('input[name="taskPriority"]:checked').value;

    // Parse subtasks
    const subtaskNodes = document.querySelectorAll('.subtask-input-item');
    const subtasks = [];
    subtaskNodes.forEach((node, index) => {
      const text = node.querySelector('.subtask-item-text').value.trim();
      const isDone = node.querySelector('.subtask-item-check').checked;
      if (text) {
        subtasks.push({
          id: `st_${Date.now()}_${index}`,
          title: text,
          completed: isDone
        });
      }
    });

    if (state.editingTaskId) {
      // Update
      const task = state.tasks.find(t => t.id === state.editingTaskId);
      if (task) {
        task.title = title;
        task.description = desc;
        task.category = category;
        task.dueDate = dueDate;
        task.priority = priority;
        task.subtasks = subtasks;
      }
      showToast('Task updated successfully', 'success');
    } else {
      // Create
      const newTask = {
        id: `task_${Date.now()}`,
        title: title,
        description: desc,
        category: category,
        priority: priority,
        status: 'TODO',
        dueDate: dueDate,
        createdAt: Date.now(),
        subtasks: subtasks
      };
      state.tasks.unshift(newTask);
      showToast('New task created!', 'success');
    }

    saveTasksToStorage();
    closeModal('taskModal');
    render();
  }

  // POMODORO FOCUS TIMER MODULE
  function populateTimerTaskSelect() {
    const select = document.getElementById('timerTaskSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- General Focus Session --</option>';
    state.tasks.filter(t => t.status !== 'DONE').forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `[${t.category}] ${t.title}`;
      if (state.timer.taskId === t.id) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function openTimerModalWithTask(taskId = null) {
    if (taskId) state.timer.taskId = taskId;
    populateTimerTaskSelect();
    openModal('timerModal');
  }

  function toggleTimer() {
    if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function startTimer() {
    state.timer.isRunning = true;
    document.getElementById('timerPlayIcon').className = 'fa-solid fa-pause';
    document.getElementById('timerPlayText').textContent = 'Pause';
    document.getElementById('timerCircle').classList.add('active');

    state.timer.interval = setInterval(() => {
      if (state.timer.secondsRemaining > 0) {
        state.timer.secondsRemaining -= 1;
        updateTimerDisplay();
      } else {
        pauseTimer();
        playNotificationSound('timer_done');
        showToast('🎉 Focus session completed! Great job!', 'success');
        state.timer.secondsRemaining = state.timer.totalSeconds;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timer.isRunning = false;
    if (state.timer.interval) clearInterval(state.timer.interval);
    document.getElementById('timerPlayIcon').className = 'fa-solid fa-play';
    document.getElementById('timerPlayText').textContent = 'Start Focus';
    document.getElementById('timerCircle').classList.remove('active');
  }

  function resetTimer() {
    pauseTimer();
    state.timer.secondsRemaining = state.timer.totalSeconds;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.timer.secondsRemaining / 60);
    const secs = state.timer.secondsRemaining % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    document.getElementById('timerDigits').textContent = formatted;

    const select = document.getElementById('timerTaskSelect');
    const selectedTask = state.tasks.find(t => t.id === select.value);
    document.getElementById('timerActiveTaskLabel').textContent = selectedTask ? selectedTask.title : 'Focus Time';
  }

  // EXPORT / IMPORT JSON DATA
  function exportTasksJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `code_hunt_todo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    showToast('JSON backup exported successfully', 'success');
  }

  function importTasksJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          state.tasks = imported;
          saveTasksToStorage();
          render();
          closeModal('dataModal');
          showToast(`Successfully imported ${imported.length} tasks!`, 'success');
        } else {
          showToast('Invalid JSON structure', 'warning');
        }
      } catch (err) {
        showToast('Failed to parse JSON file', 'warning');
      }
    };
    reader.readAsText(file);
  }

  // Generic Modal Handlers
  function openModal(id) {
    document.getElementById(id)?.classList.add('active');
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
  }

  // Event Listeners Binding
  function initEventListeners() {
    // New Task Button
    document.getElementById('btnNewTask').addEventListener('click', openCreateTaskModal);
    document.getElementById('btnCloseTaskModal').addEventListener('click', () => closeModal('taskModal'));
    document.getElementById('btnCancelTask').addEventListener('click', () => closeModal('taskModal'));
    document.getElementById('taskForm').addEventListener('submit', handleTaskFormSubmit);

    // Dynamic Subtask Button in Form
    document.getElementById('btnAddSubtaskItem').addEventListener('click', () => addSubtaskInputField());

    // Search Input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      render();
    });

    // Filters & Sort
    document.getElementById('filterCategory').addEventListener('change', (e) => {
      state.filterCategory = e.target.value;
      render();
    });

    document.getElementById('filterPriority').addEventListener('change', (e) => {
      state.filterPriority = e.target.value;
      render();
    });

    document.getElementById('sortBy').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      render();
    });

    // View Toggles
    document.getElementById('btnListView').addEventListener('click', () => {
      state.viewMode = 'list';
      document.getElementById('btnListView').classList.add('active');
      document.getElementById('btnKanbanView').classList.remove('active');
      render();
    });

    document.getElementById('btnKanbanView').addEventListener('click', () => {
      state.viewMode = 'kanban';
      document.getElementById('btnKanbanView').classList.add('active');
      document.getElementById('btnListView').classList.remove('active');
      render();
    });

    // Timer Modal Controls
    document.getElementById('btnOpenTimer').addEventListener('click', () => openTimerModalWithTask());
    document.getElementById('btnCloseTimerModal').addEventListener('click', () => closeModal('timerModal'));
    document.getElementById('btnToggleTimer').addEventListener('click', toggleTimer);
    document.getElementById('btnResetTimer').addEventListener('click', resetTimer);

    // Export/Import Modal Controls
    document.getElementById('btnOpenExport').addEventListener('click', () => openModal('dataModal'));
    document.getElementById('btnCloseDataModal').addEventListener('click', () => closeModal('dataModal'));
    document.getElementById('btnExportJSON').addEventListener('click', exportTasksJSON);
    document.getElementById('btnImportJSON').addEventListener('change', importTasksJSON);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement.tagName;
      const isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';

      // Press '/' to search
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
      }

      // Press 'n' or 'N' to open New Task modal
      if ((e.key === 'n' || e.key === 'N') && !isInput) {
        e.preventDefault();
        openCreateTaskModal();
      }

      // Press Escape to close active modal
      if (e.key === 'Escape') {
        closeModal('taskModal');
        closeModal('timerModal');
        closeModal('dataModal');
      }
    });
  }

  // Initialize Application
  function init() {
    loadSavedState();
    initEventListeners();
    render();
    updateTimerDisplay();
    console.log('CodeHunt Todo App initialized successfully.');
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
