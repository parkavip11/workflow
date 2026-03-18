const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;

// Get all workflows
app.get('/api/workflows', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM workflows');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});

// Create a new workflow
app.post('/api/workflows', async (req, res) => {
    const { name, description, trigger_type } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO workflows (name, description, trigger_type) VALUES (?, ?, ?)',
            [name, description, trigger_type]
        );
        res.status(201).json({ id: result.insertId, name, description, trigger_type });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});

// Get tasks for a workflow
app.get('/api/workflows/:id/tasks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tasks WHERE workflow_id = ? ORDER BY step_order', [req.params.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Create a task for a workflow
app.post('/api/workflows/:id/tasks', async (req, res) => {
    const { task_type, config, step_order } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO tasks (workflow_id, task_type, config, step_order) VALUES (?, ?, ?, ?)',
            [req.params.id, task_type, JSON.stringify(config), step_order]
        );
        res.status(201).json({ id: result.insertId, workflow_id: req.params.id, task_type, config, step_order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Delete a workflow
app.delete('/api/workflows/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM workflows WHERE id = ?', [req.params.id]);
        res.json({ message: 'Workflow deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

// Execute a workflow (Mock implementation)
app.post('/api/workflows/:id/execute', async (req, res) => {
    const workflowId = req.params.id;
    try {
        // Log start
        const [logResult] = await db.query(
            'INSERT INTO execution_logs (workflow_id, status, details) VALUES (?, ?, ?)',
            [workflowId, 'RUNNING', 'Execution started']
        );
        const logId = logResult.insertId;

        // Fetch tasks
        const [tasks] = await db.query('SELECT * FROM tasks WHERE workflow_id = ? ORDER BY step_order', [workflowId]);

        let success = true;
        let details = `Executed ${tasks.length} tasks.\n`;

        for (const task of tasks) {
            // Simulate task execution
            details += `[${new Date().toISOString()}] Executing task: ${task.task_type}\n`;
            // Normally you would have actual logic here based on task.task_type
            await new Promise(resolve => setTimeout(resolve, 500)); // mock delay
        }

        // Update log
        await db.query(
            'UPDATE execution_logs SET status = ?, details = ? WHERE id = ?',
            ['SUCCESS', details, logId]
        );

        res.json({ message: 'Workflow executed successfully', details });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Workflow execution failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
