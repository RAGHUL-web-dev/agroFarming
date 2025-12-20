const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getDeliveries,
  getDelivery,
  updateDelivery,
  assignDriver,
  updateTracking,
  getDeliveryStats
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

const deliveryController = require('../controllers/deliveryController');

// Protected routes
router.use(protect);

// Common routes
router.get('/', deliveryController.getDeliveries);
router.get('/:id', deliveryController.getDelivery);

// Admin/Farmer routes
router.post('/', authorize(['admin', 'farmer']), deliveryController.createDelivery);
router.put('/:id', authorize(['admin', 'farmer']), deliveryController.updateDelivery);
router.put('/:id/assign', authorize('admin'), deliveryController.assignDriver);
router.put('/:id/tracking', authorize(['admin', 'driver']), deliveryController.updateTracking);

// Admin only routes
router.get('/stats/admin', authorize('admin'), deliveryController.getDeliveryStats);

module.exports = router;