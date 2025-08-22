// Primary Port - Product Repository Interface
class ProductRepositoryPort {
  async save(product) {
    throw new Error('Method must be implemented by adapter');
  }

  async findById(id) {
    throw new Error('Method must be implemented by adapter');
  }

  async findByCategory(category) {
    throw new Error('Method must be implemented by adapter');
  }

  async findAll() {
    throw new Error('Method must be implemented by adapter');
  }

  async delete(id) {
    throw new Error('Method must be implemented by adapter');
  }

  async exists(id) {
    throw new Error('Method must be implemented by adapter');
  }
}

module.exports = ProductRepositoryPort;
