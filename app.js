/**
 * TaskMaster - A simple todo list application
 *
 * This JavaScript file contains the functionality for the TaskMaster app.
 * It allows users to create, mark complete, and delete tasks.
 * Security enhanced version with input sanitization and validation.
 *
 * ===================== LAB EXTENSION =====================
 * STORAGE TASK INSTRUCTION:
 * In this lab, you'll enhance the existing security-focused app
 * by implementing browser-based data persistence using the
 * Web Storage API (specifically localStorage).
 *
 * ➤ Your goal is to:
 *    1. Detect if localStorage is available in the browser.
 *    2. Load previously saved tasks when the page initializes.
 *    3. Save tasks to localStorage whenever tasks are added,
 *       updated, or deleted, so they persist across sessions.
 *
 * ⚡ IMPORTANT:
 * Only add the necessary localStorage logic as instructed.
 * ==========================================================
 */

// Global variables for application state
var tasks = [];
var currentFilter = 'all';
var readOnlyMode = false;

// Global variables for DOM elements
var taskForm;
var taskInput;
var taskPriority;
var taskDate;
var taskList;
var itemsLeft;
var filterButtons;

/********************************************
 * TASK 4: IMPLEMENT SECURITY FEEDBACK SYSTEM
 ********************************************/
/**
 * Security feedback system
 */
var securityFeedback = {
  // Security log (for potentially suspicious activities)
  securityLog: [],
  
  // Log a security event
  logEvent: function(type, details) {
    var event = {
      type: type,
      timestamp: new Date().toISOString(),
      details: details || {}
    };
    
    this.securityLog.push(event);
    console.log('Security Event:', event);
  },
  
  // Show a security notice to the user
  showNotice: function(message) {
    // Create notification element
    var notice = document.createElement('div');
    notice.className = 'security-notice-popup';
    notice.innerHTML = '<p>' + sanitizeHtml(message) + '</p>' +
                        '<button class="close-notice">Close</button>';
    
    // Add to document
    document.body.appendChild(notice);
    
    // Add close handler
    notice.querySelector('.close-notice').addEventListener('click', function() {
      document.body.removeChild(notice);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(function() {
      if (document.body.contains(notice)) {
        document.body.removeChild(notice);
      }
    }, 5000);
  }
};

/*******************************************
 * TASK 2: IMPLEMENT HTML CONTENT SANITIZATION
 *******************************************/
/**
 * Sanitizes a string for safe HTML display
 * @param {string} content - The content to sanitize
 * @returns {string} - The sanitized content
 */
function sanitizeHtml(content) {
  // Create a temporary element
  var temp = document.createElement('div');
  
  // Set its textContent (which automatically escapes HTML)
  temp.textContent = content;
  
  // Return the escaped content
  return temp.innerHTML;
}

/********************************************
 * TASK 4: IMPLEMENT SECURITY FEEDBACK SYSTEM
 ********************************************/
/**
 * Add security related styles
 */
function addSecurityStyles() {
  var style = document.createElement('style');
  style.textContent = `
    .security-notice-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      border-left: 4px solid #e63946;
      padding: 12px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      z-index: 1000;
      max-width: 300px;
    }
    .security-notice-popup p {
      margin: 0 0 10px 0;
      color: #856404;
    }
    .security-notice-popup .close-notice {
      background: transparent;
      border: 1px solid #856404;
      color: #856404;
      padding: 3px 8px;
      font-size: 12px;
      border-radius: 3px;
      cursor: pointer;
    }
    .security-notice {
      color: #e63946;
      cursor: help;
    }
  `;
  document.head.appendChild(style);
}

/*******************************************
 * TASK 3: IMPLEMENT SECURE URL VALIDATION
 *******************************************/
/**
 * Validates if a string is a safe URL
 * @param {string} url - The URL to validate
 * @returns {Object} - Validation result with isValid flag
 */
function validateUrl(url) {
  var result = {
    isValid: false,
    error: ''
  };
  
  // Check if the URL is empty (which might be fine)
  if (!url || url.trim() === '') {
    result.isValid = true;
    return result;
  }
  
  try {
    // Create URL object to check validity
    var urlObj = new URL(url);
    
    // Restrict to http or https protocols only
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      result.error = 'URLs must use http or https protocols only';
      return result;
    }
    
    // URL is valid and safe
    result.isValid = true;
    return result;
  } catch (e) {
    // Invalid URL format
    result.error = 'Please enter a valid URL';
    return result;
  }
}

/**
 * Tests the URL validation with various inputs
 */
function testUrlValidation() {
  var testUrls = [
    'https://www.example.com',
    'http://localhost:3000',
    'javascript:alert("XSS")',
    'data:text/html,<script>alert("XSS")</script>',
    'file:///etc/passwd',
    'ftp://example.com/file.txt'
  ];
  
  console.log('Testing URL validation:');
  for (var i = 0; i < testUrls.length; i++) {
    var url = testUrls[i];
    var result = validateUrl(url);
    console.log(url, result.isValid ? '✓ Valid' : '✗ Invalid: ' + result.error);
  }
}

/**
 * Updates the document title with task count
 */
function updateDocumentTitle() {
  document.title = "TaskMaster - " + tasks.length + " Tasks";
}

/**
 * Updates the displayed task count
 */
function updateTaskCount() {
  // Count incomplete tasks
  var incompleteCount = 0;
  for (var i = 0; i < tasks.length; i++) {
    if (!tasks[i].completed) {
      incompleteCount++;
    }
  }
  
  // Update display
  itemsLeft.textContent = incompleteCount;
  
  // Update document title with total tasks
  updateDocumentTitle();
}

/*******************************************
 * TASK 1: IMPLEMENT ENHANCED INPUT VALIDATION
 *******************************************/
/**
 * Validates and sanitizes a task description
 * @param {string} description - The task description to validate
 * @returns {Object} - Validation result with isValid flag and sanitized value
 */
function validateAndSanitizeDescription(description) {
  var result = {
    isValid: false,
    value: '',
    error: ''
  };
  
  // Trim the input
  var trimmed = description.trim();
  
  // Check for empty input
  if (!trimmed) {
    result.error = 'Task description is required';
    return result;
  }
  
  // Check minimum length
  if (trimmed.length < 3) {
    result.error = 'Task description must be at least 3 characters';
    return result;
  }
  
  // Check maximum length (prevent excessive data)
  if (trimmed.length > 100) {
    result.error = 'Task description must be less than 100 characters';
    return result;
  }
  
  // Check for potentially dangerous patterns
  var scriptPattern = /<script|javascript:|onerror=|onclick=|onload=/i;
  if (scriptPattern.test(trimmed)) {
    // Log potential security issues
    securityFeedback.logEvent('suspicious-input', { input: trimmed });
    result.error = 'Task description contains disallowed content';
    return result;
  }
  
  // Validation passed
  result.isValid = true;
  result.value = trimmed;
  return result;
}

/**
 * Filter tasks based on current filter
 * @returns {Array} - The filtered tasks
 */
function getFilteredTasks() {
  if (currentFilter === 'active') {
    // Return only incomplete tasks
    var activeTasks = [];
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].completed) {
        activeTasks.push(tasks[i]);
      }
    }
    return activeTasks;
  } else if (currentFilter === 'completed') {
    // Return only completed tasks
    var completedTasks = [];
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].completed) {
        completedTasks.push(tasks[i]);
      }
    }
    return completedTasks;
  } else {
    // Return all tasks
    return tasks;
  }
}

/**
 * Creates a new task object
 * @param {string} description - The task description
 * @param {string} priority - The task priority
 * @param {string} date - The due date
 * @returns {Object} - The new task object
 */
function createTaskObject(description, priority, date) {
  return {
    id: Date.now(),
    description: description,
    priority: priority,
    date: date,
    completed: false
  };
}

/**
 * Finds a task by its ID
 * @param {number} taskId - The ID to search for
 * @returns {Object|null} - The found task or null
 */
function findTaskById(taskId) {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) {
      return tasks[i];
    }
  }
  return null;
}

/********************************************
 * STORAGE TASK — ADDED HERE
 ********************************************/

/** Check if localStorage is available */
function isLocalStorageAvailable() {
  try {
    var testKey = "__storage_test__";
    localStorage.setItem(testKey, "OK");
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

var storageEnabled = isLocalStorageAvailable();

/** Save tasks to localStorage */
function saveTasksToStorage() {
  if (storageEnabled) {
    localStorage.setItem("taskMasterTasks", JSON.stringify(tasks));
  }
}

/** Load tasks from localStorage */
function loadTasksFromStorage() {
  if (storageEnabled) {
    var savedTasks = localStorage.getItem("taskMasterTasks");
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    }
  }
}

/********************************************
 * Save tasks after every modification
 ********************************************/
function toggleTaskComplete(taskId) {
  var task = findTaskById(taskId);
  
  if (task) {
    task.completed = !task.completed;
    
    securityFeedback.logEvent('task-status-change', { 
      id: taskId, 
      completed: task.completed 
    });

    saveTasksToStorage();  // STORAGE
    renderTasks();
  }
}

function removeTask(taskId) {
  tasks = tasks.filter(t => t.id !== taskId);
  
  securityFeedback.logEvent('task-removed', { id: taskId });

  saveTasksToStorage();  // STORAGE
  renderTasks();
}

function handleClearCompleted() {
  var hasCompletedTasks = tasks.some(t => t.completed);
  
  if (!hasCompletedTasks) {
    alert('No completed tasks to clear');
    return;
  }
  
  if (!confirm('Are you sure you want to remove all completed tasks?')) {
    return;
  }
  
  var removed = tasks.filter(t => t.completed).map(t => t.id);
  var removedCount = removed.length;
  
  tasks = tasks.filter(t => !t.completed);
  
  securityFeedback.logEvent('tasks-cleared', { 
    count: removedCount,
    ids: removed
  });

  securityFeedback.showNotice('Removed ' + removedCount + ' completed tasks.');

  saveTasksToStorage();  // STORAGE
  renderTasks();
}
/********************************************
 * TASK 4: IMPLEMENT SECURITY FEEDBACK SYSTEM
 * (Integration with existing functions)
 ********************************************/
/**
 * Toggles a task's completion status
 * @param {number} taskId - The ID of the task to toggle
 */
function toggleTaskComplete(taskId) {
  // Find task by ID
  var task = findTaskById(taskId);
  
  if (task) {
    // Toggle completion status
    task.completed = !task.completed;
    
    // Log task toggle as security event
    securityFeedback.logEvent('task-status-change', { 
      id: taskId, 
      completed: task.completed 
    });
    
    saveTasksToStorage();  // STORAGE
    // Re-render tasks to update the UI
    renderTasks();
  }
}

/**
 * Removes a task
 * @param {number} taskId - The ID of the task to remove
 */
function removeTask(taskId) {
  // Find all tasks except the one to remove
  var newTasks = [];
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].id !== taskId) {
      newTasks.push(tasks[i]);
    }
  }
  
  // Update tasks array
  tasks = newTasks;
  
  // Log task removal as security event
  securityFeedback.logEvent('task-removed', { id: taskId });
  
  saveTasksToStorage();  // STORAGE
  // Re-render tasks to update the UI
  renderTasks();
}

/**
 * Clear all completed tasks
 */
function handleClearCompleted() {
  // Check if there are any completed tasks
  var hasCompletedTasks = false;
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].completed) {
      hasCompletedTasks = true;
      break;
    }
  }
  
  // If no completed tasks, alert the user and exit
  if (!hasCompletedTasks) {
    alert('No completed tasks to clear');
    return;
  }
  
  // Ask for confirmation
  if (!confirm('Are you sure you want to remove all completed tasks?')) {
    return;
  }
  
  // Filter out completed tasks
  var incompleteTasks = [];
  var removedCount = 0;
  var removedIds = [];
  
  for (var i = 0; i < tasks.length; i++) {
    if (!tasks[i].completed) {
      incompleteTasks.push(tasks[i]);
    } else {
      removedIds.push(tasks[i].id);
      removedCount++;
    }
  }
  
  // Update tasks array
  tasks = incompleteTasks;
  
  // Log batch removal as security event
  securityFeedback.logEvent('tasks-cleared', { 
    count: removedCount,
    ids: removedIds
  });
  
  // Show security notice
  securityFeedback.showNotice('Removed ' + removedCount + ' completed tasks.');
  
  saveTasksToStorage();  // STORAGE
  // Re-render tasks
  renderTasks();
}

/*******************************************
 * TASK 2: IMPLEMENT HTML CONTENT SANITIZATION
 * (Integration with task rendering)
 *******************************************/
/**
 * Renders a single task element
 * @param {Object} taskData - The task data object
 * @returns {HTMLElement} - The created task list item
 */
function renderTaskElement(taskData) {
  // Create the list item element
  var li = document.createElement('li');
  li.className = 'task-item';
  
  // Add data-id attribute to connect element with task data
  li.setAttribute('data-id', taskData.id);
  
  // Add the priority class
  li.classList.add('task-item-' + taskData.priority);
  
  // Add completed class if task is completed
  if (taskData.completed) {
    li.classList.add('task-completed');
  }
  
  // Create and add the checkbox with checked status
  var checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = taskData.completed;
  
  // Disable checkbox in read-only mode
  if (readOnlyMode) {
    checkbox.disabled = true;
  }
  
  li.appendChild(checkbox);
  
  // Create and add the content container
  var content = document.createElement('div');
  content.className = 'task-content';
  
  // Add task title with sanitized content
  var title = document.createElement('p');
  title.className = 'task-text';
  
  // Use sanitized content instead of raw content (Task 2)
  title.innerHTML = sanitizeHtml(taskData.description);
  
  // Check if the content was potentially risky (Visual indicator from Task 2)
  if (taskData.description.includes('<') || taskData.description.includes('>')) {
    // Add a warning icon
    var warningIcon = document.createElement('span');
    warningIcon.className = 'security-notice';
    warningIcon.title = 'This content contained special characters that were sanitized for security';
    warningIcon.textContent = ' ⚠️ ';
    title.appendChild(warningIcon);
  }
  
  content.appendChild(title);
  
  // Add task details
  var details = document.createElement('small');
  details.className = 'task-details';
  details.textContent = 'Priority: ' + taskData.priority + ' | Due: ' + taskData.date;
  content.appendChild(details);
  
  // Add content to the list item
  li.appendChild(content);
  
  // Add delete button
  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = 'Delete';
  
  // Disable delete button in read-only mode
  if (readOnlyMode) {
    deleteBtn.disabled = true;
  }
  
  li.appendChild(deleteBtn);
  
  return li;
}

/**
 * Renders all tasks based on current filter
 */
function renderTasks() {
  // Clear existing tasks from the DOM
  taskList.innerHTML = '';
  
  // Get filtered tasks
  var filteredTasks = getFilteredTasks();
  
  // Check if we have tasks to display
  if (filteredTasks.length === 0) {
    var emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-state';
    
    if (tasks.length === 0) {
      emptyMessage.textContent = 'No tasks yet. Add one above!';
    } else {
      emptyMessage.textContent = 'No ' + currentFilter + ' tasks found';
    }
    
    taskList.appendChild(emptyMessage);
  } else {
    // Render each task
    for (var i = 0; i < filteredTasks.length; i++) {
      var taskElement = renderTaskElement(filteredTasks[i]);
      taskList.appendChild(taskElement);
    }
  }
  
  // Update task count
  updateTaskCount();
}

/**
 * Handle task list interactions
 * @param {Event} e - The click event
 */
function handleTaskListClick(e) {
  // If in read-only mode, only allow viewing tasks
  if (readOnlyMode && (e.target.classList.contains('task-checkbox') || e.target.classList.contains('delete-btn'))) {
    securityFeedback.showNotice('Cannot modify tasks in read-only mode');
    return;
  }
  
  // Find closest task item
  var taskItem = e.target;
  while (taskItem && !taskItem.classList.contains('task-item')) {
    taskItem = taskItem.parentElement;
  }
  
  // Return if no task item found
  if (!taskItem) return;
  
  // Get task ID
  var taskId = parseInt(taskItem.getAttribute('data-id'));
  
  // Check what was clicked
  if (e.target.classList.contains('task-checkbox')) {
    // Checkbox clicked
    toggleTaskComplete(taskId);
  } else if (e.target.classList.contains('delete-btn')) {
    // Delete button clicked
    if (confirm('Are you sure you want to delete this task?')) {
      removeTask(taskId);
    }
  }
}

/**
 * Handle filter button clicks
 * @param {Event} e - The click event
 */
function handleFilterClick(e) {
  // Check if a filter button was clicked
  if (e.target.classList.contains('filter-btn')) {
    // Get the filter type from the data-filter attribute
    var filterType = e.target.getAttribute('data-filter');
    
    // Update the current filter
    currentFilter = filterType;
    
    // Update the active class on filter buttons
    for (var i = 0; i < filterButtons.length; i++) {
      filterButtons[i].classList.remove('active');
    }
    e.target.classList.add('active');
    
    // Log filter change as security event
    securityFeedback.logEvent('filter-changed', { filter: filterType });
    
    saveTasksToStorage();  // STORAGE
    // Re-render tasks with the new filter
    renderTasks();
  }
}

/*******************************************
 * TASK 1: IMPLEMENT ENHANCED INPUT VALIDATION
 * (Integration with form submission)
 *******************************************/
/**
 * Handle task form submission
 * @param {Event} e - The form submission event
 */
function handleFormSubmit(e) {
  e.preventDefault();
  
  // If in read-only mode, prevent form submission
  if (readOnlyMode) {
    securityFeedback.showNotice('Cannot add tasks in read-only mode');
    return;
  }
  
  // Get form data
  var description = taskInput.value;
  var priority = taskPriority.value;
  var date = taskDate.value;
  
  // Validate and sanitize description (Task 1)
  var validationResult = validateAndSanitizeDescription(description);
  if (!validationResult.isValid) {
    // Display validation error
    securityFeedback.showNotice(validationResult.error);
    taskInput.focus();
    return;
  }
  
  // Use the sanitized value
  var safeDescription = validationResult.value;
  
  // Create task with sanitized input
  var newTask = createTaskObject(safeDescription, priority, date);
  
  // Add to tasks array
  tasks.push(newTask);
  
  // Log task creation as security event
  securityFeedback.logEvent('task-created', { 
    id: newTask.id,
    hasSanitization: description !== safeDescription
  });
  
  saveTasksToStorage();  // STORAGE
  // Render and reset form
  renderTasks();
  taskForm.reset();
}

/**
 * Setup all event listeners for the application
 */
function setupEventListeners() {
  // Form submission
  taskForm.addEventListener('submit', handleFormSubmit);
  
  // Task list interactions (delegation for all task-related events)
  taskList.addEventListener('click', handleTaskListClick);
  
  // Navigation/filter events
  document.querySelector('nav').addEventListener('click', handleFilterClick);
  
  // Clear completed button
  document.getElementById('clear-completed-btn').addEventListener('click', handleClearCompleted);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  console.log('All event listeners initialized');
}

/**
 * Toggle read-only mode for the application
 */
function toggleReadOnlyMode() {
  // Toggle the state
  readOnlyMode = !readOnlyMode;
  
  // Update the UI based on the new state
  if (readOnlyMode) {
    // Disable form inputs
    taskInput.disabled = true;
    taskPriority.disabled = true;
    taskDate.disabled = true;
    document.querySelector('button[type="submit"]').disabled = true;
    
    // Show security notice
    securityFeedback.showNotice('Read-only mode enabled. You can view but not modify tasks.');
  } else {
    // Enable form inputs
    taskInput.disabled = false;
    taskPriority.disabled = false;
    taskDate.disabled = false;
    document.querySelector('button[type="submit"]').disabled = false;
    
    // Show security notice
    securityFeedback.showNotice('Read-only mode disabled. You can now modify tasks.');
  }
  
  saveTasksToStorage();  // STORAGE
  // Re-render tasks to update interactive elements
  renderTasks();
}

/**
 * Handle keyboard shortcuts
 * @param {Event} e - The keydown event
 */
function handleKeyboardShortcuts(e) {
  // If user is typing in an input field, don't trigger shortcuts
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    return;
  }
  
  // 'r' key toggles read-only mode
  if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
    toggleReadOnlyMode();
    e.preventDefault();
    console.log('Keyboard shortcut: Toggle read-only mode');
  }
}

/********************************************
 * INITIALIZATION WITH ALL SECURITY FEATURES
 ********************************************/
/**
 * Initialize the application
 */
function initApp() {
  console.log('Initializing Task Manager app');
  
  // Select form elements
  taskForm = document.getElementById('task-form');
  taskInput = document.getElementById('task-input');
  taskPriority = document.getElementById('task-priority');
  taskDate = document.getElementById('task-date');
  
  // Select task list elements
  taskList = document.getElementById('task-list');
  itemsLeft = document.getElementById('items-left');
  
  // Select all filter buttons
  filterButtons = document.querySelectorAll('.filter-btn');
  
  // Add security styles (Task 4)
  addSecurityStyles();

   // LOAD TASKS FROM STORAGE 
  loadTasksFromStorage();
  
  // Setup all event listeners
  setupEventListeners();
  
  // Test URL validation (Task 3)
  testUrlValidation();
  
  // Render tasks (will be empty initially)
  saveTasksToStorage();  // STORAGE
  renderTasks();
  
  // Update the document title
  updateDocumentTitle();
  
  // Show security notice after a short delay (Task 4)
  setTimeout(function() {
    securityFeedback.showNotice('Security features enabled for this application');
  }, 1000);
  
  console.log('Task Manager app initialized with security enhancements');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// hii how are you are oyu okay