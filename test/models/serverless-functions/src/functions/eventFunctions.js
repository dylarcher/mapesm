// Event-Driven Functions
const { v4: uuidv4 } = require('uuid');

// Simulated queues and storage
const eventLog = [];
const notifications = [];

/**
 * User Created Event Handler
 * Triggered when a user is created
 */
exports.onUserCreated = async (event, context) => {
  console.log('⚡ Function: onUserCreated (Event Handler)');
  console.log('📥 Event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const userData = event.detail || event.data || event;

    // Log the event
    eventLog.push({
      id: uuidv4(),
      type: 'user-created',
      data: userData,
      timestamp: new Date(),
      source: 'user-service'
    });

    // Send welcome email (simulated)
    const emailNotification = {
      id: uuidv4(),
      type: 'email',
      recipient: userData.email,
      subject: 'Welcome!',
      body: `Hi ${userData.name}, welcome to our platform!`,
      status: 'sent',
      timestamp: new Date()
    };

    notifications.push(emailNotification);
    console.log(`📧 Welcome email sent to ${userData.email}`);

    // Create user profile (simulated)
    console.log(`👤 User profile created for ${userData.name}`);

    const duration = Date.now() - startTime;
    console.log(`✅ User creation event processed in ${duration}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User creation event processed',
        actions: ['email_sent', 'profile_created'],
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in onUserCreated:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process user creation event',
        message: error.message
      })
    };
  }
};

/**
 * Data Processing Function
 * Triggered by file uploads or data streams
 */
exports.processDataFile = async (event, context) => {
  console.log('⚡ Function: processDataFile');
  console.log('📥 Event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const fileInfo = event.Records?.[0] || event.file || event;
    const fileName = fileInfo.s3?.object?.key || fileInfo.name || 'unknown-file';
    const fileSize = fileInfo.s3?.object?.size || fileInfo.size || 0;

    console.log(`📂 Processing file: ${fileName} (${fileSize} bytes)`);

    // Simulate data processing
    const processingSteps = [
      'Validating file format',
      'Extracting data',
      'Transforming records',
      'Validating data integrity',
      'Storing processed data'
    ];

    const results = [];

    for (const step of processingSteps) {
      console.log(`🔄 ${step}...`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      results.push({
        step,
        status: 'completed',
        timestamp: new Date()
      });
    }

    // Log processing event
    eventLog.push({
      id: uuidv4(),
      type: 'file-processed',
      data: {
        fileName,
        fileSize,
        recordsProcessed: Math.floor(Math.random() * 1000) + 100,
        results
      },
      timestamp: new Date(),
      source: 'data-processor'
    });

    const duration = Date.now() - startTime;
    console.log(`✅ File processed in ${duration}ms`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'File processed successfully',
        fileName,
        fileSize,
        steps: results,
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in processDataFile:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process file',
        message: error.message
      })
    };
  }
};

/**
 * Scheduled Cleanup Function
 * Triggered by cron schedule (e.g., daily at midnight)
 */
exports.scheduledCleanup = async (event, context) => {
  console.log('⚡ Function: scheduledCleanup (Scheduled)');
  console.log('📥 Event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    console.log('🧹 Starting scheduled cleanup...');

    // Clean up old events (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const initialEventCount = eventLog.length;

    // Remove old events (simulated)
    const cleanedEvents = eventLog.filter(event =>
      new Date(event.timestamp) > thirtyDaysAgo
    );

    const removedEventCount = initialEventCount - cleanedEvents.length;

    // Clean up old notifications (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialNotificationCount = notifications.length;

    const cleanedNotifications = notifications.filter(notification =>
      new Date(notification.timestamp) > sevenDaysAgo
    );

    const removedNotificationCount = initialNotificationCount - cleanedNotifications.length;

    // Simulate database cleanup
    console.log('🗄️ Cleaning up database records...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate cache cleanup
    console.log('💾 Clearing expired cache entries...');
    await new Promise(resolve => setTimeout(resolve, 200));

    const duration = Date.now() - startTime;

    const cleanupReport = {
      eventsRemoved: removedEventCount,
      notificationsRemoved: removedNotificationCount,
      databaseRecordsCleaned: Math.floor(Math.random() * 100),
      cacheEntriesCleared: Math.floor(Math.random() * 50),
      executionTime: duration
    };

    console.log('📊 Cleanup Report:', JSON.stringify(cleanupReport, null, 2));
    console.log(`✅ Cleanup completed in ${duration}ms`);

    // Log cleanup event
    eventLog.push({
      id: uuidv4(),
      type: 'scheduled-cleanup',
      data: cleanupReport,
      timestamp: new Date(),
      source: 'cleanup-service'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Scheduled cleanup completed',
        report: cleanupReport
      })
    };

  } catch (error) {
    console.error('❌ Error in scheduledCleanup:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Cleanup failed',
        message: error.message
      })
    };
  }
};

/**
 * Analytics Function
 * Triggered by HTTP GET /analytics
 */
exports.getAnalytics = async (event, context) => {
  console.log('⚡ Function: getAnalytics');
  console.log('📥 Event:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    // Analyze event log
    const eventsByType = eventLog.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    const recentEvents = eventLog.filter(event =>
      new Date(event.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Analyze notifications
    const notificationsByType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});

    const analytics = {
      totalEvents: eventLog.length,
      eventsByType,
      recentEvents: recentEvents.length,
      totalNotifications: notifications.length,
      notificationsByType,
      systemHealth: {
        status: 'healthy',
        uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
        memoryUsage: Math.floor(Math.random() * 100), // Random memory percentage
      }
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Analytics generated in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: analytics,
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in getAnalytics:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Failed to generate analytics',
        message: error.message
      })
    };
  }
};

// Export event log and notifications for testing
exports.getEventLog = () => [...eventLog];
exports.getNotifications = () => [...notifications];
