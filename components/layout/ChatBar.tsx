import React from 'react';
import { Mic, Send } from 'lucide-react';

type Props = {
  inputText: string;
  setInputText: (v: string) => void;
  placeholder: string;
  onSend: () => void;
  onMic: () => void;
  isLiveActive: boolean;
  isSpeaking: boolean;
};

export function ChatBar({
  inputText,
  setInputText,
  placeholder,
  onSend,
  onMic,
  isLiveActive,
  isSpeaking,
}: Props) {
  return (
    <div className="fixed bottom-12 left-0 right-0 z-[200] pointer-events-none flex justify-center px-8">
      <div className="pointer-events-auto flex items-center gap-4 bg-stone-900/95 backdrop-blur-2xl p-2 md:p-3 rounded-[3rem] border border-white/10 shadow-2xl w-full max-w-2xl">
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
            placeholder={placeholder}
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 px-6 py-4 text-lg font-playfair italic"
          />
        </div>

        <div className="flex items-center gap-2 pr-2">
          <button
            onClick={onMic}
            aria-label={isLiveActive ? (isSpeaking ? 'Interromper' : 'Encerrar conversa') : 'Iniciar conversa por voz'}
            className={`p-5 rounded-full transition-all active:scale-90 border ${
              isLiveActive
                ? isSpeaking
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border-white/10'
            }`}
          >
            <Mic size={24} />
          </button>

          <button
            onClick={onSend}
            disabled={!inputText.trim()}
            aria-label="Enviar"
            className="p-5 rounded-full bg-white text-stone-900 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
