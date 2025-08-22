// Simple Task Management Application
// Small project with minimal structure - everything in a few files

const fs = require('fs');
const path = require('path');

// Simple data store (file-based for small projects)
const DATA_FILE = path.join(__dirname, 'tasks.json');

class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
  }

  loadTasks() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('⚠️ Could not load tasks, starting with empty list');
    }
    return [];
  }

  saveTasks() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.tasks, null, 2));
      return true;
    } catch (error) {
      console.error('❌ Error saving tasks:', error.message);
      return false;
    }
  }

  addTask(title, description = '') {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title is required');
    }

    const task = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tasks.push(task);

    if (this.saveTasks()) {
      console.log(`✅ Task added: "${task.title}"`);
      return task;
    } else {
      // Remove from memory if save failed
      this.tasks.pop();
      throw new Error('Failed to save task');
    }
  }

  getTasks(filter = 'all') {
    switch (filter) {
      case 'completed':
        return this.tasks.filter(task => task.completed);
      case 'pending':
        return this.tasks.filter(task => !task.completed);
      case 'all':
      default:
        return [...this.tasks];
    }
  }

  getTask(id) {
    return this.tasks.find(task => task.id === id);
  }

  updateTask(id, updates) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const task = this.tasks[taskIndex];

    // Only allow updating specific fields
    const allowedFields = ['title', 'description', 'completed'];
    const validUpdates = {};

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        validUpdates[field] = updates[field];
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update task
    Object.assign(task, validUpdates, {
      updatedAt: new Date().toISOString()
    });

    if (this.saveTasks()) {
      console.log(`✅ Task updated: "${task.title}"`);
      return task;
    } else {
      throw new Error('Failed to save task');
    }
  }

  deleteTask(id) {
    const taskIndex = this.tasks.findIndex(task => task.id === id);

    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const task = this.tasks[taskIndex];
    this.tasks.splice(taskIndex, 1);

    if (this.saveTasks()) {
      console.log(`🗑️ Task deleted: "${task.title}"`);
      return true;
    } else {
      // Restore task if save failed
      this.tasks.splice(taskIndex, 0, task);
      throw new Error('Failed to delete task');
    }
  }

  markCompleted(id) {
    return this.updateTask(id, { completed: true });
  }

  markPending(id) {
    return this.updateTask(id, { completed: false });
  }

  getStats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(task => task.completed).length;
    const pending = total - completed;

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0
    };
  }

  clearAll() {
    this.tasks = [];

    if (this.saveTasks()) {
      console.log('🧹 All tasks cleared');
      return true;
    } else {
      throw new Error('Failed to clear tasks');
    }
  }

  searchTasks(query) {
    const searchTerm = query.toLowerCase();

    return this.tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm) ||
      task.description.toLowerCase().includes(searchTerm)
    );
  }
}

// Simple CLI interface for the task manager
class TaskCLI {
  constructor() {
    this.taskManager = new TaskManager();
  }

  run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      switch (command) {
        case 'add':
          this.addTask(args[1], args[2]);
          break;
        case 'list':
          this.listTasks(args[1]);
          break;
        case 'complete':
          this.completeTask(args[1]);
          break;
        case 'delete':
          this.deleteTask(args[1]);
          break;
        case 'stats':
          this.showStats();
          break;
        case 'search':
          this.searchTasks(args[1]);
          break;
        case 'clear':
          this.clearAll();
          break;
        case 'demo':
          this.runDemo();
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  }

  addTask(title, description) {
    if (!title) {
      console.error('❌ Please provide a task title');
      console.log('Usage: node index.js add "Task title" "Optional description"');
      return;
    }

    const task = this.taskManager.addTask(title, description || '');
    console.log(`📝 Created task: ${task.id}`);
  }

  listTasks(filter = 'all') {
    const tasks = this.taskManager.getTasks(filter);

    console.log(`\n📋 Tasks (${filter}):`);
    console.log('='.repeat(50));

    if (tasks.length === 0) {
      console.log('No tasks found');
      return;
    }

    tasks.forEach(task => {
      const status = task.completed ? '✅' : '⏳';
      console.log(`${status} [${task.id}] ${task.title}`);

      if (task.description) {
        console.log(`   Description: ${task.description}`);
      }

      console.log(`   Created: ${new Date(task.createdAt).toLocaleDateString()}`);
      console.log('');
    });
  }

  completeTask(id) {
    if (!id) {
      console.error('❌ Please provide a task ID');
      return;
    }

    this.taskManager.markCompleted(id);
  }

  deleteTask(id) {
    if (!id) {
      console.error('❌ Please provide a task ID');
      return;
    }

    this.taskManager.deleteTask(id);
  }

  showStats() {
    const stats = this.taskManager.getStats();

    console.log('\n📊 Task Statistics:');
    console.log('='.repeat(30));
    console.log(`Total Tasks: ${stats.total}`);
    console.log(`Completed: ${stats.completed}`);
    console.log(`Pending: ${stats.pending}`);
    console.log(`Completion Rate: ${stats.completionRate}%`);
  }

  searchTasks(query) {
    if (!query) {
      console.error('❌ Please provide a search query');
      return;
    }

    const results = this.taskManager.searchTasks(query);

    console.log(`\n🔍 Search Results for "${query}":`);
    console.log('='.repeat(40));

    if (results.length === 0) {
      console.log('No tasks found');
      return;
    }

    results.forEach(task => {
      const status = task.completed ? '✅' : '⏳';
      console.log(`${status} [${task.id}] ${task.title}`);
      if (task.description) {
        console.log(`   ${task.description}`);
      }
      console.log('');
    });
  }

  clearAll() {
    console.log('⚠️ This will delete all tasks. Are you sure?');
    // In a real CLI, you'd prompt for confirmation
    console.log('Proceeding with demo clear...');
    this.taskManager.clearAll();
  }

  runDemo() {
    console.log('=== Small Project Demo - Task Manager ===\n');
    console.log('This demonstrates a simple, single-file application');
    console.log('suitable for small projects or prototypes.\n');

    try {
      // Clear existing tasks for clean demo
      this.taskManager.clearAll();

      console.log('1. Adding sample tasks...');
      this.taskManager.addTask('Learn JavaScript', 'Study ES6+ features and async programming');
      this.taskManager.addTask('Build a small project', 'Create a simple CLI application');
      this.taskManager.addTask('Write documentation', 'Document the code and usage examples');
      this.taskManager.addTask('Code review', 'Review code with team members');

      console.log('\n2. Listing all tasks:');
      this.listTasks('all');

      console.log('3. Completing a task...');
      const allTasks = this.taskManager.getTasks();
      if (allTasks.length > 0) {
        this.taskManager.markCompleted(allTasks[0].id);
      }

      console.log('\n4. Listing pending tasks:');
      this.listTasks('pending');

      console.log('\n5. Searching tasks:');
      this.searchTasks('project');

      console.log('\n6. Task statistics:');
      this.showStats();

      console.log('\n7. Updating a task...');
      if (allTasks.length > 1) {
        this.taskManager.updateTask(allTasks[1].id, {
          description: 'Updated: Create a CLI task management application with file storage'
        });
        console.log('Task description updated');
      }

      console.log('\n✅ Demo completed successfully!\n');
      console.log('This small project demonstrates:');
      console.log('- Simple, readable code structure');
      console.log('- File-based data persistence');
      console.log('- Basic error handling');
      console.log('- Command-line interface');
      console.log('- All functionality in a single file');
      console.log('- Perfect for quick prototypes or learning');

    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }

  showHelp() {
    console.log('\n📖 Task Manager - Small Project Demo');
    console.log('='.repeat(40));
    console.log('Usage: node index.js <command> [arguments]');
    console.log('\nCommands:');
    console.log('  add <title> [description]  - Add a new task');
    console.log('  list [filter]              - List tasks (all|pending|completed)');
    console.log('  complete <id>              - Mark task as completed');
    console.log('  delete <id>                - Delete a task');
    console.log('  stats                      - Show task statistics');
    console.log('  search <query>             - Search tasks');
    console.log('  clear                      - Delete all tasks');
    console.log('  demo                       - Run interactive demo');
    console.log('\nExamples:');
    console.log('  node index.js demo');
    console.log('  node index.js add "Buy groceries" "Milk, bread, eggs"');
    console.log('  node index.js list pending');
    console.log('  node index.js search "grocery"');
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new TaskCLI();
  cli.run();
}

// Export for potential use as a module
module.exports = { TaskManager, TaskCLI };
