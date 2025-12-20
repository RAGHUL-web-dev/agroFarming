const { body } = require('express-validator');

// User validation
const userValidation = {
  register: [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid Indian phone number'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role').isIn(['farmer', 'buyer', 'admin']).withMessage('Invalid role')
  ],

  login: [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  updateProfile: [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
    body('address').optional().isObject().withMessage('Address must be an object')
  ]
};

// Product validation
const productValidation = {
  createProduct: [
    body('category')
      .isIn(['crop', 'goat', 'cow', 'hen', 'duck', 'pig', 'rabbit'])
      .withMessage('Invalid category'),
    body('subcategory').notEmpty().withMessage('Subcategory is required'),
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('availableQuantity').isInt({ min: 0 }).withMessage('Available quantity must be a positive number'),
    body('unit').isIn(['kg', 'liter', 'piece', 'dozen', 'gram', 'ton']).withMessage('Invalid unit'),
    body('qualityGrade')
      .optional()
      .isIn(['premium', 'grade-a', 'grade-b', 'standard'])
      .withMessage('Invalid quality grade')
  ],

  updateProduct: [
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('availableQuantity').optional().isInt({ min: 0 }).withMessage('Available quantity must be a positive number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
  ]
};

// Order validation
const orderValidation = {
  createOrder: [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.product').isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('deliveryAddress').isObject().withMessage('Delivery address is required'),
    body('deliveryDate').isISO8601().withMessage('Invalid delivery date'),
    body('paymentMethod')
      .isIn(['cash_on_delivery', 'bank_transfer', 'upi', 'card', 'wallet'])
      .withMessage('Invalid payment method')
  ],

  updateOrder: [
    body('status').optional().isIn([
      'pending', 'confirmed', 'processing', 'ready_for_delivery',
      'out_for_delivery', 'delivered', 'cancelled', 'returned'
    ]).withMessage('Invalid status'),
    body('paymentStatus').optional().isIn([
      'pending', 'partial', 'paid', 'refunded', 'failed'
    ]).withMessage('Invalid payment status')
  ]
};

// Farmer profile validation
const farmerValidation = {
  updateProfile: [
    body('farmName').optional().notEmpty().withMessage('Farm name cannot be empty'),
    body('farmingExperience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('productionCapacity.daily.milk').optional().isFloat({ min: 0 }),
    body('productionCapacity.daily.eggs').optional().isInt({ min: 0 }),
    body('productionCapacity.monthly.meat').optional().isFloat({ min: 0 })
  ]
};

// Buyer profile validation
const buyerValidation = {
  updateProfile: [
    body('businessName').optional().notEmpty().withMessage('Business name cannot be empty'),
    body('businessType').optional().isIn([
      'retailer', 'wholesaler', 'restaurant', 'hotel', 'distributor', 'other'
    ]).withMessage('Invalid business type'),
    body('monthlyBudget').optional().isFloat({ min: 0 }).withMessage('Budget must be positive'),
    // In productValidation.createProduct section
        body('qualityGrade')
        .optional()
        .isIn(['premium', 'grade-a', 'grade-b', 'standard']) // Updated
        .withMessage('Invalid quality grade')
        ]
        };

module.exports = {
  userValidation,
  productValidation,
  orderValidation,
  farmerValidation,
  buyerValidation
};