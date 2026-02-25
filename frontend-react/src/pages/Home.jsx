import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
    {
        icon: '◈',
        title: '1. Build a Skill Graph',
        description: 'Navigate a visual map of tech skills. Click what you know, and importantly, shift+click to block what you hate.',
        accent: 'var(--accent-cyan)',
    },
    {
        icon: '⟳',
        title: '2. Transparent Scoring',
        description: 'The algorithm compares your graph against real job descriptions. You get a clear match score showing exactly why a job fits.',
        accent: 'var(--accent-violet)',
    },
    {
        icon: '⬡',
        title: '3. Absolute Dealbreakers',
        description: 'If a job requires an "Anti-Skill" you blocked, we filter it out. Period. No compromises on the tools you despise.',
        accent: 'var(--accent-amber)',
    },
];

const stats = [
    { value: '12k+', label: 'Job Offers Scraped' },
    { value: '500+', label: 'Tech Skills Mapped' },
    { value: '100%', label: 'Open & Honest' },
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
                            An honest hobby project
                        </div>
                        <h1 style={styles.heroHeading}>
                            Find your <span className="gradient-text">flow</span>
                            <br />in tech jobs
                        </h1>
                        <p style={styles.heroSub}>
                            I built flowjob to scratch my own itch. It's a non-profit hobby project designed to map your real skills, block the tech you hate, and match you with jobs using straightforward data—no corporate BS.
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
                        <div style={styles.abstractGraphic}>
                            <motion.div
                                style={{ ...styles.shape, ...styles.shape1 }}
                                animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                            />
                            <motion.div
                                style={{ ...styles.shape, ...styles.shape2 }}
                                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                            />
                            <motion.div
                                style={{ ...styles.shape, ...styles.shape3 }}
                                animate={{ scale: [1, 1.05, 1], rotate: [45, 90, 45] }}
                                transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                            />
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
                        <h2>How it <span className="gradient-text">actually works</span></h2>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
                            No AI buzzwords, no hidden recruiter algorithms. Just a transparent matching engine built by a developer, for developers.
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
                            <div style={styles.abstractGraphicSmall}>
                                <motion.div
                                    style={{ ...styles.gridShape, ...styles.gridShape1 }}
                                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                />
                                <motion.div
                                    style={{ ...styles.gridShape, ...styles.gridShape2 }}
                                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                />
                                <motion.div
                                    style={{ ...styles.gridShape, ...styles.gridShape3 }}
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 2 }}
                                />
                            </div>
                        </div>
                        <motion.div
                            style={styles.splitText}
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <p style={styles.splitLabel}>Honest Profiling</p>
                            <h2>Map your skills, <span className="gradient-text">not buzzwords</span></h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.7 }}>
                                I wanted a tool where I could visually organize what I know and what I absolutely refuse to work with. It takes two minutes to click through the bubble cloud, and the algorithm honors your choices completely.
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
                            <p style={styles.splitLabel}>Transparent Data</p>
                            <h2>Understand <span className="gradient-text">why you match</span></h2>
                            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.7 }}>
                                Every offer is scored against your skill graph based on plain data logic. A cyan glow means a perfect fit. I built this so we can stop wasting time reading irrelevant job descriptions.
                            </p>
                            <Link to="/jobs" className="btn btn-ghost" style={{ marginTop: '1.5rem' }}>
                                Explore Offers →
                            </Link>
                        </motion.div>
                        <div style={styles.splitImg}>
                            <div style={styles.abstractGraphicSmall}>
                                <motion.div
                                    style={styles.scoreCircleBackground}
                                />
                                <motion.div
                                    style={styles.scoreCircleForeground}
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                >
                                    <svg viewBox="0 0 100 100" style={styles.svgScore}>
                                        <motion.circle
                                            cx="50" cy="50" r="45"
                                            fill="none" stroke="var(--accent-cyan)" strokeWidth="8"
                                            strokeDasharray="283"
                                            initial={{ strokeDashoffset: 283 }}
                                            animate={{ strokeDashoffset: 40 }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        />
                                    </svg>
                                    <div style={styles.scoreText}>98%</div>
                                </motion.div>
                            </div>
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
                            Try my hobby project
                        </h2>
                        <p style={{ color: 'rgba(0,0,0,0.65)', marginTop: '0.5rem', fontSize: '1.05rem' }}>
                            It's free, no ads, just a developer trying to fix the job search experience.
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
    abstractGraphic: {
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        height: '440px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    shape: {
        position: 'absolute',
        borderRadius: 'var(--radius-xl)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    },
    shape1: {
        width: '280px',
        height: '320px',
        background: 'linear-gradient(135deg, rgba(0,229,255,0.1) 0%, rgba(0,229,255,0.02) 100%)',
        border: '1px solid rgba(0,229,255,0.2)',
        zIndex: 2,
        borderRadius: '30px',
        transform: 'rotate(-5deg)',
    },
    shape2: {
        width: '240px',
        height: '240px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.02) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '50%',
        top: '10%',
        right: '5%',
        zIndex: 1,
    },
    shape3: {
        width: '180px',
        height: '180px',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0.02) 100%)',
        border: '1px solid rgba(245,158,11,0.2)',
        bottom: '15%',
        left: '10%',
        zIndex: 3,
        borderRadius: '20px',
        transform: 'rotate(15deg)',
    },
    heroGlow: {
        position: 'absolute',
        inset: '10%',
        background: 'radial-gradient(circle at center, rgba(0,229,255,0.15) 0%, transparent 60%)',
        zIndex: 0,
        filter: 'blur(40px)',
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
    abstractGraphicSmall: {
        position: 'relative',
        width: '100%',
        maxWidth: '380px',
        height: '380px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
    },
    gridShape: {
        position: 'absolute',
        background: 'var(--accent-cyan)',
        borderRadius: '50%',
        filter: 'blur(40px)',
    },
    gridShape1: {
        width: '150px',
        height: '150px',
        top: '20%',
        left: '20%',
        background: 'var(--accent-cyan)',
    },
    gridShape2: {
        width: '200px',
        height: '200px',
        bottom: '10%',
        right: '10%',
        background: 'var(--accent-violet)',
    },
    gridShape3: {
        width: '100px',
        height: '100px',
        top: '40%',
        right: '30%',
        background: 'var(--accent-amber)',
    },
    scoreCircleBackground: {
        position: 'absolute',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        border: '8px solid var(--bg-surface)',
    },
    scoreCircleForeground: {
        position: 'relative',
        width: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    svgScore: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'rotate(-90deg)',
    },
    scoreText: {
        fontSize: '3.5rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.05em',
        textShadow: '0 0 20px rgba(0,229,255,0.3)',
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
