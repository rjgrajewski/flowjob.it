import { BriefcaseIcon, ZapIcon, AIIcon, DatabaseIcon } from '../components/Icons';

export const archNodes = [
    { label: "EventBridge", desc: "(02:00 UTC)", color: "var(--accent-amber)" },
    { label: "ECS Fargate", desc: "(Scout Scraper)", color: "var(--accent-cyan)" },
    { label: "AWS RDS", desc: "(PostgreSQL)", color: "var(--accent-blue)" },
    { label: "Atlas Pipeline", desc: "(Normalization)", color: "var(--accent-violet)" },
    { label: "flowjob", desc: "Search Layer", color: "var(--text-primary)" },
];

export const pipelineSteps = [
    { title: "Job ingestion", desc: "Flowjob continuously scrapes and aggregates job descriptions into a structured dataset.", color: "var(--accent-cyan)" },
    { title: "Skill extraction", desc: "Required skills are extracted from raw job descriptions and converted into structured entities.", color: "var(--accent-blue)" },
    { title: "Skill normalization", desc: "Different naming variants are unified into a consistent skill taxonomy using AI-assisted normalization.", color: "var(--accent-violet)" },
    { title: "User skill profiling", desc: "Users select their skills and optional anti-skills to build a precise capability profile.", color: "var(--accent-amber)" },
    { title: "Semantic matching", desc: "Job offers are ranked based on semantic alignment between normalized requirements and the user profile.", color: "var(--accent-green)" },
    { title: "CV builder (optional)", desc: "An optional CV builder generates application-ready documents aligned with selected skills.", color: "var(--text-secondary)" }
];

export const symbols = [
    // Left side
    { icon: BriefcaseIcon, color: 'var(--accent-cyan)', size: 24, initialPos: { left: '10%', top: '60%' }, delay: 0 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 28, initialPos: { left: '15%', top: '30%' }, delay: 1 },
    { icon: DatabaseIcon, color: 'var(--accent-cyan)', size: 26, initialPos: { left: '5%', top: '80%' }, delay: 3 },
    { icon: ZapIcon, color: 'var(--accent-cyan)', size: 18, initialPos: { left: '20%', top: '10%' }, delay: 7 },

    // Right side
    { icon: BriefcaseIcon, color: 'var(--accent-cyan)', size: 18, initialPos: { left: '85%', top: '40%' }, delay: 2 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 20, initialPos: { left: '90%', top: '70%' }, delay: 4 },
    { icon: DatabaseIcon, color: 'var(--accent-cyan)', size: 22, initialPos: { left: '80%', top: '20%' }, delay: 5 },
    { icon: ZapIcon, color: 'var(--accent-cyan)', size: 18, initialPos: { left: '75%', top: '90%' }, delay: 8 },

    // Top/Bottom bias
    { icon: BriefcaseIcon, color: 'var(--accent-cyan)', size: 20, initialPos: { left: '40%', top: '15%' }, delay: 1.5 },
    { icon: AIIcon, color: 'var(--accent-cyan)', size: 24, initialPos: { left: '60%', top: '85%' }, delay: 6 },
];
