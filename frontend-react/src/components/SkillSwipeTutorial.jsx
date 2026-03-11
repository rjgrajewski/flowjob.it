import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

export default function SkillSwipeTutorial() {
    const [isVisible, setIsVisible] = useState(false);
    const [dontShowAgain, setDontShowAgain] = useState(false);
    const [direction, setDirection] = useState('null');

    useEffect(() => {
        const hasSeen = localStorage.getItem('flowjob_skills_tutorial_done');
        if (!hasSeen) {
            const timer = setTimeout(() => setIsVisible(true), 300);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem('flowjob_skills_tutorial_done', 'true');
        }
        setIsVisible(false);
    };

    // Motion values for the interactive sandbox card
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate = useTransform(x, [-150, 150], [-15, 15]);

    // Opacities for the overlays purely based on drag distance
    const rightOpacity = useTransform(x, [20, 80], [0, 1]);
    const leftOpacity = useTransform(x, [-20, -80], [0, 1]);
    const downOpacity = useTransform(y, [20, 80], [0, 1]);
    const upOpacity = useTransform(y, [-20, -80], [0, 1]);

    // Track direction state for the text explanation below
    useEffect(() => {
        const updateDirection = () => {
            const cx = x.get();
            const cy = y.get();
            const absX = Math.abs(cx);
            const absY = Math.abs(cy);
            const threshold = 25;

            if (absX < threshold && absY < threshold) {
                setDirection('null');
                return;
            }

            let newDir = 'null';
            if (absX > absY) {
                newDir = cx > 0 ? 'right' : 'left';
            } else {
                newDir = cy > 0 ? 'down' : 'up';
            }
            setDirection(newDir);
        };

        const unsubX = x.on('change', updateDirection);
        const unsubY = y.on('change', updateDirection);

        return () => {
            unsubX();
            unsubY();
        };
    }, [x, y]);

    const tutorials = {
        up: { icon: '★', label: 'Must Have', color: '#00e676', desc: 'Added to your visible CV & strongly improves job matches.' },
        right: { icon: '✓', label: 'Know', color: 'var(--accent-cyan)', desc: 'Improves job matches (but remains hidden from your CV).' },
        down: { icon: '🚫', label: "Don't Know", color: 'var(--accent-red)', desc: 'Blocks this skill. Hides job requirements related to it.' },
        left: { icon: '✕', label: 'Skipped', color: '#888', desc: 'Skips for now without affecting your jobs or CV.' },
        'null': { icon: '👆', label: 'Play with the card!', color: 'var(--text-primary)', desc: 'Drag the card in any direction to see how it works.' }
    };

    const currentInfo = tutorials[direction];

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            borderRadius: '24px',
                            padding: '1.5rem 1.5rem 1.5rem 1.5rem',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                            Interactive Tutorial 💡
                        </h2>
                        
                        {/* The Sandbox Area */}
                        <div style={{
                            width: '100%',
                            height: '240px',
                            background: 'var(--bg-elevated)',
                            borderRadius: '16px',
                            border: '2px dashed var(--border)',
                            margin: '1rem 0',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {/* The Draggable Dummy Card */}
                            <motion.div
                                drag
                                dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                                dragElastic={0.8}
                                whileTap={{ cursor: 'grabbing', scale: 1.05 }}
                                style={{
                                    x, y, rotate,
                                    width: '140px',
                                    height: '180px',
                                    background: 'var(--bg-surface)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'grab',
                                    zIndex: 10,
                                    position: 'relative'
                                }}
                            >
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Python</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0 0' }}>120 jobs</p>

                                {/* Dummy Overlays */}
                                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top right, transparent, rgba(0,229,255,0.2))', border: '4px solid var(--accent-cyan)', opacity: rightOpacity, borderRadius: '14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ padding: '0.3rem 0.8rem', border: '3px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontSize: '1.3rem', fontWeight: 800, borderRadius: '10px', transform: 'rotate(-15deg)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>KNOW</div>
                                </motion.div>

                                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top left, transparent, rgba(150,150,150,0.2))', border: '4px solid #888', opacity: leftOpacity, borderRadius: '14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ padding: '0.3rem 0.8rem', border: '3px solid #888', color: '#888', fontSize: '1.3rem', fontWeight: 800, borderRadius: '10px', transform: 'rotate(15deg)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>SKIP</div>
                                </motion.div>

                                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(255,83,112,0.2))', border: '4px solid var(--accent-red)', opacity: downOpacity, borderRadius: '14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ padding: '0.3rem 0.8rem', border: '3px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '1.2rem', fontWeight: 800, borderRadius: '10px', transform: 'translateY(30px)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>DON'T KNOW</div>
                                </motion.div>

                                <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, transparent, rgba(0,230,118,0.2))', border: '4px solid #00e676', opacity: upOpacity, borderRadius: '14px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ padding: '0.3rem 0.8rem', border: '3px solid #00e676', color: '#00e676', fontSize: '1.2rem', fontWeight: 800, borderRadius: '10px', transform: 'translateY(-30px)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>MUST HAVE</div>
                                </motion.div>

                            </motion.div>
                        </div>

                        {/* Instructional Feedback Text */}
                        <div style={{ minHeight: '80px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentInfo.label}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <h4 style={{ color: currentInfo.color, fontSize: '1.2rem', margin: '0 0 0.3rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 800 }}>
                                        {currentInfo.label !== 'Play with the card!' && <span style={{ fontSize: '1.2rem' }}>{currentInfo.icon}</span>}
                                        {currentInfo.label}
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.4 }}>
                                        {currentInfo.desc}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Controls */}
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                                />
                                Don't show again
                            </label>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleClose}
                                style={{
                                    background: currentInfo.label !== 'Play with the card!' ? currentInfo.color : 'var(--accent-cyan)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.6rem 1.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 12px ${currentInfo.label !== 'Play with the card!' ? currentInfo.color : 'var(--accent-cyan)'}4d`,
                                    transition: 'background 0.2s'
                                }}
                            >
                                Got it!
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
