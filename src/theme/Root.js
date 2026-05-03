import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'leshem-compact';

function applyMode(compact) {
  document.documentElement.setAttribute('data-reading', compact ? 'compact' : 'normal');
}

export default function Root({ children }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) === 'true';
    setCompact(saved);
    applyMode(saved);
  }, []);

  function toggle() {
    const next = !compact;
    setCompact(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    applyMode(next);
  }

  return (
    <>
      {children}
      <button
        onClick={toggle}
        className="leshem-density-btn"
        title={compact ? 'Switch to spacious reading' : 'Switch to compact reading'}
        aria-label={compact ? 'Spacious mode' : 'Compact mode'}
      >
        {compact ? 'Spacious' : 'Compact'}
      </button>
    </>
  );
}
