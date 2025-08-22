// Data Access Layer - Customer Repository
const { v4: uuidv4 } = require('uuid');

class CustomerRepository {
  constructor() {
    // Simulate database with in-memory storage
    this.customers = new Map();
    this.seedData();
  }

  seedData() {
    const sampleCustomers = [
      { id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '+1-555-0101', createdAt: new Date() },
      { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', phone: '+1-555-0102', createdAt: new Date() }
    ];

    sampleCustomers.forEach(customer => {
      this.customers.set(customer.id, customer);
    });
  }

  async findAll() {
    console.log('📁 Data Layer: Retrieving all customers from database');
    return Array.from(this.customers.values());
  }

  async findById(id) {
    console.log(`📁 Data Layer: Retrieving customer ${id} from database`);
    return this.customers.get(id) || null;
  }

  async findByEmail(email) {
    console.log(`📁 Data Layer: Finding customer by email ${email}`);
    for (const customer of this.customers.values()) {
      if (customer.email === email) {
        return customer;
      }
    }
    return null;
  }

  async create(customerData) {
    console.log('📁 Data Layer: Creating new customer in database');
    const customer = {
      id: uuidv4(),
      ...customerData,
      createdAt: new Date()
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async update(id, updateData) {
    console.log(`📁 Data Layer: Updating customer ${id} in database`);
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) {
      return null;
    }

    const updatedCustomer = {
      ...existingCustomer,
      ...updateData,
      updatedAt: new Date()
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async delete(id) {
    console.log(`📁 Data Layer: Deleting customer ${id} from database`);
    return this.customers.delete(id);
  }

  async exists(id) {
    return this.customers.has(id);
  }

  async count() {
    return this.customers.size;
  }
}

module.exports = CustomerRepository;
