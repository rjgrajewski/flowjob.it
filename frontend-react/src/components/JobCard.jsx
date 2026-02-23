// JobCard — faithful to mockup design
import { motion } from 'framer-motion';

export function MatchScore({ score }) {
    const cls = score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';
    return (
        <span className={`match-score ${cls}`}>
            {score}% Match
        </span>
    );
}

export function SkillBadge({ skill, matched }) {
    return (
        <span className={`badge ${matched ? 'matched' : ''}`}>
            {skill}
        </span>
    );
}

const META_ICONS = {
    location: '📍',
    operatingMode: '💻',
    employmentType: '📋',
    experience: '⭐',
    workSchedule: '🕐',
};

function MetaChip({ icon, label }) {
    if (!label) return null;
    return (
        <span style={styles.metaChip}>
            <span style={styles.metaIcon}>{icon}</span>
            {label}
        </span>
    );
}

export default function JobCard({ job, userSkills = [] }) {
    const matchedSkills = new Set(userSkills);

    const hasMeta = job.location || job.operatingMode || job.employmentType || job.experience || job.workSchedule;

    return (
        <motion.div
            className="card"
            style={styles.card}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileHover={{ borderColor: job.score >= 90 ? 'rgba(0,229,255,0.4)' : job.score >= 70 ? 'rgba(255,215,64,0.3)' : 'var(--border)' }}
            transition={{ duration: 0.2 }}
        >
            {/* Header Row */}
            <div style={styles.header}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={styles.title}>{job.title}</h3>
                    <p style={styles.company}>{job.company}</p>
                </div>
                <div style={styles.badges_right}>
                    {job.salary && (
                        <span style={styles.salaryBadge}>{job.salary}</span>
                    )}
                    <MatchScore score={job.score} />
                </div>
            </div>

            {/* Metadata chips */}
            {hasMeta && (
                <div style={styles.metaRow}>
                    <MetaChip icon={META_ICONS.location} label={job.location} />
                    <MetaChip icon={META_ICONS.operatingMode} label={job.operatingMode} />
                    <MetaChip icon={META_ICONS.employmentType} label={job.employmentType} />
                    <MetaChip icon={META_ICONS.experience} label={job.experience} />
                    <MetaChip icon={META_ICONS.workSchedule} label={job.workSchedule} />
                </div>
            )}

            {/* Skill Badges */}
            {job.requiredSkills?.length > 0 && (
                <div style={styles.skillBadges}>
                    {job.requiredSkills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} matched={matchedSkills.has(skill)} />
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={styles.footer}>
                <a
                    href={job.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', textDecoration: 'none' }}
                >
                    Zobacz szczegóły
                </a>
            </div>
        </motion.div>
    );
}

const styles = {
    card: {
        marginBottom: '0.75rem',
        cursor: 'default',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '0.75rem',
    },
    badges_right: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.35rem',
        flexShrink: 0,
    },
    title: {
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.15rem',
    },
    company: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
    },
    salaryBadge: {
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#4ade80',
        background: 'rgba(74,222,128,0.12)',
        border: '1px solid rgba(74,222,128,0.25)',
        borderRadius: '6px',
        padding: '0.2rem 0.6rem',
        whiteSpace: 'nowrap',
    },
    metaRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        marginBottom: '0.65rem',
    },
    metaChip: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '0.2rem 0.55rem',
    },
    metaIcon: {
        fontSize: '0.72rem',
        lineHeight: 1,
    },
    skillBadges: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        marginBottom: '0.75rem',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-start',
    },
};
