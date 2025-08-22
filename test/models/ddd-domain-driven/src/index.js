// Demo application showing DDD concepts
const InMemoryUserRepository = require('./infrastructure/repositories/InMemoryUserRepository');
const SimpleEventBus = require('./infrastructure/events/SimpleEventBus');
const UserApplicationService = require('./application/services/UserApplicationService');

async function demonstrateDDD() {
  console.log('=== Domain Driven Design Demo ===\n');

  // Setup infrastructure
  const userRepository = new InMemoryUserRepository();
  const eventBus = new SimpleEventBus();

  // Setup event handlers
  eventBus.subscribe('UserCreated', (event) => {
    console.log(`📧 Sending welcome email to user ${event.data.email}`);
  });

  eventBus.subscribe('EmailChanged', (event) => {
    console.log(`📧 Email change notification: ${event.data.oldEmail} -> ${event.data.newEmail}`);
  });

  // Setup application service
  const userService = new UserApplicationService(userRepository, eventBus);

  try {
    // Create a user
    console.log('1. Creating a user...');
    const user = await userService.createUser({
      email: 'john@example.com',
      name: 'John Doe',
      age: 25
    });
    console.log(`✅ User created: ${user.name} (${user.email})\n`);

    // Update user profile
    console.log('2. Updating user profile...');
    await userService.updateUserProfile(user.id, {
      name: 'John Smith',
      age: 26
    });
    console.log('✅ Profile updated\n');

    // Change email
    console.log('3. Changing user email...');
    await userService.changeUserEmail(user.id, 'johnsmith@example.com');
    console.log('✅ Email changed\n');

    // Try to create user with existing email (should fail)
    console.log('4. Trying to create user with existing email...');
    try {
      await userService.createUser({
        email: 'johnsmith@example.com',
        name: 'Another John',
        age: 30
      });
    } catch (error) {
      console.log(`❌ Expected error: ${error.message}\n`);
    }

    // Retrieve user
    console.log('5. Retrieving user...');
    const retrievedUser = await userService.getUserById(user.id);
    console.log(`✅ Retrieved user: ${retrievedUser.name} (${retrievedUser.email})`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the demo
demonstrateDDD().catch(console.error);
