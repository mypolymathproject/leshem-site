import React from 'react';
import styles from './Passage.module.css';

export function Passage({ marker, hebrew, translation, children }) {
  return (
    <div className={styles.passage}>
      {hebrew && (
        <div className={styles.hebrew} dir="rtl">
          {hebrew}
        </div>
      )}
      {marker && (
        <div className={styles.marker}>{marker}</div>
      )}
      {translation && (
        <p className={styles.translation}>{translation}</p>
      )}
      {children && (
        <div className={styles.commentary}>{children}</div>
      )}
    </div>
  );
}
