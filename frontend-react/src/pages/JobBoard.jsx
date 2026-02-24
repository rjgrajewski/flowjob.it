import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { api, auth } from '../services/api.js';
import { useOffers } from '../hooks/useOffers.js';
import JobCard from '../components/JobCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SparklesBg from '../components/Sparkles.jsx';

export default function JobBoard() {
    const { offers: jobs, loading } = useOffers();
    const [userSkills, setUserSkills] = useState([]);
    const [antiSkills, setAntiSkills] = useState([]);

    // Filters
    const [locationFilter, setLocationFilter] = useState('');
    const [operatingModeFilter, setOperatingModeFilter] = useState('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');

    useEffect(() => {
        const loadUserSkills = async () => {
            const user = auth.getUser();
            if (user) {
                const cv = await api.getUserCV(user.id);
                setUserSkills(cv.skills || []);
                setAntiSkills(cv.antiSkills || []);
            }
        };
        loadUserSkills();
    }, []);

    // Derive unique filter options from loaded data
    const filterOptions = useMemo(() => {
        const unique = (key) => [...new Set(jobs.map(j => j[key]).filter(Boolean))].sort();
        return {
            location: unique('location'),
            operatingMode: unique('operatingMode'),
            employmentType: unique('employmentType'),
        };
    }, [jobs]);

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
            if (locationFilter && job.location !== locationFilter) return false;
            if (operatingModeFilter && job.operatingMode !== operatingModeFilter) return false;
            if (employmentTypeFilter && job.employmentType !== employmentTypeFilter) return false;
            return true;
        });
    }, [processedJobs, locationFilter, operatingModeFilter, employmentTypeFilter]);

    const blockedCount = jobs.length - processedJobs.length;

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
                                    Found <strong style={{ color: 'var(--text-primary)' }}>{filteredJobs.length}</strong> offers
                                    {antiSkills.length > 0 && blockedCount > 0 && (
                                        <> · <span style={{ color: 'var(--accent-red)' }}>{blockedCount} blocked</span> by anti-skills</>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Filter bar */}
                <FilterBar
                    locationFilter={locationFilter} setLocationFilter={setLocationFilter}
                    operatingModeFilter={operatingModeFilter} setOperatingModeFilter={setOperatingModeFilter}
                    employmentTypeFilter={employmentTypeFilter} setEmploymentTypeFilter={setEmploymentTypeFilter}
                    locationOptions={filterOptions.location}
                    operatingModeOptions={filterOptions.operatingMode}
                    employmentTypeOptions={filterOptions.employmentType}
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
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No offers found</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Try changing your filters or lowering the minimum match percentage.
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
