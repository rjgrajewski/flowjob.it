import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomSelect({ label, value, options, onChange, placeholder = "All" }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = value || placeholder;

    return (
        <div style={styles.container} ref={containerRef}>
            {label && <label style={styles.label}>{label}</label>}

            <div
                style={{
                    ...styles.selectBox,
                    borderColor: isOpen ? 'var(--accent-cyan)' : 'var(--border)',
                    boxShadow: isOpen ? '0 0 0 3px rgba(0, 229, 255, 0.12)' : 'none'
                }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {selectedLabel}
                </span>

                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    style={styles.chevron}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.span>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        style={styles.dropdown}
                    >
                        <li
                            className="select-option"
                            style={{
                                ...styles.option,
                                color: !value ? 'var(--accent-cyan)' : 'var(--text-primary)',
                                background: !value ? 'rgba(0, 229, 255, 0.08)' : 'transparent'
                            }}
                            onClick={() => {
                                onChange("");
                                setIsOpen(false);
                            }}
                        >
                            {placeholder}
                        </li>
                        {options.map((option) => (
                            <li
                                key={option}
                                className="select-option"
                                style={{
                                    ...styles.option,
                                    color: value === option ? 'var(--accent-cyan)' : 'var(--text-primary)',
                                    background: value === option ? 'rgba(0, 229, 255, 0.08)' : 'transparent'
                                }}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                            >
                                {option}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 160px',
        minWidth: 0,
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: '0.3rem',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
    },
    selectBox: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        height: '45px', // Match standard form-input height
        transition: 'all 0.2s ease',
        userSelect: 'none',
    },
    chevron: {
        display: 'flex',
        alignItems: 'center',
        color: 'var(--text-secondary)',
    },
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.5rem',
        margin: 0,
        listStyle: 'none',
        zIndex: 1000,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        maxHeight: '250px',
        overflowY: 'auto',
    },
    option: {
        padding: '0.6rem 0.8rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    }
};
