// Presentation Layer - Order Controller
const OrderService = require('../business/OrderService');

class OrderController {
  constructor() {
    this.orderService = new OrderService();
  }

  async handleGetAllOrders() {
    console.log('🖥️ Presentation Layer: Handling GET /orders request');

    try {
      const orders = await this.orderService.getAllOrders();
      return {
        success: true,
        data: orders,
        message: `Retrieved ${orders.length} orders`
      };
    } catch (error) {
      console.error('Error in handleGetAllOrders:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetOrderById(id) {
    console.log(`🖥️ Presentation Layer: Handling GET /orders/${id} request`);

    try {
      const order = await this.orderService.getOrderById(id);
      return {
        success: true,
        data: order,
        message: 'Order retrieved successfully'
      };
    } catch (error) {
      console.error(`Error in handleGetOrderById: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetOrdersByCustomer(customerId) {
    console.log(`🖥️ Presentation Layer: Handling GET /customers/${customerId}/orders request`);

    try {
      const orders = await this.orderService.getOrdersByCustomer(customerId);
      return {
        success: true,
        data: orders,
        message: `Retrieved ${orders.length} orders for customer`
      };
    } catch (error) {
      console.error(`Error in handleGetOrdersByCustomer: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleCreateOrder(orderData) {
    console.log('🖥️ Presentation Layer: Handling POST /orders request');

    try {
      const order = await this.orderService.createOrder(orderData);
      return {
        success: true,
        data: order,
        message: 'Order created successfully'
      };
    } catch (error) {
      console.error(`Error in handleCreateOrder: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleUpdateOrderStatus(id, status) {
    console.log(`🖥️ Presentation Layer: Handling PATCH /orders/${id}/status request`);

    try {
      const order = await this.orderService.updateOrderStatus(id, status);
      return {
        success: true,
        data: order,
        message: `Order status updated to ${status}`
      };
    } catch (error) {
      console.error(`Error in handleUpdateOrderStatus: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleCancelOrder(id) {
    console.log(`🖥️ Presentation Layer: Handling POST /orders/${id}/cancel request`);

    try {
      const order = await this.orderService.cancelOrder(id);
      return {
        success: true,
        data: order,
        message: 'Order cancelled successfully'
      };
    } catch (error) {
      console.error(`Error in handleCancelOrder: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetOrderStatistics() {
    console.log('🖥️ Presentation Layer: Handling GET /orders/statistics request');

    try {
      const stats = await this.orderService.getOrderStatistics();
      return {
        success: true,
        data: stats,
        message: 'Order statistics retrieved successfully'
      };
    } catch (error) {
      console.error(`Error in handleGetOrderStatistics: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetCustomerOrderSummary(customerId) {
    console.log(`🖥️ Presentation Layer: Handling GET /customers/${customerId}/order-summary request`);

    try {
      const summary = await this.orderService.getCustomerOrderSummary(customerId);
      return {
        success: true,
        data: summary,
        message: 'Customer order summary retrieved successfully'
      };
    } catch (error) {
      console.error(`Error in handleGetCustomerOrderSummary: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Helper method to format response for console output
  formatResponse(response) {
    if (response.success) {
      console.log(`✅ Success: ${response.message}`);
      if (response.data) {
        console.log('📦 Data:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log(`❌ Error: ${response.error}`);
    }
    return response;
  }
}

module.exports = OrderController;
