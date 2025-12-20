// Analytics functionality

let currentAnalyticsPeriod = 'monthly';
let currentAnalyticsType = 'overview';

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
    
    const content = document.getElementById('analytics-content');
    if (!content) return;
    
    // Show loading
    content.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p class="mt-4 text-gray-600">Loading analytics...</p>
        </div>
    `;
    
    // Update active tab
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

function getTabIndex(view) {
    const farmerViews = ['overview', 'sales', 'products', 'customers'];
    const buyerViews = ['overview', 'spending', 'categories', 'farmers'];
    const adminViews = ['platform', 'users', 'financial', 'growth'];
    
    if (farmerViews.includes(view)) return farmerViews.indexOf(view) + 1;
    if (buyerViews.includes(view)) return buyerViews.indexOf(view) + 1;
    if (adminViews.includes(view)) return adminViews.indexOf(view) + 1;
    return 1;
}

async function loadFarmerAnalytics(view, period) {
    try {
        const analytics = await api.getFarmerAnalytics(period);
        
        switch (view) {
            case 'overview':
                return createFarmerOverview(analytics);
            case 'sales':
                return createSalesAnalytics(analytics);
            case 'products':
                return createProductAnalytics(analytics);
            case 'customers':
                return createCustomerAnalytics(analytics);
            default:
                return createFarmerOverview(analytics);
        }
    } catch (error) {
        throw new Error('Failed to load farmer analytics');
    }
}

async function loadBuyerAnalytics(view, period) {
    try {
        const analytics = await api.getBuyerAnalytics(period);
        
        switch (view) {
            case 'overview':
                return createBuyerOverview(analytics);
            case 'spending':
                return createSpendingAnalytics(analytics);
            case 'categories':
                return createCategoryAnalytics(analytics);
            case 'farmers':
                return createFarmerAnalyticsView(analytics);
            default:
                return createBuyerOverview(analytics);
        }
    } catch (error) {
        throw new Error('Failed to load buyer analytics');
    }
}

async function loadAdminAnalytics(view, period) {
    try {
        // For admin, we'll use the platform stats
        const stats = await api.getAdminStats();
        
        switch (view) {
            case 'platform':
                return createPlatformOverview(stats);
            case 'users':
                return createUserAnalytics(stats);
            case 'financial':
                return createFinancialAnalytics(stats);
            case 'growth':
                return createGrowthAnalytics(stats);
            default:
                return createPlatformOverview(stats);
        }
    } catch (error) {
        throw new Error('Failed to load admin analytics');
    }
}

function createFarmerOverview(analytics) {
    return `
        <div class="space-y-6">
            <!-- Period Selector -->
            ${createPeriodSelector()}
            
            <!-- Key Metrics -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-rupee-sign text-green-600 text-xl"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">₹${analytics?.summary?.totalRevenue || 0}</h3>
                    <p class="text-gray-600">Total Revenue</p>
                </div>
                
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-shopping-cart text-blue-600 text-xl"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">${analytics?.summary?.totalOrders || 0}</h3>
                    <p class="text-gray-600">Total Orders</p>
                </div>
                
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-users text-purple-600 text-xl"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">${analytics?.summary?.uniqueCustomers || 0}</h3>
                    <p class="text-gray-600">Unique Customers</p>
                </div>
                
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-chart-line text-yellow-600 text-xl"></i>
                        </div>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">₹${analytics?.summary?.averageOrderValue || 0}</h3>
                    <p class="text-gray-600">Avg. Order Value</p>
                </div>
            </div>

            <!-- Revenue Chart -->
            <div class="bg-white rounded-xl shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-6">Revenue Trend</h3>
                <div class="h-64 flex items-center justify-center">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <!-- Recent Insights -->
            <div class="bg-white rounded-xl shadow p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-6">Insights & Recommendations</h3>
                <div class="space-y-4">
                    ${(analytics?.insights || []).slice(0, 3).map(insight => `
                        <div class="flex items-start gap-4 p-4 ${insight.type === 'positive' ? 'bg-green-50' : insight.type === 'negative' ? 'bg-red-50' : 'bg-blue-50'} rounded-lg">
                            <div class="w-8 h-8 ${insight.type === 'positive' ? 'bg-green-100' : insight.type === 'negative' ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center">
                                <i class="${getInsightIcon(insight.type)} ${insight.type === 'positive' ? 'text-green-600' : insight.type === 'negative' ? 'text-red-600' : 'text-blue-600'}"></i>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-800">${insight.title}</h4>
                                <p class="text-sm text-gray-600 mt-1">${insight.description}</p>
                                <p class="text-sm ${insight.type === 'positive' ? 'text-green-700' : insight.type === 'negative' ? 'text-red-700' : 'text-blue-700'} font-medium mt-2">
                                    <i class="fas fa-lightbulb mr-1"></i> ${insight.action}
                                </p>
                            </div>
                        </div>
                    `).join('') || '<p class="text-gray-600 text-center py-4">No insights available yet</p>'}
                </div>
            </div>
        </div>
    `;
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

function initCharts() {
    // Simple chart initialization (in a real app, you would use Chart.js)
    console.log('Initializing charts...');
    
    // Example: Initialize revenue chart
    const ctx = document.getElementById('revenueChart');
    if (ctx) {
        // Chart.js would go here
        ctx.innerHTML = `
            <div class="text-center">
                <p class="text-gray-600">Chart visualization would appear here</p>
                <p class="text-sm text-gray-500 mt-2">(In a production app, this would show actual charts)</p>
            </div>
        `;
    }
}

// Create other analytics view functions (simplified for now)
function createSalesAnalytics(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-chart-line text-blue-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Sales Analytics</h3>
                <p class="text-gray-600">Detailed sales analysis would appear here</p>
            </div>
        </div>
    `;
}

function createProductAnalytics(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-seedling text-green-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Product Performance</h3>
                <p class="text-gray-600">Product performance analytics would appear here</p>
            </div>
        </div>
    `;
}

function createCustomerAnalytics(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-users text-purple-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Customer Analytics</h3>
                <p class="text-gray-600">Customer behavior analytics would appear here</p>
            </div>
        </div>
    `;
}

function createBuyerOverview(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-chart-pie text-green-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Buyer Analytics Overview</h3>
                <p class="text-gray-600">Your purchasing analytics would appear here</p>
            </div>
        </div>
    `;
}

function createSpendingAnalytics(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-money-bill-wave text-blue-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Spending Analytics</h3>
                <p class="text-gray-600">Your spending patterns would be analyzed here</p>
            </div>
        </div>
    `;
}

function createCategoryAnalytics(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-tags text-yellow-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Category Analytics</h3>
                <p class="text-gray-600">Your favorite product categories would appear here</p>
            </div>
        </div>
    `;
}

function createFarmerAnalyticsView(analytics) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-tractor text-red-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Favorite Farmers</h3>
                <p class="text-gray-600">Your preferred farmers analytics would appear here</p>
            </div>
        </div>
    `;
}

function createPlatformOverview(stats) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-globe text-indigo-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Platform Overview</h3>
                <p class="text-gray-600">Platform-wide analytics would appear here</p>
            </div>
        </div>
    `;
}

function createUserAnalytics(stats) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-users text-purple-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">User Analytics</h3>
                <p class="text-gray-600">User growth and engagement analytics would appear here</p>
            </div>
        </div>
    `;
}

function createFinancialAnalytics(stats) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-chart-line text-green-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Financial Analytics</h3>
                <p class="text-gray-600">Financial performance analytics would appear here</p>
            </div>
        </div>
    `;
}

function createGrowthAnalytics(stats) {
    return `
        <div class="space-y-6">
            ${createPeriodSelector()}
            <div class="text-center py-12">
                <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-chart-area text-blue-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Growth Analytics</h3>
                <p class="text-gray-600">Platform growth trends would appear here</p>
            </div>
        </div>
    `;
}

// Export to global scope
window.initAnalytics = initAnalytics;
window.loadAnalyticsView = loadAnalyticsView;
window.changeAnalyticsPeriod = changeAnalyticsPeriod;