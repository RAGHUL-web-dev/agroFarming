const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyUser,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  updateProductStatus,
  getPlatformStats,
  getFinancialReports,
  manageCategories,
  sendNotification
} = require('../controllers/adminController');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/verify', verifyUser);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Product management
router.get('/products', getAllProducts);
router.put('/products/:id/status', updateProductStatus);

// Category management
router.route('/categories')
  .get(manageCategories.getAllCategories)
  .post(manageCategories.createCategory)
  .put(manageCategories.updateCategory);

router.delete('/categories/:id', manageCategories.deleteCategory);

// Analytics & Reports
router.get('/stats/platform', getPlatformStats);
router.get('/reports/financial', getFinancialReports);

// Notifications
router.post('/notifications/send', sendNotification);

module.exports = router;