// Product View - Handles presentation logic for product data
export class ProductView {
  renderIndex(products) {
    return {
      success: true,
      data: {
        products: products.map(product => this.formatProductForList(product)),
        total: products.length
      },
      message: 'Products retrieved successfully'
    };
  }

  renderShow(product) {
    return {
      success: true,
      data: {
        product: this.formatProductDetail(product)
      },
      message: 'Product retrieved successfully'
    };
  }

  renderCreate(product) {
    return {
      success: true,
      data: {
        product: this.formatProductDetail(product)
      },
      message: 'Product created successfully'
    };
  }

  renderUpdate(product) {
    return {
      success: true,
      data: {
        product: this.formatProductDetail(product)
      },
      message: 'Product updated successfully'
    };
  }

  renderDestroy() {
    return {
      success: true,
      data: null,
      message: 'Product deleted successfully'
    };
  }

  renderNotFound() {
    return {
      success: false,
      data: null,
      message: 'Product not found',
      error: {
        code: 'PRODUCT_NOT_FOUND',
        details: 'The requested product does not exist'
      }
    };
  }

  renderValidationError(error) {
    return {
      success: false,
      data: null,
      message: 'Validation failed',
      error: {
        code: 'VALIDATION_ERROR',
        details: error.errors || [error.message]
      }
    };
  }

  renderError(error) {
    return {
      success: false,
      data: null,
      message: 'An error occurred',
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      }
    };
  }

  formatProductForList(product) {
    return {
      id: product.id,
      name: product.name,
      price: product.getFormattedPrice(),
      categoryId: product.categoryId,
      createdAt: product.createdAt
    };
  }

  formatProductDetail(product) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.getFormattedPrice(),
      priceNumeric: product.price,
      categoryId: product.categoryId,
      createdAt: product.createdAt
    };
  }
}
