import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function HelpModal({ onClose }) {
  const { t } = useLanguage();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,12,20,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div
        className="card card-gold fade-in"
        style={{ maxWidth: '480px', width: '100%', padding: '32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
            ❓ {t.help}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
        </div>

        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {t.helpSteps.map((step, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text-primary)' }}>{step}</span>
            </li>
          ))}
        </ol>

        <div className="divider" />
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
          🔔 Need assistance? Press the <strong style={{ color: 'var(--gold)' }}>Call Waiter</strong> button anytime.
        </div>

        <button className="btn btn-gold" style={{ width: '100%', marginTop: '20px' }} onClick={onClose}>
          Got it!
        </button>
      </div>
    </div>
  );
}
