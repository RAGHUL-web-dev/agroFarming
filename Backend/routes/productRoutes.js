const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getProductsByFarmer
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProductImage } = require('../middleware/upload');

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/farmer/:farmerId', getProductsByFarmer);
router.get('/:id', getProduct);

// Protected routes
router.use(protect);

// Farmer-only routes
router.post('/', authorize('farmer'), uploadProductImage.array('images', 5), createProduct);
router.put('/:id', authorize('farmer'), uploadProductImage.array('images', 5), updateProduct);
router.delete('/:id', authorize('farmer'), deleteProduct);

module.exports = router;