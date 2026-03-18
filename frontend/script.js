const API_BASE_URL = 'http://localhost:3000/api';
let currentWorkflowId = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Tabs functionality
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-tab');

            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            tabContents.forEach(content => {
                if(content.id === targetId) {
                    content.classList.add('active');
                    // Hide workflow details if switching away
                    if(targetId !== 'workflow-details') {
                        document.getElementById('workflow-details').classList.remove('active');
                        currentWorkflowId = null;
                    }
                    if(targetId === 'workflows-list') {
                        fetchWorkflows();
                    }
                } else {
                    if (content.id !== 'workflow-details' || targetId !== 'workflow-details') {
                         content.classList.remove('active');
                    }
                }
            });
            
            // hide execution results
            document.getElementById('execution-results').classList.add('hidden');
        });
    });

    // Initial load
    fetchWorkflows();

    // Event Listeners for Forms
    document.getElementById('workflow-form').addEventListener('submit', handleCreateWorkflow);
    document.getElementById('task-form').addEventListener('submit', handleCreateTask);
    
    // Action Buttons
    document.getElementById('btn-execute-wf').addEventListener('click', handleExecuteWorkflow);
    document.getElementById('btn-delete-wf').addEventListener('click', handleDeleteWorkflow);
});

// Notifications
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const msgElement = document.getElementById('toast-message');
    msgElement.textContent = message;
    
    // Optional: Add specific colors based on type
    if(type === 'success') {
        toast.style.backgroundColor = '#10b981';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#ef4444';
    } else {
        toast.style.backgroundColor = '#333';
    }

    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Fetch Workflows from API
async function fetchWorkflows() {
    const grid = document.getElementById('workflows-grid');
    grid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading workflows...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/workflows`);
        if (!response.ok) throw new Error('Network response was not ok');
        const workflows = await response.json();
        
        grid.innerHTML = '';
        
        if(workflows.length === 0) {
            grid.innerHTML = '<p class="text-secondary">No workflows found. Create one to get started.</p>';
            return;
        }

        workflows.forEach(workflow => {
            const card = document.createElement('div');
            card.className = 'card workflow-card';
            card.innerHTML = `
                <h3>${workflow.name}</h3>
                <span class="badge">${workflow.trigger_type}</span>
                <p>${workflow.description || 'No description provided.'}</p>
            `;
            card.addEventListener('click', () => showWorkflowDetails(workflow));
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching workflows:', error);
        grid.innerHTML = '<p class="text-danger">Failed to load workflows.</p>';
        showToast('Failed to load workflows', 'error');
    }
}

// Create new workflow
async function handleCreateWorkflow(e) {
    e.preventDefault();
    
    const name = document.getElementById('wf-name').value;
    const description = document.getElementById('wf-desc').value;
    const trigger_type = document.getElementById('wf-trigger').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/workflows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, trigger_type })
        });
        
        if (!response.ok) throw new Error('Failed to create workflow');
        
        document.getElementById('workflow-form').reset();
        showToast('Workflow created successfully!', 'success');
        
        // Switch back to list view
        document.querySelector('[data-tab="workflows-list"]').click();
    } catch (error) {
        console.error('Error creating workflow:', error);
        showToast('Error creating workflow', 'error');
    }
}

// Show specific workflow details
async function showWorkflowDetails(workflow) {
    currentWorkflowId = workflow.id;
    
    // Update UI elements
    document.getElementById('detail-wf-name').textContent = workflow.name;
    document.getElementById('detail-wf-trigger').textContent = workflow.trigger_type;
    document.getElementById('detail-wf-desc').textContent = workflow.description || 'No description';
    
    // Hide active tabs and show details
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('workflow-details').classList.add('active');
    
    // Fetch and display tasks for this workflow
    fetchTasks(workflow.id);
}

// Fetch tasks for a workflow
async function fetchTasks(workflowId) {
    const list = document.getElementById('tasks-list');
    list.innerHTML = 'Loading tasks...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}/tasks`);
        const tasks = await response.json();
        
        list.innerHTML = '';
        
        if(tasks.length === 0) {
            list.innerHTML = '<p>No tasks added yet.</p>';
            return;
        }

        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            
            let configDisplay = '';
            try {
                // If config is stringified JSON, parse it to display properly
                const parsedConfig = typeof task.config === 'string' ? JSON.parse(task.config) : task.config;
                configDisplay = JSON.stringify(parsedConfig);
            } catch(e) {
                configDisplay = task.config;
            }

            item.innerHTML = `
                <div class="task-info">
                    <h4>${task.task_type.replace('_', ' ').toUpperCase()}</h4>
                    <p>${configDisplay}</p>
                </div>
                <div class="task-order">${task.step_order}</div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        list.innerHTML = '<p>Error loading tasks.</p>';
    }
}

// Create a new task
async function handleCreateTask(e) {
    e.preventDefault();
    
    if(!currentWorkflowId) return;

    const task_type = document.getElementById('task-type').value;
    const configString = document.getElementById('task-config').value;
    const step_order = parseInt(document.getElementById('task-order').value, 10);
    
    let config;
    try {
        config = JSON.parse(configString);
    } catch(err) {
        alert("Invalid JSON format for config. Please ensure it is valid JSON (e.g. {\"key\":\"value\"})");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/workflows/${currentWorkflowId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_type, config, step_order })
        });
        
        if (!response.ok) throw new Error('Failed to add task');
        
        document.getElementById('task-form').reset();
        document.getElementById('task-config').value = "{}"; // Reset to default
        showToast('Task added successfully', 'success');
        
        // Refresh tasks list
        fetchTasks(currentWorkflowId);
    } catch (error) {
        console.error('Error adding task:', error);
        showToast('Error adding task', 'error');
    }
}

// Execute Workflow
async function handleExecuteWorkflow() {
    if(!currentWorkflowId) return;
    
    const btn = document.getElementById('btn-execute-wf');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
    btn.disabled = true;

    const resultsArea = document.getElementById('execution-results');
    const logArea = document.getElementById('execution-log');
    
    resultsArea.classList.remove('hidden');
    logArea.textContent = 'Starting execution...';

    try {
        const response = await fetch(`${API_BASE_URL}/workflows/${currentWorkflowId}/execute`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error || 'Execution failed');
        
        logArea.textContent = data.details || 'Execution simulated successfully.';
        showToast('Workflow executed', 'success');
    } catch (error) {
        console.error('Execution error:', error);
        logArea.textContent = `Error: ${error.message}`;
        showToast('Execution failed', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Delete Workflow
async function handleDeleteWorkflow() {
    if(!currentWorkflowId) return;
    
    if(!confirm('Are you sure you want to delete this workflow and all its tasks? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/workflows/${currentWorkflowId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Workflow deleted', 'success');
        document.querySelector('[data-tab="workflows-list"]').click(); // Go back to list
    } catch (error) {
        console.error('Error deleting workflow:', error);
        showToast('Error deleting workflow', 'error');
    }
}
