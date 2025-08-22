// Presentation Layer - Customer Controller
const CustomerService = require('../business/CustomerService');

class CustomerController {
  constructor() {
    this.customerService = new CustomerService();
  }

  async handleGetAllCustomers() {
    console.log('🖥️ Presentation Layer: Handling GET /customers request');

    try {
      const customers = await this.customerService.getAllCustomers();
      return {
        success: true,
        data: customers,
        message: `Retrieved ${customers.length} customers`
      };
    } catch (error) {
      console.error('Error in handleGetAllCustomers:', error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetCustomerById(id) {
    console.log(`🖥️ Presentation Layer: Handling GET /customers/${id} request`);

    try {
      const customer = await this.customerService.getCustomerById(id);
      return {
        success: true,
        data: customer,
        message: 'Customer retrieved successfully'
      };
    } catch (error) {
      console.error(`Error in handleGetCustomerById: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleCreateCustomer(customerData) {
    console.log('🖥️ Presentation Layer: Handling POST /customers request');

    try {
      const customer = await this.customerService.createCustomer(customerData);
      return {
        success: true,
        data: customer,
        message: 'Customer created successfully'
      };
    } catch (error) {
      console.error(`Error in handleCreateCustomer: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleUpdateCustomer(id, updateData) {
    console.log(`🖥️ Presentation Layer: Handling PUT /customers/${id} request`);

    try {
      const customer = await this.customerService.updateCustomer(id, updateData);
      return {
        success: true,
        data: customer,
        message: 'Customer updated successfully'
      };
    } catch (error) {
      console.error(`Error in handleUpdateCustomer: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleDeleteCustomer(id) {
    console.log(`🖥️ Presentation Layer: Handling DELETE /customers/${id} request`);

    try {
      await this.customerService.deleteCustomer(id);
      return {
        success: true,
        data: null,
        message: 'Customer deleted successfully'
      };
    } catch (error) {
      console.error(`Error in handleDeleteCustomer: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  async handleGetCustomerStats() {
    console.log('🖥️ Presentation Layer: Handling GET /customers/stats request');

    try {
      const stats = await this.customerService.getCustomerStats();
      return {
        success: true,
        data: stats,
        message: 'Customer statistics retrieved successfully'
      };
    } catch (error) {
      console.error(`Error in handleGetCustomerStats: ${error.message}`);
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

module.exports = CustomerController;
