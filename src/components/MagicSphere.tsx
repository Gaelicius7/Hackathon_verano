import React, { useState, useRef } from 'react';
import styles from './MagicSphere.module.css';
import { motion, useAnimation } from 'framer-motion';

const personalities = {
  neutral: {
    message: 'Hazme una pregunta...',
    gradient: 'linear-gradient(135deg, #6c63ff 0%, #4fdcff 100%)',
    shadow: '0 0 60px 10px #6c63ff88',
  },
  angry: {
    message: '¡Ya preguntaste eso! Intenta algo diferente.',
    gradient: 'linear-gradient(135deg, #ff4f4f 0%, #ffb64f 100%)',
    shadow: '0 0 60px 10px #ff4f4f88',
  },
  happy: {
    message: '¡Me gusta esa pregunta!',
    gradient: 'linear-gradient(135deg, #4fff81 0%, #4fdcff 100%)',
    shadow: '0 0 60px 10px #4fff8188',
  },
};

interface SphereProps {
  onAsk: (question: string) => void;
  lastQuestion: string;
  repeatCount: number;
}

export default function MagicSphere({ onAsk, lastQuestion, repeatCount }: SphereProps) {
  const [input, setInput] = useState('');
  const [personality, setPersonality] = useState<'neutral' | 'angry' | 'happy'>('neutral');
  const [response, setResponse] = useState(personalities.neutral.message);
  const [isDragging, setIsDragging] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const sphereRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [inputFocus, setInputFocus] = useState(false);

  // Sacudir esfera
  const shakeSphere = async () => {
    await controls.start({ x: [-5, 5, -5, 5, 0], rotate: [0, 3, -3, 2, 0], transition: { duration: 0.5 } });
  };

  const handleAsk = () => {
    if (!input.trim()) return;
    if (input.trim().toLowerCase() === lastQuestion.toLowerCase()) {
      setPersonality('angry');
      setResponse(personalities.angry.message);
      shakeSphere();
    } else {
      setPersonality('happy');
      setResponse(personalities.happy.message);
    }
    onAsk(input);
    setInput('');
  };

  React.useEffect(() => {
    if (repeatCount >= 2) {
      setPersonality('angry');
      setResponse(personalities.angry.message);
      shakeSphere();
    } else {
      setPersonality('neutral');
      setResponse(personalities.neutral.message);
    }
    // eslint-disable-next-line
  }, [repeatCount, lastQuestion]);

  // Esfera sigue el cursor
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!sphereRef.current) return;
      const rect = sphereRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
      setMouse({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={styles.container}>
      <motion.div
        ref={sphereRef}
        className={styles.sphere}
        style={{
          background: personalities[personality].gradient,
          boxShadow: personalities[personality].shadow,
          transform: `rotateX(${-mouse.y}deg) rotateY(${mouse.x}deg)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        animate={controls}
        drag
        dragConstraints={{ left: -80, right: 80, top: -80, bottom: 80 }}
        dragElastic={0.5}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileTap={{ scale: 1.08 }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        onDoubleClick={shakeSphere}
      >
        <motion.div
          className={styles.face}
          animate={{
            scale: inputFocus ? 1.05 : 1,
            opacity: isDragging ? 0.8 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          {response}
        </motion.div>
      </motion.div>
      <motion.input
        className={styles.input}
        type="text"
        placeholder="Escribe tu pregunta..."
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAsk()}
        animate={{
          borderColor: inputFocus ? personalities[personality].shadow.split(' ')[4] : '#ccc',
          boxShadow: inputFocus ? '0 0 0 4px #6c63ff33' : 'none',
          scale: inputFocus ? 1.03 : 1,
        }}
        transition={{ duration: 0.2 }}
        onFocus={() => setInputFocus(true)}
        onBlur={() => setInputFocus(false)}
        maxLength={120}
      />
      <motion.button
        className={styles.button}
        onClick={handleAsk}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.07 }}
        style={{ background: personalities[personality].gradient }}
      >
        Preguntar
      </motion.button>
    </div>
  );
}

