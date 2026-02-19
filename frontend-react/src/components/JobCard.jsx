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

export default function JobCard({ job, userSkills = [] }) {
    const matchedSkills = new Set(userSkills);

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
                <div>
                    <h3 style={styles.title}>{job.title}</h3>
                    <p style={styles.company}>{job.company}</p>
                </div>
                <MatchScore score={job.score} />
            </div>

            {/* Skill Badges */}
            <div style={styles.badges}>
                {job.requiredSkills?.map((skill) => (
                    <SkillBadge key={skill} skill={skill} matched={matchedSkills.has(skill)} />
                ))}
            </div>

            {/* Description */}
            {job.description && (
                <p style={styles.description}>{job.description}</p>
            )}

            {/* Footer */}
            <div style={styles.footer}>
                <button className="btn btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                    Zobacz szczegóły
                </button>
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
    badges: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        marginBottom: '0.75rem',
    },
    description: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: '0.75rem',
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-start',
    },
};
