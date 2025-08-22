// Domain Entity - Order
const { v4: uuidv4 } = require('uuid');

class Order {
  constructor(id, userId, items = []) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.items = items;
    this.status = 'pending';
    this.createdAt = new Date();
    this.total = this.calculateTotal();
    this.events = [];
  }

  static create(userId, items) {
    const order = new Order(null, userId, items);
    order.validate();
    order.addEvent('OrderCreated', { orderId: order.id, userId, total: order.total });
    return order;
  }

  addItem(productId, quantity, price) {
    if (this.status !== 'pending') {
      throw new Error('Cannot modify confirmed order');
    }

    const existingItem = this.items.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({ productId, quantity, price });
    }

    this.total = this.calculateTotal();
    this.addEvent('ItemAdded', { orderId: this.id, productId, quantity, price });
  }

  removeItem(productId) {
    if (this.status !== 'pending') {
      throw new Error('Cannot modify confirmed order');
    }

    this.items = this.items.filter(item => item.productId !== productId);
    this.total = this.calculateTotal();
    this.addEvent('ItemRemoved', { orderId: this.id, productId });
  }

  confirm() {
    if (this.items.length === 0) {
      throw new Error('Cannot confirm empty order');
    }
    if (this.status !== 'pending') {
      throw new Error('Order already processed');
    }

    this.status = 'confirmed';
    this.confirmedAt = new Date();
    this.addEvent('OrderConfirmed', { orderId: this.id, total: this.total });
  }

  cancel() {
    if (this.status === 'shipped' || this.status === 'delivered') {
      throw new Error('Cannot cancel shipped or delivered order');
    }

    this.status = 'cancelled';
    this.cancelledAt = new Date();
    this.addEvent('OrderCancelled', { orderId: this.id });
  }

  calculateTotal() {
    return this.items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  validate() {
    if (!this.userId) {
      throw new Error('User ID is required');
    }
    if (!Array.isArray(this.items)) {
      throw new Error('Items must be an array');
    }
  }

  addEvent(eventType, data) {
    this.events.push({
      type: eventType,
      data,
      timestamp: new Date()
    });
  }

  clearEvents() {
    this.events = [];
  }
}

module.exports = Order;
