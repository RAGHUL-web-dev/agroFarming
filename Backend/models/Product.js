const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['crop', 'goat', 'cow', 'hen', 'duck', 'pig', 'rabbit']
  },
  subcategory: {
    type: String,
    required: [true, 'Please select a subcategory']
  },
  name: {
    type: String,
    required: [true, 'Please provide a product name']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: 0
  },
  unit: {
    type: String,
    required: [true, 'Please provide a unit'],
    enum: ['kg', 'liter', 'piece', 'dozen', 'gram', 'ton']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    min: 0
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Please provide available quantity'],
    min: 0
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  maxOrderQuantity: {
    type: Number,
    default: null
  },
  images: [{
    url: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  qualityGrade: {
    type: String,
    enum: ['premium', 'grade-a', 'grade-b', 'standard', 'organic'], // Added 'organic'
    default: 'standard'
    },
  certifications: [{
    name: String,
    issuer: String
  }],
  origin: {
    farmName: String,
    location: {
      city: String,
      state: String,
      country: String
    },
    harvestDate: Date,
    processingMethod: String
  },
  animalDetails: {
    breed: String,
    age: Number,
    ageUnit: {
      type: String,
      enum: ['days', 'months', 'years']
    },
    weight: Number,
    feedType: String,
    healthStatus: String
  },
  cropDetails: {
    variety: String,
    season: String,
    organic: {
      type: Boolean,
      default: false
    },
    pesticideFree: {
      type: Boolean,
      default: false
    },
    harvestMethod: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isNegotiable: {
    type: Boolean,
    default: false
  },
  tags: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  viewCount: {
    type: Number,
    default: 0
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

// Indexes for better query performance
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ farmer: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'origin.location.city': 1 });

module.exports = mongoose.model('Product', productSchema);