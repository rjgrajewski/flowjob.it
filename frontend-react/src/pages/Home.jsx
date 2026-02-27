import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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

const archNodes = [
    { label: "EventBridge", desc: "(02:00 UTC)", color: "var(--accent-amber)" },
    { label: "ECS Fargate", desc: "(Scout Scraper)", color: "var(--accent-cyan)" },
    { label: "AWS RDS", desc: "(PostgreSQL)", color: "var(--accent-blue)" },
    { label: "Atlas Pipeline", desc: "(Normalization)", color: "var(--accent-violet)" },
    { label: "flowjob", desc: "Search Layer", color: "var(--text-primary)" },
];

const MusicIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const AIIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
);

const DatabaseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5V19A9 3 0 0 0 21 19V5" />
        <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
);

const FloatingSymbol = ({ icon: Icon, color, delay = 0, size = 30, initialPos = { left: '0%', top: '0%' } }) => (
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
            x: [0, Math.random() * 100 - 50],
            y: [0, -150 - Math.random() * 100],
        }}
        transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
        }}
    >
        <Icon />
    </motion.div>
);

const symbols = [
    // Left side
    { icon: MusicIcon, color: 'var(--accent-violet)', size: 24, initialPos: { left: '10%', top: '60%' }, delay: 0 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 28, initialPos: { left: '15%', top: '30%' }, delay: 1 },
    { icon: DatabaseIcon, color: 'var(--accent-blue)', size: 26, initialPos: { left: '5%', top: '80%' }, delay: 3 },
    { icon: MusicIcon, color: 'var(--accent-violet)', size: 18, initialPos: { left: '20%', top: '10%' }, delay: 7 },

    // Right side
    { icon: MusicIcon, color: 'var(--accent-violet)', size: 18, initialPos: { left: '85%', top: '40%' }, delay: 2 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 20, initialPos: { left: '90%', top: '70%' }, delay: 4 },
    { icon: DatabaseIcon, color: 'var(--accent-blue)', size: 22, initialPos: { left: '80%', top: '20%' }, delay: 5 },
    { icon: DatabaseIcon, color: 'var(--accent-blue)', size: 18, initialPos: { left: '75%', top: '90%' }, delay: 8 },

    // Top/Bottom bias
    { icon: MusicIcon, color: 'var(--accent-violet)', size: 20, initialPos: { left: '40%', top: '15%' }, delay: 1.5 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 24, initialPos: { left: '60%', top: '85%' }, delay: 6 },
];

export default function Home() {
    return (
        <div style={styles.page}>
            {/* 1. HERO - HELLO WORLD */}
            <section style={styles.sectionHero}>
                <div style={styles.heroGlow} />
                {symbols.map((sym, i) => (
                    <FloatingSymbol key={i} {...sym} />
                ))}
                <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                    <motion.div
                        initial="hidden" animate="show" variants={staggerContainer}
                        style={styles.heroContent}
                    >
                        <div style={styles.authorSectionWrapper}>
                            <motion.div variants={fadeUp} style={styles.avatarWrapperAbsolute}>
                                <img
                                    src="https://github.com/rjgrajewski.png"
                                    alt="Rafal"
                                    style={styles.avatar}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={styles.avatarFallback}>RG</div>
                            </motion.div>

                            <motion.h1 variants={fadeUp} style={styles.headingBio}>
                                Hello <span className="gradient-text">World!</span>
                            </motion.h1>

                            <motion.div variants={fadeUp} style={styles.authorBoxRedesign}>
                                <div style={styles.authorText}>
                                    <p style={styles.greeting}>I'm Rafal — data analyst by profession, musician by passion, and the builder behind flowjob.it.</p>
                                    <p style={styles.bio}>
                                        I build things that make sense. Sometimes it's a song. Sometimes it's a data pipeline processing recruitment data at scale.
                                    </p>
                                </div>
                                <div style={styles.techBadge}>
                                    Python • SQL • AWS • AI
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section >

            {/* 2. THE PROBLEM */}
            < section className="section" style={styles.sectionDark} >
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        style={styles.twoCol}
                    >
                        <motion.div variants={fadeUp} style={styles.colLeft}>
                            <h2 style={styles.sectionTitle}>The Problem</h2>
                            <p style={styles.paragraph}>As I kept expanding my skills in SQL, data transformation, and reporting, I decided to validate myself on the job market.</p>
                            <p style={styles.paragraph}>Very quickly, I ran into two problems. First, I noticed that this kind of skillset often goes hand in hand with expectations around building web scrapers. Second, browsing job boards felt painfully inefficient.</p>
                            <blockquote style={styles.quote}>
                                "The signal was there, but so was the noise. And the noise was winning."
                            </blockquote>
                            <p style={styles.paragraph}>I would receive offers that indeed mentioned SQL or data modeling, yet at the same time required things that immediately disqualified me — for example, fluency in additional foreign languages. It was frustrating.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} style={styles.colRight}>
                            <div style={styles.illustrationBox}>
                                <motion.div style={styles.noiseCircle} animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
                                <motion.div style={styles.signalCircle} animate={{ scale: [1, 1.05, 1], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} />
                                <div style={styles.illustrationText}>SIGNAL VS NOISE</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section >

            {/* 3. THE FOUNDATION: DATA MODEL */}
            < section className="section" style={styles.sectionLight} >
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        style={{ ...styles.twoCol, flexDirection: 'row-reverse' }}
                    >
                        <motion.div variants={fadeUp} style={styles.colLeft}>
                            <h2 style={styles.sectionTitle}>Logical Layer</h2>
                            <p style={styles.paragraph}>I didn’t want to build “another job board.” The internet doesn’t need one. I wanted to build a logical layer between the candidate and the job listing.</p>
                            <p style={styles.paragraph}>Job offers are not just text — they are already data. They just aren’t treated that way. If something can be parsed, normalized, and modeled, it can be queried properly. And once you can query it properly, filtering, comparison, and matching start to actually make sense.</p>
                            <p style={styles.highlightText}>
                                That’s why the foundation of flowjob is not a list of job ads. The foundation is a data model.
                            </p>
                        </motion.div>
                        <motion.div variants={fadeUp} style={styles.colRight}>
                            <div style={styles.codeWindow}>
                                <div style={styles.codeHeader}>
                                    <span style={styles.dotRed} /> <span style={styles.dotYellow} /> <span style={styles.dotGreen} />
                                    <span style={styles.codeTitle}>job_offer.json</span>
                                </div>
                                <pre style={styles.codeBody}>
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
            </section >

            {/* 4. PREPARING THE SCRAPER */}
            < section className="section" style={styles.sectionDark} >
                <div className="container" style={styles.centerContainer}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
                        <motion.h2 variants={fadeUp} style={{ ...styles.sectionTitle, textAlign: 'center' }}>Preparing the Scraper</motion.h2>

                        <div style={styles.gridCards}>
                            <motion.div variants={fadeUp} style={styles.card}>
                                <div style={styles.cardIcon}>🎯</div>
                                <h3 style={styles.cardTitle}>1. JustJoin.it</h3>
                                <p style={styles.cardText}>Selected for its strong focus on transparent tech stacks and overall engineering quality, exposing structured skill info consistently.</p>
                            </motion.div>
                            <motion.div variants={fadeUp} style={styles.card}>
                                <div style={styles.cardIcon}>⚙️</div>
                                <h3 style={styles.cardTitle}>2. The Challenge</h3>
                                <p style={styles.cardText}>Scraping was non-trivial. The platform uses dynamic DOM loading without classic pagination, requiring robust browser automation.</p>
                            </motion.div>
                            <motion.div variants={fadeUp} style={styles.card}>
                                <div style={styles.cardIcon}>🐍</div>
                                <h3 style={styles.cardTitle}>3. Python & Playwright</h3>
                                <p style={styles.cardText}>Chose Python to strengthen my market position. After experimenting with Selenium and BS4, Playwright delivered the most reliable results.</p>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </section >

            {/* 5. ARCHITECTURE & AUTOMATION */}
            < section className="section" style={styles.sectionLight} >
                <div className="container">
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer}>
                        <motion.h2 variants={fadeUp} style={{ ...styles.sectionTitle, textAlign: 'center' }}>Event-Driven Automation</motion.h2>
                        <motion.p variants={fadeUp} style={{ ...styles.paragraph, textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
                            The automation follows an event-driven model. <strong>Scout</strong> (the scraping module) triggers <strong>Atlas</strong> (the normalization pipeline). Deployed as a containerized workload on AWS Fargate, the system updates daily with full observability.
                        </motion.p>

                        <div style={styles.architectureFlow}>
                            {archNodes.map((node, i) => (
                                <motion.div key={i} variants={fadeUp} style={styles.archNodeWrapper}>
                                    <div style={{ ...styles.archNode, borderColor: node.color }}>
                                        <div style={{ color: node.color, fontWeight: 'bold' }}>{node.label}</div>
                                        <div style={styles.archDesc}>{node.desc}</div>
                                    </div>
                                    {i < archNodes.length - 1 && (
                                        <motion.div
                                            style={styles.archArrow}
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
            </section >

            {/* 6. TACKLING SKILL CHAOS WITH AI */}
            < section className="section" style={styles.sectionDark} >
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        style={styles.twoCol}
                    >
                        <motion.div variants={fadeUp} style={styles.colLeft}>
                            <h2 style={styles.sectionTitle}>Tackling Skill Chaos with <span className="gradient-text">AI</span></h2>
                            <p style={styles.paragraph}>Many listings contained the same requirements written in multiple ways — e.g., <em>MS Excel, Microsoft Excel, Excel</em>. From a data perspective, they fragment the signal.</p>
                            <p style={styles.paragraph}>I brought <strong>Amazon Bedrock</strong> into the architecture. The <strong>Atlas</strong> service interprets raw skill text and maps it into a consistent semantic representation.</p>
                            <p style={styles.paragraph}>Instead of relying purely on expensive embeddings, the approach sorts raw skills, splits them, and normalizes them via a carefully tuned system prompt. Each run only processes unseen entries, keeping the Lambda function incredibly fast and cost-efficient.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} style={{ ...styles.colRight, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div style={styles.aiBox}>
                                <div style={styles.aiWordRaw}>MS Excel</div>
                                <div style={styles.aiWordRaw}>Microsoft Excel</div>
                                <div style={styles.aiWordRaw}>Excel</div>
                                <motion.div
                                    style={styles.aiFunnel}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    ↓ Bedrock Normalization ↓
                                </motion.div>
                                <div style={styles.aiWordClean}>Excel</div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section >

            {/* 7. FRONTEND VIBE & D3 */}
            < section className="section" style={styles.sectionLight} >
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        style={{ ...styles.twoCol, flexDirection: 'row-reverse' }}
                    >
                        <motion.div variants={fadeUp} style={styles.colLeft}>
                            <p style={styles.labelSection}>Frontend — the “vibe interface”</p>
                            <h2 style={styles.sectionTitle}>Designing the Matching Experience</h2>
                            <p style={styles.paragraph}>I wanted the experience to feel fundamentally different from traditional job search filters. Using Vite and React, I built an interactive skill map where technologies behave more like objects in a living ecosystem.</p>
                            <p style={styles.paragraph}>With D3-force and Framer Motion, bubbles move, reposition, and flow into your profile. Users don’t have to think in terms of filters — they explore, they tap, they follow momentum. The system continuously responds by surfacing the next most relevant skills.</p>
                            <p style={styles.paragraph}>Left click means "I have it". Shift+click means "avoid".</p>
                        </motion.div>
                        <motion.div variants={fadeUp} style={styles.colRight}>
                            <div style={styles.vibeMap}>
                                <motion.div style={{ ...styles.vibeNode, top: '20%', left: '30%', borderColor: 'var(--accent-cyan)' }} animate={{ y: [0, -10, 0], x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>React</motion.div>
                                <motion.div style={{ ...styles.vibeNode, top: '50%', left: '50%', borderColor: 'var(--accent-violet)', transform: 'translate(-50%, -50%)', background: 'var(--bg-elevated)', border: '2px solid var(--accent-violet)' }} animate={{ y: [0, 10, 0], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 5 }}>Skills Match</motion.div>
                                <motion.div style={{ ...styles.vibeNode, top: '70%', left: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, 8, 0], x: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 4.5 }}>Python</motion.div>
                                <motion.div style={{ ...styles.vibeNode, top: '30%', right: '20%', borderColor: 'var(--accent-amber)' }} animate={{ y: [0, -5, 0], x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }}>SQL</motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section >

            {/* 8. BACKEND RECOMMENDATION */}
            < section className="section" style={styles.sectionDark} >
                <div className="container">
                    <motion.div
                        initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
                        style={styles.twoCol}
                    >
                        <motion.div variants={fadeUp} style={styles.colLeft}>
                            <p style={styles.labelSection}>Backend — SQL-native engine</p>
                            <h2 style={styles.sectionTitle}>Pragmatic Core</h2>
                            <p style={styles.paragraph}>Behind this playful surface sits a very pragmatic core. The heart of the recommendation logic lives directly in PostgreSQL.</p>
                            <p style={styles.paragraph}>It aggregates the market to surface hot tech initially. Once you select a skill, the logic shifts into personalization mode, finding real co-occurrence patterns in job offers. This creates a recommendation loop that feels predictive without heavy ML infrastructure.</p>
                            <p style={styles.paragraph}>The Match Score is computed in real time on the frontend, making the experience feel immediate.</p>
                        </motion.div>
                        <motion.div variants={fadeUp} style={styles.colRight}>
                            <div style={styles.matchScoreBox}>
                                <motion.div
                                    style={styles.scoreCircleForeground}
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    viewport={{ once: true }}
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
                        </motion.div>
                    </motion.div>
                </div>
            </section >

            {/* 9. CV BUILDER & NEXT STEPS */}
            < section className="section" style={styles.sectionLight} >
                <div className="container" style={{ textAlign: 'center' }}>
                    <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={staggerContainer} style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <motion.h2 variants={fadeUp} style={styles.sectionTitle}>The Last Mile: CV Builder</motion.h2>
                        <motion.p variants={fadeUp} style={styles.paragraph}>
                            Born from a simple observation: right before applying, it often makes sense to manually tailor your document. flowjob renders the CV directly in the browser using <code>@react-pdf/renderer</code> for true live preview.
                        </motion.p>
                        <motion.p variants={fadeUp} style={styles.paragraph}>
                            Skills selected on the map don’t disappear into a black box — they flow directly into the CV builder. In the end, it turns your activity inside flowjob into a market-ready asset.
                        </motion.p>

                        <motion.div variants={fadeUp} style={styles.nextStepsBox}>
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
            </section >

            {/* FOOTER */}
            < footer style={styles.footer} >
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        © 2026 <strong style={{ color: 'var(--text-primary)' }}>flowjob</strong>. All rights reserved. Built by Rafal Grajewski.
                    </p>
                </div>
            </footer >
        </div >
    );
}

const styles = {
    page: {
        width: '100%',
    },
    sectionHero: {
        paddingTop: '6rem',
        paddingBottom: '4rem',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
    },
    heroGlow: {
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '800px',
        height: '400px',
        background: 'radial-gradient(ellipse at top, rgba(0,229,255,0.15) 0%, transparent 70%)',
        zIndex: 0,
        filter: 'blur(50px)',
    },
    heroContainer: {
        position: 'relative',
        zIndex: 1,
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(0,229,255,0.08)',
        border: '1px solid rgba(0,229,255,0.25)',
        borderRadius: '999px',
        padding: '0.4rem 1rem',
        fontSize: '0.85rem',
        color: 'var(--accent-cyan)',
        marginBottom: '2rem',
        fontWeight: 500,
    },
    badgeDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 8px var(--accent-cyan)',
        animation: 'pulse 2s infinite',
    },
    heading: {
        fontSize: '4rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        marginBottom: '4rem',
        lineHeight: 1.1,
    },
    authorSectionWrapper: {
        position: 'relative',
        marginTop: '2rem',
        textAlign: 'left',
    },
    avatarWrapperAbsolute: {
        position: 'absolute',
        top: '-40px',
        left: '-20px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '4px solid var(--accent-cyan)',
        boxShadow: '0 0 40px rgba(0,229,255,0.4)',
        zIndex: 10,
        background: 'var(--bg-surface)',
    },
    floatingSymbolsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5,
    },
    headingBio: {
        fontSize: '3.5rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        marginLeft: '140px',
        marginBottom: '1rem',
        lineHeight: 1.1,
    },
    techBadge: {
        opacity: 0.5,
    },
    authorBoxRedesign: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2rem',
        background: 'var(--bg-elevated)',
        padding: '5rem 3rem 3rem 3rem',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        textAlign: 'left',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        marginTop: '0',
    },
    avatar: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        zIndex: 2,
    },
    avatarFallback: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    authorText: {
        flex: 1,
    },
    greeting: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '1rem',
    },
    bio: {
        fontSize: '1rem',
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
        margin: 0,
    },
    sectionDark: {
        padding: '6rem 0',
        background: 'var(--bg-default)',
    },
    sectionLight: {
        padding: '6rem 0',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
    },
    sectionTitle: {
        fontSize: '2.5rem',
        fontWeight: 800,
        marginBottom: '1.5rem',
        letterSpacing: '-0.02em',
    },
    labelSection: {
        color: 'var(--accent-cyan)',
        fontSize: '0.85rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '1rem',
    },
    paragraph: {
        fontSize: '1.1rem',
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
        marginBottom: '1.5rem',
    },
    highlightText: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.6,
        color: 'var(--accent-cyan)',
        paddingLeft: '1.5rem',
        borderLeft: '4px solid var(--accent-cyan)',
        marginTop: '2rem',
    },
    quote: {
        fontSize: '1.4rem',
        fontStyle: 'italic',
        fontWeight: 600,
        lineHeight: 1.5,
        color: 'var(--text-primary)',
        margin: '2rem 0',
        padding: '0 2rem',
        borderLeft: '4px solid var(--accent-amber)',
    },
    twoCol: {
        display: 'flex',
        gap: '4rem',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    colLeft: {
        flex: '1 1 500px',
    },
    colRight: {
        flex: '1 1 400px',
    },
    centerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    gridCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        marginTop: '3rem',
    },
    card: {
        background: 'var(--bg-elevated)',
        padding: '2rem',
        borderRadius: '20px',
        border: '1px solid var(--border)',
    },
    cardIcon: {
        fontSize: '2.5rem',
        marginBottom: '1rem',
    },
    cardTitle: {
        fontSize: '1.25rem',
        marginBottom: '1rem',
        fontWeight: 700,
    },
    cardText: {
        color: 'var(--text-secondary)',
        lineHeight: 1.6,
    },
    codeWindow: {
        background: '#1e1e1e',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
    },
    codeHeader: {
        background: '#2d2d2d',
        padding: '10px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    dotRed: { width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' },
    dotYellow: { width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' },
    dotGreen: { width: 12, height: 12, borderRadius: '50%', background: '#27c93f' },
    codeTitle: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginLeft: '10px', fontFamily: 'monospace' },
    codeBody: {
        padding: '20px',
        margin: 0,
        color: '#e6e6e6',
        fontFamily: 'monospace',
        fontSize: '0.95rem',
        lineHeight: 1.5,
        overflowX: 'auto',
    },
    illustrationBox: {
        position: 'relative',
        width: '100%',
        height: '350px',
        background: 'var(--bg-elevated)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    noiseCircle: {
        position: 'absolute',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: 'var(--accent-amber)',
        filter: 'blur(40px)',
    },
    signalCircle: {
        position: 'absolute',
        width: '100px',
        height: '100px',
        background: 'var(--accent-cyan)',
        borderRadius: '24px',
        zIndex: 2,
    },
    illustrationText: {
        position: 'absolute',
        zIndex: 3,
        fontWeight: 'bold',
        color: 'var(--bg-default)',
        letterSpacing: '0.1em',
    },
    architectureFlow: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '2rem',
    },
    archNodeWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    archNode: {
        background: 'var(--bg-elevated)',
        border: '2px solid',
        borderRadius: '12px',
        padding: '1.25rem 2rem',
        textAlign: 'center',
        width: '300px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    },
    archDesc: {
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        marginTop: '0.25rem',
    },
    archArrow: {
        color: 'var(--text-secondary)',
        fontSize: '1.5rem',
        margin: '1rem 0',
    },
    aiBox: {
        background: 'var(--bg-elevated)',
        padding: '3rem',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        width: '100%',
    },
    aiWordRaw: {
        background: 'rgba(255,255,255,0.05)',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        border: '1px dashed rgba(255,255,255,0.1)',
    },
    aiFunnel: {
        color: 'var(--accent-violet)',
        fontWeight: 'bold',
        margin: '1rem 0',
        fontSize: '0.9rem',
        letterSpacing: '0.1em',
    },
    aiWordClean: {
        background: 'rgba(139, 92, 246, 0.2)',
        color: '#d8b4fe',
        border: '1px solid var(--accent-violet)',
        padding: '1rem 2rem',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '1.25rem',
        boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
    },
    vibeMap: {
        position: 'relative',
        width: '100%',
        height: '400px',
        background: 'var(--bg-default)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
    },
    vibeNode: {
        position: 'absolute',
        padding: '0.75rem 1.5rem',
        borderRadius: '999px',
        border: '1px solid',
        background: 'var(--bg-surface)',
        fontWeight: 600,
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    },
    matchScoreBox: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '300px',
    },
    scoreCircleForeground: {
        position: 'relative',
        width: '240px',
        height: '240px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
        fontSize: '4rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        fontFamily: 'monospace',
        letterSpacing: '-0.05em',
        textShadow: '0 0 20px rgba(0,229,255,0.3)',
    },
    nextStepsBox: {
        background: 'linear-gradient(135deg, rgba(0,229,255,0.05) 0%, rgba(139,92,246,0.05) 100%)',
        border: '1px solid rgba(0,229,255,0.2)',
        borderRadius: '24px',
        padding: '4rem 2rem',
        marginTop: '4rem',
    },
    footer: {
        borderTop: '1px solid var(--border)',
        padding: '3rem 0',
        background: 'var(--bg-default)',
    },
};
