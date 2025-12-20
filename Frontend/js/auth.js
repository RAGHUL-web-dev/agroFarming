// Authentication handling

function initAuth() {
    // Initialize forms first
    initLoginForm();
    initRegisterForm();
    initForgotPasswordForm();
    
    // Check URL parameters for action (login/register)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const role = urlParams.get('role');
    
    // Show appropriate form based on URL parameters
    if (action === 'register') {
        showRegister();
        if (role) {
            selectRole(role);
        }
    } else if (action === 'forgot') {
        showForgotPassword();
    } else {
        showLogin();
    }
    
    // Check if user is already logged in (but don't auto-redirect here)
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        // Just update the forms to show logged-in state
        updateAuthFormsForLoggedInUser();
    }
}

function updateAuthFormsForLoggedInUser() {
    // Hide all auth forms
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.add('hidden');
    
    // Show logged in message
    const user = JSON.parse(localStorage.getItem('user'));
    const authFormContainer = document.getElementById('auth-form-container');
    
    if (authFormContainer) {
        authFormContainer.innerHTML = `
            <div class="text-center py-8">
                <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">Already Logged In</h3>
                <p class="text-gray-600 mb-6">You are already logged in as ${user.name} (${user.role}).</p>
                <div class="flex flex-col gap-3">
                    <button onclick="redirectBasedOnRole()" class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Go to Dashboard
                    </button>
                    <button onclick="logout()" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        Logout
                    </button>
                </div>
            </div>
        `;
    }
}

function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        showLoading('Signing in...');

        try {
            const response = await api.login(email, password);
            
            if (response && response.success) {
                // Store user data
                localStorage.setItem('user', JSON.stringify({
                    ...response.user,
                    token: response.token
                }));

                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                }

                showToast('Login successful!', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    redirectBasedOnRole();
                }, 1000);
            } else {
                showToast(response?.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });
}

function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    if (!registerForm) return;

    // Role selection
    const roleFarmerBtn = document.getElementById('role-farmer-btn');
    const roleBuyerBtn = document.getElementById('role-buyer-btn');
    const farmerTypeSection = document.getElementById('farmer-type-section');
    const roleInput = document.getElementById('register-role');

    function selectRole(role) {
        roleInput.value = role;
        
        // Update button styles
        if (role === 'farmer') {
            roleFarmerBtn.classList.add('border-green-500', 'text-green-600');
            roleFarmerBtn.classList.remove('border-gray-300', 'text-gray-600');
            roleBuyerBtn.classList.add('border-gray-300', 'text-gray-600');
            roleBuyerBtn.classList.remove('border-green-500', 'text-green-600');
            farmerTypeSection.classList.remove('hidden');
        } else {
            roleBuyerBtn.classList.add('border-green-500', 'text-green-600');
            roleBuyerBtn.classList.remove('border-gray-300', 'text-gray-600');
            roleFarmerBtn.classList.add('border-gray-300', 'text-gray-600');
            roleFarmerBtn.classList.remove('border-green-500', 'text-green-600');
            farmerTypeSection.classList.add('hidden');
        }
    }

    // Register form submission
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const role = document.getElementById('register-role').value;
        const farmerType = role === 'farmer' ? document.getElementById('farmer-type').value : null;
        const terms = document.getElementById('terms').checked;

        // Validation
        if (!name || !email || !phone || !password || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        if (!isValidPhone(phone)) {
            showToast('Please enter a valid Indian phone number', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        if (!terms) {
            showToast('Please agree to the terms and conditions', 'error');
            return;
        }

        showLoading('Creating account...');

        try {
            const userData = {
                name,
                email,
                phone,
                password,
                role,
                farmerType
            };

            const response = await api.register(userData);
            
            if (response && response.success) {
                // Auto login after registration
                localStorage.setItem('user', JSON.stringify({
                    ...response.user,
                    token: response.token
                }));

                showToast('Registration successful! Welcome to AgroForms.', 'success');
                
                // Redirect based on role
                setTimeout(() => {
                    redirectBasedOnRole();
                }, 1500);
            } else {
                showToast(response?.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });

    // Initialize role selection
    if (roleFarmerBtn && roleBuyerBtn) {
        roleFarmerBtn.addEventListener('click', () => selectRole('farmer'));
        roleBuyerBtn.addEventListener('click', () => selectRole('buyer'));
    }
}

function initForgotPasswordForm() {
    const forgotForm = document.getElementById('forgot-password-form');
    if (!forgotForm) return;

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('forgot-email').value;

        if (!email || !isValidEmail(email)) {
            showToast('Please enter a valid email address', 'error');
            return;
        }

        showLoading('Sending reset link...');

        try {
            // In a real application, you would call the backend API
            // For now, simulate a successful response
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            showToast('Password reset link has been sent to your email', 'success');
            
            // Return to login form after 2 seconds
            setTimeout(() => {
                showLogin();
            }, 2000);
        } catch (error) {
            showToast('Failed to send reset link. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    });
}

// Form switching functions
function showLogin() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');
    
    if (loginForm) loginForm.classList.remove('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (forgotForm) forgotForm.classList.add('hidden');
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const switchText = document.getElementById('switch-text');
    
    if (authTitle) authTitle.textContent = 'Welcome Back';
    if (authSubtitle) authSubtitle.textContent = 'Sign in to your account to continue';
    
    if (switchText) {
        switchText.innerHTML = `
            Don't have an account? 
            <button onclick="showRegister()" class="text-green-600 hover:text-green-700 font-semibold">
                Sign up now
            </button>
        `;
    }
}


function showRegister() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.remove('hidden');
    if (forgotForm) forgotForm.classList.add('hidden');
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const switchText = document.getElementById('switch-text');
    
    if (authTitle) authTitle.textContent = 'Create Account';
    if (authSubtitle) authSubtitle.textContent = 'Join AgroForms today';
    
    if (switchText) {
        switchText.innerHTML = `
            Already have an account? 
            <button onclick="showLogin()" class="text-green-600 hover:text-green-700 font-semibold">
                Sign in
            </button>
        `;
    }
}

function showForgotPassword() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotForm = document.getElementById('forgot-password-form');
    
    if (loginForm) loginForm.classList.add('hidden');
    if (registerForm) registerForm.classList.add('hidden');
    if (forgotForm) forgotForm.classList.remove('hidden');
    
    const authTitle = document.getElementById('auth-title');
    const authSubtitle = document.getElementById('auth-subtitle');
    const switchText = document.getElementById('switch-text');
    
    if (authTitle) authTitle.textContent = '';
    if (authSubtitle) authSubtitle.textContent = '';
    
    if (switchText) switchText.innerHTML = '';
}

function selectRole(role) {
    const roleFarmerBtn = document.getElementById('role-farmer-btn');
    const roleBuyerBtn = document.getElementById('role-buyer-btn');
    const farmerTypeSection = document.getElementById('farmer-type-section');
    const roleInput = document.getElementById('register-role');
    
    if (!roleInput) return;
    
    roleInput.value = role;
    
    // Update button styles
    if (role === 'farmer') {
        if (roleFarmerBtn) {
            roleFarmerBtn.classList.add('border-green-500', 'text-green-600');
            roleFarmerBtn.classList.remove('border-gray-300', 'text-gray-600');
        }
        if (roleBuyerBtn) {
            roleBuyerBtn.classList.add('border-gray-300', 'text-gray-600');
            roleBuyerBtn.classList.remove('border-green-500', 'text-green-600');
        }
        if (farmerTypeSection) {
            farmerTypeSection.classList.remove('hidden');
        }
    } else {
        if (roleBuyerBtn) {
            roleBuyerBtn.classList.add('border-green-500', 'text-green-600');
            roleBuyerBtn.classList.remove('border-gray-300', 'text-gray-600');
        }
        if (roleFarmerBtn) {
            roleFarmerBtn.classList.add('border-gray-300', 'text-gray-600');
            roleFarmerBtn.classList.remove('border-green-500', 'text-green-600');
        }
        if (farmerTypeSection) {
            farmerTypeSection.classList.add('hidden');
        }
    }
}


// Initialize on window load
window.addEventListener('DOMContentLoaded', function() {
    // Check if we're on auth page
    if (window.location.pathname.includes('auth.html')) {
        initAuth();
    }
});

// Export functions to global scope
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showForgotPassword = showForgotPassword;
window.selectRole = selectRole;