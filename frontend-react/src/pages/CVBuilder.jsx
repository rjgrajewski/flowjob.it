import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';

const BUBBLE_COLORS = [
    ['rgba(0,229,255,0.1)', 'rgba(0,229,255,0.5)'],
    ['rgba(124,58,237,0.1)', 'rgba(124,58,237,0.5)'],
    ['rgba(0,230,118,0.1)', 'rgba(0,230,118,0.5)'],
    ['rgba(255,215,64,0.1)', 'rgba(255,215,64,0.5)'],
    ['rgba(255,83,112,0.1)', 'rgba(255,83,112,0.5)'],
    ['rgba(0,229,255,0.08)', 'rgba(0,229,255,0.4)'],
    ['rgba(200,100,255,0.1)', 'rgba(200,100,255,0.5)'],
    ['rgba(0,200,255,0.1)', 'rgba(0,200,255,0.45)'],
    ['rgba(255,165,0,0.1)', 'rgba(255,165,0,0.5)'],
    ['rgba(50,200,150,0.1)', 'rgba(50,200,150,0.5)'],
];

function SkillBubble({ skill, idx, maxFreq, isSelected, isAnti, onLeft, onRight }) {
    const freq = skill.frequency || 0;
    const minSize = 55, maxSize = 110;
    const size = minSize + ((maxSize - minSize) * (freq / maxFreq));
    const colorIdx = (skill.name.length + idx) % BUBBLE_COLORS.length;
    const [bg, borderCol] = BUBBLE_COLORS[colorIdx];

    let bubbleBg = bg;
    let bubbleBorder = 'transparent';
    let bubbleShadow = 'none';
    let textColor = 'var(--text-secondary)';

    if (isSelected) {
        bubbleBg = 'rgba(0,229,255,0.15)';
        bubbleBorder = 'var(--accent-cyan)';
        bubbleShadow = '0 0 16px rgba(0,229,255,0.4)';
        textColor = 'var(--accent-cyan)';
    } else if (isAnti) {
        bubbleBg = 'rgba(255,83,112,0.15)';
        bubbleBorder = 'var(--accent-red)';
        bubbleShadow = '0 0 14px rgba(255,83,112,0.35)';
        textColor = 'var(--accent-red)';
    }

    return (
        <motion.div
            title={`${skill.name} (${freq} jobs)`}
            onClick={onLeft}
            onContextMenu={e => { e.preventDefault(); onRight(); }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={{ boxShadow: bubbleShadow }}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: bubbleBg,
                border: `1.5px solid ${bubbleBorder || borderCol}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: `${Math.max(0.65, size / 110)}rem`,
                fontWeight: 600,
                color: textColor,
                cursor: 'pointer',
                padding: '0.5rem',
                userSelect: 'none',
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                flexShrink: 0,
            }}
        >
            {skill.name}
        </motion.div>
    );
}

export default function CVBuilder() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [anti, setAnti] = useState(new Set());
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const cv = api.getUserCV();
        setSelected(new Set(cv.skills || []));
        setAnti(new Set(cv.antiSkills || []));
        api.getSkills().then(data => {
            setSkills(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const maxFreq = Math.max(...skills.map(s => s.frequency || 0), 1);

    const filtered = skills.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSkill = useCallback(name => {
        setAnti(a => { const n = new Set(a); n.delete(name); return n; });
        setSelected(s => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleAnti = useCallback(name => {
        setSelected(s => { const n = new Set(s); n.delete(name); return n; });
        setAnti(a => {
            const n = new Set(a);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const handleSave = async () => {
        await api.saveUserCV({ skills: [...selected], antiSkills: [...anti] });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div style={styles.wrapper}>
            {/* LEFT SIDEBAR */}
            <aside style={styles.sidebar}>
                <h3 style={styles.sidebarTitle}>Your Profile</h3>

                <div style={styles.sidebarSection}>
                    <p style={styles.sidebarLabel}>✅ Selected Skills <span style={styles.count}>{selected.size}</span></p>
                    <div style={styles.sidebarTags}>
                        {[...selected].map(s => (
                            <span key={s} style={{ ...styles.sidebarTag, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                                {s}
                            </span>
                        ))}
                        {selected.size === 0 && <p style={styles.emptyTip}>Click a bubble to add</p>}
                    </div>
                </div>

                <div style={styles.sidebarSection}>
                    <p style={styles.sidebarLabel}>🚫 Anti-Skills <span style={styles.count}>{anti.size}</span></p>
                    <div style={styles.sidebarTags}>
                        {[...anti].map(s => (
                            <span key={s} style={{ ...styles.sidebarTag, borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
                                {s}
                            </span>
                        ))}
                        {anti.size === 0 && <p style={styles.emptyTip}>Shift+Click or right-click to block</p>}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: 'auto' }}
                    onClick={handleSave}
                >
                    {saved ? '✓ Saved!' : 'Save Profile'}
                </button>
            </aside>

            {/* MAIN AREA */}
            <div style={styles.main}>
                <div style={styles.mainHeader}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skill Map</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>Click</span> to select ·{' '}
                            <span style={{ color: 'var(--accent-red)' }}>Shift+Click</span> or right-click to block
                        </p>
                    </div>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchPrompt}>❯</span>
                        <input
                            className="form-input"
                            placeholder="search skills..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={styles.loadingPlaceholder}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} style={{
                                ...styles.skeleton,
                                width: 60 + (i * 17) % 60,
                                height: 60 + (i * 17) % 60,
                                borderRadius: '50%',
                            }} />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence>
                        <motion.div style={styles.bubbleCloud} layout>
                            {filtered.map((skill, i) => (
                                <SkillBubble
                                    key={skill.name}
                                    skill={skill}
                                    idx={i}
                                    maxFreq={maxFreq}
                                    isSelected={selected.has(skill.name)}
                                    isAnti={anti.has(skill.name)}
                                    onLeft={() => toggleSkill(skill.name)}
                                    onRight={() => toggleAnti(skill.name)}
                                />
                            ))}
                            {filtered.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', padding: '2rem' }}>No skills found for "{search}"</p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
    },
    sidebar: {
        width: '280px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
    },
    sidebarTitle: {
        fontSize: '1rem',
        fontWeight: 700,
        marginBottom: '1.25rem',
        color: 'var(--text-primary)',
    },
    sidebarSection: {
        marginBottom: '1.5rem',
    },
    sidebarLabel: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
    },
    count: {
        background: 'var(--bg-elevated)',
        borderRadius: '999px',
        padding: '0 0.4rem',
        fontSize: '0.75rem',
        color: 'var(--text-primary)',
    },
    sidebarTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        minHeight: '32px',
    },
    sidebarTag: {
        fontSize: '0.75rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '999px',
        border: '1px solid',
        background: 'var(--bg-elevated)',
        fontWeight: 500,
    },
    emptyTip: {
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontStyle: 'italic',
    },
    main: {
        flex: 1,
        minWidth: 0,
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    mainHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0 0.75rem',
        flexShrink: 0,
    },
    searchPrompt: {
        color: 'var(--accent-cyan)',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: '220px',
        padding: '0.6rem 0',
    },
    bubbleCloud: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignContent: 'flex-start',
        padding: '0.5rem',
    },
    loadingPlaceholder: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.5rem',
    },
    skeleton: {
        background: 'var(--bg-elevated)',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
};
