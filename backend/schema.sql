CREATE DATABASE IF NOT EXISTS workflow_automation;
USE workflow_automation;

CREATE TABLE IF NOT EXISTS workflows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    task_type VARCHAR(100) NOT NULL,
    config JSON,
    step_order INT NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS execution_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workflow_id INT NOT NULL,
    status ENUM('PENDING', 'RUNNING', 'SUCCESS', 'FAILED') NOT NULL,
    details TEXT,
    execution_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Insert dummy data for demonstration
INSERT INTO workflows (name, description, trigger_type) VALUES 
('Welcome Email Flow', 'Sends welcome email on user signup', 'user_signup'),
('Daily Backup', 'Triggers database backup every day', 'schedule');

INSERT INTO tasks (workflow_id, task_type, config, step_order) VALUES 
(1, 'send_email', '{"to": "user@example.com", "subject": "Welcome!"}', 1),
(2, 'run_script', '{"script": "backup.sh"}', 1);
