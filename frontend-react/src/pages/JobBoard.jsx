import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { api } from '../services/api.js';
import JobCard from '../components/JobCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SparklesBg from '../components/Sparkles.jsx';

export default function JobBoard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState([]);
    const [antiSkills, setAntiSkills] = useState([]);
    const [titleFilter, setTitleFilter] = useState('');
    const [minMatch, setMinMatch] = useState(30);

    useEffect(() => {
        const cv = api.getUserCV();
        setUserSkills(cv.skills || []);
        setAntiSkills(cv.antiSkills || []);
        api.getJobs().then(data => {
            setJobs(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const processedJobs = useMemo(() => {
        const skillSet = new Set(userSkills);
        const antiSet = new Set(antiSkills);

        return jobs
            .filter(job => {
                // Exclude anti-skills
                if (job.requiredSkills?.some(s => antiSet.has(s))) return false;
                return true;
            })
            .map(job => {
                const required = job.requiredSkills || [];
                const matched = required.filter(s => skillSet.has(s)).length;
                const score = required.length > 0 ? Math.round((matched / required.length) * 100) : 0;
                return { ...job, score };
            })
            .sort((a, b) => b.score - a.score);
    }, [jobs, userSkills, antiSkills]);

    const filteredJobs = useMemo(() => {
        return processedJobs.filter(job => {
            const titleOk = titleFilter === '' || job.title?.toLowerCase().includes(titleFilter.toLowerCase());
            const matchOk = job.score >= minMatch;
            return titleOk && matchOk;
        });
    }, [processedJobs, titleFilter, minMatch]);

    const hiddenCount = processedJobs.length - filteredJobs.length;

    return (
        <div style={{ position: 'relative' }}>
            <SparklesBg />
            <div className="container" style={{ maxWidth: '860px', padding: '2rem 1.5rem', position: 'relative', zIndex: 1 }}>
                {/* Page header */}
                <div style={styles.pageHeader}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Job Offers</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {loading ? 'Loading...' : (
                                <>
                                    Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredJobs.length}</strong> jobs
                                    {hiddenCount > 0 && (
                                        <> · <span style={{ color: 'var(--accent-red)' }}>{hiddenCount} hidden</span> by your filters</>
                                    )}
                                    {antiSkills.length > 0 && (
                                        <> · <span style={{ color: 'var(--accent-red)' }}>{jobs.length - processedJobs.length} blocked</span> by anti-skills</>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <FilterBar
                    titleFilter={titleFilter}
                    setTitleFilter={setTitleFilter}
                    minMatch={minMatch}
                    setMinMatch={setMinMatch}
                />

                {/* Job list */}
                {loading ? (
                    <div>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} style={styles.skeletonCard} />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div style={styles.emptyState}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No jobs found</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Try lowering the minimum match % or changing your search.
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredJobs.map((job, i) => (
                            <JobCard
                                key={job.id || job.title + job.company + i}
                                job={job}
                                userSkills={userSkills}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

const styles = {
    pageHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '1.25rem',
    },
    skeletonCard: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        height: '120px',
        marginBottom: '0.75rem',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        color: 'var(--text-secondary)',
    },
};
