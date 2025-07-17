"use client";
import dynamic from "next/dynamic";
import React, { useState } from "react";

const MagicSphere = dynamic(() => import("../components/MagicSphere"), { ssr: false });

export default function Home() {
  const [history, setHistory] = useState<{ question: string; answer: string }[]>([]);
  const [lastQuestion, setLastQuestion] = useState("");
  const [repeatCount, setRepeatCount] = useState(0);

  const handleAsk = (question: string) => {
    let count = repeatCount;
    if (question.toLowerCase() === lastQuestion.toLowerCase()) {
      count++;
    } else {
      count = 0;
    }
    setRepeatCount(count);
    setLastQuestion(question);
    setHistory((prev) => [
      ...prev,
      { question, answer: "Respuesta generada por la esfera (IA simulada)" },
    ]);
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      <h1 style={{ textAlign: "center", marginTop: 32, fontWeight: 700, fontSize: 32 }}>
        Esfera Mágica IA
      </h1>
      <MagicSphere onAsk={handleAsk} lastQuestion={lastQuestion} repeatCount={repeatCount} />
      <section style={{ maxWidth: 400, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 14px #0001", padding: 24 }}>
        <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 12 }}>Historial de preguntas</h2>
        <ul style={{ maxHeight: 180, overflowY: "auto", paddingLeft: 0 }}>
          {history.map((item, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <b>Q:</b> {item.question} <br /> <b>A:</b> {item.answer}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
