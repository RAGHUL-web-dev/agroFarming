// Marketplace functionality

let currentPage = 1;
const limit = 12;
let currentCategory = 'all';
let currentFilters = {};
let isLoading = false;
let hasMore = true;

async function initMarketplace() {
    // Check if user is buyer
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'buyer') {
        window.location.href = 'dashboard.html';
        return;
    }

    // Load product card component if not already loaded
    if (!document.querySelector('.product-card-template')) {
        await loadComponent('product-card', 'product-card-container');
    }

    // Load initial products
    await loadProducts();

    // Setup event listeners
    setupEventListeners();
    
    // Update product count
    updateProductCount();
}

function setupEventListeners() {
    // Category filter buttons
    document.querySelectorAll('.category-filter').forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            document.querySelectorAll('.category-filter').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('bg-green-600', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            
            this.classList.add('active');
            this.classList.add('bg-green-600', 'text-white');
            this.classList.remove('bg-gray-200', 'text-gray-700');
            
            // Get category from onclick attribute
            const category = this.getAttribute('onclick').match(/'([^']+)'/)[1];
            filterCategory(category);
        });
    });

    // Search input
    const searchInput = document.querySelector('input[type="text"]');
    if (searchInput) {
        const debouncedSearch = debounce(() => {
            currentFilters.search = searchInput.value;
            resetAndLoadProducts();
        }, 500);
        
        searchInput.addEventListener('input', debouncedSearch);
    }

    // Filter inputs
    const priceMin = document.querySelector('input[placeholder="Min"]');
    const priceMax = document.querySelector('input[placeholder="Max"]');
    const locationInput = document.querySelector('input[placeholder="City, State"]');
    const qualitySelect = document.querySelector('select');
    const sortSelect = document.querySelectorAll('select')[1];

    if (priceMin) {
        priceMin.addEventListener('change', updateFilters);
    }
    if (priceMax) {
        priceMax.addEventListener('change', updateFilters);
    }
    if (locationInput) {
        locationInput.addEventListener('input', debounce(updateFilters, 500));
    }
    if (qualitySelect) {
        qualitySelect.addEventListener('change', updateFilters);
    }
    if (sortSelect) {
        sortSelect.addEventListener('change', updateFilters);
    }

    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreProducts);
    }

    // Apply filters button
    const applyFiltersBtn = document.querySelector('button[onclick="applyFilters()"]');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }

    // Reset filters button
    const resetFiltersBtn = document.querySelector('button[onclick="resetFilters()"]');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
}

function updateFilters() {
    const priceMin = document.querySelector('input[placeholder="Min"]');
    const priceMax = document.querySelector('input[placeholder="Max"]');
    const locationInput = document.querySelector('input[placeholder="City, State"]');
    const qualitySelect = document.querySelector('select');
    const sortSelect = document.querySelectorAll('select')[1];

    currentFilters = {
        minPrice: priceMin?.value || '',
        maxPrice: priceMax?.value || '',
        location: locationInput?.value || '',
        qualityGrade: qualitySelect?.value || '',
        sortBy: sortSelect?.value || 'newest'
    };
}

function applyFilters() {
    updateFilters();
    resetAndLoadProducts();
}

function resetFilters() {
    // Reset filter inputs
    document.querySelector('input[placeholder="Min"]').value = '';
    document.querySelector('input[placeholder="Max"]').value = '';
    document.querySelector('input[placeholder="City, State"]').value = '';
    document.querySelector('select').value = '';
    document.querySelectorAll('select')[1].value = 'newest';

    // Reset category filter
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('active', 'bg-green-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    document.querySelector('.category-filter[onclick*="all"]').classList.add('active', 'bg-green-600', 'text-white');

    currentFilters = {};
    currentCategory = 'all';
    resetAndLoadProducts();
}

function filterCategory(category) {
    currentCategory = category;
    if (category !== 'all') {
        currentFilters.category = category;
    } else {
        delete currentFilters.category;
    }
    resetAndLoadProducts();
}

async function resetAndLoadProducts() {
    currentPage = 1;
    hasMore = true;
    document.getElementById('products-container').innerHTML = `
        <div class="text-center py-12 col-span-full">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
            <p class="mt-4 text-gray-600">Loading products...</p>
        </div>
    `;
    await loadProducts();
}

async function loadProducts() {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        // Prepare query params
        const params = {
            page: currentPage,
            limit: limit,
            ...currentFilters
        };

        // Remove empty filters
        Object.keys(params).forEach(key => {
            if (!params[key] || params[key] === '') {
                delete params[key];
            }
        });

        const response = await api.getProducts(params);
        
        if (response && response.success) {
            const products = response.products || [];
            const container = document.getElementById('products-container');
            
            if (currentPage === 1) {
                container.innerHTML = '';
            }
            
            if (products.length === 0 && currentPage === 1) {
                container.innerHTML = `
                    <div class="text-center py-12 col-span-full">
                        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-search text-gray-400 text-3xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">No Products Found</h3>
                        <p class="text-gray-600">Try adjusting your filters or search terms</p>
                    </div>
                `;
                document.getElementById('load-more-container').classList.add('hidden');
            } else {
                // Render products
                products.forEach(product => {
                    const productCard = createProductCard(product);
                    container.appendChild(productCard);
                });
                
                // Update load more button
                hasMore = products.length === limit;
                const loadMoreContainer = document.getElementById('load-more-container');
                if (loadMoreContainer) {
                    if (hasMore) {
                        loadMoreContainer.classList.remove('hidden');
                    } else {
                        loadMoreContainer.classList.add('hidden');
                    }
                }
            }
            
            // Update product count
            document.getElementById('product-count').textContent = 
                `Showing ${(currentPage - 1) * limit + 1}-${(currentPage - 1) * limit + products.length} of ${response.total || 0} products`;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-container').innerHTML = `
            <div class="text-center py-12 col-span-full">
                <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-exclamation-triangle text-red-600 text-3xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Products</h3>
                <p class="text-gray-600">${error.message || 'Please try again later'}</p>
            </div>
        `;
    } finally {
        isLoading = false;
    }
}

async function loadMoreProducts() {
    currentPage++;
    await loadProducts();
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300';
    card.dataset.productId = product._id;
    
    // Determine image
    let imageUrl = 'https://images.unsplash.com/photo-1567306301408-9b74779a11af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    if (product.images && product.images.length > 0) {
        imageUrl = product.images[0].url || imageUrl;
    }
    
    // Determine category icon
    const categoryIcons = {
        'crop': 'fas fa-leaf',
        'goat': 'fas fa-horse',
        'cow': 'fas fa-cow',
        'hen': 'fas fa-kiwi-bird',
        'duck': 'fas fa-feather-alt',
        'pig': 'fas fa-piggy-bank',
        'rabbit': 'fas fa-paw'
    };
    
    const categoryIcon = categoryIcons[product.category] || 'fas fa-seedling';
    
    card.innerHTML = `
        <!-- Product Image -->
        <div class="relative h-48 bg-gray-100">
            <img src="${imageUrl}" 
                 alt="${product.name}" 
                 class="w-full h-full object-cover product-image"
                 onerror="this.src='https://images.unsplash.com/photo-1567306301408-9b74779a11af?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
            
            <!-- Favorite Button -->
            <button class="favorite-btn absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition duration-300">
                <i class="far fa-heart text-gray-600"></i>
            </button>
            
            <!-- Quality Badge -->
            <span class="absolute top-3 left-3 px-2 py-1 ${getQualityBadgeClass(product.qualityGrade)} text-white text-xs rounded">
                ${product.qualityGrade ? product.qualityGrade.charAt(0).toUpperCase() + product.qualityGrade.slice(1) : 'Standard'}
            </span>
            
            <!-- Category Icon -->
            <div class="absolute bottom-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                <i class="${categoryIcon} text-green-600"></i>
            </div>
        </div>

        <!-- Product Info -->
        <div class="p-4">
            <!-- Category -->
            <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium text-gray-500 uppercase">${product.category || 'Product'}</span>
                <span class="text-xs px-2 py-1 ${product.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} rounded">
                    ${product.availableQuantity > 0 ? `${product.availableQuantity} ${product.unit} left` : 'Out of Stock'}
                </span>
            </div>

            <!-- Name -->
            <h3 class="font-semibold text-gray-800 mb-2 truncate" title="${product.name}">${product.name}</h3>
            
            <!-- Description -->
            <p class="text-sm text-gray-600 mb-3 line-clamp-2">${product.description || 'No description available'}</p>

            <!-- Farmer -->
            <div class="flex items-center gap-2 mb-3">
                <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-green-600 text-xs"></i>
                </div>
                <span class="text-sm text-gray-600 truncate">${product.farmer?.name || 'Farmer'}</span>
            </div>

            <!-- Price and Unit -->
            <div class="flex items-center justify-between mb-4">
                <div>
                    <span class="text-xl font-bold text-gray-800">₹${product.price || 0}</span>
                    <span class="text-gray-600"> / ${product.unit || 'unit'}</span>
                </div>
                <div class="text-sm text-gray-500" title="${product.origin?.location?.city || 'Unknown location'}">
                    <i class="fas fa-map-marker-alt mr-1"></i> ${product.origin?.location?.city?.substring(0, 10) || 'N/A'}${product.origin?.location?.city?.length > 10 ? '...' : ''}
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2">
                <button class="view-detail-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition duration-300">
                    <i class="fas fa-eye mr-1"></i> View
                </button>
                <button class="add-to-cart-btn px-4 py-2 ${product.availableQuantity > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg text-sm font-medium transition duration-300" ${product.availableQuantity === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus mr-1"></i> ${product.availableQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    const viewBtn = card.querySelector('.view-detail-btn');
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    const favoriteBtn = card.querySelector('.favorite-btn');
    
    viewBtn.addEventListener('click', () => viewProductDetail(product._id));
    
    if (product.availableQuantity > 0) {
        addToCartBtn.addEventListener('click', () => addProductToCart(product._id));
    }
    
    favoriteBtn.addEventListener('click', (e) => toggleFavorite(e, product._id));
    
    return card;
}

function getQualityBadgeClass(quality) {
    const classes = {
        'premium': 'bg-purple-600',
        'grade-a': 'bg-green-600',
        'grade-b': 'bg-yellow-600',
        'standard': 'bg-blue-600'
    };
    return classes[quality] || 'bg-gray-600';
}

async function viewProductDetail(productId) {
    try {
        const response = await api.getProduct(productId);
        if (response && response.success) {
            showProductModal(response.product);
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        alert('Failed to load product details');
    }
}

function showProductModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">${product.name}</h2>
                    <button class="modal-close-btn text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Product Images -->
                    <div>
                        <div class="bg-gray-100 rounded-lg h-64 mb-4 flex items-center justify-center">
                            ${product.images && product.images.length > 0 ? 
                                `<img src="${product.images[0].url}" alt="${product.name}" class="max-h-full max-w-full object-contain">` :
                                `<i class="fas fa-seedling text-gray-400 text-6xl"></i>`
                            }
                        </div>
                        <div class="flex gap-2">
                            ${(product.images || []).slice(0, 4).map((img, index) => `
                                <div class="w-16 h-16 bg-gray-200 rounded-lg cursor-pointer border-2 ${index === 0 ? 'border-green-500' : 'border-transparent'}">
                                    <img src="${img.url}" alt="Thumbnail ${index + 1}" class="w-full h-full object-cover rounded">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Product Details -->
                    <div>
                        <div class="mb-6">
                            <div class="flex items-center gap-4 mb-4">
                                <span class="px-3 py-1 ${getQualityBadgeClass(product.qualityGrade)} text-white text-sm rounded">
                                    ${product.qualityGrade ? product.qualityGrade.charAt(0).toUpperCase() + product.qualityGrade.slice(1) : 'Standard'}
                                </span>
                                <span class="px-3 py-1 ${product.availableQuantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-sm rounded">
                                    ${product.availableQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                                </span>
                            </div>
                            
                            <div class="text-3xl font-bold text-gray-800 mb-2">₹${product.price} <span class="text-lg text-gray-600">/ ${product.unit}</span></div>
                            
                            <div class="flex items-center gap-2 mb-4">
                                <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <i class="fas fa-user text-green-600"></i>
                                </div>
                                <div>
                                    <p class="font-medium text-gray-800">${product.farmer?.name || 'Farmer'}</p>
                                    <p class="text-sm text-gray-600">${product.origin?.location?.city || 'Unknown location'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="space-y-4 mb-6">
                            <div>
                                <h4 class="font-semibold text-gray-800 mb-2">Description</h4>
                                <p class="text-gray-600">${product.description || 'No description available.'}</p>
                            </div>
                            
                            ${product.origin ? `
                                <div>
                                    <h4 class="font-semibold text-gray-800 mb-2">Origin</h4>
                                    <p class="text-gray-600">
                                        ${product.origin.farmName ? `<strong>Farm:</strong> ${product.origin.farmName}<br>` : ''}
                                        ${product.origin.location ? `<strong>Location:</strong> ${product.origin.location.city}, ${product.origin.location.state}<br>` : ''}
                                        ${product.origin.harvestDate ? `<strong>Harvested:</strong> ${new Date(product.origin.harvestDate).toLocaleDateString()}<br>` : ''}
                                    </p>
                                </div>
                            ` : ''}
                            
                            ${product.cropDetails ? `
                                <div>
                                    <h4 class="font-semibold text-gray-800 mb-2">Crop Details</h4>
                                    <p class="text-gray-600">
                                        ${product.cropDetails.variety ? `<strong>Variety:</strong> ${product.cropDetails.variety}<br>` : ''}
                                        ${product.cropDetails.season ? `<strong>Season:</strong> ${product.cropDetails.season}<br>` : ''}
                                        ${product.cropDetails.organic ? `<span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded mr-2">Organic</span>` : ''}
                                        ${product.cropDetails.pesticideFree ? `<span class="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Pesticide Free</span>` : ''}
                                    </p>
                                </div>
                            ` : ''}
                            
                            ${product.animalDetails ? `
                                <div>
                                    <h4 class="font-semibold text-gray-800 mb-2">Animal Details</h4>
                                    <p class="text-gray-600">
                                        ${product.animalDetails.breed ? `<strong>Breed:</strong> ${product.animalDetails.breed}<br>` : ''}
                                        ${product.animalDetails.age ? `<strong>Age:</strong> ${product.animalDetails.age} ${product.animalDetails.ageUnit || 'years'}<br>` : ''}
                                        ${product.animalDetails.feedType ? `<strong>Feed Type:</strong> ${product.animalDetails.feedType}<br>` : ''}
                                        ${product.animalDetails.healthStatus ? `<strong>Health:</strong> ${product.animalDetails.healthStatus}` : ''}
                                    </p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex gap-4">
                            <button class="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition duration-300">
                                <i class="far fa-heart mr-2"></i> Add to Favorites
                            </button>
                            <button class="flex-1 py-3 ${product.availableQuantity > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg font-medium transition duration-300" ${product.availableQuantity === 0 ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close button
    modal.querySelector('.modal-close-btn').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Add to cart button
    const addToCartBtn = modal.querySelector('button.bg-green-600, button.bg-gray-400');
    if (addToCartBtn && product.availableQuantity > 0) {
        addToCartBtn.addEventListener('click', () => {
            addProductToCart(product._id);
            modal.remove();
        });
    }
}

async function addProductToCart(productId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'buyer') {
        alert('Please login as a buyer to add items to cart');
        window.location.href = 'auth.html';
        return;
    }

    try {
        // Get product details first
        const response = await api.getProduct(productId);
        if (!response || !response.success) {
            throw new Error('Failed to fetch product details');
        }

        const product = response.product;
        
        // Add to cart in localStorage
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.productId === productId);
        
        if (existingItemIndex > -1) {
            // Check if we can add more
            if (cart[existingItemIndex].quantity + 1 > product.availableQuantity) {
                alert(`Only ${product.availableQuantity} items available`);
                return;
            }
            cart[existingItemIndex].quantity += 1;
        } else {
            // Check if product is available
            if (product.availableQuantity < 1) {
                alert('Product is out of stock');
                return;
            }
            cart.push({
                productId: productId,
                quantity: 1,
                product: {
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    unit: product.unit,
                    images: product.images,
                    farmer: product.farmer,
                    availableQuantity: product.availableQuantity
                }
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show success message
        alert('Product added to cart!');
        
        // Update cart count
        updateCartCount();
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart');
    }
}

function toggleFavorite(event, productId) {
    const heartIcon = event.target.closest('button').querySelector('i');
    if (heartIcon.classList.contains('far')) {
        heartIcon.classList.remove('far');
        heartIcon.classList.add('fas', 'text-red-500');
        // In a real app, you would call api.addToFavorites(productId)
        alert('Added to favorites');
    } else {
        heartIcon.classList.remove('fas', 'text-red-500');
        heartIcon.classList.add('far');
        // In a real app, you would call api.removeFromFavorites(productId)
        alert('Removed from favorites');
    }
}

function updateProductCount() {
    // This function can be enhanced to show actual counts
    const container = document.getElementById('products-container');
    if (container) {
        const count = container.children.length;
        const productCountElement = document.getElementById('product-count');
        if (productCountElement) {
            productCountElement.textContent = `${count} products found`;
        }
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cart.length;
        cartCountElement.classList.toggle('hidden', cart.length === 0);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export to global scope
window.initMarketplace = initMarketplace;
window.filterCategory = filterCategory;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;