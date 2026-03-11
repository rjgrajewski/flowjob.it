import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, auth } from '../services/api.js';
import { useSkills } from '../hooks/useSkills.js';
import SwipeSkillSelector from '../components/SwipeSkillSelector.jsx';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}


export default function CVBuilder() {
    const isMobile = useIsMobile();
    const [selected, setSelected] = useState(new Set());
    const [highlighted, setHighlighted] = useState(new Set());
    const [skipped, setSkipped] = useState(new Set());
    const [cvLoaded, setCvLoaded] = useState(false);
    
    // Only capture selected skills once when CV the finishes loading
    // to prevent the deck from constantly reshuffling on every swipe.
    const initialSelected = useMemo(() => {
        return cvLoaded ? [...selected] : [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cvLoaded]);
    
    const { skills, loading } = useSkills(initialSelected);
    const [anti, setAnti] = useState(new Set());
    
    const selectedRef = useRef(new Set());
    const antiRef = useRef(new Set());
    const skippedRef = useRef(new Set());

    // Keep refs in sync with state for use in toggle handlers
    useEffect(() => { selectedRef.current = selected; }, [selected]);
    useEffect(() => { antiRef.current = anti; }, [anti]);
    useEffect(() => { skippedRef.current = skipped; }, [skipped]);
    
    const [saved, setSaved] = useState('');
    const saveTimeout = useRef(null);
    const initialLoadDone = useRef(false);

    const containerRef = useRef(null);

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
            setSkipped(new Set(cv.skippedSkills || []));
            setCvLoaded(true);
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
                    highlightedSkills: highlightedFiltered,
                    skippedSkills: [...skipped]
                });
                setSaved('Saved!');
                setTimeout(() => setSaved(''), 2500);
            } catch (e) {
                setSaved('Error saving');
            }
        }, 1000);
    }, [selected, anti, highlighted]);



    // Exclude already-selected, anti, and skipped skills from deck
    const filtered = useMemo(() => {
        return skills.filter(s => !selected.has(s.name) && !anti.has(s.name) && !skipped.has(s.name));
    }, [skills, selected, anti, skipped]);



    const toggleHighlighted = useCallback((name) => {
        setHighlighted(h => {
            const n = new Set(h);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleSkill = useCallback((name) => {
        const curAnti = antiRef.current;
        const curSkipped = skippedRef.current;
        if (curAnti.has(name)) {
            setAnti(a => { const n = new Set(a); n.delete(name); return n; });
        }
        if (curSkipped.has(name)) {
            setSkipped(s => { const n = new Set(s); n.delete(name); return n; });
        }
        setSelected(s => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleAnti = useCallback((name) => {
        const curSelected = selectedRef.current;
        const curSkipped = skippedRef.current;
        if (curSelected.has(name)) {
            setSelected(s => { const n = new Set(s); n.delete(name); return n; });
        }
        if (curSkipped.has(name)) {
            setSkipped(s => { const n = new Set(s); n.delete(name); return n; });
        }
        setAnti(a => {
            const n = new Set(a);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const toggleSkipped = useCallback((name) => {
        const curSelected = selectedRef.current;
        const curAnti = antiRef.current;
        if (curSelected.has(name)) {
            setSelected(s => { const n = new Set(s); n.delete(name); return n; });
        }
        if (curAnti.has(name)) {
            setAnti(a => { const n = new Set(a); n.delete(name); return n; });
        }
        setSkipped(s => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, []);

    const removeSkipped = useCallback((name) => {
        setSkipped(s => { const n = new Set(s); n.delete(name); return n; });
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
        <div style={{ ...styles.wrapper, flexDirection: 'column', overflowX: 'hidden' }}>
            {/* MAIN AREA */}
            <div style={{ ...styles.main, padding: isMobile ? '0.5rem' : '1.5rem 2rem' }}>
                
                {/* Save Indicator */}
                <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', zIndex: 50 }}>
                    <AnimatePresence>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    background: 'var(--bg-elevated)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '999px',
                                    border: '1px solid var(--border)',
                                    color: saved === 'Saved!' ? 'var(--accent-cyan)' : saved.includes('Error') ? 'var(--accent-red)' : 'var(--text-secondary)'
                                }}
                            >
                                {saved === 'Saved!' ? '✓ ' : ''}{saved}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* Header: hidden on mobile */}
                {!isMobile && (
                    <div style={{ ...styles.mainHeader, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skill Map</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Swipe cards or use <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>arrow keys</span> to organize your skills
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 150px)', width: '100%' }} ref={containerRef}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                            <div className="pulse" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                    ) : (
                        <SwipeSkillSelector
                            skills={filtered}
                            isMobile={isMobile}
                            selected={selected}
                            anti={anti}
                            highlighted={highlighted}
                            skipped={skipped}
                            onRemoveSelected={toggleSkill}
                            onRemoveAnti={toggleAnti}
                            onRemoveSkipped={removeSkipped}
                            onToggleHighlighted={toggleHighlighted}
                            onSwipeRight={toggleSkill}
                            onSwipeLeft={toggleSkipped}
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
    mainHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
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
