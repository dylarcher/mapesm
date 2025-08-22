// Application entry point
const ApplicationBootstrap = require('./ApplicationBootstrap');

async function main() {
  console.log('=== Deeply Nested Project Demo ===');
  console.log('This demonstrates an extremely nested directory structure');
  console.log('that might be found in large enterprise applications.\n');

  const app = new ApplicationBootstrap();

  try {
    await app.initialize();
    console.log('\n✅ Application initialized successfully!');
    console.log('📁 Notice the deeply nested file paths used throughout this application.');
  } catch (error) {
    console.error('❌ Application failed to start:', error.message);
    process.exit(1);
  }
}

// Start the application
main().catch(console.error);
