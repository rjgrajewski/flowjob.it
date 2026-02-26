import { useState, useEffect, useMemo } from 'react';
import { api, auth } from '../services/api.js';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Svg, Path, Font, PDFDownloadLink, Image } from '@react-pdf/renderer';

import { CVEditorTabs } from '../components/CVEditorTabs.jsx';

// Register Roboto for proper Polish character support
Font.register({
    family: 'Roboto',
    fonts: [
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontWeight: 400, fontStyle: 'italic' },
        { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 }
    ]
});
Font.registerHyphenationCallback(word => [word]);

const DEFAULT_DATA_PROCESSING_CLAUSE = 'I hereby give consent for my personal data included in my application to be processed for the purposes of the recruitment process.';

const CVDocument = ({ profileData, skillsData }) => {
    const { profile, education, experience } = profileData;
    const primaryColor = '#00e5ff'; // Flowjob primary brand color
    const darkBg = '#0f172a'; // Deep Navy/Slate
    const maxSkills = 30; // limit skills on CV when no highlighted set
    const skillsToShow = (skillsData.highlightedSkills && skillsData.highlightedSkills.length > 0)
        ? skillsData.highlightedSkills
        : (skillsData.skills || []).slice(0, maxSkills);

    const styles = useMemo(() => StyleSheet.create({
        // ... (rest holds the same)
        page: {
            fontFamily: 'Roboto',
            backgroundColor: '#ffffff',
            color: '#334155',
            lineHeight: 1.6,
            paddingBottom: 40,
            paddingTop: 0,
        },
        headerBlock: {
            backgroundColor: darkBg,
            paddingTop: 40,
            paddingBottom: 35,
            paddingHorizontal: 50,
            flexDirection: 'row',
            alignItems: 'center',
            color: '#f8fafc',
            gap: 30,
        },
        headerTextContainer: {
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
        },
        profileImageContainer: {
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: 'hidden',
        },
        profileImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
        },
        name: {
            fontSize: 32,
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 22,
        },
        headerSubtitle: {
            fontSize: 12,
            color: '#e2e8f0',
            fontWeight: 400,
            fontStyle: 'italic',
            lineHeight: 1.5,
            marginBottom: 20,
            paddingRight: 40,
            textAlign: 'justify',
        },
        contactInfoBox: {
            flexDirection: 'column',
            gap: 10,
            color: '#475569',
            fontSize: 10,
            lineHeight: 1.4,
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        bodyContent: {
            flexDirection: 'row',
            paddingTop: 35,
            paddingBottom: 0,
            paddingHorizontal: 40,
            gap: 30,
        },
        mainColumn: {
            flex: 2,
            flexDirection: 'column',
            gap: 25,
        },
        sideColumn: {
            flex: 1,
            flexDirection: 'column',
            gap: 25,
        },
        section: {
            marginBottom: 5,
        },
        sectionTitle: {
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: darkBg,
            marginBottom: 8,
            letterSpacing: 1.2,
            borderBottomWidth: 2,
            borderBottomColor: primaryColor,
            paddingBottom: 4,
        },
        bioText: {
            fontSize: 10,
            color: '#475569',
            lineHeight: 1.6,
            textAlign: 'justify',
        },
        timelineItem: {
            marginBottom: 6,
        },
        jobHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 0,
        },
        jobTitle: {
            fontSize: 12,
            fontWeight: 700,
            color: darkBg,
        },
        dateRange: {
            fontSize: 9,
            color: primaryColor,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        companyName: {
            fontSize: 11,
            color: '#64748b',
            fontWeight: 400,
        },
        description: {
            fontSize: 9,
            color: '#475569',
            lineHeight: 1.3,
            textAlign: 'justify',
            marginTop: -4,
        },
        skillsList: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 6,
        },
        skillTagWrapper: {
            borderWidth: 1,
            borderColor: primaryColor,
            borderRadius: 12,
            paddingTop: 5,
            paddingBottom: 7,
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
            marginBottom: 8,
        },
        eduDegree: {
            fontSize: 11,
            fontWeight: 700,
            color: darkBg,
            marginBottom: 0,
            lineHeight: 1.1,
        },
        eduSchool: {
            fontSize: 10,
            color: '#475569',
            marginBottom: 0,
            lineHeight: 1.1,
        },
        eduSpecialization: {
            fontSize: 9,
            color: '#64748b',
            fontStyle: 'italic',
            lineHeight: 1.1,
        },
        eduYear: {
            fontSize: 9,
            color: primaryColor,
            fontWeight: 700,
            marginTop: 2,
            lineHeight: 1.1,
        }
    }), []);

    // Helper to determine a subtitle from the hook (bio) or default
    const subtitle = profile?.bio || "Professional Profile";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Secured Top Margin for secondary pages */}
                <View fixed render={({ pageNumber }) => (
                    pageNumber > 1 ? <View style={{ height: 40 }} /> : null
                )} />

                {/* Modern Dark Header block */}
                <View style={styles.headerBlock}>
                    {profile?.profile_picture ? (
                        <View style={styles.profileImageContainer}>
                            <Image style={styles.profileImage} src={profile.profile_picture} />
                        </View>
                    ) : null}
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.name}>
                            {profile?.first_name || ''} {profile?.last_name || ''}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {subtitle || ''}
                        </Text>
                    </View>
                </View>

                {/* Main Body */}
                <View style={styles.bodyContent}>
                    {/* Left Column (Main content) */}
                    <View style={styles.mainColumn}>

                        {experience && experience.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Experience</Text>
                                {[...experience]
                                    .sort((a, b) => {
                                        if (a.is_current && !b.is_current) return -1;
                                        if (!a.is_current && b.is_current) return 1;
                                        return new Date(b.start_date) - new Date(a.start_date);
                                    })
                                    .map((exp, idx) => {
                                        const startYear = exp.start_date ? String(exp.start_date).substring(0, 4) : '';
                                        const endYear = exp.end_date ? String(exp.end_date).substring(0, 4) : '';

                                        return (
                                            <View key={idx} style={styles.timelineItem} wrap={false}>
                                                <View style={styles.jobHeader}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                                        <Text style={styles.jobTitle}>{exp.job_title || ''}</Text>
                                                        <Text style={{ fontSize: 10, color: '#e2e8f0' }}>|</Text>
                                                        <Text style={styles.companyName}>{exp.company_name || ''}</Text>
                                                    </View>
                                                    <Text style={styles.dateRange}>
                                                        {startYear} — {exp.is_current ? 'Present' : endYear}
                                                    </Text>
                                                </View>
                                                {exp.description ? <Text style={styles.description}>{exp.description}</Text> : null}
                                            </View>
                                        );
                                    })}
                            </View>
                        ) : null}
                    </View>

                    {/* Right Column (Sidebar content) */}
                    <View style={styles.sideColumn}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Contact</Text>
                            <View style={styles.contactInfoBox}>
                                {profile?.location ? (
                                    <View style={styles.contactItem}>
                                        <Svg viewBox="0 0 24 24" width="10" height="10">
                                            <Path fill="none" stroke={primaryColor} strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <Path fill="none" stroke={primaryColor} strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </Svg>
                                        <Text>{profile.location}</Text>
                                    </View>
                                ) : null}
                                {profile?.phone_number ? (
                                    <View style={styles.contactItem}>
                                        <Svg viewBox="0 0 24 24" width="10" height="10">
                                            <Path fill="none" stroke={primaryColor} strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </Svg>
                                        <Text>{profile.phone_number?.replace(/(\+\d{2})?(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4').trim()}</Text>
                                    </View>
                                ) : null}
                                {profile?.contact_email ? (
                                    <View style={styles.contactItem}>
                                        <Svg viewBox="0 0 24 24" width="10" height="10">
                                            <Path fill="none" stroke={primaryColor} strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </Svg>
                                        <Text>{profile.contact_email}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>
                        {education && education.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Education</Text>
                                {[...education]
                                    .sort((a, b) => (b.graduation_year || 0) - (a.graduation_year || 0))
                                    .map((edu, idx) => (
                                        <View key={idx} style={styles.eduItem} wrap={false}>
                                            <Text style={styles.eduDegree}>{edu.field_of_study || ''}</Text>
                                            <Text style={styles.eduSchool}>{edu.school_name || ''}</Text>
                                            {edu.specialization ? <Text style={styles.eduSpecialization}>{edu.specialization}</Text> : null}
                                            {edu.graduation_year ? (
                                                <Text style={styles.eduYear}>
                                                    {edu.start_year ? `${edu.start_year} — ` : ''}{edu.graduation_year}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ))}
                            </View>
                        ) : null}

                        {skillsToShow.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Skills</Text>
                                <View style={styles.skillsList}>
                                    {skillsToShow.map(skill => (
                                        <View key={skill} style={styles.skillTagWrapper} wrap={false}>
                                            <Text style={styles.skillTagText}>
                                                {skill}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Data processing clause – fixed footer at bottom of each page (no extra page, may overlap bottom margin) */}
                <View
                    fixed
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingHorizontal: 40,
                        paddingTop: 10,
                        paddingBottom: 14,
                        borderTopWidth: 1,
                        borderTopColor: '#e2e8f0',
                        backgroundColor: '#ffffff',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 8, color: '#475569', fontStyle: 'italic', lineHeight: 1.35, textAlign: 'center' }}>
                        {profile?.data_processing_clause?.trim() || DEFAULT_DATA_PROCESSING_CLAUSE}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default function MyCV() {
    const [profileData, setProfileData] = useState(null);
    const [skillsData, setSkillsData] = useState({ skills: [], antiSkills: [], highlightedSkills: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadCVData = async () => {
            try {
                const user = auth.getUser();
                const storedProfile = localStorage.getItem('flowjob_profile');

                // Pokazuj od razu z localStorage (szybszy first paint), ale gdy użytkownik zalogowany – zawsze pobierz świeże dane z API (jedna baza, ta sama prawda na localhost i domenie)
                if (storedProfile) {
                    try {
                        setProfileData(JSON.parse(storedProfile));
                    } catch (_) {}
                }

                if (user && user.id) {
                    const [fetchedProfileData, cv] = await Promise.all([
                        auth.getOnboarding(user.id),
                        api.getUserCV(user.id)
                    ]);
                    if (fetchedProfileData && fetchedProfileData.profile) {
                        setProfileData(fetchedProfileData);
                        localStorage.setItem('flowjob_profile', JSON.stringify(fetchedProfileData));
                    }
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

    const handleSaveCV = async () => {
        setSaving(true);
        try {
            const user = auth.getUser();
            if (user && user.id && profileData) {
                // The API endpoint from auth.completeOnboarding handles saving profileData structure
                await auth.completeOnboarding({
                    profile: profileData.profile,
                    education: profileData.education,
                    experience: profileData.experience
                });
                // updating local storage as well
                localStorage.setItem('flowjob_profile', JSON.stringify(profileData));

                // Show temporary success state
                const btn = document.getElementById('save-cv-btn');
                if (btn) {
                    const originalText = btn.innerText;
                    btn.innerText = '✓ Saved Successfully!';
                    btn.style.backgroundColor = 'var(--accent-green)';
                    setTimeout(() => {
                        btn.innerText = originalText;
                        btn.style.backgroundColor = '';
                    }, 2000);
                }
            }
        } catch (e) {
            console.error('Error saving CV:', e);
            alert(e.message || 'Error saving CV. Please try again.');
        } finally {
            setSaving(false);
        }
    };

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
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={pageStyles.sidebarTitle}>Edit CV Content</h3>
                    <PDFDownloadLink
                        document={<CVDocument profileData={profileData} skillsData={skillsData} />}
                        fileName="flowjob-cv.pdf"
                        style={pageStyles.downloadIconBtn}
                        title="Download PDF"
                    >
                        {({ loading }) => loading ? '⏳' : '📥'}
                    </PDFDownloadLink>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                    <CVEditorTabs
                        profileData={profileData}
                        setProfileData={setProfileData}
                        onSave={handleSaveCV}
                        saving={saving}
                    />
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
        height: 'calc(100vh - 64px)',
        background: 'var(--bg-surface)',
        overflow: 'hidden',
    },
    sidebar: {
        width: '420px',
        padding: '1.5rem',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    sidebarTitle: {
        fontSize: '1.25rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        margin: 0,
    },
    downloadIconBtn: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '36px',
        height: '36px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        textDecoration: 'none',
        borderRadius: '8px',
        fontSize: '1.2rem',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
    },
    documentWrapper: {
        flex: 1,
        background: '#e5e7eb', // soft gray background
        position: 'relative',
    },
    pdfViewer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
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
