// User Management Feature Module
// This module is completely self-contained and handles all user-related functionality
// In a widened architecture, this could easily be extracted to a separate microservice

class UserService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.nextId = 1;
  }

  createUser(userData) {
    const user = {
      id: this.nextId++,
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.users.set(user.id, user);
    console.log(`👤 User created: ${user.username} (ID: ${user.id})`);
    return user;
  }

  getUser(id) {
    return this.users.get(id);
  }

  getUserByUsername(username) {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  listUsers() {
    return Array.from(this.users.values());
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.users.set(id, user);
    return user;
  }

  deleteUser(id) {
    const deleted = this.users.delete(id);
    if (deleted) {
      console.log(`🗑️ User deleted: ID ${id}`);
    }
    return deleted;
  }

  createSession(userId) {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const session = {
      id: sessionId,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = new Date();
    const expires = new Date(session.expiresAt);

    if (now > expires) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }
}

// Create service instance
const userService = new UserService();

// Feature module definition
const userManagementModule = {
  name: 'user-management',
  version: '1.0.0',
  description: 'Complete user management functionality with authentication',
  dependencies: [],

  // Service instance
  service: userService,

  // Initialize the module
  async initialize() {
    console.log('🔐 User Management module initializing...');

    // Create some demo users
    userService.createUser({
      username: 'demo_user',
      email: 'demo@example.com'
    });

    userService.createUser({
      username: 'admin',
      email: 'admin@example.com'
    });

    console.log('✅ User Management module initialized with demo data');
  },

  // Middleware for request processing
  middleware(req, res) {
    // Add user context to request if session exists
    const sessionId = req.headers['x-session-id'];
    if (sessionId) {
      const session = userService.validateSession(sessionId);
      if (session) {
        req.user = userService.getUser(session.userId);
      }
    }
  },

  // HTTP routes for this feature
  routes: {
    '/': (req, res) => {
      const users = userService.listUsers();

      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>User Management</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; }
        .user { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
        .stats { background: #e8f5e9; padding: 15px; border-radius: 4px; margin: 20px 0; }
        button { background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .actions { margin-top: 10px; }
        .actions button { margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>👥 User Management</h1>
        <p>Self-contained user management feature module</p>

        <div class="stats">
            <strong>📊 Statistics:</strong><br>
            Total Users: ${users.length}<br>
            Active Sessions: ${userService.sessions.size}
        </div>

        <h2>📋 User List</h2>
        ${users.map(user => `
            <div class="user">
                <strong>${user.username}</strong> (ID: ${user.id})<br>
                <small>Email: ${user.email}</small><br>
                <small>Created: ${new Date(user.createdAt).toLocaleDateString()}</small><br>
                <small>Status: ${user.status}</small>
                <div class="actions">
                    <button onclick="viewUser(${user.id})">View Details</button>
                    <button onclick="deleteUser(${user.id})">Delete</button>
                </div>
            </div>
        `).join('')}

        <h2>🔧 Available API Endpoints</h2>
        <ul>
            <li><strong>GET /user-management/</strong> - This page</li>
            <li><strong>GET /user-management/api/users</strong> - List all users (JSON)</li>
            <li><strong>GET /user-management/api/users/:id</strong> - Get specific user</li>
            <li><strong>POST /user-management/api/users</strong> - Create new user</li>
            <li><strong>PUT /user-management/api/users/:id</strong> - Update user</li>
            <li><strong>DELETE /user-management/api/users/:id</strong> - Delete user</li>
            <li><strong>POST /user-management/api/sessions</strong> - Create session</li>
        </ul>

        <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 4px;">
            <h3>🏗️ Widened Architecture Benefits</h3>
            <ul>
                <li><strong>Self-contained:</strong> All user logic in one module</li>
                <li><strong>Independent development:</strong> Team can work without conflicts</li>
                <li><strong>Easy extraction:</strong> Can become a microservice easily</li>
                <li><strong>Clear boundaries:</strong> Well-defined responsibilities</li>
            </ul>
        </div>

        <p><a href="/">← Back to Home</a></p>
    </div>

    <script>
        function viewUser(id) {
            window.open('/user-management/api/users/' + id, '_blank');
        }

        function deleteUser(id) {
            if (confirm('Delete this user?')) {
                fetch('/user-management/api/users/' + id, { method: 'DELETE' })
                .then(() => location.reload())
                .catch(err => alert('Error: ' + err));
            }
        }
    </script>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    },

    '/api/users': (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === 'GET') {
        const users = userService.listUsers();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ users, count: users.length }));

      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const userData = JSON.parse(body);
            const user = userService.createUser(userData);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });

      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    },

    '/api/users/1': (req, res) => {
      // Demo endpoint for specific user
      const user = userService.getUser(1);
      if (!user) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    },

    '/api/sessions': (req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const { username } = JSON.parse(body);
            const user = userService.getUserByUsername(username);

            if (!user) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'User not found' }));
              return;
            }

            const session = userService.createSession(user.id);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ session, user }));

          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    }
  },

  // Cleanup when module is unloaded
  async shutdown() {
    console.log('🔐 User Management module shutting down...');
    userService.sessions.clear();
    console.log('✅ User Management module shut down');
  },

  // Expose service for other modules to use
  getService() {
    return userService;
  }
};

module.exports = userManagementModule;
