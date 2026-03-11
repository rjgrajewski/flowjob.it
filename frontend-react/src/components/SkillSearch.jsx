import React, { useState, useEffect, useMemo } from 'react';

const TYPING_SKILLS = [
    'React', 'Python', 'AWS', 'Figma', 'TypeScript',
    'Node.js', 'Go', 'Docker', 'GraphQL', 'Kubernetes',
    'Java', 'C#', 'SQL', 'Rust', 'Vue.js'
];

export function useTypingPlaceholder() {
    const [text, setText] = useState('');
    useEffect(() => {
        let currentSkillIdx = Math.floor(Math.random() * TYPING_SKILLS.length);
        let charIdx = 0;
        let isDeleting = false;
        let timer;

        const tick = () => {
            const currentSkill = TYPING_SKILLS[currentSkillIdx % TYPING_SKILLS.length];
            if (isDeleting) {
                charIdx--;
                setText(currentSkill.substring(0, charIdx));
            } else {
                charIdx++;
                setText(currentSkill.substring(0, charIdx));
            }

            let speed = isDeleting ? 40 : 120;

            if (!isDeleting && charIdx === currentSkill.length) {
                speed = 2500;
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                currentSkillIdx++;
                speed = 600;
            }

            timer = setTimeout(tick, speed);
        };
        timer = setTimeout(tick, 500);
        return () => clearTimeout(timer);
    }, []);
    return text || '|';
}

/**
 * Extracted Search Input component from the legacy Bubble Cloud UI.
 * It's isolated here for potential future use if search functionality
 * is needed again.
 */
export default function SkillSearch({ search, setSearch }) {
    const placeholderText = useTypingPlaceholder();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 'auto' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                <span style={{ position: 'absolute', left: '1rem', color: 'var(--accent-cyan)', fontWeight: 800 }}>❯</span>
                <input
                    className="form-input"
                    placeholder={search ? "" : placeholderText}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        paddingLeft: '2.5rem',
                        fontSize: '1rem',
                        height: '48px',
                        borderRadius: '999px',
                        border: '2px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        transition: 'border-color 0.2s',
                        width: '100%'
                    }}
                />
            </div>
        </div>
    );
}

/**
 * Filter logic used alongside the legacy search input.
 */
export function useSkillSearchFilter(availableSkills, search) {
    return useMemo(() => {
        if (search) {
            const lowerSearch = search.toLowerCase();

            const exactMatches = [];
            const startsWithMatches = [];
            const containsMatches = [];

            availableSkills.forEach(s => {
                const lowerName = s.name.toLowerCase();
                if (lowerName === lowerSearch) {
                    exactMatches.push(s);
                } else if (lowerName.startsWith(lowerSearch)) {
                    startsWithMatches.push(s);
                } else if (lowerName.includes(lowerSearch)) {
                    containsMatches.push(s);
                }
            });

            return [...exactMatches, ...startsWithMatches, ...containsMatches];
        }

        return availableSkills;
    }, [availableSkills, search]);
}
