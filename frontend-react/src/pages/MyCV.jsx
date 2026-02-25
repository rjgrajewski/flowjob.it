import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { api, auth } from '../services/api.js';

export default function MyCV() {
    const [profileData, setProfileData] = useState(null);
    const [skillsData, setSkillsData] = useState({ skills: [], antiSkills: [] });
    const [loading, setLoading] = useState(true);

    // Customization state
    const [primaryColor, setPrimaryColor] = useState('#00e5ff');
    const [fontFamily, setFontFamily] = useState('Inter, sans-serif');

    const printRef = useRef();

    useEffect(() => {
        const loadCVData = async () => {
            try {
                // Get profile from local storage (saved during onboarding)
                const storedProfile = localStorage.getItem('flowjob_profile');
                if (storedProfile) {
                    setProfileData(JSON.parse(storedProfile));
                }

                // Get skills from API
                const user = auth.getUser();
                if (user && user.id) {
                    const cv = await api.getUserCV(user.id);
                    setSkillsData(cv);
                }
            } catch (err) {
                console.error("Failed to load CV data", err);
            } finally {
                setLoading(false);
            }
        };

        loadCVData();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={styles.loaderContainer}>
                <div style={styles.loader}></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div style={styles.emptyState}>
                <h2>No Profile Data Found</h2>
                <p>Please complete the onboarding process to generate your CV.</p>
            </div>
        );
    }

    const { profile, education, experience } = profileData;

    return (
        <div style={styles.page}>
            {/* Sidebar Tools - hidden during print via CSS */}
            <aside className="cv-tools" style={styles.sidebar}>
                <h3 style={styles.sidebarTitle}>Customize CV</h3>

                <div style={styles.toolSection}>
                    <label style={styles.label}>Accent Color</label>
                    <div style={styles.colorPicker}>
                        {['#00e5ff', '#7c3aed', '#00e676', '#ff5370', '#ffa500'].map(color => (
                            <button
                                key={color}
                                onClick={() => setPrimaryColor(color)}
                                style={{
                                    ...styles.colorBtn,
                                    background: color,
                                    border: primaryColor === color ? '2px solid white' : '2px solid transparent'
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div style={styles.toolSection}>
                    <label style={styles.label}>Font Family</label>
                    <select
                        style={styles.select}
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                    >
                        <option value="Inter, sans-serif">Inter (Modern)</option>
                        <option value="Roboto, sans-serif">Roboto (Clean)</option>
                        <option value="Merriweather, serif">Merriweather (Classic)</option>
                        <option value="Outfit, sans-serif">Outfit (Geometric)</option>
                    </select>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePrint}
                    style={{ ...styles.printBtn, background: primaryColor }}
                >
                    Download PDF / Print
                </motion.button>
            </aside>

            {/* CV Document */}
            <div className="cv-document-wrapper" style={styles.documentWrapper}>
                <div
                    ref={printRef}
                    className="cv-document"
                    style={{ ...styles.document, fontFamily }}
                >
                    {/* Header */}
                    <header style={{ ...styles.cvHeader, borderBottomColor: primaryColor }}>
                        <div style={styles.headerLeft}>
                            <h1 style={{ ...styles.name, color: primaryColor }}>
                                {profile.first_name} {profile.last_name}
                            </h1>
                            <p style={styles.contactInfo}>
                                {profile.location && <span>📍 {profile.location}</span>}
                                {profile.contact_email && <span>📧 {profile.contact_email}</span>}
                                {profile.phone_number && <span>📱 {profile.phone_number}</span>}
                            </p>
                        </div>
                    </header>

                    <div style={styles.cvBody}>
                        {/* Main Content Area */}
                        <div style={styles.mainColumn}>
                            {/* Bio */}
                            {profile.bio && (
                                <section style={styles.section}>
                                    <h2 style={{ ...styles.sectionTitle, color: primaryColor }}>About Me</h2>
                                    <p style={styles.bioText}>{profile.bio}</p>
                                </section>
                            )}

                            {/* Experience */}
                            {experience && experience.length > 0 && (
                                <section style={styles.section}>
                                    <h2 style={{ ...styles.sectionTitle, color: primaryColor }}>Experience</h2>
                                    <div style={styles.timeline}>
                                        {experience.map((exp, idx) => (
                                            <div key={idx} style={styles.timelineItem}>
                                                <div style={{ ...styles.timelineDot, background: primaryColor }} />
                                                <div style={styles.timelineContent}>
                                                    <h3 style={styles.jobTitle}>{exp.job_title}</h3>
                                                    <div style={styles.companyRow}>
                                                        <span style={styles.companyName}>{exp.company_name}</span>
                                                        <span style={styles.dateRange}>
                                                            {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                                                        </span>
                                                    </div>
                                                    {exp.description && <p style={styles.description}>{exp.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar Column */}
                        <div style={styles.sideColumn}>
                            {/* Skills */}
                            {skillsData.skills && skillsData.skills.length > 0 && (
                                <section style={styles.section}>
                                    <h2 style={{ ...styles.sectionTitle, color: primaryColor }}>Skills</h2>
                                    <div style={styles.skillsList}>
                                        {skillsData.skills.map(skill => (
                                            <span
                                                key={skill}
                                                style={{ ...styles.skillTag, borderColor: primaryColor, color: primaryColor }}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Education */}
                            {education && education.length > 0 && (
                                <section style={styles.section}>
                                    <h2 style={{ ...styles.sectionTitle, color: primaryColor }}>Education</h2>
                                    <div style={styles.itemContainer}>
                                        {education.map((edu, idx) => (
                                            <div key={idx} style={styles.eduItem}>
                                                <h3 style={styles.eduDegree}>{edu.field_of_study}</h3>
                                                <p style={styles.eduSchool}>{edu.school_name}</p>
                                                {edu.specialization && <p style={styles.eduSpecialization}>{edu.specialization}</p>}
                                                {edu.graduation_year && <p style={styles.eduYear}>Graduated {edu.graduation_year}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: A4; }
                    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .cv-tools { display: none !important; }
                    header, footer { display: none; }
                    .cv-document-wrapper { padding: 0 !important; width: 100% !important; height: auto !important; max-width: none !important; margin: 0 !important;}
                    .cv-document { 
                        box-shadow: none !important; 
                        width: 100% !important; 
                        max-width: none !important;
                        min-height: 100vh !important;
                        margin: 0 !important; 
                        border-radius: 0 !important;
                    }
                }
            `}} />
        </div>
    );
}

const styles = {
    page: {
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-surface)',
        flexWrap: 'wrap',
    },
    sidebar: {
        width: '300px',
        padding: '2rem',
        borderRight: '1px solid var(--border)',
        background: 'rgba(13, 17, 23, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    sidebarTitle: {
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.5rem',
    },
    toolSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    colorPicker: {
        display: 'flex',
        gap: '0.75rem',
    },
    colorBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    select: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem',
        cursor: 'pointer',
        outline: 'none',
    },
    printBtn: {
        marginTop: 'auto',
        color: '#000',
        fontWeight: 700,
        border: 'none',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontSize: '1rem',
        boxShadow: '0 4px 14px rgba(0, 229, 255, 0.3)',
    },
    documentWrapper: {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        background: 'var(--bg-base)',
    },
    document: {
        background: '#ffffff',
        width: '100%',
        maxWidth: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        padding: '40mm 30mm',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        borderRadius: '4px',
        color: '#333333',
        lineHeight: 1.6,
        boxSizing: 'border-box',
    },
    cvHeader: {
        borderBottom: '3px solid',
        paddingBottom: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    name: {
        fontSize: '3.5rem',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        margin: '0 0 0.5rem -2px',
        lineHeight: 1.1,
        textTransform: 'uppercase',
    },
    contactInfo: {
        display: 'flex',
        gap: '1.5rem',
        fontSize: '0.9rem',
        color: '#666',
        flexWrap: 'wrap',
    },
    cvBody: {
        display: 'flex',
        gap: '3rem',
    },
    mainColumn: {
        flex: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
    },
    sideColumn: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2.5rem',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    sectionTitle: {
        fontSize: '1.25rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: 0,
        borderBottom: '1px solid #eee',
        paddingBottom: '0.5rem',
    },
    bioText: {
        fontSize: '1rem',
        color: '#444',
    },
    timeline: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    timelineItem: {
        position: 'relative',
        paddingLeft: '1.5rem',
        borderLeft: '2px solid #eee',
    },
    timelineDot: {
        position: 'absolute',
        left: '-7px',
        top: '6px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: '3px solid white',
    },
    jobTitle: {
        fontSize: '1.15rem',
        fontWeight: 700,
        color: '#222',
        margin: '0 0 0.25rem 0',
    },
    companyRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '0.5rem',
    },
    companyName: {
        fontWeight: 600,
        color: '#555',
    },
    dateRange: {
        fontSize: '0.85rem',
        color: '#888',
        fontWeight: 500,
    },
    description: {
        fontSize: '0.95rem',
        color: '#444',
        margin: 0,
        whiteSpace: 'pre-line',
    },
    skillsList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    skillTag: {
        fontSize: '0.85rem',
        fontWeight: 600,
        padding: '0.2rem 0.6rem',
        border: '1px solid',
        borderRadius: '4px',
        background: 'rgba(0,0,0,0.02)',
    },
    eduItem: {
        marginBottom: '1rem',
    },
    eduDegree: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#222',
        margin: '0 0 0.25rem 0',
    },
    eduSchool: {
        fontSize: '0.95rem',
        color: '#555',
        margin: '0 0 0.15rem 0',
    },
    eduSpecialization: {
        fontSize: '0.85rem',
        color: '#666',
        margin: '0 0 0.15rem 0',
        fontStyle: 'italic',
    },
    eduYear: {
        fontSize: '0.85rem',
        color: '#888',
        margin: 0,
    },
    loaderContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
    },
    loader: {
        width: '40px',
        height: '40px',
        border: '4px solid var(--border)',
        borderTopColor: 'var(--accent-cyan)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 64px)',
        color: 'var(--text-secondary)',
    }
};
