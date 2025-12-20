const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const FarmerProfile = require('../models/FarmerProfile');
const BuyerProfile = require('../models/BuyerProfile');
const Category = require('../models/Category');
const Analytics = require('../models/Analytics');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile = null;
    if (user.role === 'farmer') {
      profile = await FarmerProfile.findOne({ user: user._id });
    } else if (user.role === 'buyer') {
      profile = await BuyerProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    // Prevent password update through this route
    if (req.body.password) {
      delete req.body.password;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by marking as inactive
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Verify user
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
exports.verifyUser = async (req, res) => {
  try {
    const { verificationStatus, notes } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'farmer') {
      const profile = await FarmerProfile.findOne({ user: user._id });
      if (profile) {
        profile.verificationStatus = verificationStatus;
        profile.isVerifiedFarmer = verificationStatus === 'verified';
        await profile.save();
      }
    } else if (user.role === 'buyer') {
      const profile = await BuyerProfile.findOne({ user: user._id });
      if (profile) {
        profile.isVerifiedBuyer = verificationStatus === 'verified';
        await profile.save();
      }
    }

    user.isVerified = verificationStatus === 'verified';
    await user.save();

    res.json({
      success: true,
      message: `User ${verificationStatus} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('buyer', 'name email')
      .populate('farmer', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    // Calculate summary
    const summary = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders,
      summary: summary[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (notes) order.notes.adminNotes = notes;
    await order.save();

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    if (category) query.category = category;

    const products = await Product.find(query)
      .populate('farmer', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update product status
// @route   PUT /api/admin/products/:id/status
// @access  Private/Admin
exports.updateProductStatus = async (req, res) => {
  try {
    const { isActive, reason } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get platform statistics
// @route   GET /api/admin/stats/platform
// @access  Private/Admin
exports.getPlatformStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all stats in parallel
    const [
      userStats,
      orderStats,
      productStats,
      revenueStats,
      categoryStats
    ] = await Promise.all([
      // User stats
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),

      // Order stats
      Order.aggregate([
        {
          $facet: {
            totalOrders: [
              { $count: 'count' }
            ],
            recentOrders: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: 'count' }
            ],
            statusStats: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Product stats
      Product.aggregate([
        {
          $facet: {
            totalProducts: [
              { $count: 'count' }
            ],
            activeProducts: [
              { $match: { isActive: true } },
              { $count: 'count' }
            ],
            categoryStats: [
              {
                $group: {
                  _id: '$category',
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),

      // Revenue stats
      Order.aggregate([
        { $match: { status: 'delivered' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            recentRevenue: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', thirtyDaysAgo] },
                  '$totalAmount',
                  0
                ]
              }
            }
          }
        }
      ]),

      // Category-wise order stats
      Order.aggregate([
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.category',
            orders: { $sum: 1 },
            revenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { revenue: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        users: userStats,
        orders: orderStats[0],
        products: productStats[0],
        revenue: revenueStats[0] || { totalRevenue: 0, recentRevenue: 0 },
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get financial reports
// @route   GET /api/admin/reports/financial
// @access  Private/Admin
exports.getFinancialReports = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;

    let matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupFormat;
    switch (groupBy) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-%U';
        break;
      case 'monthly':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const report = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          deliveryFees: { $sum: '$deliveryFee' },
          taxes: { $sum: '$tax' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate totals
    const totals = report.reduce((acc, curr) => ({
      orders: acc.orders + curr.orders,
      revenue: acc.revenue + curr.revenue,
      deliveryFees: acc.deliveryFees + curr.deliveryFees,
      taxes: acc.taxes + curr.taxes
    }), { orders: 0, revenue: 0, deliveryFees: 0, taxes: 0 });

    res.json({
      success: true,
      report,
      totals,
      groupBy
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Category management
exports.manageCategories = {
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find().sort('displayOrder');
      res.json({
        success: true,
        categories
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  createCategory: async (req, res) => {
    try {
      const category = await Category.create(req.body);
      res.status(201).json({
        success: true,
        category
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  updateCategory: async (req, res) => {
    try {
      const category = await Category.findByIdAndUpdate(
        req.body.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      res.json({
        success: true,
        category
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      // Check if category has products
      const productCount = await Product.countDocuments({ category: category.name });
      if (productCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete category with ${productCount} products. Reassign products first.`
        });
      }

      await category.deleteOne();

      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

// @desc    Send notification to users
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, targetUsers, targetRoles } = req.body;

    // In a real application, you would integrate with a notification service
    // For now, we'll just log it
    console.log('Admin Notification:', {
      title,
      message,
      targetUsers,
      targetRoles,
      sentAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};