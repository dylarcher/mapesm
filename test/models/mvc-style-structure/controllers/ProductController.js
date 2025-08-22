// Product Controller - Handles product-related HTTP requests
import { Product } from '../models/Product.js';
import { ValidationError } from '../utils/Errors.js';
import { ProductView } from '../views/ProductView.js';

export class ProductController {
  constructor(database) {
    this.database = database;
    this.productView = new ProductView();
  }

  async index(req, res) {
    try {
      const { category } = req.query;
      let products;

      if (category) {
        products = await Product.findByCategory(category, this.database);
      } else {
        products = await Product.findAll(this.database);
      }

      const response = this.productView.renderIndex(products);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.productView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id, this.database);

      if (!product) {
        const notFoundResponse = this.productView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      const response = this.productView.renderShow(product);
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.productView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async create(req, res) {
    try {
      const productData = req.body;
      const product = new Product(
        null,
        productData.name,
        productData.description,
        productData.price,
        productData.categoryId
      );

      await product.save(this.database);

      const response = this.productView.renderCreate(product);
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationResponse = this.productView.renderValidationError(error);
        return res.status(400).json(validationResponse);
      }

      const errorResponse = this.productView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const productData = req.body;

      const product = await Product.findById(id, this.database);
      if (!product) {
        const notFoundResponse = this.productView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      // Update product properties
      Object.assign(product, productData);
      await product.save(this.database);

      const response = this.productView.renderUpdate(product);
      res.status(200).json(response);
    } catch (error) {
      if (error instanceof ValidationError) {
        const validationResponse = this.productView.renderValidationError(error);
        return res.status(400).json(validationResponse);
      }

      const errorResponse = this.productView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id, this.database);

      if (!product) {
        const notFoundResponse = this.productView.renderNotFound();
        return res.status(404).json(notFoundResponse);
      }

      await product.delete(this.database);

      const response = this.productView.renderDestroy();
      res.status(200).json(response);
    } catch (error) {
      const errorResponse = this.productView.renderError(error);
      res.status(500).json(errorResponse);
    }
  }
}
