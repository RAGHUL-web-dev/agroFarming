// Profile Management for AgroForms

let currentUser = null;
let editingProfile = false;

async function initProfile() {
    try {
        // Check authentication
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            window.location.href = 'auth.html';
            return;
        }

        // Load user profile
        await loadUserProfile();

        // Setup event listeners
        setupProfileEventListeners();

        // Check URL for action
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action === 'edit') {
            loadProfileView('edit');
        } else {
            loadProfileView('view');
        }

    } catch (error) {
        console.error('Error initializing profile:', error);
        showToast('Error loading profile', 'error');
    }
}

function setupProfileEventListeners() {
    // Avatar upload listeners
    document.addEventListener('click', function(e) {
        if (e.target.closest('.avatar-upload-btn')) {
            document.getElementById('avatar-input').click();
        }
    });

    // Profile edit form submission
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'profile-edit-form') {
            e.preventDefault();
            saveProfileChanges();
        }
    });

    // Password change form submission
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'change-password-form') {
            e.preventDefault();
            changePassword();
        }
    });
}

async function loadUserProfile() {
    try {
        // Show loading state
        const content = document.getElementById('profile-content');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
                    <p class="mt-4 text-gray-600">Loading profile...</p>
                </div>
            `;
        }

        // Get user data
        const response = await api.getCurrentUser();
        if (response && response.success) {
            currentUser = response.user;
            updateProfileHeader();
        } else {
            throw new Error('Failed to load profile');
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        
        const content = document.getElementById('profile-content');
        if (content) {
            content.innerHTML = `
                <div class="text-center py-12">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Error Loading Profile</h3>
                    <p class="text-gray-600 mb-4">${error.message || 'Please try again later'}</p>
                    <button onclick="loadUserProfile()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

function updateProfileHeader() {
    if (!currentUser) return;

    // Update header information
    const nameElement = document.getElementById('profile-name');
    const roleElement = document.getElementById('profile-role');
    const statusElement = document.getElementById('profile-status');
    const emailElement = document.getElementById('profile-email');

    if (nameElement) nameElement.textContent = currentUser.name || 'No Name';
    if (emailElement) emailElement.textContent = currentUser.email || 'No Email';

    if (roleElement) {
        const role = currentUser.role || 'user';
        roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    }

    if (statusElement) {
        const status = currentUser.verificationStatus || 'unverified';
        const statusColors = {
            'verified': 'bg-green-500',
            'pending': 'bg-yellow-500',
            'unverified': 'bg-gray-500',
            'rejected': 'bg-red-500'
        };
        
        statusElement.innerHTML = `
            <i class="fas fa-circle ${statusColors[status] || 'bg-gray-500'} text-xs mr-1"></i> 
            ${status.charAt(0).toUpperCase() + status.slice(1)}
        `;
    }
}

function loadProfileView(view) {
    const content = document.getElementById('profile-content');
    if (!content) return;

    editingProfile = (view === 'edit');

    if (view === 'view') {
        showProfileView();
    } else if (view === 'edit') {
        showProfileEditForm();
    }
}

function showProfileView() {
    if (!currentUser) return;

    const content = document.getElementById('profile-content');
    if (!content) return;

    const user = currentUser;

    content.innerHTML = `
        <div class="space-y-6">
            <!-- Profile Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Personal Information -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-user-circle text-green-600 mr-2"></i> Personal Information
                    </h3>
                    <div class="space-y-3">
                        <div class="flex justify-between items-center py-2 border-b border-gray-200">
                            <span class="text-gray-600">Full Name</span>
                            <span class="font-medium text-gray-800">${user.name || 'Not set'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-200">
                            <span class="text-gray-600">Email</span>
                            <span class="font-medium text-gray-800">${user.email || 'Not set'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-200">
                            <span class="text-gray-600">Phone</span>
                            <span class="font-medium text-gray-800">${user.phone || 'Not set'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2 border-b border-gray-200">
                            <span class="text-gray-600">Role</span>
                            <span class="font-medium text-gray-800 capitalize">${user.role || 'user'}</span>
                        </div>
                        <div class="flex justify-between items-center py-2">
                            <span class="text-gray-600">Member Since</span>
                            <span class="font-medium text-gray-800">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <!-- Account Status -->
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <i class="fas fa-shield-alt text-green-600 mr-2"></i> Account Status
                    </h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-800">Verification Status</h4>
                                <p class="text-sm text-gray-600">Account verification level</p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-sm font-medium 
                                ${user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                                  user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  user.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'}">
                                ${user.verificationStatus ? user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1) : 'Unverified'}
                            </span>
                        </div>
                        
                        ${user.role === 'farmer' ? `
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-800">Farm Details</h4>
                                <p class="text-sm text-gray-600">Farm information</p>
                            </div>
                            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                ${user.farmDetails ? 'Added' : 'Not Added'}
                            </span>
                        </div>
                        ` : ''}
                        
                        ${user.role === 'buyer' ? `
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="font-medium text-gray-800">Business Type</h4>
                                <p class="text-sm text-gray-600">Type of business</p>
                            </div>
                            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                ${user.businessType || 'Not Specified'}
                            </span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="mt-6">
                        <button onclick="loadProfileView('edit')" 
                                class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            <i class="fas fa-edit mr-2"></i> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            <!-- Additional Information -->
            <div class="bg-gray-50 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-info-circle text-green-600 mr-2"></i> Additional Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-medium text-gray-800 mb-2">${user.role === 'farmer' ? 'Farm Information' : 'Business Information'}</h4>
                        ${user.role === 'farmer' ? `
                            <div class="space-y-2">
                                <p class="text-gray-600"><span class="font-medium">Farm Name:</span> ${user.farmDetails?.farmName || 'Not specified'}</p>
                                <p class="text-gray-600"><span class="font-medium">Location:</span> ${user.farmDetails?.location || 'Not specified'}</p>
                                <p class="text-gray-600"><span class="font-medium">Specialization:</span> ${user.farmDetails?.specialization || 'Not specified'}</p>
                            </div>
                        ` : user.role === 'buyer' ? `
                            <div class="space-y-2">
                                <p class="text-gray-600"><span class="font-medium">Business Name:</span> ${user.businessDetails?.businessName || 'Not specified'}</p>
                                <p class="text-gray-600"><span class="font-medium">Business Type:</span> ${user.businessDetails?.businessType || 'Not specified'}</p>
                                <p class="text-gray-600"><span class="font-medium">TIN/GST:</span> ${user.businessDetails?.tinGst || 'Not specified'}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div>
                        <h4 class="font-medium text-gray-800 mb-2">Contact Preferences</h4>
                        <div class="space-y-2">
                            <div class="flex items-center">
                                <i class="fas fa-envelope text-gray-400 mr-2"></i>
                                <span class="text-gray-600">${user.email}</span>
                            </div>
                            ${user.phone ? `
                            <div class="flex items-center">
                                <i class="fas fa-phone text-gray-400 mr-2"></i>
                                <span class="text-gray-600">${user.phone}</span>
                            </div>
                            ` : ''}
                            ${user.address ? `
                            <div class="flex items-center">
                                <i class="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                                <span class="text-gray-600">${user.address}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="showChangePasswordModal()" 
                        class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 text-left">
                    <div class="flex items-center mb-2">
                        <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-key text-blue-600"></i>
                        </div>
                        <h4 class="font-semibold text-gray-800">Change Password</h4>
                    </div>
                    <p class="text-sm text-gray-600">Update your account password</p>
                </button>
                
                ${user.role === 'farmer' ? `
                <button onclick="window.location.href='products.html'" 
                        class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 text-left">
                    <div class="flex items-center mb-2">
                        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-seedling text-green-600"></i>
                        </div>
                        <h4 class="font-semibold text-gray-800">Manage Products</h4>
                    </div>
                    <p class="text-sm text-gray-600">View and edit your products</p>
                </button>
                ` : ''}
                
                ${user.role === 'buyer' ? `
                <button onclick="window.location.href='orders.html'" 
                        class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 text-left">
                    <div class="flex items-center mb-2">
                        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-shopping-cart text-purple-600"></i>
                        </div>
                        <h4 class="font-semibold text-gray-800">My Orders</h4>
                    </div>
                    <p class="text-sm text-gray-600">View your order history</p>
                </button>
                ` : ''}
                
                <button onclick="showSettingsModal()" 
                        class="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 text-left">
                    <div class="flex items-center mb-2">
                        <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-cog text-gray-600"></i>
                        </div>
                        <h4 class="font-semibold text-gray-800">Settings</h4>
                    </div>
                    <p class="text-sm text-gray-600">Account preferences and settings</p>
                </button>
            </div>
        </div>
    `;
}

function showProfileEditForm() {
    if (!currentUser) return;

    const content = document.getElementById('profile-content');
    if (!content) return;

    const user = currentUser;

    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-semibold text-gray-800">Edit Profile</h3>
                <button onclick="loadProfileView('view')" 
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    <i class="fas fa-arrow-left mr-2"></i> Back to Profile
                </button>
            </div>

            <form id="profile-edit-form" class="space-y-6">
                <!-- Personal Information -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Personal Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                            <input type="text" name="name" value="${user.name || ''}" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" value="${user.email || ''}" disabled
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                            <p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input type="tel" name="phone" value="${user.phone || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="+91 1234567890">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
                            <input type="text" name="address" value="${user.address || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="Your complete address">
                        </div>
                    </div>
                </div>

                ${user.role === 'farmer' && user.farmDetails ? `
                <!-- Farm Information -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Farm Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Farm Name</label>
                            <input type="text" name="farmDetails.farmName" value="${user.farmDetails.farmName || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input type="text" name="farmDetails.location" value="${user.farmDetails.location || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                            <input type="text" name="farmDetails.specialization" value="${user.farmDetails.specialization || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="e.g., Organic Vegetables, Dairy">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Farm Size (acres)</label>
                            <input type="number" name="farmDetails.farmSize" value="${user.farmDetails.farmSize || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="e.g., 10">
                        </div>
                    </div>
                </div>
                ` : ''}

                ${user.role === 'buyer' && user.businessDetails ? `
                <!-- Business Information -->
                <div class="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4">Business Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                            <input type="text" name="businessDetails.businessName" value="${user.businessDetails.businessName || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                            <select name="businessDetails.businessType" 
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                <option value="">Select Type</option>
                                <option value="restaurant" ${user.businessDetails.businessType === 'restaurant' ? 'selected' : ''}>Restaurant</option>
                                <option value="retailer" ${user.businessDetails.businessType === 'retailer' ? 'selected' : ''}>Retailer</option>
                                <option value="wholesaler" ${user.businessDetails.businessType === 'wholesaler' ? 'selected' : ''}>Wholesaler</option>
                                <option value="distributor" ${user.businessDetails.businessType === 'distributor' ? 'selected' : ''}>Distributor</option>
                                <option value="processor" ${user.businessDetails.businessType === 'processor' ? 'selected' : ''}>Processor</option>
                                <option value="other" ${user.businessDetails.businessType === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">TIN/GST Number</label>
                            <input type="text" name="businessDetails.tinGst" value="${user.businessDetails.tinGst || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="e.g., 27ABCDE1234F1Z5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                            <input type="text" name="businessDetails.address" value="${user.businessDetails.address || ''}"
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- Form Actions -->
                <div class="flex justify-end gap-4 pt-6">
                    <button type="button" onclick="loadProfileView('view')" 
                            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" 
                            class="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                        <i class="fas fa-save mr-2"></i> Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;
}

async function saveProfileChanges() {
    try {
        const form = document.getElementById('profile-edit-form');
        const formData = new FormData(form);
        const data = {};

        // Convert form data to object
        for (let [key, value] of formData.entries()) {
            if (key.includes('.')) {
                const keys = key.split('.');
                let current = data;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
            } else {
                data[key] = value;
            }
        }

        // Update profile based on role
        let response;
        if (currentUser.role === 'farmer') {
            response = await api.updateFarmerProfile(data);
        } else if (currentUser.role === 'buyer') {
            response = await api.updateBuyerProfile(data);
        } else {
            response = await api.updateProfile(data);
        }

        if (response && response.success) {
            showToast('Profile updated successfully!', 'success');
            
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                user.name = data.name || user.name;
                localStorage.setItem('user', JSON.stringify(user));
            }
            
            // Reload profile
            await loadUserProfile();
            loadProfileView('view');
        } else {
            showToast(response?.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast(error.message || 'Failed to update profile', 'error');
    }
}

function showChangePasswordModal() {
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold text-gray-800">Change Password</h3>
                        <button onclick="closeModal()" 
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="change-password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Current Password *</label>
                            <input type="password" name="currentPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                            <input type="password" name="newPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                   placeholder="At least 8 characters">
                            <p class="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password *</label>
                            <input type="password" name="confirmPassword" required
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                        </div>
                        
                        <div class="flex justify-end gap-4 pt-4">
                            <button type="button" onclick="closeModal()" 
                                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                Cancel
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function changePassword() {
    try {
        const form = document.getElementById('change-password-form');
        const formData = new FormData(form);
        
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        // Validation
        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        const response = await api.changePassword(currentPassword, newPassword);
        if (response && response.success) {
            showToast('Password changed successfully!', 'success');
            closeModal();
        } else {
            showToast(response?.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showToast(error.message || 'Failed to change password', 'error');
    }
}

function showAvatarModal() {
    const modalContainer = document.getElementById('avatar-modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-xl font-semibold text-gray-800">Update Profile Picture</h3>
                        <button onclick="closeModal()" 
                                class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="text-center">
                        <div class="mb-6">
                            <div class="w-48 h-48 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-user text-6xl text-gray-400"></i>
                            </div>
                            <p class="text-gray-600">Upload a new profile picture</p>
                        </div>
                        
                        <div class="space-y-4">
                            <input type="file" id="avatar-input" accept="image/*" class="hidden">
                            
                            <button onclick="document.getElementById('avatar-input').click()" 
                                    class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-upload mr-2"></i> Choose Image
                            </button>
                            
                            <button onclick="removeAvatar()" 
                                    class="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                <i class="fas fa-trash mr-2"></i> Remove Picture
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function removeAvatar() {
    // Implement avatar removal logic here
    showToast('Avatar removal feature coming soon!', 'info');
    closeModal();
}

function showSettingsModal() {
    showToast('Settings feature coming soon!', 'info');
}

function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    const avatarModalContainer = document.getElementById('avatar-modal-container');
    
    if (modalContainer) modalContainer.innerHTML = '';
    if (avatarModalContainer) avatarModalContainer.innerHTML = '';
}

// Export functions for use in HTML
window.initProfile = initProfile;
window.loadProfileView = loadProfileView;
window.showChangePasswordModal = showChangePasswordModal;
window.showAvatarModal = showAvatarModal;
window.closeModal = closeModal;