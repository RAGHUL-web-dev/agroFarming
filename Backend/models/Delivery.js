const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryId: {
    type: String,
    unique: true,
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTimeSlot: {
    start: String,
    end: String
  },
  actualPickupTime: Date,
  actualDeliveryTime: Date,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 
           'out_for_delivery', 'delivered', 'delayed', 'cancelled'],
    default: 'pending'
  },
  vehicleType: {
    type: String,
    enum: ['bike', 'car', 'van', 'truck', 'tempo', 'other']
  },
  vehicleNumber: String,
  driverDetails: {
    name: String,
    phone: String,
    licenseNumber: String
  },
  tracking: [{
    location: {
      lat: Number,
      lng: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: String,
    notes: String
  }],
  estimatedDistance: {
    type: Number, // in kilometers
    default: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  },
  actualDistance: Number,
  actualDuration: Number,
  deliveryProof: {
    signature: String,
    photo: String,
    receivedBy: String,
    relationship: String
  },
  issues: [{
    type: {
      type: String,
      enum: ['delay', 'damage', 'missing', 'wrong_item', 'other']
    },
    description: String,
    reportedBy: {
      type: String,
      enum: ['farmer', 'buyer', 'driver', 'admin']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }],
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate delivery ID before saving
deliverySchema.pre('save', function(next) {
  if (!this.deliveryId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.deliveryId = `DEL${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);