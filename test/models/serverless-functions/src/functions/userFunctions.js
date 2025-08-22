// User Management Functions
const { v4: uuidv4 } = require('uuid');

// Simulated database
const users = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com', createdAt: new Date() }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com', createdAt: new Date() }]
]);

/**
 * Create User Function
 * Triggered by HTTP POST /users
 */
exports.createUser = async (event, context) => {
  console.log('⚡ Function: createUser');
  console.log('📥 Input:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    // Parse input
    const { name, email } = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;

    // Validation
    if (!name || !email) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Name and email are required'
        })
      };
    }

    // Check if user already exists
    for (const user of users.values()) {
      if (user.email === email) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'User with this email already exists'
          })
        };
      }
    }

    // Create user
    const user = {
      id: uuidv4(),
      name,
      email,
      createdAt: new Date()
    };

    users.set(user.id, user);

    const duration = Date.now() - startTime;
    console.log(`✅ User created in ${duration}ms`);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: user,
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in createUser:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Get User Function
 * Triggered by HTTP GET /users/{id}
 */
exports.getUser = async (event, context) => {
  console.log('⚡ Function: getUser');
  console.log('📥 Input:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const userId = event.pathParameters?.id || event.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User ID is required'
        })
      };
    }

    const user = users.get(userId);

    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User not found'
        })
      };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ User retrieved in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: user,
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in getUser:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * List Users Function
 * Triggered by HTTP GET /users
 */
exports.listUsers = async (event, context) => {
  console.log('⚡ Function: listUsers');
  console.log('📥 Input:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const allUsers = Array.from(users.values());

    // Simple pagination
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = parseInt(event.queryStringParameters?.limit || '10');
    const offset = (page - 1) * limit;

    const paginatedUsers = allUsers.slice(offset, offset + limit);

    const duration = Date.now() - startTime;
    console.log(`✅ Users listed in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: paginatedUsers,
        pagination: {
          page,
          limit,
          total: allUsers.length,
          pages: Math.ceil(allUsers.length / limit)
        },
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in listUsers:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Update User Function
 * Triggered by HTTP PUT /users/{id}
 */
exports.updateUser = async (event, context) => {
  console.log('⚡ Function: updateUser');
  console.log('📥 Input:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const userId = event.pathParameters?.id || event.id;
    const updates = typeof event.body === 'string'
      ? JSON.parse(event.body)
      : event.body;

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User ID is required'
        })
      };
    }

    const user = users.get(userId);

    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User not found'
        })
      };
    }

    // Update user
    const updatedUser = {
      ...user,
      ...updates,
      id: user.id, // Prevent ID from being changed
      updatedAt: new Date()
    };

    users.set(userId, updatedUser);

    const duration = Date.now() - startTime;
    console.log(`✅ User updated in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: updatedUser,
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in updateUser:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Delete User Function
 * Triggered by HTTP DELETE /users/{id}
 */
exports.deleteUser = async (event, context) => {
  console.log('⚡ Function: deleteUser');
  console.log('📥 Input:', JSON.stringify(event, null, 2));

  const startTime = Date.now();

  try {
    const userId = event.pathParameters?.id || event.id;

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User ID is required'
        })
      };
    }

    const deleted = users.delete(userId);

    if (!deleted) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User not found'
        })
      };
    }

    const duration = Date.now() - startTime;
    console.log(`✅ User deleted in ${duration}ms`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        message: 'User deleted successfully',
        executionTime: duration
      })
    };

  } catch (error) {
    console.error('❌ Error in deleteUser:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
