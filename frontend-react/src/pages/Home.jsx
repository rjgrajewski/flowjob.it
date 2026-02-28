import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { api } from '../services/api';
import './Home.css';
import { BriefcaseIcon, ZapIcon, AIIcon, FileTextIcon, DatabaseIcon } from '../components/Icons';
import { archNodes, pipelineSteps, symbols } from './Home.constants';

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

const AnimatedCounter = ({ value, label, duration = value / 1000 / 2 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const controls = animate(0, value, {
            duration: duration,
            ease: "circOut",
            onUpdate: (latest) => setDisplayValue(latest ? Math.floor(latest) : 0),
        });
        return () => controls.stop();
    }, [value, duration]);

    return (
        <span className="counter-value-inline">+ {displayValue.toLocaleString()}</span>
    );
};

const StatCard = ({ children, icon: Icon, color = "var(--accent-cyan)" }) => (
    <motion.div
        variants={fadeUp}
        className="stat-card"
        whileHover={{
            y: -8,
            borderColor: 'var(--accent-cyan)',
            boxShadow: '0 15px 35px rgba(0, 229, 255, 0.15)'
        }}
    >
        {Icon && <div style={{ color: color, width: '40px', height: '40px', marginBottom: '1.5rem', opacity: 0.8 }}><Icon /></div>}
        <div className="card-content-wrapper">
            {children}
        </div>
    </motion.div>
);

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
    const [stats, setStats] = useState({ offers: 0, skills: 0 });
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        api.getStats().then(setStats).catch(console.error);
    }, []);

    return (
        <div className="page">
            {/* 1. HERO - HELLO WORLD */}
            <section className="section-hero">
                <div className="hero-glow" />
                {symbols.map((sym, i) => (
                    <FloatingSymbol key={i} {...sym} />
                ))}
                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div
                        initial="hidden" animate="show" variants={staggerContainer}
                        className="hero-content"
                    >
                        <div className="author-section-wrapper">
                            <motion.div variants={fadeUp} className="avatar-wrapper-absolute">
                                {!imageError && (
                                    <img
                                        src="https://github.com/rjgrajewski.png"
                                        alt="Rafal"
                                        className="avatar"
                                        onError={() => setImageError(true)}
                                    />
                                )}
                                {imageError && <div className="avatar-fallback">RG</div>}
                            </motion.div>

                            <motion.h1 variants={fadeUp} className="heading-bio">
                                Hello <span className="gradient-text">World!</span>
                            </motion.h1>

                            <motion.div variants={fadeUp} className="author-box-redesign">
                                <div className="author-text">
                                    <p className="greeting">I'm Rafal — data analyst by profession, musician by passion, and the builder behind flowjob.it.</p>
                                    <p className="bio">
                                        I build things that make sense. Sometimes it's a song. Sometimes it's a data pipeline processing recruitment data at scale.
                                    </p>
                                </div>
                                <div className="tech-badge">
                                    Python • SQL • AWS • AI
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 1.5 WHAT FLOWJOB DOES - STATS */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="stats-grid"
                    >
                        <motion.div variants={fadeUp} className="stats-header">
                            <h2 className="stats-title">What <span className="gradient-text">Flowjob</span> actually does</h2>
                            <p className="paragraph" style={{ maxWidth: '650px', margin: '1rem auto 0', textAlign: 'center', fontSize: '1.15rem' }}>
                                Not just another job board. Not just another CV builder.
                            </p>
                        </motion.div>

                        <div className="stat-cards-row">
                            <StatCard icon={BriefcaseIcon}>
                                <div className="card-value-large"><AnimatedCounter value={stats.offers} /></div>
                                <div className="card-text-content">job adverts processed</div>
                            </StatCard>

                            <StatCard icon={ZapIcon}>
                                <div className="card-value-large"><AnimatedCounter value={stats.skills} /></div>
                                <div className="card-text-content">skills normalized</div>
                            </StatCard>

                            <StatCard icon={AIIcon}>
                                <div className="card-text-content">AI-powered semantic matching</div>
                            </StatCard>

                            <StatCard icon={FileTextIcon}>
                                <div className="card-text-content">Built-in CV creator</div>
                            </StatCard>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 1.6 THE PIPELINE */}
            <section className="pipeline-section">
                <div className="container" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="section-title">Inside the Flowjob pipeline</h2>
                        <p className="paragraph" style={{ maxWidth: '700px', margin: '0 auto' }}>
                            Flowjob is built around normalized skill intelligence, not raw keyword matching.
                        </p>
                    </motion.div>
                </div>

                <div className="pipeline-container hide-scrollbar">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={staggerContainer}
                        className="pipeline-track"
                    >
                        {/* Connecting Line */}
                        <div className="pipeline-line-wrapper">
                            <motion.div
                                className="pipeline-line-progress"
                                initial={{ width: '0%' }}
                                whileInView={{ width: '100%' }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Steps */}
                        {pipelineSteps.map((step, i) => (
                            <motion.div key={i} variants={fadeUp} className="pipeline-step">
                                <div className="pipeline-node">
                                    <motion.div
                                        className="pipeline-node-inner"
                                        style={{ background: step.color, boxShadow: `0 0 15px ${step.color}` }}
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                                    />
                                </div>
                                <div className="pipeline-content">
                                    <h3 className="pipeline-step-title">{step.title}</h3>
                                    <p className="pipeline-step-desc">{step.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* 2. THE PROBLEM */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">The Problem</h2>
                            <p className="paragraph">As I kept expanding my skills in SQL, data transformation, and reporting, I decided to validate myself on the job market.</p>
                            <p className="paragraph">Very quickly, I ran into two problems. First, I noticed that this kind of skillset often goes hand in hand with expectations around building web scrapers. Second, browsing job boards felt painfully inefficient.</p>
                            <blockquote className="quote">
                                "The signal was there, but so was the noise. And the noise was winning."
                            </blockquote>
                            <p className="paragraph">I would receive offers that indeed mentioned SQL or data modeling, yet at the same time required things that immediately disqualified me — for example, fluency in additional foreign languages. It was frustrating.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="illustration-box">
                                <motion.div className="noise-circle" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
                                <motion.div className="signal-circle" animate={{ scale: [1, 1.05, 1], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
                                <div className="illustration-text">SIGNAL VS NOISE</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 3. THE FOUNDATION: DATA MODEL */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                        style={{ flexDirection: 'row-reverse' }}
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">Logical Layer</h2>
                            <p className="paragraph">I didn’t want to build “another job board.” The internet doesn’t need one. I wanted to build a logical layer between the candidate and the job listing.</p>
                            <p className="paragraph">Job offers are not just text — they are already data. They just aren’t treated that way. If something can be parsed, normalized, and modeled, it can be queried properly. And once you can query it properly, filtering, comparison, and matching start to actually make sense.</p>
                            <p className="highlight-text">
                                That’s why the foundation of flowjob is not a list of job ads. The foundation is a data model.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="code-window">
                                <div className="code-header">
                                    <span className="dot-red" /> <span className="dot-yellow" /> <span className="dot-green" />
                                    <span className="code-title">job_offer.json</span>
                                </div>
                                <pre className="code-body">
                                    {`{
  "id": "offer_9f8a",
  "title": "Data Engineer",
  "stack": [
    { "skill": "SQL", "required": true },
    { "skill": "Python", "required": true },
    { "skill": "AWS", "required": true }
  ],
  "parsed": true,
  "normalized": true
}`}
                                </pre>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 4. PREPARING THE SCRAPER */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container center-content">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
                        <motion.h2 variants={fadeUp} className="section-title" style={{ textAlign: 'center' }}>Preparing the Scraper</motion.h2>

                        <div className="grid-cards">
                            <motion.div variants={fadeUp} className="card">
                                <div className="card-icon">🎯</div>
                                <h3 className="card-title">1. JustJoin.it</h3>
                                <p className="card-text">Selected for its strong focus on transparent tech stacks and overall engineering quality, exposing structured skill info consistently.</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="card">
                                <div className="card-icon">⚙️</div>
                                <h3 className="card-title">2. The Challenge</h3>
                                <p className="card-text">Scraping was non-trivial. The platform uses dynamic DOM loading without classic pagination, requiring robust browser automation.</p>
                            </motion.div>
                            <motion.div variants={fadeUp} className="card">
                                <div className="card-icon">🐍</div>
                                <h3 className="card-title">3. Python & Playwright</h3>
                                <p className="card-text">Chose Python to strengthen my market position. After experimenting with Selenium and BS4, Playwright delivered the most reliable results.</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 5. ARCHITECTURE & AUTOMATION */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
                        <motion.h2 variants={fadeUp} className="section-title" style={{ textAlign: 'center' }}>Event-Driven Automation</motion.h2>
                        <motion.p variants={fadeUp} className="paragraph" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
                            The automation follows an event-driven model. <strong>Scout</strong> (the scraping module) triggers <strong>Atlas</strong> (the normalization pipeline). Deployed as a containerized workload on AWS Fargate, the system updates daily with full observability.
                        </motion.p>

                        <div className="architecture-flow">
                            {archNodes.map((node, i) => (
                                <motion.div key={i} variants={fadeUp} className="arch-node-wrapper">
                                    <div className="arch-node" style={{ borderColor: node.color }}>
                                        <div style={{ color: node.color, fontWeight: 'bold' }}>{node.label}</div>
                                        <div className="arch-desc">{node.desc}</div>
                                    </div>
                                    {i < archNodes.length - 1 && (
                                        <motion.div
                                            className="arch-arrow"
                                            animate={{ y: [0, 5, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                            ↓
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 6. TACKLING SKILL CHAOS WITH AI */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <h2 className="section-title">Tackling Skill Chaos with <span className="gradient-text">AI</span></h2>
                            <p className="paragraph">Many listings contained the same requirements written in multiple ways — e.g., <em>MS Excel, Microsoft Excel, Excel</em>. From a data perspective, they fragment the signal.</p>
                            <p className="paragraph">I brought <strong>Amazon Bedrock</strong> into the architecture. The <strong>Atlas</strong> service interprets raw skill text and maps it into a consistent semantic representation.</p>
                            <p className="paragraph">Instead of relying purely on expensive embeddings, the approach sorts raw skills, splits them, and normalizes them via a carefully tuned system prompt. Each run only processes unseen entries, keeping the Lambda function incredibly fast and cost-efficient.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="ai-box">
                                <div className="ai-word-raw">MS Excel</div>
                                <div className="ai-word-raw">Microsoft Excel</div>
                                <div className="ai-word-raw">Excel</div>
                                <motion.div
                                    className="ai-funnel"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    ↓ Bedrock Normalization ↓
                                </motion.div>
                                <div className="ai-word-clean">Excel</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 7. FRONTEND VIBE & D3 */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                        style={{ flexDirection: 'row-reverse' }}
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <p className="label-section">Frontend — the “vibe interface”</p>
                            <h2 className="section-title">Designing the Matching Experience</h2>
                            <p className="paragraph">I wanted the experience to feel fundamentally different from traditional job search filters. Using Vite and React, I built an interactive skill map where technologies behave more like objects in a living ecosystem.</p>
                            <p className="paragraph">With D3-force and Framer Motion, bubbles move, reposition, and flow into your profile. Users don’t have to think in terms of filters — they explore, they tap, they follow momentum. The system continuously responds by surfacing the next most relevant skills.</p>
                            <p className="paragraph">Left click means "I have it". Shift+click means "avoid".</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="vibe-map">
                                <motion.div className="vibe-node" style={{ top: '20%', left: '30%', borderColor: 'var(--accent-cyan)' }} animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>React</motion.div>
                                <motion.div className="vibe-node" style={{ top: '50%', left: '50%', borderColor: 'var(--accent-violet)', transform: 'translate(-50%, -50%)', background: 'var(--bg-elevated)', border: '2px solid var(--accent-violet)' }} animate={{ y: [0, 10, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 5 }}>Skills Match</motion.div>
                                <motion.div className="vibe-node" style={{ top: '70%', left: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, 8, 0], x: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5 }}>Python</motion.div>
                                <motion.div className="vibe-node" style={{ top: '30%', right: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, -5, 0], x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>SQL</motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 8. BACKEND RECOMMENDATION */}
            <section className="section" style={{ background: 'var(--bg-deep)' }}>
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        className="two-col"
                    >
                        <motion.div variants={fadeUp} className="col-left">
                            <p className="label-section">Backend — SQL-native engine</p>
                            <h2 className="section-title">Pragmatic Core</h2>
                            <p className="paragraph">Behind this playful surface sits a very pragmatic core. The heart of the recommendation logic lives directly in PostgreSQL.</p>
                            <p className="paragraph">It aggregates the market to surface hot tech initially. Once you select a skill, the logic shifts into personalization mode, finding real co-occurrence patterns in job offers. This creates a recommendation loop that feels predictive without heavy ML infrastructure.</p>
                            <p className="paragraph">The Match Score is computed in real time on the frontend, making the experience feel immediate.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} className="col-right">
                            <div className="match-score-box">
                                <motion.div
                                    className="score-circle-foreground"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                >
                                    <svg viewBox="0 0 100 100" className="svg-score">
                                        <motion.circle
                                            cx="50" cy="50" r="45"
                                            fill="none" stroke="var(--accent-cyan)" strokeWidth="8"
                                            strokeDasharray="283"
                                            initial={{ strokeDashoffset: 283 }}
                                            animate={{ strokeDashoffset: 40 }}
                                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        />
                                    </svg>
                                    <div className="score-text">98%</div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 9. CV BUILDER & NEXT STEPS */}
            <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <motion.h2 variants={fadeUp} className="section-title">The Last Mile: CV Builder</motion.h2>
                        <motion.p variants={fadeUp} className="paragraph">
                            Born from a simple observation: right before applying, it often makes sense to manually tailor your document. flowjob renders the CV directly in the browser using <code>@react-pdf/renderer</code> for true live preview.
                        </motion.p>
                        <motion.p variants={fadeUp} className="paragraph">
                            Skills selected on the map don’t disappear into a black box — they flow directly into the CV builder. In the end, it turns your activity inside flowjob into a market-ready asset.
                        </motion.p>

                        <motion.div variants={fadeUp} className="next-steps-box">
                            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>What's next?</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>1. One-click CV tailoring based on specific job descriptions.</p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>2. Deeper recommendation intelligence to analyze full semantic content.</p>

                            <p style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '2rem', fontSize: '1.2rem' }}>Not just a job search tool, but an intelligent career interface.</p>

                            <Link to="/get-started" className="btn btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
                                Start your journey →
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>. All rights reserved. Built by Rafal Grajewski.
                    </p>
                </div>
            </footer>
        </div >
    );
}

