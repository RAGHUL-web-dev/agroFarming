const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Create delivery for an order
// @route   POST /api/deliveries
// @access  Private (Admin/Farmer)
exports.createDelivery = async (req, res) => {
  try {
    const { orderId, scheduledDate, vehicleType, driverDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if delivery already exists
    const existingDelivery = await Delivery.findOne({ order: orderId });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery already exists for this order'
      });
    }

    const delivery = await Delivery.create({
      order: orderId,
      farmer: order.farmer,
      buyer: order.buyer,
      pickupAddress: order.farmer.address || {},
      deliveryAddress: order.deliveryAddress,
      scheduledDate,
      vehicleType,
      driverDetails,
      status: 'pending'
    });

    // Update order status
    order.status = 'ready_for_delivery';
    order.delivery = delivery._id;
    await order.save();

    res.status(201).json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private
exports.getDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, assignedTo } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Filter based on user role
    if (req.user.role === 'farmer') {
      query.farmer = req.user.id;
    } else if (req.user.role === 'buyer') {
      query.buyer = req.user.id;
    } else if (req.user.role === 'driver') {
      query.assignedTo = req.user.id;
    }

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const deliveries = await Delivery.find(query)
      .populate('order', 'orderId totalAmount status')
      .populate('farmer', 'name phone')
      .populate('buyer', 'name phone')
      .populate('assignedTo', 'name phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Delivery.countDocuments(query);

    res.json({
      success: true,
      count: deliveries.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      deliveries
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single delivery
// @route   GET /api/deliveries/:id
// @access  Private
exports.getDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order')
      .populate('farmer', 'name phone address')
      .populate('buyer', 'name phone')
      .populate('assignedTo', 'name phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    const isFarmer = delivery.farmer._id.toString() === req.user.id;
    const isBuyer = delivery.buyer._id.toString() === req.user.id;
    const isAssignedDriver = delivery.assignedTo && 
      delivery.assignedTo._id.toString() === req.user.id;

    if (!isFarmer && !isBuyer && !isAssignedDriver && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this delivery'
      });
    }

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update delivery
// @route   PUT /api/deliveries/:id
// @access  Private (Admin/Farmer)
exports.updateDelivery = async (req, res) => {
  try {
    const { status, notes, actualPickupTime, actualDeliveryTime } = req.body;

    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && delivery.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this delivery'
      });
    }

    if (status) delivery.status = status;
    if (notes) delivery.notes = notes;
    if (actualPickupTime) delivery.actualPickupTime = actualPickupTime;
    if (actualDeliveryTime) delivery.actualDeliveryTime = actualDeliveryTime;

    // Update order status if delivery is completed
    if (status === 'delivered') {
      const order = await Order.findById(delivery.order);
      if (order) {
        order.status = 'delivered';
        order.actualDeliveryDate = new Date();
        await order.save();
      }
    }

    await delivery.save();

    res.json({
      success: true,
      delivery
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign driver to delivery
// @route   PUT /api/deliveries/:id/assign
// @access  Private (Admin only)
exports.assignDriver = async (req, res) => {
  try {
    const { driverId, vehicleNumber } = req.body;

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    delivery.assignedTo = driverId;
    delivery.vehicleNumber = vehicleNumber;
    delivery.status = 'assigned';

    // Add tracking entry
    delivery.tracking.push({
      location: delivery.pickupAddress.coordinates || { lat: 0, lng: 0 },
      status: 'assigned',
      notes: `Driver ${driver.name} assigned to delivery`
    });

    await delivery.save();

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      delivery
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update delivery tracking
// @route   PUT /api/deliveries/:id/tracking
// @access  Private (Admin/Driver)
exports.updateTracking = async (req, res) => {
  try {
    const { location, status, notes } = req.body;

    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check authorization
    const isAssignedDriver = delivery.assignedTo && 
      delivery.assignedTo.toString() === req.user.id;

    if (!isAssignedDriver && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update tracking'
      });
    }

    // Add tracking entry
    delivery.tracking.push({
      location,
      status,
      notes,
      timestamp: new Date()
    });

    // Update delivery status if provided
    if (status) {
      delivery.status = status;
      
      // Update actual times
      if (status === 'picked_up' && !delivery.actualPickupTime) {
        delivery.actualPickupTime = new Date();
      } else if (status === 'delivered' && !delivery.actualDeliveryTime) {
        delivery.actualDeliveryTime = new Date();
        
        // Update order status
        const order = await Order.findById(delivery.order);
        if (order) {
          order.status = 'delivered';
          order.actualDeliveryDate = new Date();
          await order.save();
        }
      }
    }

    await delivery.save();

    res.json({
      success: true,
      message: 'Tracking updated successfully',
      tracking: delivery.tracking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get delivery statistics
// @route   GET /api/deliveries/stats/admin
// @access  Private (Admin only)
exports.getDeliveryStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Delivery.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $facet: {
          statusStats: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          dailyStats: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                },
                deliveries: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                }
              }
            },
            { $sort: { _id: 1 } }
          ],
          driverStats: [
            {
              $match: { assignedTo: { $ne: null } }
            },
            {
              $group: {
                _id: '$assignedTo',
                deliveries: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                }
              }
            },
            { $sort: { deliveries: -1 } },
            { $limit: 10 }
          ],
          timeStats: [
            {
              $match: {
                actualDeliveryTime: { $ne: null },
                actualPickupTime: { $ne: null }
              }
            },
            {
              $addFields: {
                deliveryTime: {
                  $divide: [
                    { $subtract: ['$actualDeliveryTime', '$actualPickupTime'] },
                    60000 // Convert to minutes
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                averageDeliveryTime: { $avg: '$deliveryTime' },
                fastestDelivery: { $min: '$deliveryTime' },
                slowestDelivery: { $max: '$deliveryTime' }
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