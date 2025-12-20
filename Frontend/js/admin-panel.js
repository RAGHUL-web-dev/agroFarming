// Admin Panel functionality

let currentAdminSection = 'dashboard';
let adminCharts = {};
let adminData = {
    users: [],
    farmers: [],
    buyers: [],
    products: [],
    orders: [],
    categories: [],
    analytics: {}
};


function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

/**
 * Set or update a URL parameter without reloading the page
 */
function setUrlParam(key, value) {
    const params = new URLSearchParams(window.location.search);
    if (value === null || value === undefined) {
        params.delete(key);
    } else {
        params.set(key, value);
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
}

/**
 * Refresh admin data and reload current section
 */
function refreshAdminData() {
    const activeTab = document.querySelector('.admin-tab.active');
    if (activeTab) {
        // Find which tab is active
        const tabs = document.querySelectorAll('.admin-tab');
        const sections = ['dashboard', 'users', 'farmers', 'buyers', 'products', 'orders', 'categories', 'analytics', 'verifications', 'settings'];
        
        // Get the section from the active tab
        const tabText = activeTab.textContent.toLowerCase().trim();
        let section = currentAdminSection; // Default to current section
        
        // Try to find matching section
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i] === activeTab) {
                section = sections[i];
                break;
            }
        }
        
        if (section) {
            loadAdminSection(section);
            showToast('Data refreshed successfully', 'success');
        }
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format number with commas
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Get total products count for farmers (placeholder function)
 */
async function getTotalProductsByFarmers() {
    try {
        const products = await api.getAllProducts();
        return products?.products?.length || 0;
    } catch (error) {
        console.error('Error getting total products:', error);
        return 0;
    }
}

/**
 * Get total spending by buyers (placeholder function)
 */
async function getTotalBuyerSpending() {
    try {
        const orders = await api.getAllOrders();
        if (!orders?.orders) return 0;
        
        let total = 0;
        orders.orders.forEach(order => {
            if (order.buyer) {
                total += order.totalAmount || 0;
            }
        });
        return formatNumber(total);
    } catch (error) {
        console.error('Error getting total spending:', error);
        return '0';
    }
}

/**
 * Get revenue data for charts (placeholder function)
 */
async function getRevenueData() {
    try {
        // This would typically come from an API endpoint
        // For now, return mock data
        return {
            daily: [12000, 19000, 15000, 25000, 22000, 30000],
            monthly: [150000, 180000, 220000, 190000, 240000, 280000],
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        };
    } catch (error) {
        console.error('Error getting revenue data:', error);
        return { daily: [], monthly: [], labels: [] };
    }
}

// ========== END OF MISSING UTILITY FUNCTIONS ==========

// Now continue with your existing functions...
function initAdminPanel() {
    // Load initial section based on URL params
    const params = getUrlParams();
    const section = params.section || 'dashboard';
    loadAdminSection(section);
    
    // Set up tab click handlers
    setupAdminTabs();
}

// ... rest of your existing admin-panel.js code continues below ...

function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active', 'text-green-600', 'border-green-600', 'bg-green-50'));
            this.classList.add('active', 'text-green-600', 'border-green-600', 'bg-green-50');
            
            // Update tab styling
            this.style.borderBottom = '2px solid #059669';
            tabs.forEach(t => {
                if (t !== this) {
                    t.style.borderBottom = 'none';
                }
            });
        });
    });
}

async function loadAdminSection(section) {
    currentAdminSection = section;
    
    // Update URL without reload
    setUrlParam('section', section);
    
    // Update active tab
    const tabs = document.querySelectorAll('.admin-tab');
    const sections = ['dashboard', 'users', 'farmers', 'buyers', 'products', 'orders', 'categories', 'analytics', 'verifications', 'settings'];
    const sectionIndex = sections.indexOf(section);
    
    tabs.forEach((tab, index) => {
        tab.classList.remove('active', 'text-green-600', 'border-green-600', 'bg-green-50');
        tab.style.borderBottom = 'none';
        
        if (index === sectionIndex) {
            tab.classList.add('active', 'text-green-600', 'border-green-600', 'bg-green-50');
            tab.style.borderBottom = '2px solid #059669';
        }
    });
    
    // Show loading
    const content = document.getElementById('admin-content');
    content.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p class="mt-4 text-gray-600">Loading ${section}...</p>
        </div>
    `;
    
    try {
        let html = '';
        
        switch (section) {
            case 'dashboard':
                html = await loadAdminDashboard();
                break;
            case 'users':
                html = await loadUsersSection();
                break;
            case 'farmers':
                html = await loadFarmersSection();
                break;
            case 'buyers':
                html = await loadBuyersSection();
                break;
            case 'products':
                html = await loadProductsSection();
                break;
            case 'orders':
                html = await loadOrdersSection();
                break;
            case 'categories':
                html = await loadCategoriesSection();
                break;
            case 'analytics':
                html = await loadAnalyticsSection();
                break;
            case 'verifications':
                html = await loadVerificationsSection();
                break;
            case 'settings':
                html = await loadSettingsSection();
                break;
            default:
                html = await loadAdminDashboard();
        }
        
        content.innerHTML = html;
        
        // Initialize section-specific functionality
        initAdminSection(section);
        
    } catch (error) {
        console.error(`Error loading ${section}:`, error);
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Content</h3>
                <p class="text-gray-600">${error.message}</p>
                <button onclick="loadAdminSection('dashboard')" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Return to Dashboard
                </button>
            </div>
        `;
    }
}

async function loadAdminDashboard() {
    try {
        const [stats, recentUsers, recentOrders, revenueData] = await Promise.all([
            api.getAdminStats(),
            api.getAllUsers({ limit: 5 }),
            api.getAllOrders({ limit: 5 }),
            getRevenueData()
        ]);
        
        adminData.analytics = stats;
        
        return `
            <div class="space-y-6">
                <!-- Stats Overview -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="stats-card bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-blue-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-blue-600 font-medium">+${stats?.stats?.users?.find(u => u._id === 'farmer')?.count || 0}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${getTotalUsers(stats)}</h3>
                        <p class="text-gray-600">Total Users</p>
                    </div>
                    
                    <div class="stats-card bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-shopping-cart text-green-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-green-600 font-medium">+${stats?.stats?.orders?.recentOrders?.[0]?.count || 0}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.orders?.totalOrders?.[0]?.count || 0}</h3>
                        <p class="text-gray-600">Total Orders</p>
                    </div>
                    
                    <div class="stats-card bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-seedling text-purple-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-purple-600 font-medium">${stats?.stats?.products?.activeProducts?.[0]?.count || 0}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${stats?.stats?.products?.totalProducts?.[0]?.count || 0}</h3>
                        <p class="text-gray-600">Active Products</p>
                    </div>
                    
                    <div class="stats-card bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-rupee-sign text-yellow-600 text-xl"></i>
                            </div>
                            <span class="text-sm text-yellow-600 font-medium">+12%</span>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">₹${formatNumber(stats?.stats?.revenue?.totalRevenue || 0)}</h3>
                        <p class="text-gray-600">Platform Revenue</p>
                    </div>
                </div>

                <!-- Charts and Recent Activity -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Revenue Chart -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
                        <div class="chart-container">
                            <canvas id="revenue-chart"></canvas>
                        </div>
                    </div>
                    
                    <!-- User Growth Chart -->
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">User Growth</h3>
                        <div class="chart-container">
                            <canvas id="users-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Recent Users and Orders -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Recent Users -->
                    <div class="bg-white rounded-xl shadow">
                        <div class="p-6 border-b">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">Recent Users</h3>
                                <a href="javascript:void(0)" onclick="loadAdminSection('users')" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    View All <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="space-y-4">
                                ${recentUsers?.users?.slice(0, 5).map(user => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                                <i class="fas fa-user text-gray-600"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium text-gray-800">${user.name}</p>
                                                <div class="flex items-center gap-2">
                                                    <span class="text-xs px-2 py-1 rounded ${getRoleBadgeClass(user.role)}">
                                                        ${user.role}
                                                    </span>
                                                    <span class="text-xs text-gray-500">${formatDate(user.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span class="status-dot ${user.isVerified ? 'status-active' : 'status-pending'}"></span>
                                    </div>
                                `).join('') || '<p class="text-gray-600 text-center py-4">No recent users</p>'}
                            </div>
                        </div>
                    </div>

                    <!-- Recent Orders -->
                    <div class="bg-white rounded-xl shadow">
                        <div class="p-6 border-b">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">Recent Orders</h3>
                                <a href="javascript:void(0)" onclick="loadAdminSection('orders')" class="text-green-600 hover:text-green-700 text-sm font-medium">
                                    View All <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </div>
                        </div>
                        <div class="p-4">
                            <div class="space-y-4">
                                ${recentOrders?.orders?.slice(0, 5).map(order => `
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p class="font-medium text-gray-800">${order.orderId}</p>
                                            <p class="text-sm text-gray-600">${order.buyer?.name || 'Buyer'} → ${order.farmer?.name || 'Farmer'}</p>
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
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-800">Farmers</h4>
                            <span class="text-2xl font-bold text-green-600">${stats?.stats?.users?.find(u => u._id === 'farmer')?.count || 0}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${(stats?.stats?.users?.find(u => u._id === 'farmer')?.count || 0) / getTotalUsers(stats) * 100}%"></div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-800">Buyers</h4>
                            <span class="text-2xl font-bold text-blue-600">${stats?.stats?.users?.find(u => u._id === 'buyer')?.count || 0}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${(stats?.stats?.users?.find(u => u._id === 'buyer')?.count || 0) / getTotalUsers(stats) * 100}%"></div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-800">Order Success Rate</h4>
                            <span class="text-2xl font-bold text-purple-600">94%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-purple-600 h-2 rounded-full" style="width: 94%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        return '<p class="text-red-600">Error loading dashboard data</p>';
    }
}

async function loadUsersSection() {
    try {
        const users = await api.getAllUsers();
        adminData.users = users?.users || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">User Management</h2>
                            <p class="text-gray-600">Manage all platform users</p>
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <input type="text" id="user-search" placeholder="Search users..." 
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                            <button onclick="showAddUserModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-user-plus mr-2"></i> Add User
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="bg-white rounded-xl shadow p-4">
                    <div class="flex flex-wrap gap-4 items-center">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select id="role-filter" class="px-3 py-2 border border-gray-300 rounded-lg" onchange="filterUsers()">
                                <option value="">All Roles</option>
                                <option value="farmer">Farmer</option>
                                <option value="buyer">Buyer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="status-filter" class="px-3 py-2 border border-gray-300 rounded-lg" onchange="filterUsers()">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending Verification</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <input type="date" id="date-filter" class="px-3 py-2 border border-gray-300 rounded-lg" onchange="filterUsers()">
                        </div>
                        <div class="flex items-end">
                            <button onclick="exportUsers()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                <i class="fas fa-download mr-2"></i> Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                                ${renderUsersTable(adminData.users)}
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="px-6 py-4 border-t border-gray-200">
                        <div class="flex items-center justify-between">
                            <div class="text-sm text-gray-700">
                                Showing <span id="users-start">1</span> to <span id="users-end">${Math.min(10, adminData.users.length)}</span> of <span id="users-total">${adminData.users.length}</span> users
                            </div>
                            <div class="flex gap-2">
                                <button onclick="prevUsersPage()" class="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                                    Previous
                                </button>
                                <button onclick="nextUsersPage()" class="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading users section:', error);
        return '<p class="text-red-600">Error loading users data</p>';
    }
}

async function loadFarmersSection() {
    try {
        const farmers = await api.getAllUsers({ role: 'farmer' });
        adminData.farmers = farmers?.users || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Farmers Management</h2>
                            <p class="text-gray-600">Manage all registered farmers</p>
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <input type="text" id="farmer-search" placeholder="Search farmers..." 
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-green-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.farmers.length}</h3>
                        <p class="text-gray-600">Total Farmers</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.farmers.filter(f => f.isVerified).length}</h3>
                        <p class="text-gray-600">Verified Farmers</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.farmers.filter(f => !f.isVerified).length}</h3>
                        <p class="text-gray-600">Pending Verification</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-seedling text-purple-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${await getTotalProductsByFarmers()}</h3>
                        <p class="text-gray-600">Total Products</p>
                    </div>
                </div>

                <!-- Farmers Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Farmer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Farm Details
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verification
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Performance
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="farmers-table-body" class="bg-white divide-y divide-gray-200">
                                ${renderFarmersTable(adminData.farmers)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading farmers section:', error);
        return '<p class="text-red-600">Error loading farmers data</p>';
    }
}

async function loadBuyersSection() {
    try {
        const buyers = await api.getAllUsers({ role: 'buyer' });
        adminData.buyers = buyers?.users || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Buyers Management</h2>
                            <p class="text-gray-600">Manage all registered buyers/retailers</p>
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <input type="text" id="buyer-search" placeholder="Search buyers..." 
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-users text-green-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.buyers.length}</h3>
                        <p class="text-gray-600">Total Buyers</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-store text-blue-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.buyers.filter(b => b.businessType === 'retailer').length}</h3>
                        <p class="text-gray-600">Retailers</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-warehouse text-purple-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.buyers.filter(b => b.businessType === 'wholesaler').length}</h3>
                        <p class="text-gray-600">Wholesalers</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-shopping-cart text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">₹${await getTotalBuyerSpending()}</h3>
                        <p class="text-gray-600">Total Spending</p>
                    </div>
                </div>

                <!-- Buyers Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Buyer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Business Details
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verification
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Spending
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="buyers-table-body" class="bg-white divide-y divide-gray-200">
                                ${renderBuyersTable(adminData.buyers)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading buyers section:', error);
        return '<p class="text-red-600">Error loading buyers data</p>';
    }
}

async function loadProductsSection() {
    try {
        const products = await api.getAllProducts();
        adminData.products = products?.products || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Product Management</h2>
                            <p class="text-gray-600">Manage all platform products</p>
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <input type="text" id="product-search" placeholder="Search products..." 
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                            <button onclick="showAddProductModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-plus mr-2"></i> Add Product
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-seedling text-green-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.products.length}</h3>
                        <p class="text-gray-600">Total Products</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.products.filter(p => p.isActive).length}</h3>
                        <p class="text-gray-600">Active Products</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.products.filter(p => !p.isActive).length}</h3>
                        <p class="text-gray-600">Inactive Products</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-box text-red-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.products.filter(p => p.availableQuantity < 10).length}</h3>
                        <p class="text-gray-600">Low Stock</p>
                    </div>
                </div>

                <!-- Category Distribution -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Products by Category</h3>
                    <div class="chart-container">
                        <canvas id="products-chart"></canvas>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Product
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Farmer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price & Stock
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="products-table-body" class="bg-white divide-y divide-gray-200">
                                ${renderProductsTable(adminData.products)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading products section:', error);
        return '<p class="text-red-600">Error loading products data</p>';
    }
}

async function loadOrdersSection() {
    try {
        const orders = await api.getAllOrders();
        adminData.orders = orders?.orders || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Order Management</h2>
                            <p class="text-gray-600">Monitor and manage all platform orders</p>
                        </div>
                        <div class="flex gap-3">
                            <div class="relative">
                                <input type="text" id="order-search" placeholder="Search orders..." 
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                            <button onclick="exportOrders()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                <i class="fas fa-download mr-2"></i> Export
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-shopping-cart text-green-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.orders.length}</h3>
                        <p class="text-gray-600">Total Orders</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">₹${calculateTotalRevenue()}</h3>
                        <p class="text-gray-600">Total Revenue</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-yellow-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.orders.filter(o => o.status === 'pending').length}</h3>
                        <p class="text-gray-600">Pending Orders</p>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-truck text-purple-600 text-xl"></i>
                            </div>
                        </div>
                        <h3 class="text-2xl font-bold text-gray-800">${adminData.orders.filter(o => o.status === 'delivered').length}</h3>
                        <p class="text-gray-600">Delivered Orders</p>
                    </div>
                </div>

                <!-- Status Distribution -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Orders by Status</h3>
                    <div class="chart-container">
                        <canvas id="orders-chart"></canvas>
                    </div>
                </div>

                <!-- Orders Table -->
                <div class="bg-white rounded-xl shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Buyer & Farmer
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="orders-table-body" class="bg-white divide-y divide-gray-200">
                                ${renderOrdersTable(adminData.orders)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading orders section:', error);
        return '<p class="text-red-600">Error loading orders data</p>';
    }
}

async function loadCategoriesSection() {
    try {
        const categories = await api.getCategoriesList();
        adminData.categories = categories?.categories || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Category Management</h2>
                            <p class="text-gray-600">Manage product categories and subcategories</p>
                        </div>
                        <button onclick="showAddCategoryModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i> Add Category
                        </button>
                    </div>
                </div>

                <!-- Categories Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${adminData.categories.map(category => `
                        <div class="bg-white rounded-xl shadow overflow-hidden">
                            <div class="p-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-${getCategoryIcon(category.name)} text-green-600 text-xl"></i>
                                    </div>
                                    <span class="px-2 py-1 text-xs rounded ${category.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                        ${category.active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <h3 class="text-lg font-semibold text-gray-800 mb-2">${category.name.toUpperCase()}</h3>
                                <p class="text-gray-600 text-sm mb-4">${category.description || 'No description'}</p>
                                
                                <div class="mb-4">
                                    <h4 class="text-sm font-medium text-gray-700 mb-2">Subcategories:</h4>
                                    <div class="flex flex-wrap gap-2">
                                        ${category.subcategories?.map(sub => `
                                            <span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                ${sub.name}
                                            </span>
                                        `).join('') || '<span class="text-gray-500 text-xs">No subcategories</span>'}
                                    </div>
                                </div>
                                
                                <div class="flex gap-2">
                                    <button onclick="editCategory('${category._id}')" class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                        Edit
                                    </button>
                                    <button onclick="deleteCategory('${category._id}')" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading categories section:', error);
        return '<p class="text-red-600">Error loading categories data</p>';
    }
}

async function loadAnalyticsSection() {
    try {
        const analytics = await api.getAdminStats();
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Analytics & Reports</h2>
                            <p class="text-gray-600">Detailed platform analytics and insights</p>
                        </div>
                        <div class="flex gap-3">
                            <select id="analytics-period" class="px-3 py-2 border border-gray-300 rounded-lg" onchange="updateAnalytics()">
                                <option value="7">Last 7 days</option>
                                <option value="30" selected>Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                            <button onclick="generateReport()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-file-pdf mr-2"></i> Generate Report
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Key Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <h4 class="text-sm font-medium text-gray-600 mb-2">Average Order Value</h4>
                        <div class="flex items-center justify-between">
                            <h3 class="text-2xl font-bold text-gray-800">₹${calculateAverageOrderValue()}</h3>
                            <span class="text-sm text-green-600 font-medium">+8.2%</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h4 class="text-sm font-medium text-gray-600 mb-2">Conversion Rate</h4>
                        <div class="flex items-center justify-between">
                            <h3 class="text-2xl font-bold text-gray-800">3.8%</h3>
                            <span class="text-sm text-green-600 font-medium">+1.4%</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h4 class="text-sm font-medium text-gray-600 mb-2">Customer Retention</h4>
                        <div class="flex items-center justify-between">
                            <h3 class="text-2xl font-bold text-gray-800">74%</h3>
                            <span class="text-sm text-green-600 font-medium">+5.2%</span>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h4 class="text-sm font-medium text-gray-600 mb-2">Platform Growth</h4>
                        <div class="flex items-center justify-between">
                            <h3 class="text-2xl font-bold text-gray-800">28%</h3>
                            <span class="text-sm text-green-600 font-medium">+3.1%</span>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Revenue Trend</h3>
                        <div class="chart-container">
                            <canvas id="revenue-trend-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">User Growth Trend</h3>
                        <div class="chart-container">
                            <canvas id="user-growth-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Top Products</h3>
                        <div class="chart-container">
                            <canvas id="top-products-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Category Performance</h3>
                        <div class="chart-container">
                            <canvas id="category-performance-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detailed Reports -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Detailed Reports</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-800">Sales Performance Report</h4>
                                <p class="text-sm text-gray-600">Daily, weekly, and monthly sales performance</p>
                            </div>
                            <button onclick="downloadReport('sales')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Download
                            </button>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-800">User Activity Report</h4>
                                <p class="text-sm text-gray-600">User registration and activity patterns</p>
                            </div>
                            <button onclick="downloadReport('users')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Download
                            </button>
                        </div>
                        
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 class="font-medium text-gray-800">Product Performance Report</h4>
                                <p class="text-sm text-gray-600">Best performing products and categories</p>
                            </div>
                            <button onclick="downloadReport('products')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading analytics section:', error);
        return '<p class="text-red-600">Error loading analytics data</p>';
    }
}

async function loadVerificationsSection() {
    try {
        const [farmers, buyers] = await Promise.all([
            api.getAllUsers({ role: 'farmer' }),
            api.getAllUsers({ role: 'buyer' })
        ]);
        
        const pendingFarmers = farmers?.users?.filter(f => !f.isVerified) || [];
        const pendingBuyers = buyers?.users?.filter(b => !b.isVerified) || [];
        
        return `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-white rounded-xl shadow p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-xl font-bold text-gray-800">Verification Center</h2>
                            <p class="text-gray-600">Review and verify user accounts</p>
                        </div>
                        <div class="text-sm text-gray-600">
                            <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                ${pendingFarmers.length + pendingBuyers.length} Pending
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Pending Verifications -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Pending Farmers -->
                    <div class="bg-white rounded-xl shadow">
                        <div class="p-6 border-b">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">Pending Farmers</h3>
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                                    ${pendingFarmers.length} pending
                                </span>
                            </div>
                        </div>
                        <div class="p-4">
                            ${pendingFarmers.length > 0 ? `
                                <div class="space-y-4">
                                    ${pendingFarmers.map(farmer => `
                                        <div class="p-4 border border-gray-200 rounded-lg">
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <i class="fas fa-user text-gray-600"></i>
                                                    </div>
                                                    <div>
                                                        <p class="font-medium text-gray-800">${farmer.name}</p>
                                                        <p class="text-sm text-gray-600">${farmer.email}</p>
                                                    </div>
                                                </div>
                                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                                    Pending
                                                </span>
                                            </div>
                                            <div class="flex gap-2">
                                                <button onclick="verifyUser('${farmer._id}', 'approved')" class="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                                    Approve
                                                </button>
                                                <button onclick="verifyUser('${farmer._id}', 'rejected')" class="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                                    Reject
                                                </button>
                                                <button onclick="viewUserDetails('${farmer._id}')" class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-8">
                                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800 mb-2">No Pending Farmers</h3>
                                    <p class="text-gray-600">All farmers have been verified</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Pending Buyers -->
                    <div class="bg-white rounded-xl shadow">
                        <div class="p-6 border-b">
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold text-gray-800">Pending Buyers</h3>
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                                    ${pendingBuyers.length} pending
                                </span>
                            </div>
                        </div>
                        <div class="p-4">
                            ${pendingBuyers.length > 0 ? `
                                <div class="space-y-4">
                                    ${pendingBuyers.map(buyer => `
                                        <div class="p-4 border border-gray-200 rounded-lg">
                                            <div class="flex items-center justify-between mb-3">
                                                <div class="flex items-center gap-3">
                                                    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <i class="fas fa-user text-gray-600"></i>
                                                    </div>
                                                    <div>
                                                        <p class="font-medium text-gray-800">${buyer.name}</p>
                                                        <p class="text-sm text-gray-600">${buyer.email}</p>
                                                    </div>
                                                </div>
                                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                                    Pending
                                                </span>
                                            </div>
                                            <div class="flex gap-2">
                                                <button onclick="verifyUser('${buyer._id}', 'approved')" class="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                                    Approve
                                                </button>
                                                <button onclick="verifyUser('${buyer._id}', 'rejected')" class="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                                                    Reject
                                                </button>
                                                <button onclick="viewUserDetails('${buyer._id}')" class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-8">
                                    <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-800 mb-2">No Pending Buyers</h3>
                                    <p class="text-gray-600">All buyers have been verified</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Recently Verified -->
                <div class="bg-white rounded-xl shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Recently Verified</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verified On
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Verified By
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${getRecentlyVerified().map(user => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                    <i class="fas fa-user text-gray-600 text-sm"></i>
                                                </div>
                                                <div>
                                                    <div class="text-sm font-medium text-gray-900">${user.name}</div>
                                                    <div class="text-sm text-gray-500">${user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs rounded ${getRoleBadgeClass(user.role)}">
                                                ${user.role}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${formatDate(user.verifiedAt)}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Admin User
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                                Verified
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading verifications section:', error);
        return '<p class="text-red-600">Error loading verification data</p>';
    }
}

async function loadSettingsSection() {
    return `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white rounded-xl shadow p-6">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">Platform Settings</h2>
                        <p class="text-gray-600">Configure platform settings and preferences</p>
                    </div>
                    <button onclick="saveSettings()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-save mr-2"></i> Save Settings
                    </button>
                </div>
            </div>

            <!-- Settings Tabs -->
            <div class="bg-white rounded-xl shadow">
                <div class="border-b border-gray-200">
                    <nav class="flex space-x-8 px-6">
                        <button onclick="showSettingsTab('general')" class="settings-tab py-4 px-1 border-b-2 font-medium text-sm active border-green-600 text-green-600">
                            General
                        </button>
                        <button onclick="showSettingsTab('payment')" class="settings-tab py-4 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700">
                            Payment
                        </button>
                        <button onclick="showSettingsTab('notifications')" class="settings-tab py-4 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700">
                            Notifications
                        </button>
                        <button onclick="showSettingsTab('security')" class="settings-tab py-4 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700">
                            Security
                        </button>
                        <button onclick="showSettingsTab('api')" class="settings-tab py-4 px-1 border-b-2 font-medium text-sm text-gray-500 hover:text-gray-700">
                            API
                        </button>
                    </nav>
                </div>
                
                <!-- Settings Content -->
                <div id="settings-content" class="p-6">
                    ${loadGeneralSettings()}
                </div>
            </div>
        </div>
    `;
}

// Helper functions for table rendering
function renderUsersTable(users) {
    if (!users || users.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    No users found
                </td>
            </tr>
        `;
    }
    
    return users.slice(0, 10).map(user => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-gray-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${user.name}</div>
                        <div class="text-sm text-gray-500">${user.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded ${getRoleBadgeClass(user.role)}">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-dot ${user.isVerified ? 'status-active' : 'status-pending'}"></span>
                <span class="text-sm text-gray-900">${user.isVerified ? 'Verified' : 'Pending'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(user.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editUser('${user._id}')" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser('${user._id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderFarmersTable(farmers) {
    if (!farmers || farmers.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    No farmers found
                </td>
            </tr>
        `;
    }
    
    return farmers.slice(0, 10).map(farmer => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-gray-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${farmer.name}</div>
                        <div class="text-sm text-gray-500">${farmer.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${farmer.farmerType || 'Not specified'}</div>
                <div class="text-sm text-gray-500">${farmer.address?.city || 'Location not set'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded ${farmer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${farmer.isVerified ? 'Verified' : 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">Rating: 4.5/5</div>
                <div class="text-sm text-gray-500">Orders: 24</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="verifyFarmer('${farmer._id}')" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="viewFarmerDetails('${farmer._id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteUser('${farmer._id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderBuyersTable(buyers) {
    if (!buyers || buyers.length === 0) {
        return `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    No buyers found
                </td>
            </tr>
        `;
    }
    
    return buyers.slice(0, 10).map(buyer => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i class="fas fa-user text-gray-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${buyer.name}</div>
                        <div class="text-sm text-gray-500">${buyer.email}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${buyer.businessType || 'Individual'}</div>
                <div class="text-sm text-gray-500">${buyer.address?.city || 'Location not set'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded ${buyer.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${buyer.isVerified ? 'Verified' : 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">₹5,240</div>
                <div class="text-sm text-gray-500">12 orders</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="verifyBuyer('${buyer._id}')" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="viewBuyerDetails('${buyer._id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteUser('${buyer._id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderProductsTable(products) {
    if (!products || products.length === 0) {
        return `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    No products found
                </td>
            </tr>
        `;
    }
    
    return products.slice(0, 10).map(product => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        <i class="fas fa-seedling text-gray-600"></i>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.qualityGrade || 'Standard'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${product.farmer?.name || 'Unknown'}</div>
                <div class="text-sm text-gray-500">${product.origin?.location?.city || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                    ${product.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">₹${product.price}/${product.unit}</div>
                <div class="text-sm ${product.availableQuantity > 10 ? 'text-green-600' : 'text-red-600'}">
                    Stock: ${product.availableQuantity}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="toggleProductStatus('${product._id}', ${!product.isActive})" class="text-${product.isActive ? 'yellow' : 'green'}-600 hover:text-${product.isActive ? 'yellow' : 'green'}-900 mr-3">
                    <i class="fas fa-${product.isActive ? 'pause' : 'play'}"></i>
                </button>
                <button onclick="editProduct('${product._id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteProduct('${product._id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderOrdersTable(orders) {
    if (!orders || orders.length === 0) {
        return `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    No orders found
                </td>
            </tr>
        `;
    }
    
    return orders.slice(0, 10).map(order => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${order.orderId}</div>
                <div class="text-sm text-gray-500">ID: ${order._id.substring(0, 8)}...</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.buyer?.name || 'Buyer'}</div>
                <div class="text-sm text-gray-500">→ ${order.farmer?.name || 'Farmer'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.items?.length || 0} items</div>
                <div class="text-sm text-gray-500">${order.items?.[0]?.name || 'No items'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">₹${order.totalAmount}</div>
                <div class="text-sm text-gray-500">${order.paymentMethod || 'N/A'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded ${getStatusBadgeClass(order.status)}">
                    ${order.status.replace(/_/g, ' ')}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(order.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="viewOrderDetails('${order._id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-eye"></i>
                </button>
                <button onclick="updateOrderStatus('${order._id}')" class="text-green-600 hover:text-green-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Helper functions
function getTotalUsers(stats) {
    if (!stats?.stats?.users) return 0;
    return stats.stats.users.reduce((total, userGroup) => total + (userGroup.count || 0), 0);
}

function getRoleBadgeClass(role) {
    const classes = {
        'farmer': 'bg-green-100 text-green-800',
        'buyer': 'bg-blue-100 text-blue-800',
        'admin': 'bg-purple-100 text-purple-800'
    };
    return classes[role] || 'bg-gray-100 text-gray-800';
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-yellow-100 text-yellow-800',
        'confirmed': 'bg-blue-100 text-blue-800',
        'processing': 'bg-indigo-100 text-indigo-800',
        'ready_for_delivery': 'bg-purple-100 text-purple-800',
        'out_for_delivery': 'bg-orange-100 text-orange-800',
        'delivered': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'returned': 'bg-pink-100 text-pink-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getCategoryIcon(category) {
    const icons = {
        'crop': 'leaf',
        'goat': 'horse',
        'cow': 'cow',
        'hen': 'kiwi-bird',
        'duck': 'feather-alt',
        'pig': 'piggy-bank',
        'rabbit': 'paw'
    };
    return icons[category] || 'tag';
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function calculateTotalRevenue() {
    if (!adminData.orders) return 0;
    return adminData.orders.reduce((total, order) => total + (order.totalAmount || 0), 0);
}

function calculateAverageOrderValue() {
    if (!adminData.orders || adminData.orders.length === 0) return 0;
    return Math.round(calculateTotalRevenue() / adminData.orders.length);
}

function getRecentlyVerified() {
    // This would come from API in real implementation
    return [
        { name: 'Rajesh Kumar', email: 'rajesh@example.com', role: 'farmer', verifiedAt: new Date().toISOString() },
        { name: 'Amit Sharma', email: 'amit@example.com', role: 'buyer', verifiedAt: new Date(Date.now() - 86400000).toISOString() }
    ];
}

function loadGeneralSettings() {
    return `
        <div class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                <input type="text" value="AgroForms" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
                <textarea rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg">Connecting farmers directly to retailers</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                <input type="number" value="5" min="0" max="50" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            
            <div>
                <label class="flex items-center">
                    <input type="checkbox" checked class="h-4 w-4 text-green-600">
                    <span class="ml-2 text-sm text-gray-700">Enable email notifications</span>
                </label>
            </div>
            
            <div>
                <label class="flex items-center">
                    <input type="checkbox" checked class="h-4 w-4 text-green-600">
                    <span class="ml-2 text-sm text-gray-700">Require user verification</span>
                </label>
            </div>
            
            <div>
                <label class="flex items-center">
                    <input type="checkbox" class="h-4 w-4 text-green-600">
                    <span class="ml-2 text-sm text-gray-700">Enable maintenance mode</span>
                </label>
            </div>
        </div>
    `;
}

// Initialize charts and other dynamic elements
function initAdminSection(section) {
    switch (section) {
        case 'dashboard':
            initDashboardCharts();
            break;
        case 'analytics':
            initAnalyticsCharts();
            break;
        case 'products':
            initProductsChart();
            break;
        case 'orders':
            initOrdersChart();
            break;
    }
}
/**
 * Initialize products chart for category distribution
 */
function initProductsChart() {
    const ctx = document.getElementById('products-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (adminCharts.products) {
        adminCharts.products.destroy();
    }

    // Get category data from products
    const categoryCounts = {};
    adminData.products.forEach(product => {
        const category = product.category || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const categories = Object.keys(categoryCounts);
    const counts = Object.values(categoryCounts);

    // Colors for chart
    const colors = [
        '#10B981', // green
        '#3B82F6', // blue
        '#8B5CF6', // purple
        '#F59E0B', // yellow
        '#EF4444', // red
        '#EC4899', // pink
        '#14B8A6', // teal
        '#6366F1', // indigo
    ];

    adminCharts.products = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} products (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

/**
 * Initialize orders chart for status distribution
 */
function initOrdersChart() {
    const ctx = document.getElementById('orders-chart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (adminCharts.orders) {
        adminCharts.orders.destroy();
    }

    // Get status data from orders
    const statusCounts = {};
    adminData.orders.forEach(order => {
        const status = order.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statuses = Object.keys(statusCounts);
    const counts = Object.values(statusCounts);

    // Define colors for each status
    const statusColors = {
        'pending': '#F59E0B', // yellow
        'confirmed': '#3B82F6', // blue
        'processing': '#8B5CF6', // purple
        'ready_for_delivery': '#EC4899', // pink
        'out_for_delivery': '#F97316', // orange
        'delivered': '#10B981', // green
        'cancelled': '#EF4444', // red
        'returned': '#6B7280', // gray
        'unknown': '#9CA3AF' // light gray
    };

    const backgroundColors = statuses.map(status => statusColors[status] || '#9CA3AF');

    adminCharts.orders = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: statuses.map(s => s.replace(/_/g, ' ').toUpperCase()),
            datasets: [{
                label: 'Number of Orders',
                data: counts,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                borderWidth: 1,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

/**
 * Initialize analytics charts
 */
function initAnalyticsCharts() {
    // Revenue Trend Chart
    const revenueTrendCtx = document.getElementById('revenue-trend-chart');
    if (revenueTrendCtx) {
        if (adminCharts.revenueTrend) {
            adminCharts.revenueTrend.destroy();
        }
        
        adminCharts.revenueTrend = new Chart(revenueTrendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Revenue (₹)',
                    data: [150000, 180000, 220000, 190000, 240000, 280000, 300000],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + formatNumber(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // User Growth Chart
    const userGrowthCtx = document.getElementById('user-growth-chart');
    if (userGrowthCtx) {
        if (adminCharts.userGrowth) {
            adminCharts.userGrowth.destroy();
        }
        
        adminCharts.userGrowth = new Chart(userGrowthCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [
                    {
                        label: 'Farmers',
                        data: [45, 60, 75, 80, 90, 110, 125],
                        backgroundColor: '#10B981'
                    },
                    {
                        label: 'Buyers',
                        data: [30, 45, 60, 70, 85, 100, 115],
                        backgroundColor: '#3B82F6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            stepSize: 20
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Top Products Chart
    const topProductsCtx = document.getElementById('top-products-chart');
    if (topProductsCtx) {
        if (adminCharts.topProducts) {
            adminCharts.topProducts.destroy();
        }
        
        adminCharts.topProducts = new Chart(topProductsCtx, {
            type: 'horizontalBar',
            data: {
                labels: ['Organic Tomatoes', 'Fresh Milk', 'Free-range Eggs', 'Basmati Rice', 'Green Chillies'],
                datasets: [{
                    label: 'Units Sold',
                    data: [120, 95, 80, 65, 50],
                    backgroundColor: [
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#F59E0B',
                        '#EC4899'
                    ],
                    borderColor: [
                        '#10B981',
                        '#3B82F6',
                        '#8B5CF6',
                        '#F59E0B',
                        '#EC4899'
                    ],
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Category Performance Chart
    const categoryPerformanceCtx = document.getElementById('category-performance-chart');
    if (categoryPerformanceCtx) {
        if (adminCharts.categoryPerformance) {
            adminCharts.categoryPerformance.destroy();
        }
        
        adminCharts.categoryPerformance = new Chart(categoryPerformanceCtx, {
            type: 'radar',
            data: {
                labels: ['Crops', 'Dairy', 'Poultry', 'Livestock', 'Vegetables', 'Fruits'],
                datasets: [{
                    label: 'Performance Score',
                    data: [85, 75, 90, 65, 80, 70],
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: '#10B981',
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }
}

// Update the initAdminSection function to properly handle chart initialization
function initAdminSection(section) {
    console.log('Initializing admin section:', section);
    
    // Initialize charts after a small delay to ensure DOM is ready
    setTimeout(() => {
        switch (section) {
            case 'dashboard':
                console.log('Initializing dashboard charts...');
                initDashboardCharts();
                break;
            case 'analytics':
                console.log('Initializing analytics charts...');
                initAnalyticsCharts();
                break;
            case 'products':
                console.log('Initializing products chart...');
                initProductsChart();
                break;
            case 'orders':
                console.log('Initializing orders chart...');
                initOrdersChart();
                break;
        }
    }, 100);
}

// Update the existing initDashboardCharts function to handle errors
function initDashboardCharts() {
    console.log('Initializing dashboard charts...');
    
    // Revenue Chart
    const revenueCtx = document.getElementById('revenue-chart');
    if (revenueCtx) {
        try {
            if (adminCharts.revenue) {
                adminCharts.revenue.destroy();
            }
            
            adminCharts.revenue = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            },
                            ticks: {
                                callback: function(value) {
                                    return '₹' + value;
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            console.log('Revenue chart initialized');
        } catch (error) {
            console.error('Error initializing revenue chart:', error);
        }
    } else {
        console.warn('Revenue chart element not found');
    }
    
    // Users Chart
    const usersCtx = document.getElementById('users-chart');
    if (usersCtx) {
        try {
            if (adminCharts.users) {
                adminCharts.users.destroy();
            }
            
            adminCharts.users = new Chart(usersCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                        {
                            label: 'Farmers',
                            data: [45, 60, 75, 80, 90, 110],
                            backgroundColor: '#059669'
                        },
                        {
                            label: 'Buyers',
                            data: [30, 45, 60, 70, 85, 100],
                            backgroundColor: '#3b82f6'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
            console.log('Users chart initialized');
        } catch (error) {
            console.error('Error initializing users chart:', error);
        }
    } else {
        console.warn('Users chart element not found');
    }
}

/**
 * Generic chart initialization for any section
 */
function initCharts() {
    console.log('Initializing generic charts');
    // This can be called from anywhere to initialize available charts
    initDashboardCharts();
}

// Export the chart functions to global scope
window.initProductsChart = initProductsChart;
window.initOrdersChart = initOrdersChart;
window.initAnalyticsCharts = initAnalyticsCharts;
window.initDashboardCharts = initDashboardCharts;
window.initCharts = initCharts;

function initDashboardCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenue-chart');
    if (revenueCtx) {
        adminCharts.revenue = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Users Chart
    const usersCtx = document.getElementById('users-chart');
    if (usersCtx) {
        adminCharts.users = new Chart(usersCtx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Farmers',
                        data: [45, 60, 75, 80, 90, 110],
                        backgroundColor: '#059669'
                    },
                    {
                        label: 'Buyers',
                        data: [30, 45, 60, 70, 85, 100],
                        backgroundColor: '#3b82f6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Other initialization functions would be similar...

// Action functions
async function verifyUser(userId, status) {
    try {
        await api.verifyUser(userId, status);
        showToast(`User ${status} successfully`, 'success');
        loadAdminSection(currentAdminSection);
    } catch (error) {
        showToast('Failed to verify user', 'error');
    }
}

async function toggleProductStatus(productId, isActive) {
    try {
        await api.updateProductStatus(productId, isActive);
        showToast(`Product ${isActive ? 'activated' : 'deactivated'}`, 'success');
        loadAdminSection(currentAdminSection);
    } catch (error) {
        showToast('Failed to update product status', 'error');
    }
}

// Export to global scope
window.initAdminPanel = initAdminPanel;
window.loadAdminSection = loadAdminSection;
window.refreshAdminData = refreshAdminData;
window.verifyUser = verifyUser;
window.toggleProductStatus = toggleProductStatus;