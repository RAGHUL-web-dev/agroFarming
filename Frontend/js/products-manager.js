// Products Manager functionality

let currentTab = 'active';
let currentProducts = [];
let categories = [];

function initProductManager() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'farmer') return;

    // Load categories first
    loadCategories();
    
    // Setup tab switching
    setupProductTabs();
}

function setupProductTabs() {
    const tabs = document.querySelectorAll('.product-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => {
                t.classList.remove('active', 'border-green-600', 'text-green-600');
                t.classList.add('border-transparent', 'text-gray-600');
            });
            
            // Add active class to clicked tab
            this.classList.add('active', 'border-green-600', 'text-green-600');
            this.classList.remove('border-transparent', 'text-gray-600');
            
            // Get tab type from onclick attribute
            const onclick = this.getAttribute('onclick');
            const match = onclick.match(/switchProductTab\('(.+)'\)/);
            if (match) {
                currentTab = match[1];
                loadProducts();
            }
        });
    });
}

async function loadCategories() {
    try {
        const response = await api.getCategories();
        categories = response.categories || [];
        // Load products after categories
        loadProducts();
    } catch (error) {
        console.error('Error loading categories:', error);
        // Load products anyway (categories will be empty)
        loadProducts();
    }
}

async function loadProducts() {
    const content = document.getElementById('product-manager-content');
    if (!content) return;

    // Show loading
    content.innerHTML = `
        <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p class="mt-4 text-gray-600">Loading products...</p>
        </div>
    `;

    try {
        const response = await api.getFarmerProducts();
        currentProducts = response.products || [];
        
        // Filter products based on current tab
        let filteredProducts = filterProductsByTab(currentProducts);
        
        if (filteredProducts.length === 0) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-seedling text-gray-400 text-3xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
                    <p class="text-gray-600 mb-6">
                        ${currentTab === 'active' ? 'You have no active products. Add your first product!' :
                          currentTab === 'inactive' ? 'You have no inactive products.' :
                          currentTab === 'low-stock' ? 'All your products have sufficient stock.' :
                          'No products found.'}
                    </p>
                    ${currentTab === 'active' ? `
                        <button onclick="loadProductManagerView('add')" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i> Add Product
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        // Display products
        content.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <p class="text-gray-600">Showing ${filteredProducts.length} of ${currentProducts.length} products</p>
                    <div class="flex gap-2">
                        <button onclick="exportProducts()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-download mr-2"></i> Export
                        </button>
                        <button onclick="loadProductManagerView('add')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i> Add Product
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${filteredProducts.map(product => createProductCard(product)).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners to product cards
        addProductCardListeners();
        
    } catch (error) {
        console.error('Error loading products:', error);
        content.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Products</h3>
                <p class="text-gray-600 mb-4">${error.message || 'Please check your connection and try again'}</p>
                <button onclick="loadProducts()" class="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Retry
                </button>
            </div>
        `;
    }
}

function filterProductsByTab(products) {
    switch (currentTab) {
        case 'active':
            return products.filter(p => p.isActive === true);
        case 'inactive':
            return products.filter(p => p.isActive === false);
        case 'low-stock':
            return products.filter(p => {
                const stockPercent = p.quantity > 0 ? (p.availableQuantity / p.quantity) * 100 : 0;
                return stockPercent < 20 && p.isActive === true;
            });
        default:
            return products;
    }
}

function createProductCard(product) {
    const stockPercent = product.quantity > 0 ? (product.availableQuantity / product.quantity) * 100 : 0;
    const stockColor = stockPercent > 50 ? 'text-green-600' : stockPercent > 20 ? 'text-yellow-600' : 'text-red-600';
    const stockText = stockPercent > 50 ? 'In Stock' : stockPercent > 20 ? 'Low Stock' : 'Very Low';
    
    return `
        <div class="bg-white rounded-xl shadow border border-gray-200 hover:shadow-lg transition duration-300" data-product-id="${product._id}">
            <!-- Product Image -->
            <div class="h-48 bg-gray-100 rounded-t-xl relative overflow-hidden">
                ${product.images && product.images.length > 0 ? `
                    <img src="${product.images[0].url}" alt="${product.name}" class="w-full h-full object-cover">
                ` : `
                    <div class="w-full h-full flex items-center justify-center">
                        <i class="fas fa-seedling text-gray-400 text-4xl"></i>
                    </div>
                `}
                
                <!-- Status Badge -->
                <span class="absolute top-3 right-3 px-2 py-1 text-xs rounded ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.isActive ? 'Active' : 'Inactive'}
                </span>
                
                <!-- Category Badge -->
                <span class="absolute top-3 left-3 px-2 py-1 bg-gray-800/70 text-white text-xs rounded">
                    ${product.category || 'Product'}
                </span>
            </div>

            <!-- Product Info -->
            <div class="p-4">
                <!-- Name and Price -->
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-gray-800">${product.name || 'Unnamed Product'}</h3>
                    <div class="text-right">
                        <p class="text-lg font-bold text-gray-800">₹${product.price || 0}</p>
                        <p class="text-sm text-gray-600">/${product.unit || 'unit'}</p>
                    </div>
                </div>
                
                <!-- Description -->
                <p class="text-sm text-gray-600 mb-4 line-clamp-2">${product.description || 'No description'}</p>
                
                <!-- Stock Info -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">Stock</span>
                        <span class="${stockColor} font-medium">${stockText}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${Math.min(100, stockPercent)}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Available: ${product.availableQuantity || 0}</span>
                        <span>Total: ${product.quantity || 0}</span>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="grid grid-cols-2 gap-2">
                    <button class="edit-product-btn px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        <i class="fas fa-edit mr-1"></i> Edit
                    </button>
                    <button class="toggle-status-btn px-3 py-2 ${product.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'} rounded-lg text-sm">
                        <i class="fas ${product.isActive ? 'fa-pause' : 'fa-play'} mr-1"></i> ${product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addProductCardListeners() {
    // Edit product buttons
    document.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('[data-product-id]').dataset.productId;
            editProduct(productId);
        });
    });
    
    // Toggle status buttons
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.closest('[data-product-id]').dataset.productId;
            const product = currentProducts.find(p => p._id === productId);
            if (product) {
                toggleProductStatus(productId, !product.isActive);
            }
        });
    });
}

function switchProductTab(tab) {
    currentTab = tab;
    loadProducts();
}

function loadProductManagerView(view) {
    const content = document.getElementById('product-manager-content');
    if (!content) return;

    switch (view) {
        case 'list':
            loadProducts();
            break;
        case 'add':
            loadAddProductForm();
            break;
        default:
            loadProducts();
    }
}

function loadAddProductForm() {
    const content = document.getElementById('product-manager-content');
    if (!content) return;

    // Get subcategories for each category
    const categoryOptions = categories.map(cat => {
        const subcategories = cat.subcategories?.map(sub => sub.name).join(',') || '';
        return `<option value="${cat.name}" data-subcategories="${subcategories}">${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</option>`;
    }).join('');

    content.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Add New Product</h3>
                    <button onclick="loadProductManagerView('list')" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Products
                    </button>
                </div>
                
                <form id="add-product-form" class="space-y-6">
                    <!-- Basic Information -->
                    <div>
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Basic Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                <input type="text" name="name" required 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Organic Tomatoes">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select name="category" required 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        onchange="updateSubcategories(this)">
                                    <option value="">Select Category</option>
                                    ${categoryOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Subcategory *</label>
                                <select name="subcategory" required 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        id="subcategory-select">
                                    <option value="">Select Subcategory</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Quality Grade</label>
                                <select name="qualityGrade" 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    <option value="standard">Standard</option>
                                    <option value="grade-b">Grade B</option>
                                    <option value="grade-a">Grade A</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Pricing & Quantity -->
                    <div>
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Pricing & Quantity</h4>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                                <input type="number" name="price" required min="0" step="0.01"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., 40">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                                <select name="unit" required 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    <option value="">Select Unit</option>
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="gram">Gram (g)</option>
                                    <option value="liter">Liter (L)</option>
                                    <option value="piece">Piece</option>
                                    <option value="dozen">Dozen</option>
                                    <option value="ton">Ton</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Total Quantity *</label>
                                <input type="number" name="quantity" required min="0"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., 100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Available Quantity *</label>
                                <input type="number" name="availableQuantity" required min="0"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., 100">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Order Quantity</label>
                                <input type="number" name="minOrderQuantity" min="1"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., 1" value="1">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Maximum Order Quantity</label>
                                <input type="number" name="maxOrderQuantity" min="0"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="Leave empty for no limit">
                            </div>
                        </div>
                    </div>

                    <!-- Description & Details -->
                    <div>
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Description & Details</h4>
                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                                <textarea name="description" required rows="3"
                                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                          placeholder="Describe your product..."></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Product Tags</label>
                                <input type="text" name="tags"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., organic, fresh, pesticide-free (comma separated)">
                                <p class="text-xs text-gray-500 mt-1">Add tags to help buyers find your product</p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-6">
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" name="isNegotiable" class="h-4 w-4 text-green-600 mr-2">
                                        <span class="text-sm text-gray-700">Price is negotiable</span>
                                    </label>
                                </div>
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" name="isActive" class="h-4 w-4 text-green-600 mr-2" checked>
                                        <span class="text-sm text-gray-700">Make product active immediately</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Origin Information -->
                    <div>
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Origin Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
                                <input type="text" name="origin.farmName"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="Your farm name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                                <input type="text" name="origin.location.city"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Pune">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">State</label>
                                <input type="text" name="origin.location.state"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Maharashtra">
                            </div>
                        </div>
                    </div>

                    <!-- Crop/Livestock Details -->
                    <div id="crop-details-section" class="hidden">
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Crop Details</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Variety</label>
                                <input type="text" name="cropDetails.variety"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Hybrid, Local">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Season</label>
                                <input type="text" name="cropDetails.season"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Winter, All">
                            </div>
                            <div class="flex items-center gap-4">
                                <label class="flex items-center">
                                    <input type="checkbox" name="cropDetails.organic" class="h-4 w-4 text-green-600 mr-2">
                                    <span class="text-sm text-gray-700">Organic</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="cropDetails.pesticideFree" class="h-4 w-4 text-green-600 mr-2">
                                    <span class="text-sm text-gray-700">Pesticide Free</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div id="animal-details-section" class="hidden">
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Animal Details</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Breed</label>
                                <input type="text" name="animalDetails.breed"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Jersey, Saanen">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Age (in months)</label>
                                <input type="number" name="animalDetails.age"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., 24">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Feed Type</label>
                                <input type="text" name="animalDetails.feedType"
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       placeholder="e.g., Grass fed, Organic feed">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Health Status</label>
                                <select name="animalDetails.healthStatus"
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good</option>
                                    <option value="Fair">Fair</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions -->
                    <div class="flex justify-between pt-6 border-t">
                        <button type="button" onclick="loadProductManagerView('list')" 
                                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" 
                                class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i> Add Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Initialize form
    initProductForm();
}

function updateSubcategories(selectElement) {
    const category = selectElement.value;
    const subcategorySelect = document.getElementById('subcategory-select');
    const cropDetailsSection = document.getElementById('crop-details-section');
    const animalDetailsSection = document.getElementById('animal-details-section');
    
    // Reset subcategories
    subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
    
    // Show/hide detail sections
    if (category === 'crop') {
        cropDetailsSection.classList.remove('hidden');
        animalDetailsSection.classList.add('hidden');
    } else if (['goat', 'cow', 'hen', 'duck', 'pig', 'rabbit'].includes(category)) {
        cropDetailsSection.classList.add('hidden');
        animalDetailsSection.classList.remove('hidden');
    } else {
        cropDetailsSection.classList.add('hidden');
        animalDetailsSection.classList.add('hidden');
    }
    
    // Find selected category and populate subcategories
    const selectedCategory = categories.find(c => c.name === category);
    if (selectedCategory && selectedCategory.subcategories) {
        selectedCategory.subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.name;
            option.textContent = sub.name.charAt(0).toUpperCase() + sub.name.slice(1);
            subcategorySelect.appendChild(option);
        });
    }
}

function initProductForm() {
    const form = document.getElementById('add-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const productData = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            // Handle nested objects (e.g., origin.location.city)
            if (key.includes('.')) {
                const keys = key.split('.');
                let current = productData;
                
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                
                current[keys[keys.length - 1]] = value;
            } else {
                // Handle checkboxes
                if (form.elements[key]?.type === 'checkbox') {
                    productData[key] = formData.has(key);
                } else {
                    // Convert numeric fields
                    const numericFields = ['price', 'quantity', 'availableQuantity', 'minOrderQuantity', 'maxOrderQuantity', 'animalDetails.age'];
                    if (numericFields.includes(key) || key.includes('.')) {
                        productData[key] = value ? Number(value) : null;
                    } else {
                        productData[key] = value;
                    }
                }
            }
        }
        
        // Handle tags
        if (productData.tags) {
            productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // Set default values
        if (!productData.minOrderQuantity) productData.minOrderQuantity = 1;
        if (productData.maxOrderQuantity === '') productData.maxOrderQuantity = null;
        
        try {
            showLoading('Adding product...');
            
            const response = await api.createProduct(productData);
            
            if (response && response.success) {
                showToast('Product added successfully!', 'success');
                
                // Return to product list after delay
                setTimeout(() => {
                    loadProductManagerView('list');
                }, 1500);
            } else {
                showToast(response?.message || 'Failed to add product', 'error');
            }
        } catch (error) {
            console.error('Error adding product:', error);
            showToast(error.message || 'Failed to add product. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Auto-update available quantity to match total quantity
    const quantityInput = form.querySelector('input[name="quantity"]');
    const availableQuantityInput = form.querySelector('input[name="availableQuantity"]');
    
    if (quantityInput && availableQuantityInput) {
        quantityInput.addEventListener('change', function() {
            if (!availableQuantityInput.value || availableQuantityInput.value === '0') {
                availableQuantityInput.value = this.value;
            }
        });
    }
}

async function editProduct(productId) {
    try {
        showLoading('Loading product details...');
        
        const product = await api.getProduct(productId);
        
        if (product && product.success) {
            // Load edit form with product data
            loadEditProductForm(product.product);
        } else {
            showToast('Failed to load product details', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Failed to load product. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function loadEditProductForm(product) {
    const content = document.getElementById('product-manager-content');
    if (!content) return;

    // Similar to add form but pre-filled with product data
    content.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-800">Edit Product: ${product.name}</h3>
                    <button onclick="loadProductManagerView('list')" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-arrow-left mr-2"></i> Back to Products
                    </button>
                </div>
                
                <form id="edit-product-form" class="space-y-6" data-product-id="${product._id}">
                    <!-- Form fields pre-filled with product data -->
                    <div>
                        <h4 class="font-medium text-gray-700 mb-4 border-b pb-2">Basic Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                                <input type="text" name="name" required 
                                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                       value="${product.name || ''}">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select name="category" required 
                                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        onchange="updateSubcategories(this)">
                                    <option value="">Select Category</option>
                                    ${categories.map(cat => `
                                        <option value="${cat.name}" ${cat.name === product.category ? 'selected' : ''}>
                                            ${cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <!-- More fields pre-filled... -->
                        </div>
                    </div>
                    
                    <!-- Form Actions -->
                    <div class="flex justify-between pt-6 border-t">
                        <button type="button" onclick="loadProductManagerView('list')" 
                                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <div class="flex gap-3">
                            <button type="button" onclick="deleteProduct('${product._id}')" 
                                    class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                <i class="fas fa-trash mr-2"></i> Delete
                            </button>
                            <button type="submit" 
                                    class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-save mr-2"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Initialize edit form
    initEditProductForm();
}

function initEditProductForm() {
    const form = document.getElementById('edit-product-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productId = form.dataset.productId;
        const formData = new FormData(form);
        const productData = {};
        
        // Convert FormData to object (similar to add form)
        for (let [key, value] of formData.entries()) {
            productData[key] = value;
        }
        
        try {
            showLoading('Updating product...');
            
            const response = await api.updateProduct(productId, productData);
            
            if (response && response.success) {
                showToast('Product updated successfully!', 'success');
                
                // Return to product list after delay
                setTimeout(() => {
                    loadProductManagerView('list');
                }, 1500);
            } else {
                showToast(response?.message || 'Failed to update product', 'error');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            showToast(error.message || 'Failed to update product. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });
}

async function toggleProductStatus(productId, newStatus) {
    try {
        const confirmMessage = newStatus 
            ? 'Are you sure you want to activate this product? It will become visible to buyers.'
            : 'Are you sure you want to deactivate this product? It will be hidden from buyers.';
        
        if (!confirm(confirmMessage)) return;
        
        showLoading('Updating product status...');
        
        const response = await api.updateProduct(productId, { isActive: newStatus });
        
        if (response && response.success) {
            showToast(`Product ${newStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
            
            // Reload products
            loadProducts();
        } else {
            showToast(response?.message || 'Failed to update product status', 'error');
        }
    } catch (error) {
        console.error('Error updating product status:', error);
        showToast('Failed to update product status. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoading('Deleting product...');
        
        const response = await api.deleteProduct(productId);
        
        if (response && response.success) {
            showToast('Product deleted successfully!', 'success');
            
            // Return to product list after delay
            setTimeout(() => {
                loadProductManagerView('list');
            }, 1500);
        } else {
            showToast(response?.message || 'Failed to delete product', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function exportProducts() {
    // Simple export to CSV
    const filteredProducts = filterProductsByTab(currentProducts);
    
    if (filteredProducts.length === 0) {
        showToast('No products to export', 'warning');
        return;
    }
    
    // Create CSV content
    const headers = ['Name', 'Category', 'Price', 'Unit', 'Quantity', 'Available', 'Status'];
    const rows = filteredProducts.map(product => [
        `"${product.name}"`,
        product.category,
        product.price,
        product.unit,
        product.quantity,
        product.availableQuantity,
        product.isActive ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${currentTab}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Products exported successfully!', 'success');
}

// Export to global scope
window.initProductManager = initProductManager;
window.switchProductTab = switchProductTab;
window.loadProductManagerView = loadProductManagerView;
window.updateSubcategories = updateSubcategories;
window.editProduct = editProduct;
window.toggleProductStatus = toggleProductStatus;
window.deleteProduct = deleteProduct;
window.exportProducts = exportProducts;