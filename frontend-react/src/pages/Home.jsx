import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroImg from '../assets/hero_illustration.png';
import cvImg from '../assets/cv_illustration.png';
import jobsImg from '../assets/jobs_illustration.png';

const features = [
    {
        icon: '◈',
        title: 'Skill Map',
        description: 'Explore hundreds of tech skills. Click to select, shift+click to block. Build your profile visually.',
        accent: 'var(--accent-cyan)',
    },
    {
        icon: '⟳',
        title: 'Job Match',
        description: 'We score every job offer against your skill set in real time. See exactly how well you fit.',
        accent: 'var(--accent-violet)',
    },
    {
        icon: '⬡',
        title: 'Anti-Skills',
        description: 'Block technologies you never want to work with. No more Rails jobs when you\'re a Go dev.',
        accent: 'var(--accent-amber)',
    },
];

const stats = [
    { value: '12k+', label: 'Job Offers' },
    { value: '500+', label: 'Tech Skills' },
    { value: '98%', label: 'Match Accuracy' },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.12, duration: 0.5 } }),
};

export default function Home() {
    return (
        <div>
            {/* ===== HERO ===== */}
            <section style={styles.hero}>
                <div className="container" style={styles.heroInner}>
                    <motion.div
                        style={styles.heroLeft}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div style={styles.heroBadge}>
                            <span style={styles.heroBadgeDot} />
                            Built for tech professionals
                        </div>
                        <h1 style={styles.heroHeading}>
                            Find your <span className="gradient-text">flow</span>
                            <br />in tech careers
                        </h1>
                        <p style={styles.heroSub}>
                            Map your skills, block what you hate, and get matched with jobs that
                            actually fit you — not the other way around.
                        </p>
                        <div style={styles.heroCtas}>
                            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}>
                                Get Started →
                            </Link>
                            <Link to="/jobs" className="btn btn-ghost" style={{ fontSize: '1rem', padding: '0.8rem 1.5rem' }}>
                                Browse Offers
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        style={styles.heroRight}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <div style={styles.heroImgWrapper}>
                            <img src={heroImg} alt="flowjob illustration" style={styles.heroImg} />
                            <div style={styles.heroGlow} />
                        </div>
                    </motion.div>
                </div>

                {/* Stats row */}
                <div className="container">
                    <div style={styles.statsRow}>
                        {stats.map((s, i) => (
                            <motion.div
                                key={i}
                                style={styles.statItem}
                                custom={i}
                                initial="hidden"
                                animate="show"
                                variants={fadeUp}
                            >
                                <span style={styles.statValue}>{s.value}</span>
                                <span style={styles.statLabel}>{s.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES ===== */}
            <section className="section">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        style={{ textAlign: 'center', marginBottom: '3rem' }}
                    >
                        <h2>Everything you need to <span className="gradient-text">land the right role</span></h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
                            flowjob is designed around how developers actually think about what they want to work on.
                        </p>
                    </motion.div>

                    <div style={styles.featuresGrid}>
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                className="card"
                                style={{ ...styles.featureCard, borderTopColor: f.accent }}
                                custom={i}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <div style={{ ...styles.featureIcon, color: f.accent }}>{f.icon}</div>
                                <h3 style={styles.featureTitle}>{f.title}</h3>
                                <p style={styles.featureDesc}>{f.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SPLIT SECTIONS ===== */}
            <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ ...styles.split, flexDirection: 'row' }}>
                        <div style={styles.splitImg}>
                            <img src={cvImg} alt="Skill map" style={styles.splitImgEl} />
                        </div>
                        <motion.div
                            style={styles.splitText}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <p style={styles.splitLabel}>Skill Profiling</p>
                            <h2>Build your skill graph, <span className="gradient-text">not just a resume</span></h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.7 }}>
                                Navigate a visual bubble cloud of hundreds of tech skills. Select what you know,
                                block what you don't want. It takes 2 minutes and makes a huge difference.
                            </p>
                            <Link to="/register" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
                                Build my profile →
                            </Link>
                        </motion.div>
                    </div>

                    <div style={{ ...styles.split, marginTop: '5rem' }}>
                        <motion.div
                            style={styles.splitText}
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <p style={styles.splitLabel}>Intelligent Matching</p>
                            <h2>See your match score <span className="gradient-text">before you apply</span></h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.7 }}>
                                Every job is ranked by how well it fits your skill profile.
                                Cyan glow = perfect fit. Stop wasting time on jobs that will reject you.
                            </p>
                            <Link to="/jobs" className="btn btn-ghost" style={{ marginTop: '1.5rem' }}>
                                Explore Offers →
                            </Link>
                        </motion.div>
                        <div style={styles.splitImg}>
                            <img src={jobsImg} alt="Job matching" style={styles.splitImgEl} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA BANNER ===== */}
            <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div
                        style={styles.ctaBanner}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 style={{ color: '#000', fontWeight: 800 }}>
                            Ready to find your flow?
                        </h2>
                        <p style={{ color: 'rgba(0,0,0,0.65)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                            Join developers who stopped sending resumes into the void.
                        </p>
                        <Link to="/register" className="btn" style={{ marginTop: '1.5rem', background: '#000', color: 'var(--accent-cyan)', fontSize: '1rem', padding: '0.8rem 2rem' }}>
                            Start for free →
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={styles.footer}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}

const styles = {
    hero: {
        paddingTop: '5rem',
        paddingBottom: '4rem',
        position: 'relative',
        overflow: 'hidden',
    },
    heroInner: {
        display: 'flex',
        alignItems: 'center',
        gap: '4rem',
        marginBottom: '4rem',
    },
    heroLeft: {
        flex: '1 1 420px',
        minWidth: 0,
    },
    heroBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(0,229,255,0.08)',
        border: '1px solid rgba(0,229,255,0.25)',
        borderRadius: '999px',
        padding: '0.3rem 0.9rem',
        fontSize: '0.8rem',
        color: 'var(--accent-cyan)',
        marginBottom: '1.25rem',
        fontWeight: 500,
    },
    heroBadgeDot: {
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 6px var(--accent-cyan)',
        animation: 'pulse 2s infinite',
    },
    heroHeading: {
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        marginBottom: '1.25rem',
    },
    heroSub: {
        color: 'var(--text-secondary)',
        fontSize: '1.05rem',
        lineHeight: 1.7,
        marginBottom: '2rem',
        maxWidth: '460px',
    },
    heroCtas: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    heroRight: {
        flex: '1 1 380px',
        display: 'flex',
        justifyContent: 'center',
    },
    heroImgWrapper: {
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
    },
    heroImg: {
        width: '100%',
        borderRadius: '20px',
        position: 'relative',
        zIndex: 1,
    },
    heroGlow: {
        position: 'absolute',
        inset: '-20px',
        background: 'radial-gradient(ellipse at center, rgba(0,229,255,0.15) 0%, transparent 70%)',
        zIndex: 0,
        borderRadius: '50%',
    },
    statsRow: {
        display: 'flex',
        gap: '0',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        maxWidth: '600px',
        margin: '0 auto',
    },
    statItem: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem',
        borderRight: '1px solid var(--border)',
    },
    statValue: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--accent-cyan)',
        letterSpacing: '-0.03em',
    },
    statLabel: {
        fontSize: '0.8rem',
        color: 'var(--text-secondary)',
        marginTop: '0.2rem',
    },
    featuresGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
    },
    featureCard: {
        borderTop: '2px solid',
        paddingTop: '1.5rem',
    },
    featureIcon: {
        fontSize: '2rem',
        marginBottom: '0.75rem',
        display: 'block',
    },
    featureTitle: {
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
    },
    featureDesc: {
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        lineHeight: 1.6,
    },
    split: {
        display: 'flex',
        alignItems: 'center',
        gap: '4rem',
        flexWrap: 'wrap',
    },
    splitImg: {
        flex: '1 1 300px',
        display: 'flex',
        justifyContent: 'center',
    },
    splitImgEl: {
        width: '100%',
        maxWidth: '380px',
        borderRadius: '20px',
    },
    splitText: {
        flex: '1 1 360px',
    },
    splitLabel: {
        color: 'var(--accent-cyan)',
        fontSize: '0.8rem',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '0.75rem',
    },
    ctaBanner: {
        background: 'linear-gradient(135deg, var(--accent-cyan), #00b8d4)',
        borderRadius: 'var(--radius-xl)',
        padding: '3.5rem',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(0,229,255,0.2)',
    },
    footer: {
        borderTop: '1px solid var(--border)',
        padding: '2rem 0',
    },
};
