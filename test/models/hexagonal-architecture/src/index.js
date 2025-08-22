// Hexagonal Architecture Demo
const ProductService = require('./application/services/ProductService');
const InMemoryProductRepository = require('./infrastructure/adapters/primary/InMemoryProductRepository');
const ConsoleNotificationService = require('./infrastructure/adapters/secondary/ConsoleNotificationService');
const SimpleEventPublisher = require('./infrastructure/adapters/secondary/SimpleEventPublisher');

async function demonstrateHexagonalArchitecture() {
  console.log('=== Hexagonal Architecture (Ports & Adapters) Demo ===\n');
  console.log('This demo shows how the domain logic is isolated from external concerns');
  console.log('through ports (interfaces) and adapters (implementations).\n');

  // Wire up the hexagonal architecture
  // Primary Adapters (driven by external actors)
  const productRepository = new InMemoryProductRepository();

  // Secondary Adapters (driving external systems)
  const notificationService = new ConsoleNotificationService();
  const eventPublisher = new SimpleEventPublisher();

  // Application Service (the hexagon's core use cases)
  const productService = new ProductService(
    productRepository,
    notificationService,
    eventPublisher
  );

  // Set up event subscribers
  eventPublisher.subscribe('Product.ProductCreated', (event) => {
    console.log(`🔔 Event Subscriber: Product created with ID ${event.data.productId}`);
  });

  eventPublisher.subscribe('Product.ProductPriceUpdated', (event) => {
    console.log(`🔔 Event Subscriber: Price updated for product ${event.data.productId}`);
    console.log(`   Old Price: $${event.metadata.oldPrice}`);
    console.log(`   New Price: $${event.metadata.newPrice}\n`);
  });

  try {
    console.log('1. Creating products...');
    const laptop = await productService.createProduct({
      name: 'Gaming Laptop',
      price: 1299.99,
      category: 'Electronics',
      description: 'High-performance gaming laptop'
    });

    const mouse = await productService.createProduct({
      name: 'Wireless Mouse',
      price: 79.99,
      category: 'Electronics',
      description: 'Ergonomic wireless mouse'
    });

    const book = await productService.createProduct({
      name: 'Clean Architecture Book',
      price: 39.99,
      category: 'Books',
      description: 'Software architecture principles'
    });

    console.log('2. Retrieving products...');
    const allProducts = await productService.getAllProducts();
    console.log(`📦 Total products in repository: ${allProducts.length}\n`);

    console.log('3. Retrieving products by category...');
    const electronics = await productService.getProductsByCategory('Electronics');
    console.log(`💻 Electronics products: ${electronics.length}`);
    electronics.forEach(p => console.log(`   - ${p.name}: $${p.price}`));
    console.log();

    console.log('4. Updating product price...');
    await productService.updateProductPrice(laptop.id, 1199.99);

    console.log('5. Calculating discounted price...');
    const discountedPrice = await productService.calculateDiscountedPrice(laptop.id, 15);
    console.log(`💰 Laptop with 15% discount: $${discountedPrice.toFixed(2)}\n`);

    console.log('6. Finding similar products...');
    const similarProducts = await productService.findSimilarProducts(mouse.id);
    console.log(`🔍 Products similar to ${mouse.name}:`);
    if (similarProducts.length > 0) {
      similarProducts.forEach(p => console.log(`   - ${p.name}: $${p.price}`));
    } else {
      console.log('   No similar products found');
    }
    console.log();

    console.log('7. Deleting a product...');
    await productService.deleteProduct(book.id);

    console.log('8. Final statistics...');
    const finalProducts = await productService.getAllProducts();
    console.log(`📊 Products remaining: ${finalProducts.length}`);

    const eventHistory = eventPublisher.getEventHistory();
    console.log(`🎯 Events published: ${eventHistory.length}`);

    const notifications = notificationService.getNotificationHistory();
    console.log(`📧 Notifications sent: ${notifications.length}`);

  } catch (error) {
    console.error('❌ Error in demonstration:', error.message);
  }
}

// Run the demonstration
demonstrateHexagonalArchitecture().catch(console.error);
