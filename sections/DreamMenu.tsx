import React from 'react';
import { CloudRain, Compass } from 'lucide-react';
import { AppSection } from '../types';

type Props = {
  onGo: (s: AppSection) => void;
};

export function DreamMenu({ onGo }: Props) {
  return (
    <div className="max-w-4xl mx-auto pt-32 px-8 grid grid-cols-2 gap-8">
      <button onClick={() => onGo(AppSection.DREAM_INTERPRET)} className="p-12 rounded-[3rem] bg-white border-2 border-stone-200 hover:shadow-xl transition-all">
        <CloudRain className="mb-6 text-indigo-500" size={48} />
        <h3 className="font-bold text-2xl">Interpretar Sonho</h3>
      </button>
      <button onClick={() => onGo(AppSection.DREAM_SYMBOL)} className="p-12 rounded-[3rem] bg-white border-2 border-stone-200 hover:shadow-xl transition-all">
        <Compass className="mb-6 text-amber-500" size={48} />
        <h3 className="font-bold text-2xl">Explorar Símbolo</h3>
      </button>
    </div>
  );
}
