// Business Logic Layer - Order Service
const OrderRepository = require('../data/OrderRepository');
const CustomerRepository = require('../data/CustomerRepository');

class OrderService {
  constructor() {
    this.orderRepository = new OrderRepository();
    this.customerRepository = new CustomerRepository();
  }

  async getAllOrders() {
    console.log('🏢 Business Layer: Processing request to get all orders');
    return await this.orderRepository.findAll();
  }

  async getOrderById(id) {
    console.log(`🏢 Business Layer: Processing request to get order ${id}`);

    if (!id) {
      throw new Error('Order ID is required');
    }

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getOrdersByCustomer(customerId) {
    console.log(`🏢 Business Layer: Getting orders for customer ${customerId}`);

    if (!customerId) {
      throw new Error('Customer ID is required');
    }

    // Verify customer exists
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return await this.orderRepository.findByCustomerId(customerId);
  }

  async createOrder(orderData) {
    console.log('🏢 Business Layer: Processing order creation request');

    // Business validation
    this.validateOrderData(orderData);

    // Verify customer exists
    const customer = await this.customerRepository.findById(orderData.customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate total
    const total = this.calculateOrderTotal(orderData.items);

    const order = {
      ...orderData,
      total,
      status: 'pending'
    };

    return await this.orderRepository.create(order);
  }

  async updateOrderStatus(id, status) {
    console.log(`🏢 Business Layer: Updating order ${id} status to ${status}`);

    if (!id) {
      throw new Error('Order ID is required');
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Business rules for status changes
    if (existingOrder.status === 'delivered' && status !== 'delivered') {
      throw new Error('Cannot change status of delivered order');
    }

    if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
      throw new Error('Cannot change status of cancelled order');
    }

    return await this.orderRepository.update(id, { status });
  }

  async cancelOrder(id) {
    console.log(`🏢 Business Layer: Cancelling order ${id}`);

    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'delivered') {
      throw new Error('Cannot cancel delivered order');
    }

    if (order.status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }

    return await this.orderRepository.update(id, {
      status: 'cancelled',
      cancelledAt: new Date()
    });
  }

  async getOrderStatistics() {
    console.log('🏢 Business Layer: Calculating order statistics');

    const allOrders = await this.orderRepository.findAll();

    const stats = {
      total: allOrders.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    allOrders.forEach(order => {
      stats[order.status]++;
      if (order.status !== 'cancelled') {
        stats.totalRevenue += order.total;
      }
    });

    const revenueOrders = allOrders.filter(o => o.status !== 'cancelled');
    stats.averageOrderValue = revenueOrders.length > 0
      ? stats.totalRevenue / revenueOrders.length
      : 0;

    return stats;
  }

  async getCustomerOrderSummary(customerId) {
    console.log(`🏢 Business Layer: Getting order summary for customer ${customerId}`);

    const orders = await this.orderRepository.findByCustomerId(customerId);

    return {
      totalOrders: orders.length,
      totalSpent: orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, order) => sum + order.total, 0),
      lastOrderDate: orders.length > 0
        ? Math.max(...orders.map(o => o.createdAt.getTime()))
        : null,
      favoriteProducts: this.getFavoriteProducts(orders)
    };
  }

  validateOrderData(orderData) {
    if (!orderData.customerId) {
      throw new Error('Customer ID is required');
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    orderData.items.forEach((item, index) => {
      if (!item.productId || !item.productName) {
        throw new Error(`Item ${index + 1} is missing product information`);
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Item ${index + 1} must have a positive quantity`);
      }
      if (!item.price || item.price <= 0) {
        throw new Error(`Item ${index + 1} must have a positive price`);
      }
    });
  }

  calculateOrderTotal(items) {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  getFavoriteProducts(orders) {
    const productCounts = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
      });
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([productName, count]) => ({ productName, count }));
  }
}

module.exports = OrderService;
