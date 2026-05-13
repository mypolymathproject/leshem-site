import React, { useCallback } from 'react';
import styles from './ProtectedImage.module.css';

export default function ProtectedImage({ src, alt }) {
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    alert('© All rights reserved.\n\nThis material is copyright protected and may not be reproduced, downloaded, or distributed without permission.');
  }, []);

  return (
    <div className={styles.wrapper}>
      <img
        src={src}
        alt={alt}
        className={styles.image}
        draggable={false}
      />
      <div className={styles.overlay} onContextMenu={handleContextMenu} />
      <div className={styles.copyright}>
        © All Rights Reserved — Leshem Shvo v'Achlama Translation
      </div>
    </div>
  );
}
