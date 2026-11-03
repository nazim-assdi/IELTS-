/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, Play, Pause, RotateCcw, Award, CheckCircle, 
  Clock, BookOpen, Send, Sparkles, AlertCircle, FileText, LineChart as LineChartIcon, Radio
} from 'lucide-react';
import { calculateOverallBand, EvaluationResult } from '../utils/ielts-scoring';
import { sound } from '../utils/sound';
import { SpeakingAnalytics } from './SpeakingAnalytics';
import { PracticeSessionRecord, INITIAL_PRACTICE_SESSIONS } from '../utils/speaking-analytics';

interface Message {
  role: 'examiner' | 'candidate';
  text: string;
  timestamp: string;
}

export const VoiceStudio: React.FC<{ 
  onBandEvaluated?: (band: number) => void;
  onMistakesRecorded?: (mistakes: Array<{ original: string; better?: string; reason?: string }>, recentSpeech: string) => void;
  onOpenFlashcards?: () => void;
  isDarkTheme?: boolean;
  initialStudioTab?: 'interview' | 'analytics';
}> = ({ onBandEvaluated, onMistakesRecorded, onOpenFlashcards, isDarkTheme, initialStudioTab }) => {
  const [studioTab, setStudioTab] = useState<'interview' | 'analytics'>(initialStudioTab || 'interview');

  useEffect(() => {
    if (initialStudioTab) {
      setStudioTab(initialStudioTab);
    }
  }, [initialStudioTab]);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSessionRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ielts_speaking_sessions');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return INITIAL_PRACTICE_SESSIONS;
  });
  const [testPart, setTestPart] = useState<'Part 1' | 'Part 2' | 'Part 3' | 'Full Mock'>('Part 1');
  const [topic, setTopic] = useState('Hometown & Daily Habits');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'examiner',
      text: "Good day. My name is Dr. Arthur James, and I will be your IELTS speaking examiner today. Could you start by stating your full name and where you are from?",
      timestamp: '10:00 AM',
    },
  ]);

  // Voice recognition and audio states
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [typedInput, setTypedInput] = useState('');
  const [isExaminerThinking, setIsExaminerThinking] = useState(false);
  const [isSpeakingTTS, setIsSpeakingTTS] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Part 2 Cue Card Timer States
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(60);
  const [isPrepTimerRunning, setIsPrepTimerRunning] = useState(false);
  const [candidateNotes, setCandidateNotes] = useState('');
  const [speakSecondsLeft, setSpeakSecondsLeft] = useState(120);
  const [isSpeakTimerRunning, setIsSpeakTimerRunning] = useState(false);

  // Canvas audio visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  // Handle Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTypedInput(prev => (prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim()));
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Web Speech Synthesis for Examiner
  const speakExaminerText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const britishVoice = voices.find(v => v.lang.includes('GB') || v.name.includes('British') || v.name.includes('UK'));
    if (britishVoice) {
      utterance.voice = britishVoice;
    }

    setIsSpeakingTTS(true);
    utterance.onend = () => setIsSpeakingTTS(false);
    utterance.onerror = () => setIsSpeakingTTS(false);
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Recording
  const toggleRecording = () => {
    sound.playTap();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Could not start microphone:', err);
      }
    }
  };

  // Send candidate speech to Gemini Examiner
  const handleSendResponse = async () => {
    const speech = typedInput.trim() || interimTranscript.trim();
    if (!speech) return;

    sound.playTap();
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const newCandidateMessage: Message = {
      role: 'candidate',
      text: speech,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newCandidateMessage];
    setMessages(updatedMessages);
    setTypedInput('');
    setInterimTranscript('');
    setIsExaminerThinking(true);

    try {
      const response = await fetch('/api/gemini/examiner-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: updatedMessages.map(m => ({ role: m.role, text: m.text })),
          message: speech,
          testPart,
          topic,
        }),
      });

      const data = await response.json();
      const examinerReply = data.reply || "Thank you. Let's explore that topic further.";

      setMessages(prev => [
        ...prev,
        {
          role: 'examiner',
          text: examinerReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Play voice output
      speakExaminerText(examinerReply);
    } catch (err) {
      console.error('Examiner chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'examiner',
          text: "Thank you for sharing that. Could you tell me more about why you feel that way?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsExaminerThinking(false);
    }
  };

  // Official Band Rubric Evaluation with Gemini
  const handleEvaluateSpeaking = async () => {
    // Gather candidate responses
    const candidateUtterances = messages
      .filter(m => m.role === 'candidate')
      .map(m => m.text)
      .join(' ');

    const sample = candidateUtterances || typedInput || "I come from a bustling metropolitan city with high cost of living, but convenient amenities.";

    setIsEvaluating(true);
    sound.playTap();

    try {
      const lastExaminerQuestion = [...messages].reverse().find(m => m.role === 'examiner')?.text || 'Describe your hometown and work.';

      const res = await fetch('/api/gemini/evaluate-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: lastExaminerQuestion,
          candidateSpeech: sample,
          testPart,
          topic,
        }),
      });

      const data = await res.json();
      if (data && data.scores) {
        // Recalculate strictly using official IELTS rounding formula
        const calculatedOverall = calculateOverallBand(data.scores);
        data.overallBand = calculatedOverall;
        setEvaluationResult(data);
        onBandEvaluated?.(calculatedOverall);

        // Record to Speaking Analytics Practice Sessions
        const newRecord: PracticeSessionRecord = {
          id: `s-${Date.now()}`,
          sessionNumber: practiceSessions.length + 1,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          topic: topic,
          part: testPart,
          overallBand: calculatedOverall,
          fluency: data.scores.fluencyCoherence || 7.0,
          lexical: data.scores.lexicalResource || 7.0,
          grammar: data.scores.grammaticalRange || 7.0,
          pronunciation: data.scores.pronunciation || 7.0,
          examinerNotes: data.examinerSummary || 'Evaluated speaking mock.',
        };
        const updatedSessions = [...practiceSessions, newRecord];
        setPracticeSessions(updatedSessions);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ielts_speaking_sessions', JSON.stringify(updatedSessions));
          } catch (e) {}
        }

        if (data.vocabularySuggestions?.length > 0) {
          onMistakesRecorded?.(data.vocabularySuggestions, sample);
        }
        sound.playVictory();
      }
    } catch (err) {
      console.error('Failed to evaluate:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Cue card timers
  useEffect(() => {
    let interval: any = null;
    if (isPrepTimerRunning && prepSecondsLeft > 0) {
      interval = setInterval(() => setPrepSecondsLeft(p => p - 1), 1000);
    } else if (prepSecondsLeft === 0 && isPrepTimerRunning) {
      setIsPrepTimerRunning(false);
      sound.playReward();
    }
    return () => clearInterval(interval);
  }, [isPrepTimerRunning, prepSecondsLeft]);

  useEffect(() => {
    let interval: any = null;
    if (isSpeakTimerRunning && speakSecondsLeft > 0) {
      interval = setInterval(() => setSpeakSecondsLeft(s => s - 1), 1000);
    } else if (speakSecondsLeft === 0 && isSpeakTimerRunning) {
      setIsSpeakTimerRunning(false);
      sound.playReward();
    }
    return () => clearInterval(interval);
  }, [isSpeakTimerRunning, speakSecondsLeft]);

  // Animated sound wave visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = isRecording ? '#10b981' : isSpeakingTTS ? '#0284c7' : '#94a3b8';
      ctx.lineWidth = 2.5;

      const waveCount = isRecording ? 4 : isSpeakingTTS ? 3 : 1;
      const amplitude = isRecording ? 16 : isSpeakingTTS ? 12 : 3;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.05 * waveCount + phase) * amplitude * Math.sin((x / width) * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isRecording ? 0.15 : isSpeakingTTS ? 0.1 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isRecording, isSpeakingTTS]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Studio View Tabs: Live Mock Interview vs Speaking Analytics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-2.5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTap();
              setStudioTab('interview');
            }}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              studioTab === 'interview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Mock Interview</span>
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setStudioTab('analytics');
            }}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${
              studioTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
            }`}
          >
            <LineChartIcon className="w-4 h-4" />
            <span>Speaking Analytics</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              studioTab === 'analytics'
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}>
              10-Session Line Chart
            </span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 hidden sm:block">
          Official 9-Band Descriptors
        </div>
      </div>

      {studioTab === 'analytics' ? (
        <SpeakingAnalytics 
          sessions={practiceSessions}
          onStartPractice={() => setStudioTab('interview')}
          isDarkTheme={isDarkTheme}
        />
      ) : (
        <div className="space-y-6">
          {/* Studio Header & Mode Selector */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Gemini Realtime Speaking Studio
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-500 font-medium">Cambridge Standard Rubric</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            IELTS Speaking Examiner Interview
          </h1>
        </div>

        {/* Part Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          {(['Part 1', 'Part 2', 'Part 3', 'Full Mock'] as const).map((part) => (
            <button
              key={part}
              onClick={() => {
                sound.playTap();
                setTestPart(part);
                if (part === 'Part 2') {
                  setTopic('Describe a memorable journey by public transport');
                } else if (part === 'Part 3') {
                  setTopic('Future of Mass Transit & Urban Living');
                } else {
                  setTopic('Hometown & Daily Routine');
                }
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                testPart === part
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* Part 2 Cue Card Interactive Deck (Conditional) */}
      {testPart === 'Part 2' && (
        <div className="bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-850 border-2 border-sky-200 dark:border-sky-900 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4" />
                <span>Candidate Task Card (Part 2)</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Describe a memorable journey you took by public transport
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3">
                You should say:
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                <li>Where you traveled and what mode of transport you took</li>
                <li>Who accompanied you on this journey</li>
                <li>What occurred during the trip that made it memorable</li>
                <li>And explain why this journey left such a lasting impression on you.</li>
              </ul>
            </div>

            {/* Timers & Notes */}
            <div className="w-full md:w-72 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-sky-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-500" />
                  <span>1-Min Prep: {prepSecondsLeft}s</span>
                </div>
                <button
                  onClick={() => setIsPrepTimerRunning(!isPrepTimerRunning)}
                  className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-200 rounded-lg font-semibold"
                >
                  {isPrepTimerRunning ? 'Pause' : 'Start Prep'}
                </button>
              </div>

              <textarea
                value={candidateNotes}
                onChange={(e) => setCandidateNotes(e.target.value)}
                placeholder="Scratchpad: Note key vocabulary & bullet points here during prep..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800 dark:text-slate-200"
              />

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                <span>2-Min Speak: {speakSecondsLeft}s</span>
                <button
                  onClick={() => setIsSpeakTimerRunning(!isSpeakTimerRunning)}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 rounded-lg font-semibold"
                >
                  {isSpeakTimerRunning ? 'Pause' : 'Start Monologue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Viewport: Examiner Live Stage & Chat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Examiner Live Presence Card (Left Column) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center justify-between">
          <div>
            <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden border-4 border-slate-200 dark:border-slate-700 shadow-md mb-4 bg-slate-100">
              <img
                src="/src/assets/images/examiner_alistair_avatar_1793681330477.jpg"
                alt="Dr. Arthur James - IELTS Examiner"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {isSpeakingTTS && (
                <div className="absolute inset-0 bg-sky-500/10 border-2 border-sky-400 rounded-3xl animate-pulse" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Dr. Arthur James
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
              British Council Senior IELTS Examiner
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 mb-4">
              <span className={`w-2 h-2 rounded-full ${isSpeakingTTS ? 'bg-sky-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isSpeakingTTS ? 'Speaking Question...' : isExaminerThinking ? 'Formulating question...' : 'Listening intently'}</span>
            </div>
          </div>

          {/* Sound Wave Canvas */}
          <div className="w-full my-4 bg-slate-50 dark:bg-slate-850 rounded-2xl p-2 border border-slate-200 dark:border-slate-800">
            <canvas ref={canvasRef} width={260} height={48} className="w-full h-12 mx-auto" />
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono text-center mt-1">
              {isRecording ? 'Candidate Voice Input Active' : isSpeakingTTS ? 'Examiner Voice Active' : 'Real-time Audio Stream'}
            </div>
          </div>

          {/* Action trigger: Rubric Evaluation */}
          <button
            onClick={handleEvaluateSpeaking}
            disabled={isEvaluating}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm rounded-2xl shadow-[0_4px_0_0_#b45309] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isEvaluating ? 'Examiner Evaluating...' : 'Evaluate My Band Score'}</span>
          </button>
        </div>

        {/* Live Conversation Transcript & Input (Right Column) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[520px]">
          {/* Transcript Feed */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'candidate' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 text-[11px] font-bold text-slate-400">
                  <span>{m.role === 'examiner' ? 'Dr. Arthur James (Examiner)' : 'You (Candidate)'}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-sm font-medium max-w-[85%] leading-relaxed ${
                    m.role === 'candidate'
                      ? 'bg-emerald-500 text-white rounded-tr-none shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p>{m.text}</p>
                  {m.role === 'examiner' && (
                    <button
                      onClick={() => speakExaminerText(m.text)}
                      className="mt-2 text-xs flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      aria-label="Replay Audio"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Replay British Voice</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isExaminerThinking && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 italic p-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span>Dr. James is taking notes and preparing follow-up...</span>
              </div>
            )}

            {interimTranscript && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-xs font-medium text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 italic">
                Hearing: "{interimTranscript}"
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Speech Input & Microphone Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {/* Quick Answer Prompt Suggestions for Fast Practice */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Starters:</span>
              <button
                onClick={() => setTypedInput("To be perfectly candid, what strikes me most about my hometown is its harmonious blend of historical architecture and modern tech hubs.")}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                "To be candid, what strikes me most..."
              </button>
              <button
                onClick={() => setTypedInput("From an economic vantage point, while public subsidies carry fiscal weight, the environmental dividends are indisputable.")}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg whitespace-nowrap shrink-0 transition-colors"
              >
                "From an economic vantage point..."
              </button>
            </div>

            {/* Input row */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleRecording}
                aria-label={isRecording ? 'Stop Recording' : 'Start Speaking'}
                className={`p-4 rounded-2xl font-bold transition-all shadow-md active:translate-y-0.5 ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-[0_4px_0_0_#be123c]'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_4px_0_0_#059669]'
                }`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendResponse()}
                  placeholder={isRecording ? "Listening to your voice... (or edit here)" : "Speak or type your candidate response..."}
                  className="w-full py-3.5 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleSendResponse}
                disabled={!typedInput.trim() && !interimTranscript.trim()}
                aria-label="Send Answer"
                className="p-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white rounded-2xl transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Band Score Evaluation Report Modal */}
      {evaluationResult && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Official Cambridge IELTS Assessment
                  </span>
                  <span>·</span>
                  <span className="text-xs text-slate-500">Evaluated by Gemini AI Examiner</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  Speaking Performance & Band Report
                </h2>
              </div>

              {/* Overall Band Badge */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl px-5 py-3 text-center shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">Predicted Band</span>
                <span className="text-3xl font-black">{evaluationResult.overallBand.toFixed(1)}</span>
              </div>
            </div>

            {/* 4 Official Criteria Sub-Scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Fluency & Coherence</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {evaluationResult.scores.fluencyCoherence.toFixed(1)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evaluationResult.criteriaFeedback.fluency}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Lexical Resource</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {evaluationResult.scores.lexicalResource.toFixed(1)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evaluationResult.criteriaFeedback.lexical}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Grammar & Accuracy</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {evaluationResult.scores.grammaticalRange.toFixed(1)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evaluationResult.criteriaFeedback.grammar}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">Pronunciation</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {evaluationResult.scores.pronunciation.toFixed(1)}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{evaluationResult.criteriaFeedback.pronunciation}</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Key Strengths Observed
                </h4>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  {evaluationResult.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Areas to Reach Next Band
                </h4>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  {evaluationResult.improvements.map((imp, idx) => (
                    <li key={idx}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Band 8/9 Vocabulary & Collocation Upgrades */}
            {evaluationResult.vocabularySuggestions?.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Examiner Lexical Upgrades (Say this instead)
                </h4>
                <div className="space-y-2">
                  {evaluationResult.vocabularySuggestions.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="line-through text-slate-400 mr-2">"{v.original}"</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">→ "{v.better}"</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">{v.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Band 9 Answer */}
            {evaluationResult.band9Sample && (
              <div className="mb-6 p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl">
                <h4 className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  Model Band 9 Candidate Answer
                </h4>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  "{evaluationResult.band9Sample}"
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  sound.playCardFlip();
                  setEvaluationResult(null);
                  onOpenFlashcards?.();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-[0_3px_0_0_#047857] active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Review My Mistakes in AI Flashcards</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setEvaluationResult(null);
                }}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-2xl transition-colors"
              >
                Continue Practice & Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
