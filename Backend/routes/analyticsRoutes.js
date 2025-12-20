const express = require('express');
const router = express.Router();
const {
  getFarmerAnalytics,
  getBuyerAnalytics,
  getMarketTrends,
  saveAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/market-trends', getMarketTrends);

// Protected routes
router.use(protect);

// Farmer analytics
router.get('/farmer', authorize('farmer'), getFarmerAnalytics);

// Buyer analytics
router.get('/buyer', authorize('buyer'), getBuyerAnalytics);

// Admin only route for saving analytics
router.post('/save', authorize('admin'), saveAnalytics);

module.exports = router;