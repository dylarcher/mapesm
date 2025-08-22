// Application Service - Product Management Use Cases
const Product = require('../../domain/entities/Product');
const ProductDomainService = require('../../domain/services/ProductDomainService');

class ProductService {
  constructor(productRepository, notificationService, eventPublisher) {
    this.productRepository = productRepository;
    this.notificationService = notificationService;
    this.eventPublisher = eventPublisher;
    this.productDomainService = new ProductDomainService();
  }

  async createProduct(productData) {
    const { name, price, category, description } = productData;

    // Create domain entity
    const product = new Product(name, price, category, description);

    // Save through repository port
    await this.productRepository.save(product);

    // Publish event through event publisher port
    await this.eventPublisher.publishProductEvent('ProductCreated', product);

    // Send notification through notification service port
    await this.notificationService.sendNotification(
      'product_created',
      'admin@example.com',
      `New product created: ${product.name}`,
      { productId: product.id }
    );

    return product;
  }

  async updateProductPrice(productId, newPrice) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const oldPrice = product.price;
    product.updatePrice(newPrice);

    await this.productRepository.save(product);

    await this.eventPublisher.publishProductEvent('ProductPriceUpdated', product, {
      oldPrice,
      newPrice
    });

    return product;
  }

  async getProductById(productId) {
    return await this.productRepository.findById(productId);
  }

  async getProductsByCategory(category) {
    return await this.productRepository.findByCategory(category);
  }

  async getAllProducts() {
    return await this.productRepository.findAll();
  }

  async deleteProduct(productId) {
    const exists = await this.productRepository.exists(productId);
    if (!exists) {
      throw new Error('Product not found');
    }

    await this.productRepository.delete(productId);

    await this.eventPublisher.publishEvent('ProductDeleted', {
      productId,
      deletedAt: new Date()
    });
  }

  async calculateDiscountedPrice(productId, discountPercentage) {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    return this.productDomainService.calculateDiscountedPrice(product, discountPercentage);
  }

  async findSimilarProducts(productId) {
    const targetProduct = await this.productRepository.findById(productId);
    if (!targetProduct) {
      throw new Error('Product not found');
    }

    const allProducts = await this.productRepository.findAll();

    return allProducts.filter(product =>
      product.id !== productId &&
      this.productDomainService.isProductSimilar(targetProduct, product)
    );
  }
}

module.exports = ProductService;
