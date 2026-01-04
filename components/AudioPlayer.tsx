
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward } from 'lucide-react';
import { AUDIO_TRACKS } from '../constants';

interface AudioPlayerProps {
  isDucking?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isDucking = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setTrackIndex((prev) => (prev + 1) % AUDIO_TRACKS.length);
    setIsPlaying(true);
  };

  // Efeito de Ducking
  useEffect(() => {
    if (audioRef.current) {
      const targetVolume = isMuted ? 0 : (isDucking ? volume * 0.2 : volume);
      audioRef.current.volume = targetVolume;
    }
  }, [volume, isMuted, isDucking]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
        audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [trackIndex, isPlaying]);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg border border-stone-200 transition-all">
      <audio 
        ref={audioRef} 
        src={AUDIO_TRACKS[trackIndex].url} 
        loop 
        onEnded={nextTrack}
      />
      
      <button 
        onClick={togglePlay}
        className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <div className="hidden md:flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">Música de Fundo</span>
        <span className="text-xs font-medium text-stone-800 max-w-[100px] truncate">
          {AUDIO_TRACKS[trackIndex].name}
        </span>
      </div>

      <button onClick={nextTrack} className="p-1 hover:text-stone-600 transition-colors">
        <SkipForward size={16} />
      </button>

      <div className="flex items-center gap-2 px-2 border-l border-stone-200">
        <button onClick={() => setIsMuted(!isMuted)} className="text-stone-500">
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-400"
        />
      </div>
    </div>
  );
};
