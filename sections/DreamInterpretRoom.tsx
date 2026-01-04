import React from 'react';
import styles from './DreamInterpretRoom.module.css';

type Props = {
  output: string;
};

// ⚠️ Sala “perfeita”: use npm run lock para travar este arquivo + CSS.
export function DreamInterpretRoom({ output }: Props) {
  return (
    <div className={styles.room}>
      <h2 className={`font-cinzel ${styles.title}`}>SALA DE INTERPRETAÇÃO</h2>
      <div className={styles.textWrap}>
        <p className={`font-playfair ${styles.text}`}>
          {output || 'Relate seu sonho, Enoch está ouvindo.'}
        </p>
      </div>
    </div>
  );
}
