# Workflow Automation System

A full-stack workflow automation platform to create, manage, and execute automated tasks.

## Features
- Create workflows with specific triggers (schedule, webhook, user signup).
- Add multiple sequential tasks to each workflow.
- Simulate and execute workflow tasks.
- View workflow execution logs and details.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MySQL

## Setup Instructions

### 1. Database Setup
1. Open MySQL/phpMyAdmin.
2. Execute the `backend/schema.sql` file to create the database (`workflow_automation`) and required tables.

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on your database credentials. For example:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=workflow_automation
   PORT=3000
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend Setup
Simply open `frontend/index.html` in your web browser. All frontend static files will also be served locally by the backend server at `http://localhost:3000/`.

## License
MIT
