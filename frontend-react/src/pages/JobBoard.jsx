import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { api, auth } from '../services/api.js';
import { useOffers } from '../hooks/useOffers.js';
import JobCard from '../components/JobCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import SparklesBg from '../components/Sparkles.jsx';

export default function JobBoard() {
    const { offers: jobs, loading } = useOffers();
    const [userSkills, setUserSkills] = useState(new Set());
    const [antiSkills, setAntiSkills] = useState(new Set());

    const initialLoadDone = useRef(false);

    // Filters
    const [locationFilter, setLocationFilter] = useState('');
    const [operatingModeFilter, setOperatingModeFilter] = useState('');
    const [employmentTypeFilter, setEmploymentTypeFilter] = useState('');

    useEffect(() => {
        const loadUserSkills = async () => {
            const user = auth.getUser();
            if (user) {
                const cv = await api.getUserCV(user.id);
                setUserSkills(new Set(cv.skills || []));
                setAntiSkills(new Set(cv.antiSkills || []));
                setTimeout(() => { initialLoadDone.current = true; }, 100);
            }
        };
        loadUserSkills();
    }, []);

    // Initial server load sort config
    const [initialSortConfig, setInitialSortConfig] = useState([]);

    // Auto-save changes (can be same 1000ms delay or different)
    useEffect(() => {
        if (!initialLoadDone.current) return;
        const user = auth.getUser();
        if (!user) return;

        const timer = setTimeout(async () => {
            try {
                await api.saveUserCV(user.id, {
                    skills: [...userSkills],
                    antiSkills: [...antiSkills]
                });
            } catch (e) {
                console.error("Failed to save skills from JobBoard:", e);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [userSkills, antiSkills]);

    const handleToggleSkill = useCallback((skill) => {
        setAntiSkills(prev => {
            if (prev.has(skill)) {
                const next = new Set(prev);
                next.delete(skill);
                return next;
            }
            return prev;
        });
        setUserSkills(prev => {
            const next = new Set(prev);
            if (next.has(skill)) {
                next.delete(skill);
            } else {
                next.add(skill);
            }
            return next;
        });
    }, []);

    const handleToggleAnti = useCallback((skill) => {
        setUserSkills(prev => {
            if (prev.has(skill)) {
                const next = new Set(prev);
                next.delete(skill);
                return next;
            }
            return prev;
        });
        setAntiSkills(prev => {
            const next = new Set(prev);
            if (next.has(skill)) {
                next.delete(skill);
            } else {
                next.add(skill);
            }
            return next;
        });
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

    // Calculate initial sorting order when jobs load or filters change
    useEffect(() => {
        if (!initialLoadDone.current) return;

        const sorted = [...jobs].sort((a, b) => {
            // Very simple initial sort based on what User already had saved
            const reqA = a.requiredSkills || [];
            const reqB = b.requiredSkills || [];
            const scoreA = reqA.length > 0 ? (reqA.filter(s => userSkills.has(s)).length / reqA.length) * 100 : 0;
            const scoreB = reqB.length > 0 ? (reqB.filter(s => userSkills.has(s)).length / reqB.length) * 100 : 0;
            return scoreB - scoreA;
        });

        setInitialSortConfig(sorted.map(s => s.id));
        // ONLY run when these arrays change length to avoid infinite re-renders on skill click
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jobs.length, locationFilter, operatingModeFilter, employmentTypeFilter]);

    const filteredJobs = useMemo(() => {
        return jobs
            .filter(job => {
                if (locationFilter && job.location !== locationFilter) return false;
                if (operatingModeFilter && job.operatingMode !== operatingModeFilter) return false;
                if (employmentTypeFilter && job.employmentType !== employmentTypeFilter) return false;
                return true;
            })
            // NOTE: We do not sort by dynamic userSkills score here anymore. 
            // We only sort by the initial static configuration. The counter inside the card handles the score visualization.
            .sort((a, b) => {
                const indexA = initialSortConfig.indexOf(a.id);
                const indexB = initialSortConfig.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
    }, [jobs, locationFilter, operatingModeFilter, employmentTypeFilter, initialSortConfig]);

    const blockedCount = useMemo(() => {
        return jobs.filter(job => job.requiredSkills?.some(s => antiSkills.has(s))).length;
    }, [jobs, antiSkills]);

    // Convert Sets to Arrays once to avoid reallocating inside the render loop for every JobCard
    const userSkillsArray = useMemo(() => Array.from(userSkills), [userSkills]);
    const antiSkillsArray = useMemo(() => Array.from(antiSkills), [antiSkills]);

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
                                    {antiSkills.size > 0 && blockedCount > 0 && (
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
                    <>
                        {filteredJobs.map((job, i) => {
                            const uniqueKey = job.id || job.url || `${job.title}-${job.company}-${i}`;
                            return (
                                <JobCard
                                    key={uniqueKey}
                                    job={job}
                                    userSkills={userSkillsArray}
                                    antiSkills={antiSkillsArray}
                                    onToggleSkill={handleToggleSkill}
                                    onToggleAnti={handleToggleAnti}
                                />
                            );
                        })}
                    </>
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
