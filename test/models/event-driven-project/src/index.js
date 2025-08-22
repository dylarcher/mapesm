// Event-Driven Architecture Demo
const EventBus = require('./core/EventBus');
const CommandHandler = require('./core/CommandHandler');
const QueryHandler = require('./core/QueryHandler');
const UserService = require('./services/UserService');

async function demonstrateEventDrivenArchitecture() {
  console.log('=== Event-Driven Architecture Demo ===\n');

  // Initialize core components
  const eventBus = new EventBus();
  const commandHandler = new CommandHandler(eventBus);
  const queryHandler = new QueryHandler();

  // Initialize services
  const userService = new UserService(eventBus, commandHandler, queryHandler);

  // Set up additional event handlers for demonstration
  eventBus.subscribe('UserCreated', (event) => {
    console.log(`🎉 Welcome email sent to ${event.data.name} (${event.data.email})`);
  });

  eventBus.subscribe('UserActivated', (event) => {
    console.log(`✅ User ${event.data.userId} has been activated`);
  });

  eventBus.subscribe('CommandExecuted', (event) => {
    console.log(`⚡ Command '${event.data.commandName}' executed successfully`);
  });

  try {
    console.log('1. Creating users...');
    const user1 = await commandHandler.execute('CreateUser', {
      name: 'John Doe',
      email: 'john@example.com'
    });

    const user2 = await commandHandler.execute('CreateUser', {
      name: 'Jane Smith',
      email: 'jane@example.com'
    });

    console.log('\n2. Querying users...');
    const allUsers = await queryHandler.execute('GetAllUsers');
    console.log('📊 All users:', allUsers.map(u => `${u.name} (${u.email})`));

    console.log('\n3. Updating user profile...');
    await commandHandler.execute('UpdateUserProfile', {
      userId: user1.userId,
      name: 'John Smith',
      email: 'johnsmith@example.com'
    });

    console.log('\n4. Getting user stats...');
    const stats = await queryHandler.execute('GetUserStats');
    console.log('📈 User statistics:', stats);

    console.log('\n5. Event history...');
    const eventHistory = eventBus.getEventHistory();
    console.log(`📚 Total events in store: ${eventHistory.length}`);

    const userEvents = eventBus.getEventHistory('UserCreated');
    console.log(`👤 User creation events: ${userEvents.length}`);

    console.log('\n6. Event replay demonstration...');
    const replayFromTime = new Date(Date.now() - 60000); // 1 minute ago
    eventBus.replay(replayFromTime);

    console.log('\n7. Read model data...');
    const readModel = queryHandler.getReadModel('UserList');
    console.log('📊 Read model contains:', readModel.length, 'user records');

  } catch (error) {
    console.error('❌ Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateEventDrivenArchitecture().catch(console.error);
