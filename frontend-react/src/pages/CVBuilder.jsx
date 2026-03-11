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
    const { skills, loading } = useSkills([...selected]);
    const [bufferedDeck, setBufferedDeck] = useState([]);
    const [anti, setAnti] = useState(new Set());
    const [confirmedTutorials, setConfirmedTutorials] = useState([]);
    const [pendingAction, setPendingAction] = useState(null); // { direction, skillName }
    
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
            setConfirmedTutorials(cv.confirmedTutorials || []);
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
                    skipped_skills: [...skipped],
                    confirmedTutorials: confirmedTutorials
                });
                setSaved('Saved!');
                setTimeout(() => setSaved(''), 2500);
            } catch (e) {
                setSaved('Error saving');
            }
        }, 1000);
    }, [selected, anti, highlighted, confirmedTutorials, skipped]);



    // Intelligent Collaborative Sorting Buffer:
    // We want the background API to continually fetch optimal matching skills as the user swipes.
    // However, we MUST protect the top N cards that the user is currently looking at
    // from being unexpectedly swapped out while they are deciding.
    useEffect(() => {
        setBufferedDeck(currentDeck => {
            // 1. Identify valid cards currently in the buffer (protect top 2)
            const validCurrentBuffer = currentDeck
                .filter(s => 
                    !selected.has(s.name) && 
                    !anti.has(s.name) && 
                    !skipped.has(s.name) &&
                    (!pendingAction || pendingAction.skillName !== s.name)
                )
                .slice(0, 2);
            
            // 2. Identify names of the protected cards
            const bufferNames = new Set(validCurrentBuffer.map(s => s.name));
            
            // 3. Filter the new API skills to exclude already processed AND already buffered cards
            const newFilteredSkills = skills.filter(s => 
                !selected.has(s.name) && 
                !anti.has(s.name) && 
                !skipped.has(s.name) && 
                !bufferNames.has(s.name) &&
                (!pendingAction || pendingAction.skillName !== s.name)
            );
            
            // 4. Combine safe buffer with new collaborative suggestions
            return [...validCurrentBuffer, ...newFilteredSkills];
        });
    }, [skills, selected, anti, skipped, pendingAction]);



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

    const applyAction = useCallback((direction, name) => {
        if (direction === 'right') toggleSkill(name);
        else if (direction === 'left') toggleSkipped(name);
        else if (direction === 'up') {
            toggleSkill(name);
            setHighlighted(h => {
                const next = new Set(h);
                next.add(name);
                return next;
            });
        }
        else if (direction === 'down') toggleAnti(name);
    }, [toggleSkill, toggleSkipped, toggleAnti]);

    const handleSwipe = useCallback((direction, name) => {
        if (confirmedTutorials.includes(direction)) {
            applyAction(direction, name);
        } else {
            setPendingAction({ direction, skillName: name });
        }
    }, [confirmedTutorials, applyAction]);

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
            <AnimatePresence>
                {pendingAction && (
                    <ConfirmationModal
                        action={pendingAction}
                        onConfirm={(dontShowAgain) => {
                            if (dontShowAgain) {
                                setConfirmedTutorials(prev => [...prev, pendingAction.direction]);
                            }
                            applyAction(pendingAction.direction, pendingAction.skillName);
                            setPendingAction(null);
                        }}
                        onUndo={() => {
                            // If frequency is available in original data, we should try to keep it.
                            // But for now we just put back the name.
                            const name = pendingAction.skillName;
                            setBufferedDeck(prev => [{ name, frequency: 0 }, ...prev]);
                            setPendingAction(null);
                        }}
                    />
                )}
            </AnimatePresence>
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
                            skills={bufferedDeck}
                            isMobile={isMobile}
                            selected={selected}
                            anti={anti}
                            highlighted={highlighted}
                            skipped={skipped}
                            onRemoveSelected={toggleSkill}
                            onRemoveAnti={toggleAnti}
                            onRemoveSkipped={removeSkipped}
                            onToggleHighlighted={toggleHighlighted}
                            onSwipeRight={(name) => handleSwipe('right', name)}
                            onSwipeLeft={(name) => handleSwipe('left', name)}
                            onSwipeUp={(name) => handleSwipe('up', name)}
                            onSwipeDown={(name) => handleSwipe('down', name)}
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

function ConfirmationModal({ action, onConfirm, onUndo }) {
    const [dontShowAgain, setDontShowAgain] = useState(false);
    
    const configs = {
        up: { label: 'Show off', color: '#00e676', icon: '★', desc: 'Added to your visible CV & strongly improves job matches.' },
        right: { label: 'Got it', color: 'var(--accent-cyan)', icon: '✓', desc: 'Improves job matches (but remains hidden from your CV).' },
        down: { label: 'Avoid', color: 'var(--accent-red)', icon: '🚫', desc: 'Blocks this skill. Hides job requirements related to it.' },
        left: { label: 'Skip', color: '#888', icon: '✕', desc: 'Skips for now without affecting your jobs or CV.' }
    };
    
    const config = configs[action.direction];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1.5rem'
            }}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{
                    background: 'var(--bg-elevated)',
                    width: '100%', maxWidth: '400px',
                    borderRadius: '24px',
                    padding: '2rem',
                    border: `1px solid ${config.color}`,
                    boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 20px ${config.color}22`,
                    textAlign: 'center'
                }}
            >
                <div style={{ 
                    fontSize: '3rem', marginBottom: '1rem', 
                    color: config.color, filter: `drop-shadow(0 0 10px ${config.color}44)` 
                }}>
                    {config.icon}
                </div>
                
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{config.label}</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                    {config.desc}
                </p>

                <div 
                    onClick={() => setDontShowAgain(!dontShowAgain)}
                    style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer' 
                    }}
                >
                    <div style={{ 
                        width: '20px', height: '20px', borderRadius: '4px',
                        border: '2px solid var(--border)',
                        background: dontShowAgain ? config.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}>
                        {dontShowAgain && <span style={{ color: '#000', fontSize: '12px', fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Don't show again</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        onClick={onUndo}
                        style={{ 
                            flex: 1, padding: '1rem', borderRadius: '14px',
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Undo
                    </button>
                    <button 
                        onClick={() => onConfirm(dontShowAgain)}
                        style={{ 
                            flex: 2, padding: '1rem', borderRadius: '14px',
                            background: config.color, border: 'none',
                            color: '#000', fontWeight: 700, cursor: 'pointer',
                            boxShadow: `0 5px 15px ${config.color}44`
                        }}
                    >
                        OK
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
