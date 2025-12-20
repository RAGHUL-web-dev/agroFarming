// Simple utility functions

function showLoading(message) {
    console.log('Loading:', message);
}

function hideLoading() {
    console.log('Hide loading');
}

function showToast(message, type = 'info') {
    console.log(`${type}: ${message}`);
}

function formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN');
}

// Export to global scope
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;