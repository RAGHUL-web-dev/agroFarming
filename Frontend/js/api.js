// API Client for AgroForms

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const user = JSON.parse(localStorage.getItem('user'));
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (user && user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }
        
        const config = {
            ...options,
            headers,
            credentials: 'include'
        };
        
        try {
            const response = await fetch(url, config);
            
            // Handle unauthorized
            if (response.status === 401) {
                localStorage.removeItem('user');
                window.location.href = 'auth.html';
                return null;
            }
            
            // Parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            if (!response.ok) {
                const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ===== AUTH ENDPOINTS =====
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    async updateProfile(data) {
        return this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async changePassword(currentPassword, newPassword) {
        return this.request('/auth/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    // ===== PRODUCT ENDPOINTS =====
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products?${queryString}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}`);
    }

    async createProduct(productData) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(id, productData) {
        return this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    async getCategories() {
        return this.request('/products/categories');
    }

    async getProductsByFarmer(farmerId) {
        return this.request(`/products/farmer/${farmerId}`);
    }

    // ===== ORDER ENDPOINTS =====
    async createOrder(orderData) {
        return this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrder(id) {
        return this.request(`/orders/${id}`);
    }

    async getBuyerOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/orders/buyer?${queryString}`);
    }

    async getFarmerOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/farmers/orders?${queryString}`);
    }

    async getPendingApprovalOrders() {
        return this.request('/farmers/orders/pending-approval');
    }

    async updateOrderStatus(id, status, notes = '') {
        return this.request(`/orders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ action: 'update_status', status, notes })
        });
    }

    async approveOrder(id, action, data = {}) {
        return this.request(`/orders/${id}/approve`, {
            method: 'PUT',
            body: JSON.stringify({ action, ...data })
        });
    }

    async respondToNegotiation(id, action, data = {}) {
        return this.request(`/orders/${id}/negotiate`, {
            method: 'PUT',
            body: JSON.stringify({ action, ...data })
        });
    }

    // ===== FARMER ENDPOINTS =====
    async getFarmerProfile() {
        return this.request('/farmers/profile');
    }

    async updateFarmerProfile(data) {
        return this.request('/farmers/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getFarmerProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/farmers/products?${queryString}`);
    }

    async getFarmerDashboardStats() {
        return this.request('/farmers/dashboard');
    }

    // ===== BUYER ENDPOINTS =====
    async getBuyerProfile() {
        return this.request('/buyers/profile');
    }

    async updateBuyerProfile(data) {
        return this.request('/buyers/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getBuyerDashboardStats() {
        return this.request('/buyers/dashboard');
    }

    async getFavorites() {
        return this.request('/buyers/favorites');
    }

    async addToFavorites(productId) {
        return this.request('/buyers/favorites', {
            method: 'POST',
            body: JSON.stringify({ productId })
        });
    }

    async removeFromFavorites(productId) {
        return this.request(`/buyers/favorites/${productId}`, {
            method: 'DELETE'
        });
    }

    // Note: Cart endpoints are handled via localStorage for simplicity
    // You can implement backend cart if needed

    // ===== ADMIN ENDPOINTS =====
    async getAdminStats() {
        return this.request('/admin/stats/platform');
    }

    async getAllUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin/users?${queryString}`);
    }

    async getUser(id) {
        return this.request(`/admin/users/${id}`);
    }

    async updateUser(id, data) {
        return this.request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async verifyUser(id, status) {
        return this.request(`/admin/users/${id}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ verificationStatus: status })
        });
    }

    async getAllProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin/products?${queryString}`);
    }

    async updateProductStatus(id, isActive) {
        return this.request(`/admin/products/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });
    }

    async getAllOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/admin/orders?${queryString}`);
    }

    async getCategoriesList() {
        return this.request('/admin/categories');
    }

    async createCategory(data) {
        return this.request('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCategory(id, data) {
        return this.request('/admin/categories', {
            method: 'PUT',
            body: JSON.stringify({ id, ...data })
        });
    }

    async deleteCategory(id) {
        return this.request(`/admin/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== ANALYTICS ENDPOINTS =====
    async getFarmerAnalytics(period = 'monthly') {
        return this.request(`/analytics/farmer?period=${period}`);
    }

    async getBuyerAnalytics(period = 'monthly') {
        return this.request(`/analytics/buyer?period=${period}`);
    }

    async getMarketTrends() {
        return this.request('/analytics/market-trends');
    }

    // ===== DELIVERY ENDPOINTS =====
    async createDelivery(data) {
        return this.request('/deliveries', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getDeliveries(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/deliveries?${queryString}`);
    }

    async getDelivery(id) {
        return this.request(`/deliveries/${id}`);
    }

    async updateDelivery(id, data) {
        return this.request(`/deliveries/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async assignDriver(deliveryId, driverId, vehicleNumber) {
        return this.request(`/deliveries/${deliveryId}/assign`, {
            method: 'PUT',
            body: JSON.stringify({ driverId, vehicleNumber })
        });
    }

    async updateTracking(deliveryId, data) {
        return this.request(`/deliveries/${deliveryId}/tracking`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

// Create global API instance
const api = new ApiClient();
window.api = api;