import Home from './pages/Home.js';
import Register from './pages/Register.js';
import CVBuilder from './pages/CVBuilder.js';
import JobBoard from './pages/JobBoard.js';
import { Auth } from './services/AuthService.js';

export const navigateTo = url => {
    location.hash = url;
};

export const router = async () => {
    const routes = [
        { path: '/', view: Home },
        { path: '/register', view: Register },
        { path: '/cv', view: CVBuilder, protected: true },
        { path: '/jobs', view: JobBoard, protected: true }
    ];

    // Get current path from hash (remove #)
    // Default to '/' if no hash
    const currentPath = location.hash.slice(1) || '/';

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            isMatch: currentPath === route.path
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

    if (!match) {
        match = {
            route: routes[0],
            isMatch: true
        };
    }

    // Check for protected routes
    if (match.route.protected && !Auth.isAuthenticated()) {
        navigateTo('/register');
        return;
    }

    const view = new match.route.view();
    document.getElementById('main-content').innerHTML = await view.getHtml();
    if (view.executeScript) {
        view.executeScript();
    }
};
