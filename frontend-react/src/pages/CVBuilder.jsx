import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as d3 from 'd3-force';
import { api, auth } from '../services/api.js';
import { useSkills } from '../hooks/useSkills.js';

const TYPING_SKILLS = [
    'React', 'Python', 'AWS', 'Figma', 'TypeScript',
    'Node.js', 'Go', 'Docker', 'GraphQL', 'Kubernetes',
    'Java', 'C#', 'SQL', 'Rust', 'Vue.js'
];

function useTypingPlaceholder() {
    const [text, setText] = useState('');
    useEffect(() => {
        let currentSkillIdx = Math.floor(Math.random() * TYPING_SKILLS.length);
        let charIdx = 0;
        let isDeleting = false;
        let timer;

        const tick = () => {
            const currentSkill = TYPING_SKILLS[currentSkillIdx % TYPING_SKILLS.length];
            if (isDeleting) {
                charIdx--;
                setText(currentSkill.substring(0, charIdx));
            } else {
                charIdx++;
                setText(currentSkill.substring(0, charIdx));
            }

            let speed = isDeleting ? 40 : 120;

            if (!isDeleting && charIdx === currentSkill.length) {
                speed = 2500;
                isDeleting = true;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                currentSkillIdx++;
                speed = 600;
            }

            timer = setTimeout(tick, speed);
        };
        timer = setTimeout(tick, 500);
        return () => clearTimeout(timer);
    }, []);
    return text || '|';
}

const BUBBLE_COLORS = [
    ['rgba(0,229,255,0.1)', 'rgba(0,229,255,0.5)'],
    ['rgba(124,58,237,0.1)', 'rgba(124,58,237,0.5)'],
    ['rgba(0,230,118,0.1)', 'rgba(0,230,118,0.5)'],
    ['rgba(255,215,64,0.1)', 'rgba(255,215,64,0.5)'],
    ['rgba(255,83,112,0.1)', 'rgba(255,83,112,0.5)'],
    ['rgba(0,229,255,0.08)', 'rgba(0,229,255,0.4)'],
    ['rgba(200,100,255,0.1)', 'rgba(200,100,255,0.5)'],
    ['rgba(0,200,255,0.1)', 'rgba(0,200,255,0.45)'],
    ['rgba(255,165,0,0.1)', 'rgba(255,165,0,0.5)'],
    ['rgba(50,200,150,0.1)', 'rgba(50,200,150,0.5)'],
];

function SkillBubble({ skill, idx, radius, isSelected, isAnti, onLeft, onRight }) {
    const size = radius * 2;
    const freq = skill.frequency || 0;
    const colorIdx = (skill.name.length + idx) % BUBBLE_COLORS.length;
    const [bg, borderCol] = BUBBLE_COLORS[colorIdx];

    const domRef = useRef(null);

    useEffect(() => {
        skill.domRef = domRef.current;
    }, [skill]);

    let bubbleBg = bg;
    let bubbleBorder = 'transparent';
    let bubbleShadow = 'none';
    let textColor = 'var(--text-secondary)';

    if (isSelected) {
        bubbleBg = 'rgba(0,229,255,0.15)';
        bubbleBorder = 'var(--accent-cyan)';
        bubbleShadow = '0 0 16px rgba(0,229,255,0.4)';
        textColor = 'var(--accent-cyan)';
    } else if (isAnti) {
        bubbleBg = 'rgba(255,83,112,0.15)';
        bubbleBorder = 'var(--accent-red)';
        bubbleShadow = '0 0 14px rgba(255,83,112,0.35)';
        textColor = 'var(--accent-red)';
    }

    return (
        <div
            ref={domRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: size,
                height: size,
                transform: skill.x ? `translate(${skill.x - radius}px, ${skill.y - radius}px)` : undefined,
                pointerEvents: 'none',
            }}
        >
            <motion.div
                title={`${skill.name} (${freq} jobs)`}
                onClick={onLeft}
                onContextMenu={e => { e.preventDefault(); onRight(); }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, boxShadow: bubbleShadow }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: bubbleBg,
                    border: `1.5px solid ${bubbleBorder || borderCol}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: `${Math.max(0.6, Math.min(1.1, size / 135))}rem`,
                    fontWeight: 600,
                    color: textColor,
                    cursor: 'pointer',
                    padding: '0.6rem',
                    userSelect: 'none',
                    pointerEvents: 'auto',
                    transition: 'background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s',
                }}
            >
                <span style={{
                    overflowWrap: 'break-word',
                    wordBreak: 'normal',
                    lineHeight: 1.1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    width: '100%',
                }}>
                    {skill.name}
                </span>
            </motion.div>
        </div>
    );
}

// A ghost bubble that flies from its starting position to the sidebar target
function FlyingGhost({ id, name, startX, startY, startSize, targetX, targetY, color, onDone }) {
    return (
        <motion.div
            key={id}
            initial={{
                left: startX,
                top: startY,
                width: startSize,
                height: startSize,
                opacity: 1,
                scale: 1,
            }}
            animate={{
                left: targetX,
                top: targetY,
                width: 28,
                height: 28,
                opacity: 0,
                scale: 0.4,
            }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={onDone}
            style={{
                position: 'fixed',
                borderRadius: '50%',
                background: color === 'cyan'
                    ? 'rgba(0,229,255,0.35)'
                    : 'rgba(255,83,112,0.35)',
                border: `2px solid ${color === 'cyan' ? 'var(--accent-cyan)' : 'var(--accent-red)'}`,
                boxShadow: color === 'cyan'
                    ? '0 0 20px rgba(0,229,255,0.6)'
                    : '0 0 20px rgba(255,83,112,0.6)',
                pointerEvents: 'none',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: color === 'cyan' ? 'var(--accent-cyan)' : 'var(--accent-red)',
                overflow: 'hidden',
            }}
        />
    );
}

export default function CVBuilder() {
    const { skills, loading } = useSkills();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [anti, setAnti] = useState(new Set());
    const selectedRef = useRef(new Set());
    const antiRef = useRef(new Set());

    // Keep refs in sync with state for use in toggle handlers
    useEffect(() => { selectedRef.current = selected; }, [selected]);
    useEffect(() => { antiRef.current = anti; }, [anti]);
    const [saved, setSaved] = useState('');
    const saveTimeout = useRef(null);
    const initialLoadDone = useRef(false);

    // Flying ghosts state: array of { id, name, startX, startY, startSize, targetX, targetY, color }
    const [flyingGhosts, setFlyingGhosts] = useState([]);
    const ghostCounter = useRef(0);

    const placeholderText = useTypingPlaceholder();
    const containerRef = useRef(null);
    const sidebarRef = useRef(null);
    const selectedTagsRef = useRef(null);
    const antiTagsRef = useRef(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [nodes, setNodes] = useState([]);

    const simRef = useRef(null);
    const nodeCache = useRef(new Map());

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const user = auth.getUser();
            if (!user) return;
            const cv = await api.getUserCV(user.id);
            if (!mounted) return;
            setSelected(new Set(cv.skills || []));
            setAnti(new Set(cv.antiSkills || []));
            setTimeout(() => { if (mounted) initialLoadDone.current = true; }, 100);
        };
        load();
        return () => { mounted = false; };
    }, []);

    useEffect(() => {
        if (!initialLoadDone.current) return;
        const user = auth.getUser();
        if (!user) return;

        setSaved('Saving...');
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            try {
                await api.saveUserCV(user.id, { skills: [...selected], antiSkills: [...anti] });
                setSaved('Saved!');
                setTimeout(() => setSaved(''), 2500);
            } catch (e) {
                setSaved('Error saving');
            }
        }, 1000);
    }, [selected, anti]);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                    setDimensions({
                        width: entry.contentRect.width,
                        height: Math.max(entry.contentRect.height, 500)
                    });
                }
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [loading]);

    const maxFreq = useMemo(() => Math.max(...skills.map(s => s.frequency || 0), 1), [skills]);

    const sortedSkills = useMemo(() => {
        return [...skills]
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => (b.value.frequency || 0) - (a.value.frequency || 0) || a.sort - b.sort)
            .map(({ value }) => value);
    }, [skills]);

    // Exclude already-selected and anti skills from bubble map, replenishing with new skills
    const filtered = useMemo(() => {
        const availableSkills = sortedSkills.filter(s => !selected.has(s.name) && !anti.has(s.name));

        if (search) {
            const lowerSearch = search.toLowerCase();

            const exactMatches = [];
            const startsWithMatches = [];
            const containsMatches = [];

            availableSkills.forEach(s => {
                const lowerName = s.name.toLowerCase();
                if (lowerName === lowerSearch) {
                    exactMatches.push(s);
                } else if (lowerName.startsWith(lowerSearch)) {
                    startsWithMatches.push(s);
                } else if (lowerName.includes(lowerSearch)) {
                    containsMatches.push(s);
                }
            });

            return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 50);
        }

        return availableSkills.slice(0, 50);
    }, [sortedSkills, search, selected, anti]);

    const calculateSize = useCallback((skill, mFreq) => {
        const freq = skill.frequency || 0;
        const words = skill.name.split(/\s+/);
        const longestWordLen = Math.max(...words.map(w => w.length));

        // Base minSize on the longest word to ensure it fits horizontally, 
        // with a small buffer for the string length to account for wrapping.
        const minSize = Math.max(80, (longestWordLen * 11) + 20 + (skill.name.length * 0.5));
        const maxSize = Math.max(160, minSize + 80);

        const ratio = mFreq > 0 ? freq / mFreq : 0;
        return minSize + ((maxSize - minSize) * Math.pow(ratio, 0.6));
    }, []);

    useEffect(() => {
        if (loading || filtered.length === 0 || dimensions.width === 0) {
            if (simRef.current) simRef.current.stop();
            setNodes([]);
            return;
        }

        const width = dimensions.width;
        const height = dimensions.height;

        const newNodes = filtered.map(skill => {
            const radius = calculateSize(skill, maxFreq) / 2;
            const existing = nodeCache.current.get(skill.name);
            return {
                ...skill,
                radius,
                x: existing?.x ?? (Math.random() * width),
                y: existing?.y ?? (Math.random() * height),
                vx: existing?.vx ?? ((Math.random() - 0.5) * 8),
                vy: existing?.vy ?? ((Math.random() - 0.5) * 8),
                domRef: existing?.domRef || null
            };
        });

        setNodes(newNodes);

        if (simRef.current) simRef.current.stop();

        simRef.current = d3.forceSimulation(newNodes)
            .alphaDecay(0.01)
            .velocityDecay(0.2)
            .force("collide", d3.forceCollide().radius(d => d.radius + 3).iterations(3))
            .force("charge", d3.forceManyBody().strength(-15).distanceMax(150))
            .force("bounds", () => {
                const padding = 5;
                for (let node of newNodes) {
                    const r = node.radius + padding;
                    if (node.x < r) { node.x = r; node.vx += (r - node.x) * 0.15; }
                    if (node.x > width - r) { node.x = width - r; node.vx += (width - r - node.x) * 0.15; }
                    if (node.y < r) { node.y = r; node.vy += (r - node.y) * 0.15; }
                    if (node.y > height - r) { node.y = height - r; node.vy += (height - r - node.y) * 0.15; }
                }
            })
            .on("tick", () => {
                for (let i = 0; i < newNodes.length; i++) {
                    const node = newNodes[i];
                    nodeCache.current.set(node.name, node);
                    if (node.domRef) {
                        node.domRef.style.transform = `translate(${node.x - node.radius}px, ${node.y - node.radius}px)`;
                    }
                }
            });

        return () => {
            if (simRef.current) simRef.current.stop();
        };
    }, [filtered, maxFreq, dimensions.width, dimensions.height, calculateSize, loading]);

    // Helper: compute ghost params for a newly-clicked bubble
    const launchGhost = useCallback((skillName, color) => {
        // Find DOM ref for the skill node
        const cachedNode = nodeCache.current.get(skillName);
        const skillDomEl = cachedNode?.domRef;
        if (!skillDomEl) return;

        const bubbleRect = skillDomEl.getBoundingClientRect();
        // Get target: the respective tags container in the sidebar
        const targetRef = color === 'cyan' ? selectedTagsRef.current : antiTagsRef.current;
        const targetRect = targetRef
            ? targetRef.getBoundingClientRect()
            : sidebarRef.current?.getBoundingClientRect();

        const startX = bubbleRect.left + bubbleRect.width / 2 - bubbleRect.width / 2;
        const startY = bubbleRect.top + bubbleRect.height / 2 - bubbleRect.height / 2;
        const startSize = bubbleRect.width;

        const targetX = targetRect ? targetRect.left + 4 : 20;
        const targetY = targetRect ? targetRect.top + 4 : 100;

        const id = ++ghostCounter.current;
        setFlyingGhosts(prev => [...prev, { id, name: skillName, startX, startY, startSize, targetX, targetY, color }]);
    }, []);

    const toggleSkill = useCallback((name) => {
        const curSelected = selectedRef.current;
        const curAnti = antiRef.current;
        // Only launch ghost if transitioning from unselected -> selected
        if (!curSelected.has(name)) {
            launchGhost(name, 'cyan');
        }
        // Remove from anti
        if (curAnti.has(name)) {
            setAnti(a => { const n = new Set(a); n.delete(name); return n; });
        }
        setSelected(s => {
            const n = new Set(s);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, [launchGhost]);

    const toggleAnti = useCallback((name) => {
        const curAnti = antiRef.current;
        const curSelected = selectedRef.current;
        // Only launch ghost if transitioning from not-anti -> anti
        if (!curAnti.has(name)) {
            launchGhost(name, 'red');
        }
        // Remove from selected
        if (curSelected.has(name)) {
            setSelected(s => { const n = new Set(s); n.delete(name); return n; });
        }
        setAnti(a => {
            const n = new Set(a);
            n.has(name) ? n.delete(name) : n.add(name);
            return n;
        });
    }, [launchGhost]);

    const removeGhost = useCallback((id) => {
        setFlyingGhosts(prev => prev.filter(g => g.id !== id));
    }, []);

    return (
        <div style={styles.wrapper}>
            {/* Flying ghosts overlay — fixed, above everything */}
            <AnimatePresence>
                {flyingGhosts.map(ghost => (
                    <FlyingGhost
                        key={ghost.id}
                        {...ghost}
                        onDone={() => removeGhost(ghost.id)}
                    />
                ))}
            </AnimatePresence>

            {/* LEFT SIDEBAR */}
            <aside ref={sidebarRef} style={styles.sidebar}>
                <h3 style={styles.sidebarTitle}>Your Profile</h3>

                <div style={styles.sidebarSection}>
                    <div style={styles.sidebarLabel}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            ✅ Selected Skills <span style={styles.count}>{selected.size}</span>
                        </span>
                        {selected.size > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05, color: 'var(--accent-red)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelected(new Set())}
                                style={styles.clearButton}
                            >
                                Clear
                            </motion.button>
                        )}
                    </div>
                    <div ref={selectedTagsRef} style={styles.sidebarTags}>
                        <AnimatePresence>
                            {[...selected].sort((a, b) => a.localeCompare(b)).map(s => (
                                <motion.span
                                    layout
                                    key={s}
                                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    style={{ ...styles.sidebarTag, borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                                    onClick={() => toggleSkill(s)}
                                    title="Click to deselect"
                                >
                                    {s}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {selected.size === 0 && <p style={styles.emptyTip}>Click a bubble to add</p>}
                    </div>
                </div>

                <div style={styles.sidebarSection}>
                    <div style={styles.sidebarLabel}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            🚫 Anti-Skills <span style={styles.count}>{anti.size}</span>
                        </span>
                        {anti.size > 0 && (
                            <motion.button
                                whileHover={{ scale: 1.05, color: 'var(--accent-red)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setAnti(new Set())}
                                style={styles.clearButton}
                            >
                                Clear
                            </motion.button>
                        )}
                    </div>
                    <div ref={antiTagsRef} style={styles.sidebarTags}>
                        <AnimatePresence>
                            {[...anti].sort((a, b) => a.localeCompare(b)).map(s => (
                                <motion.span
                                    layout
                                    key={s}
                                    initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, x: -10 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    style={{ ...styles.sidebarTag, borderColor: 'var(--accent-red)', color: 'var(--accent-red)', cursor: 'pointer' }}
                                    onClick={() => toggleAnti(s)}
                                    title="Click to unblock"
                                >
                                    {s}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                        {anti.size === 0 && <p style={styles.emptyTip}>Shift+Click or right-click to block</p>}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', textAlign: 'center', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence>
                        {saved && (
                            <motion.span
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: saved === 'Saved!' ? 'var(--accent-cyan)' : saved.includes('Error') ? 'var(--accent-red)' : 'var(--text-secondary)'
                                }}
                            >
                                {saved === 'Saved!' ? '✓ ' : ''}{saved}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div style={styles.main}>
                <div style={styles.mainHeader}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skill Map</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>Click</span> to select ·{' '}
                            <span style={{ color: 'var(--accent-red)' }}>Shift+Click</span> or right-click to block
                        </p>
                    </div>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchPrompt}>❯</span>
                        <input
                            className="form-input"
                            placeholder={search ? "" : placeholderText}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={styles.bubbleCloudContainer}>
                        <div style={styles.loadingPlaceholder}>
                            {Array.from({ length: 24 }).map((_, i) => {
                                const size = 60 + (i * 23) % 80;
                                return (
                                    <div key={i} className="pulse" style={{
                                        ...styles.skeleton,
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        margin: '0.5rem',
                                    }} />
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={styles.bubbleCloudContainer} ref={containerRef}>
                        <AnimatePresence>
                            {nodes.map((node, i) => (
                                <SkillBubble
                                    key={node.name}
                                    skill={node}
                                    idx={i}
                                    radius={node.radius}
                                    isSelected={selected.has(node.name)}
                                    isAnti={anti.has(node.name)}
                                    onLeft={(e) => {
                                        if (e?.shiftKey) {
                                            toggleAnti(node.name);
                                        } else {
                                            toggleSkill(node.name);
                                        }
                                    }}
                                    onRight={() => toggleAnti(node.name)}
                                />
                            ))}
                            {nodes.length === 0 && (
                                <p style={{ color: 'var(--text-secondary)', padding: '2rem', position: 'absolute' }}>
                                    {search ? `No skills found for "${search}"` : 'All skills selected!'}
                                </p>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
    },
    sidebar: {
        width: '280px',
        flexShrink: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
        position: 'sticky',
        top: '64px',
        height: 'calc(100vh - 64px)',
        overflowY: 'auto',
    },
    sidebarTitle: {
        fontSize: '1rem',
        fontWeight: 700,
        marginBottom: '1.25rem',
        color: 'var(--text-primary)',
    },
    sidebarSection: {
        marginBottom: '1.5rem',
    },
    sidebarLabel: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.4rem',
    },
    clearButton: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: '0.7rem',
        fontWeight: 600,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: '4px',
        transition: 'color 0.2s',
    },
    count: {
        background: 'var(--bg-elevated)',
        borderRadius: '999px',
        padding: '0 0.4rem',
        fontSize: '0.75rem',
        color: 'var(--text-primary)',
    },
    sidebarTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem',
        minHeight: '32px',
    },
    sidebarTag: {
        fontSize: '0.75rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '999px',
        border: '1px solid',
        background: 'var(--bg-elevated)',
        fontWeight: 500,
        display: 'inline-block',
    },
    emptyTip: {
        color: 'var(--text-secondary)',
        fontSize: '0.75rem',
        fontStyle: 'italic',
    },
    main: {
        flex: 1,
        minWidth: 0,
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
    },
    mainHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
    },
    searchWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '0 0.75rem',
        flexShrink: 0,
    },
    searchPrompt: {
        color: 'var(--accent-cyan)',
        fontFamily: 'monospace',
        fontSize: '1.2rem',
        fontWeight: 800,
    },
    searchInput: {
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        width: '280px',
        padding: '0.8rem 0',
        fontSize: '1.2rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
    },
    bubbleCloudContainer: {
        position: 'relative',
        flex: 1,
        width: '100%',
        minHeight: '600px',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
    },
    loadingPlaceholder: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.5rem',
    },
    skeleton: {
        background: 'var(--bg-elevated)',
        animation: 'pulse 1.5s ease-in-out infinite',
    },
};
