    // Dashboard functionality for all user roles

    let currentView = 'overview';
    let currentRole = null;
    let currentAnalyticsPeriod = 'monthly';
    let currentAnalyticsType = 'overview';

    // Utility functions for URL parameters
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    function setUrlParam(key, value) {
        const params = new URLSearchParams(window.location.search);
        params.set(key, value);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'processing': 'bg-indigo-100 text-indigo-800',
            'shipped': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    function getInsightIcon(type) {
        switch (type) {
            case 'positive': return 'fas fa-arrow-up';
            case 'negative': return 'fas fa-arrow-down';
            case 'recommendation': return 'fas fa-lightbulb';
            default: return 'fas fa-info-circle';
        }
    }

    function changeAnalyticsPeriod(period) {
        currentAnalyticsPeriod = period;
        loadAnalyticsView(currentAnalyticsType, period);
    }

    function getTabIndex(view) {
        const farmerViews = ['overview', 'sales', 'products', 'customers'];
        const buyerViews = ['overview', 'spending', 'categories', 'farmers'];
        const adminViews = ['platform', 'users', 'financial', 'growth'];
        
        if (farmerViews.includes(view)) return farmerViews.indexOf(view) + 1;
        if (buyerViews.includes(view)) return buyerViews.indexOf(view) + 1;
        if (adminViews.includes(view)) return adminViews.indexOf(view) + 1;
        return 1;
    }

    function createPeriodSelector() {
        return `
            <div class="flex justify-between items-center bg-white rounded-xl shadow p-4">
                <div>
                    <h3 class="font-semibold text-gray-800">Analytics Period</h3>
                    <p class="text-sm text-gray-600">Select time period for analysis</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="changeAnalyticsPeriod('daily')" 
                            class="px-4 py-2 ${currentAnalyticsPeriod === 'daily' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg">
                        Daily
                    </button>
                    <button onclick="changeAnalyticsPeriod('weekly')" 
                            class="px-4 py-2 ${currentAnalyticsPeriod === 'weekly' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg">
                        Weekly
                    </button>
                    <button onclick="changeAnalyticsPeriod('monthly')" 
                            class="px-4 py-2 ${currentAnalyticsPeriod === 'monthly' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg">
                        Monthly
                    </button>
                    <button onclick="changeAnalyticsPeriod('yearly')" 
                            class="px-4 py-2 ${currentAnalyticsPeriod === 'yearly' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-lg">
                        Yearly
                    </button>
                </div>
            </div>
        `;
    }

    function initDashboard() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        currentRole = user.role;
        
        // Only set dashboard title if elements exist (dashboard.html only)
        const title = document.getElementById('dashboard-title');
        const subtitle = document.getElementById('dashboard-subtitle');
        
        // Check if elements exist before updating
        if (title && subtitle) {
            switch (currentRole) {
                case 'farmer':
                    title.textContent = 'Farmer Dashboard';
                    subtitle.textContent = 'Manage your farm products and orders';
                    break;
                case 'buyer':
                    title.textContent = 'Buyer Dashboard';
                    subtitle.textContent = 'Browse products and manage purchases';
                    break;
                case 'admin':
                    title.textContent = 'Admin Dashboard';
                    subtitle.textContent = 'Platform management and analytics';
                    break;
            }
        }

        // Load initial view based on URL params or default
        const params = getUrlParams();
        const view = params.view || 'overview';
        loadDashboardView(view);
        
        // Setup navigation
        setupDashboardNavigation();
    }

    function setupDashboardNavigation() {
        // Add role-specific navigation buttons
        const headerActions = document.querySelector('main .flex.gap-3');
        if (!headerActions) return;

        let buttons = '';
        
        if (currentRole === 'farmer') {
            buttons = `
                <button onclick="loadDashboardView('add-product')" 
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-plus mr-2"></i> Add Product
                </button>
                <button onclick="loadDashboardView('pending-orders')" 
                        class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    <i class="fas fa-clock mr-2"></i> Pending Orders
                </button>
            `;
        } else if (currentRole === 'buyer') {
            buttons = `
                <a href="marketplace.html" 
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-store mr-2"></i> Browse Marketplace
                </a>
                <a href="cart-checkout.html" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-shopping-cart mr-2"></i> View Cart
                </a>
            `;
        } else if (currentRole === 'admin') {
            buttons = `
                <a href="admin-panel.html" 
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-cogs mr-2"></i> Admin Panel
                </a>
            `;
        }
        
        headerActions.innerHTML = buttons;
    }

    // In dashboard.js, add this function
    async function loadDashboardView(view) {
        currentView = view;
        setUrlParam('view', view);
        
        const content = document.getElementById('dashboard-content');
        
        // Check if we need to handle analytics view
        if (view === 'analytics') {
            // For analytics, we need to show a different layout
            await loadAnalyticsView('overview', 'monthly');
            return;
        }
        
        if (!content) return;

        // Show loading for dashboard views
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                <p class="mt-4 text-gray-600">Loading ${view}...</p>
            </div>
        `;

        try {
            let html = '';
            
            switch (view) {
                case 'overview':
                    html = await loadOverview();
                    break;
                case 'stats':
                    html = await loadStats();
                    break;
                case 'recent-activity':
                    html = await loadRecentActivity();
                    break;
                case 'pending-orders':
                    html = await loadPendingOrders();
                    break;
                case 'add-product':
                    html = await loadAddProductForm();
                    break;
                default:
                    html = await loadOverview();
            }
            
            content.innerHTML = html;
            
            // Initialize any dynamic elements in the view
            initDashboardView(view);
            
        } catch (error) {
            console.error(`Error loading ${view}:`, error);
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Content</h3>
                    <p class="text-gray-600">${error.message}</p>
                    <button onclick="loadDashboardView('overview')" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Return to Overview
                    </button>
                </div>
            `;
        }
    }

    async function loadOverview() {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (currentRole === 'farmer') {
            return await loadFarmerOverview();
        } else if (currentRole === 'buyer') {
            return await loadBuyerOverview();
        } else if (currentRole === 'admin') {
            return await loadAdminOverview();
        }
        
        return '<p>Loading overview...</p>';
    }

    async function initAnalytics() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        // Setup analytics tabs
        setupAnalyticsTabs();
        
        // Load initial analytics view
        const params = getUrlParams();
        const view = params.view || 'overview';
        const period = params.period || 'monthly';
        
        currentAnalyticsPeriod = period;
        currentAnalyticsType = view;
        
        await loadAnalyticsView(view, period);
    }

    function setupAnalyticsTabs() {
        const user = JSON.parse(localStorage.getItem('user'));
        const tabsContainer = document.getElementById('analytics-tabs');
        
        if (!tabsContainer) return;
        
        let tabs = '';
        
        if (user.role === 'farmer') {
            tabs = `
                <button onclick="loadAnalyticsView('overview', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium active">
                    <i class="fas fa-chart-bar mr-2"></i> Overview
                </button>
                <button onclick="loadAnalyticsView('sales', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-rupee-sign mr-2"></i> Sales
                </button>
                <button onclick="loadAnalyticsView('products', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-seedling mr-2"></i> Products
                </button>
                <button onclick="loadAnalyticsView('customers', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-users mr-2"></i> Customers
                </button>
            `;
        } else if (user.role === 'buyer') {
            tabs = `
                <button onclick="loadAnalyticsView('overview', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium active">
                    <i class="fas fa-chart-bar mr-2"></i> Overview
                </button>
                <button onclick="loadAnalyticsView('spending', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-shopping-cart mr-2"></i> Spending
                </button>
                <button onclick="loadAnalyticsView('categories', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-tags mr-2"></i> Categories
                </button>
                <button onclick="loadAnalyticsView('farmers', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-tractor mr-2"></i> Farmers
                </button>
            `;
        } else if (user.role === 'admin') {
            tabs = `
                <button onclick="loadAnalyticsView('platform', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium active">
                    <i class="fas fa-globe mr-2"></i> Platform
                </button>
                <button onclick="loadAnalyticsView('users', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-users mr-2"></i> Users
                </button>
                <button onclick="loadAnalyticsView('financial', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-chart-line mr-2"></i> Financial
                </button>
                <button onclick="loadAnalyticsView('growth', '${currentAnalyticsPeriod}')" 
                        class="analytics-tab px-4 py-2 rounded-t-lg font-medium">
                    <i class="fas fa-chart-area mr-2"></i> Growth
                </button>
            `;
        }
        
        tabsContainer.innerHTML = tabs;
    }

    async function loadAnalyticsView(view, period = 'monthly') {
        currentAnalyticsType = view;
        currentAnalyticsPeriod = period;
        
        // Update URL
        setUrlParam('view', view);
        setUrlParam('period', period);
        
        const content = document.getElementById('dashboard-content');
        if (!content) return;
        
        // Show loading
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                <p class="mt-4 text-gray-600">Loading analytics...</p>
            </div>
        `;
        
        // Update active tab if tabs exist
        document.querySelectorAll('.analytics-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`.analytics-tab:nth-child(${getTabIndex(view)})`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        try {
            let html = '';
            
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (user.role === 'farmer') {
                html = await loadFarmerAnalytics(view, period);
            } else if (user.role === 'buyer') {
                html = await loadBuyerAnalytics(view, period);
            } else if (user.role === 'admin') {
                html = await loadAdminAnalytics(view, period);
            }
            
            content.innerHTML = html;
            
            // Initialize charts if needed
            if (view === 'sales' || view === 'spending' || view === 'financial') {
                initCharts();
            }
            
        } catch (error) {
            console.error(`Error loading analytics view ${view}:`, error);
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Analytics</h3>
                    <p class="text-gray-600">${error.message}</p>
                </div>
            `;
        }
    }

    async function loadFarmerOverview() {
        try {
            console.log('Loading farmer overview...');
            
            let stats, recentOrders, products;
            
            try {
                // Try to fetch data from API
                [stats, recentOrders, products] = await Promise.all([
                    api.getFarmerDashboardStats().catch(e => {
                        console.error('Error fetching stats:', e);
                        return { stats: {} };
                    }),
                    api.getFarmerOrders({ limit: 5 }).catch(e => {
                        console.error('Error fetching orders:', e);
                        return { orders: [] };
                    }),
                    api.getFarmerProducts({ limit: 4 }).catch(e => {
                        console.error('Error fetching products:', e);
                        return { products: [] };
                    })
                ]);
            } catch (error) {
                console.error('API call failed, using fallback data:', error);
                // Fallback data
                stats = { stats: {} };
                recentOrders = { orders: [] };
                products = { products: [] };
            }

            console.log('Products data:', products);
            
            // Generate product rows
            let productRows = '<p class="text-gray-600 text-center py-4">No products listed</p>';
            if (products?.products?.length > 0) {
                productRows = products.products.slice(0, 5).map(product => {
                    const stockPercent = product.quantity > 0 ? 
                        Math.round((product.availableQuantity / product.quantity) * 100) : 0;
                    
                    return `
                        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <i class="fas fa-seedling text-gray-500"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-medium text-gray-800">${product.name || 'Unnamed Product'}</p>
                                <p class="text-sm text-gray-600">Available: ${product.availableQuantity || 0} ${product.unit || 'units'}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-gray-800">₹${product.price || 0}</p>
                                <span class="text-sm ${product.isActive ? 'text-green-600' : 'text-red-600'}">
                                    ${product.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            // Generate order rows
            let orderRows = '<p class="text-gray-600 text-center py-4">No recent orders</p>';
            if (recentOrders?.orders?.length > 0) {
                orderRows = recentOrders.orders.slice(0, 5).map(order => {
                    return `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-800">${order.orderId || 'N/A'}</p>
                                <p class="text-sm text-gray-600">${order.buyer?.name || 'Customer'}</p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-gray-800">₹${order.totalAmount || 0}</p>
                                <span class="px-2 py-1 text-xs rounded ${getStatusBadgeClass(order.status)}">
                                    ${order.status || 'pending'}
                                </span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            return `
                <div class="space-y-6">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-rupee-sign text-green-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-green-600 font-medium">+12%</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">₹${stats?.stats?.totalRevenue || 0}</h3>
                            <p class="text-gray-600">Total Revenue</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-shopping-cart text-blue-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-blue-600 font-medium">+5</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.totalOrders || 0}</h3>
                            <p class="text-gray-600">Total Orders</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-seedling text-purple-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-purple-600 font-medium">${stats?.stats?.activeProducts || 0}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.totalProducts || 0}</h3>
                            <p class="text-gray-600">Products Listed</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-users text-yellow-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-yellow-600 font-medium">${stats?.stats?.customerCount || 0}</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">₹${stats?.stats?.averageOrderValue || 0}</h3>
                            <p class="text-gray-600">Avg. Order Value</p>
                        </div>
                    </div>

                    <!-- Recent Orders and Products -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Recent Orders -->
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-semibold text-gray-800">Recent Orders</h3>
                                <a href="orders-manager.html" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    View All <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </div>
                            <div class="space-y-4">
                                ${orderRows}
                            </div>
                        </div>

                        <!-- Top Products -->
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-semibold text-gray-800">Top Products</h3>
                                <a href="products-manager.html" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    Manage <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </div>
                            <div class="space-y-4">
                                ${productRows}
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <a href="products-manager.html" class="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-300">
                                <i class="fas fa-plus text-green-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800">Add Product</p>
                            </a>
                            <a href="orders-manager.html" class="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-300">
                                <i class="fas fa-clipboard-list text-blue-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800">View Orders</p>
                            </a>
                            <a href="dashboard.html?view=analytics" class="sidebar-link">
            <i class="fas fa-chart-line"></i>
            <span>Analytics</span>
        </a>
                            <a href="profile.html" class="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-300">
                                <i class="fas fa-user-edit text-yellow-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800">Edit Profile</p>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading farmer overview:', error);
            return `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Dashboard</h3>
                    <p class="text-gray-600 mb-4">${error.message || 'Please check your connection and try again'}</p>
                    <button onclick="loadDashboardView('overview')" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    async function loadBuyerOverview() {
        try {
            const [stats, recentOrders] = await Promise.all([
                api.getBuyerDashboardStats(),
                api.getBuyerOrders({ limit: 5 })
            ]);

            return `
                <div class="space-y-6">
                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-rupee-sign text-green-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-green-600 font-medium">This Month</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">₹${stats?.stats?.totalSpent || 0}</h3>
                            <p class="text-gray-600">Total Spent</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-shopping-cart text-blue-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-blue-600 font-medium">Active</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.totalOrders || 0}</h3>
                            <p class="text-gray-600">Total Orders</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-clock text-purple-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-purple-600 font-medium">Pending</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.pendingOrders || 0}</h3>
                            <p class="text-gray-600">Pending Orders</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-store text-yellow-600 text-xl"></i>
                                </div>
                                <span class="text-sm text-yellow-600 font-medium">Farmers</span>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.favoriteFarmers?.length || 0}</h3>
                            <p class="text-gray-600">Favorite Farmers</p>
                        </div>
                    </div>

                    <!-- Recent Orders and Quick Actions -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Recent Orders -->
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-lg font-semibold text-gray-800">Recent Orders</h3>
                                <a href="orders-manager.html" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    View All <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </div>
                            <div class="space-y-4">
                                ${recentOrders?.orders?.slice(0, 5).map(order => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p class="font-medium text-gray-800">${order.orderId}</p>
                                            <p class="text-sm text-gray-600">${order.farmer?.name || 'Farmer'}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-semibold text-gray-800">₹${order.totalAmount}</p>
                                            <span class="px-2 py-1 text-xs rounded ${getStatusBadgeClass(order.status)}">
                                                ${order.status}
                                            </span>
                                        </div>
                                    </div>
                                `).join('') || '<p class="text-gray-600 text-center py-4">No recent orders</p>'}
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="bg-white rounded-xl shadow p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <a href="marketplace.html" class="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition duration-300">
                                    <i class="fas fa-store text-green-600 text-xl mb-2"></i>
                                    <p class="font-medium text-gray-800">Browse Products</p>
                                </a>
                                <a href="cart-checkout.html" class="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition duration-300">
                                    <i class="fas fa-shopping-cart text-blue-600 text-xl mb-2"></i>
                                    <p class="font-medium text-gray-800">View Cart</p>
                                </a>
                                <a href="profile.html?tab=favorites" class="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition duration-300">
                                    <i class="fas fa-heart text-purple-600 text-xl mb-2"></i>
                                    <p class="font-medium text-gray-800">Favorites</p>
                                </a>
                                <a href="profile.html" class="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition duration-300">
                                    <i class="fas fa-user-edit text-yellow-600 text-xl mb-2"></i>
                                    <p class="font-medium text-gray-800">Edit Profile</p>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading buyer overview:', error);
            return '<p class="text-red-600">Error loading dashboard data</p>';
        }
    }

    async function loadAdminOverview() {
        try {
            const stats = await api.getAdminStats();

            return `
                <div class="space-y-6">
                    <!-- Platform Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-users text-green-600 text-xl"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${getTotalUsers(stats)}</h3>
                            <p class="text-gray-600">Total Users</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-shopping-cart text-blue-600 text-xl"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.orders?.totalOrders?.[0]?.count || 0}</h3>
                            <p class="text-gray-600">Total Orders</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-seedling text-purple-600 text-xl"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.products?.totalProducts?.[0]?.count || 0}</h3>
                            <p class="text-gray-600">Active Products</p>
                        </div>
                        
                        <div class="bg-white rounded-xl shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-rupee-sign text-yellow-600 text-xl"></i>
                                </div>
                            </div>
                            <h3 class="text-2xl font-bold text-gray-800">₹${stats?.stats?.revenue?.totalRevenue || 0}</h3>
                            <p class="text-gray-600">Platform Revenue</p>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-6">Admin Actions</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <a href="admin-panel.html?section=users" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-users text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">Manage Users</p>
                            </a>
                            <a href="admin-panel.html?section=products" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-seedling text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">Moderate Products</p>
                            </a>
                            <a href="admin-panel.html?section=orders" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-shopping-cart text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">View Orders</p>
                            </a>
                            <a href="admin-panel.html?section=categories" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-tags text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">Categories</p>
                            </a>
                            <a href="admin-panel.html?section=analytics" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-chart-line text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">Analytics</p>
                            </a>
                            <a href="admin-panel.html?section=verifications" class="p-4 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition duration-300">
                                <i class="fas fa-shield-alt text-gray-600 text-xl mb-2"></i>
                                <p class="font-medium text-gray-800 text-sm">Verifications</p>
                            </a>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-6">Recent Platform Activity</h3>
                        <div class="space-y-4">
                            ${generateRecentActivity().map(activity => `
                                <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    <div class="w-10 h-10 ${activity.bgColor} rounded-full flex items-center justify-center">
                                        <i class="${activity.icon} ${activity.iconColor}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-800">${activity.title}</p>
                                        <p class="text-sm text-gray-600">${activity.description}</p>
                                    </div>
                                    <span class="text-sm text-gray-500">${activity.time}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading admin overview:', error);
            return '<p class="text-red-600">Error loading dashboard data</p>';
        }
    }

    // Helper functions
    function getTotalUsers(stats) {
        if (!stats?.stats?.users) return 0;
        return stats.stats.users.reduce((total, userGroup) => total + userGroup.count, 0);
    }

    function generateRecentActivity() {
        return [
            {
                icon: 'fas fa-user-plus',
                iconColor: 'text-green-600',
                bgColor: 'bg-green-100',
                title: 'New Farmer Registration',
                description: 'Rajesh Kumar registered as a farmer',
                time: '2 hours ago'
            },
            {
                icon: 'fas fa-shopping-cart',
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-100',
                title: 'New Order Placed',
                description: 'Order #ORD123456 placed by Amit Sharma',
                time: '4 hours ago'
            },
            {
                icon: 'fas fa-seedling',
                iconColor: 'text-purple-600',
                bgColor: 'bg-purple-100',
                title: 'New Product Added',
                description: 'Organic Tomatoes added by Mohan Singh',
                time: '6 hours ago'
            },
            {
                icon: 'fas fa-check-circle',
                iconColor: 'text-yellow-600',
                bgColor: 'bg-yellow-100',
                title: 'Order Delivered',
                description: 'Order #ORD123455 marked as delivered',
                time: '1 day ago'
            }
        ];
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'processing': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    // Other view loading functions
    async function loadStats() {
        try {
            let stats;
            if (currentRole === 'farmer') {
                stats = await api.getFarmerDashboardStats();
            } else if (currentRole === 'buyer') {
                stats = await api.getBuyerDashboardStats();
            } else if (currentRole === 'admin') {
                stats = await api.getAdminStats();
            }
            
            return `
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-6">Detailed Statistics</h3>
                    <div class="space-y-6">
                        <div>
                            <h4 class="font-medium text-gray-700 mb-3">Performance Metrics</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-600">Total Revenue</p>
                                    <p class="text-xl font-bold text-gray-800">₹${stats?.stats?.totalRevenue || 0}</p>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-600">Total Orders</p>
                                    <p class="text-xl font-bold text-gray-800">${stats?.stats?.totalOrders || 0}</p>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <p class="text-sm text-gray-600">Success Rate</p>
                                    <p class="text-xl font-bold text-gray-800">${stats?.stats?.successRate || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
            return '<p class="text-red-600">Error loading statistics</p>';
        }
    }

    async function loadAnalytics() {
        try {
            let analytics;
            if (currentRole === 'farmer') {
                analytics = await api.getFarmerAnalytics();
            } else if (currentRole === 'buyer') {
                analytics = await api.getBuyerAnalytics();
            }
            
            return `
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-6">Analytics Dashboard</h3>
                    <div class="space-y-6">
                        <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                            <p class="text-gray-600">Analytics chart will be displayed here</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-medium text-gray-700 mb-2">Trend Analysis</h4>
                                <p class="text-sm text-gray-600">View performance trends over time</p>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h4 class="font-medium text-gray-700 mb-2">Comparative Analysis</h4>
                                <p class="text-sm text-gray-600">Compare with previous periods</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading analytics:', error);
            return '<p class="text-red-600">Error loading analytics</p>';
        }
    }

    async function loadPendingOrders() {
        try {
            const pendingOrders = currentRole === 'farmer' 
                ? await api.getPendingApprovalOrders()
                : { orders: [] };
                
            return `
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold text-gray-800">Pending Orders</h3>
                        <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            ${pendingOrders?.orders?.length || 0} Orders
                        </span>
                    </div>
                    
                    <div class="space-y-4">
                        ${pendingOrders?.orders?.length > 0 ? pendingOrders.orders.map(order => `
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="font-semibold text-gray-800">${order.orderId}</h4>
                                        <p class="text-sm text-gray-600">From: ${order.buyer?.name || 'Customer'}</p>
                                    </div>
                                    <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                        ${order.status}
                                    </span>
                                </div>
                                <div class="space-y-2">
                                    ${order.items?.map(item => `
                                        <div class="flex justify-between text-sm">
                                            <span>${item.product?.name || 'Product'} × ${item.quantity}</span>
                                            <span>₹${item.price * item.quantity}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                                    <div>
                                        <p class="text-sm text-gray-600">Total Amount</p>
                                        <p class="font-semibold text-gray-800">₹${order.totalAmount}</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="approveOrder('${order._id}')" 
                                                class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                                            Approve
                                        </button>
                                        <button onclick="rejectOrder('${order._id}')" 
                                                class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center py-12">
                                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-check text-gray-400 text-2xl"></i>
                                </div>
                                <p class="text-gray-600">No pending orders at the moment</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading pending orders:', error);
            return '<p class="text-red-600">Error loading pending orders</p>';
        }
    }

    async function loadAddProductForm() {
        return `
            <div class="bg-white rounded-xl shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-6">Add New Product</h3>
                <form id="dashboard-add-product-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                        <input type="text" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                            <option value="">Select Category</option>
                            <option value="crop">Crop</option>
                            <option value="livestock">Livestock</option>
                        </select>
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            Add Product
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    async function loadRecentActivity() {
        try {
            let activities;
            if (currentRole === 'farmer') {
                const [orders, products] = await Promise.all([
                    api.getFarmerOrders({ limit: 5 }),
                    api.getFarmerProducts({ limit: 5 })
                ]);
                activities = { orders, products };
            }
            
            return `
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
                    <div class="space-y-4">
                        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-shopping-cart text-green-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">New order received</p>
                                <p class="text-sm text-gray-600">Order #ORD123456 placed</p>
                            </div>
                            <span class="text-sm text-gray-500 ml-auto">2 hours ago</span>
                        </div>
                        <div class="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-seedling text-blue-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">Product added</p>
                                <p class="text-sm text-gray-600">Organic Tomatoes listed</p>
                            </div>
                            <span class="text-sm text-gray-500 ml-auto">1 day ago</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading recent activity:', error);
            return '<p class="text-red-600">Error loading recent activity</p>';
        }
    }

    function initDashboardView(view) {
        // Initialize any dynamic elements for the current view
        if (view === 'add-product') {
            const form = document.getElementById('dashboard-add-product-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    alert('Product added via dashboard!');
                    loadDashboardView('overview');
                });
            }
        }
    }

    // Order management functions
    async function approveOrder(orderId) {
        if (confirm('Approve this order?')) {
            try {
                await api.approveOrder(orderId, 'approve');
                showToast('Order approved successfully!', 'success');
                loadDashboardView('pending-orders');
            } catch (error) {
                showToast('Failed to approve order', 'error');
            }
        }
    }

    async function rejectOrder(orderId) {
        if (confirm('Reject this order?')) {
            try {
                await api.approveOrder(orderId, 'reject');
                showToast('Order rejected', 'info');
                loadDashboardView('pending-orders');
            } catch (error) {
                showToast('Failed to reject order', 'error');
            }
        }
    }

    // Export to global scope
    window.initDashboard = initDashboard;
    window.loadDashboardView = loadDashboardView;
    window.approveOrder = approveOrder;
    window.rejectOrder = rejectOrder;
    window.initAnalytics = initAnalytics;
    window.loadAnalyticsView = loadAnalyticsView;
    window.changeAnalyticsPeriod = changeAnalyticsPeriod;