import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api.js';

// Returns a list of met and unmet password requirements
function getPasswordRequirements(password) {
    if (!password) password = '';
    return [
        { id: 'length', label: 'Minimum 8 characters', met: password.length >= 8 },
        { id: 'upper', label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { id: 'lower', label: 'Lowercase letter', met: /[a-z]/.test(password) },
        { id: 'number', label: 'Number', met: /\d/.test(password) },
        { id: 'special', label: 'Special character', met: /[^a-zA-Z0-9]/.test(password) },
    ];
}

export default function Register() {
    const [tab, setTab] = useState('register'); // 'register' | 'login'
    const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const passwordRequirements = useMemo(() => getPasswordRequirements(form.password), [form.password]);
    const allRequirementsMet = passwordRequirements.every(req => req.met);
    const passwordsMatch = form.password === form.passwordConfirm;
    const showPasswordMismatch = tab === 'register' && form.passwordConfirm.length > 0 && !passwordsMatch;

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'register') {
                if (!allRequirementsMet) {
                    setError('Password does not meet all requirements');
                    return;
                }
                if (!passwordsMatch) {
                    setError('Passwords must match');
                    return;
                }
                const { passwordConfirm: _, ...registerData } = form;
                await auth.register(registerData);
                navigate('/onboarding');
            } else {
                await auth.login(form.email, form.password);
                navigate(auth.hasCompletedOnboarding() ? '/cv' : '/onboarding');
            }
        } catch (err) {
            setError(err?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            {/* Left panel */}
            <div style={styles.leftPanel}>
                <div style={styles.leftContent}>
                    <div style={styles.logoBadge}>
                        flow<span style={{ color: 'var(--accent-cyan)' }}>job</span>
                    </div>
                    <h2 style={{ lineHeight: 1.2, marginBottom: '1rem' }}>
                        Your career,<br />
                        <span className="gradient-text">on your terms.</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
                        Map your skills, set your boundaries, and get matched with jobs you'll actually want to take.
                    </p>
                    <div style={styles.testimonial}>
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            "Found my current role in 3 days. Never sent a resume."
                        </p>
                        <p style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 600 }}>
                            — Senior Go Developer, Berlin
                        </p>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div style={styles.rightPanel}>
                <div style={styles.formCard}>
                    {/* Tabs */}
                    <div style={styles.tabs}>
                        {['register', 'login'].map(t => (
                            <button
                                key={t}
                                style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
                                onClick={() => { setTab(t); setError(''); }}
                            >
                                {t === 'register' ? 'Create Account' : 'Sign In'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={tab}
                            onSubmit={handleSubmit}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ marginTop: '1.5rem' }}
                        >
                            {/* Removed Full Name field */}
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="jan@example.com" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
                                {tab === 'register' && (
                                    <div style={styles.checklistWrap}>
                                        {passwordRequirements.map(req => (
                                            <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span style={{
                                                    color: req.met ? 'var(--accent-green)' : 'var(--text-secondary)',
                                                    transition: 'color 0.2s',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {req.met ? '✓' : '○'}
                                                </span>
                                                <span style={{
                                                    color: req.met ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    fontSize: '0.8rem',
                                                    transition: 'color 0.2s'
                                                }}>
                                                    {req.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {tab === 'register' && (
                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <input
                                        className="form-input"
                                        type="password"
                                        name="passwordConfirm"
                                        value={form.passwordConfirm}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        style={showPasswordMismatch ? { borderColor: 'var(--accent-red)' } : undefined}
                                    />
                                    {showPasswordMismatch && (
                                        <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            )}

                            {error && (
                                <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-full"
                                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
                                disabled={loading || (tab === 'register' && (showPasswordMismatch || !allRequirementsMet))}
                            >
                                {loading ? 'Loading...' : tab === 'register' ? 'Create Account →' : 'Sign In →'}
                            </button>
                        </motion.form>
                    </AnimatePresence>
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
    leftPanel: {
        flex: '1 1 420px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 3rem',
    },
    leftContent: {
        maxWidth: '360px',
    },
    logoBadge: {
        fontSize: '1.5rem',
        fontWeight: 800,
        marginBottom: '2rem',
        color: 'var(--text-primary)',
    },
    testimonial: {
        marginTop: '2.5rem',
        padding: '1.25rem',
        background: 'var(--bg-elevated)',
        borderLeft: '3px solid var(--accent-cyan)',
        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
    },
    rightPanel: {
        flex: '1 1 400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 3rem',
    },
    formCard: {
        width: '100%',
        maxWidth: '400px',
    },
    tabs: {
        display: 'flex',
        gap: '0',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        padding: '4px',
    },
    tab: {
        flex: 1,
        padding: '0.55rem',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        background: 'none',
        color: 'var(--text-secondary)',
        font: 'inherit',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    tabActive: {
        background: 'var(--bg-elevated)',
        color: 'var(--accent-cyan)',
        boxShadow: '0 0 0 1px var(--border)',
    },
    checklistWrap: {
        marginTop: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        padding: '0.25rem 0.5rem',
    }
};
