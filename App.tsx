
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
  Square,
  Star,
  User,
  Waves
} from 'lucide-react';
import { ThemeMode, AppSection, Message } from './types';
import { THEME_STYLES, ENOCH_SYSTEM_INSTRUCTION } from './constants';
import { Avatar } from './components/Avatar';
import { AudioPlayer } from './components/AudioPlayer';
import { ai as defaultAi, decode, decodeAudioData, createBlob } from './services/gemini';
import { Modality, LiveServerMessage, GoogleGenAI } from '@google/genai';

const ENOCH_CHARACTER_PROMPT = `Ultra-realistic cinematic portrait of Enoch. Man 45-55, silver hair, serene expression, mystic black clothing.`;
const SPIRITUAL_LANDSCAPE_PROMPT = `Cinematic wide landscape, spiritual realm, divine waterfall at sunset, indigo and violet tones, ethereal atmosphere.`;

const App: React.FC = () => {
  const [theme] = useState<ThemeMode>(ThemeMode.AURORA);
  const [section, setSection] = useState<AppSection>(AppSection.HOME);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  
  const [enochAvatarUrl, setEnochAvatarUrl] = useState<string>(() => localStorage.getItem('enoch_official_avatar') || "");
  const [landscapeUrl, setLandscapeUrl] = useState<string>(() => localStorage.getItem('enoch_landscape_avatar') || "");
  const [isManifesting, setIsManifesting] = useState(false);

  // Global States
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentInputTranscript, setCurrentInputTranscript] = useState('');
  const [currentOutputTranscript, setCurrentOutputTranscript] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'enoch', text: string}[]>([]);

  // Refs para Áudio e Sessão
  const liveSessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const styles = THEME_STYLES[theme];

  // Auto-scroll para o histórico
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, currentInputTranscript, currentOutputTranscript]);

  // Geração de Assets
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
      } catch (e) { console.error("Erro ao gerar assets:", e); } finally { setIsManifesting(false); }
    };
    manifestAssets();
  }, [enochAvatarUrl, landscapeUrl]);

  // Função para limpar e encerrar tudo
  const finalizeConversation = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    audioSourcesRef.current.forEach(source => { try { source.stop(); } catch(e) {} });
    audioSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();

    setIsLiveActive(false);
    setIsSpeaking(false);
    setCurrentInputTranscript('');
    setCurrentOutputTranscript('');
  }, []);

  // Envio de Texto
  const handleSendText = useCallback(async () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setInputText('');
    
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);

    if (liveSessionRef.current) {
      liveSessionRef.current.sendRealtimeInput({ text: msg });
    } else {
      await startLiveSession(msg);
    }
  }, [inputText]);

  // Início da Sessão de Voz e Texto
  const startLiveSession = useCallback(async (initialText?: string) => {
    if (isLiveActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      // VOZ: Feminina (Kore) apenas em DREAM_SYMBOL (Sophia). 
      // Escuta Interior, Encontro Sagrado e Interpretação usam Enoch (Charon).
      const voiceName = (section === AppSection.DREAM_SYMBOL) ? 'Kore' : 'Charon';
      
      let systemInstruction = ENOCH_SYSTEM_INSTRUCTION;
      
      if (section === AppSection.DREAM_SYMBOL) {
        systemInstruction = "Você é SOPHIA, a sabedoria consciente. Use voz feminina (Kore). Responda com profundidade sobre símbolos e arquétipos.";
      } else if (section === AppSection.DIALOGUE) {
        systemInstruction = ENOCH_SYSTEM_INSTRUCTION + " Você está no Santuário de Escuta Interior. Seja breve e meditativo.";
      } else if (section === AppSection.DREAM_INTERPRET) {
        systemInstruction = ENOCH_SYSTEM_INSTRUCTION + " Você é o Intérprete de Sonhos. Ouça o relato do usuário e decifre os significados ocultos no subconsciente.";
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
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              if (liveSessionRef.current) {
                liveSessionRef.current.sendRealtimeInput({ media: pcmBlob });
              } else {
                sessionPromise.then(session => {
                  if (session) session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            if (initialText) {
              sessionPromise.then(session => session.sendRealtimeInput({ text: initialText }));
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              audioSourcesRef.current.clear();
              setIsSpeaking(false);
              return;
            }

            if (msg.serverContent?.inputTranscription) {
               setCurrentInputTranscript(prev => prev + msg.serverContent!.inputTranscription!.text);
            }
            if (msg.serverContent?.outputTranscription) {
               setCurrentOutputTranscript(prev => prev + msg.serverContent!.outputTranscription!.text);
            }
            
            if (msg.serverContent?.turnComplete) {
              setChatHistory(prev => {
                const newHist = [...prev];
                if (currentInputTranscript) newHist.push({ role: 'user', text: currentInputTranscript });
                if (currentOutputTranscript) newHist.push({ role: 'enoch', text: currentOutputTranscript });
                return newHist;
              });
              setIsSpeaking(false);
              setCurrentInputTranscript('');
              setCurrentOutputTranscript('');
            }

            const audioData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onclose: () => finalizeConversation(),
          onerror: (e) => { console.error("Sessão interrompida:", e); finalizeConversation(); },
        }
      });

      liveSessionRef.current = await sessionPromise;

    } catch (e) { 
      console.error("Falha ao ativar escuta:", e); 
      finalizeConversation(); 
    }
  }, [section, finalizeConversation, isLiveActive, currentInputTranscript, currentOutputTranscript]);

  const changeSection = (s: AppSection) => {
    finalizeConversation();
    setSection(s);
    setChatHistory([]);
  };

  const renderTranscriptionHistory = () => (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[60vh] custom-scrollbar" ref={scrollRef}>
      {chatHistory.map((chat, i) => (
        <div key={i} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${chat.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100' : 'bg-white/5 border border-white/10 text-stone-300 font-playfair italic'}`}>
            {chat.text}
          </div>
        </div>
      ))}
      {currentInputTranscript && (
        <div className="flex flex-col items-end animate-pulse">
           <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm bg-indigo-600/40 border border-indigo-500/50 text-white">
            {currentInputTranscript}
          </div>
        </div>
      )}
      {currentOutputTranscript && (
        <div className="flex flex-col items-start">
          <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm bg-white/10 border border-white/20 text-white font-playfair italic">
            {currentOutputTranscript}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex h-screen ${styles.bg} ${styles.text} transition-all duration-1000 overflow-hidden`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 ${styles.sidebar} border-r ${styles.border} transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-all duration-500 md:relative md:translate-x-0 ${[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL].includes(section) ? 'md:w-0 md:opacity-0 md:-ml-72' : 'md:w-72'}`}>
        <div className="flex flex-col h-full p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="p-2 bg-indigo-500/10 rounded-xl"><Sparkles className="text-indigo-500" size={28} /></div>
            <h1 className="text-2xl font-cinzel font-bold text-stone-800 text-shadow-sm">ENOCH</h1>
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

      <main className="flex-1 flex flex-col relative transition-all duration-1000">
        
        {/* Back Button */}
        {[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL, AppSection.DIALOGUE].includes(section) && (
          <button 
            onClick={() => changeSection(section === AppSection.DIALOGUE || section === AppSection.COUNSEL ? AppSection.HOME : AppSection.DREAM)}
            className="fixed top-8 left-8 z-[150] p-4 rounded-full bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 transition-all backdrop-blur-md"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="flex-1 overflow-y-auto relative">
          
          {/* HOME */}
          {section === AppSection.HOME && (
            <div className="max-w-4xl mx-auto pt-24 px-8 text-center space-y-12">
              <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl group">
                <img src={landscapeUrl || "https://images.unsplash.com/photo-1464802686167-b939a6910659"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" alt="" />
                <div className="absolute inset-0 bg-stone-50/20" />
              </div>
              <h2 className="text-6xl font-cinzel font-bold tracking-tighter">BEM-VINDO AO PORTAL</h2>
              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => changeSection(AppSection.DIALOGUE)} className="p-8 rounded-[2.5rem] bg-white border-2 border-stone-200 text-left hover:shadow-xl transition-all">
                  <Mic className="mb-4 text-indigo-500" size={32} />
                  <h3 className="font-bold text-xl">Escuta Interior</h3>
                </button>
                <button onClick={() => changeSection(AppSection.COUNSEL)} className="p-8 rounded-[2.5rem] bg-stone-900 text-white text-left hover:shadow-xl transition-all">
                  <Eye className="mb-4 text-indigo-300" size={32} />
                  <h3 className="font-bold text-xl">Encontro Sagrado</h3>
                </button>
              </div>
            </div>
          )}

          {/* ESCUTA INTERIOR (ENOCH - VOZ MASCULINA) */}
          {section === AppSection.DIALOGUE && (
            <div className="h-full relative overflow-hidden flex bg-black">
              {/* Lado Esquerdo: Visual */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-8 border-r border-white/5">
                <div className="absolute inset-0 z-0">
                  <img 
                    src={landscapeUrl || "https://images.unsplash.com/photo-1464802686167-b939a6910659"} 
                    className="w-full h-full object-cover opacity-30 blur-sm animate-pulse-slow" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#05070a]/80 via-transparent to-[#05070a]" />
                </div>

                <div className={`relative z-10 transition-all duration-1000 ${isLiveActive ? 'scale-110' : 'scale-90 opacity-40 grayscale'}`}>
                  <div className={`absolute -inset-24 border border-white/5 rounded-full transition-all duration-700 ${isLiveActive ? 'rotate-[30deg] scale-100 opacity-20' : 'rotate-0 scale-75 opacity-0'}`} />
                  <div className={`relative w-48 h-48 rounded-full transition-all duration-700 overflow-hidden flex items-center justify-center
                    ${isSpeaking ? 'shadow-[0_0_100px_rgba(251,191,36,0.3)] bg-amber-500/10' : 'shadow-[0_0_80px_rgba(79,70,229,0.4)] bg-indigo-900/20'} 
                    border border-white/20 backdrop-blur-xl`}>
                    <div className={`absolute inset-0 opacity-40 transition-colors duration-1000 ${isSpeaking ? 'bg-amber-400' : 'bg-indigo-600'} blur-2xl animate-pulse`} />
                    <div className="relative z-20">
                      {isSpeaking ? <Star className="text-amber-200 animate-spin-slow" size={32} /> : <Hexagon className="text-indigo-200 animate-pulse" size={32} />}
                    </div>
                  </div>
                  {isSpeaking && <div className="absolute -inset-12 border-2 border-amber-500/30 rounded-full animate-ping" />}
                </div>
                <div className="mt-12 text-center z-10">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                      <div className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
                      <span className="text-[10px] uppercase font-black tracking-widest text-white/60">Santuário de Escuta</span>
                   </div>
                </div>
              </div>

              {/* Lado Direito: Histórico de Conversa */}
              <div className="w-[400px] h-full bg-stone-900/40 backdrop-blur-3xl flex flex-col pt-24 pb-32">
                 <div className="px-6 mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30">Registros de Alma</h3>
                 </div>
                 {renderTranscriptionHistory()}
              </div>
            </div>
          )}

          {/* ENCONTRO SAGRADO (ENOCH - VOZ MASCULINA) */}
          {section === AppSection.COUNSEL && (
            <div className="h-full relative overflow-hidden flex bg-black">
              {/* Lado Esquerdo: Enoch */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-8 border-r border-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_70%)]" />
                <Avatar 
                  isPortrait 
                  src={enochAvatarUrl} 
                  size="w-[400px] h-[400px]" 
                  className={`${isSpeaking ? 'scale-105 brightness-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.1)]' : 'scale-100'} transition-all duration-700 ease-out`} 
                />
                {!isLiveActive && (
                  <div className="mt-8 animate-bounce">
                    <span className="text-white/20 text-[10px] uppercase tracking-[0.5em] font-black">Inicie o Mestre</span>
                  </div>
                )}
              </div>

              {/* Lado Direito: Histórico de Conversa */}
              <div className="w-[400px] h-full bg-stone-900/40 backdrop-blur-3xl flex flex-col pt-24 pb-32">
                 <div className="px-6 mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30">Diálogo Sábio</h3>
                 </div>
                 {renderTranscriptionHistory()}
              </div>
            </div>
          )}

          {/* INTERPRETAÇÃO DE SONHOS (ENOCH - LAYOUT ONÍRICO) */}
          {section === AppSection.DREAM_INTERPRET && (
            <div className="h-full relative overflow-hidden flex bg-[#030712]">
              {/* Lado Esquerdo: Atmosfera Onírica */}
              <div className="flex-1 relative flex flex-col items-center justify-center p-8 border-r border-white/5 overflow-hidden">
                {/* Efeito de Nebulosa */}
                <div className="absolute inset-0 z-0">
                  <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-900/40 blur-[150px] animate-pulse rounded-full" />
                  <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-900/30 blur-[120px] animate-pulse-slow rounded-full" />
                </div>
                
                {/* Portal de Visão */}
                <div className={`relative z-10 w-64 h-64 flex items-center justify-center transition-all duration-1000 ${isLiveActive ? 'scale-110' : 'scale-100 opacity-60'}`}>
                  <div className={`absolute inset-0 rounded-full border-2 border-indigo-400/20 blur-[2px] ${isSpeaking ? 'animate-ping' : ''}`} />
                  <div className={`absolute -inset-4 rounded-full border border-indigo-500/10 blur-[4px] ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-indigo-950/80 to-slate-900/80 backdrop-blur-2xl flex items-center justify-center overflow-hidden shadow-[0_0_80px_rgba(79,70,229,0.2)]">
                    <Waves className={`text-indigo-400/40 ${isSpeaking ? 'animate-bounce' : 'animate-pulse'}`} size={48} />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6))] " />
                  </div>
                </div>

                <div className="mt-16 text-center z-10 max-w-md">
                   <h2 className="text-3xl font-cinzel font-bold text-indigo-100/80 tracking-widest mb-4">Portal Onírico</h2>
                   <p className="text-sm font-playfair italic text-white/40 leading-relaxed">
                     As imagens da noite são pontes para o desconhecido. Relate sua visão para o Intérprete.
                   </p>
                </div>
              </div>

              {/* Lado Direito: Registro Onírico */}
              <div className="w-[400px] h-full bg-stone-900/40 backdrop-blur-3xl flex flex-col pt-24 pb-32">
                 <div className="px-6 mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30">Visões Decifradas</h3>
                 </div>
                 {renderTranscriptionHistory()}
              </div>
            </div>
          )}

          {/* EXPLORAR SÍMBOLO (SOPHIA - VOZ FEMININA) */}
          {section === AppSection.DREAM_SYMBOL && (
            <div className="h-full relative overflow-hidden flex bg-[#0a0c14]">
               {/* Lado Esquerdo: Sophia Visual */}
               <div className="flex-1 relative flex flex-col items-center justify-center p-8 border-r border-white/5">
                  <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse" />
                  </div>
                  <div className="relative z-10 text-center space-y-12">
                    <h2 className="text-6xl font-cinzel font-bold text-white tracking-[0.2em]">Sophia</h2>
                    <div className={`w-32 h-32 mx-auto rounded-full border-2 border-white/10 flex items-center justify-center transition-all duration-1000 ${isSpeaking ? 'bg-indigo-500/20 scale-110' : 'bg-transparent scale-100'}`}>
                      <Star className={`text-indigo-200 ${isSpeaking ? 'animate-spin-slow' : 'opacity-20'}`} size={48} />
                    </div>
                  </div>
               </div>

               {/* Lado Direito: Histórico */}
               <div className="w-[400px] h-full bg-stone-900/40 backdrop-blur-3xl flex flex-col pt-24 pb-32">
                 <div className="px-6 mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30">Arquétipos Desvelados</h3>
                 </div>
                 {renderTranscriptionHistory()}
              </div>
            </div>
          )}

          {/* DREAM MENU */}
          {section === AppSection.DREAM && (
            <div className="max-w-4xl mx-auto pt-32 px-8 grid grid-cols-2 gap-8">
              <button onClick={() => changeSection(AppSection.DREAM_INTERPRET)} className="p-12 rounded-[3rem] bg-white border-2 border-stone-200 hover:shadow-xl transition-all text-left">
                 <CloudRain className="mb-6 text-indigo-500" size={48} />
                 <h3 className="font-bold text-2xl">Interpretar Sonho</h3>
                 <p className="text-stone-500 text-sm mt-2">Relate suas visões noturnas.</p>
              </button>
              <button onClick={() => changeSection(AppSection.DREAM_SYMBOL)} className="p-12 rounded-[3rem] bg-white border-2 border-stone-200 hover:shadow-xl transition-all text-left">
                 <Compass className="mb-6 text-amber-500" size={48} />
                 <h3 className="font-bold text-2xl">Explorar Símbolo</h3>
                 <p className="text-stone-500 text-sm mt-2">Sophia desvela o significado das formas.</p>
              </button>
            </div>
          )}
        </div>

        {/* CHAT BAR */}
        {[AppSection.COUNSEL, AppSection.DREAM_INTERPRET, AppSection.DREAM_SYMBOL, AppSection.DIALOGUE].includes(section) && (
          <div className="fixed bottom-12 left-0 right-0 z-[200] pointer-events-none flex justify-center px-8">
            <div className="pointer-events-auto flex items-center gap-4 bg-stone-900/90 backdrop-blur-3xl p-2 md:p-3 rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full max-w-2xl transition-all duration-500 hover:border-white/20">
               <div className="flex-1 relative flex items-center">
                 <input 
                   type="text" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
                   placeholder={isLiveActive ? "Relate sua visão..." : "Escreva sua dúvida ou sintonize sua voz..."}
                   className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-6 py-4 text-lg font-playfair italic"
                 />
               </div>
               <div className="flex items-center gap-2 pr-2">
                  <button 
                    onClick={isLiveActive ? finalizeConversation : () => startLiveSession()}
                    className={`p-5 rounded-full transition-all active:scale-95 flex items-center justify-center ${isLiveActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10 hover:text-white'}`}
                  >
                    {isLiveActive ? (
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-4 bg-white/40 animate-pulse" />
                        <div className="w-1 h-6 bg-white animate-pulse" />
                        <div className="w-1 h-4 bg-white/40 animate-pulse" />
                      </div>
                    ) : <Mic size={24} />}
                  </button>
                  <button 
                    onClick={handleSendText} 
                    disabled={!inputText.trim()}
                    className="p-5 rounded-full bg-white text-stone-900 hover:bg-indigo-50 transition-colors disabled:opacity-30"
                  >
                    <Send size={24} />
                  </button>
               </div>
            </div>
          </div>
        )}
      </main>

      <AudioPlayer isDucking={isLiveActive} />
    </div>
  );
};

export default App;
