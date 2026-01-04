
import React, { useState, useEffect } from 'react';

interface AvatarProps {
  size?: string;
  className?: string;
  isPortrait?: boolean;
  src?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  size = "w-32 h-32", 
  className = "", 
  isPortrait = false,
  src = "lucid-origin_Ultra-realistic_cinematic_portrait_of_a_youthful_calm_and_mystic.png"
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  if (isPortrait) {
    return (
      <div className={`relative ${size} ${className} flex items-center justify-center z-20`}>
        {/* Luz de destaque de fundo */}
        <div className="absolute inset-0 bg-white/5 blur-[120px] rounded-full scale-90 opacity-40 pointer-events-none" />
        
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 z-30">
            <div className="w-12 h-12 border-2 border-white/10 border-t-white/40 rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Manifestando...</span>
          </div>
        )}

        {hasError ? (
          <div className="w-full h-full bg-slate-900/60 border border-white/5 flex items-center justify-center text-center p-12 z-20 rounded-[4rem] shadow-inner">
            {/* Removido texto técnico para manter a imersão */}
            <div className="w-24 h-1 bg-white/5 rounded-full animate-pulse" />
          </div>
        ) : (
          <img 
            src={src} 
            alt="Enoch Retrato Sagrado" 
            onLoad={() => setIsLoading(false)}
            onError={() => { 
              if (!src?.startsWith('blob:')) {
                setHasError(true); 
              }
              setIsLoading(false); 
            }}
            className={`w-full h-full object-contain relative z-20 transition-all duration-700 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          />
        )}
        
        {/* Camadas atmosféricas */}
        {!hasError && !isLoading && (
          <>
            <div className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-t from-[#01040a] via-transparent to-transparent opacity-40" />
            <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
          </>
        )}
      </div>
    );
  }

  // Versão circular
  return (
    <div className={`relative ${size} ${className} overflow-hidden rounded-full border-4 border-white/20 shadow-2xl bg-stone-200 flex items-center justify-center`}>
      {hasError ? (
        <span className="text-stone-400 font-cinzel font-bold text-4xl">E</span>
      ) : (
        <img 
          src={src} 
          alt="Enoch Mini" 
          onError={() => setHasError(true)}
          className="w-full h-full object-cover grayscale brightness-110 contrast-110"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
};
