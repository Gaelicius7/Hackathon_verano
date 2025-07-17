import React, { useState, useRef } from 'react';
import styles from './MagicSphere.module.css';
import { motion, useAnimation } from 'framer-motion';

const personalities: Record<'neutral' | 'angry' | 'happy' | 'like', { message: string; gradient: string; shadow: string }> = {
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
  like: {
    message: '',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    shadow: '0 0 60px 10px #43e97b88',
  },
};

interface SphereProps {
  onAsk: (question: string) => void;
  lastQuestion: string;
  repeatCount: number;
  onInputChange?: (len: number) => void;
  onInputKey?: (key: string) => void;
  onResponse?: (answer: string) => void;
}

export default function MagicSphere({ onAsk, lastQuestion, repeatCount, onInputChange, onInputKey, onResponse }: SphereProps) {
  const [input, setInput] = useState('');
  const [personality, setPersonality] = useState<'neutral' | 'angry' | 'happy' | 'like'>('neutral');
  // Historial local de la esfera: [{question, answer}]
  const [chat, setChat] = useState<{question: string, answer: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
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

  // Rebote de esfera (pequeño en cada tecla, grande en Enter)
  const bounceSphere = async (big = false) => {
    await controls.start({
      scale: big ? [1, 1.18, 0.92, 1.06, 1] : [1, 1.06, 0.96, 1.01, 1],
      transition: { duration: big ? 0.45 : 0.22 }
    });
  };


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const handleAsk = async () => {
    if (!input.trim()) return;
    // Si la pregunta es igual a la anterior, solo cambia el color/personality a 'like' (verde), sin mostrar mensaje especial
    if (input.trim().toLowerCase() === lastQuestion.toLowerCase()) {
      setPersonality('like');
    } else {
      setPersonality('happy');
    }
    setLoading(true);
    setError(null);
    // Agrega la pregunta al historial local, respuesta vacía temporal
    setChat(prev => [...prev, { question: input, answer: '' }]);
    try {
      // Llama a la Edge Function de Supabase
      const res = await fetch('https://hgalzsarjbnumfagrnwh.supabase.co/functions/v1/rapid-function', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYWx6c2FyamJudW1mYWdybndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzgxMzcsImV4cCI6MjA2ODM1NDEzN30.qSI_aX_vso83SDQMf146FJI7QTWj-9tOoWuFs1FCw2M'
        },
        body: JSON.stringify({ question: input })
      });
      const data = await res.json();
      console.log(data);
      if (data.answer) {
        setResponse(data.answer);
        // Actualiza la última respuesta en el chat
        setChat(prev => prev.map((msg, i) => i === prev.length-1 ? { ...msg, answer: data.answer } : msg));
        if (typeof onResponse === 'function') onResponse(data.answer);
      } else {
        setResponse('No pude obtener una respuesta mágica.');
        setError(data.error || 'Error desconocido');
        setChat(prev => prev.map((msg, i) => i === prev.length-1 ? { ...msg, answer: 'No pude obtener una respuesta mágica.' } : msg));
        if (typeof onResponse === 'function') onResponse('No pude obtener una respuesta mágica.');
      }
    } catch (e) {
      setResponse('Ocurrió un error mágico.');
      setError(String(e));
    } finally {
      setLoading(false);
    }
    onAsk(input);
    setInput('');
    if (typeof onInputChange === 'function') onInputChange(0);
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

  // Scroll automático al final del chat
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, loading]);

  // Fallback visual si personality está mal
  const safePersonality = personalities[personality] || personalities['neutral'];

  return (
    <div className={styles.container}>
      <motion.div
        ref={sphereRef}
        className={styles.sphere}
        style={{
          background: safePersonality.gradient,
          boxShadow: safePersonality.shadow,
          transform: `rotateX(${-mouse.y}deg) rotateY(${mouse.x}deg)`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
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
          {error && (
            <div style={{
              color: '#ff4f4f',
              background: '#fff0f3',
              border: '1.5px solid #ffb6c1',
              borderRadius: '1rem',
              padding: '0.7rem 1.2rem',
              margin: '0.5rem 0',
              fontWeight: 600,
              fontSize: '1.08rem',
              textAlign: 'center',
              boxShadow: '0 2px 8px #ff4f4f22',
              maxWidth: 340
            }}>
              {typeof error === 'string' ? error : 'Ocurrió un error mágico. Intenta de nuevo.'}
            </div>
          )}
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', width: '100%',
              alignItems: 'stretch', justifyContent: 'flex-end', padding: 2, background: '#f8fafd', borderRadius: 16, border: '1px solid #e3eafe', boxShadow: '0 2px 8px #e3eafe22'
            }}
          >
            {chat.map((msg, idx) => (
              <React.Fragment key={idx}>
                <div style={{
                  alignSelf: 'flex-end', background: 'linear-gradient(90deg,#e3eafe,#fbc2eb)', color: '#4d5dfb', borderRadius: 14, padding: '4px 12px', maxWidth: '85%', fontSize: 14, fontWeight: 500, marginBottom: 1, textAlign: 'right', wordBreak: 'break-word', boxShadow: '0 1px 4px #e3eafe44'
                }}>{msg.question}</div>
                <div style={{
                  alignSelf: 'flex-start', background: '#fff', color: '#222', borderRadius: 14, padding: '4px 12px', maxWidth: '92%', fontSize: 14, fontWeight: 500, marginBottom: 6, textAlign: 'left', wordBreak: 'break-word', boxShadow: '0 1px 4px #fbc2eb33'
                }}>{msg.answer || (loading && idx === chat.length-1 ? '🔮 Pensando una respuesta mágica...' : '')}</div>
              </React.Fragment>
            ))}
            <div ref={chatEndRef} />
            {chat.length === 0 && !loading && (
              <div className={styles.response} style={{ color: '#aaa', fontSize: 15, textAlign: 'center' }}>
                Hazme una pregunta...
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      <motion.input
        className={styles.input}
        type="text"
        placeholder="Escribe tu pregunta..."
        value={input}
        onChange={e => {
          setInput(e.target.value);
          if (typeof onInputChange === 'function') onInputChange(e.target.value.length);
        }}
        onKeyDown={e => {
          if (typeof onInputKey === 'function') onInputKey(e.key);
          if (e.key === 'Enter') handleAsk();
          else bounceSphere();
        }}
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

