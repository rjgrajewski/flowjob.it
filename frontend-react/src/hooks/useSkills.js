import { useState, useEffect } from 'react';
import { api } from '../services/api.js';

export function useSkills(selected = []) {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    const selectedStr = selected.join(',');

    useEffect(() => {
        if (skills.length === 0) setLoading(true);

        const timeoutId = setTimeout(() => {
            api.getSkills(selectedStr ? selectedStr.split(',') : [])
                .then(data => {
                    setSkills(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }, 150);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStr]);

    return { skills, loading };
}
