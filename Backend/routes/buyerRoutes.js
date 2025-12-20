const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const buyerController = require('../controllers/buyerController');
const {respondToNegotiation} = require("../controllers/orderController")

// All routes require buyer role
router.use(protect);
router.use(authorize('buyer'));

// Profile routes
router.route('/profile')
  .get(buyerController.getBuyerProfile)
  .put(buyerController.updateBuyerProfile);

// Dashboard
router.get('/dashboard', buyerController.getBuyerDashboard);

// Favorites
router.route('/favorites')
  .get(buyerController.getFavorites)
  .post(buyerController.addToFavorites);

router.delete('/favorites/:productId', buyerController.removeFromFavorites);

// Add this route after the cart routes
router.put('/orders/:id/negotiate', respondToNegotiation);

// Cart
router.route('/cart')
  .get(buyerController.getCart)
  .post(buyerController.addToCart)
  .put(buyerController.updateCart);

router.delete('/cart/:itemId', buyerController.removeFromCart);

module.exports = router;