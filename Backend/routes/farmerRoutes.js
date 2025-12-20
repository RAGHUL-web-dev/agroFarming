const express = require('express');
const router = express.Router();
const { 
  getFarmerProfile,
  updateFarmerProfile,
  getFarmerProducts,
  getFarmerOrders,
  updateOrderStatus,
  getDashboardStats,
} = require('../controllers/farmerController');
const { protect, authorize } = require('../middleware/auth');
const { getPendingApprovalOrders, approveOrder } = require('../controllers/orderController');

// All routes require farmer role
router.use(protect);
router.use(authorize('farmer'));

// Profile routes
router.route('/profile')
  .get(getFarmerProfile)
  .put(updateFarmerProfile);

// Product routes
router.get('/products', getFarmerProducts);

// Order routes
router.get('/orders', getFarmerOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Order approval routes
router.get('/orders/pending-approval', getPendingApprovalOrders);
router.put('/orders/:id/approve', approveOrder);

// Dashboard
router.get('/dashboard', getDashboardStats);

module.exports = router;