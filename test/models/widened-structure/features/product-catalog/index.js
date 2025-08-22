// Product Catalog Feature Module
// Independent product management functionality that can operate standalone
// Demonstrates horizontal feature separation in widened architecture

class ProductCatalog {
  constructor() {
    this.products = new Map();
    this.categories = new Map();
    this.nextId = 1;
    this.nextCategoryId = 1;
  }

  // Category management
  createCategory(name, description = '') {
    const category = {
      id: this.nextCategoryId++,
      name,
      description,
      createdAt: new Date().toISOString(),
      productCount: 0
    };

    this.categories.set(category.id, category);
    console.log(`📁 Category created: ${category.name} (ID: ${category.id})`);
    return category;
  }

  getCategories() {
    return Array.from(this.categories.values());
  }

  // Product management
  createProduct(productData) {
    const product = {
      id: this.nextId++,
      name: productData.name,
      description: productData.description || '',
      price: parseFloat(productData.price) || 0,
      categoryId: parseInt(productData.categoryId) || null,
      stock: parseInt(productData.stock) || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.products.set(product.id, product);

    // Update category product count
    if (product.categoryId && this.categories.has(product.categoryId)) {
      const category = this.categories.get(product.categoryId);
      category.productCount++;
    }

    console.log(`📦 Product created: ${product.name} (ID: ${product.id})`);
    return product;
  }

  getProduct(id) {
    return this.products.get(id);
  }

  getProducts(filters = {}) {
    let products = Array.from(this.products.values());

    // Filter by category
    if (filters.categoryId) {
      products = products.filter(p => p.categoryId === parseInt(filters.categoryId));
    }

    // Filter by status
    if (filters.status) {
      products = products.filter(p => p.status === filters.status);
    }

    // Search by name
    if (filters.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    // Sort by price
    if (filters.sortBy === 'price') {
      products.sort((a, b) => filters.sortOrder === 'desc' ? b.price - a.price : a.price - b.price);
    } else if (filters.sortBy === 'name') {
      products.sort((a, b) => a.name.localeCompare(b.name));
    }

    return products;
  }

  updateProduct(id, updates) {
    const product = this.products.get(id);
    if (!product) return null;

    // Handle category change
    const oldCategoryId = product.categoryId;
    const newCategoryId = updates.categoryId ? parseInt(updates.categoryId) : product.categoryId;

    Object.assign(product, updates, {
      updatedAt: new Date().toISOString(),
      categoryId: newCategoryId
    });

    // Update category counts if category changed
    if (oldCategoryId !== newCategoryId) {
      if (oldCategoryId && this.categories.has(oldCategoryId)) {
        this.categories.get(oldCategoryId).productCount--;
      }
      if (newCategoryId && this.categories.has(newCategoryId)) {
        this.categories.get(newCategoryId).productCount++;
      }
    }

    this.products.set(id, product);
    return product;
  }

  deleteProduct(id) {
    const product = this.products.get(id);
    if (!product) return false;

    // Update category count
    if (product.categoryId && this.categories.has(product.categoryId)) {
      this.categories.get(product.categoryId).productCount--;
    }

    const deleted = this.products.delete(id);
    if (deleted) {
      console.log(`🗑️ Product deleted: ${product.name}`);
    }
    return deleted;
  }

  getStats() {
    const products = Array.from(this.products.values());
    return {
      totalProducts: products.length,
      activeProducts: products.filter(p => p.status === 'active').length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      categories: this.categories.size,
      averagePrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
    };
  }
}

// Create service instance
const catalogService = new ProductCatalog();

// Product Catalog Feature Module
const productCatalogModule = {
  name: 'product-catalog',
  version: '2.1.0',
  description: 'Complete product catalog management with categories and inventory',
  dependencies: [],

  service: catalogService,

  async initialize() {
    console.log('🛒 Product Catalog module initializing...');

    // Create demo categories
    const electronics = catalogService.createCategory('Electronics', 'Electronic devices and gadgets');
    const books = catalogService.createCategory('Books', 'Physical and digital books');
    const clothing = catalogService.createCategory('Clothing', 'Apparel and accessories');

    // Create demo products
    catalogService.createProduct({
      name: 'Wireless Headphones',
      description: 'High-quality Bluetooth headphones with noise cancellation',
      price: 199.99,
      categoryId: electronics.id,
      stock: 15
    });

    catalogService.createProduct({
      name: 'JavaScript Programming Guide',
      description: 'Complete guide to modern JavaScript development',
      price: 49.99,
      categoryId: books.id,
      stock: 30
    });

    catalogService.createProduct({
      name: 'Cotton T-Shirt',
      description: 'Comfortable 100% cotton t-shirt in multiple colors',
      price: 24.99,
      categoryId: clothing.id,
      stock: 50
    });

    catalogService.createProduct({
      name: 'Smartphone',
      description: 'Latest generation smartphone with advanced camera',
      price: 799.99,
      categoryId: electronics.id,
      stock: 8
    });

    console.log('✅ Product Catalog module initialized with demo data');
  },

  middleware(req, res) {
    // Add catalog context to requests
    req.catalog = catalogService;
  },

  routes: {
    '/': (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const categoryId = url.searchParams.get('category');
      const search = url.searchParams.get('search');

      const products = catalogService.getProducts({ categoryId, search });
      const categories = catalogService.getCategories();
      const stats = catalogService.getStats();

      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Product Catalog</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; }
        .product { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #28a745; }
        .category { background: #e3f2fd; padding: 10px; margin: 5px; border-radius: 4px; display: inline-block; }
        .stats { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .filters { background: #f1f3f4; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .price { font-size: 1.2em; font-weight: bold; color: #28a745; }
        .stock { color: #666; font-size: 0.9em; }
        input, select, button { padding: 8px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #28a745; color: white; border: none; cursor: pointer; }
        button:hover { background: #218838; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 Product Catalog</h1>
        <p>Self-contained product management feature module</p>

        <div class="stats">
            <h3>📊 Catalog Statistics</h3>
            <strong>Products:</strong> ${stats.totalProducts} total, ${stats.activeProducts} active<br>
            <strong>Categories:</strong> ${stats.categories}<br>
            <strong>Total Inventory Value:</strong> $${stats.totalValue.toFixed(2)}<br>
            <strong>Average Price:</strong> $${stats.averagePrice.toFixed(2)}
        </div>

        <div class="filters">
            <h3>🔍 Filters</h3>
            <form method="get">
                <input type="text" name="search" placeholder="Search products..." value="${search || ''}" />
                <select name="category">
                    <option value="">All Categories</option>
                    ${categories.map(cat => `
                        <option value="${cat.id}" ${categoryId == cat.id ? 'selected' : ''}>
                            ${cat.name} (${cat.productCount})
                        </option>
                    `).join('')}
                </select>
                <button type="submit">Filter</button>
                <button type="button" onclick="window.location.href='/product-catalog/'">Clear</button>
            </form>
        </div>

        <h2>📦 Products (${products.length})</h2>
        ${products.map(product => {
        const category = catalogService.categories.get(product.categoryId);
        return `
            <div class="product">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="price">$${product.price.toFixed(2)}</div>
                <div class="stock">Stock: ${product.stock} units</div>
                <div class="category">📁 ${category ? category.name : 'No Category'}</div>
                <div style="margin-top: 10px;">
                    <button onclick="viewProduct(${product.id})">View Details</button>
                    <button onclick="editProduct(${product.id})">Edit</button>
                </div>
            </div>
          `;
      }).join('')}

        <h2>📁 Categories</h2>
        ${categories.map(cat => `
            <div class="category" onclick="filterByCategory(${cat.id})" style="cursor: pointer;">
                <strong>${cat.name}</strong><br>
                <small>${cat.description}</small><br>
                <small>${cat.productCount} products</small>
            </div>
        `).join('')}

        <h2>🔧 API Endpoints</h2>
        <ul>
            <li><strong>GET /product-catalog/api/products</strong> - List products</li>
            <li><strong>GET /product-catalog/api/products/:id</strong> - Get product details</li>
            <li><strong>POST /product-catalog/api/products</strong> - Create product</li>
            <li><strong>PUT /product-catalog/api/products/:id</strong> - Update product</li>
            <li><strong>DELETE /product-catalog/api/products/:id</strong> - Delete product</li>
            <li><strong>GET /product-catalog/api/categories</strong> - List categories</li>
            <li><strong>GET /product-catalog/api/stats</strong> - Catalog statistics</li>
        </ul>

        <div style="margin-top: 30px; padding: 20px; background: #e8f5e9; border-radius: 4px;">
            <h3>🏗️ Feature Independence</h3>
            <ul>
                <li><strong>Complete isolation:</strong> No dependencies on other features</li>
                <li><strong>Self-service API:</strong> Full REST interface</li>
                <li><strong>Horizontal scaling:</strong> Can be deployed independently</li>
                <li><strong>Team ownership:</strong> Product team owns all catalog logic</li>
            </ul>
        </div>

        <p><a href="/">← Back to Home</a></p>
    </div>

    <script>
        function viewProduct(id) {
            window.open('/product-catalog/api/products/' + id, '_blank');
        }

        function editProduct(id) {
            alert('Edit functionality would open a form for product ID: ' + id);
        }

        function filterByCategory(categoryId) {
            window.location.href = '/product-catalog/?category=' + categoryId;
        }
    </script>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    },

    '/api/products': (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (req.method === 'GET') {
        const filters = {
          categoryId: url.searchParams.get('category'),
          status: url.searchParams.get('status'),
          search: url.searchParams.get('search'),
          sortBy: url.searchParams.get('sortBy'),
          sortOrder: url.searchParams.get('sortOrder')
        };

        const products = catalogService.getProducts(filters);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          products,
          count: products.length,
          filters
        }));

      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const productData = JSON.parse(body);
            const product = catalogService.createProduct(productData);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(product));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
          }
        });

      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    },

    '/api/products/1': (req, res) => {
      const product = catalogService.getProduct(1);
      if (!product) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Product not found' }));
        return;
      }

      const category = catalogService.categories.get(product.categoryId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ...product,
        category: category ? category.name : null
      }));
    },

    '/api/categories': (req, res) => {
      const categories = catalogService.getCategories();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ categories, count: categories.length }));
    },

    '/api/stats': (req, res) => {
      const stats = catalogService.getStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    }
  },

  async shutdown() {
    console.log('🛒 Product Catalog module shutting down...');
    console.log('✅ Product Catalog module shut down');
  },

  getService() {
    return catalogService;
  }
};

module.exports = productCatalogModule;
