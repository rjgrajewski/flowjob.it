import CustomSelect from './CustomSelect.jsx';

export default function FilterBar({
    locationFilter, setLocationFilter,
    operatingModeFilter, setOperatingModeFilter,
    employmentTypeFilter, setEmploymentTypeFilter,
    locationOptions, operatingModeOptions, employmentTypeOptions,
}) {
    return (
        <div style={styles.wrapper}>
            <CustomSelect
                label="Location"
                value={locationFilter}
                options={locationOptions}
                onChange={setLocationFilter}
            />

            <CustomSelect
                label="Operating Mode"
                value={operatingModeFilter}
                options={operatingModeOptions}
                onChange={setOperatingModeFilter}
            />

            <CustomSelect
                label="Employment Type"
                value={employmentTypeFilter}
                options={employmentTypeOptions}
                onChange={setEmploymentTypeFilter}
            />
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
    },
};

