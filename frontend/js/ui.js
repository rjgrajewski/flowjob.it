import { Auth } from './services/AuthService.js';

export function updateNavigation() {
    const isAuthenticated = Auth.isAuthenticated();

    const navRegister = document.getElementById('nav-register');
    const navCV = document.getElementById('nav-cv');
    const navJobs = document.getElementById('nav-jobs');
    const navLogout = document.getElementById('nav-logout');

    if (isAuthenticated) {
        if (navRegister) navRegister.style.display = 'none';
        if (navCV) navCV.style.display = 'block';
        if (navJobs) navJobs.style.display = 'block';
        if (navLogout) navLogout.style.display = 'block';
    } else {
        if (navRegister) navRegister.style.display = 'block';
        if (navCV) navCV.style.display = 'none';
        if (navJobs) navJobs.style.display = 'none';
        if (navLogout) navLogout.style.display = 'none';
    }
}
