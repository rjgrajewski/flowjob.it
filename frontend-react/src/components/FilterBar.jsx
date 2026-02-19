export default function FilterBar({ titleFilter, setTitleFilter, minMatch, setMinMatch }) {
    return (
        <div style={styles.wrapper}>
            <div style={styles.field}>
                <label style={styles.label}>Stanowisko</label>
                <input
                    className="form-input"
                    placeholder="Stanowisko"
                    value={titleFilter}
                    onChange={e => setTitleFilter(e.target.value)}
                    style={styles.input}
                />
            </div>
            <div style={styles.field}>
                <label style={styles.label}>Minimalne dopasowanie %</label>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={minMatch}
                    onChange={e => setMinMatch(Number(e.target.value))}
                    style={{ ...styles.input, width: '120px' }}
                />
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 200px',
    },
    label: {
        fontSize: '0.78rem',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: '0.35rem',
        letterSpacing: '0.02em',
    },
    input: {
        minWidth: 0,
    },
};
