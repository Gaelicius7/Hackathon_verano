// API Route for Magic Sphere (OpenAI proxy)
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { question, apiKey } = req.body;
  if (!question || typeof question !== 'string') {
    res.status(400).json({ error: 'Missing question' });
    return;
  }
  // Usa tu propia API Key de OpenAI o pásala desde el frontend
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(401).json({ error: 'API key missing' });
    return;
  }
  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Eres una esfera mágica con personalidad, responde de forma creativa, breve y mágica.' },
          { role: 'user', content: question },
        ],
        max_tokens: 80,
        temperature: 0.8
      })
    });
    const data = await completion.json();
    if (data.choices && data.choices[0]?.message?.content) {
      res.status(200).json({ answer: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'No answer from OpenAI', details: data });
    }
  } catch (e) {
    res.status(500).json({ error: 'Request failed', details: String(e) });
  }
}
