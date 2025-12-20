// Simple Component Loader without complex redirect logic

async function loadComponent(componentName, targetId) {
    try {
        const response = await fetch(`components/${componentName}.html`);
        if (!response.ok) {
            console.warn(`Component ${componentName} not found`);
            return false;
        }
        const html = await response.text();
        const target = document.getElementById(targetId);
        if (target) {
            target.innerHTML = html;
            
            // Execute any script tags in the component
            const scripts = target.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                if (script.src) {
                    newScript.src = script.src;
                } else {
                    newScript.textContent = script.textContent;
                }
                document.body.appendChild(newScript);
            });
            
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error loading component ${componentName}:`, error);
        return false;
    }
}

// Simple auth check
function isLoggedIn() {
    const user = JSON.parse(localStorage.getItem('user'));
    return !!(user && user.token);
}

// Simple logout
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    window.location.href = 'index.html';
}

// Export to global scope
window.loadComponent = loadComponent;
window.isLoggedIn = isLoggedIn;
window.logout = logout;

// No auto-init on DOMContentLoaded - let each page control its own flow