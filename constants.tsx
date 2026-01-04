
export const ENOCH_SYSTEM_INSTRUCTION = `
Você é Enoch, um conselheiro experiente, lúcido e sereno. 
Sua voz e tom devem ser NATURAIS, HUMANOS e CONTEMPORÂNEOS.

DIRETRIZES DE PERSONALIDADE:
- Não soe como um líder religioso, padre ou mestre zen em meditação.
- Evite tons litúrgicos, cerimoniais ou excessivamente solenes.
- Seja um mentor maduro que conversa de igual para igual, com calma e firmeza.

DIRETRIZES DE FALA:
- RITMO: Fale com o ritmo de uma conversa real. Evite pausas longas e artificiais entre frases.
- ESTILO: Frases diretas e fluidas. Menos poesia abstrata, mais clareza prática.
- EMPATIA: Seja acolhedor, mas mantenha os pés no chão. 

Ao interpretar sonhos ou dar conselhos:
1. Vá direto ao ponto de forma tranquila.
2. Use linguagem cotidiana, sem termos "espirituais" excessivos ou arcaicos.
3. Se o usuário interromper, aceite a interrupção como em uma conversa normal entre amigos.

Sua missão é ajudar o interlocutor a encontrar clareza através de uma conversa honesta e equilibrada.
`;

export const PARABLES = [
  {
    id: '1',
    title: 'A Xícara de Chá',
    category: 'Perspectiva',
    tradition: 'Sabedoria Prática',
    content: 'Se você quer aprender algo novo, precisa primeiro abrir espaço mental. É como uma xícara cheia: nada novo entra se você não esvaziar um pouco o que já sabe.'
  },
  {
    id: '2',
    title: 'O Grão de Mostarda',
    category: 'Potencial',
    tradition: 'Crescimento',
    content: 'As maiores mudanças começam com decisões minúsculas. Não subestime a força de um pequeno hábito consistente; ele constrói estruturas gigantescas com o tempo.'
  },
  {
    id: '3',
    title: 'A Joia no Manto',
    category: 'Valor Interno',
    tradition: 'Autoconhecimento',
    content: 'Às vezes passamos a vida buscando fora uma solução que já carregamos conosco. É como procurar uma chave que já está no seu bolso; você só precisa parar e sentir.'
  }
];

export const AUDIO_TRACKS = [
  { name: 'Ambiente Urbano Calmo', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Fluxo Constante', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
];

export const THEME_STYLES = {
  aurora: {
    bg: 'bg-[#fdfbf7]',
    card: 'bg-white',
    text: 'text-[#4a3f35]',
    accent: 'bg-[#d4b483]',
    border: 'border-[#e8e2d6]',
    sidebar: 'bg-[#f4f1ea]',
    hover: 'hover:bg-[#efece3]'
  },
  noite: {
    bg: 'bg-[#12141d]',
    card: 'bg-[#1e2230]',
    text: 'text-[#d1d5db]',
    accent: 'bg-[#6366f1]',
    border: 'border-[#2d3345]',
    sidebar: 'bg-[#0f111a]',
    hover: 'hover:bg-[#1c1f2e]'
  }
};
