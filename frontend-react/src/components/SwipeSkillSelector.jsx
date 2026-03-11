import React, { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

const SwipeCard = ({ skill, index, onSwipe, frontCard, exitDirection }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);

    // Opacities for overlays based on drag distances
    const rightOpacity = useTransform(x, [30, 120], [0, 1]);
    const leftOpacity = useTransform(x, [-30, -120], [0, 1]);
    const downOpacity = useTransform(y, [30, 120], [0, 1]);
    const upOpacity = useTransform(y, [-30, -120], [0, 1]);

    const handleDragEnd = (event, info) => {
        const offset = info.offset;
        const velocity = info.velocity;
        
        const dragX = offset.x;
        const dragY = offset.y;
        
        const absX = Math.abs(dragX);
        const absY = Math.abs(dragY);
        
        const threshold = 100;
        const velocityThreshold = 500;
        
        let direction = null;
        
        if (absX > absY) {
            if (dragX > threshold || velocity.x > velocityThreshold) direction = 'right';
            else if (dragX < -threshold || velocity.x < -velocityThreshold) direction = 'left';
        } else {
            if (dragY > threshold || velocity.y > velocityThreshold) direction = 'down';
            else if (dragY < -threshold || velocity.y < -velocityThreshold) direction = 'up';
        }

        if (direction) {
            onSwipe(direction, skill.name);
        }
    };

    const exitAnimations = {
        left: { x: -400, opacity: 0, rotate: -20, transition: { duration: 0.3 } },
        right: { x: 400, opacity: 0, rotate: 20, transition: { duration: 0.3 } },
        up: { y: -400, opacity: 0, transition: { duration: 0.3 } },
        down: { y: 400, opacity: 0, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                zIndex: 100 - index,
            }}
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1 - index * 0.05, y: index * 15, opacity: 1 }}
            exit={exitDirection ? exitAnimations[exitDirection] : { opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <motion.div
                style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-elevated)',
                    borderRadius: '24px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    x, y, rotate,
                    cursor: frontCard ? 'grab' : 'auto',
                }}
                drag={frontCard}
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.8}
                onDragEnd={frontCard ? handleDragEnd : undefined}
                whileTap={frontCard ? { cursor: 'grabbing' } : undefined}
            >
                <div style={{ textAlign: 'center', padding: '1.5rem', zIndex: 10 }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, overflowWrap: 'break-word', wordBreak: 'break-word', margin: 0 }}>
                        {skill.name}
                    </h2>
                    {skill.frequency > 0 && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
                            Mentioned in {skill.frequency} jobs
                        </p>
                    )}
                </div>

                {/* Overlays */}
                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, transparent, rgba(0,229,255,0.2))', border: '5px solid var(--accent-cyan)', opacity: rightOpacity, borderRadius: '20px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '0.5rem 1.5rem', border: '4px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontSize: '2rem', fontWeight: 800, borderRadius: '12px', transform: 'rotate(-15deg)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>KNOW</div>
                </motion.div>

                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top left, transparent, rgba(150,150,150,0.2))', border: '5px solid #888', opacity: leftOpacity, borderRadius: '20px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '0.5rem 1.5rem', border: '4px solid #888', color: '#888', fontSize: '2rem', fontWeight: 800, borderRadius: '12px', transform: 'rotate(15deg)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>SKIP</div>
                </motion.div>

                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(255,83,112,0.2))', border: '5px solid var(--accent-red)', opacity: downOpacity, borderRadius: '20px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '0.5rem 1.5rem', border: '4px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '1.8rem', fontWeight: 800, borderRadius: '12px', transform: 'translateY(50px)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>DON'T KNOW</div>
                </motion.div>

                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(0,230,118,0.2))', border: '5px solid #00e676', opacity: upOpacity, borderRadius: '20px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ padding: '0.5rem 1.5rem', border: '4px solid #00e676', color: '#00e676', fontSize: '1.8rem', fontWeight: 800, borderRadius: '12px', transform: 'translateY(-50px)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>MUST HAVE</div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

// --- Category Badge ---
function CategoryBadge({ color, icon, count, label, onClick }) {
    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                borderRadius: '999px',
                border: `1.5px solid ${color}`,
                background: 'var(--bg-elevated)',
                color: color,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
            }}
            title={label}
        >
            <span style={{ fontSize: '0.75rem' }}>{icon}</span>
            <span>{count}</span>
        </motion.button>
    );
}

// --- Skills Modal ---
function SkillsModal({ title, color, icon, skills, onRemove, onClose }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: '0',
            }}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%', maxHeight: '75vh',
                    background: 'var(--bg-surface)',
                    borderTop: `3px solid ${color}`,
                    borderRadius: '20px 20px 0 0',
                    padding: '1.25rem',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Handle bar */}
                <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto 1rem' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                        {icon} {title}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({skills.length})</span>
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer', padding: '0.25rem' }}
                    >✕</button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {skills.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                            No skills yet
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {skills.sort((a, b) => a.localeCompare(b)).map(name => (
                                <motion.span
                                    key={name}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    style={{
                                        fontSize: '0.8rem', padding: '0.3rem 0.6rem',
                                        borderRadius: '999px', border: `1px solid ${color}`,
                                        background: 'var(--bg-elevated)', color,
                                        cursor: onRemove ? 'pointer' : 'default',
                                        fontWeight: 500,
                                    }}
                                    onClick={() => onRemove && onRemove(name)}
                                    title={onRemove ? 'Tap to remove' : ''}
                                >
                                    {name} {onRemove && <span style={{ opacity: 0.5 }}>✕</span>}
                                </motion.span>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

export default function SwipeSkillSelector({
    skills, onSwipeRight, onSwipeLeft, onSwipeDown, onSwipeUp, search,
    isMobile, selected, anti, highlighted, skipped,
    onRemoveSelected, onRemoveAnti, onRemoveSkipped, onToggleHighlighted,
}) {
    const [localSkipped, setLocalSkipped] = useState(new Set());
    const [exitDirections, setExitDirections] = useState({});
    const [modalCategory, setModalCategory] = useState(null);

    useEffect(() => {
        if (search) setLocalSkipped(new Set());
    }, [search]);

    const visibleSkills = skills.filter(s => !localSkipped.has(s.name)).slice(0, 4);

    const handleSwipe = useCallback((direction, skillName) => {
        setExitDirections(prev => ({ ...prev, [skillName]: direction }));
        setLocalSkipped(prev => new Set(prev).add(skillName));

        setTimeout(() => {
            if (direction === 'left') {
                if (onSwipeLeft) onSwipeLeft(skillName);
            } else if (direction === 'right') {
                if (onSwipeRight) onSwipeRight(skillName);
            } else if (direction === 'up') {
                if (onSwipeUp) onSwipeUp(skillName);
            } else if (direction === 'down') {
                if (onSwipeDown) onSwipeDown(skillName);
            }
        }, 200);
    }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!visibleSkills.length) return;
            const topSkill = visibleSkills[0].name;

            if (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input') return;
            
            if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === 'ArrowRight') handleSwipe('right', topSkill);
            else if (e.key === 'ArrowLeft') handleSwipe('left', topSkill);
            else if (e.key === 'ArrowUp') handleSwipe('up', topSkill);
            else if (e.key === 'ArrowDown') handleSwipe('down', topSkill);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visibleSkills, handleSwipe]);

    // Derive counts for badges
    const knowCount = selected ? selected.size - (highlighted ? highlighted.size : 0) : 0;
    const mustHaveCount = highlighted ? highlighted.size : 0;
    const blockCount = anti ? anti.size : 0;
    const skipCount = skipped ? skipped.size : 0;

    // Category config for modal
    const categories = {
        know: {
            title: 'Know', color: 'var(--accent-cyan)', icon: '✓',
            skills: selected && highlighted ? [...selected].filter(s => !highlighted.has(s)) : [],
            onRemove: onRemoveSelected,
        },
        mustHave: {
            title: 'Must Have', color: '#00e676', icon: '★',
            skills: highlighted ? [...highlighted] : [],
            onRemove: (name) => { if (onToggleHighlighted) onToggleHighlighted(name); },
        },
        block: {
            title: 'Blocked', color: 'var(--accent-red)', icon: '🚫',
            skills: anti ? [...anti] : [],
            onRemove: onRemoveAnti,
        },
        skip: {
            title: 'Skipped', color: '#888', icon: '✕',
            skills: skipped ? [...skipped] : [],
            onRemove: onRemoveSkipped,
        },
    };

    if (!skills || skills.length === 0 || visibleSkills.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', gap: '1.5rem' }}>
                <span>{search ? `No skills found for "${search}"` : 'All caught up!'}</span>
                {isMobile && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <CategoryBadge color="var(--accent-cyan)" icon="✓" count={Math.max(0, knowCount)} label="Know" onClick={() => setModalCategory('know')} />
                        <CategoryBadge color="#888" icon="✕" count={Math.max(0, skipCount)} label="Skip" onClick={() => setModalCategory('skip')} />
                        <CategoryBadge color="var(--accent-red)" icon="↓" count={blockCount} label="Block" onClick={() => setModalCategory('block')} />
                        <CategoryBadge color="#00e676" icon="★" count={mustHaveCount} label="Must Have" onClick={() => setModalCategory('mustHave')} />
                    </div>
                )}
                {modalCategory && categories[modalCategory] && (
                    <SkillsModal
                        {...categories[modalCategory]}
                        onClose={() => setModalCategory(null)}
                    />
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', overflow: 'hidden', padding: '1rem' }}>
            <div style={{ position: 'relative', width: '320px', height: isMobile ? '360px' : '420px', maxWidth: '100%' }}>
                <AnimatePresence>
                    {visibleSkills.map((skill, i) => (
                        <SwipeCard 
                            key={skill.name}
                            skill={skill}
                            index={i}
                            frontCard={i === 0}
                            onSwipe={handleSwipe}
                            exitDirection={exitDirections[skill.name]}
                        />
                    ))}
                </AnimatePresence>
            </div>
            
            {/* Desktop: action buttons + legend */}
            {!isMobile && (
                <>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 15 }}>
                        <IconButton color="#888" icon="✕" label="Skip" onClick={() => visibleSkills.length && handleSwipe('left', visibleSkills[0].name)} />
                        <IconButton color="var(--accent-red)" icon="↓" label="Block" onClick={() => visibleSkills.length && handleSwipe('down', visibleSkills[0].name)} />
                        <IconButton color="#00e676" icon="↑" label="Star" onClick={() => visibleSkills.length && handleSwipe('up', visibleSkills[0].name)} />
                        <IconButton color="var(--accent-cyan)" icon="✓" label="Know" onClick={() => visibleSkills.length && handleSwipe('right', visibleSkills[0].name)} />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1.5rem', textAlign: 'center', opacity: 0.7 }}>
                        {visibleSkills.length > 0 && <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{skills.length - localSkipped.size}</span>}{' '}
                        skills remaining · Use <strong>arrow keys</strong> or swipe
                    </p>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '0.4rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center', opacity: 0.5 }}>
                        <span>→ Know</span>
                        <span>← Skip</span>
                        <span>↓ Block</span>
                        <span>↑ Must Have</span>
                    </div>
                </>
            )}

            {/* Mobile: 4 category badges */}
            {isMobile && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 15 }}>
                    <CategoryBadge color="var(--accent-cyan)" icon="✓" count={Math.max(0, knowCount)} label="Know" onClick={() => setModalCategory('know')} />
                    <CategoryBadge color="#888" icon="✕" count={Math.max(0, skipCount)} label="Skip" onClick={() => setModalCategory('skip')} />
                    <CategoryBadge color="var(--accent-red)" icon="↓" count={blockCount} label="Block" onClick={() => setModalCategory('block')} />
                    <CategoryBadge color="#00e676" icon="★" count={mustHaveCount} label="Must Have" onClick={() => setModalCategory('mustHave')} />
                </div>
            )}

            {/* Modal */}
            {modalCategory && categories[modalCategory] && (
                <SkillsModal
                    {...categories[modalCategory]}
                    onClose={() => setModalCategory(null)}
                />
            )}
        </div>
    );
}

function IconButton({ color, icon, label, onClick }) {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            style={{
                width: '56px', height: '56px',
                borderRadius: '50%',
                border: `2px solid ${color}`,
                background: 'transparent',
                color: color,
                fontSize: '1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: `0 0 15px ${color}33`,
            }}
            title={label}
        >
            {icon}
        </motion.button>
    );
}
