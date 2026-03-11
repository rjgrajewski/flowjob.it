import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, auth } from '../services/api.js';
import { useSkills } from '../hooks/useSkills.js';
import SwipeSkillSelector from '../components/SwipeSkillSelector.jsx';

const TYPING_SKILLS = [
    'React', 'Python', 'AWS', 'Figma', 'TypeScript',
    'Node.js', 'Go', 'Docker', 'GraphQL', 'Kubernetes',
    'Java', 'C#', 'SQL', 'Rust', 'Vue.js'
];

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

function useTypingPlaceholder() {
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



export default function CVBuilder() {
    const isMobile = useIsMobile();
    const [interactionMode, setInteractionMode] = useState('select');
    const [selected, setSelected] = useState(new Set());
    const [highlighted, setHighlighted] = useState(new Set());
    const { skills, loading } = useSkills([...selected]);
    const [search, setSearch] = useState('');
    const [anti, setAnti] = useState(new Set());
    const selectedRef = useRef(new Set());
    const antiRef = useRef(new Set());

    // Keep refs in sync with state for use in toggle handlers
    useEffect(() => { selectedRef.current = selected; }, [selected]);
    useEffect(() => { antiRef.current = anti; }, [anti]);
    const [saved, setSaved] = useState('');
    const saveTimeout = useRef(null);
    const initialLoadDone = useRef(false);

    const placeholderText = useTypingPlaceholder();
    const containerRef = useRef(null);
    const sidebarRef = useRef(null);
    const selectedTagsRef = useRef(null);
    const antiTagsRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const user = auth.getUser();
            if (!user) return;
            const cv = await api.getUserCV(user.id);
            if (!mounted) return;
            setSelected(new Set(cv.skills || []));
            setAnti(new Set(cv.antiSkills || []));
            setHighlighted(new Set(cv.highlightedSkills || []));
            setTimeout(() => { if (mounted) initialLoadDone.current = true; }, 100);
        };
        load();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!initialLoadDone.current) return;
        const user = auth.getUser();
        if (!user) return;

        setSaved('Saving...');
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                const highlightedFiltered = [...highlighted].filter(s => selected.has(s));
                await api.saveUserCV(user.id, {
                    skills: [...selected],
                    antiSkills: [...anti],
                    highlightedSkills: highlightedFiltered
                });
                setSaved('Saved!');
                setTimeout(() => setSaved(''), 2500);
            } catch (e) {
                setSaved('Error saving');
            }
        }, 1000);
    }, [selected, anti, highlighted]);



    const maxFreq = useMemo(() => Math.max(...skills.map(s => s.frequency || 0), 1), [skills]);

    const sortedSkills = useMemo(() => {
        return [...skills]
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => (b.value.frequency || 0) - (a.value.frequency || 0) || a.sort - b.sort)
            .map(({ value }) => value);
    }, [skills]);

    // Exclude already-selected and anti skills from bubble map, replenishing with new skills
    const filtered = useMemo(() => {
        const availableSkills = sortedSkills.filter(s => !selected.has(s.name) && !anti.has(s.name));

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
    }, [sortedSkills, search, selected, anti, isMobile]);



    const toggleHighlighted = useCallback((name) => {
        setHighlighted(h => {
            const n = new Set(h);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleSkill = useCallback((name) => {
        const curAnti = antiRef.current;
        if (curAnti.has(name)) {
            setAnti(a => { const n = new Set(a); n.delete(name); return n; });
        }
        setSelected(s => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleAnti = useCallback((name) => {
        const curSelected = selectedRef.current;
        if (curSelected.has(name)) {
            setSelected(s => { const n = new Set(s); n.delete(name); return n; });
        }
        setAnti(a => {
            const n = new Set(a);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    // Keep highlighted a subset of selected (e.g. when user deselects a skill)
    useEffect(() => {
        setHighlighted(prev => {
            const next = new Set(prev);
            for (const x of next) {
                if (!selected.has(x)) next.delete(x);
            }
            return next;
        });
    }, [selected]);

    return (
        <div style={{ ...styles.wrapper, flexDirection: isMobile ? 'column' : 'row', overflowX: 'hidden' }}>

            {/* LEFT SIDEBAR - hidden on mobile */}
            {!isMobile && <aside ref={sidebarRef} style={{
                ...styles.sidebar,
                order: 1,
                width: '280px',
                height: 'calc(100vh - 64px)',
                position: 'sticky',
                top: '64px',
                borderRight: '1px solid var(--border)',
                gap: '0'
            }}>
                <h3 style={{ ...styles.sidebarTitle, display: isMobile ? 'none' : 'block' }}>Your Profile</h3>

                <div style={styles.sidebarSection}>
                    <div style={styles.sidebarLabel}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ✅ Selected Skills <span style={styles.count}>{selected.size}</span>
                            {highlighted.size > 0 && !isMobile && (
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.75rem' }}>
                                    · <span style={{ color: 'var(--accent-cyan)' }}>{highlighted.size} on CV</span>
                                </span>
                            )}
                        </span>
                        {selected.size > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05, color: 'var(--accent-red)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelected(new Set())}
                                style={styles.clearButton}
                            >
                                Clear
                            </motion.button>
                        )}
                    </div>
                    <div ref={selectedTagsRef} style={styles.sidebarTags}>
                        <AnimatePresence>
                            {[...selected].sort((a, b) => a.localeCompare(b)).map(s => (
                                <motion.span
                                    layout
                                    key={s}
                                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    style={{ ...styles.sidebarTag, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <span
                                        onClick={e => { e.stopPropagation(); toggleHighlighted(s); }}
                                        style={{ cursor: 'pointer', userSelect: 'none', fontSize: '1rem', lineHeight: 1 }}
                                        title={highlighted.has(s) ? 'Remove from CV' : 'Show on CV'}
                                    >
                                        {highlighted.has(s) ? '★' : '☆'}
                                    </span>
                                    <span onClick={() => toggleSkill(s)} style={{ flex: 1 }} title="Click to deselect">
                                        {s}
                                    </span>
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {selected.size === 0 && <p style={styles.emptyTip}>Click a bubble to add</p>}
                    </div>
                </div>

                <div style={styles.sidebarSection}>
                    <div style={styles.sidebarLabel}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🚫 Anti-Skills <span style={styles.count}>{anti.size}</span>
                        </span>
                        {anti.size > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05, color: 'var(--accent-red)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAnti(new Set())}
                                style={styles.clearButton}
                            >
                                Clear
                            </motion.button>
                        )}
                    </div>
                    <div ref={antiTagsRef} style={styles.sidebarTags}>
                        <AnimatePresence>
                            {[...anti].sort((a, b) => a.localeCompare(b)).map(s => (
                                <motion.span
                                    layout
                                    key={s}
                                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    style={{ ...styles.sidebarTag, borderColor: 'var(--accent-red)', color: 'var(--accent-red)', cursor: 'pointer' }}
                                    onClick={() => toggleAnti(s)}
                                    title="Click to unblock"
                                >
                                    {s}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {anti.size === 0 && <p style={styles.emptyTip}>Shift+Click or right-click to block</p>}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: saved === 'Saved!' ? 'var(--accent-cyan)' : saved.includes('Error') ? 'var(--accent-red)' : 'var(--text-secondary)'
                                }}
                            >
                                {saved === 'Saved!' ? '✓ ' : ''}{saved}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </aside>}

            {/* MAIN AREA */}
            <div style={{ ...styles.main, order: isMobile ? 1 : 2, padding: isMobile ? '0.5rem' : '1.5rem 2rem' }}>
                {/* Header + search: hidden on mobile */}
                {!isMobile && (
                    <div style={{ ...styles.mainHeader, flexDirection: 'row', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skill Map</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--accent-cyan)' }}>Click</span> to select ·{' '}
                                <span style={{ color: 'var(--accent-red)' }}>Shift+Click</span> to block
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: 'auto' }}>
                            <div style={{ ...styles.searchWrapper, width: '100%' }}>
                                <span style={styles.searchPrompt}>❯</span>
                                <input
                                    className="form-input"
                                    placeholder={search ? "" : placeholderText}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ ...styles.searchInput, width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ ...styles.bubbleCloudContainer, minHeight: isMobile ? 'calc(100vh - 80px)' : '640px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isMobile ? 'none' : '1px solid var(--border)', background: isMobile ? 'transparent' : 'var(--bg-surface)' }} ref={containerRef}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                            <div className="pulse" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                    ) : (
                        <SwipeSkillSelector
                            skills={filtered}
                            search={search}
                            isMobile={isMobile}
                            selected={selected}
                            anti={anti}
                            highlighted={highlighted}
                            onRemoveSelected={toggleSkill}
                            onRemoveAnti={toggleAnti}
                            onToggleHighlighted={toggleHighlighted}
                            onSwipeRight={toggleSkill}
                            onSwipeLeft={(name) => { /* Skipped handled internally */ }}
                            onSwipeUp={(name) => {
                                toggleSkill(name);
                                setHighlighted(h => {
                                    const next = new Set(h);
                                    next.add(name);
                                    return next;
                                });
                            }}
                            onSwipeDown={toggleAnti}
                        />
                    )}
                </div>
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
        justifyContent: 'space-between',
        gap: '0.4rem',
    },
    clearButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '0.7rem',
        fontWeight: 600,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'color 0.2s',
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
        display: 'inline-block',
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
        fontSize: '1.2rem',
        fontWeight: 800,
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: '280px',
        padding: '0.8rem 0',
        fontSize: '1.2rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    bubbleCloudContainer: {
        position: 'relative',
        flex: 1,
        width: '100%',
        minHeight: '600px',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
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
