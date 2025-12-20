const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['crop', 'animal'],
    required: true
  },
  description: String,
  image: String,
  subcategories: [{
    name: {
      type: String,
      required: true
    },
    products: [{
      type: String,
      enum: ['milk', 'meat', 'eggs', 'live_animal', 'manure', 
             'ghee', 'curd', 'dung_cakes', 'chicks', 'piglets',
             'breeding_rabbits', 'vegetables', 'fruits', 'grains']
    }],
    units: [String],
    qualityGrades: [String],
    image: String,
    active: {
      type: Boolean,
      default: true
    }
  }],
  features: [String],
  active: {
    type: Boolean,
    default: true
  },
  displayOrder: {
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

module.exports = mongoose.model('Category', categorySchema);