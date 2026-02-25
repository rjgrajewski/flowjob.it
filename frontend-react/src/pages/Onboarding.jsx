import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api.js';
import { YearPicker } from '../components/YearPicker.jsx';

const STEPS = [
    { id: 'personal', title: 'Personal details', icon: '👤' },
    { id: 'contact', title: 'Contact info', icon: '📞' },
    { id: 'education', title: 'Education', icon: '🎓' },
    { id: 'experience', title: 'Experience', icon: '💼' },
    { id: 'bio', title: 'About you', icon: '🚀' },
];

const TOTAL = STEPS.length;

const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0, transition: { duration: 0.2 } }),
};


export default function Onboarding() {
    const navigate = useNavigate();
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [direction, setDirection] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        contact_email: '',
        location: '',
        bio: ''
    });
    const [education, setEducation] = useState([]);
    const [experience, setExperience] = useState([]);

    // Temporary entry states
    const [tempEdu, setTempEdu] = useState({ school_name: '', field_of_study: '', specialization: '', graduation_year: null });
    const [tempExp, setTempExp] = useState({ job_title: '', company_name: '', description: '', start_date: '', end_date: '', is_current: false });

    const [phoneData, setPhoneData] = useState({ areaCode: '+48', number: '' });

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        const formatted = val.match(/.{1,3}/g)?.join(' ') || '';
        setPhoneData(prev => ({ ...prev, number: formatted }));
    };

    // University autocomplete logic
    const [uniQuery, setUniQuery] = useState('');
    const [uniSuggestions, setUniSuggestions] = useState([]);

    useEffect(() => {
        if (uniQuery.length < 3) {
            setUniSuggestions([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                // Using RAD-on (OPI PIB) - official Polish source
                const res = await fetch(`https://radon.nauka.gov.pl/opendata/polon/institutions?name=${uniQuery}&resultLevel=1`);
                if (res.ok) {
                    const data = await res.json();
                    setUniSuggestions(data.results.map(u => u.name));
                }
            } catch (e) {
                console.error('Error fetching universities:', e);
                // Fallback to Hipolabs if RAD-on fails
                try {
                    const res = await fetch(`http://universities.hipolabs.com/search?name=${uniQuery}&country=Poland`);
                    if (res.ok) {
                        const data = await res.json();
                        setUniSuggestions(data.map(u => u.name));
                    }
                } catch (err) { console.error(err); }
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [uniQuery]);

    const isNextDisabled = () => {
        const step = STEPS[currentStepIdx];
        if (step.id === 'personal') {
            return !profile.first_name.trim() || !profile.last_name.trim();
        }
        return false;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.target.tagName.toLowerCase() === 'textarea') return;
            e.preventDefault();
            if (!isNextDisabled() && !saving) {
                goNext();
            }
        }
    };

    const goNext = async () => {
        // Auto-add current temp entries if they are filled
        if (STEPS[currentStepIdx].id === 'education' && tempEdu.school_name && tempEdu.field_of_study) {
            addEducation();
        }
        if (STEPS[currentStepIdx].id === 'experience' && tempExp.job_title && tempExp.company_name) {
            addExperience();
        }

        if (currentStepIdx === TOTAL - 1) {
            handleSubmit();
        } else {
            setDirection(1);
            setCurrentStepIdx(s => s + 1);
        }
    };

    const goBack = () => {
        if (currentStepIdx === 0) return;
        setDirection(-1);
        setCurrentStepIdx(s => s - 1);
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            // Include unsaved temp entries if they have basic info
            let finalEducation = [...education];
            if (tempEdu.school_name && tempEdu.field_of_study) {
                const cleanTempEdu = { ...tempEdu, graduation_year: isNaN(tempEdu.graduation_year) ? null : tempEdu.graduation_year };
                finalEducation.push(cleanTempEdu);
            }

            let finalExperience = [...experience];
            if (tempExp.job_title && tempExp.company_name) {
                finalExperience.push({ ...tempExp });
            }

            const cleanExperience = finalExperience.map(exp => ({
                ...exp,
                end_date: exp.end_date === "" ? null : exp.end_date
            }));

            const finalProfile = {
                ...profile,
                phone_number: phoneData.number ? `${phoneData.areaCode}${phoneData.number.replace(/\s/g, '')}` : ''
            };

            await auth.completeOnboarding({
                profile: finalProfile,
                education: finalEducation,
                experience: cleanExperience
            });
            navigate('/my-cv'); // Fixed path to /my-cv
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addEducation = () => {
        const cleanEdu = { ...tempEdu, graduation_year: isNaN(tempEdu.graduation_year) ? null : tempEdu.graduation_year };
        if (!cleanEdu.school_name || !cleanEdu.field_of_study) {
            return;
        }
        setEducation([...education, cleanEdu]);
        setTempEdu({ school_name: '', field_of_study: '', specialization: '', graduation_year: null });
        setUniQuery('');
    };

    const removeEducation = (index) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const addExperience = () => {
        if (!tempExp.job_title || !tempExp.company_name || !tempExp.start_date) {
            return;
        }
        setExperience([...experience, { ...tempExp }]);
        setTempExp({ job_title: '', company_name: '', description: '', start_date: '', end_date: '', is_current: false });
    };

    const removeExperience = (index) => {
        setExperience(experience.filter((_, i) => i !== index));
    };

    const renderPersonal = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                    style={styles.input}
                    value={profile.first_name}
                    onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="John"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                    style={styles.input}
                    value={profile.last_name}
                    onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Doe"
                />
            </div>
        </div>
    );

    const renderContact = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Email (for CV)</label>
                <input
                    style={styles.input}
                    value={profile.contact_email}
                    onChange={e => setProfile({ ...profile, contact_email: e.target.value })}
                    placeholder="john.doe@example.com"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                        style={{ ...styles.input, width: '160px', flexShrink: 0 }}
                        value={phoneData.areaCode}
                        onChange={e => setPhoneData({ ...phoneData, areaCode: e.target.value })}
                    >
                        <option value="+48">+48 (Poland)</option>
                        <option value="+1">+1 (USA/Canada)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+49">+49 (Germany)</option>
                        <option value="+33">+33 (France)</option>
                        <option value="+34">+34 (Spain)</option>
                        <option value="+39">+39 (Italy)</option>
                        <option value="+420">+420 (Czechia)</option>
                        <option value="+421">+421 (Slovakia)</option>
                        <option value="+380">+380 (Ukraine)</option>
                    </select>
                    <input
                        style={{ ...styles.input, flex: 1 }}
                        value={phoneData.number}
                        onChange={handlePhoneChange}
                        placeholder="123 456 789"
                        maxLength={17}
                    />
                </div>
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Location</label>
                <input
                    style={styles.input}
                    value={profile.location}
                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                    placeholder="New York / Remote"
                />
            </div>
        </div>
    );

    const renderEducation = () => (
        <div style={styles.stepContainer}>
            <div style={styles.list}>
                {education.map((edu, i) => (
                    <div key={i} style={styles.listItem}>
                        <div>
                            <strong>{edu.school_name}</strong><br />
                            <small>{edu.field_of_study} {edu.specialization ? `(${edu.specialization})` : ''}</small>
                        </div>
                        <button onClick={() => removeEducation(i)} style={styles.removeBtn}>×</button>
                    </div>
                ))}
            </div>
            <div style={styles.formCard}>
                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Add Education</p>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>University / School</label>
                    <input
                        style={styles.input}
                        value={uniQuery}
                        onChange={e => {
                            setUniQuery(e.target.value);
                            setTempEdu({ ...tempEdu, school_name: e.target.value });
                        }}
                        placeholder="Start typing name..."
                    />
                    {uniSuggestions.length > 0 && (
                        <div style={styles.suggestions}>
                            {uniSuggestions.map((s, i) => (
                                <div key={i} style={styles.suggestion} onClick={() => {
                                    setTempEdu({ ...tempEdu, school_name: s });
                                    setUniQuery(s);
                                    setUniSuggestions([]);
                                }}>{s}</div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Field of Study</label>
                        <input
                            style={styles.input}
                            value={tempEdu.field_of_study}
                            onChange={e => setTempEdu({ ...tempEdu, field_of_study: e.target.value })}
                            placeholder="Computer Science"
                        />
                    </div>
                    <div style={{ width: '120px' }}>
                        <label style={styles.label}>Graduation Year</label>
                        <select
                            style={styles.input}
                            value={tempEdu.graduation_year || ''}
                            onChange={e => setTempEdu({ ...tempEdu, graduation_year: e.target.value ? parseInt(e.target.value) : null })}
                        >
                            <option value="">Select...</option>
                            {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 5 - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={addEducation} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>Add to list</button>
            </div>
        </div>
    );

    const renderExperience = () => (
        <div style={styles.stepContainer}>
            <div style={styles.list}>
                {experience.map((exp, i) => (
                    <div key={i} style={styles.listItem}>
                        <div>
                            <strong>{exp.job_title}</strong> at <strong>{exp.company_name}</strong><br />
                            <small>{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</small>
                        </div>
                        <button onClick={() => removeExperience(i)} style={styles.removeBtn}>×</button>
                    </div>
                ))}
            </div>
            <div style={styles.formCard}>
                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Add Experience</p>
                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Job Title</label>
                        <input
                            style={styles.input}
                            value={tempExp.job_title}
                            onChange={e => setTempExp({ ...tempExp, job_title: e.target.value })}
                            placeholder="Software Engineer"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Company</label>
                        <input
                            style={styles.input}
                            value={tempExp.company_name}
                            onChange={e => setTempExp({ ...tempExp, company_name: e.target.value })}
                            placeholder="Google"
                        />
                    </div>
                </div>
                <div style={styles.row}>
                    <YearPicker
                        label="From (Year)"
                        value={tempExp.start_date}
                        onChange={val => setTempExp({ ...tempExp, start_date: val })}
                    />
                    <YearPicker
                        label="To (Year)"
                        disabled={tempExp.is_current}
                        value={tempExp.end_date}
                        onChange={val => setTempExp({ ...tempExp, end_date: val })}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={tempExp.is_current}
                        onChange={e => setTempExp({ ...tempExp, is_current: e.target.checked })}
                    />
                    <label style={{ fontSize: '0.85rem' }}>I currently work here</label>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={styles.label}>Description</label>
                    <textarea
                        style={{ ...styles.input, height: '80px', resize: 'none' }}
                        value={tempExp.description}
                        onChange={e => setTempExp({ ...tempExp, description: e.target.value })}
                        placeholder="Briefly describe your responsibilities..."
                    />
                </div>
                <button onClick={addExperience} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>Add to list</button>
            </div>
        </div>
    );

    const renderBio = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Short bio / Professional summary</label>
                <textarea
                    style={{ ...styles.input, height: '160px', resize: 'none' }}
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Briefly format your greatest strengths..."
                />
            </div>
        </div>
    );

    const renderStepContent = () => {
        const step = STEPS[currentStepIdx];
        switch (step.id) {
            case 'personal': return renderPersonal();
            case 'contact': return renderContact();
            case 'education': return renderEducation();
            case 'experience': return renderExperience();
            case 'bio': return renderBio();
            default: return null;
        }
    };

    return (
        <div style={styles.wrapper} onKeyDown={handleKeyDown}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.progress}>
                        {STEPS.map((s, i) => (
                            <div key={s.id} style={{
                                ...styles.progressDot,
                                background: i <= currentStepIdx ? 'var(--accent-cyan)' : 'var(--border)'
                            }} />
                        ))}
                    </div>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStepIdx}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        <h2 style={{ ...styles.title, marginBottom: '1.5rem' }}>
                            {STEPS[currentStepIdx].icon} {STEPS[currentStepIdx].title}
                        </h2>
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>

                {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>}

                <div style={styles.footer}>
                    <button className="btn btn-secondary" onClick={goBack} disabled={currentStepIdx === 0}>Back</button>
                    <button className="btn btn-primary" onClick={goNext} disabled={saving || isNextDisabled()}>
                        {saving ? 'Saving...' : currentStepIdx === TOTAL - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'rgba(0,0,0,0.2)',
    },
    card: {
        width: '100%',
        maxWidth: '600px',
        minHeight: '520px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        marginBottom: '2rem',
    },
    progress: {
        display: 'flex',
        gap: '8px',
        marginBottom: '1rem',
    },
    progressDot: {
        flex: 1,
        height: '4px',
        borderRadius: '2px',
        transition: 'background 0.3s',
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 700,
    },
    stepContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        position: 'relative'
    },
    label: {
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
    },
    input: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem',
        color: 'var(--text-primary)',
        width: '100%',
    },
    row: {
        display: 'flex',
        gap: '1rem',
    },
    footer: {
        marginTop: 'auto',
        paddingTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxHeight: '150px',
        overflowY: 'auto',
        marginBottom: '1rem',
    },
    listItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-sm)',
    },
    removeBtn: {
        background: 'none',
        border: 'none',
        color: '#ff4d4d',
        fontSize: '1.2rem',
        cursor: 'pointer',
    },
    formCard: {
        background: 'rgba(255,255,255,0.02)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border)',
    },
    suggestions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        zIndex: 10,
        maxHeight: '200px',
        overflowY: 'auto',
    },
    suggestion: {
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontSize: '0.85rem',
        borderBottom: '1px solid var(--border)',
        '&:hover': {
            background: 'var(--border)'
        }
    },
    pickerPopup: {
        position: 'absolute',
        bottom: '100%',
        left: 0,
        width: '240px',
        background: 'rgba(20,20,20,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        zIndex: 100,
        marginBottom: '0.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    },
    pickerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
    },
    pickerArrow: {
        background: 'none',
        border: 'none',
        color: 'var(--accent-cyan)',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '0 0.5rem',
    },
    yearSelect: {
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'center',
    },
    monthGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
    },
    monthItem: {
        padding: '0.4rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.05)',
    }
};
