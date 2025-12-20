const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const FarmerProfile = require('../models/FarmerProfile');
const BuyerProfile = require('../models/BuyerProfile');
const Product = require('../models/Product');

const connectDB = require('../config/database');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await FarmerProfile.deleteMany({});
    await BuyerProfile.deleteMany({});
    await Product.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@agroforms.com',
      phone: '9876543210',
      password: adminPassword,
      role: 'admin',
      isVerified: true
    });
    console.log('Created admin user');

    // Create categories
    const categories = [
      {
        name: 'crop',
        type: 'crop',
        description: 'Agricultural crops including vegetables, fruits, and grains',
        image: '/images/crops.jpg',
        subcategories: [
          {
            name: 'vegetables',
            products: ['vegetables'],
            units: ['kg', 'gram', 'ton'],
            qualityGrades: ['premium', 'grade-a', 'grade-b', 'standard']
          },
          {
            name: 'fruits',
            products: ['fruits'],
            units: ['kg', 'gram', 'ton'],
            qualityGrades: ['premium', 'grade-a', 'grade-b', 'standard']
          },
          {
            name: 'grains',
            products: ['grains'],
            units: ['kg', 'gram', 'ton'],
            qualityGrades: ['premium', 'grade-a', 'grade-b', 'standard']
          }
        ],
        features: ['Fresh Produce', 'Seasonal Varieties', 'Organic Options'],
        displayOrder: 1
      },
      {
        name: 'goat',
        type: 'animal',
        description: 'Goat farming products including milk, meat, and live animals',
        image: '/images/goat.jpg',
        subcategories: [
          {
            name: 'milk',
            products: ['milk'],
            units: ['liter'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'meat',
            products: ['meat'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'live_animals',
            products: ['live_animal'],
            units: ['piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Fresh Milk', 'Healthy Animals', 'Quality Meat'],
        displayOrder: 2
      },
      {
        name: 'cow',
        type: 'animal',
        description: 'Cow dairy products and by-products',
        image: '/images/cow.jpg',
        subcategories: [
          {
            name: 'milk',
            products: ['milk'],
            units: ['liter'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'ghee',
            products: ['ghee'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'curd',
            products: ['curd'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Fresh Dairy', 'Pure Ghee', 'Homemade Products'],
        displayOrder: 3
      },
      {
        name: 'hen',
        type: 'animal',
        description: 'Poultry products including eggs and meat',
        image: '/images/hen.jpg',
        subcategories: [
          {
            name: 'eggs',
            products: ['eggs'],
            units: ['dozen', 'piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'meat',
            products: ['meat'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'chicks',
            products: ['chicks'],
            units: ['piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Fresh Eggs', 'Quality Meat', 'Healthy Chicks'],
        displayOrder: 4
      },
      {
        name: 'duck',
        type: 'animal',
        description: 'Duck farming products',
        image: '/images/duck.jpg',
        subcategories: [
          {
            name: 'eggs',
            products: ['eggs'],
            units: ['dozen', 'piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'meat',
            products: ['meat'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Duck Eggs', 'Duck Meat'],
        displayOrder: 5
      },
      {
        name: 'pig',
        type: 'animal',
        description: 'Pig farming products',
        image: '/images/pig.jpg',
        subcategories: [
          {
            name: 'meat',
            products: ['meat'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'piglets',
            products: ['piglets'],
            units: ['piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Pork', 'Live Piglets'],
        displayOrder: 6
      },
      {
        name: 'rabbit',
        type: 'animal',
        description: 'Rabbit farming products',
        image: '/images/rabbit.jpg',
        subcategories: [
          {
            name: 'meat',
            products: ['meat'],
            units: ['kg', 'gram'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          },
          {
            name: 'breeding_rabbits',
            products: ['breeding_rabbits'],
            units: ['piece'],
            qualityGrades: ['premium', 'grade-a', 'standard']
          }
        ],
        features: ['Rabbit Meat', 'Breeding Rabbits'],
        displayOrder: 7
      }
    ];

    await Category.insertMany(categories);
    console.log('Created categories');

    // Create sample farmers
    const farmer1Password = await bcrypt.hash('farmer123', 10);
    const farmer1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '9876543211',
      password: farmer1Password,
      role: 'farmer',
      farmerType: 'crop',
      address: {
        street: 'Farm Road',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411001',
        country: 'India'
      },
      isVerified: true
    });

    await FarmerProfile.create({
      user: farmer1._id,
      farmName: 'Rajesh Organic Farm',
      farmDescription: 'Organic vegetable and fruit farm',
      farmingExperience: 10,
      cropDetails: {
        crops: [
          { name: 'Tomatoes', season: 'All', area: 5, unit: 'acres' },
          { name: 'Potatoes', season: 'Winter', area: 3, unit: 'acres' },
          { name: 'Wheat', season: 'Winter', area: 10, unit: 'acres' }
        ]
      },
      productionCapacity: {
        daily: {
          vegetables: 500 // kg
        },
        monthly: {
          grains: 5000 // kg
        }
      },
      isVerifiedFarmer: true,
      verificationStatus: 'verified'
    });

    const farmer2Password = await bcrypt.hash('farmer123', 10);
    const farmer2 = await User.create({
      name: 'Mohan Singh',
      email: 'mohan@example.com',
      phone: '9876543212',
      password: farmer2Password,
      role: 'farmer',
      farmerType: 'livestock',
      address: {
        street: 'Dairy Lane',
        city: 'Nagpur',
        state: 'Maharashtra',
        zipCode: '440001',
        country: 'India'
      },
      isVerified: true
    });

    await FarmerProfile.create({
      user: farmer2._id,
      farmName: 'Mohan Dairy Farm',
      farmDescription: 'Premium dairy and livestock farm',
      farmingExperience: 15,
      livestockDetails: {
        animals: [
          { type: 'cow', count: 50, breed: 'Jersey', purpose: ['milk'] },
          { type: 'goat', count: 30, breed: 'Saanen', purpose: ['milk'] },
          { type: 'hen', count: 200, breed: 'Kadaknath', purpose: ['eggs', 'meat'] }
        ]
      },
      productionCapacity: {
        daily: {
          milk: 200, // liters
          eggs: 150 // pieces
        },
        monthly: {
          meat: 100 // kg
        }
      },
      isVerifiedFarmer: true,
      verificationStatus: 'verified'
    });

    // Create poultry farmer
    const farmer3Password = await bcrypt.hash('farmer123', 10);
    const farmer3 = await User.create({
      name: 'Suresh Patel',
      email: 'suresh@example.com',
      phone: '9876543214',
      password: farmer3Password,
      role: 'farmer',
      farmerType: 'poultry',
      address: {
        street: 'Poultry Farm Road',
        city: 'Nashik',
        state: 'Maharashtra',
        zipCode: '422001',
        country: 'India'
      },
      isVerified: true
    });

    await FarmerProfile.create({
      user: farmer3._id,
      farmName: 'Patel Poultry Farm',
      farmDescription: 'Premium poultry farm with organic feed',
      farmingExperience: 8,
      livestockDetails: {
        animals: [
          { type: 'hen', count: 500, breed: 'White Leghorn', purpose: ['eggs'] },
          { type: 'duck', count: 100, breed: 'Khaki Campbell', purpose: ['eggs'] },
          { type: 'rabbit', count: 50, breed: 'New Zealand White', purpose: ['meat', 'breeding'] }
        ]
      },
      productionCapacity: {
        daily: {
          eggs: 400 // pieces
        },
        monthly: {
          meat: 200 // kg
        }
      },
      isVerifiedFarmer: true,
      verificationStatus: 'verified'
    });

    console.log('Created sample farmers');

    // Create sample products
    const products = [
      // Farmer 1 - Crop products
      {
        farmer: farmer1._id,
        category: 'crop',
        subcategory: 'vegetables',
        name: 'Fresh Tomatoes',
        description: 'Fresh tomatoes grown with natural fertilizers',
        price: 40,
        unit: 'kg',
        quantity: 1000,
        availableQuantity: 800,
        minOrderQuantity: 1,
        qualityGrade: 'premium',
        cropDetails: {
          variety: 'Hybrid',
          season: 'All',
          organic: true,
          pesticideFree: true,
          harvestMethod: 'Hand-picked'
        },
        origin: {
          farmName: 'Rajesh Organic Farm',
          location: {
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India'
          },
          harvestDate: new Date()
        },
        isActive: true,
        isNegotiable: true,
        tags: ['fresh', 'vegetables', 'tomatoes']
      },
      {
        farmer: farmer1._id,
        category: 'crop',
        subcategory: 'vegetables',
        name: 'Premium Potatoes',
        description: 'High quality potatoes, perfect for cooking',
        price: 25,
        unit: 'kg',
        quantity: 500,
        availableQuantity: 500,
        minOrderQuantity: 5,
        qualityGrade: 'grade-a',
        cropDetails: {
          variety: 'Local',
          season: 'Winter',
          organic: false,
          pesticideFree: true,
          harvestMethod: 'Machine harvested'
        },
        origin: {
          farmName: 'Rajesh Organic Farm',
          location: {
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India'
          },
          harvestDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        isActive: true,
        isNegotiable: true,
        tags: ['fresh', 'potatoes', 'winter']
      },
      {
        farmer: farmer1._id,
        category: 'crop',
        subcategory: 'grains',
        name: 'Organic Wheat',
        description: 'High quality organic wheat grains',
        price: 30,
        unit: 'kg',
        quantity: 2000,
        availableQuantity: 1500,
        minOrderQuantity: 10,
        qualityGrade: 'premium',
        cropDetails: {
          variety: 'Durum',
          season: 'Winter',
          organic: true,
          pesticideFree: true,
          harvestMethod: 'Combined'
        },
        origin: {
          farmName: 'Rajesh Organic Farm',
          location: {
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India'
          },
          harvestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        isActive: true,
        isNegotiable: true,
        tags: ['organic', 'wheat', 'grains']
      },

      // Farmer 2 - Dairy products
      {
        farmer: farmer2._id,
        category: 'cow',
        subcategory: 'milk',
        name: 'Fresh Cow Milk',
        description: 'Pure, fresh cow milk from grass-fed cows',
        price: 60,
        unit: 'liter',
        quantity: 200,
        availableQuantity: 150,
        minOrderQuantity: 1,
        qualityGrade: 'premium',
        animalDetails: {
          breed: 'Jersey',
          age: 4,
          ageUnit: 'years',
          feedType: 'Grass and grains',
          healthStatus: 'Excellent'
        },
        origin: {
          farmName: 'Mohan Dairy Farm',
          location: {
            city: 'Nagpur',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Freshly milked, pasteurized'
        },
        isActive: true,
        isNegotiable: false,
        tags: ['milk', 'dairy', 'fresh']
      },
      {
        farmer: farmer2._id,
        category: 'goat',
        subcategory: 'milk',
        name: 'Goat Milk',
        description: 'Nutritious goat milk, rich in vitamins',
        price: 80,
        unit: 'liter',
        quantity: 100,
        availableQuantity: 80,
        minOrderQuantity: 1,
        qualityGrade: 'premium',
        animalDetails: {
          breed: 'Saanen',
          age: 3,
          ageUnit: 'years',
          feedType: 'Organic feed',
          healthStatus: 'Very good'
        },
        origin: {
          farmName: 'Mohan Dairy Farm',
          location: {
            city: 'Nagpur',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Freshly milked'
        },
        isActive: true,
        isNegotiable: true,
        tags: ['goat milk', 'nutritious', 'dairy']
      },
      {
        farmer: farmer2._id,
        category: 'cow',
        subcategory: 'ghee',
        name: 'Pure Cow Ghee',
        description: 'Traditional method prepared pure cow ghee',
        price: 600,
        unit: 'kg',
        quantity: 50,
        availableQuantity: 40,
        minOrderQuantity: 0.5,
        qualityGrade: 'premium',
        origin: {
          farmName: 'Mohan Dairy Farm',
          location: {
            city: 'Nagpur',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Traditional bilona method'
        },
        isActive: true,
        isNegotiable: false,
        tags: ['ghee', 'pure', 'traditional']
      },

      // Farmer 3 - Poultry products
      {
        farmer: farmer3._id,
        category: 'hen',
        subcategory: 'eggs',
        name: 'Farm Fresh Eggs',
        description: 'Fresh eggs from free-range hens',
        price: 80,
        unit: 'dozen',
        quantity: 100,
        availableQuantity: 80,
        minOrderQuantity: 1,
        qualityGrade: 'premium',
        animalDetails: {
          breed: 'White Leghorn',
          age: 1,
          ageUnit: 'years',
          feedType: 'Organic grains',
          healthStatus: 'Excellent'
        },
        origin: {
          farmName: 'Patel Poultry Farm',
          location: {
            city: 'Nashik',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Collected daily, cleaned'
        },
        isActive: true,
        isNegotiable: true,
        tags: ['eggs', 'fresh', 'poultry']
      },
      {
        farmer: farmer3._id,
        category: 'duck',
        subcategory: 'eggs',
        name: 'Duck Eggs',
        description: 'Nutritious duck eggs, larger than chicken eggs',
        price: 100,
        unit: 'dozen',
        quantity: 50,
        availableQuantity: 40,
        minOrderQuantity: 1,
        qualityGrade: 'grade-a',
        animalDetails: {
          breed: 'Khaki Campbell',
          age: 1.5,
          ageUnit: 'years',
          feedType: 'Mixed grains',
          healthStatus: 'Good'
        },
        origin: {
          farmName: 'Patel Poultry Farm',
          location: {
            city: 'Nashik',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Collected daily'
        },
        isActive: true,
        isNegotiable: true,
        tags: ['duck eggs', 'nutritious', 'large']
      },
      {
        farmer: farmer3._id,
        category: 'rabbit',
        subcategory: 'meat',
        name: 'Rabbit Meat',
        description: 'Lean, healthy rabbit meat',
        price: 400,
        unit: 'kg',
        quantity: 30,
        availableQuantity: 25,
        minOrderQuantity: 0.5,
        qualityGrade: 'premium',
        animalDetails: {
          breed: 'New Zealand White',
          age: 6,
          ageUnit: 'months',
          feedType: 'Organic pellets and greens',
          healthStatus: 'Excellent'
        },
        origin: {
          farmName: 'Patel Poultry Farm',
          location: {
            city: 'Nashik',
            state: 'Maharashtra',
            country: 'India'
          },
          processingMethod: 'Freshly processed, hygienic'
        },
        isActive: true,
        isNegotiable: true,
        tags: ['rabbit meat', 'lean', 'healthy']
      }
    ];

    await Product.insertMany(products);
    console.log('Created sample products');

    // Create sample buyer
    const buyerPassword = await bcrypt.hash('buyer123', 10);
    const buyer = await User.create({
      name: 'Amit Sharma',
      email: 'amit@example.com',
      phone: '9876543213',
      password: buyerPassword,
      role: 'buyer',
      address: {
        street: 'Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        country: 'India'
      },
      isVerified: true
    });

    await BuyerProfile.create({
      user: buyer._id,
      businessName: 'Sharma Grocery Store',
      businessType: 'retailer',
      businessDescription: 'Retail grocery store serving local community',
      preferredCategories: [
        { category: 'crop', subcategory: 'vegetables' },
        { category: 'cow', subcategory: 'milk' },
        { category: 'hen', subcategory: 'eggs' }
      ],
      monthlyBudget: 50000,
      deliveryPreferences: {
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTime: '10:00-14:00',
        deliveryAddresses: [{
          address: 'Market Street, Mumbai, Maharashtra 400001',
          isDefault: true
        }]
      },
      paymentMethods: ['cash', 'bank_transfer', 'upi'],
      isVerifiedBuyer: true
    });

    // Create another buyer
    const buyer2Password = await bcrypt.hash('buyer123', 10);
    const buyer2 = await User.create({
      name: 'Priya Mehta',
      email: 'priya@example.com',
      phone: '9876543215',
      password: buyer2Password,
      role: 'buyer',
      address: {
        street: 'Restaurant Lane',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411002',
        country: 'India'
      },
      isVerified: true
    });

    await BuyerProfile.create({
      user: buyer2._id,
      businessName: 'Priya Restaurant',
      businessType: 'restaurant',
      businessDescription: 'Multi-cuisine restaurant',
      preferredCategories: [
        { category: 'crop', subcategory: 'vegetables' },
        { category: 'hen', subcategory: 'eggs' },
        { category: 'goat', subcategory: 'meat' }
      ],
      monthlyBudget: 100000,
      deliveryPreferences: {
        preferredDays: ['Tuesday', 'Thursday', 'Saturday'],
        preferredTime: '08:00-12:00',
        deliveryAddresses: [{
          address: 'Restaurant Lane, Pune, Maharashtra 411002',
          isDefault: true
        }]
      },
      paymentMethods: ['bank_transfer', 'upi'],
      isVerifiedBuyer: true
    });

    console.log('Created sample buyers');

    console.log('Seed data created successfully!');
    
    // Display login credentials
    console.log('\n=== Login Credentials ===');
    console.log('Admin:');
    console.log('  Email: admin@agroforms.com');
    console.log('  Password: admin123');
    console.log('\nFarmers:');
    console.log('  Email: rajesh@example.com');
    console.log('  Password: farmer123');
    console.log('  Email: mohan@example.com');
    console.log('  Password: farmer123');
    console.log('  Email: suresh@example.com');
    console.log('  Password: farmer123');
    console.log('\nBuyers:');
    console.log('  Email: amit@example.com');
    console.log('  Password: buyer123');
    console.log('  Email: priya@example.com');
    console.log('  Password: buyer123');
    console.log('\n========================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();