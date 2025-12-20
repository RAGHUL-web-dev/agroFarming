const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unit: String,
    price: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryAddress: {
    type: String,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  preferredTimeSlot: {
    start: String,
    end: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'ready_for_delivery', 
           'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_delivery', 'bank_transfer', 'upi', 'card', 'wallet'],
    required: true
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    paymentAmount: Number
  },
  notes: {
    farmerNotes: String,
    buyerNotes: String,
    deliveryNotes: String
  },
  rating: {
    farmerRating: {
      type: Number,
      min: 0,
      max: 5
    },
    productRating: {
      type: Number,
      min: 0,
      max: 5
    },
    deliveryRating: {
      type: Number,
      min: 0,
      max: 5
    },
    review: String
  },
  delivery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery'
  },
  cancellationReason: {
    type: String,
    enum: ['buyer_cancelled', 'farmer_cancelled', 'delivery_issue', 'other']
  },
  cancellationNotes: String,
  estimatedDeliveryDate: Date,
  actualDeliveryDate: Date,
  
  // Farmer approval system fields
  requiresApproval: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'negotiating'],
    default: 'pending'
  },
  negotiationDetails: {
    proposedPrice: Number,
    proposedQuantity: Number,
    farmerMessage: String,
    buyerMessage: String,
    counterOffers: [{
      price: Number,
      quantity: Number,
      message: String,
      offeredBy: {
        type: String,
        enum: ['farmer', 'buyer']
      },
      offeredAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected']
      }
    }]
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

// Generate order ID before saving
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `ORD${timestamp}${random}`;
  }
  
  // Set initial status based on whether farmer approval is required
  if (this.isNew && this.status === 'pending') {
    this.requiresApproval = true;
    this.approvalStatus = 'pending';
  }
  
  next();
});

// Update timestamp on update
orderSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Order', orderSchema);