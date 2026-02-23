import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api.js';

const STEPS = [
    {
        id: 'firstName',
        step: 1,
        icon: '👤',
        title: 'Jak masz na imię?',
        subtitle: 'Zacznijmy od podstaw.',
        placeholder: 'Jan',
        label: 'Imię',
        type: 'text',
    },
    {
        id: 'lastName',
        step: 2,
        icon: '✍️',
        title: 'Jakie masz nazwisko?',
        subtitle: 'Twój profil będzie widoczny tylko dla Ciebie.',
        placeholder: 'Kowalski',
        label: 'Nazwisko',
        type: 'text',
    },
    {
        id: 'jobTitle',
        step: 3,
        icon: '💼',
        title: 'Jaką pełnisz rolę zawodową?',
        subtitle: 'Wpisz tytuł, który najlepiej Cię opisuje.',
        placeholder: 'Senior Frontend Developer',
        label: 'Tytuł zawodowy',
        type: 'text',
    },
    {
        id: 'education',
        step: 4,
        icon: '🎓',
        title: 'Twoje wykształcenie',
        subtitle: 'Kierunek, uczelnia i rok ukończenia.',
        placeholder: 'Informatyka, AGH, 2020',
        label: 'Wykształcenie',
        type: 'text',
    },
    {
        id: 'experience',
        step: 5,
        icon: '📅',
        title: 'Ile lat doświadczenia masz?',
        subtitle: 'Przybliżona liczba lat w branży.',
        placeholder: '5',
        label: 'Lata doświadczenia',
        type: 'number',
    },
    {
        id: 'location',
        step: 6,
        icon: '📍',
        title: 'Gdzie pracujesz?',
        subtitle: 'Miasto lub "Remote" — jak wolisz.',
        placeholder: 'Warszawa / Remote',
        label: 'Lokalizacja',
        type: 'text',
    },
    {
        id: 'bio',
        step: 7,
        icon: '🚀',
        title: 'Powiedz coś o sobie',
        subtitle: 'Krótkie bio lub podsumowanie zawodowe.',
        placeholder: 'Entuzjasta React i TypeScript z doświadczeniem w budowaniu skalowanych aplikacji SPA...',
        label: 'Bio / podsumowanie',
        type: 'textarea',
    },
];

const TOTAL = STEPS.length;

const slideVariants = {
    enter: (dir) => ({
        x: dir > 0 ? 80 : -80,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
    },
    exit: (dir) => ({
        x: dir > 0 ? -80 : 80,
        opacity: 0,
        transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

export default function Onboarding() {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);

    const step = STEPS[currentStep];
    const progress = ((currentStep + 1) / TOTAL) * 100;
    const isLast = currentStep === TOTAL - 1;

    const handleChange = (e) => {
        setValues((v) => ({ ...v, [step.id]: e.target.value }));
    };

    const goNext = async () => {
        if (isLast) {
            setSaving(true);
            try {
                auth.completeOnboarding(values);
            } finally {
                setSaving(false);
            }
            navigate('/cv');
        } else {
            setDirection(1);
            setCurrentStep((s) => s + 1);
        }
    };

    const goBack = () => {
        if (currentStep === 0) return;
        setDirection(-1);
        setCurrentStep((s) => s - 1);
    };

    const canProceed = step.type !== 'textarea'
        ? (values[step.id] || '').trim().length > 0
        : true; // bio is optional

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && step.type !== 'textarea' && canProceed) {
            goNext();
        }
    };

    return (
        <div style={styles.wrapper}>
            {/* Background glow blobs */}
            <div style={styles.blobTopLeft} />
            <div style={styles.blobBottomRight} />

            <div style={styles.card}>
                {/* Header: step counter + progress bar */}
                <div style={styles.progressHeader}>
                    <span style={styles.stepCounter}>
                        Krok <span style={{ color: 'var(--accent-cyan)' }}>{currentStep + 1}</span> / {TOTAL}
                    </span>
                    <div style={styles.progressTrack}>
                        <motion.div
                            style={styles.progressFill}
                            initial={false}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        />
                        {/* Segment dots */}
                        <div style={styles.dotsRow}>
                            {STEPS.map((_, i) => (
                                <motion.div
                                    key={i}
                                    style={{
                                        ...styles.dot,
                                        ...(i <= currentStep ? styles.dotActive : {}),
                                    }}
                                    animate={{ scale: i === currentStep ? 1.3 : 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Step content */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={styles.stepBody}
                    >
                        <div style={styles.icon}>{step.icon}</div>
                        <h1 style={styles.title}>{step.title}</h1>
                        <p style={styles.subtitle}>{step.subtitle}</p>

                        <div style={{ width: '100%', marginTop: '2rem' }}>
                            <label className="form-label">{step.label}</label>
                            {step.type === 'textarea' ? (
                                <textarea
                                    className="form-input"
                                    rows={4}
                                    placeholder={step.placeholder}
                                    value={values[step.id] || ''}
                                    onChange={handleChange}
                                    style={{ resize: 'vertical', lineHeight: 1.6 }}
                                    autoFocus
                                />
                            ) : (
                                <input
                                    className="form-input"
                                    type={step.type}
                                    placeholder={step.placeholder}
                                    value={values[step.id] || ''}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    min={step.type === 'number' ? 0 : undefined}
                                    max={step.type === 'number' ? 60 : undefined}
                                    style={{ fontSize: '1.05rem' }}
                                />
                            )}
                            {step.type === 'textarea' && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                                    To pole jest opcjonalne — możesz pominąć.
                                </p>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div style={styles.navRow}>
                    <button
                        className="btn btn-secondary"
                        onClick={goBack}
                        disabled={currentStep === 0}
                        style={{ opacity: currentStep === 0 ? 0.3 : 1, pointerEvents: currentStep === 0 ? 'none' : 'auto' }}
                    >
                        ← Wstecz
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={goNext}
                        disabled={!canProceed || saving}
                        style={{ minWidth: '140px', justifyContent: 'center' }}
                    >
                        {saving
                            ? 'Zapisuję...'
                            : isLast
                                ? 'Gotowe →'
                                : 'Dalej →'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
    },
    blobTopLeft: {
        position: 'absolute',
        top: '-120px',
        left: '-120px',
        width: '480px',
        height: '480px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    blobBottomRight: {
        position: 'absolute',
        bottom: '-140px',
        right: '-140px',
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    card: {
        width: '100%',
        maxWidth: '540px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    },
    progressHeader: {
        marginBottom: '2.5rem',
    },
    stepCounter: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '0.75rem',
    },
    progressTrack: {
        position: 'relative',
        height: '6px',
        background: 'var(--bg-elevated)',
        borderRadius: '999px',
        overflow: 'visible',
    },
    progressFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        borderRadius: '999px',
        background: 'linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))',
        boxShadow: '0 0 10px rgba(0,229,255,0.4)',
    },
    dotsRow: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        transform: 'translateY(-50%)',
        display: 'flex',
        justifyContent: 'space-between',
        paddingLeft: '1px',
        paddingRight: '1px',
        pointerEvents: 'none',
    },
    dot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: 'var(--border)',
        border: '2px solid var(--bg-surface)',
        transition: 'background 0.25s',
    },
    dotActive: {
        background: 'var(--accent-cyan)',
    },
    stepBody: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        minHeight: '260px',
    },
    icon: {
        fontSize: '2.5rem',
        marginBottom: '1rem',
        lineHeight: 1,
    },
    title: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        lineHeight: 1.2,
        marginBottom: '0.5rem',
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: '0.95rem',
        lineHeight: 1.6,
    },
    navRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '2.5rem',
        gap: '1rem',
    },
};
