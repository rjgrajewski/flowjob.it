export const DataService = {
    getSkills: async () => {
        try {
            const response = await fetch('/api/skills');
            if (!response.ok) throw new Error('Failed to fetch skills');
            return await response.json();
        } catch (error) {
            console.error('Error fetching skills:', error);
            return [];
        }
    },

    getJobs: async () => {
        try {
            const response = await fetch('/api/jobs');
            if (!response.ok) throw new Error('Failed to fetch jobs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching jobs:', error);
            return [];
        }
    },

    saveUserCV: async (cvData) => {
        // Mock saving CV - still local only for now as requested
        console.log('Saving CV:', cvData);
        localStorage.setItem('aligno_cv', JSON.stringify(cvData));
        return Promise.resolve({ success: true });
    },

    getUserCV: () => {
        return JSON.parse(localStorage.getItem('aligno_cv')) || { skills: [], antiSkills: [] };
    }
};
