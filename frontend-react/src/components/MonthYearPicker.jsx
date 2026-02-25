import { useState } from 'react';

export const MonthYearPicker = ({ label, value, onChange, disabled }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

    // Initial value parsing (expected YYYY-MM-DD)
    const [selectedYear, setSelectedYear] = useState(value ? value.split('-')[0] : currentYear);
    const [selectedMonth, setSelectedMonth] = useState(value ? parseInt(value.split('-')[1]) : 1);
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (mIdx) => {
        const month = (mIdx + 1).toString().padStart(2, '0');
        const newValue = `${selectedYear}-${month}-01`;
        onChange(newValue);
        setSelectedMonth(mIdx + 1);
        setIsOpen(false);
    };

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <label style={styles.label}>{label}</label>
            <div
                style={{ ...styles.input, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {value ? `${months[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}` : 'Select...'}
            </div>

            {isOpen && (
                <div style={styles.pickerPopup}>
                    <div style={styles.pickerHeader}>
                        <button onClick={() => setSelectedYear(y => parseInt(y) - 1)} style={styles.pickerArrow}>&lt;</button>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(e.target.value)}
                            style={styles.yearSelect}
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={() => setSelectedYear(y => parseInt(y) + 1)} style={styles.pickerArrow}>&gt;</button>
                    </div>
                    <div style={styles.monthGrid}>
                        {months.map((m, i) => (
                            <div
                                key={m}
                                onClick={() => handleSelect(i)}
                                style={{
                                    ...styles.monthItem,
                                    background: (selectedMonth === i + 1 && value?.startsWith(selectedYear)) ? 'var(--accent-cyan)' : 'transparent',
                                    color: (selectedMonth === i + 1 && value?.startsWith(selectedYear)) ? '#000' : '#fff'
                                }}
                            >
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    label: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
    },
    input: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem',
        color: 'var(--text-primary)',
        width: '100%',
    },
    pickerPopup: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        width: '240px',
        background: 'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        zIndex: 100,
        marginBottom: '0.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    },
    pickerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    pickerArrow: {
        background: 'none',
        border: 'none',
        color: 'var(--accent-cyan)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '0 0.5rem',
    },
    yearSelect: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'center',
    },
    monthGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
    },
    monthItem: {
        padding: '0.4rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.05)',
    }
};
