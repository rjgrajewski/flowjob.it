export const YearPicker = ({ label, value, onChange, disabled }) => {
    // value is expected to be a string like "2023" or "2023-01-01"
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 40 }, (_, i) => currentYear - i);

    // Extract just the year part for display/state
    const displayValue = value ? String(value).split('-')[0] : '';

    return (
        <div style={{ flex: 1 }}>
            <label style={styles.label}>{label}</label>
            <select
                style={{ ...styles.input, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                value={displayValue}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
            >
                <option value="">Select Year...</option>
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
    );
};

const styles = {
    label: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        marginBottom: '0.25rem',
        display: 'block'
    },
    input: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.75rem',
        color: 'var(--text-primary)',
        width: '100%',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
    }
};
