import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { YearPicker } from './YearPicker.jsx';

export const CVEditorTabs = ({ profileData, setProfileData, onSave, saving }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'experience', 'education'

    const handleProfileChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                [field]: value
            }
        }));
    };

    const handleExperienceChange = (index, field, value) => {
        const newExp = [...profileData.experience];
        newExp[index] = { ...newExp[index], [field]: value };
        setProfileData(prev => ({ ...prev, experience: newExp }));
    };

    const addExperience = () => {
        setProfileData(prev => ({
            ...prev,
            experience: [
                { job_title: '', company_name: '', description: '', start_date: '', end_date: '', is_current: false },
                ...(prev.experience || [])
            ]
        }));
    };

    const removeExperience = (index) => {
        const newExp = [...profileData.experience];
        newExp.splice(index, 1);
        setProfileData(prev => ({ ...prev, experience: newExp }));
    };

    const handleEducationChange = (index, field, value) => {
        const newEdu = [...profileData.education];
        newEdu[index] = { ...newEdu[index], [field]: value };
        setProfileData(prev => ({ ...prev, education: newEdu }));
    };

    const addEducation = () => {
        setProfileData(prev => ({
            ...prev,
            education: [
                { school_name: '', field_of_study: '', specialization: '', graduation_year: null },
                ...(prev.education || [])
            ]
        }));
    };

    const removeEducation = (index) => {
        const newEdu = [...profileData.education];
        newEdu.splice(index, 1);
        setProfileData(prev => ({ ...prev, education: newEdu }));
    };

    const renderProfileTab = () => (
        <div style={styles.tabContent}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>First Name</label>
                <input
                    style={styles.input}
                    value={profileData.profile?.first_name || ''}
                    onChange={e => handleProfileChange('first_name', e.target.value)}
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                    style={styles.input}
                    value={profileData.profile?.last_name || ''}
                    onChange={e => handleProfileChange('last_name', e.target.value)}
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Professional Summary (Bio)</label>
                <textarea
                    style={{ ...styles.input, height: '120px', resize: 'vertical' }}
                    value={profileData.profile?.bio || ''}
                    onChange={e => handleProfileChange('bio', e.target.value)}
                />
            </div>
            <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Email</label>
                    <input
                        style={styles.input}
                        value={profileData.profile?.contact_email || ''}
                        onChange={e => handleProfileChange('contact_email', e.target.value)}
                    />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Phone</label>
                    <input
                        style={styles.input}
                        value={profileData.profile?.phone_number || ''}
                        onChange={e => handleProfileChange('phone_number', e.target.value)}
                    />
                </div>
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Location</label>
                <input
                    style={styles.input}
                    value={profileData.profile?.location || ''}
                    onChange={e => handleProfileChange('location', e.target.value)}
                />
            </div>
        </div>
    );

    const renderExperienceTab = () => (
        <div style={styles.tabContent}>
            <button onClick={addExperience} className="btn btn-secondary" style={{ marginBottom: '1rem', width: '100%' }}>
                + Add Experience
            </button>
            <div style={styles.listContainer}>
                {profileData.experience?.map((exp, i) => (
                    <div key={i} style={styles.formCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Experience #{i + 1}</span>
                            <button onClick={() => removeExperience(i)} style={styles.removeBtn}>Remove</button>
                        </div>
                        <div style={styles.row}>
                            <div style={{ ...styles.inputGroup, flex: 1 }}>
                                <label style={styles.label}>Job Title</label>
                                <input
                                    style={styles.input}
                                    value={exp.job_title || ''}
                                    onChange={e => handleExperienceChange(i, 'job_title', e.target.value)}
                                />
                            </div>
                            <div style={{ ...styles.inputGroup, flex: 1 }}>
                                <label style={styles.label}>Company</label>
                                <input
                                    style={styles.input}
                                    value={exp.company_name || ''}
                                    onChange={e => handleExperienceChange(i, 'company_name', e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={styles.row}>
                            <YearPicker
                                label="From (Year)"
                                value={exp.start_date}
                                onChange={val => handleExperienceChange(i, 'start_date', val)}
                            />
                            <YearPicker
                                label="To (Year)"
                                disabled={exp.is_current}
                                value={exp.end_date}
                                onChange={val => handleExperienceChange(i, 'end_date', val)}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={exp.is_current || false}
                                onChange={e => {
                                    handleExperienceChange(i, 'is_current', e.target.checked);
                                    if (e.target.checked) handleExperienceChange(i, 'end_date', null);
                                }}
                            />
                            <label style={{ fontSize: '0.85rem' }}>I currently work here</label>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            <label style={styles.label}>Description</label>
                            <textarea
                                style={{ ...styles.input, height: '80px', resize: 'vertical' }}
                                value={exp.description || ''}
                                onChange={e => handleExperienceChange(i, 'description', e.target.value)}
                            />
                        </div>
                    </div>
                ))}
                {(!profileData.experience || profileData.experience.length === 0) && (
                    <p style={styles.emptyTip}>No experience entries yet.</p>
                )}
            </div>
        </div>
    );

    const renderEducationTab = () => (
        <div style={styles.tabContent}>
            <button onClick={addEducation} className="btn btn-secondary" style={{ marginBottom: '1rem', width: '100%' }}>
                + Add Education
            </button>
            <div style={styles.listContainer}>
                {profileData.education?.map((edu, i) => (
                    <div key={i} style={styles.formCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Education #{i + 1}</span>
                            <button onClick={() => removeEducation(i)} style={styles.removeBtn}>Remove</button>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>School / University</label>
                            <input
                                style={styles.input}
                                value={edu.school_name || ''}
                                onChange={e => handleEducationChange(i, 'school_name', e.target.value)}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Field of Study</label>
                            <input
                                style={styles.input}
                                value={edu.field_of_study || ''}
                                onChange={e => handleEducationChange(i, 'field_of_study', e.target.value)}
                            />
                        </div>
                        <div style={styles.row}>
                            <div style={{ ...styles.inputGroup, flex: 1 }}>
                                <label style={styles.label}>Specialization (Optional)</label>
                                <input
                                    style={styles.input}
                                    value={edu.specialization || ''}
                                    onChange={e => handleEducationChange(i, 'specialization', e.target.value)}
                                />
                            </div>
                            <div style={{ ...styles.inputGroup, width: '120px' }}>
                                <label style={styles.label}>Year</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={edu.graduation_year || ''}
                                    onChange={e => handleEducationChange(i, 'graduation_year', e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="YYYY"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                {(!profileData.education || profileData.education.length === 0) && (
                    <p style={styles.emptyTip}>No education entries yet.</p>
                )}
            </div>
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.tabsHeader}>
                <button
                    style={activeTab === 'profile' ? styles.tabBtnActive : styles.tabBtn}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    style={activeTab === 'experience' ? styles.tabBtnActive : styles.tabBtn}
                    onClick={() => setActiveTab('experience')}
                >
                    Experience
                </button>
                <button
                    style={activeTab === 'education' ? styles.tabBtnActive : styles.tabBtn}
                    onClick={() => setActiveTab('education')}
                >
                    Education
                </button>
            </div>

            <div style={styles.scrollArea}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'experience' && renderExperienceTab()}
                        {activeTab === 'education' && renderEducationTab()}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div style={styles.footer}>
                <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
                    onClick={onSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save CV'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    tabsHeader: {
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: '1rem',
    },
    tabBtn: {
        flex: 1,
        padding: '0.75rem 0',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid transparent',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    tabBtnActive: {
        flex: 1,
        padding: '0.75rem 0',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid var(--accent-cyan)',
        color: 'var(--accent-cyan)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    scrollArea: {
        flex: 1,
        overflowY: 'auto',
        paddingRight: '0.5rem',
        paddingBottom: '1rem',
    },
    tabContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
    },
    label: {
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        fontWeight: 500,
    },
    input: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.75rem',
        color: 'var(--text-primary)',
        width: '100%',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
    },
    row: {
        display: 'flex',
        gap: '1rem',
    },
    listContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    formCard: {
        background: 'rgba(255,255,255,0.02)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    removeBtn: {
        background: 'none',
        border: 'none',
        color: 'var(--accent-red)',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: 600,
    },
    emptyTip: {
        color: 'var(--text-secondary)',
        fontSize: '0.85rem',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: '1rem',
    },
    footer: {
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border)',
    }
};
