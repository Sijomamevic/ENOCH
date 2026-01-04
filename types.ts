
export enum ThemeMode {
  AURORA = 'aurora',
  NOITE = 'noite'
}

export enum AppSection {
  HOME = 'home',
  DREAM = 'dream',
  DREAM_INTERPRET = 'dream_interpret',
  DREAM_SYMBOL = 'dream_symbol',
  COUNSEL = 'counsel',
  DIALOGUE = 'dialogue',
  DIARY = 'diary',
  PARABLES = 'parables'
}

export interface DreamEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  interpretation: string;
  symbols: string[];
}

export interface Message {
  role: 'user' | 'enoch';
  text: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  email: string;
  credits: number;
  avatar: string;
}

export interface Parable {
  id: string;
  title: string;
  content: string;
  category: string;
  tradition: string;
}
