const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['farmer', 'buyer', 'admin', 'system'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    // Farmer metrics
    totalProducts: Number,
    activeProducts: Number,
    totalOrders: Number,
    completedOrders: Number,
    cancelledOrders: Number,
    totalRevenue: Number,
    averageOrderValue: Number,
    customerCount: Number,
    repeatCustomers: Number,
    
    // Buyer metrics
    totalPurchases: Number,
    totalSpent: Number,
    averagePurchaseValue: Number,
    favoriteCategories: [String],
    
    // Platform metrics
    newUsers: Number,
    activeUsers: Number,
    totalOrdersPlatform: Number,
    totalRevenuePlatform: Number,
    popularCategories: [{
      category: String,
      count: Number
    }],
    popularProducts: [{
      product: String,
      sales: Number
    }],
    
    // Delivery metrics
    totalDeliveries: Number,
    onTimeDeliveries: Number,
    delayedDeliveries: Number,
    averageDeliveryTime: Number,
    
    // Financial metrics
    platformCommission: Number,
    totalTransactions: Number,
    paymentSuccessRate: Number
  },
  insights: [{
    title: String,
    description: String,
    type: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'recommendation']
    },
    action: String
  }],
  trends: {
    priceTrends: [{
      product: String,
      averagePrice: Number,
      date: Date
    }],
    demandTrends: [{
      category: String,
      demand: Number,
      date: Date
    }],
    seasonalTrends: [{
      product: String,
      season: String,
      averageSales: Number
    }]
  },
  forecasts: {
    demandForecast: [{
      product: String,
      predictedDemand: Number,
      confidence: Number,
      date: Date
    }],
    priceForecast: [{
      product: String,
      predictedPrice: Number,
      confidence: Number,
      date: Date
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analytics', analyticsSchema);