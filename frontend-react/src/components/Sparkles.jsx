// Sparkle effect — simple ReactBits-style sparkle for Job Board
import { motion } from 'framer-motion';

function Sparkle({ size, style }) {
    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="var(--accent-cyan)"
            style={{ position: 'absolute', ...style, width: size, height: size, opacity: 0.7 }}
            animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4],
                rotate: [0, 45, 0],
            }}
            transition={{
                duration: 2.5 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
            }}
        >
            <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
        </motion.svg>
    );
}

export default function SparklesBg({ style = {} }) {
    const positions = [
        { top: '10%', right: '8%' },
        { bottom: '20%', right: '4%' },
        { top: '50%', right: '12%' },
        { bottom: '5%', left: '90%' },
    ];

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}>
            {positions.map((pos, i) => (
                <Sparkle key={i} size={i % 2 === 0 ? 22 : 14} style={pos} />
            ))}
        </div>
    );
}
