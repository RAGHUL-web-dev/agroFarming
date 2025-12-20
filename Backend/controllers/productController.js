const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      qualityGrade,
      location,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by subcategory
    if (subcategory) {
      query.subcategory = subcategory;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Quality grade filter
    if (qualityGrade) {
      query.qualityGrade = qualityGrade;
    }

    // Location filter (city)
    if (location) {
      query['origin.location.city'] = new RegExp(location, 'i');
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }

    // Sort options
    let sort = {};
    if (sortBy === 'price') {
      sort.price = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'rating') {
      sort['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'popular') {
      sort.viewCount = -1;
    } else {
      sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .populate('farmer', 'name profileImage address')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort);

    const total = await Product.countDocuments(query);

    // Increment view count for each product
    products.forEach(product => {
      product.viewCount += 1;
      product.save();
    });

    res.json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('farmer', 'name email phone address profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    product.viewCount += 1;
    await product.save();

    // Get related products
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
    .limit(4)
    .populate('farmer', 'name');

    res.json({
      success: true,
      product,
      relatedProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Farmer only)
exports.createProduct = async (req, res) => {
  try {
    // Check if user is a farmer
    if (req.user.role !== 'farmer') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can create products'
      });
    }

    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file, index) => ({
        url: `/uploads/products/${file.filename}`,
        isPrimary: index === 0
      }));
    }

    const productData = {
      ...req.body,
      farmer: req.user.id,
      images
    };

    // Convert string values to numbers
    if (productData.price) productData.price = Number(productData.price);
    if (productData.quantity) productData.quantity = Number(productData.quantity);
    if (productData.availableQuantity) {
      productData.availableQuantity = Number(productData.availableQuantity);
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Farmer only)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        isPrimary: false
      }));
      product.images = [...product.images, ...newImages];
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'images') {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Farmer only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (product.farmer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    // Soft delete by setting isActive to false
    product.isActive = false;
    await product.save();

    res.json({
      success: true,
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true })
      .sort('displayOrder');

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get products by farmer
// @route   GET /api/products/farmer/:farmerId
// @access  Public
exports.getProductsByFarmer = async (req, res) => {
  try {
    const products = await Product.find({
      farmer: req.params.farmerId,
      isActive: true
    })
    .populate('farmer', 'name profileImage')
    .sort('-createdAt');

    const farmer = await User.findById(req.params.farmerId)
      .select('name profileImage address');

    res.json({
      success: true,
      farmer,
      products,
      count: products.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};