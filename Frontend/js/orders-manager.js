// Orders Manager functionality

let currentTab = 'all';
let currentRole = null;
let orders = [];

function initOrdersManager() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    currentRole = user.role;
    
    // Set title based on role
    const title = document.getElementById('orders-title');
    const subtitle = document.getElementById('orders-subtitle');
    
    if (title && subtitle) {
        switch (currentRole) {
            case 'farmer':
                title.textContent = 'My Orders';
                subtitle.textContent = 'Manage incoming orders from buyers';
                break;
            case 'buyer':
                title.textContent = 'My Orders';
                subtitle.textContent = 'Track your purchases and deliveries';
                break;
            case 'admin':
                title.textContent = 'Order Management';
                subtitle.textContent = 'Monitor all platform orders';
                break;
        }
    }

    // Load tabs based on role
    loadOrderTabs();
    
    // Load initial orders
    loadOrders();
    
    // Setup filters
    setupOrderFilters();
}

function loadOrderTabs() {
    const tabsContainer = document.getElementById('orders-tabs');
    if (!tabsContainer) return;

    let tabs = '';
    
    if (currentRole === 'farmer') {
        tabs = `
            <button onclick="switchOrderTab('all')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-green-600 text-green-600">
                All Orders
            </button>
            <button onclick="switchOrderTab('pending')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Pending Approval
            </button>
            <button onclick="switchOrderTab('confirmed')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Confirmed
            </button>
            <button onclick="switchOrderTab('processing')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Processing
            </button>
            <button onclick="switchOrderTab('delivered')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Delivered
            </button>
        `;
    } else if (currentRole === 'buyer') {
        tabs = `
            <button onclick="switchOrderTab('all')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-green-600 text-green-600">
                All Orders
            </button>
            <button onclick="switchOrderTab('pending')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Pending
            </button>
            <button onclick="switchOrderTab('confirmed')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Confirmed
            </button>
            <button onclick="switchOrderTab('shipped')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Shipped
            </button>
            <button onclick="switchOrderTab('delivered')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Delivered
            </button>
        `;
    } else if (currentRole === 'admin') {
        tabs = `
            <button onclick="switchOrderTab('all')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-green-600 text-green-600">
                All Orders
            </button>
            <button onclick="switchOrderTab('pending')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Pending
            </button>
            <button onclick="switchOrderTab('active')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Active
            </button>
            <button onclick="switchOrderTab('completed')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Completed
            </button>
            <button onclick="switchOrderTab('cancelled')" class="order-tab px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-600 hover:text-green-600">
                Cancelled
            </button>
        `;
    }
    
    tabsContainer.innerHTML = tabs;
}

function switchOrderTab(tab) {
    currentTab = tab;
    
    // Update active tab styling
    document.querySelectorAll('.order-tab').forEach(tabElement => {
        tabElement.classList.remove('border-green-600', 'text-green-600');
        tabElement.classList.add('border-transparent', 'text-gray-600', 'hover:text-green-600');
    });
    
    // Set active tab
    const activeTab = document.querySelector(`[onclick="switchOrderTab('${tab}')"]`);
    if (activeTab) {
        activeTab.classList.add('border-green-600', 'text-green-600');
        activeTab.classList.remove('border-transparent', 'text-gray-600', 'hover:text-green-600');
    }
    
    // Load orders for selected tab
    loadOrders();
}

async function loadOrders() {
    const ordersContainer = document.getElementById('orders-container');
    const emptyState = document.getElementById('orders-empty');
    
    if (!ordersContainer) return;
    
    // Show loading
    ordersContainer.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p class="mt-4 text-gray-600">Loading orders...</p>
        </div>
    `;
    
    if (emptyState) emptyState.classList.add('hidden');

    try {
        let response;
        
        switch (currentRole) {
            case 'farmer':
                response = await api.getFarmerOrders();
                break;
            case 'buyer':
                response = await api.getBuyerOrders();
                break;
            case 'admin':
                response = await api.getAllOrders();
                break;
            default:
                return;
        }
        
        orders = response.orders || [];
        
        // Filter orders based on current tab
        let filteredOrders = filterOrdersByTab(orders);
        
        if (filteredOrders.length === 0) {
            ordersContainer.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        // Display orders
        ordersContainer.innerHTML = `
            <div class="space-y-6">
                ${filteredOrders.map(order => createOrderCard(order)).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Orders</h3>
                <p class="text-gray-600 mb-4">${error.message || 'Please try again later'}</p>
                <button onclick="loadOrders()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Retry
                </button>
            </div>
        `;
    }
}

function filterOrdersByTab(orders) {
    if (currentTab === 'all') return orders;
    
    switch (currentRole) {
        case 'farmer':
            return orders.filter(order => {
                if (currentTab === 'pending') {
                    return order.status === 'pending' || order.approvalStatus === 'pending';
                }
                return order.status === currentTab;
            });
            
        case 'buyer':
            return orders.filter(order => {
                if (currentTab === 'pending') {
                    return order.status === 'pending' || order.approvalStatus === 'pending' || order.approvalStatus === 'negotiating';
                }
                if (currentTab === 'shipped') {
                    return order.status === 'out_for_delivery' || order.status === 'ready_for_delivery';
                }
                return order.status === currentTab;
            });
            
        case 'admin':
            return orders.filter(order => {
                if (currentTab === 'active') {
                    return ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery'].includes(order.status);
                }
                if (currentTab === 'completed') {
                    return ['delivered', 'completed'].includes(order.status);
                }
                return order.status === currentTab;
            });
            
        default:
            return orders;
    }
}

function createOrderCard(order) {
    const status = order.status || 'pending';
    const statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const statusClass = getStatusBadgeClass(status);
    
    const partyName = currentRole === 'farmer' 
        ? (order.buyer?.name || 'Buyer')
        : (order.farmer?.name || 'Farmer');
    
    const partyRole = currentRole === 'farmer' ? 'Buyer' : 'Farmer';
    
    const itemsPreview = order.items?.slice(0, 2).map(item => 
        `${item.quantity} × ${item.name || 'Product'}`
    ).join(', ');
    
    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    return `
        <div class="bg-white rounded-xl shadow border border-gray-200 hover:border-green-300 transition duration-300" data-order-id="${order._id}">
            <!-- Order Header -->
            <div class="p-4 border-b">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div class="flex items-center gap-3 mb-1">
                            <h3 class="font-semibold text-gray-800">Order #${order.orderId}</h3>
                            <span class="px-2 py-1 text-xs rounded ${statusClass}">${statusText}</span>
                        </div>
                        <p class="text-sm text-gray-600">Placed on ${formatDate(order.createdAt)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-800">₹${order.totalAmount || 0}</p>
                        <p class="text-sm text-gray-600">${totalItems} items</p>
                    </div>
                </div>
            </div>

            <!-- Order Items Preview -->
            <div class="p-4 border-b">
                <div class="flex items-center gap-4 mb-3">
                    <div class="flex -space-x-2">
                        ${order.items?.slice(0, 3).map((item, index) => `
                            <div class="w-10 h-10 bg-gray-${200 + (index * 100)} rounded-full border-2 border-white flex items-center justify-center">
                                <i class="fas fa-seedling text-gray-600 text-sm"></i>
                            </div>
                        `).join('')}
                        ${order.items?.length > 3 ? `
                            <div class="w-10 h-10 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                                <span class="text-xs font-bold text-white">+${order.items.length - 3}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="text-sm text-gray-600">
                        ${itemsPreview || 'No items'}${order.items?.length > 2 ? '...' : ''}
                    </div>
                </div>
            </div>

            <!-- Order Footer -->
            <div class="p-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-gray-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800">${partyName}</p>
                            <p class="text-xs text-gray-600">${partyRole}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="viewOrderDetails('${order._id}')" class="view-detail-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                            View Details
                        </button>
                        ${getActionButton(order)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getActionButton(order) {
    const status = order.status || 'pending';
    const approvalStatus = order.approvalStatus || 'pending';
    
    if (currentRole === 'farmer') {
        if (status === 'pending' && approvalStatus === 'pending') {
            return `
                <button onclick="reviewOrder('${order._id}')" class="action-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                    Review Order
                </button>
            `;
        } else if (status === 'confirmed') {
            return `
                <button onclick="processOrder('${order._id}')" class="action-btn px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    Process Order
                </button>
            `;
        } else if (status === 'ready_for_delivery') {
            return `
                <button onclick="prepareDelivery('${order._id}')" class="action-btn px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                    Prepare Delivery
                </button>
            `;
        }
    } else if (currentRole === 'buyer') {
        if (status === 'pending' && approvalStatus === 'negotiating') {
            return `
                <button onclick="respondToNegotiationPrompt('${order._id}')" class="action-btn px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium">
                    Respond
                </button>
            `;
        } else if (status === 'delivered') {
            return `
                <button onclick="rateOrder('${order._id}')" class="action-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                    Rate Order
                </button>
            `;
        }
    } else if (currentRole === 'admin') {
        return `
            <button onclick="manageOrder('${order._id}')" class="action-btn px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                Manage
            </button>
        `;
    }
    
    return '';
}

function setupOrderFilters() {
    const statusFilter = document.getElementById('status-filter');
    if (!statusFilter) return;

    // Clear existing options
    statusFilter.innerHTML = '<option value="">All Status</option>';
    
    let statuses = [];
    
    if (currentRole === 'farmer') {
        statuses = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'];
    } else if (currentRole === 'buyer') {
        statuses = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'];
    } else if (currentRole === 'admin') {
        statuses = ['pending', 'confirmed', 'processing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    }
    
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        statusFilter.appendChild(option);
    });
}

function applyOrderFilters() {
    // Implement filter logic here
    loadOrders();
}

function viewOrderDetails(orderId) {
    // Navigate to order detail page or show modal
    window.location.href = `orders-manager.html?order=${orderId}`;
}

// Add modal support at the end of the file

// Simple modal implementation
window.showModal = function(options) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div class="p-6 border-b">
                <div class="flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-800">${options.title || 'Modal'}</h3>
                    <button onclick="this.closest('.fixed').remove(); document.body.style.overflow = ''" 
                            class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                ${options.subtitle ? `<p class="text-gray-600 mt-2">${options.subtitle}</p>` : ''}
            </div>
            <div class="p-6">
                ${options.body || ''}
            </div>
            <div class="p-6 border-t flex justify-end gap-3">
                ${options.buttons ? options.buttons.map(btn => `
                    <button onclick="${btn.onClick ? `(${btn.onClick.toString()})(); this.closest('.fixed').remove(); document.body.style.overflow = ''` : `this.closest('.fixed').remove(); document.body.style.overflow = ''`}" 
                            class="${btn.class || 'bg-gray-200 text-gray-700 hover:bg-gray-300'} px-4 py-2 rounded-lg">
                        ${btn.text || 'Close'}
                    </button>
                `).join('') : `
                    <button onclick="this.closest('.fixed').remove(); document.body.style.overflow = ''" 
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Close
                    </button>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    return modal;
};

window.closeModal = function() {
    const modal = document.querySelector('.fixed.inset-0.bg-black');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
};

// Simple toast implementation
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-600 text-white' :
        type === 'error' ? 'bg-red-600 text-white' :
        type === 'warning' ? 'bg-yellow-600 text-white' :
        'bg-blue-600 text-white'
    }`;
    toast.style.animation = 'fadeIn 0.3s ease-out';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Add CSS animations
if (!document.querySelector('#modal-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'modal-toast-styles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(20px); }
        }
    `;
    document.head.appendChild(style);
}

function reviewOrder(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    showModal({
        title: 'Review Order',
        subtitle: `Order #${order.orderId}`,
        body: `
            <div class="space-y-4">
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Order Details</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">Buyer:</span>
                            <span class="font-medium">${order.buyer?.name || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between mb-2">
                            <span class="text-gray-600">Total Amount:</span>
                            <span class="font-medium">₹${order.totalAmount}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Items:</span>
                            <span class="font-medium">${order.items?.length || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-2">Action</h4>
                    <div class="space-y-3">
                        <button onclick="approveOrderAction('${orderId}')" class="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-check mr-2"></i> Approve Order
                        </button>
                        <button onclick="rejectOrderAction('${orderId}')" class="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            <i class="fas fa-times mr-2"></i> Reject Order
                        </button>
                        <button onclick="negotiateOrderAction('${orderId}')" class="w-full p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                            <i class="fas fa-comments mr-2"></i> Negotiate Terms
                        </button>
                    </div>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                onClick: () => {}
            }
        ]
    });
}

async function handleOrderAction(orderId, action, data = {}) {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showToast('Please login first', 'error');
            return;
        }

        showLoading('Processing...');

        let result;
        
        switch (action) {
            case 'approve':
                result = await api.approveOrder(orderId, 'approve', {
                    message: data.message || 'Order approved'
                });
                showToast('Order approved successfully!', 'success');
                break;
                
            case 'reject':
                // Determine cancellation reason based on user role
                const cancellationReason = user.role === 'farmer' 
                    ? 'farmer_cancelled' 
                    : 'buyer_cancelled';
                
                result = await api.approveOrder(orderId, 'reject', {
                    message: data.message || 'Order rejected',
                    cancellationReason: cancellationReason
                });
                showToast('Order rejected', 'info');
                break;
                
            case 'negotiate':
                result = await api.approveOrder(orderId, 'negotiate', {
                    proposedPrice: data.proposedPrice,
                    proposedQuantity: data.proposedQuantity,
                    message: data.message
                });
                showToast('Negotiation request sent!', 'success');
                break;
                
            default:
                throw new Error('Invalid action');
        }

        closeModal();
        loadOrders();
        
    } catch (error) {
        console.error(`Error in ${action} action:`, error);
        showToast(error.message || `Failed to ${action} order`, 'error');
    } finally {
        hideLoading();
    }
}

async function approveOrderAction(orderId) {
    try {
        await api.approveOrder(orderId, 'approve');
        showToast('Order approved successfully!', 'success');
        closeModal();
        loadOrders();
    } catch (error) {
        showToast('Failed to approve order', 'error');
    }
}

async function rejectOrderAction(orderId) {
    try {
        // Use correct cancellation reason
        await api.approveOrder(orderId, 'reject', {
            cancellationReason: 'farmer_cancelled',
            message: 'Order rejected by farmer'
        });
        showToast('Order rejected', 'info');
        closeModal();
        loadOrders();
    } catch (error) {
        showToast('Failed to reject order', 'error');
        console.error('Reject order error:', error);
    }
}

async function negotiateOrderAction(orderId) {
    showModal({
        title: 'Negotiate Order',
        body: `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Proposed Price</label>
                    <input type="number" id="negotiate-price" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Enter new price">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message to Buyer</label>
                    <textarea id="negotiate-message" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Explain your counter-offer..."></textarea>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                onClick: () => {}
            },
            {
                text: 'Send Counter-Offer',
                class: 'bg-yellow-600 text-white hover:bg-yellow-700',
                onClick: async () => {
                    const price = document.getElementById('negotiate-price').value;
                    const message = document.getElementById('negotiate-message').value;
                    
                    if (!price || !message) {
                        showToast('Please fill in all fields', 'error');
                        return;
                    }
                    
                    try {
                        await api.approveOrder(orderId, 'negotiate', {
                            proposedPrice: parseFloat(price),
                            message: message
                        });
                        showToast('Counter-offer sent successfully!', 'success');
                        closeModal();
                        loadOrders();
                    } catch (error) {
                        showToast('Failed to send counter-offer', 'error');
                        console.error('Negotiate error:', error);
                    }
                }
            }
        ]
    });
}

function processOrder(orderId) {
    // Implement process order logic
    showToast('Processing order...', 'info');
}

function prepareDelivery(orderId) {
    // Implement delivery preparation logic
    showToast('Preparing delivery...', 'info');
}

async function respondToNegotiation(orderId, action, data = {}) {
    try {
        showLoading('Processing...');
        
        const result = await api.respondToNegotiation(orderId, action, data);
        
        if (action === 'accept') {
            showToast('Negotiation accepted! Order confirmed.', 'success');
        } else if (action === 'reject') {
            showToast('Negotiation rejected.', 'info');
        } else if (action === 'counter') {
            showToast('Counter-offer sent!', 'success');
        }
        
        loadOrders();
        
    } catch (error) {
        console.error('Respond to negotiation error:', error);
        showToast(error.message || 'Failed to process negotiation', 'error');
    } finally {
        hideLoading();
    }
}
// Show modal for buyer to respond to negotiation
function respondToNegotiationPrompt(orderId) {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const negotiation = order.negotiationDetails;
    
    showModal({
        title: 'Respond to Negotiation',
        subtitle: `Order #${order.orderId}`,
        body: `
            <div class="space-y-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-comments text-yellow-600"></i>
                        <h4 class="font-medium text-yellow-800">Farmer's Proposal</h4>
                    </div>
                    ${negotiation?.farmerMessage ? `
                        <p class="text-yellow-700 mb-3">"${negotiation.farmerMessage}"</p>
                    ` : ''}
                    ${negotiation?.proposedPrice ? `
                        <div class="flex justify-between items-center">
                            <span class="text-yellow-700">Proposed Price:</span>
                            <span class="font-bold text-yellow-800">₹${negotiation.proposedPrice}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div>
                    <h4 class="font-medium text-gray-700 mb-3">Your Response</h4>
                    <div class="space-y-3">
                        <button onclick="respondToNegotiation('${orderId}', 'accept')" 
                                class="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-check mr-2"></i> Accept Proposal
                        </button>
                        <button onclick="showCounterOfferModal('${orderId}')" 
                                class="w-full p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                            <i class="fas fa-exchange-alt mr-2"></i> Make Counter-Offer
                        </button>
                        <button onclick="respondToNegotiation('${orderId}', 'reject', {message: 'Not interested in this offer'})" 
                                class="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            <i class="fas fa-times mr-2"></i> Reject Proposal
                        </button>
                    </div>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                onClick: () => {}
            }
        ]
    });
}

// Counter offer modal for buyers
function showCounterOfferModal(orderId) {
    showModal({
        title: 'Make Counter-Offer',
        body: `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Your Proposed Price</label>
                    <input type="number" id="counter-price" 
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                           placeholder="Enter your counter-offer price" step="0.01" min="0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                    <textarea id="counter-message" rows="3" 
                              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Explain your counter-offer..."></textarea>
                </div>
            </div>
        `,
        buttons: [
            {
                text: 'Cancel',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                onClick: () => {}
            },
            {
                text: 'Send Counter-Offer',
                class: 'bg-yellow-600 text-white hover:bg-yellow-700',
                onClick: async () => {
                    const price = document.getElementById('counter-price').value;
                    const message = document.getElementById('counter-message').value;
                    
                    if (!price || !message) {
                        showToast('Please fill in all fields', 'error');
                        return;
                    }
                    
                    await respondToNegotiation(orderId, 'counter', {
                        acceptPrice: parseFloat(price),
                        message: message
                    });
                }
            }
        ]
    });
}

function rateOrder(orderId) {
    // Show rating modal
    showToast('Rate order', 'info');
}

function manageOrder(orderId) {
    // Show admin management modal
    showToast('Manage order', 'info');
}



// Utility functions
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

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}


// Export to global scope
window.initOrdersManager = initOrdersManager;
window.switchOrderTab = switchOrderTab;
window.applyOrderFilters = applyOrderFilters;
window.viewOrderDetails = viewOrderDetails;
window.reviewOrder = reviewOrder;
window.approveOrderAction = approveOrderAction;
window.rejectOrderAction = rejectOrderAction;
window.negotiateOrderAction = negotiateOrderAction;
window.processOrder = processOrder;
window.prepareDelivery = prepareDelivery;
window.respondToNegotiationPrompt = respondToNegotiationPrompt;
window.rateOrder = rateOrder;
window.manageOrder = manageOrder;