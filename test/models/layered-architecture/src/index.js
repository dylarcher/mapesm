// Layered Architecture Demo
const CustomerController = require('./presentation/CustomerController');
const OrderController = require('./presentation/OrderController');

async function demonstrateLayeredArchitecture() {
  console.log('=== Layered Architecture Demo ===\n');
  console.log('This demo shows the traditional 3-tier architecture:');
  console.log('🖥️  Presentation Layer (Controllers)');
  console.log('🏢 Business Logic Layer (Services)');
  console.log('📁 Data Access Layer (Repositories)\n');

  const customerController = new CustomerController();
  const orderController = new OrderController();

  try {
    console.log('1. Customer Management Operations\n');

    // Get all customers
    console.log('--- Getting all customers ---');
    let response = await customerController.handleGetAllCustomers();
    customerController.formatResponse(response);
    console.log();

    // Get customer by ID
    console.log('--- Getting customer by ID ---');
    response = await customerController.handleGetCustomerById('1');
    customerController.formatResponse(response);
    console.log();

    // Create new customer
    console.log('--- Creating new customer ---');
    response = await customerController.handleCreateCustomer({
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@example.com',
      phone: '+1-555-0103'
    });
    customerController.formatResponse(response);
    const newCustomerId = response.data?.id;
    console.log();

    // Update customer
    console.log('--- Updating customer ---');
    response = await customerController.handleUpdateCustomer('1', {
      phone: '+1-555-0999'
    });
    customerController.formatResponse(response);
    console.log();

    // Get customer stats
    console.log('--- Getting customer statistics ---');
    response = await customerController.handleGetCustomerStats();
    customerController.formatResponse(response);
    console.log();

    console.log('2. Order Management Operations\n');

    // Get all orders
    console.log('--- Getting all orders ---');
    response = await orderController.handleGetAllOrders();
    orderController.formatResponse(response);
    console.log();

    // Get orders by customer
    console.log('--- Getting orders for customer 1 ---');
    response = await orderController.handleGetOrdersByCustomer('1');
    orderController.formatResponse(response);
    console.log();

    // Create new order
    console.log('--- Creating new order ---');
    response = await orderController.handleCreateOrder({
      customerId: newCustomerId || '1',
      items: [
        {
          productId: 'p4',
          productName: 'Tablet',
          quantity: 1,
          price: 299.99
        },
        {
          productId: 'p5',
          productName: 'Case',
          quantity: 1,
          price: 19.99
        }
      ]
    });
    orderController.formatResponse(response);
    const newOrderId = response.data?.id;
    console.log();

    // Update order status
    console.log('--- Updating order status ---');
    response = await orderController.handleUpdateOrderStatus(newOrderId || '1', 'processing');
    orderController.formatResponse(response);
    console.log();

    // Get order statistics
    console.log('--- Getting order statistics ---');
    response = await orderController.handleGetOrderStatistics();
    orderController.formatResponse(response);
    console.log();

    // Get customer order summary
    console.log('--- Getting customer order summary ---');
    response = await orderController.handleGetCustomerOrderSummary('1');
    orderController.formatResponse(response);
    console.log();

    console.log('3. Error Handling Examples\n');

    // Try to get non-existent customer
    console.log('--- Trying to get non-existent customer ---');
    response = await customerController.handleGetCustomerById('999');
    customerController.formatResponse(response);
    console.log();

    // Try to create customer with invalid data
    console.log('--- Trying to create customer with invalid data ---');
    response = await customerController.handleCreateCustomer({
      firstName: 'A', // Too short
      lastName: 'Smith',
      email: 'invalid-email', // Invalid format
    });
    customerController.formatResponse(response);
    console.log();

    console.log('✅ Layered Architecture Demo Complete!\n');
    console.log('Key characteristics demonstrated:');
    console.log('- Clear separation of concerns across layers');
    console.log('- Top-down dependency flow');
    console.log('- Business logic centralized in service layer');
    console.log('- Data access abstracted in repository layer');
    console.log('- Presentation layer handles user interaction');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demonstration
demonstrateLayeredArchitecture().catch(console.error);
