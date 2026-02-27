import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../services/api.js';

export default function Navbar() {
    const [user, setUser] = useState(auth.getUser());
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setUser(auth.getUser());
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        auth.logout();
        setUser(null);
        navigate('/');
    };

    const initials = user?.name
        ? user.name.slice(0, 2).toUpperCase()
        : user?.email
            ? user.email.slice(0, 2).toUpperCase()
            : '?';

    return (
        <header style={styles.header}>
            <div className="container" style={styles.inner}>
                {/* Logo */}
                <NavLink to="/" style={styles.logo}>
                    flowjob<span style={styles.logoAccent}>.it</span>
                </NavLink>

                {/* Nav Links (authenticated users only) */}
                <nav style={styles.nav}>
                    {user && (
                        <>
                            <NavLink to="/jobs" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}>
                                Offers
                            </NavLink>
                            <NavLink to="/my-skills" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}>
                                My Skills
                            </NavLink>
                            <NavLink to="/my-cv" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}>
                                My CV
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Right side */}
                <div style={styles.right}>
                    {user ? (
                        <div style={styles.avatarGroup}>
                            <div style={styles.avatar}>{initials}</div>
                            <button onClick={handleLogout} style={styles.logoutBtn}>
                                Logout
                            </button>
                        </div>
                    ) : (
                        <NavLink to="/get-started?tab=login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                            Get Started →
                        </NavLink>
                    )}
                </div>
            </div>
        </header>
    );
}

const styles = {
    header: {
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        background: 'rgba(13, 17, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
    },
    inner: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
    },
    logo: {
        fontSize: '1.4rem',
        fontWeight: 800,
        color: 'var(--text-primary)',
        textDecoration: 'none',
        letterSpacing: '-0.02em',
        flexShrink: 0,
    },
    logoAccent: {
        color: 'var(--accent-cyan)',
    },
    nav: {
        display: 'flex',
        gap: '0.25rem',
        alignItems: 'center',
    },
    link: {
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: 500,
        padding: '0.4rem 0.85rem',
        borderRadius: 'var(--radius-pill)',
        transition: 'all 0.15s',
    },
    linkActive: {
        color: 'var(--accent-cyan)',
        background: 'rgba(0, 229, 255, 0.08)',
    },
    right: {
        flexShrink: 0,
    },
    avatarGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    avatar: {
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#000',
    },
    logoutBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontFamily: 'inherit',
        padding: '0.25rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        transition: 'color 0.15s',
    },
};
