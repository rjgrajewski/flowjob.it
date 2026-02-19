export const Auth = {
    isAuthenticated: () => {
        return localStorage.getItem('aligno_user') !== null;
    },

    login: (email, password) => {
        // Mock login
        const user = { email, name: email.split('@')[0] };
        localStorage.setItem('aligno_user', JSON.stringify(user));
        return Promise.resolve(user);
    },

    logout: () => {
        localStorage.removeItem('aligno_user');
    },

    getUser: () => {
        return JSON.parse(localStorage.getItem('aligno_user'));
    },

    register: (userData) => {
        // Mock registration - just saves user to local storage for now
        localStorage.setItem('aligno_user', JSON.stringify(userData));
        return Promise.resolve(userData);
    }
};
