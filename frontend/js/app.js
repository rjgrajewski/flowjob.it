import { navigateTo, router } from './router.js';
import { Auth } from './services/AuthService.js';
import { updateNavigation } from './ui.js';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Handle hash changes
    window.addEventListener('hashchange', router);

    // Update navigation based on current auth state
    updateNavigation();

    // Initial routing
    router();
});

// Logout handler
const logoutBtn = document.getElementById('nav-logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
        updateNavigation();
        navigateTo('/'); // This sets hash to #/ which routes to Home
    });
}
