import React from 'react';
import { Eye, Mic } from 'lucide-react';
import { AppSection } from '../types';

type Props = {
  landscapeUrl: string;
  onGo: (s: AppSection) => void;
};

export function HomeSection({ landscapeUrl, onGo }: Props) {
  return (
    <div className="max-w-4xl mx-auto pt-24 px-8 text-center space-y-12">
      <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl group">
        <img
          src={landscapeUrl || 'https://images.unsplash.com/photo-1464802686167-b939a6910659'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]"
          alt=""
        />
        <div className="absolute inset-0 bg-stone-50/20" />
      </div>
      <h2 className="text-6xl font-cinzel font-bold tracking-tighter">BEM-VINDO AO PORTAL</h2>
      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onGo(AppSection.DIALOGUE)}
          className="p-8 rounded-[2.5rem] bg-white border-2 border-stone-200 text-left hover:shadow-xl transition-all"
        >
          <Mic className="mb-4 text-indigo-500" size={32} />
          <h3 className="font-bold text-xl">Escuta Interior</h3>
        </button>
        <button
          onClick={() => onGo(AppSection.COUNSEL)}
          className="p-8 rounded-[2.5rem] bg-stone-900 text-white text-left hover:shadow-xl transition-all"
        >
          <Eye className="mb-4 text-indigo-300" size={32} />
          <h3 className="font-bold text-xl">Encontro Sagrado</h3>
        </button>
      </div>
    </div>
  );
}
