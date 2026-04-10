import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'kn', label: 'ಕ', full: 'ಕನ್ನಡ' },
  { code: 'ta', label: 'த', full: 'தமிழ்' },
  { code: 'te', label: 'తె', full: 'తెలుగు' },
];

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          title={l.full}
          style={{
            padding: compact ? '4px 10px' : '6px 14px',
            borderRadius: '50px',
            border: lang === l.code ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: lang === l.code ? 'var(--gold-dim)' : 'transparent',
            color: lang === l.code ? 'var(--gold)' : 'var(--text-secondary)',
            fontSize: compact ? '12px' : '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all var(--transition)',
            fontFamily: l.code === 'en' ? 'var(--font-body)' : 'inherit',
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
