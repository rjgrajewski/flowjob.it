// Services — mirrors old vanilla JS services but as ES modules for React

const BASE = '/api';

export const api = {
    getSkills: async () => {
        const res = await fetch(`${BASE}/skills`);
        if (!res.ok) throw new Error('Failed to fetch skills');
        return res.json();
    },
    getJobs: async () => {
        const res = await fetch(`${BASE}/jobs`);
        if (!res.ok) throw new Error('Failed to fetch jobs');
        return res.json();
    },
    saveUserCV: async (cvData) => {
        localStorage.setItem('flowjob_cv', JSON.stringify(cvData));
        return { success: true };
    },
    getUserCV: () => {
        return JSON.parse(localStorage.getItem('flowjob_cv')) || { skills: [], antiSkills: [] };
    },
};

export const auth = {
    isAuthenticated: () => localStorage.getItem('flowjob_user') !== null,
    login: (email, password) => {
        const user = { email, name: email.split('@')[0] };
        localStorage.setItem('flowjob_user', JSON.stringify(user));
        return Promise.resolve(user);
    },
    register: (userData) => {
        localStorage.setItem('flowjob_user', JSON.stringify(userData));
        return Promise.resolve(userData);
    },
    logout: () => localStorage.removeItem('flowjob_user'),
    getUser: () => JSON.parse(localStorage.getItem('flowjob_user')),
};
