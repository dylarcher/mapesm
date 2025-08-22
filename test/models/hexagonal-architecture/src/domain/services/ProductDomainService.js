// Domain Service - Product Domain Service
class ProductDomainService {
  calculateDiscountedPrice(product, discountPercentage) {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    return product.price * (1 - discountPercentage / 100);
  }

  categorizeProduct(product) {
    const priceRanges = {
      budget: { min: 0, max: 50 },
      mid: { min: 50, max: 200 },
      premium: { min: 200, max: Infinity }
    };

    for (const [range, limits] of Object.entries(priceRanges)) {
      if (product.price >= limits.min && product.price < limits.max) {
        return range;
      }
    }

    return 'unknown';
  }

  isProductSimilar(product1, product2) {
    return product1.category === product2.category &&
      Math.abs(product1.price - product2.price) < 20;
  }
}

module.exports = ProductDomainService;
