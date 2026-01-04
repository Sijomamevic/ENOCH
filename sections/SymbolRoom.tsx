import React from 'react';
import styles from './SymbolRoom.module.css';

type Props = {
  output: string;
};

export function SymbolRoom({ output }: Props) {
  return (
    <div className={styles.room}>
      <div className={styles.panel}>
        <h2 className={`font-cinzel ${styles.title}`}>Exploração Consciente</h2>
        <p className={`font-playfair ${styles.subtitle}`}>
          Sophia interpreta símbolos com clareza e acolhimento.
        </p>

        <p className={`font-playfair ${styles.speech}`}>
          {output || 'Traga um símbolo — um objeto, uma forma, uma cor — e eu revelarei camadas de sentido.'}
        </p>

        <p className={styles.hint}>
          Dica: você pode escrever ou falar. Quando Sophia estiver falando, basta começar a falar para interromper.
        </p>
      </div>
    </div>
  );
}
