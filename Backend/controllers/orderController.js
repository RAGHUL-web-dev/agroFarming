const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer only)
// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Buyer only)
exports.createOrder = async (req, res) => {
  try {
    if (req.user.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Only buyers can place orders'
      });
    }

    const { items, deliveryAddress, deliveryDate, paymentMethod, notes } = req.body;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one item to the order'
      });
    }

    // Check if all products exist and are available
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Calculate subtotal and validate quantities
    let subtotal = 0;
    const orderItems = [];
    const farmerIds = new Set();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = products.find(p => p._id.toString() === item.product);

      // Check if product is active
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`
        });
      }

      // Check if requested quantity is available
      if (item.quantity > product.availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for "${product.name}". Available: ${product.availableQuantity}`
        });
      }

      // Check min/max order quantity
      if (item.quantity < product.minOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for "${product.name}" is ${product.minOrderQuantity}`
        });
      }

      if (product.maxOrderQuantity && item.quantity > product.maxOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Maximum order quantity for "${product.name}" is ${product.maxOrderQuantity}`
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        unit: product.unit,
        price: product.price,
        subtotal: itemSubtotal
      });

      farmerIds.add(product.farmer.toString());
    }

    // Check if all items are from the same farmer
    if (farmerIds.size > 1) {
      return res.status(400).json({
        success: false,
        message: 'All items in an order must be from the same farmer'
      });
    }

    const farmerId = Array.from(farmerIds)[0];

    // Calculate delivery fee (simplified calculation)
    const deliveryFee = subtotal > 500 ? 0 : 50; // Free delivery above 500
    const tax = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + deliveryFee + tax;

    // Prepare order data WITHOUT orderId (let MongoDB generate it)
    const orderData = {
      buyer: req.user.id,
      farmer: farmerId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      deliveryAddress,
      deliveryDate: new Date(deliveryDate),
      paymentMethod,
      notes: {
        buyerNotes: notes
      },
      status: 'pending',
      paymentStatus: 'pending',
      requiresApproval: true,
      approvalStatus: 'pending'
    };

    // Create order
    const order = await Order.create(orderData);

    // Update product quantities
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = products.find(p => p._id.toString() === item.product);
      
      product.availableQuantity -= item.quantity;
      await product.save();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get buyer's orders
// @route   GET /api/orders/buyer
// @access  Private (Buyer only)
exports.getBuyerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { buyer: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('farmer', 'name profileImage phone')
      .populate('items.product', 'name images category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email phone')
      .populate('farmer', 'name email phone address')
      .populate('items.product', 'name images')
      .populate('delivery');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    if (order.buyer._id.toString() !== req.user.id && 
        order.farmer._id.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

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

// @desc    Update order (cancel, add rating, etc.)
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const { action, rating, review } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isBuyer = order.buyer.toString() === req.user.id;
    const isFarmer = order.farmer.toString() === req.user.id;

    if (!isBuyer && !isFarmer && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    switch (action) {
      case 'cancel':
        if (!isBuyer && !isFarmer) {
          return res.status(403).json({
            success: false,
            message: 'Only buyer or farmer can cancel the order'
          });
        }
        
        if (order.status === 'delivered' || order.status === 'cancelled') {
          return res.status(400).json({
            success: false,
            message: `Order cannot be cancelled in ${order.status} status`
          });
        }

        order.status = 'cancelled';

        // Restore product quantities
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.availableQuantity += item.quantity;
            await product.save();
          }
        }
        break;

      case 'rate':
        if (!isBuyer) {
          return res.status(403).json({
            success: false,
            message: 'Only buyer can rate the order'
          });
        }

        if (order.status !== 'delivered') {
          return res.status(400).json({
            success: false,
            message: 'Can only rate delivered orders'
          });
        }

        order.rating = {
          farmerRating: rating.farmerRating,
          productRating: rating.productRating,
          deliveryRating: rating.deliveryRating,
          review
        };

        // Update farmer rating
        const farmer = await User.findById(order.farmer);
        if (farmer) {
          // In real implementation, you'd want to store ratings separately
          // and calculate average properly
        }
        break;

      case 'update_payment':
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Only admin can update payment status'
          });
        }
        order.paymentStatus = req.body.paymentStatus;
        if (req.body.transactionId) {
          order.paymentDetails = {
            transactionId: req.body.transactionId,
            paymentDate: new Date(),
            paymentAmount: order.totalAmount
          };
        }
        break;
    }

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

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private (Admin only)
exports.getOrderStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access order statistics'
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $facet: {
          dailyStats: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                orders: { $sum: 1 },
                revenue: { $sum: "$totalAmount" },
                averageOrderValue: { $avg: "$totalAmount" }
              }
            },
            { $sort: { _id: 1 } }
          ],
          statusStats: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          farmerStats: [
            {
              $group: {
                _id: "$farmer",
                orders: { $sum: 1 },
                revenue: { $sum: "$totalAmount" }
              }
            },
            { $sort: { orders: -1 } },
            { $limit: 10 }
          ],
          categoryStats: [
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
                orders: { $sum: 1 },
                revenue: { $sum: "$items.subtotal" }
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// @desc    Farmer approves or rejects order
// @route   PUT /api/orders/:id/approve
// @access  Private (Farmer only)
exports.approveOrder = async (req, res) => {
  try {
    const { action, message, proposedPrice, proposedQuantity } = req.body;
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the farmer for this order
    if (order.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this order'
      });
    }

    // Check if order is in pending approval status
    if (order.approvalStatus !== 'pending' && order.approvalStatus !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending approval status'
      });
    }

    switch (action) {
      case 'approve':
        order.approvalStatus = 'approved';
        order.status = 'confirmed';
        order.requiresApproval = false;
        
        // Log the approval
        if (message) {
          order.notes.farmerNotes = message;
        }
        break;

      case 'reject':
        order.approvalStatus = 'rejected';
        order.status = 'cancelled';
        order.cancellationReason = 'farmer_rejected';
        order.cancellationNotes = message || 'Order rejected by farmer';
        
        // Restore product quantities
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.availableQuantity += item.quantity;
            await product.save();
          }
        }
        break;

      case 'negotiate':
        order.approvalStatus = 'negotiating';
        
        // Store negotiation details
        order.negotiationDetails = {
          proposedPrice: proposedPrice || order.totalAmount,
          proposedQuantity: proposedQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0),
          farmerMessage: message,
          buyerMessage: '',
          counterOffers: [{
            price: proposedPrice || order.totalAmount,
            quantity: proposedQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0),
            message: message,
            offeredBy: 'farmer',
            status: 'pending'
          }]
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await order.save();

    res.json({
      success: true,
      message: `Order ${action} successfully`,
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

// @desc    Buyer responds to negotiation
// @route   PUT /api/orders/:id/negotiate
// @access  Private (Buyer only)
exports.respondToNegotiation = async (req, res) => {
  try {
    const { action, message, acceptPrice, acceptQuantity } = req.body;
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer for this order
    if (order.buyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to negotiate this order'
      });
    }

    // Check if order is in negotiation status
    if (order.approvalStatus !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in negotiation status'
      });
    }

    switch (action) {
      case 'accept':
        // Accept the farmer's proposal
        order.approvalStatus = 'approved';
        order.status = 'confirmed';
        order.requiresApproval = false;
        
        // Update order amounts if price was negotiated
        if (order.negotiationDetails.proposedPrice) {
          const priceDifference = order.negotiationDetails.proposedPrice - order.totalAmount;
          order.totalAmount = order.negotiationDetails.proposedPrice;
          order.subtotal += priceDifference;
        }
        
        // Update quantities if negotiated
        if (order.negotiationDetails.proposedQuantity) {
          // Adjust product quantities
          const originalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const quantityRatio = order.negotiationDetails.proposedQuantity / originalQuantity;
          
          order.items.forEach(item => {
            item.quantity = Math.floor(item.quantity * quantityRatio);
            item.subtotal = item.price * item.quantity;
          });
          
          order.subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);
          order.totalAmount = order.subtotal + order.deliveryFee + order.tax;
        }
        break;

      case 'reject':
        order.approvalStatus = 'rejected';
        order.status = 'cancelled';
        order.cancellationReason = 'buyer_rejected_negotiation';
        order.cancellationNotes = message || 'Buyer rejected negotiation';
        
        // Restore product quantities
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.availableQuantity += item.quantity;
            await product.save();
          }
        }
        break;

      case 'counter':
        // Add counter offer
        const counterOffer = {
          price: acceptPrice || order.totalAmount,
          quantity: acceptQuantity || order.items.reduce((sum, item) => sum + item.quantity, 0),
          message: message,
          offeredBy: 'buyer',
          status: 'pending'
        };
        
        if (!order.negotiationDetails.counterOffers) {
          order.negotiationDetails.counterOffers = [];
        }
        
        order.negotiationDetails.counterOffers.push(counterOffer);
        order.negotiationDetails.buyerMessage = message;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await order.save();

    res.json({
      success: true,
      message: `Negotiation ${action} successfully`,
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

// @desc    Get orders pending farmer approval
// @route   GET /api/farmers/orders/pending-approval
// @access  Private (Farmer only)
exports.getPendingApprovalOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      farmer: req.user.id,
      approvalStatus: { $in: ['pending', 'negotiating'] }
    };

    const orders = await Order.find(query)
      .populate('buyer', 'name email phone businessName')
      .populate('items.product', 'name images category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      orders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};