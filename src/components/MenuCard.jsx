import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const SPICE_MAP = { mild: '🌶️', medium: '🌶️🌶️', hot: '🌶️🌶️🌶️' };

export default function MenuCard({ item }) {
  const { addItem, removeItem, getQuantity } = useCart();
  const { lang, t } = useLanguage();
  const qty = getQuantity(item._id);

  const displayName =
    lang !== 'en' && item.nameTranslations?.[lang]
      ? item.nameTranslations[lang]
      : item.name;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s',
        borderColor: qty > 0 ? 'var(--gold-border)' : undefined,
        transform: qty > 0 ? 'translateY(-2px)' : undefined,
      }}
    >
      {/* Qty indicator strip */}
      {qty > 0 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
        }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Veg dot */}
        <div className={`veg-dot ${item.isVeg ? 'veg' : 'nonveg'}`} style={{ marginTop: '3px', flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            fontFamily: lang !== 'en' ? `var(--font-body)` : undefined,
          }}>
            {displayName}
          </div>
          {item.description && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
              {item.description}
            </div>
          )}
        </div>

        <div style={{ fontSize: '22px', flexShrink: 0 }}>{item.emoji}</div>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span title={`Spice: ${item.spiceLevel}`} style={{ fontSize: '11px' }}>
          {SPICE_MAP[item.spiceLevel]}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          ⏱ {item.preparationTime} {t.mins}
        </span>
        <span style={{ fontSize: '11px', color: item.isVeg ? 'var(--veg)' : 'var(--nonveg)' }}>
          {item.isVeg ? t.veg : t.nonveg}
        </span>
      </div>

      {/* Price + Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', fontWeight: 700 }}>
          ₹{item.price}
        </span>

        {qty === 0 ? (
          <button
            className="btn btn-gold"
            style={{ padding: '8px 20px', fontSize: '13px' }}
            onClick={() => addItem(item)}
          >
            + {t.addToCart}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => removeItem(item._id)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold-border)',
                background: 'transparent', color: 'var(--gold)', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >−</button>
            <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', color: 'var(--gold)', fontSize: '16px' }}>
              {qty}
            </span>
            <button
              onClick={() => addItem(item)}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                border: 'none', color: '#0a0c14', fontSize: '18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
              }}
            >+</button>
          </div>
        )}
      </div>
    </div>
  );
}
