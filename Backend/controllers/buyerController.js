const BuyerProfile = require('../models/BuyerProfile');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @desc    Get buyer profile
// @route   GET /api/buyers/profile
// @access  Private (Buyer only)
exports.getBuyerProfile = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOne({ user: req.user.id })
      .populate('user', 'name email phone address profileImage');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Buyer profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update buyer profile
// @route   PUT /api/buyers/profile
// @access  Private (Buyer only)
exports.updateBuyerProfile = async (req, res) => {
  try {
    let profile = await BuyerProfile.findOne({ user: req.user.id });

    if (!profile) {
      profile = await BuyerProfile.create({
        user: req.user.id,
        ...req.body
      });
    } else {
      profile = await BuyerProfile.findOneAndUpdate(
        { user: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get buyer dashboard stats
// @route   GET /api/buyers/dashboard
// @access  Private (Buyer only)
exports.getBuyerDashboard = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get stats in parallel
    const [
      totalOrders,
      pendingOrders,
      recentOrders,
      spendingStats,
      favoriteFarmers
    ] = await Promise.all([
      Order.countDocuments({ buyer: req.user.id }),
      Order.countDocuments({ buyer: req.user.id, status: 'pending' }),
      Order.find({ buyer: req.user.id })
        .populate('farmer', 'name profileImage')
        .sort('-createdAt')
        .limit(5),
      Order.aggregate([
        { $match: { 
          buyer: req.user._id,
          createdAt: { $gte: thirtyDaysAgo }
        }},
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$totalAmount' },
            averageOrderValue: { $avg: '$totalAmount' },
            orderCount: { $sum: 1 }
          }
        }
      ]),
      Order.aggregate([
        { $match: { buyer: req.user._id } },
        {
          $group: {
            _id: '$farmer',
            orderCount: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' }
          }
        },
        { $sort: { orderCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'farmer'
          }
        },
        { $unwind: '$farmer' },
        {
          $project: {
            farmer: {
              _id: 1,
              name: 1,
              profileImage: 1
            },
            orderCount: 1,
            totalSpent: 1
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        totalSpent: spendingStats[0]?.totalSpent || 0,
        averageOrderValue: spendingStats[0]?.averageOrderValue || 0,
        recentOrderCount: spendingStats[0]?.orderCount || 0
      },
      recentOrders,
      favoriteFarmers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get buyer's favorite products
// @route   GET /api/buyers/favorites
// @access  Private (Buyer only)
exports.getFavorites = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile || !profile.favorites) {
      return res.json({
        success: true,
        favorites: []
      });
    }

    // Get favorite products
    const favoriteProducts = await Product.find({
      _id: { $in: profile.favorites },
      isActive: true
    })
    .populate('farmer', 'name profileImage')
    .sort('-createdAt');

    res.json({
      success: true,
      favorites: favoriteProducts,
      count: favoriteProducts.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add product to favorites
// @route   POST /api/buyers/favorites
// @access  Private (Buyer only)
exports.addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = await BuyerProfile.create({
        user: req.user.id,
        favorites: [productId]
      });
    } else {
      if (!profile.favorites) {
        profile.favorites = [];
      }
      
      // Check if already in favorites
      if (!profile.favorites.includes(productId)) {
        profile.favorites.push(productId);
        await profile.save();
      }
    }

    res.json({
      success: true,
      message: 'Product added to favorites',
      favorites: profile.favorites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove product from favorites
// @route   DELETE /api/buyers/favorites/:productId
// @access  Private (Buyer only)
exports.removeFromFavorites = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile || !profile.favorites) {
      return res.status(404).json({
        success: false,
        message: 'No favorites found'
      });
    }

    profile.favorites = profile.favorites.filter(
      id => id.toString() !== req.params.productId
    );
    await profile.save();

    res.json({
      success: true,
      message: 'Product removed from favorites',
      favorites: profile.favorites
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get buyer's cart
// @route   GET /api/buyers/cart
// @access  Private (Buyer only)
exports.getCart = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile || !profile.cart || profile.cart.length === 0) {
      return res.json({
        success: true,
        cart: [],
        total: 0
      });
    }

    // Get cart items with product details
    const cartItems = [];
    let total = 0;

    for (const item of profile.cart) {
      const product = await Product.findById(item.product)
        .populate('farmer', 'name');

      if (product && product.isActive) {
        const itemTotal = product.price * item.quantity;
        cartItems.push({
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            availableQuantity: product.availableQuantity,
            images: product.images,
            farmer: product.farmer
          },
          quantity: item.quantity,
          subtotal: itemTotal
        });
        total += itemTotal;
      }
    }

    res.json({
      success: true,
      cart: cartItems,
      total,
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add item to cart
// @route   POST /api/buyers/cart
// @access  Private (Buyer only)
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check quantity
    if (quantity > product.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.availableQuantity} items available`
      });
    }

    let profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile) {
      profile = await BuyerProfile.create({
        user: req.user.id,
        cart: [{ product: productId, quantity }]
      });
    } else {
      if (!profile.cart) {
        profile.cart = [];
      }
      
      // Check if product already in cart
      const existingItemIndex = profile.cart.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = profile.cart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.availableQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot add ${quantity} more items. Maximum available: ${product.availableQuantity}`
          });
        }
        profile.cart[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        profile.cart.push({ product: productId, quantity });
      }

      await profile.save();
    }

    res.json({
      success: true,
      message: 'Product added to cart',
      cart: profile.cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update cart item
// @route   PUT /api/buyers/cart
// @access  Private (Buyer only)
exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or unavailable'
      });
    }

    // Check quantity
    if (quantity > product.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.availableQuantity} items available`
      });
    }

    const profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile || !profile.cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const itemIndex = profile.cart.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      profile.cart.splice(itemIndex, 1);
    } else {
      profile.cart[itemIndex].quantity = quantity;
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Cart updated successfully',
      cart: profile.cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/buyers/cart/:productId
// @access  Private (Buyer only)
exports.removeFromCart = async (req, res) => {
  try {
    const profile = await BuyerProfile.findOne({ user: req.user.id });
    
    if (!profile || !profile.cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const initialLength = profile.cart.length;
    profile.cart = profile.cart.filter(
      item => item.product.toString() !== req.params.productId
    );

    if (profile.cart.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Product removed from cart',
      cart: profile.cart
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};