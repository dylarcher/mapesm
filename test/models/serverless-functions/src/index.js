// Serverless Functions Architecture Demo
const ServerlessSimulator = require('./simulator');

async function demonstrateServerlessArchitecture() {
  console.log('=== Serverless Functions Architecture Demo ===\n');
  console.log('This demo shows how applications can be built using');
  console.log('small, independent, event-driven functions.\n');

  const simulator = new ServerlessSimulator();

  try {
    console.log('1. Available Functions\n');
    const functions = simulator.listFunctions();
    console.log('📋 Registered Functions:');
    functions.forEach(func => {
      console.log(`   - ${func.name} (${func.trigger})`);
      if (func.method && func.path) {
        console.log(`     ${func.method} ${func.path}`);
      }
      if (func.eventType) {
        console.log(`     Event: ${func.eventType}`);
      }
      console.log(`     Memory: ${func.memory}MB, Timeout: ${func.timeout}ms`);
    });

    console.log('\n2. HTTP-triggered Functions\n');

    // Create a user
    console.log('--- Creating a user via HTTP ---');
    await simulator.simulateHttpRequest('POST', '/users', {
      name: 'Alice Johnson',
      email: 'alice@example.com'
    });

    // List users
    console.log('\n--- Listing users via HTTP ---');
    await simulator.simulateHttpRequest('GET', '/users', null, {
      page: '1',
      limit: '5'
    });

    // Get specific user
    console.log('\n--- Getting user by ID via HTTP ---');
    await simulator.simulateHttpRequest('GET', '/users/1');

    // Update user
    console.log('\n--- Updating user via HTTP ---');
    await simulator.simulateHttpRequest('PUT', '/users/1', {
      name: 'John Smith',
      email: 'johnsmith@example.com'
    });

    console.log('\n3. Event-driven Functions\n');

    // Trigger user created event
    console.log('--- Simulating user created event ---');
    await simulator.simulateEvent('user.created', {
      id: '3',
      name: 'Bob Wilson',
      email: 'bob@example.com'
    });

    // Simulate file upload processing
    console.log('\n--- Simulating file upload processing ---');
    await simulator.simulateFileUpload('data/users.csv', 2048);

    console.log('\n4. Scheduled Functions\n');

    // Trigger scheduled cleanup
    console.log('--- Running scheduled cleanup ---');
    await simulator.simulateScheduledFunction('scheduledCleanup');

    console.log('\n5. Analytics Function\n');

    // Get analytics
    console.log('--- Getting system analytics ---');
    await simulator.simulateHttpRequest('GET', '/analytics');

    console.log('\n6. Error Handling\n');

    // Try to get non-existent user
    console.log('--- Testing error handling (non-existent user) ---');
    await simulator.simulateHttpRequest('GET', '/users/999');

    // Try to create user with invalid data
    console.log('\n--- Testing validation error ---');
    await simulator.simulateHttpRequest('POST', '/users', {
      name: '', // Invalid data
      email: 'invalid-email'
    });

    console.log('\n7. Function Metrics\n');
    const metrics = simulator.getMetrics();
    console.log('📊 Execution Metrics:');
    console.log(`   - Total Invocations: ${metrics.invocations}`);
    console.log(`   - Cold Starts: ${metrics.coldStarts}`);
    console.log(`   - Average Execution Time: ${metrics.averageExecutionTime}ms`);
    console.log(`   - Total Execution Time: ${metrics.totalExecutionTime}ms`);
    console.log(`   - Errors: ${metrics.errors}`);
    console.log(`   - Error Rate: ${metrics.errorRate}`);

    console.log('\n8. Concurrent Function Execution\n');

    console.log('--- Simulating concurrent requests ---');
    const concurrentPromises = [];

    // Simulate multiple concurrent requests
    for (let i = 0; i < 5; i++) {
      concurrentPromises.push(
        simulator.simulateHttpRequest('GET', '/users', null, {
          page: (i + 1).toString()
        })
      );
    }

    await Promise.all(concurrentPromises);
    console.log('✅ All concurrent requests completed');

    console.log('\n9. Function Scaling Simulation\n');

    console.log('--- Simulating high load ---');
    const startTime = Date.now();

    const loadTestPromises = [];
    for (let i = 0; i < 10; i++) {
      loadTestPromises.push(
        simulator.simulateHttpRequest('GET', '/analytics')
      );
    }

    await Promise.all(loadTestPromises);
    const loadTestDuration = Date.now() - startTime;

    console.log(`✅ Processed 10 concurrent requests in ${loadTestDuration}ms`);

    // Final metrics
    const finalMetrics = simulator.getMetrics();
    console.log('\n📊 Final Metrics:');
    console.log(`   - Total Invocations: ${finalMetrics.invocations}`);
    console.log(`   - Cold Starts: ${finalMetrics.coldStarts} (${((finalMetrics.coldStarts / finalMetrics.invocations) * 100).toFixed(1)}%)`);
    console.log(`   - Average Execution Time: ${finalMetrics.averageExecutionTime}ms`);
    console.log(`   - Error Rate: ${finalMetrics.errorRate}`);

    console.log('\n✅ Serverless Functions Architecture Demo Complete!\n');
    console.log('Key characteristics demonstrated:');
    console.log('- Event-driven execution model');
    console.log('- Automatic scaling and load balancing');
    console.log('- Pay-per-execution pricing model');
    console.log('- Cold start vs warm start behavior');
    console.log('- Multiple trigger types (HTTP, events, schedules, storage)');
    console.log('- Stateless function design');
    console.log('- Error handling and timeout management');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run the demonstration
demonstrateServerlessArchitecture().catch(console.error);
