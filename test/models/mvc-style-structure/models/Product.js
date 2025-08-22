// Product Model - Represents product data and business logic
import { ValidationError } from '../utils/Errors.js';

export class Product {
  constructor(id = null, name = '', description = '', price = 0, categoryId = null, createdAt = null) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.categoryId = categoryId;
    this.createdAt = createdAt || new Date();
  }

  static validate(productData) {
    const errors = [];

    if (!productData.name || productData.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (productData.price < 0) {
      errors.push('Price cannot be negative');
    }

    if (!productData.categoryId) {
      errors.push('Category is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('Product validation failed', errors);
    }

    return true;
  }

  static async findById(id, database) {
    const productData = await database.findOne('products', { id });
    return productData ? new Product(
      productData.id,
      productData.name,
      productData.description,
      productData.price,
      productData.categoryId,
      productData.createdAt
    ) : null;
  }

  static async findAll(database, filters = {}) {
    const products = await database.findAll('products', filters);
    return products.map(productData => new Product(
      productData.id,
      productData.name,
      productData.description,
      productData.price,
      productData.categoryId,
      productData.createdAt
    ));
  }

  static async findByCategory(categoryId, database) {
    return await Product.findAll(database, { categoryId });
  }

  async save(database) {
    Product.validate(this);

    if (this.id) {
      return await database.update('products', { id: this.id }, this.toJSON());
    } else {
      const result = await database.create('products', this.toJSON());
      this.id = result.id;
      return result;
    }
  }

  async delete(database) {
    if (!this.id) {
      throw new Error('Cannot delete product without ID');
    }
    return await database.delete('products', { id: this.id });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      categoryId: this.categoryId,
      createdAt: this.createdAt
    };
  }

  getFormattedPrice() {
    return `$${this.price.toFixed(2)}`;
  }
}
