const API_URL = 'https://todo-app-backend-three-psi.vercel.app';
const FRONTEND_URL = 'https://todo-frontend-self-120125.vercel.app';

let tasks = [];
let isAscendingSort = true;

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const deadlineInput = document.getElementById('deadlineInput');
    
    if (taskInput.value.trim() === '') return;

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                text: taskInput.value,
                deadline: deadlineInput.value || null,
                completed: false,
                subtasks: []
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create task');
        }

        taskInput.value = '';
        deadlineInput.value = '';
        await loadTasks();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Failed to create task. Please try again.');
    }
}

async function addSubtask(taskId) {
    const subtaskText = prompt('Enter subtask:');
    if (!subtaskText) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ text: subtaskText })
        });

        if (!response.ok) throw new Error('Failed to add subtask');
        await loadTasks();
    } catch (error) {
        alert('Failed to add subtask. Please try again.');
    }
}

async function toggleTask(taskId) {
    try {
        const task = tasks.find(t => t._id === taskId);
        if (!task) return;

        const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to update task');
        await loadTasks();
    } catch (error) {
        alert('Failed to update task. Please try again.');
    }
}

async function toggleSubtask(taskId, subtaskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to update subtask');
        await loadTasks();
    } catch (error) {
        alert('Failed to update subtask. Please try again.');
    }
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete task');
        await loadTasks();
    } catch (error) {
        alert('Failed to delete task. Please try again.');
    }
}

function sortByDeadline() {
    isAscendingSort = !isAscendingSort;
    tasks.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const comparison = new Date(a.deadline) - new Date(b.deadline);
        return isAscendingSort ? comparison : -comparison;
    });
    
    const sortButton = document.querySelector('.sort-container button');
    sortButton.innerHTML = `Sort by Deadline ${isAscendingSort ? '↑' : '↓'}`;
    
    renderTasks();
}

function getDeadlineStatus(deadline) {
    if (!deadline) return '';
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'urgent';
    if (diffDays <= 3) return 'upcoming';
    return '';
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = document.createElement('li');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;

        const formattedDeadline = task.deadline ? 
            new Date(task.deadline).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'No deadline';

        const taskContent = `
            <div class="task-main">
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} 
                        onclick="toggleTask('${task._id}')">
                    <span>${task.text}</span>
                </div>
                <div class="task-info">
                    <span class="deadline">${task.deadline ? `Due: ${formattedDeadline}` : 'No deadline'}</span>
                    <button onclick="addSubtask('${task._id}')">Add Subtask</button>
                    <button onclick="deleteTask('${task._id}')">Delete</button>
                </div>
            </div>
        `;

        taskElement.innerHTML = taskContent;

        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksList = document.createElement('ul');
            subtasksList.className = 'subtasks';

            task.subtasks.forEach(subtask => {
                const subtaskElement = document.createElement('li');
                subtaskElement.className = subtask.completed ? 'completed' : '';
                subtaskElement.innerHTML = `
                    <div class="task-content">
                        <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                            onclick="toggleSubtask('${task._id}', '${subtask._id}')">
                        <span>${subtask.text}</span>
                    </div>
                `;
                subtasksList.appendChild(subtaskElement);
            });

            taskElement.appendChild(subtasksList);
        }

        taskList.appendChild(taskElement);
    });
}

// Check auth status
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const expires = new Date(localStorage.getItem('authExpires'));
    
    console.log('Current token:', token); // Debug log
    
    if (!token || expires < new Date()) {
        console.log('Auth check failed, redirecting to login');
        window.location.href = `${FRONTEND_URL}/login.html`;
        return false;
    }
    return true;
}

// Call on page load
checkAuth();

// Update task functions to use API
async function loadTasks() {
    if (!checkAuth()) return;

    try {
        const token = localStorage.getItem('authToken');
        console.log('Loading tasks with token:', token); // Debug log

        const response = await fetch(`${API_URL}/tasks`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            if (response.status === 401) {
                // If unauthorized, redirect to login
                window.location.href = '/login.html';
                return;
            }
            throw new Error(errorData.error || 'Failed to load tasks');
        }
        
        tasks = await response.json();
        console.log('Loaded tasks:', tasks);
        renderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        alert('Failed to load tasks. Please try again.');
    }
}

// Call on page load
loadTasks();

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authExpires');
    window.location.href = `${FRONTEND_URL}/login.html`;
} 