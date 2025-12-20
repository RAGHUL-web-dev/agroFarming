const mongoose = require('mongoose');

const buyerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: [true, 'Please provide a business name']
  },
  businessType: {
    type: String,
    enum: ['retailer', 'wholesaler', 'restaurant', 'hotel', 'distributor', 'other']
  },
  businessDescription: String,
  tinNumber: String,
  gstNumber: String,
  businessRegistration: {
    registrationNumber: String,
    registrationFile: String
  },
  preferredCategories: [{
    category: String,
    subcategory: String
  }],
  orderHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  averageOrderValue: {
    type: Number,
    default: 0
  },
  monthlyBudget: {
    type: Number,
    default: 0
  },
  deliveryPreferences: {
    preferredDays: [String],
    preferredTime: String,
    deliveryAddresses: [{
      address: String,
      isDefault: Boolean,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }]
  },
  paymentMethods: [{
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'card']
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isVerifiedBuyer: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BuyerProfile', buyerProfileSchema);