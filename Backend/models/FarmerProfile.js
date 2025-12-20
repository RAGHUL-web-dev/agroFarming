const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  farmName: {
    type: String,
    required: [true, 'Please provide a farm name']
  },
  farmDescription: String,
  farmSize: {
    value: Number,
    unit: {
      type: String,
      enum: ['acres', 'hectares', 'square-meters']
    }
  },
  farmingExperience: {
    type: Number, // in years
    default: 0
  },
  certifications: [{
    name: String,
    issuer: String,
    year: Number,
    certificateId: String
  }],
  livestockDetails: {
    animals: [{
      type: {
        type: String,
        enum: ['goat', 'cow', 'hen', 'duck', 'pig', 'rabbit']
      },
      count: Number,
      breed: String,
      purpose: [{
        type: String,
        enum: ['milk', 'meat', 'eggs', 'breeding', 'manure', 'other']
      }]
    }]
  },
  cropDetails: {
    crops: [{
      name: String,
      season: String,
      area: Number,
      unit: {
        type: String,
        enum: ['acres', 'hectares', 'square-meters']
      }
    }]
  },
  productionCapacity: {
    daily: {
      milk: Number, // in liters
      eggs: Number,
      vegetables: Number // in kg
    },
    monthly: {
      meat: Number, // in kg
      grains: Number // in kg
    }
  },
  businessDocuments: [{
    documentType: String,
    documentNumber: String,
    documentFile: String,
    expiryDate: Date
  }],
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
  isVerifiedFarmer: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String
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

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema);