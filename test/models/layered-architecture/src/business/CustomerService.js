// Business Logic Layer - Customer Service
const CustomerRepository = require('../data/CustomerRepository');

class CustomerService {
  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async getAllCustomers() {
    console.log('🏢 Business Layer: Processing request to get all customers');
    return await this.customerRepository.findAll();
  }

  async getCustomerById(id) {
    console.log(`🏢 Business Layer: Processing request to get customer ${id}`);

    if (!id) {
      throw new Error('Customer ID is required');
    }

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async createCustomer(customerData) {
    console.log('🏢 Business Layer: Processing customer creation request');

    // Business validation
    this.validateCustomerData(customerData);

    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
    if (existingCustomer) {
      throw new Error('Customer with this email already exists');
    }

    return await this.customerRepository.create(customerData);
  }

  async updateCustomer(id, updateData) {
    console.log(`🏢 Business Layer: Processing update request for customer ${id}`);

    if (!id) {
      throw new Error('Customer ID is required');
    }

    // Validate update data
    if (updateData.email) {
      this.validateEmail(updateData.email);

      // Check if new email is already taken by another customer
      const existingCustomer = await this.customerRepository.findByEmail(updateData.email);
      if (existingCustomer && existingCustomer.id !== id) {
        throw new Error('Email already taken by another customer');
      }
    }

    const updatedCustomer = await this.customerRepository.update(id, updateData);
    if (!updatedCustomer) {
      throw new Error('Customer not found');
    }

    return updatedCustomer;
  }

  async deleteCustomer(id) {
    console.log(`🏢 Business Layer: Processing deletion request for customer ${id}`);

    if (!id) {
      throw new Error('Customer ID is required');
    }

    const exists = await this.customerRepository.exists(id);
    if (!exists) {
      throw new Error('Customer not found');
    }

    return await this.customerRepository.delete(id);
  }

  async getCustomerStats() {
    console.log('🏢 Business Layer: Calculating customer statistics');

    const totalCustomers = await this.customerRepository.count();
    const allCustomers = await this.customerRepository.findAll();

    const recentCustomers = allCustomers.filter(customer => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return customer.createdAt > oneWeekAgo;
    });

    return {
      total: totalCustomers,
      recent: recentCustomers.length,
      averageAge: this.calculateAverageCustomerAge(allCustomers)
    };
  }

  validateCustomerData(customerData) {
    if (!customerData.firstName || customerData.firstName.trim().length < 2) {
      throw new Error('First name must be at least 2 characters long');
    }

    if (!customerData.lastName || customerData.lastName.trim().length < 2) {
      throw new Error('Last name must be at least 2 characters long');
    }

    if (!customerData.email) {
      throw new Error('Email is required');
    }

    this.validateEmail(customerData.email);

    if (customerData.phone && !this.validatePhoneNumber(customerData.phone)) {
      throw new Error('Invalid phone number format');
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  calculateAverageCustomerAge(customers) {
    if (customers.length === 0) return 0;

    const totalDays = customers.reduce((sum, customer) => {
      const customerAge = (new Date() - customer.createdAt) / (1000 * 60 * 60 * 24);
      return sum + customerAge;
    }, 0);

    return Math.round(totalDays / customers.length);
  }
}

module.exports = CustomerService;
