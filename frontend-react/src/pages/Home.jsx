import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';
import { symbols } from './Home.constants';

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.2 }
    }
};

const FloatingSymbol = ({ icon: Icon, color, delay = 0, size = 30, initialPos = { left: '0%', top: '0%' } }) => {
    const randomX = useMemo(() => Math.random() * 100 - 50, []);
    const randomY = useMemo(() => -150 - Math.random() * 100, []);
    const randomDuration = useMemo(() => 15 + Math.random() * 10, []);

    return (
        <motion.div
            style={{
                position: 'absolute',
                width: size,
                height: size,
                color: color,
                opacity: 0,
                zIndex: 1,
                ...initialPos
            }}
            animate={{
                opacity: [0, 0.4, 0.4, 0],
                scale: [0.5, 1, 1, 0.5],
                x: [0, randomX],
                y: [0, randomY],
            }}
            transition={{
                duration: randomDuration,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
            }}
        >
            <Icon />
        </motion.div>
    );
};

export default function Home() {
    return (
        <div className="page" style={{ overflowX: 'hidden', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '2rem 1rem' }}>
                <div className="hero-glow" />
                {symbols.map((sym, i) => (
                    <FloatingSymbol key={i} {...sym} />
                ))}

                <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%' }}>
                    <motion.div
                        initial="hidden" animate="show" variants={staggerContainer}
                        style={{ maxWidth: '1000px', margin: '0 auto' }}
                    >
                        <motion.div variants={fadeUp} style={{ marginBottom: '1rem' }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '0.4rem 1rem',
                                background: 'rgba(0, 229, 255, 0.1)',
                                color: 'var(--accent-cyan)',
                                borderRadius: 'var(--radius-pill)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(0, 229, 255, 0.2)'
                            }}>
                                Next-Gen Tech Hiring Platform
                            </span>
                        </motion.div>

                        <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2.5rem' }}>
                            Jobs that <span className="gradient-text">match</span> your skills
                        </motion.h1>

                        <motion.p variants={fadeUp} style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2.5rem auto', lineHeight: 1.5 }}>
                            No keyword guessing. No endless scrolling.<br />
                            Flowjob matches your skills to real market demand.
                        </motion.p>

                        {/* THREE STEPS */}
                        <motion.div variants={staggerContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'left', marginBottom: '4rem' }}>
                            {[
                                { step: '1', title: 'Pick your skills', desc: 'Select what you know and what you want to avoid.' },
                                { step: '2', title: 'Find your next job', desc: 'Search through the openings with best match score.' },
                                { step: '3', title: 'Customize your CV', desc: 'You can quickly decide what you want to highlight and what to hide.' }
                            ].map((item, i) => (
                                <motion.div key={i} variants={fadeUp} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '20px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease, border-color 0.3s ease' }} whileHover={{ y: -5, borderColor: 'var(--accent-cyan)' }}>
                                    <div style={{ position: 'absolute', top: '-10px', right: '5px', fontSize: '6rem', fontWeight: 900, color: 'var(--bg-default)', opacity: 0.8, lineHeight: 1, zIndex: 0 }}>
                                        {item.step}
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)', position: 'relative', zIndex: 1, paddingRight: '2.5rem' }}>{item.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, position: 'relative', zIndex: 1, fontSize: '0.95rem', margin: 0, paddingRight: '2.5rem' }}>{item.desc}</p>
                                </motion.div>
                            ))}
                        </motion.div>

                        <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Link to="/get-started" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: 'var(--radius-pill)', boxShadow: '0 10px 30px rgba(0, 229, 255, 0.25)' }}>
                                Find matching jobs in 5 minutes →
                            </Link>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Oh, and it's free. Like, truly free.
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 0', background: 'var(--bg-default)', zIndex: 10 }}>
                <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <Link to="/story" style={{
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        transition: 'all 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }} onMouseOver={e => { e.target.style.borderColor = 'var(--accent-cyan)'; e.target.style.color = 'var(--accent-cyan)' }} onMouseOut={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-primary)' }}>
                        Read the Story →
                    </Link>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>
                        © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>. <span style={{ opacity: 0.6 }}>Built by Rafal Grajewski.</span>
                    </p>
                </div>
            </footer>
        </div>
    );
}
