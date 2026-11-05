import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocket, WebSocketServer } from 'ws';

const app = express();
app.use(express.json({ limit: '2mb' }));
const port = Number(process.env.PORT || 3000);
const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
const liveModel = process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
const MAX_LIVE_CONNECTIONS = Number(process.env.MAX_LIVE_CONNECTIONS || 4);
const LIVE_SESSION_MS = Number(process.env.LIVE_SESSION_MS || 5 * 60 * 1000);

function client() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured on the server.');
  return new GoogleGenAI({ apiKey: key });
}

async function generate(prompt: string) {
  const response = await client().models.generateContent({ model: textModel, contents: prompt });
  return response.text || '';
}

function parseJson(raw: string) {
  const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
  return JSON.parse(cleaned);
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'IELTS HERO API' }));

app.post('/api/gemini/examiner-chat', async (req, res) => {
  try {
    const { history = [], message = '', testPart = 'Part 1' } = req.body ?? {};
    const transcript = Array.isArray(history)
      ? history.map((item: any) => `${item.role === 'examiner' ? 'Examiner' : 'Candidate'}: ${item.text ?? ''}`).join('\n')
      : '';
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
    res.json(parseJson(await generate(prompt)));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Evaluation failed' });
  }
});

app.post('/api/gemini/generate-cue-card', async (req, res) => {
  try {
    const { category = 'any' } = req.body ?? {};
    const prompt = `Create one original IELTS Speaking Part 2 cue card in category ${category}. Return JSON only with topic (string), promptText (string with You should say bullets), and vocabularyHints (array of objects each with phrase and meaning).`;
    res.json(parseJson(await generate(prompt)));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Cue card generation failed' });
  }
});

app.post('/api/gemini/translate', async (req, res) => {
  try {
    const text = String(req.body?.text ?? '').trim();
    const targetLanguage = String(req.body?.targetLanguage ?? 'Bengali');
    if (!text || text.length > 5000) {
      res.status(400).json({ error: 'Enter text (maximum 5,000 characters) to translate.' });
      return;
    }
    const prompt = `Translate the following text accurately into ${targetLanguage}. Preserve the original meaning, tone, names, IELTS terminology, and formatting. If the target is Bengali, use natural, clear Bangla suitable for a learner. Return only the translation, with no introduction or quotation marks.\n\nTEXT:\n${text}`;
    res.json({ translation: await generate(prompt) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Translation failed' });
  }
});

app.post('/api/gemini/generate-lesson', async (req, res) => {
  try {
    const topic = String(req.body?.topic ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const lessonNumber = Number(req.body?.lessonNumber ?? 3);
    if (!topic || ![3, 4].includes(lessonNumber)) {
      res.status(400).json({ error: 'A valid IELTS topic and lesson number (3 or 4) are required.' });
      return;
    }
    const focus = lessonNumber === 3
      ? 'teach topic-specific vocabulary, natural collocations, grammar patterns, Bengali meanings, and translated examples'
      : 'teach a topic-specific IELTS speaking response, answer structure, fluency strategy, useful phrases, and Bengali support';
    const prompt = `Create a complete, original, learner-friendly IELTS Speaking lesson for a Bangladeshi learner. Topic: ${topic}. Topic notes: ${description}. Lesson number: ${lessonNumber}. Focus: ${focus}. Target level: beginner-to-intermediate progressing toward Band 7+. Avoid memorised or unnatural phrases and do not promise a band score. Return valid JSON only with this exact structure: {"lessonTitle":"...","learningFocus":"...","explanationBn":"Bangla explanation","vocabulary":[{"phrase":"English phrase","meaningBn":"Bangla meaning","example":"Natural English example relevant to the topic","exampleBn":"Accurate Bangla translation"}],"speakingPrompt":"IELTS-style question","modelAnswer":"A natural 90-130 word sample answer","modelAnswerBn":"Bangla translation of the sample answer","quiz":{"question":"...","options":["...","...","...","..."],"answer":"one exact option","explanationBn":"Bangla explanation"}}. Include 5 useful vocabulary items. Make the quiz answer exactly match one option.`;
    res.json(parseJson(await generate(prompt)));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Lesson generation failed' });
  }
});

// The Gemini key is kept on this server. Mobile clients only connect to this WebSocket.
const httpServer = createServer(app);
const liveWss = new WebSocketServer({ noServer: true, maxPayload: 128 * 1024 });
const liveConnections = new Set<WebSocket>();

httpServer.on('upgrade', (request, socket, head) => {
  const path = new URL(request.url || '/', 'http://localhost').pathname;
  if (path !== '/api/live') {
    socket.destroy();
    return;
  }
  if (liveConnections.size >= MAX_LIVE_CONNECTIONS) {
    socket.write('HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  liveWss.handleUpgrade(request, socket, head, (ws) => liveWss.emit('connection', ws, request));
});

liveWss.on('connection', (ws, request) => {
  liveConnections.add(ws);
  const requestUrl = new URL(request.url || '/', 'http://localhost');
  const requestedPart = requestUrl.searchParams.get('part') || 'Part 1';
  const part = ['Part 1', 'Part 2', 'Part 3'].includes(requestedPart) ? requestedPart : 'Part 1';
  let session: any;
  let cleanedUp = false;

  const send = (payload: Record<string, unknown>) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  };
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearTimeout(sessionTimer);
    liveConnections.delete(ws);
    try { session?.close(); } catch (_) {}
  };
  const sessionTimer = setTimeout(() => {
    send({ type: 'session_limit', message: 'This practice session reached its 5-minute limit. Start a new session to continue.' });
    ws.close(1000, 'Practice session time limit');
  }, LIVE_SESSION_MS);

  ws.on('close', cleanup);
  ws.on('error', cleanup);

  ws.on('message', (raw) => {
    if (!session) return;
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === 'audio' && typeof message.data === 'string' && message.data.length <= 96 * 1024) {
        session.sendRealtimeInput({
          audio: { data: message.data, mimeType: 'audio/pcm;rate=16000' },
        });
      } else if (message.type === 'text' && typeof message.text === 'string' && message.text.length <= 2000) {
        session.sendRealtimeInput({ text: message.text });
      }
    } catch (error) {
      send({ type: 'error', message: error instanceof Error ? error.message : 'Invalid live audio packet.' });
    }
  });

  void (async () => {
    try {
      session = await client().live.connect({
        model: liveModel,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
          systemInstruction: {
            parts: [{
              text: `You are a warm, realistic IELTS Speaking examiner and English coach. Conduct an authentic IELTS ${part} practice session with a Bangladeshi candidate. Speak naturally in clear British English. Ask one question at a time, listen carefully, and allow interruptions. Do not lecture or give a band score after every answer. Briefly correct important grammar or vocabulary mistakes when useful, and keep the conversation supportive and exam-focused. For Part 2, give a cue-card topic and let the candidate speak. For Part 3, ask deeper analytical follow-up questions.`,
            }],
          },
        },
        callbacks: {
          onmessage: (message: any) => {
            const content = message.serverContent;
            if (!content) return;
            if (content.inputTranscription?.text) send({ type: 'input_transcript', text: content.inputTranscription.text });
            if (content.outputTranscription?.text) send({ type: 'output_transcript', text: content.outputTranscription.text });
            for (const item of content.modelTurn?.parts ?? []) {
              if (item.inlineData?.data) {
                send({
                  type: 'audio',
                  data: item.inlineData.data,
                  mimeType: item.inlineData.mimeType || 'audio/pcm;rate=24000',
                });
              }
            }
            if (content.interrupted) send({ type: 'interrupted' });
            if (content.turnComplete) send({ type: 'turn_complete' });
          },
          onerror: (event: any) => send({ type: 'error', message: event?.message || 'Gemini Live connection error.' }),
          onclose: (event: any) => {
            send({ type: 'closed', message: event?.reason || 'Live session closed.' });
          },
        },
      });
      send({ type: 'ready', model: liveModel, part });
    } catch (error) {
      send({ type: 'error', message: error instanceof Error ? error.message : 'Could not start Gemini Live session.' });
      ws.close(1011, 'Could not start live session');
    }
  })();
});

httpServer.listen(port, () => console.log(`IELTS HERO API listening on port ${port}`));
