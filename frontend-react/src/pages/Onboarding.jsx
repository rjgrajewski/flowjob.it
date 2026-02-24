import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/api.js';

const STEPS = [
    { id: 'personal', title: 'Dane osobowe', icon: '👤' },
    { id: 'contact', title: 'Dane kontaktowe', icon: '📞' },
    { id: 'education', title: 'Wykształcenie', icon: '🎓' },
    { id: 'experience', title: 'Doświadczenie', icon: '💼' },
    { id: 'bio', title: 'O Tobie', icon: '🚀' },
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
    const [tempEdu, setTempEdu] = useState({ school_name: '', field_of_study: '', specialization: '', graduation_year: '' });
    const [tempExp, setTempExp] = useState({ job_title: '', company_name: '', description: '', start_date: '', end_date: '', is_current: false });

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
                console.error('Błąd pobierania uczelni:', e);
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

    const goNext = async () => {
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
            await auth.completeOnboarding({
                profile,
                education,
                experience
            });
            navigate('/cv');
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const addEducation = () => {
        if (!tempEdu.school_name || !tempEdu.field_of_study) return;
        setEducation([...education, { ...tempEdu }]);
        setTempEdu({ school_name: '', field_of_study: '', specialization: '', graduation_year: '' });
        setUniQuery('');
    };

    const removeEducation = (index) => {
        setEducation(education.filter((_, i) => i !== index));
    };

    const addExperience = () => {
        if (!tempExp.job_title || !tempExp.company_name || !tempExp.start_date) return;
        setExperience([...experience, { ...tempExp }]);
        setTempExp({ job_title: '', company_name: '', description: '', start_date: '', end_date: '', is_current: false });
    };

    const removeExperience = (index) => {
        setExperience(experience.filter((_, i) => i !== index));
    };

    const renderPersonal = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Imię</label>
                <input
                    style={styles.input}
                    value={profile.first_name}
                    onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                    placeholder="Jan"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Nazwisko</label>
                <input
                    style={styles.input}
                    value={profile.last_name}
                    onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                    placeholder="Kowalski"
                />
            </div>
        </div>
    );

    const renderContact = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Email do kontaktu (na CV)</label>
                <input
                    style={styles.input}
                    value={profile.contact_email}
                    onChange={e => setProfile({ ...profile, contact_email: e.target.value })}
                    placeholder="jan.kowalski@example.com"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Numer telefonu</label>
                <input
                    style={styles.input}
                    value={profile.phone_number}
                    onChange={e => setProfile({ ...profile, phone_number: e.target.value })}
                    placeholder="+48 123 456 789"
                />
            </div>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Lokalizacja</label>
                <input
                    style={styles.input}
                    value={profile.location}
                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Warszawa / Remote"
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
                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Dodaj wykształcenie</p>
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Uczelnia</label>
                    <input
                        style={styles.input}
                        value={uniQuery}
                        onChange={e => {
                            setUniQuery(e.target.value);
                            setTempEdu({ ...tempEdu, school_name: e.target.value });
                        }}
                        placeholder="Zacznij wpisywać nazwę..."
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
                        <label style={styles.label}>Kierunek</label>
                        <input
                            style={styles.input}
                            value={tempEdu.field_of_study}
                            onChange={e => setTempEdu({ ...tempEdu, field_of_study: e.target.value })}
                            placeholder="Informatyka"
                        />
                    </div>
                    <div style={{ width: '100px' }}>
                        <label style={styles.label}>Rok</label>
                        <input
                            style={styles.input}
                            type="number"
                            value={tempEdu.graduation_year}
                            onChange={e => setTempEdu({ ...tempEdu, graduation_year: parseInt(e.target.value) })}
                            placeholder="2020"
                        />
                    </div>
                </div>
                <button onClick={addEducation} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>Dodaj do listy</button>
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
                            <small>{exp.start_date} - {exp.is_current ? 'Obecnie' : exp.end_date}</small>
                        </div>
                        <button onClick={() => removeExperience(i)} style={styles.removeBtn}>×</button>
                    </div>
                ))}
            </div>
            <div style={styles.formCard}>
                <p style={{ marginBottom: '1rem', fontWeight: 600 }}>Dodaj doświadczenie</p>
                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Stanowisko</label>
                        <input
                            style={styles.input}
                            value={tempExp.job_title}
                            onChange={e => setTempExp({ ...tempExp, job_title: e.target.value })}
                            placeholder="Software Engineer"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Firma</label>
                        <input
                            style={styles.input}
                            value={tempExp.company_name}
                            onChange={e => setTempExp({ ...tempExp, company_name: e.target.value })}
                            placeholder="Google"
                        />
                    </div>
                </div>
                <div style={styles.row}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Od kiedy</label>
                        <input
                            style={styles.input}
                            type="date"
                            value={tempExp.start_date}
                            onChange={e => setTempExp({ ...tempExp, start_date: e.target.value })}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Do kiedy</label>
                        <input
                            style={styles.input}
                            type="date"
                            disabled={tempExp.is_current}
                            value={tempExp.end_date}
                            onChange={e => setTempExp({ ...tempExp, end_date: e.target.value })}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                    <input
                        type="checkbox"
                        checked={tempExp.is_current}
                        onChange={e => setTempExp({ ...tempExp, is_current: e.target.checked })}
                    />
                    <label style={{ fontSize: '0.85rem' }}>Nadal pracuję w tej firmie</label>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <label style={styles.label}>Opis</label>
                    <textarea
                        style={{ ...styles.input, height: '80px', resize: 'none' }}
                        value={tempExp.description}
                        onChange={e => setTempExp({ ...tempExp, description: e.target.value })}
                        placeholder="Krótki opis obowiązków..."
                    />
                </div>
                <button onClick={addExperience} className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }}>Dodaj do listy</button>
            </div>
        </div>
    );

    const renderBio = () => (
        <div style={styles.stepContainer}>
            <div style={styles.inputGroup}>
                <label style={styles.label}>Krótkie bio / podsumowanie zawodowe</label>
                <textarea
                    style={{ ...styles.input, height: '160px', resize: 'none' }}
                    value={profile.bio}
                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Opisz skrótowo swoje największe atuty..."
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
        <div style={styles.wrapper}>
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
                    <h2 style={styles.title}>{STEPS[currentStepIdx].icon} {STEPS[currentStepIdx].title}</h2>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStepIdx}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{ flex: 1 }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>

                {error && <p style={{ color: '#ff4d4d', fontSize: '0.9rem', marginTop: '1rem' }}>{error}</p>}

                <div style={styles.footer}>
                    <button className="btn btn-secondary" onClick={goBack} disabled={currentStepIdx === 0}>Wstecz</button>
                    <button className="btn btn-primary" onClick={goNext} disabled={saving}>
                        {saving ? 'Zapisywanie...' : currentStepIdx === TOTAL - 1 ? 'Zakończ' : 'Dalej'}
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
    }
};
