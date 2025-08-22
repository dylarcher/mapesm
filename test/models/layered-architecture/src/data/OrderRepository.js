// Data Access Layer - Order Repository
const { v4: uuidv4 } = require('uuid');

class OrderRepository {
  constructor() {
    this.orders = new Map();
    this.seedData();
  }

  seedData() {
    const sampleOrders = [
      {
        id: '1',
        customerId: '1',
        items: [
          { productId: 'p1', productName: 'Laptop', quantity: 1, price: 999.99 },
          { productId: 'p2', productName: 'Mouse', quantity: 1, price: 29.99 }
        ],
        total: 1029.98,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: '2',
        customerId: '2',
        items: [
          { productId: 'p3', productName: 'Keyboard', quantity: 1, price: 79.99 }
        ],
        total: 79.99,
        status: 'pending',
        createdAt: new Date()
      }
    ];

    sampleOrders.forEach(order => {
      this.orders.set(order.id, order);
    });
  }

  async findAll() {
    console.log('📁 Data Layer: Retrieving all orders from database');
    return Array.from(this.orders.values());
  }

  async findById(id) {
    console.log(`📁 Data Layer: Retrieving order ${id} from database`);
    return this.orders.get(id) || null;
  }

  async findByCustomerId(customerId) {
    console.log(`📁 Data Layer: Finding orders for customer ${customerId}`);
    return Array.from(this.orders.values()).filter(order => order.customerId === customerId);
  }

  async findByStatus(status) {
    console.log(`📁 Data Layer: Finding orders with status ${status}`);
    return Array.from(this.orders.values()).filter(order => order.status === status);
  }

  async create(orderData) {
    console.log('📁 Data Layer: Creating new order in database');
    const order = {
      id: uuidv4(),
      ...orderData,
      createdAt: new Date()
    };
    this.orders.set(order.id, order);
    return order;
  }

  async update(id, updateData) {
    console.log(`📁 Data Layer: Updating order ${id} in database`);
    const existingOrder = this.orders.get(id);
    if (!existingOrder) {
      return null;
    }

    const updatedOrder = {
      ...existingOrder,
      ...updateData,
      updatedAt: new Date()
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async delete(id) {
    console.log(`📁 Data Layer: Deleting order ${id} from database`);
    return this.orders.delete(id);
  }
}

module.exports = OrderRepository;
