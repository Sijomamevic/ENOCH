import React from 'react';
import { Avatar } from '../components/Avatar';

type Props = {
  enochAvatarUrl: string;
  isSpeaking: boolean;
  output: string;
};

export function CounselRoom({ enochAvatarUrl, isSpeaking, output }: Props) {
  return (
    <div className="h-full bg-black flex flex-col items-center justify-center p-8">
      <Avatar isPortrait src={enochAvatarUrl} size="w-[500px] h-[500px]" className={isSpeaking ? 'scale-105' : ''} />
      <div className="mt-12 max-w-2xl text-center">
        <p className="text-3xl font-playfair italic text-white/80">{output || 'Enoch aguarda em silêncio...'}</p>
      </div>
    </div>
  );
}
