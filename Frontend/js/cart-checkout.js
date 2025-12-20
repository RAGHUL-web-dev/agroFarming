// Cart and Checkout functionality

let currentStep = 1;
let checkoutData = {
    cartItems: [],
    selectedAddress: null,
    deliveryDate: null,
    deliveryTime: '9-12',
    paymentMethod: 'cash_on_delivery',
    orderNotes: '',
    orderSummary: {
        subtotal: 0,
        deliveryFee: 0,
        tax: 0,
        total: 0
    }
};

function initCartCheckout() {
    // Load cart items
    loadCartItems();
    
    // Setup step navigation
    setupStepNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize addresses
    loadAddresses();
    
    // Update step progress
    updateStepProgress();
}

function loadCartItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    checkoutData.cartItems = cart;
    
    updateCartDisplay();
    updateOrderSummary();
    updateCartCount();
}

function updateCartDisplay() {
    const container = document.getElementById('cart-items-container');
    const emptyCart = document.getElementById('empty-cart');
    const itemCount = document.getElementById('cart-item-count');
    const proceedBtn = document.getElementById('proceed-to-delivery-btn');
    
    if (!container) return;
    
    if (checkoutData.cartItems.length === 0) {
        container.style.display = 'none';
        if (emptyCart) emptyCart.classList.remove('hidden');
        if (itemCount) itemCount.textContent = '0 items';
        if (proceedBtn) {
            proceedBtn.disabled = true;
            proceedBtn.classList.add('disabled:opacity-50', 'disabled:cursor-not-allowed');
        }
        return;
    }
    
    container.style.display = 'block';
    if (emptyCart) emptyCart.classList.add('hidden');
    
    let html = '';
    let totalItems = 0;
    
    checkoutData.cartItems.forEach((item, index) => {
        const product = item.product || {};
        const quantity = item.quantity || 1;
        totalItems += quantity;
        
        html += `
            <div class="flex items-start gap-4 p-4 border-b border-gray-200" data-item-id="${item.productId}">
                <!-- Product Image -->
                <div class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0].url}" alt="${product.name}" class="w-full h-full object-cover rounded-lg">` :
                        `<i class="fas fa-seedling text-gray-400 text-xl"></i>`
                    }
                </div>
                
                <!-- Product Details -->
                <div class="flex-1">
                    <div class="flex justify-between">
                        <div>
                            <h4 class="font-semibold text-gray-800">${product.name || 'Product'}</h4>
                            <p class="text-sm text-gray-600">${product.farmer?.name || 'Farmer'}</p>
                            <p class="text-sm text-gray-600">${product.category || 'Category'} • ${product.qualityGrade || 'Standard'}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-gray-800">₹${(product.price || 0) * quantity}</p>
                            <p class="text-sm text-gray-600">₹${product.price || 0} / ${product.unit || 'unit'}</p>
                        </div>
                    </div>
                    
                    <!-- Quantity Controls -->
                    <div class="flex items-center justify-between mt-3">
                        <div class="flex items-center gap-2">
                            <button onclick="updateQuantity('${item.productId}', ${quantity - 1})" 
                                    class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 ${quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                                <i class="fas fa-minus text-sm"></i>
                            </button>
                            <span class="w-12 text-center font-medium">${quantity}</span>
                            <button onclick="updateQuantity('${item.productId}', ${quantity + 1})" 
                                    class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 ${quantity >= (product.availableQuantity || 99) ? 'opacity-50 cursor-not-allowed' : ''}">
                                <i class="fas fa-plus text-sm"></i>
                            </button>
                            <span class="text-sm text-gray-600 ml-2">Max: ${product.availableQuantity || 'N/A'}</span>
                        </div>
                        <button onclick="removeItem('${item.productId}')" 
                                class="text-red-600 hover:text-red-700 text-sm font-medium">
                            <i class="fas fa-trash-alt mr-1"></i> Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (itemCount) itemCount.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'}`;
    if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
    }
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(productId);
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.productId === productId);
    
    if (itemIndex !== -1) {
        const product = cart[itemIndex].product;
        const maxQuantity = product?.availableQuantity || 99;
        
        if (newQuantity > maxQuantity) {
            showToast(`Maximum available quantity is ${maxQuantity}`, 'warning');
            return;
        }
        
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Reload cart
        loadCartItems();
        showToast('Quantity updated', 'success');
    }
}

function removeItem(productId) {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
        return;
    }
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Reload cart
    loadCartItems();
    showToast('Item removed from cart', 'success');
}

function updateOrderSummary() {
    let subtotal = 0;
    
    checkoutData.cartItems.forEach(item => {
        const price = item.product?.price || 0;
        subtotal += price * (item.quantity || 1);
    });
    
    // Calculate delivery fee (free above ₹500)
    const deliveryFee = subtotal > 500 ? 0 : 50;
    
    // Calculate tax (5%)
    const tax = subtotal * 0.05;
    
    const total = subtotal + deliveryFee + tax;
    
    checkoutData.orderSummary = {
        subtotal,
        deliveryFee,
        tax,
        total
    };
    
    // Update UI
    const subtotalEl = document.getElementById('summary-subtotal');
    const deliveryEl = document.getElementById('summary-delivery');
    const taxEl = document.getElementById('summary-tax');
    const totalEl = document.getElementById('summary-total');
    
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (deliveryEl) deliveryEl.textContent = `₹${deliveryFee.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `₹${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}

function setupStepNavigation() {
    // No need to set up here, as buttons call nextStep() and prevStep() directly
}

function setupEventListeners() {
    // Payment method selection
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            checkoutData.paymentMethod = e.target.value;
        });
    });
    
    // Delivery date
    const deliveryDate = document.getElementById('delivery-date');
    if (deliveryDate) {
        deliveryDate.addEventListener('change', (e) => {
            checkoutData.deliveryDate = e.target.value;
        });
    }
    
    // Delivery time
    const deliveryTime = document.getElementById('delivery-time');
    if (deliveryTime) {
        deliveryTime.addEventListener('change', (e) => {
            checkoutData.deliveryTime = e.target.value;
        });
    }
    
    // Order notes
    const orderNotes = document.getElementById('order-notes');
    if (orderNotes) {
        orderNotes.addEventListener('input', (e) => {
            checkoutData.orderNotes = e.target.value;
        });
    }
}

function nextStep() {
    if (currentStep === 1 && checkoutData.cartItems.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return;
    }
    
    // Hide current step
    const currentStepEl = document.getElementById(`step-${getStepName(currentStep)}`);
    if (currentStepEl) {
        currentStepEl.classList.add('hidden');
    }
    
    // Update step
    currentStep++;
    
    // Show next step
    const nextStepEl = document.getElementById(`step-${getStepName(currentStep)}`);
    if (nextStepEl) {
        nextStepEl.classList.remove('hidden');
    }
    
    // Update step progress UI
    updateStepProgress();
    
    // Load step-specific content
    loadStepContent(currentStep);
}

function prevStep() {
    // Hide current step
    const currentStepEl = document.getElementById(`step-${getStepName(currentStep)}`);
    if (currentStepEl) {
        currentStepEl.classList.add('hidden');
    }
    
    // Update step
    currentStep--;
    
    // Show previous step
    const prevStepEl = document.getElementById(`step-${getStepName(currentStep)}`);
    if (prevStepEl) {
        prevStepEl.classList.remove('hidden');
    }
    
    // Update step progress UI
    updateStepProgress();
}

function getStepName(stepNumber) {
    const steps = ['cart', 'delivery', 'payment', 'review'];
    return steps[stepNumber - 1] || 'cart';
}

function updateStepProgress() {
    // Update step numbers
    for (let i = 1; i <= 4; i++) {
        const stepNumber = document.querySelector(`.flex.items-center:nth-child(${i}) .w-8`);
        const stepText = document.querySelector(`.flex.items-center:nth-child(${i}) .font-medium`);
        
        if (stepNumber) {
            if (i < currentStep) {
                stepNumber.className = 'w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold';
                stepNumber.innerHTML = '<i class="fas fa-check text-sm"></i>';
            } else if (i === currentStep) {
                stepNumber.className = 'w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold';
                stepNumber.textContent = i;
            } else {
                stepNumber.className = 'w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold';
                stepNumber.textContent = i;
            }
        }
        
        if (stepText) {
            if (i <= currentStep) {
                stepText.classList.remove('text-gray-600');
                stepText.classList.add('text-green-600');
            } else {
                stepText.classList.remove('text-green-600');
                stepText.classList.add('text-gray-600');
            }
        }
    }
    
    // Update connecting lines
    const lines = document.querySelectorAll('.flex-1.h-1');
    lines.forEach((line, index) => {
        if (index < currentStep - 1) {
            line.classList.remove('bg-gray-300');
            line.classList.add('bg-green-600');
        } else {
            line.classList.remove('bg-green-600');
            line.classList.add('bg-gray-300');
        }
    });
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1: // Cart
            if (checkoutData.cartItems.length === 0) {
                showToast('Your cart is empty', 'error');
                return false;
            }
            return true;
            
        case 2: // Delivery
            if (!checkoutData.selectedAddress) {
                showToast('Please select a delivery address', 'error');
                return false;
            }
            if (!checkoutData.deliveryDate) {
                showToast('Please select a delivery date', 'error');
                return false;
            }
            return true;
            
        case 3: // Payment
            if (!checkoutData.paymentMethod) {
                showToast('Please select a payment method', 'error');
                return false;
            }
            return true;
            
        default:
            return true;
    }
}

function loadStepContent(step) {
    switch (step) {
        case 2: // Delivery
            loadAddressList();
            break;
        case 4: // Review
            loadReviewContent();
            break;
    }
}

// Address Management
async function loadAddresses() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        
        // In a real app, you'd fetch addresses from API
        // For now, use mock data or localStorage
        const addresses = JSON.parse(localStorage.getItem('user_addresses')) || [
            {
                id: '1',
                name: 'Home',
                address: '123 Main Street, City, State 123456',
                phone: user.phone || '9876543210',
                isDefault: true
            }
        ];
        
        if (addresses.length > 0 && !checkoutData.selectedAddress) {
            checkoutData.selectedAddress = addresses.find(addr => addr.isDefault) || addresses[0];
        }
        
        return addresses;
    } catch (error) {
        console.error('Error loading addresses:', error);
        return [];
    }
}

function loadAddressList() {
    const addressList = document.getElementById('address-list');
    if (!addressList) return;
    
    loadAddresses().then(addresses => {
        let html = '';
        
        addresses.forEach(address => {
            const isSelected = checkoutData.selectedAddress?.id === address.id;
            
            html += `
                <label class="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-300'}">
                    <input type="radio" name="delivery-address" value="${address.id}" 
                           ${isSelected ? 'checked' : ''} 
                           onchange="selectAddress('${address.id}')"
                           class="mt-1 mr-3 h-4 w-4 text-green-600 focus:ring-green-500">
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="font-medium text-gray-800">${address.name}</span>
                                ${address.isDefault ? 
                                    '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Default</span>' : 
                                    ''
                                }
                            </div>
                            <div class="flex gap-2">
                                <button type="button" onclick="editAddress('${address.id}')" class="text-blue-600 hover:text-blue-700 text-sm">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${!address.isDefault ? 
                                    `<button type="button" onclick="deleteAddress('${address.id}')" class="text-red-600 hover:text-red-700 text-sm">
                                        <i class="fas fa-trash"></i>
                                    </button>` : 
                                    ''
                                }
                            </div>
                        </div>
                        <p class="text-gray-600">${address.address}</p>
                        <p class="text-sm text-gray-500 mt-1">Phone: ${address.phone}</p>
                    </div>
                </label>
            `;
        });
        
        addressList.innerHTML = html;
    });
}

function selectAddress(addressId) {
    loadAddresses().then(addresses => {
        const address = addresses.find(addr => addr.id === addressId);
        if (address) {
            checkoutData.selectedAddress = address;
        }
    });
}

function showAddressModal(address = null) {
    const isEdit = !!address;
    
    const modalContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Address Name</label>
                <input type="text" id="address-name" value="${address?.name || ''}" 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                       placeholder="e.g., Home, Office">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
                <textarea id="address-details" rows="3"
                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Street, City, State, ZIP Code">${address?.address || ''}</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" id="address-phone" value="${address?.phone || ''}" 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                       placeholder="9876543210">
            </div>
            <div class="flex items-center">
                <input type="checkbox" id="address-default" ${address?.isDefault ? 'checked' : ''}
                       class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                <label for="address-default" class="ml-2 text-sm text-gray-700">Set as default address</label>
            </div>
        </div>
    `;
    
    showModal({
        title: isEdit ? 'Edit Address' : 'Add New Address',
        body: modalContent,
        buttons: [
            {
                text: 'Cancel',
                class: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            },
            {
                text: isEdit ? 'Update' : 'Save',
                class: 'bg-green-600 text-white hover:bg-green-700',
                onClick: () => saveAddress(address?.id)
            }
        ]
    });
}

function saveAddress(addressId = null) {
    const name = document.getElementById('address-name').value;
    const details = document.getElementById('address-details').value;
    const phone = document.getElementById('address-phone').value;
    const isDefault = document.getElementById('address-default').checked;
    
    if (!name || !details || !phone) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showToast('Please enter a valid phone number', 'error');
        return;
    }
    
    loadAddresses().then(addresses => {
        if (isDefault) {
            // Remove default from other addresses
            addresses.forEach(addr => addr.isDefault = false);
        }
        
        if (addressId) {
            // Update existing address
            const index = addresses.findIndex(addr => addr.id === addressId);
            if (index !== -1) {
                addresses[index] = {
                    ...addresses[index],
                    name,
                    address: details,
                    phone,
                    isDefault
                };
            }
        } else {
            // Add new address
            const newAddress = {
                id: generateId(),
                name,
                address: details,
                phone,
                isDefault: addresses.length === 0 ? true : isDefault
            };
            addresses.push(newAddress);
        }
        
        // Save to localStorage
        localStorage.setItem('user_addresses', JSON.stringify(addresses));
        
        // Reload address list
        loadAddressList();
        
        showToast(addressId ? 'Address updated' : 'Address added', 'success');
        closeModal();
    });
}

function editAddress(addressId) {
    loadAddresses().then(addresses => {
        const address = addresses.find(addr => addr.id === addressId);
        if (address) {
            showAddressModal(address);
        }
    });
}

function deleteAddress(addressId) {
    if (!confirm('Are you sure you want to delete this address?')) {
        return;
    }
    
    loadAddresses().then(addresses => {
        const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
        
        // If we deleted the default address, set first as default
        if (updatedAddresses.length > 0 && !updatedAddresses.some(addr => addr.isDefault)) {
            updatedAddresses[0].isDefault = true;
        }
        
        localStorage.setItem('user_addresses', JSON.stringify(updatedAddresses));
        
        // Update selected address if it was deleted
        if (checkoutData.selectedAddress?.id === addressId) {
            checkoutData.selectedAddress = updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0];
        }
        
        loadAddressList();
        showToast('Address deleted', 'success');
    });
}

// Review Step
function loadReviewContent() {
    loadReviewSummary();
    loadReviewDelivery();
    loadReviewPayment();
}

function loadReviewSummary() {
    const container = document.getElementById('review-summary');
    if (!container) return;
    
    let html = '<div class="space-y-4">';
    
    checkoutData.cartItems.forEach(item => {
        const product = item.product || {};
        const quantity = item.quantity || 1;
        const itemTotal = (product.price || 0) * quantity;
        
        html += `
            <div class="flex items-center justify-between py-2 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                        <p class="font-medium text-gray-800">${product.name || 'Product'}</p>
                        <p class="text-sm text-gray-600">${quantity} × ₹${product.price || 0} / ${product.unit || 'unit'}</p>
                    </div>
                </div>
                <p class="font-semibold text-gray-800">₹${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });
    
    html += `
        <div class="pt-4 border-t">
            <div class="flex justify-between py-1">
                <span class="text-gray-600">Subtotal</span>
                <span class="font-medium">₹${checkoutData.orderSummary.subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between py-1">
                <span class="text-gray-600">Delivery Fee</span>
                <span class="font-medium">₹${checkoutData.orderSummary.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="flex justify-between py-1">
                <span class="text-gray-600">Tax (5%)</span>
                <span class="font-medium">₹${checkoutData.orderSummary.tax.toFixed(2)}</span>
            </div>
            <div class="flex justify-between py-3 border-t">
                <span class="font-bold text-lg text-gray-800">Total</span>
                <span class="font-bold text-lg text-gray-800">₹${checkoutData.orderSummary.total.toFixed(2)}</span>
            </div>
        </div>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

function loadReviewDelivery() {
    const container = document.getElementById('review-delivery');
    if (!container) return;
    
    const address = checkoutData.selectedAddress;
    const deliveryDate = checkoutData.deliveryDate || document.getElementById('delivery-date')?.value;
    const deliveryTime = checkoutData.deliveryTime || '9-12';
    
    const timeSlots = {
        '9-12': '9:00 AM - 12:00 PM',
        '12-3': '12:00 PM - 3:00 PM',
        '3-6': '3:00 PM - 6:00 PM',
        '6-9': '6:00 PM - 9:00 PM'
    };
    
    const html = `
        <div class="space-y-3">
            <div>
                <p class="text-sm text-gray-600">Delivery Address</p>
                <p class="font-medium text-gray-800">${address?.name || 'N/A'}</p>
                <p class="text-gray-600">${address?.address || 'No address selected'}</p>
                <p class="text-sm text-gray-500">Phone: ${address?.phone || 'N/A'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Delivery Schedule</p>
                <p class="font-medium text-gray-800">
                    ${deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    }) : 'Not selected'}
                </p>
                <p class="text-gray-600">${timeSlots[deliveryTime] || 'Not selected'}</p>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function loadReviewPayment() {
    const container = document.getElementById('review-payment');
    if (!container) return;
    
    const paymentMethods = {
        'cash_on_delivery': 'Cash on Delivery',
        'upi': 'UPI Payment',
        'bank_transfer': 'Bank Transfer',
        'card': 'Credit/Debit Card',
        'wallet': 'Digital Wallet'
    };
    
    const html = `
        <div class="space-y-3">
            <div>
                <p class="text-sm text-gray-600">Payment Method</p>
                <p class="font-medium text-gray-800">${paymentMethods[checkoutData.paymentMethod] || 'Not selected'}</p>
            </div>
            ${checkoutData.orderNotes ? `
                <div>
                    <p class="text-sm text-gray-600">Order Notes</p>
                    <p class="text-gray-600">${checkoutData.orderNotes}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    container.innerHTML = html;
}

// Place Order
// Place Order
async function placeOrder() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'buyer') {
        showToast('Please login as a buyer to place orders', 'error');
        window.location.href = 'auth.html';
        return;
    }
    
    // Final validation
    if (!validateCurrentStep()) {
        return;
    }
    
    // Prepare order data
    const orderData = {
        items: checkoutData.cartItems.map(item => ({
            product: item.productId,
            quantity: item.quantity
        })),
        deliveryAddress: checkoutData.selectedAddress?.address || '',
        deliveryDate: checkoutData.deliveryDate,
        paymentMethod: checkoutData.paymentMethod,
        notes: checkoutData.orderNotes
    };
    
    console.log('Order data being sent:', orderData); // Debug log
    
    showLoading('Placing your order...');
    
    try {
        const response = await api.createOrder(orderData);
        
        console.log('Order response:', response); // Debug log
        
        if (response && response.success) {
            // Clear cart
            localStorage.removeItem('cart');
            
            // Show success message
            showToast('Order placed successfully!', 'success');
            
            // Redirect to order confirmation or orders page
            setTimeout(() => {
                if (response.order && response.order._id) {
                    window.location.href = `orders-manager.html?order=${response.order._id}`;
                } else {
                    window.location.href = 'orders-manager.html';
                }
            }, 1500);
        } else {
            showToast(response?.message || 'Failed to place order', 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        
        // More specific error messages
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
            showToast('Network error. Please check your connection.', 'error');
        } else if (error.message.includes('401')) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => {
                localStorage.removeItem('user');
                window.location.href = 'auth.html';
            }, 2000);
        } else if (error.message.includes('500')) {
            showToast('Server error. Please try again later.', 'error');
        } else {
            showToast(error.message || 'Failed to place order. Please try again.', 'error');
        }
    } finally {
        hideLoading();
    }
}

// Initialize on window load
window.addEventListener('DOMContentLoaded', function() {
    // Check if we're on cart-checkout page
    if (window.location.pathname.includes('cart-checkout.html')) {
        initCartCheckout();
    }
});

// Export functions to global scope
window.initCartCheckout = initCartCheckout;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.placeOrder = placeOrder;
window.showAddressModal = showAddressModal;
window.selectAddress = selectAddress;
window.editAddress = editAddress;
window.deleteAddress = deleteAddress;
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;