export default function FilterBar({
    titleFilter, setTitleFilter,
    minMatch, setMinMatch,
    locationFilter, setLocationFilter,
    operatingModeFilter, setOperatingModeFilter,
    employmentTypeFilter, setEmploymentTypeFilter,
    experienceFilter, setExperienceFilter,
    locationOptions, operatingModeOptions, employmentTypeOptions, experienceOptions,
}) {
    return (
        <div style={styles.wrapper}>
            {/* Title search */}
            <div style={styles.field}>
                <label style={styles.label}>Job Title</label>
                <input
                    className="form-input"
                    placeholder="Search by title..."
                    value={titleFilter}
                    onChange={e => setTitleFilter(e.target.value)}
                    style={styles.input}
                />
            </div>

            {/* Lokalizacja */}
            <div style={styles.field}>
                <label style={styles.label}>Location</label>
                <select
                    className="form-input"
                    value={locationFilter}
                    onChange={e => setLocationFilter(e.target.value)}
                    style={styles.input}
                >
                    <option value="">All</option>
                    {locationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            {/* Tryb pracy */}
            <div style={styles.field}>
                <label style={styles.label}>Operating Mode</label>
                <select
                    className="form-input"
                    value={operatingModeFilter}
                    onChange={e => setOperatingModeFilter(e.target.value)}
                    style={styles.input}
                >
                    <option value="">All</option>
                    {operatingModeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            {/* Rodzaj zatrudnienia */}
            <div style={styles.field}>
                <label style={styles.label}>Employment Type</label>
                <select
                    className="form-input"
                    value={employmentTypeFilter}
                    onChange={e => setEmploymentTypeFilter(e.target.value)}
                    style={styles.input}
                >
                    <option value="">All</option>
                    {employmentTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            {/* Poziom */}
            <div style={styles.field}>
                <label style={styles.label}>Experience Level</label>
                <select
                    className="form-input"
                    value={experienceFilter}
                    onChange={e => setExperienceFilter(e.target.value)}
                    style={styles.input}
                >
                    <option value="">All</option>
                    {experienceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>

            {/* Min match */}
            <div style={{ ...styles.field, flex: '0 0 auto' }}>
                <label style={styles.label}>Min Match %</label>
                <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={minMatch}
                    onChange={e => setMinMatch(Number(e.target.value))}
                    style={{ ...styles.input, width: '100px' }}
                />
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        gap: '0.75rem',
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
    input: {
        minWidth: 0,
    },
};
