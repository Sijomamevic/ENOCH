
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  Sparkles, 
  BookOpen, 
  ScrollText, 
  Home, 
  Send, 
  MicOff, 
  Mic,
  Eye,
  ChevronLeft,
  CloudRain,
  Compass,
  Hexagon,
  Square
} from 'lucide-react';
import { ThemeMode, AppSection, Message } from './types';
import { THEME_STYLES, ENOCH_SYSTEM_INSTRUCTION } from './constants';
import { Avatar } from './components/Avatar';
import { AudioPlayer } from './components/AudioPlayer';
import { ChatBar } from './components/layout/ChatBar';
import { HomeSection } from './sections/HomeSection';
import { CounselRoom } from './sections/CounselRoom';
import { DialogueRoom } from './sections/DialogueRoom';
import { DreamMenu } from './sections/DreamMenu';
import { DreamInterpretRoom } from './sections/DreamInterpretRoom';
import { SymbolRoom } from './sections/SymbolRoom';
import { ai as defaultAi, decode, decodeAudioData, createBlob } from './services/gemini';
import { Modality, LiveServerMessage, GoogleGenAI } from '@google/genai';

const ENOCH_CHARACTER_PROMPT = `Ultra-realistic cinematic portrait of Enoch. Man 45-55, silver hair, serene expression, mystic black clothing.`;
const SPIRITUAL_LANDSCAPE_PROMPT = `Cinematic wide landscape, spiritual realm, indigo and violet tones, ethereal atmosphere.`;

const App: React.FC = () => {
  // UI States
  const [theme] = useState<ThemeMode>(ThemeMode.AURORA);
  const [section, setSection] = useState<AppSection>(AppSection.HOME);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Assets
  const [enochAvatarUrl, setEnochAvatarUrl] = useState<string>(() => localStorage.getItem('enoch_official_avatar') || "");
  const [landscapeUrl, setLandscapeUrl] = useState<string>(() => localStorage.getItem('enoch_landscape_avatar') || "");
  const [isManifesting, setIsManifesting] = useState(false);

  // Global Conversation States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentInputTranscript, setCurrentInputTranscript] = useState('');
  const [currentOutputTranscript, setCurrentOutputTranscript] = useState('');

  // Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isFinalizing = useRef(false);
  const ignoreModelAudioRef = useRef(false);

  const styles = THEME_STYLES[theme];

  // Asset Manifestation
  useEffect(() => {
    const manifestAssets = async () => {
      if (enochAvatarUrl && landscapeUrl) return;
      setIsManifesting(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        if (!enochAvatarUrl) {
          const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ parts: [{ text: ENOCH_CHARACTER_PROMPT }] }] });
          const url = `data:image/png;base64,${res.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data}`;
          setEnochAvatarUrl(url);
          localStorage.setItem('enoch_official_avatar', url);
        }
        if (!landscapeUrl) {
          const res = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: [{ parts: [{ text: SPIRITUAL_LANDSCAPE_PROMPT }] }] });
          const url = `data:image/png;base64,${res.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data}`;
          setLandscapeUrl(url);
          localStorage.setItem('enoch_landscape_avatar', url);
        }
      } catch (e) { console.error("Asset Manifest Error:", e); } finally { setIsManifesting(false); }
    };
    manifestAssets();
  }, [enochAvatarUrl, landscapeUrl]);

  // Cleanup Function
  const finalizeConversation = useCallback(() => {
    isFinalizing.current = true;
    
    // Stop Session
    if (liveSessionRef.current) {
        liveSessionRef.current = null;
    }

    // Stop all audio
    audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Stop Recognition
    if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
    }
    
    // Reset flags
    setIsLiveActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setCurrentInputTranscript('');
    setCurrentOutputTranscript('');
    
    setTimeout(() => { isFinalizing.current = false; }, 500);
  }, []);

  const interruptPlayback = useCallback(() => {
    // Para “barge-in”: para o áudio local imediatamente, mas mantém a sessão viva.
    audioSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        // ignore
      }
    });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
    ignoreModelAudioRef.current = true;
  }, []);

  // Handle Voice Sending
  const handleSendText = useCallback(async (textOverride?: string) => {
    const msg = textOverride || inputText;
    if (!msg.trim()) return;
    if (!textOverride) setInputText('');
    
    if (liveSessionRef.current) {
      liveSessionRef.current.sendRealtimeInput({ text: msg });
    } else {
      // If session is dead, we need to start it first (handled by UI toggle usually)
      console.warn("Session not active. Start session before sending.");
    }
  }, [inputText]);

  // STT Capture
  const startVoiceCapture = useCallback(() => {
    if (isFinalizing.current || !isLiveActive) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (!recognitionRef.current) {
      const rec = new SpeechRecognition();
      rec.lang = 'pt-BR';
      // Queremos uma conversa fluida: escuta contínua + capacidade de interromper.
      rec.interimResults = true;
      rec.continuous = true;

      rec.onaudiostart = () => {
        // Se Sophia/Enoch estiver falando e o usuário começar a falar, interrompe.
        if (isSpeaking) interruptPlayback();
      };

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e: any) => {
        // Pega o resultado final mais recente.
        const last = e.results[e.results.length - 1];
        const transcript = last?.[0]?.transcript?.trim();
        const isFinal = last?.isFinal;
        if (transcript && isFinal) handleSendText(transcript);
      };
      rec.onend = () => {
        setIsListening(false);
        // Reinicia automaticamente para manter a conversa viva.
        if (isLiveActive && !isFinalizing.current) {
          setTimeout(startVoiceCapture, 250);
        }
      };
      rec.onerror = () => setIsListening(false);
      recognitionRef.current = rec;
    }

    try { recognitionRef.current.start(); } catch (e) {}
  }, [isLiveActive, isSpeaking, handleSendText, interruptPlayback]);

  // LIVE SESSION START
  const startLiveSession = useCallback(async () => {
    if (isLiveActive || isFinalizing.current) return;

    try {
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;

      const voiceName = section === AppSection.DREAM_SYMBOL ? 'Kore' : 'Charon';
      let systemInstruction = ENOCH_SYSTEM_INSTRUCTION;
      if (section === AppSection.DREAM_SYMBOL) {
        systemInstruction = "Você é SOPHIA, a sabedoria consciente. Use voz feminina serena (Kore). Fale natural, clara e reflexiva; sem letargia. Evite dizer que você é o Gemini ou citar ferramentas. Responda como Sophia.";
      }

      const sessionPromise = defaultAi.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setTimeout(startVoiceCapture, 200);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              setIsSpeaking(false);
              ignoreModelAudioRef.current = false;
              return;
            }

            if (msg.serverContent?.inputTranscription) setCurrentInputTranscript(v => v + msg.serverContent!.inputTranscription!.text);
            if (msg.serverContent?.outputTranscription) setCurrentOutputTranscript(v => v + msg.serverContent!.outputTranscription!.text);
            
            if (msg.serverContent?.turnComplete) {
              setMessages(prev => [...prev, 
                { role: 'user', text: currentInputTranscript || "...", timestamp: Date.now() },
                { role: 'enoch', text: currentOutputTranscript || "...", timestamp: Date.now() }
              ]);
              setCurrentInputTranscript('');
              setCurrentOutputTranscript('');
              setIsSpeaking(false);
              ignoreModelAudioRef.current = false;
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && !ignoreModelAudioRef.current) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                    if (!isListening) startVoiceCapture();
                }
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onclose: () => finalizeConversation(),
          onerror: (e) => {
              console.error("Live Session Error:", e);
              finalizeConversation();
          },
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e) { 
        console.error("Connection Error:", e);
        finalizeConversation();
    }
  }, [section, finalizeConversation, startVoiceCapture, currentInputTranscript, currentOutputTranscript, isLiveActive]);

  // Controls Toggle
  const toggleSession = () => {
    if (isLiveActive) finalizeConversation();
    else startLiveSession();
  };

  const changeSection = (s: AppSection) => {
    finalizeConversation();
    setSection(s);
  };

  const getPlaceholder = () => {
    if (section === AppSection.DREAM_SYMBOL) return "Explore um símbolo com Sophia...";
    if (section === AppSection.DREAM_INTERPRET) return "Relate seu sonho para Enoch...";
    return "Fale ou escreva para Enoch...";
  };

  return (
    <div className={`flex h-screen ${styles.bg} ${styles.text} transition-all duration-1000 overflow-hidden`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 ${styles.sidebar} border-r ${styles.border} transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-500 md:relative md:translate-x-0 ${[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL].includes(section) ? 'md:w-0 md:opacity-0 md:-ml-72' : 'md:w-72'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-indigo-500/10 rounded-xl"><Sparkles className="text-indigo-500" size={28} /></div>
            <h1 className="text-2xl font-cinzel font-bold text-stone-800">ENOCH</h1>
          </div>
          <nav className="flex-1 space-y-2">
            {[
              { id: AppSection.HOME, icon: Home, label: 'Painel' },
              { id: AppSection.DIALOGUE, icon: Mic, label: 'Escuta Interior' },
              { id: AppSection.COUNSEL, icon: Eye, label: 'Encontro Sagrado' },
              { id: AppSection.DREAM, icon: ScrollText, label: 'Sonhos e Símbolos' },
              { id: AppSection.PARABLES, icon: BookOpen, label: 'Sabedoria' },
            ].map((item) => (
              <button key={item.id} onClick={() => changeSection(item.id)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${section === item.id ? styles.accent + ' text-white shadow-lg' : styles.hover + ' opacity-60 hover:opacity-100'}`}>
                <item.icon size={22} /><span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative transition-all duration-1000">
        
        {/* Back Button */}
        {[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL].includes(section) && (
          <button 
            onClick={() => changeSection(section === AppSection.COUNSEL ? AppSection.HOME : AppSection.DREAM)}
            className="fixed top-8 right-8 z-[150] p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-all backdrop-blur-md"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto relative pb-40">
          {section === AppSection.HOME && (
            <HomeSection landscapeUrl={landscapeUrl} onGo={changeSection} />
          )}

          {section === AppSection.COUNSEL && (
            <CounselRoom enochAvatarUrl={enochAvatarUrl} isSpeaking={isSpeaking} output={currentOutputTranscript} />
          )}

          {section === AppSection.DREAM_SYMBOL && (
            <SymbolRoom output={currentOutputTranscript} />
          )}

          {section === AppSection.DREAM_INTERPRET && (
            <DreamInterpretRoom output={currentOutputTranscript} />
          )}

          {section === AppSection.DIALOGUE && (
            <DialogueRoom isListening={isListening} isSpeaking={isSpeaking} output={currentOutputTranscript} input={currentInputTranscript} />
          )}

          {section === AppSection.DREAM && (
            <DreamMenu onGo={changeSection} />
          )}
        </div>

        {[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL, AppSection.DIALOGUE].includes(section) && (
          <ChatBar
            inputText={inputText}
            setInputText={setInputText}
            placeholder={getPlaceholder()}
            onSend={() => handleSendText()}
            onMic={() => {
              // Mic único:
              // - Se estiver falando: interrompe (barge-in manual)
              // - Se estiver ativo e não falando: encerra sessão
              // - Se estiver inativo: inicia sessão
              if (isLiveActive) {
                if (isSpeaking) interruptPlayback();
                else finalizeConversation();
              } else {
                startLiveSession();
              }
            }}
            isLiveActive={isLiveActive}
            isSpeaking={isSpeaking}
          />
        )}
      </main>

      <AudioPlayer isDucking={isLiveActive} />
    </div>
  );
};

export default App;
