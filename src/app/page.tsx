"use client";
import dynamic from "next/dynamic";
import React, { useState, useRef } from "react";
import { useSpring, animated } from "react-spring";
import Particles from "react-tsparticles";

const MagicSphere = dynamic(() => import("../components/MagicSphere"), { ssr: false });

// Paleta de gradientes cozy (sin verde)
const gradients = [
  "linear-gradient(120deg, #f5f7fa 0%, #c3cfe2 100%)", // gris-azul
  "linear-gradient(120deg, #c2e9fb 0%, #a1c4fd 100%)", // azul claro
  "linear-gradient(120deg, #fbc2eb 0%, #a6c1ee 100%)", // rosa-lila
  "linear-gradient(120deg, #f5f7fa 0%, #b8c6db 100%)", // gris-azul
  "linear-gradient(120deg, #fbc2eb 0%, #f5f7fa 100%)", // rosa-gris
  "linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)", // lila-azul
  "linear-gradient(120deg, #f093fb 0%, #f5576c 100%)"  // rosa-magenta
];

export default function Home() {
  const [showHistory, setShowHistory] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 }); // Normalizado [0,1]
  // Conversaciones: [{id, title, history: [{question, answer}]}]
  const [convs, setConvs] = useState<{id: string, title: string, history: {question: string, answer: string}[]}[]>([
    { id: 'conv-1', title: 'Conversación 1', history: [] }
  ]);
  const [activeConv, setActiveConv] = useState('conv-1');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Helpers para conversación activa
  const activeHistory = convs.find(c => c.id === activeConv)?.history || [];
  function handleNewConv() {
    const id = `conv-${Date.now()}`;
    setConvs(cs => [...cs, { id, title: `Conversación ${cs.length+1}`, history: [] }]);
    setActiveConv(id);
    setSidebarOpen(false);
  }
  function handleSelectConv(id: string) {
    setActiveConv(id);
    setSidebarOpen(false);
  }
  function handleAddQA(q: string, a: string) {
    setConvs(cs => cs.map(c => c.id === activeConv ? { ...c, history: [...c.history, { question: q, answer: a }] } : c));
  }

  // Fondo reacciona al mouse
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouse({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [lastQuestion, setLastQuestion] = useState("");
  const [repeatCount, setRepeatCount] = useState(0);
  const [inputLength, setInputLength] = useState(0);
  const lastLen = useRef(0);

  // Gradiente cambia según longitud del input
  const gradientIndex = Math.max(0, Math.min(gradients.length - 1, Math.floor(inputLength / 7)));
  const prevIndex = Math.max(0, Math.min(gradients.length - 1, Math.floor(lastLen.current / 7)));

  // Ciclo infinito de gradiente, avanza cada 2s y también con cada tecla
  const [cycleIdx, setCycleIdx] = useState(0);
  const cycleRef = useRef(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCycleIdx((i) => {
        cycleRef.current = (i + 1) % gradients.length;
        return cycleRef.current;
      });
    }, 2000); // cada 2s cambia
    return () => clearInterval(interval);
  }, []);

  // Cuando se presiona una tecla, avanza el ciclo
  function handleInputKey(key: string) {
    setCycleIdx(i => {
      const next = (i + 1) % gradients.length;
      cycleRef.current = next;
      return next;
    });
    // Si tienes lógica global, ponla aquí
  }

  const spring = useSpring({
    background: gradients[cycleIdx],
    filter: `brightness(${0.97 + mouse.y*0.1}) blur(0.5px)`, // blur mínimo
    boxShadow: `0 0 ${30 + mouse.x*60}px ${10 + mouse.y*30}px #fbc2eb44`,
    config: { tension: 140, friction: 18 },
  });

  // Para saber si escribe o borra
  function handleInputLength(len: number) {
    lastLen.current = inputLength;
    setInputLength(len);
  }

  function handleAsk(question: string) {
    // El MagicSphere ya consulta la IA, aquí solo actualizamos el historial de la conversación activa
    setLastQuestion(question);
    // El answer real se actualiza desde MagicSphere vía callback, aquí solo placeholder
    setHistory(h => [...h, { question, answer: '...' }]);
    setRepeatCount(0);
  }

  // Cuando MagicSphere recibe respuesta, actualiza historial de la conversación activa
  function handleAddQA(q: string, a: string) {
    setConvs(cs => cs.map(c => c.id === activeConv ? { ...c, history: [...c.history, { question: q, answer: a }] } : c));
  }


  return (
    <animated.main style={{ minHeight: "100vh", ...spring, transition: "background 1.5s", position: "relative", overflow: "hidden" }}>
      <Particles
        id="tsparticles"
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
        options={{
          fullScreen: false,
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: { value: 28, density: { enable: true, value_area: 800 } },
            color: { value: ["#b8c6db", "#a6c1ee", "#fbc2eb", "#e0c3fc", "#f093fb"] },
            opacity: { value: 0.17, anim: { enable: false } },
            size: { value: 32, random: { enable: true, minimumValue: 8 } },
            move: {
              enable: true,
              speed: 1.2,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "out" },
              attract: { enable: true, rotateX: 600, rotateY: 1200 }
            },
            links: { enable: false },
            shape: { type: "circle" },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              resize: true,
            },
            modes: {
              repulse: { distance: 80, duration: 0.4 },
            },
          },
          detectRetina: true,
        }}
      />
      <h1 style={{ textAlign: "center", marginTop: 32, fontWeight: 700, fontSize: 32, position: "relative", zIndex: 1 }}>
        Esfera Mágica IA
      </h1>
      {/* Barra lateral de conversaciones */}
      <div style={{
        position: 'fixed',
        top: 0, left: sidebarOpen ? 0 : -260,
        width: 250, height: '100vh',
        background: '#f5f7fa',
        boxShadow: '2px 0 18px #a6c1ee22',
        zIndex: 40,
        transition: 'left 0.32s cubic-bezier(.83,-0.01,.45,1.04)',
        padding: '1.2rem 1rem',
        display: 'flex', flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#a6c1ee', marginBottom: 10 }}>Conversaciones</div>
        <button onClick={handleNewConv} style={{
          background: 'linear-gradient(90deg,#c2e9fb,#fbc2eb)', color: '#444', border: 'none', borderRadius: 12, padding: '8px 0', fontWeight: 600, marginBottom: 8, cursor: "pointer", boxShadow: '0 2px 8px #a6c1ee22', fontSize: 15
        }}>+ Nueva conversación</button>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {convs.map(c => (
            <div key={c.id} onClick={() => handleSelectConv(c.id)} style={{
              background: c.id === activeConv ? 'linear-gradient(90deg,#a6c1ee,#fbc2eb)' : '#fff',
              color: c.id === activeConv ? '#fff' : '#222',
              borderRadius: 10,
              padding: '8px 10px',
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: c.id === activeConv ? '0 2px 12px #a1c4fd22' : '0 1px 4px #0001',
              border: c.id === activeConv ? '2px solid #fbc2eb' : '1.5px solid #eee',
              transition: 'all 0.18s'
            }}>{c.title}</div>
          ))}
        </div>
        <button onClick={()=>setSidebarOpen(false)} style={{ marginTop: 18, background: 'none', border: 'none', color: '#a6c1ee', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Cerrar</button>
      </div>
      {/* Botón flotante para abrir sidebar */}
      <button onClick={()=>setSidebarOpen(true)} style={{
        position: 'fixed', top: 22, left: 22, zIndex: 41,
        borderRadius: '50%', width: 46, height: 46,
        background: 'linear-gradient(120deg,#c2e9fb,#fbc2eb)',
        border: 'none', boxShadow: '0 2px 10px #a6c1ee33',
        color: '#fff', fontWeight: 800, fontSize: 24, cursor: 'pointer',
        display: sidebarOpen ? 'none' : 'block',
        transition: 'all .22s'
      }}>☰</button>

      <MagicSphere
        key={activeConv} // fuerza reinicio al cambiar de conversación
        onAsk={(q: string) => {
          setLastQuestion(q);
          setPendingQuestion(q); // para saber cuál pregunta está esperando respuesta
        }}
        lastQuestion={activeHistory.length ? activeHistory[activeHistory.length-1].question : ''}
        repeatCount={0}
        onInputChange={handleInputLength}
        onInputKey={handleInputKey}
        onResponse={(answer: string) => {
          // Cuando la esfera recibe respuesta IA, la agrega al historial de la conversación activa
          if (pendingQuestion) {
            handleAddQA(pendingQuestion, answer);
            setPendingQuestion('');
          }
        }}
      />
    </animated.main>
  );
}
