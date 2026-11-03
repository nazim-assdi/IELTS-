import 'dotenv/config';
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(express.json({ limit: '2mb' }));
const port = Number(process.env.PORT || 3000);
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function client() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey: key });
}
async function generate(prompt: string) {
  const response = await client().models.generateContent({ model, contents: prompt });
  return response.text || '';
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'IELTS HERO API' }));

app.post('/api/gemini/examiner-chat', async (req, res) => {
  try {
    const { history = [], message = '', testPart = 'Part 1' } = req.body ?? {};
    const transcript = Array.isArray(history) ? history.map((item: any) => `${item.role === 'examiner' ? 'Examiner' : 'Candidate'}: ${item.text ?? ''}`).join('\n') : '';
    const prompt = `You are Dr. Arthur James, a professional British IELTS Speaking examiner. Conduct a realistic IELTS ${testPart} interview. Ask one concise natural follow-up question at a time. Do not give a band score during the interview.\n\nConversation so far:\n${transcript}\nCandidate's latest answer: ${message}\n\nReply as the examiner in 1-3 sentences.`;
    const reply = await generate(prompt);
    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Gemini request failed' });
  }
});

app.post('/api/gemini/evaluate-speaking', async (req, res) => {
  try {
    const { candidateSpeech = '', testPart = 'Part 1' } = req.body ?? {};
    const prompt = `Assess this IELTS Speaking ${testPart} response using IELTS public band descriptors. Return JSON only with keys overallBand (number), fluencyCoherence, lexicalResource, grammaticalRangeAccuracy, pronunciation, strengths (array), improvements (array), and improvedSample (string). Be realistic and explain that this is an AI estimate, not an official IELTS score.\n\nCandidate response:\n${candidateSpeech}`;
    const raw = await generate(prompt);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    res.json(JSON.parse(cleaned));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Evaluation failed' });
  }
});

app.post('/api/gemini/generate-cue-card', async (req, res) => {
  try {
    const { category = 'any' } = req.body ?? {};
    const prompt = `Create one original IELTS Speaking Part 2 cue card in category ${category}. Return JSON only with topic (string), promptText (string with You should say bullets), and vocabularyHints (array of objects each with phrase and meaning).`;
    const raw = await generate(prompt);
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    res.json(JSON.parse(cleaned));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Cue card generation failed' });
  }
});

app.listen(port, () => console.log(`IELTS HERO API listening on port ${port}`));
