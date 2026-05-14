import React, { useState, useEffect } from 'react';
import { useLocation } from '@docusaurus/router';

const STORAGE_KEY_COMPACT = 'leshem-compact';
const STORAGE_KEY_COPYRIGHT = 'leshem-copyright-ack';

function applyMode(compact) {
  document.documentElement.setAttribute('data-reading', compact ? 'compact' : 'normal');
}

function CopyrightModal({ onAccept }) {
  return (
    <div className="leshem-copyright-overlay">
      <div className="leshem-copyright-modal">
        <div className="leshem-copyright-seal">©</div>
        <h2 className="leshem-copyright-title">Copyright Notice</h2>
        <p className="leshem-copyright-body">
          The illustrations and charts in this section are original works protected by copyright.
          They may not be reproduced, downloaded, distributed, or used in any form without
          explicit written permission from the rights holder.
        </p>
        <p className="leshem-copyright-body">
          Unauthorized reproduction or distribution is a violation of copyright law.
        </p>
        <button className="leshem-copyright-btn" onClick={onAccept}>
          I Understand
        </button>
      </div>
    </div>
  );
}

export default function Root({ children }) {
  const [compact, setCompact] = useState(false);
  const [copyrightAcknowledged, setCopyrightAcknowledged] = useState(false);
  const location = useLocation();

  const isIllustrations = location.pathname.startsWith('/illustrations');

  useEffect(() => {
    const savedCompact = localStorage.getItem(STORAGE_KEY_COMPACT) === 'true';
    setCompact(savedCompact);
    applyMode(savedCompact);

    const ack = localStorage.getItem(STORAGE_KEY_COPYRIGHT) === 'true';
    setCopyrightAcknowledged(ack);
  }, []);

  function toggle() {
    const next = !compact;
    setCompact(next);
    localStorage.setItem(STORAGE_KEY_COMPACT, String(next));
    applyMode(next);
  }

  function handleAccept() {
    localStorage.setItem(STORAGE_KEY_COPYRIGHT, 'true');
    setCopyrightAcknowledged(true);
  }

  return (
    <>
      {children}
      {isIllustrations && !copyrightAcknowledged && (
        <CopyrightModal onAccept={handleAccept} />
      )}
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
