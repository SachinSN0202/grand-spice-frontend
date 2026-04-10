/**
 * Home Page — Grand Spice luxury landing page
 * Table selector + language picker
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { tableAPI } from '../utils/api';

const CATEGORY_ICONS = [
  { emoji: '🍛', label: 'South Indian' },
  { emoji: '🫓', label: 'North Indian' },
  { emoji: '🥡', label: 'Chinese' },
  { emoji: '🌮', label: 'Chats' },
  { emoji: '🧃', label: 'Juices' },
  { emoji: '☕', label: 'Tea & Coffee' },
];

export default function Home() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState('');
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);

  useEffect(() => {
    tableAPI.getAll()
      .then((res) => setTables(res.data || []))
      .catch(() => {
        // Fallback: generate 15 tables client-side
        setTables(Array.from({ length: 15 }, (_, i) => ({
          tableId: `TABLE-${String(i + 1).padStart(3, '0')}`,
          tableNumber: i + 1,
          status: 'available',
        })));
      })
      .finally(() => setLoadingTables(false));
  }, []);

  const handleGo = () => {
    if (!selectedTable) return;
    navigate(`/order/${selectedTable}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>

      {/* Background decorative circles */}
      <div style={{
        position: 'fixed', width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
        top: '-200px', right: '-200px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)',
        bottom: '-100px', left: '-100px', pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <header style={{
        padding: '20px 32px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,12,20,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🍽️</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)', fontWeight: 700 }}>
            Grand Spice
          </span>
        </div>
        <LanguageSwitcher />
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Hero */}
        <div className="fade-in" style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{ fontSize: '72px', marginBottom: '20px', lineHeight: 1 }}>🍽️</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
            marginBottom: '16px', lineHeight: 1.15,
          }}>
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Grand Spice
            </span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 8px' }}>
            {t.tagline}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Smart table ordering — no waiting, just great food
          </p>
        </div>

        {/* Category pills */}
        <div className="fade-in fade-in-delay-1" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '60px' }}>
          {CATEGORY_ICONS.map((c) => (
            <div key={c.label} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '50px',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              fontSize: '14px', color: 'var(--text-secondary)',
            }}>
              <span style={{ fontSize: '20px' }}>{c.emoji}</span>
              {c.label}
            </div>
          ))}
        </div>

        {/* Table selector card */}
        <div className="card card-gold fade-in fade-in-delay-2 glow" style={{ maxWidth: '540px', margin: '0 auto', padding: '40px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', marginBottom: '8px', color: 'var(--gold)' }}>
            {t.selectTable}
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '28px' }}>
            Select your table number to begin ordering
          </p>

          {/* Table grid */}
          {loadingTables ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '28px',
            }}>
              {tables.map((table) => {
                const selected = selectedTable === table.tableId;
                const occupied = table.status === 'occupied';
                return (
                  <button
                    key={table.tableId}
                    onClick={() => !occupied && setSelectedTable(table.tableId)}
                    title={`Table ${table.tableNumber} — ${table.status}`}
                    style={{
                      padding: '12px 6px', borderRadius: '10px', cursor: occupied ? 'not-allowed' : 'pointer',
                      border: selected ? '2px solid var(--gold)' : '1px solid var(--border)',
                      background: selected ? 'var(--gold-dim)' : occupied ? 'rgba(239,68,68,0.08)' : 'var(--bg-secondary)',
                      color: selected ? 'var(--gold)' : occupied ? 'var(--nonveg)' : 'var(--text-secondary)',
                      fontWeight: selected ? 700 : 500, fontSize: '13px',
                      transition: 'all 0.2s', opacity: occupied ? 0.6 : 1,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{occupied ? '🔴' : selected ? '🟡' : '🟢'}</span>
                    <span>{table.tableNumber}</span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTable && (
            <div style={{
              padding: '12px', borderRadius: '8px', background: 'var(--gold-dim)',
              border: '1px solid var(--gold-border)', textAlign: 'center',
              fontSize: '14px', color: 'var(--gold)', marginBottom: '20px', fontWeight: 600,
            }}>
              🪑 Selected: {selectedTable.replace('TABLE-', 'Table ')}
            </div>
          )}

          <button
            className="btn btn-gold"
            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
            onClick={handleGo}
            disabled={!selectedTable}
          >
            🍽️ {t.viewMenu}
          </button>

          {/* Staff links */}
          <div className="divider" style={{ margin: '24px 0 16px' }} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '🍳 South Indian Counter', path: '/counter/South Indian' },
              { label: '💰 Billing', path: '/billing' },
              { label: '👨‍💼 Admin', path: '/admin' },
            ].map((link) => (
              <a key={link.path} href={link.path} style={{
                fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none',
                padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)',
                transition: 'all 0.2s',
              }}
                onMouseEnter={(e) => e.target.style.color = 'var(--gold)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
