// Order Processing Feature Module
// Independent order management that can integrate with other features
// Demonstrates inter-feature communication in widened architecture

class OrderService {
  constructor() {
    this.orders = new Map();
    this.orderItems = new Map(); // orderItems by orderId
    this.nextId = 1000; // Start with 1000 for better demo IDs
  }

  createOrder(orderData) {
    const order = {
      id: this.nextId++,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      status: 'pending',
      items: orderData.items || [],
      totalAmount: 0,
      shippingAddress: orderData.shippingAddress || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Calculate total
    order.totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    this.orders.set(order.id, order);
    console.log(`📋 Order created: #${order.id} for ${order.customerName} ($${order.totalAmount.toFixed(2)})`);

    return order;
  }

  getOrder(id) {
    return this.orders.get(id);
  }

  getOrders(filters = {}) {
    let orders = Array.from(this.orders.values());

    if (filters.customerId) {
      orders = orders.filter(o => o.customerId === parseInt(filters.customerId));
    }

    if (filters.status) {
      orders = orders.filter(o => o.status === filters.status);
    }

    if (filters.sortBy === 'date') {
      orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filters.sortBy === 'amount') {
      orders.sort((a, b) => b.totalAmount - a.totalAmount);
    }

    return orders;
  }

  updateOrderStatus(id, status, notes = '') {
    const order = this.orders.get(id);
    if (!order) return null;

    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (notes) {
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        from: oldStatus,
        to: status,
        notes,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📦 Order #${id} status: ${oldStatus} → ${status}`);
    return order;
  }

  addItemToOrder(orderId, item) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status !== 'pending') {
      throw new Error('Cannot modify order that is not pending');
    }

    order.items.push({
      productId: item.productId,
      productName: item.productName,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      addedAt: new Date().toISOString()
    });

    // Recalculate total
    order.totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    order.updatedAt = new Date().toISOString();
    return order;
  }

  removeItemFromOrder(orderId, productId) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status !== 'pending') {
      throw new Error('Cannot modify order that is not pending');
    }

    const itemIndex = order.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return null;

    order.items.splice(itemIndex, 1);

    // Recalculate total
    order.totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    order.updatedAt = new Date().toISOString();
    return order;
  }

  processPayment(orderId, paymentInfo) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status !== 'pending') {
      throw new Error('Order is not in pending status');
    }

    // Simulate payment processing
    const payment = {
      method: paymentInfo.method || 'credit_card',
      amount: order.totalAmount,
      status: 'completed', // Simulate successful payment
      transactionId: Math.random().toString(36).substring(2, 15),
      processedAt: new Date().toISOString()
    };

    order.payment = payment;
    order.status = 'paid';
    order.updatedAt = new Date().toISOString();

    console.log(`💳 Payment processed for order #${orderId}: $${payment.amount.toFixed(2)}`);
    return { order, payment };
  }

  fulfillOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (order.status !== 'paid') {
      throw new Error('Order must be paid before fulfillment');
    }

    order.status = 'fulfilled';
    order.fulfilledAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Generate tracking info
    order.shipping = {
      carrier: 'Demo Shipping Co.',
      trackingNumber: 'DEMO' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
    };

    console.log(`📦 Order #${orderId} fulfilled, tracking: ${order.shipping.trackingNumber}`);
    return order;
  }

  getOrderStats() {
    const orders = Array.from(this.orders.values());
    const statuses = {};
    let totalRevenue = 0;
    let totalItems = 0;

    orders.forEach(order => {
      statuses[order.status] = (statuses[order.status] || 0) + 1;
      if (order.status === 'paid' || order.status === 'fulfilled') {
        totalRevenue += order.totalAmount;
      }
      totalItems += order.items.length;
    });

    return {
      totalOrders: orders.length,
      statusBreakdown: statuses,
      totalRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      totalItems
    };
  }
}

// Create service instance
const orderService = new OrderService();

// Order Processing Feature Module
const orderProcessingModule = {
  name: 'order-processing',
  version: '1.5.0',
  description: 'Complete order management system with payment processing and fulfillment',
  dependencies: ['user-management', 'product-catalog'], // Can integrate with other features

  service: orderService,

  async initialize() {
    console.log('🛍️ Order Processing module initializing...');

    // Create demo orders
    orderService.createOrder({
      customerId: 1,
      customerName: 'Demo User',
      items: [
        { productId: 1, productName: 'Wireless Headphones', price: 199.99, quantity: 1 },
        { productId: 3, productName: 'Cotton T-Shirt', price: 24.99, quantity: 2 }
      ],
      shippingAddress: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'CA',
        zipCode: '12345'
      }
    });

    const order2 = orderService.createOrder({
      customerId: 2,
      customerName: 'Admin User',
      items: [
        { productId: 2, productName: 'JavaScript Programming Guide', price: 49.99, quantity: 1 },
        { productId: 4, productName: 'Smartphone', price: 799.99, quantity: 1 }
      ],
      shippingAddress: {
        street: '456 Admin Ave',
        city: 'Admin City',
        state: 'NY',
        zipCode: '67890'
      }
    });

    // Process the second order as a demo
    orderService.processPayment(order2.id, { method: 'credit_card' });
    orderService.fulfillOrder(order2.id);

    console.log('✅ Order Processing module initialized with demo orders');
  },

  middleware(req, res) {
    req.orderService = orderService;
  },

  routes: {
    '/': (req, res) => {
      const orders = orderService.getOrders({ sortBy: 'date' });
      const stats = orderService.getOrderStats();

      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Order Processing</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; }
        .order { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #17a2b8; }
        .stats { background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .status { padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.paid { background: #d1ecf1; color: #0c5460; }
        .status.fulfilled { background: #d4edda; color: #155724; }
        .items { background: #e9ecef; padding: 10px; margin: 10px 0; border-radius: 4px; }
        .item { padding: 5px 0; border-bottom: 1px solid #dee2e6; }
        .item:last-child { border-bottom: none; }
        .total { font-size: 1.2em; font-weight: bold; color: #28a745; }
        button { background: #17a2b8; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #138496; }
        button.success { background: #28a745; }
        button.success:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛍️ Order Processing</h1>
        <p>Independent order management and fulfillment system</p>

        <div class="stats">
            <h3>📊 Order Statistics</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div><strong>Total Orders:</strong> ${stats.totalOrders}</div>
                <div><strong>Total Revenue:</strong> $${stats.totalRevenue.toFixed(2)}</div>
                <div><strong>Average Order:</strong> $${stats.averageOrderValue.toFixed(2)}</div>
                <div><strong>Total Items:</strong> ${stats.totalItems}</div>
            </div>
            <div style="margin-top: 15px;">
                <strong>Status Breakdown:</strong>
                ${Object.entries(stats.statusBreakdown).map(([status, count]) => `
                    <span class="status ${status}">${status}: ${count}</span>
                `).join(' ')}
            </div>
        </div>

        <h2>📋 Orders (${orders.length})</h2>
        ${orders.map(order => `
            <div class="order">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p><strong>Customer:</strong> ${order.customerName} (ID: ${order.customerId})</p>
                        <p><strong>Created:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <span class="status ${order.status}">${order.status.toUpperCase()}</span>
                </div>

                <div class="items">
                    <strong>Order Items:</strong>
                    ${order.items.map(item => `
                        <div class="item">
                            ${item.productName} - $${item.price.toFixed(2)} × ${item.quantity} = $${(item.price * item.quantity).toFixed(2)}
                        </div>
                    `).join('')}
                </div>

                <div class="total">Total: $${order.totalAmount.toFixed(2)}</div>

                ${order.shippingAddress.street ? `
                    <div style="margin-top: 10px;">
                        <strong>Shipping:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
                    </div>
                ` : ''}

                ${order.payment ? `
                    <div style="margin-top: 10px;">
                        <strong>Payment:</strong> ${order.payment.method} - ${order.payment.transactionId}
                    </div>
                ` : ''}

                ${order.shipping ? `
                    <div style="margin-top: 10px;">
                        <strong>Shipping:</strong> ${order.shipping.carrier} - Track: ${order.shipping.trackingNumber}
                    </div>
                ` : ''}

                <div style="margin-top: 15px;">
                    ${order.status === 'pending' ? `
                        <button onclick="processPayment(${order.id})">Process Payment</button>
                        <button onclick="addItem(${order.id})">Add Item</button>
                    ` : ''}
                    ${order.status === 'paid' ? `
                        <button class="success" onclick="fulfillOrder(${order.id})">Fulfill Order</button>
                    ` : ''}
                    <button onclick="viewOrderDetails(${order.id})">View Details</button>
                </div>
            </div>
        `).join('')}

        <h2>🔧 Order Management Actions</h2>
        <div style="margin: 20px 0;">
            <button onclick="createDemoOrder()">Create Demo Order</button>
            <button onclick="showOrderStats()">Show Statistics</button>
        </div>

        <h2>🔌 API Endpoints</h2>
        <ul>
            <li><strong>GET /order-processing/api/orders</strong> - List all orders</li>
            <li><strong>GET /order-processing/api/orders/:id</strong> - Get order details</li>
            <li><strong>POST /order-processing/api/orders</strong> - Create new order</li>
            <li><strong>PUT /order-processing/api/orders/:id/status</strong> - Update order status</li>
            <li><strong>POST /order-processing/api/orders/:id/payment</strong> - Process payment</li>
            <li><strong>POST /order-processing/api/orders/:id/fulfill</strong> - Fulfill order</li>
            <li><strong>GET /order-processing/api/stats</strong> - Order statistics</li>
        </ul>

        <div style="margin-top: 30px; padding: 20px; background: #e1f5fe; border-radius: 4px;">
            <h3>🏗️ Inter-Feature Communication</h3>
            <ul>
                <li><strong>User Integration:</strong> References user-management for customer data</li>
                <li><strong>Product Integration:</strong> Can validate products with product-catalog</li>
                <li><strong>Payment Processing:</strong> Independent payment simulation</li>
                <li><strong>Fulfillment:</strong> Self-contained shipping logic</li>
                <li><strong>Loose Coupling:</strong> Features communicate via well-defined APIs</li>
            </ul>
        </div>

        <p><a href="/">← Back to Home</a></p>
    </div>

    <script>
        function processPayment(orderId) {
            fetch('/order-processing/api/orders/' + orderId + '/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: 'credit_card' })
            })
            .then(response => response.json())
            .then(() => {
                alert('Payment processed successfully!');
                location.reload();
            })
            .catch(err => alert('Error: ' + err));
        }

        function fulfillOrder(orderId) {
            fetch('/order-processing/api/orders/' + orderId + '/fulfill', { method: 'POST' })
            .then(response => response.json())
            .then(() => {
                alert('Order fulfilled successfully!');
                location.reload();
            })
            .catch(err => alert('Error: ' + err));
        }

        function viewOrderDetails(orderId) {
            window.open('/order-processing/api/orders/' + orderId, '_blank');
        }

        function createDemoOrder() {
            const orderData = {
                customerId: Math.floor(Math.random() * 10) + 1,
                customerName: 'Demo Customer ' + Math.floor(Math.random() * 100),
                items: [
                    { productId: 1, productName: 'Demo Product', price: Math.random() * 100 + 10, quantity: Math.floor(Math.random() * 3) + 1 }
                ],
                shippingAddress: {
                    street: '123 Random St',
                    city: 'Demo City',
                    state: 'CA',
                    zipCode: '12345'
                }
            };

            fetch('/order-processing/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            })
            .then(response => response.json())
            .then(() => {
                alert('Demo order created!');
                location.reload();
            })
            .catch(err => alert('Error: ' + err));
        }

        function showOrderStats() {
            window.open('/order-processing/api/stats', '_blank');
        }
    </script>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    },

    '/api/orders': (req, res) => {
      if (req.method === 'GET') {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const filters = {
          customerId: url.searchParams.get('customerId'),
          status: url.searchParams.get('status'),
          sortBy: url.searchParams.get('sortBy') || 'date'
        };

        const orders = orderService.getOrders(filters);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ orders, count: orders.length, filters }));

      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const orderData = JSON.parse(body);
            const order = orderService.createOrder(orderData);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(order));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      }
    },

    '/api/orders/1000': (req, res) => {
      const order = orderService.getOrder(1000);
      if (!order) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Order not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(order));
    },

    '/api/stats': (req, res) => {
      const stats = orderService.getOrderStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    }
  },

  async shutdown() {
    console.log('🛍️ Order Processing module shutting down...');
    console.log('✅ Order Processing module shut down');
  },

  getService() {
    return orderService;
  }
};

module.exports = orderProcessingModule;
