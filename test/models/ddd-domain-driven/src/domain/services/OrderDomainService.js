// Domain Service - Order Management
const User = require('../entities/User');
const Order = require('../entities/Order');

class OrderDomainService {
  constructor(userRepository, orderRepository, inventoryService) {
    this.userRepository = userRepository;
    this.orderRepository = orderRepository;
    this.inventoryService = inventoryService;
  }

  async createOrderForUser(userId, items) {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate inventory availability
    for (const item of items) {
      const available = await this.inventoryService.checkAvailability(item.productId, item.quantity);
      if (!available) {
        throw new Error(`Insufficient inventory for product ${item.productId}`);
      }
    }

    // Create order
    const order = Order.create(userId, items);

    // Reserve inventory
    for (const item of items) {
      await this.inventoryService.reserve(item.productId, item.quantity);
    }

    return order;
  }

  async calculateOrderDiscount(order) {
    // Business rule: Orders over $100 get 10% discount
    if (order.total > 100) {
      return order.total * 0.1;
    }

    // Business rule: First-time customers get 5% discount
    const user = await this.userRepository.findById(order.userId);
    const previousOrders = await this.orderRepository.findByUserId(order.userId);

    if (previousOrders.length === 0) {
      return order.total * 0.05;
    }

    return 0;
  }

  async canCancelOrder(orderId) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Business rule: Orders can only be cancelled within 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return order.createdAt > oneHourAgo && order.status === 'confirmed';
  }
}

module.exports = OrderDomainService;
