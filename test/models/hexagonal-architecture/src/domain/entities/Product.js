// Domain Entity - Product
const { v4: uuidv4 } = require('uuid');

class Product {
  constructor(name, price, category, description = '') {
    this.id = uuidv4();
    this.name = name;
    this.price = price;
    this.category = category;
    this.description = description;
    this.createdAt = new Date();
    this.isActive = true;

    this.validate();
  }

  updatePrice(newPrice) {
    if (newPrice <= 0) {
      throw new Error('Price must be greater than zero');
    }
    this.price = newPrice;
  }

  updateDescription(description) {
    this.description = description;
  }

  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Product name is required');
    }

    if (!this.price || this.price <= 0) {
      throw new Error('Product price must be greater than zero');
    }

    if (!this.category || this.category.trim().length === 0) {
      throw new Error('Product category is required');
    }
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      category: this.category,
      description: this.description,
      createdAt: this.createdAt,
      isActive: this.isActive
    };
  }
}

module.exports = Product;
