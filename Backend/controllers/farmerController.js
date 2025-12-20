const FarmerProfile = require('../models/FarmerProfile');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get farmer profile
// @route   GET /api/farmers/profile
// @access  Private (Farmer only)
exports.getFarmerProfile = async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ user: req.user.id })
      .populate('user', 'name email phone address profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Farmer profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update farmer profile
// @route   PUT /api/farmers/profile
// @access  Private (Farmer only)
exports.updateFarmerProfile = async (req, res) => {
  try {
    let profile = await FarmerProfile.findOne({ user: req.user.id });

    if (!profile) {
      profile = await FarmerProfile.create({
        user: req.user.id,
        ...req.body
      });
    } else {
      profile = await FarmerProfile.findOneAndUpdate(
        { user: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get farmer's products
// @route   GET /api/farmers/products
// @access  Private (Farmer only)
exports.getFarmerProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { farmer: req.user.id };
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const products = await Product.find(query)
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

// @desc    Get farmer's orders
// @route   GET /api/farmers/orders
// @access  Private (Farmer only)
exports.getFarmerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { farmer: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('buyer', 'name email phone businessName')
      .populate('items.product', 'name images category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    // Calculate summary
    const summary = await Order.aggregate([
      { $match: { farmer: req.user._id } },
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
// @route   PUT /api/farmers/orders/:id/status
// @access  Private (Farmer only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      farmer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (notes) order.notes.farmerNotes = notes;
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

// @desc    Get farmer dashboard stats
// @route   GET /api/farmers/dashboard
// @access  Private (Farmer only)
exports.getDashboardStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get stats in parallel
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      recentOrders,
      revenueStats,
      popularProducts
    ] = await Promise.all([
      Product.countDocuments({ farmer: req.user.id }),
      Product.countDocuments({ farmer: req.user.id, isActive: true }),
      Order.countDocuments({ farmer: req.user.id }),
      Order.find({ farmer: req.user.id })
        .populate('buyer', 'name')
        .sort('-createdAt')
        .limit(5),
      Order.aggregate([
        { $match: { 
          farmer: req.user._id,
          createdAt: { $gte: thirtyDaysAgo },
          status: 'delivered'
        }},
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        }
      ]),
      Product.aggregate([
        { $match: { farmer: req.user._id } },
        { $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'items.product',
          as: 'orders'
        }},
        { $project: {
          name: 1,
          category: 1,
          orderCount: { $size: '$orders' }
        }},
        { $sort: { orderCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        activeProducts,
        totalOrders,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
        recentOrders: revenueStats[0]?.orderCount || 0
      },
      recentOrders,
      popularProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};