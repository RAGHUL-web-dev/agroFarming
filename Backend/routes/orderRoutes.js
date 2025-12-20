const express = require('express');
const router = express.Router();
const {
  createOrder,
  getBuyerOrders,
  getOrder,
  updateOrder,
  getOrderStats
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { getPendingApprovalOrders, approveOrder, respondToNegotiation } = require("../controllers/orderController")

// Protected routes
router.use(protect);

// Buyer routes
router.post('/', authorize('buyer'), createOrder);
router.get('/buyer', authorize('buyer'), getBuyerOrders);

// Common routes (buyer, farmer, admin)
router.get('/:id', getOrder);
router.put('/:id', updateOrder);

// Approval routes
router.get('/pending-approval', protect, authorize('farmer'), getPendingApprovalOrders);
router.put('/:id/approve', protect, authorize('farmer'), approveOrder);
router.put('/:id/negotiate', protect, authorize('buyer'), respondToNegotiation);

// Admin routes
router.get('/stats/admin', authorize('admin'), getOrderStats);

module.exports = router;