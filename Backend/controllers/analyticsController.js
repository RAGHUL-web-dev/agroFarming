const Analytics = require('../models/Analytics');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get farmer analytics
// @route   GET /api/analytics/farmer
// @access  Private (Farmer only)
exports.getFarmerAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const farmerId = req.user.id;

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get analytics data
    const [
      salesData,
      productPerformance,
      customerStats,
      orderTrends
    ] = await Promise.all([
      // Sales data
      Order.aggregate([
        {
          $match: {
            farmer: farmerId,
            createdAt: { $gte: startDate },
            status: 'delivered'
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: period === 'daily' ? "%Y-%m-%d" : 
                       period === 'weekly' ? "%Y-%U" : 
                       period === 'monthly' ? "%Y-%m" : "%Y",
                date: "$createdAt"
              }
            },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Product performance
      Order.aggregate([
        {
          $match: {
            farmer: farmerId,
            createdAt: { $gte: startDate }
          }
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.name",
            category: { $first: "$product.category" },
            sales: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.subtotal" },
            orders: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),

      // Customer statistics
      Order.aggregate([
        {
          $match: {
            farmer: farmerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$buyer",
            orderCount: { $sum: 1 },
            totalSpent: { $sum: "$totalAmount" },
            firstOrder: { $min: "$createdAt" },
            lastOrder: { $max: "$createdAt" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "buyer"
          }
        },
        { $unwind: "$buyer" },
        {
          $project: {
            buyer: {
              _id: 1,
              name: 1,
              email: 1
            },
            orderCount: 1,
            totalSpent: 1,
            firstOrder: 1,
            lastOrder: 1
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),

      // Order trends
      Order.aggregate([
        {
          $match: {
            farmer: farmerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    // Calculate insights
    const insights = [];
    
    // Revenue insight
    if (salesData.length > 1) {
      const recentRevenue = salesData[salesData.length - 1]?.revenue || 0;
      const previousRevenue = salesData[salesData.length - 2]?.revenue || 0;
      const growth = previousRevenue > 0 ? 
        ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1) : 100;

      if (growth > 0) {
        insights.push({
          title: 'Revenue Growth',
          description: `Your revenue increased by ${growth}% compared to the previous period`,
          type: 'positive',
          action: 'Continue your current strategy'
        });
      } else if (growth < 0) {
        insights.push({
          title: 'Revenue Decline',
          description: `Your revenue decreased by ${Math.abs(growth)}% compared to the previous period`,
          type: 'negative',
          action: 'Consider adding promotions or new products'
        });
      }
    }

    // Best performing product insight
    if (productPerformance.length > 0) {
      const bestProduct = productPerformance[0];
      insights.push({
        title: 'Top Product',
        description: `${bestProduct._id} generated ₹${bestProduct.revenue} in revenue`,
        type: 'positive',
        action: 'Consider increasing stock for this product'
      });
    }

    // Repeat customers insight
    const repeatCustomers = customerStats.filter(c => c.orderCount > 1).length;
    if (repeatCustomers > 0) {
      insights.push({
        title: 'Customer Loyalty',
        description: `You have ${repeatCustomers} repeat customers`,
        type: 'positive',
        action: 'Consider creating a loyalty program'
      });
    }

    res.json({
      success: true,
      period,
      dateRange: { start: startDate, end: now },
      salesData,
      productPerformance,
      customerStats,
      orderTrends,
      insights,
      summary: {
        totalRevenue: salesData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: salesData.reduce((sum, item) => sum + item.orders, 0),
        averageOrderValue: salesData.length > 0 ? 
          salesData.reduce((sum, item) => sum + item.averageOrderValue, 0) / salesData.length : 0,
        uniqueCustomers: customerStats.length
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

// @desc    Get buyer analytics
// @route   GET /api/analytics/buyer
// @access  Private (Buyer only)
exports.getBuyerAnalytics = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const buyerId = req.user.id;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get analytics data
    const [
      spendingData,
      categorySpending,
      farmerSpending,
      orderStats
    ] = await Promise.all([
      // Spending data over time
      Order.aggregate([
        {
          $match: {
            buyer: buyerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { 
                format: period === 'daily' ? "%Y-%m-%d" : 
                       period === 'weekly' ? "%Y-%U" : 
                       period === 'monthly' ? "%Y-%m" : "%Y",
                date: "$createdAt"
              }
            },
            spending: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Spending by category
      Order.aggregate([
        {
          $match: {
            buyer: buyerId,
            createdAt: { $gte: startDate }
          }
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            spending: { $sum: "$items.subtotal" },
            quantity: { $sum: "$items.quantity" }
          }
        },
        { $sort: { spending: -1 } }
      ]),

      // Spending by farmer
      Order.aggregate([
        {
          $match: {
            buyer: buyerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$farmer",
            spending: { $sum: "$totalAmount" },
            orders: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "farmer"
          }
        },
        { $unwind: "$farmer" },
        {
          $project: {
            farmer: {
              _id: 1,
              name: 1,
              profileImage: 1
            },
            spending: 1,
            orders: 1
          }
        },
        { $sort: { spending: -1 } },
        { $limit: 10 }
      ]),

      // Order status statistics
      Order.aggregate([
        {
          $match: {
            buyer: buyerId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" }
          }
        }
      ])
    ]);

    // Calculate insights
    const insights = [];
    
    // Spending insight
    if (spendingData.length > 1) {
      const recentSpending = spendingData[spendingData.length - 1]?.spending || 0;
      const previousSpending = spendingData[spendingData.length - 2]?.spending || 0;
      const change = previousSpending > 0 ? 
        ((recentSpending - previousSpending) / previousSpending * 100).toFixed(1) : 100;

      if (change > 20) {
        insights.push({
          title: 'Spending Increase',
          description: `Your spending increased by ${change}% compared to the previous period`,
          type: 'neutral',
          action: 'Review your purchase patterns'
        });
      }
    }

    // Top category insight
    if (categorySpending.length > 0) {
      const topCategory = categorySpending[0];
      insights.push({
        title: 'Favorite Category',
        description: `You spent ₹${topCategory.spending} on ${topCategory._id}`,
        type: 'positive',
        action: 'Explore similar products in this category'
      });
    }

    // Top farmer insight
    if (farmerSpending.length > 0) {
      const topFarmer = farmerSpending[0];
      insights.push({
        title: 'Preferred Farmer',
        description: `You made ${topFarmer.orders} orders with ${topFarmer.farmer.name}`,
        type: 'positive',
        action: 'Check their latest products'
      });
    }

    res.json({
      success: true,
      period,
      dateRange: { start: startDate, end: now },
      spendingData,
      categorySpending,
      farmerSpending,
      orderStats,
      insights,
      summary: {
        totalSpending: spendingData.reduce((sum, item) => sum + item.spending, 0),
        totalOrders: spendingData.reduce((sum, item) => sum + item.orders, 0),
        averageOrderValue: spendingData.length > 0 ? 
          spendingData.reduce((sum, item) => sum + item.averageOrderValue, 0) / spendingData.length : 0,
        favoriteCategories: categorySpending.slice(0, 3).map(c => c._id)
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

// @desc    Get market trends
// @route   GET /api/analytics/market-trends
// @access  Public
exports.getMarketTrends = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trends = await Promise.all([
      // Popular categories
      Product.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: '$category',
            productCount: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            totalViews: { $sum: '$viewCount' }
          }
        },
        { $sort: { totalViews: -1 } },
        { $limit: 5 }
      ]),

      // Price trends by category
      Product.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              category: '$category',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
            },
            averagePrice: { $avg: '$price' },
            productCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } },
        { $limit: 50 }
      ]),

      // Best selling products
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: 'delivered'
          }
        },
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
            _id: '$product.name',
            category: { $first: '$product.category' },
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }
        },
        { $sort: { sales: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      popularCategories: trends[0],
      priceTrends: trends[1],
      bestSellingProducts: trends[2]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Save analytics data (for cron job or manual trigger)
// @route   POST /api/analytics/save
// @access  Private (Admin only)
exports.saveAnalytics = async (req, res) => {
  try {
    const { type, period, date } = req.body;

    let analyticsData = {};

    switch (type) {
      case 'platform':
        analyticsData = await generatePlatformAnalytics(period, date);
        break;
      case 'farmer':
        analyticsData = await generateFarmerAnalytics(req.user.id, period, date);
        break;
      case 'buyer':
        analyticsData = await generateBuyerAnalytics(req.user.id, period, date);
        break;
    }

    // Save to database
    const analytics = await Analytics.create({
      type,
      period,
      date: date || new Date(),
      ...analyticsData
    });

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};