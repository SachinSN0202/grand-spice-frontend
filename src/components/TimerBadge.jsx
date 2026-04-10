/**
 * TimerBadge — Live countdown timer for counter status
 * Shows MM:SS countdown when status is "preparing"
 * Switches to DELAYED if timer runs out
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function TimerBadge({ status, preparingStartedAt, estimatedTime, large = false }) {
  const { t } = useLanguage();
  const [remaining, setRemaining] = useState(null);
  const [isDelayed, setIsDelayed] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (status !== 'preparing' || !preparingStartedAt || !estimatedTime) {
      setRemaining(null);
      return;
    }

    const calcRemaining = () => {
      const started = new Date(preparingStartedAt).getTime();
      const totalMs = estimatedTime * 60 * 1000;
      const elapsed = Date.now() - started;
      const rem = totalMs - elapsed;
      if (rem <= 0) {
        setIsDelayed(true);
        setRemaining(0);
        clearInterval(intervalRef.current);
      } else {
        setIsDelayed(false);
        setRemaining(Math.floor(rem / 1000));
      }
    };

    calcRemaining();
    intervalRef.current = setInterval(calcRemaining, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status, preparingStartedAt, estimatedTime]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const fs = large ? { fontSize: '15px', padding: '8px 16px' } : {};

  if (status === 'pending') {
    return (
      <span className="badge badge-pending" style={fs}>
        🕐 {t.waitingToStart}
      </span>
    );
  }

  if (status === 'preparing') {
    if (isDelayed) {
      return (
        <span className="badge badge-delayed" style={{ ...fs, animation: 'pulse 2s infinite' }}>
          ⚠️ {t.delayed}
        </span>
      );
    }
    return (
      <span className="badge badge-preparing" style={fs}>
        🔵 {t.preparing} — {remaining !== null ? `${formatTime(remaining)} ${t.remaining}` : '...'}
      </span>
    );
  }

  if (status === 'ready') {
    return (
      <span className="badge badge-ready" style={fs}>
        🟢 {t.ready} — {t.readyForPickup}
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span className="badge badge-delivered" style={fs}>
        ✅ {t.delivered}
      </span>
    );
  }

  if (status === 'delayed') {
    return (
      <span className="badge badge-delayed" style={{ ...fs, animation: 'pulse 2s infinite' }}>
        ⚠️ {t.delayed}
      </span>
    );
  }

  return null;
}
