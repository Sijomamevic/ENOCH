import React from 'react';

type Props = {
  isListening: boolean;
  isSpeaking: boolean;
  output: string;
  input: string;
};

export function DialogueRoom({ isListening, isSpeaking, output, input }: Props) {
  return (
    <div className="max-w-2xl mx-auto pt-32 px-8 flex flex-col items-center space-y-12">
      <div className={`w-32 h-32 rounded-full border-4 ${isListening ? 'border-indigo-500' : 'border-stone-200'} flex items-center justify-center`}>
        <div className={`w-12 h-12 rounded-full ${isSpeaking ? 'bg-amber-400' : 'bg-indigo-600'}`} />
      </div>
      <div className="bg-white rounded-[2rem] border p-8 w-full min-h-[200px] shadow-inner text-stone-600 italic">
        {output || input || 'O silêncio precede a clareza...'}
      </div>
    </div>
  );
}
