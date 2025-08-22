// Primary Adapter - In-Memory Product Repository
const ProductRepositoryPort = require('../../application/ports/primary/ProductRepositoryPort');

class InMemoryProductRepository extends ProductRepositoryPort {
  constructor() {
    super();
    this.products = new Map();
  }

  async save(product) {
    this.products.set(product.id, { ...product });
    return product;
  }

  async findById(id) {
    const productData = this.products.get(id);
    if (!productData) {
      return null;
    }

    // Reconstruct Product entity
    const Product = require('../../domain/entities/Product');
    const product = Object.create(Product.prototype);
    Object.assign(product, productData);

    return product;
  }

  async findByCategory(category) {
    const products = [];
    for (const productData of this.products.values()) {
      if (productData.category === category) {
        const Product = require('../../domain/entities/Product');
        const product = Object.create(Product.prototype);
        Object.assign(product, productData);
        products.push(product);
      }
    }
    return products;
  }

  async findAll() {
    const products = [];
    for (const productData of this.products.values()) {
      const Product = require('../../domain/entities/Product');
      const product = Object.create(Product.prototype);
      Object.assign(product, productData);
      products.push(product);
    }
    return products;
  }

  async delete(id) {
    return this.products.delete(id);
  }

  async exists(id) {
    return this.products.has(id);
  }

  // Additional method for testing/debugging
  clear() {
    this.products.clear();
  }

  size() {
    return this.products.size;
  }
}

module.exports = InMemoryProductRepository;
