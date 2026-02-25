// Services — mirrors old vanilla JS services but as ES modules for React

const BASE = '/api';
const AUTH_TIMEOUT_MS = 15000;

function parseDetail(detail) {
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        return first?.msg || first?.loc?.join('. ') || JSON.stringify(first);
    }
    return null;
}

function fetchWithTimeout(url, options = {}, timeoutMs = AUTH_TIMEOUT_MS) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

export const api = {
    getSkills: async () => {
        const res = await fetch(`${BASE}/skills`);
        if (!res.ok) throw new Error('Failed to fetch skills');
        return res.json();
    },
    getOffers: async () => {
        const res = await fetch(`${BASE}/offers`);
        if (!res.ok) throw new Error('Failed to fetch offers');
        return res.json();
    },
    saveUserCV: async (userId, cvData) => {
        if (!userId) return { success: false };
        const res = await fetch(`${BASE}/users/${userId}/skills`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cvData)
        });
        if (!res.ok) throw new Error('Failed to save skills');
        return res.json();
    },
    getUserCV: async (userId) => {
        if (!userId) return { skills: [], antiSkills: [] };
        try {
            const res = await fetch(`${BASE}/users/${userId}/skills`);
            if (!res.ok) throw new Error('Failed to fetch user skills');
            return await res.json();
        } catch (e) {
            console.error(e);
            return { skills: [], antiSkills: [] };
        }
    },
};

export const auth = {
    isAuthenticated: () => localStorage.getItem('flowjob_user') !== null,
    async login(email, password) {
        let res;
        try {
            res = await fetchWithTimeout(`${BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
        } catch (e) {
            if (e.name === 'AbortError') throw new Error('Serwer nie odpowiada. Sprawdź, czy backend działa (port 8000).');
            throw new Error(e.message || 'Błąd połączenia');
        }
        if (!res.ok) {
            const text = await res.text();
            const err = (() => { try { return JSON.parse(text); } catch { return {}; } })();
            const fallback = res.status === 502 || res.status === 503
                ? 'Backend nie działa. Uruchom w drugim terminalu: cd aligno && python3 -m uvicorn backend.main:app --reload --port 8000'
                : `Logowanie nie powiodło się (${res.status})`;
            const msg = parseDetail(err.detail) || fallback;
            throw new Error(msg);
        }
        const user = await res.json();
        localStorage.setItem('flowjob_user', JSON.stringify(user));
        return user;
    },
    async register(userData) {
        let res;
        try {
            res = await fetchWithTimeout(`${BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                }),
            });
        } catch (e) {
            if (e.name === 'AbortError') throw new Error('Serwer nie odpowiada. Upewnij się, że backend działa (port 8000).');
            throw new Error(e.message || 'Błąd połączenia');
        }
        if (!res.ok) {
            const text = await res.text();
            const err = (() => { try { return JSON.parse(text); } catch { return {}; } })();
            const fallback = res.status === 502 || res.status === 503
                ? 'Backend nie działa. Uruchom w drugim terminalu: cd aligno && python3 -m uvicorn backend.main:app --reload --port 8000'
                : `Rejestracja nie powiodła się (${res.status})`;
            const msg = parseDetail(err.detail) || fallback;
            throw new Error(msg);
        }
        const user = await res.json();
        localStorage.setItem('flowjob_user', JSON.stringify(user));
        return user;
    },
    logout: () => {
        localStorage.removeItem('flowjob_user');
        localStorage.removeItem('flowjob_profile');
        localStorage.removeItem('flowjob_onboarding_done');
    },
    getUser: () => JSON.parse(localStorage.getItem('flowjob_user')),
    getOnboarding: async (userId) => {
        if (!userId) return null;
        try {
            const res = await fetch(`${BASE}/users/${userId}/onboarding`);
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error('Failed to fetch user profile');
            }
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    },
    hasCompletedOnboarding: () => {
        const user = JSON.parse(localStorage.getItem('flowjob_user'));
        return user?.onboarding_completed === true || localStorage.getItem('flowjob_onboarding_done') === 'true';
    },
    async completeOnboarding(profileData) {
        const user = this.getUser();
        if (!user?.id) throw new Error('Nie znaleziono zalogowanego użytkownika.');

        const res = await fetch(`${BASE}/users/${user.id}/onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(parseDetail(err.detail) || 'Nie udało się zapisać profilu.');
        }

        // Update local state
        const updatedUser = { ...user, onboarding_completed: true };
        localStorage.setItem('flowjob_user', JSON.stringify(updatedUser));
        localStorage.setItem('flowjob_profile', JSON.stringify(profileData));
        localStorage.setItem('flowjob_onboarding_done', 'true');
        return updatedUser;
    },
};
