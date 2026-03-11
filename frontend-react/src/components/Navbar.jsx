import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth } from '../services/api.js';
import './Navbar.css';

export default function Navbar() {
    const [user, setUser] = useState(auth.getUser());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
        setIsMobileMenuOpen(false);
        navigate('/');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const initials = user?.name
        ? user.name.slice(0, 2).toUpperCase()
        : user?.email
            ? user.email.slice(0, 2).toUpperCase()
            : '?';

    return (
        <header className="navbar-header">
            <div className="container navbar-inner">
                {/* Logo */}
                <NavLink to={user ? "/jobs" : "/"} className="navbar-logo" onClick={closeMobileMenu}>
                    flowjob<span className="navbar-logo-accent">.it</span>
                </NavLink>

                {/* Desktop Nav Links */}
                <nav className="navbar-nav">
                    {user && (
                        <>
                            <NavLink to="/story" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                About
                            </NavLink>
                            <NavLink to="/jobs" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                Jobs
                            </NavLink>
                            <NavLink to="/my-skills" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                Skills
                            </NavLink>
                            <NavLink to="/my-cv" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                                CV Builder
                            </NavLink>
                        </>
                    )}
                </nav>

                {/* Right side Desktop & Mobile Toggle */}
                <div className="navbar-right">
                    {user ? (
                        <>
                            <div className="navbar-avatar-group">
                                <div className="navbar-avatar">{initials}</div>
                                <button onClick={handleLogout} className="navbar-logout-btn">
                                    Logout
                                </button>
                            </div>
                            <button className="navbar-toggle-btn" onClick={toggleMobileMenu}>
                                {isMobileMenuOpen ? '✕' : '☰'}
                            </button>
                        </>
                    ) : (
                        <NavLink to="/get-started?tab=login" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem' }}>
                            Get Started →
                        </NavLink>
                    )}
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && user && (
                <div className="navbar-mobile-menu">
                    <nav className="navbar-nav">
                        <NavLink to="/story" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                            About
                        </NavLink>
                        <NavLink to="/jobs" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                            Jobs
                        </NavLink>
                        <NavLink to="/my-skills" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                            Skills
                        </NavLink>
                        <NavLink to="/my-cv" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                            CV Builder
                        </NavLink>
                    </nav>
                    <div className="navbar-avatar-group">
                        <div className="navbar-avatar">{initials}</div>
                        <button onClick={handleLogout} className="navbar-logout-btn" style={{ fontSize: '1.2rem' }}>
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}
