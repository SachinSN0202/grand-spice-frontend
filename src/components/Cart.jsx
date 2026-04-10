import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function Cart({ onPlaceOrder, loading, tableId }) {
  const { items, note, setNote, addItem, removeItem, subtotal, tax, grandTotal, totalItems, clearCart } = useCart();
  const { t } = useLanguage();

  if (totalItems === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
        <p>{t.emptyCart}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
        {items.map((item) => (
          <div key={item.menuItemId} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '20px' }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ₹{item.price} × {item.quantity} = <span style={{ color: 'var(--gold)' }}>₹{item.price * item.quantity}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => removeItem(item.menuItemId)} style={qtyBtnStyle('outline')}>−</button>
              <span style={{ fontWeight: 700, color: 'var(--gold)', minWidth: '18px', textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => addItem({ _id: item.menuItemId, ...item })} style={qtyBtnStyle('filled')}>+</button>
            </div>
          </div>
        ))}

        <textarea
          className="input"
          rows={3}
          placeholder={t.specialInstructions}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ marginTop: '16px', resize: 'none', fontSize: '13px' }}
        />
      </div>

      {/* Bill summary */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{t.subtotal}</span><span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{t.gst}</span><span>₹{tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)', fontWeight: 700 }}>
          <span>{t.grandTotal}</span><span>₹{grandTotal.toFixed(2)}</span>
        </div>
        <button
          className="btn btn-gold"
          style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          onClick={onPlaceOrder}
          disabled={loading}
        >
          {loading ? '⏳ Placing Order...' : `🍽️ ${t.placeOrder}`}
        </button>
      </div>
    </div>
  );
}

const qtyBtnStyle = (type) => ({
  width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  ...(type === 'filled'
    ? { background: 'linear-gradient(135deg,var(--gold),var(--gold-light))', border: 'none', color: '#0a0c14', fontWeight: 700 }
    : { background: 'transparent', border: '1px solid var(--gold-border)', color: 'var(--gold)' }),
});
