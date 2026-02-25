import { useState, useEffect, useMemo } from 'react';
import { api, auth } from '../services/api.js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Svg, Path, Font, PDFDownloadLink } from '@react-pdf/renderer';

// Register Roboto for proper Polish character support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 }
    ]
});

const CVDocument = ({ profileData, skillsData }) => {
    const { profile, education, experience } = profileData;
    const primaryColor = '#00e5ff'; // Flowjob primary brand color

    const styles = useMemo(() => StyleSheet.create({
        page: {
            padding: 40,
            fontFamily: 'Roboto',
            backgroundColor: '#ffffff',
            color: '#374151',
            lineHeight: 1.5,
        },
        header: {
            marginBottom: 30,
            flexDirection: 'column',
            gap: 10,
        },
        name: {
            fontSize: 28,
            fontWeight: 700,
            color: '#111827',
            textTransform: 'uppercase',
            marginBottom: 5,
        },
        contactInfo: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 15,
            color: '#374151', // Darker for contrast, previously light gray
            fontSize: 10,
            borderTopWidth: 2,
            borderTopColor: primaryColor,
            paddingTop: 10,
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingTop: 2, // Slight top padding to center text visually with SVG path baseline
        },
        body: {
            flexDirection: 'row',
            gap: 20,
        },
        mainColumn: {
            width: '65%',
            flexDirection: 'column',
            gap: 20,
        },
        sideColumn: {
            width: '35%',
            flexDirection: 'column',
            gap: 20,
            paddingLeft: 20,
            borderLeftWidth: 1,
            borderLeftColor: '#e5e7eb',
        },
        section: {
            marginBottom: 10,
        },
        sectionTitle: {
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#111827', // Fix contrast, previously cyan
            marginBottom: 10,
            letterSpacing: 1,
        },
        bioText: {
            fontSize: 10,
            color: '#4b5563',
        },
        timelineItem: {
            marginBottom: 15,
        },
        jobHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 2,
        },
        jobTitle: {
            fontSize: 11,
            fontWeight: 700,
            color: '#111827',
        },
        dateRange: {
            fontSize: 8,
            color: '#4b5563', // Changed from cyan to avoid bleeding into white background
            textTransform: 'uppercase',
        },
        companyName: {
            fontSize: 10,
            color: '#6b7280',
            fontWeight: 700,
            marginBottom: 4,
        },
        description: {
            fontSize: 9,
            color: '#4b5563',
            lineHeight: 1.4,
        },
        skillsList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            alignContent: 'flex-start',
            gap: 6,
        },
        skillTagWrapper: {
            borderWidth: 1,
            borderColor: primaryColor,
            borderRadius: 12, // More pill-like
            paddingTop: 5,
            paddingBottom: 7, // Pushing bottom border down significantly to counter font baseline issues in PDF
            paddingLeft: 8,
            paddingRight: 8,
            backgroundColor: '#ffffff',
        },
        skillTagText: {
            fontSize: 9,
            color: '#111827',
            lineHeight: 1,
        },
        eduItem: {
            marginBottom: 10,
        },
        eduDegree: {
            fontSize: 10,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 2,
        },
        eduSchool: {
            fontSize: 9,
            color: '#4b5563',
            marginBottom: 2,
        },
        eduSpecialization: {
            fontSize: 8,
            color: '#6b7280',
            fontStyle: 'italic',
        },
        eduYear: {
            fontSize: 8,
            color: '#9ca3af',
            marginTop: 2,
        }
    }), []);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.name}>
                        {profile.first_name} {profile.last_name}
                    </Text>
                    <View style={styles.contactInfo}>
                        {profile.location && (
                            <View style={styles.contactItem}>
                                <Svg viewBox="0 0 24 24" width="10" height="10">
                                    <Path fill="none" stroke={primaryColor} strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <Path fill="none" stroke={primaryColor} strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </Svg>
                                <Text>{profile.location}</Text>
                            </View>
                        )}
                        {profile.contact_email && (
                            <View style={styles.contactItem}>
                                <Svg viewBox="0 0 24 24" width="10" height="10">
                                    <Path fill="none" stroke={primaryColor} strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </Svg>
                                <Text>{profile.contact_email}</Text>
                            </View>
                        )}
                        {profile.phone_number && (
                            <View style={styles.contactItem}>
                                <Svg viewBox="0 0 24 24" width="10" height="10">
                                    <Path fill="none" stroke={primaryColor} strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </Svg>
                                <Text>{profile.phone_number}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.body}>
                    <View style={styles.mainColumn}>
                        {profile.bio && (
                            <View style={styles.section} wrap={false}>
                                <Text style={styles.sectionTitle}>Professional Summary</Text>
                                <Text style={styles.bioText}>{profile.bio}</Text>
                            </View>
                        )}

                        {experience && experience.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Experience</Text>
                                {experience.map((exp, idx) => (
                                    <View key={idx} style={styles.timelineItem} wrap={false}>
                                        <View style={styles.jobHeader}>
                                            <Text style={styles.jobTitle}>{exp.job_title}</Text>
                                            <Text style={styles.dateRange}>
                                                {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date}
                                            </Text>
                                        </View>
                                        <Text style={styles.companyName}>{exp.company_name}</Text>
                                        {exp.description && <Text style={styles.description}>{exp.description}</Text>}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={styles.sideColumn}>
                        {skillsData.skills && skillsData.skills.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Skills</Text>
                                <View style={styles.skillsList}>
                                    {skillsData.skills.map(skill => (
                                        <View key={skill} style={styles.skillTagWrapper}>
                                            <Text style={styles.skillTagText}>
                                                {skill}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {education && education.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Education</Text>
                                {education.map((edu, idx) => (
                                    <View key={idx} style={styles.eduItem} wrap={false}>
                                        <Text style={styles.eduDegree}>{edu.field_of_study}</Text>
                                        <Text style={styles.eduSchool}>{edu.school_name}</Text>
                                        {edu.specialization && <Text style={styles.eduSpecialization}>{edu.specialization}</Text>}
                                        {edu.graduation_year && <Text style={styles.eduYear}>{edu.graduation_year}</Text>}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default function MyCV() {
    const [profileData, setProfileData] = useState(null);
    const [skillsData, setSkillsData] = useState({ skills: [], antiSkills: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCVData = async () => {
            try {
                // Get profile from local storage
                const storedProfile = localStorage.getItem('flowjob_profile');
                let userProfileData = null;

                if (storedProfile) {
                    userProfileData = JSON.parse(storedProfile);
                    setProfileData(userProfileData);
                }

                // Get skills from API
                const user = auth.getUser();
                if (user && user.id) {
                    if (!userProfileData) {
                        const fetchedProfileData = await auth.getOnboarding(user.id);
                        if (fetchedProfileData && fetchedProfileData.profile) {
                            setProfileData(fetchedProfileData);
                            localStorage.setItem('flowjob_profile', JSON.stringify(fetchedProfileData));
                        }
                    }

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

    if (loading) {
        return (
            <div style={pageStyles.loaderContainer}>
                <div style={pageStyles.loader}></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div style={pageStyles.emptyState}>
                <h2>No Profile Data Found</h2>
                <p>Please complete the onboarding process to generate your CV.</p>
            </div>
        );
    }

    return (
        <div style={pageStyles.page}>
            {/* Sidebar Tools - hidden during print via CSS */}
            <aside className="cv-tools" style={pageStyles.sidebar}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={pageStyles.sidebarTitle}>Your Flowjob CV</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                        Here is your generated CV. We've applied our clean, professional layout standard.
                    </p>
                </div>

                <div style={{ padding: '1.5rem', background: '#1c2433', borderRadius: '12px', border: '1px solid #30363d', textAlign: 'center' }}>
                    <PDFDownloadLink
                        document={<CVDocument profileData={profileData} skillsData={skillsData} />}
                        fileName="flowjob-cv.pdf"
                        style={pageStyles.downloadBtn}
                    >
                        {({ blob, url, loading, error }) =>
                            loading ? 'Generating PDF...' : 'Download PDF'
                        }
                    </PDFDownloadLink>
                </div>
            </aside>

            {/* Browser Native PDF Viewer */}
            <div className="cv-document-wrapper" style={pageStyles.documentWrapper}>
                <PDFViewer style={pageStyles.pdfViewer} showToolbar={true}>
                    <CVDocument
                        profileData={profileData}
                        skillsData={skillsData}
                    />
                </PDFViewer>
            </div>
        </div>
    );
}

const pageStyles = {
    page: {
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
        background: 'var(--bg-surface)',
        flexWrap: 'wrap',
    },
    sidebar: {
        width: '320px',
        padding: '2.5rem 2rem',
        borderRight: '1px solid var(--border)',
        background: 'rgba(13, 17, 23, 0.95)',
        display: 'flex',
        flexDirection: 'column',
    },
    sidebarTitle: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '0.75rem',
    },
    downloadBtn: {
        display: 'inline-flex',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.75rem 1.5rem',
        background: 'var(--accent-cyan)',
        color: '#000',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        boxShadow: '0 0 12px rgba(0, 229, 255, 0.35)',
    },
    documentWrapper: {
        flex: 1,
        display: 'flex',
        background: '#e5e7eb', // soft gray background
    },
    pdfViewer: {
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 64px)',
        border: 'none',
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
