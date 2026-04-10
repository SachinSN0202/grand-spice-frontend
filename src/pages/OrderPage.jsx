/**
 * OrderPage — Customer menu browsing & ordering screen
 * Route: /order/:tableId
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MenuCard from '../components/MenuCard';
import Cart from '../components/Cart';
import WaiterCallButton from '../components/WaiterCallButton';
import HelpModal from '../components/HelpModal';
import { menuAPI, orderAPI } from '../utils/api';
import { CATEGORY_ICONS } from '../utils/translations';

const CATEGORIES = ['South Indian', 'North Indian', 'Chinese', 'Chats', 'Juice', 'Tea'];

export default function OrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { items: cartItems, note, totalItems, clearCart } = useCart();

  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setActiveCategory] = useState('South Indian');
  const [search, setSearch]         = useState('');
  const [cartOpen, setCartOpen]     = useState(false);
  const [helpOpen, setHelpOpen]     = useState(false);
  const [placing, setPlacing]       = useState(false);

  const tableNumber = parseInt(tableId.replace('TABLE-', ''));

  // Fetch menu
  useEffect(() => {
    menuAPI.getAll()
      .then((res) => setMenuItems(res.data || []))
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
  }, []);

  // Filtered items
  const filtered = useMemo(() => {
    return menuItems
      .filter((item) => item.category === activeCategory)
      .filter((item) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
      });
  }, [menuItems, activeCategory, search]);

  // Place order
  const placeOrder = async () => {
    if (!cartItems.length) return toast.error('Your cart is empty!');
    setPlacing(true);
    try {
      const payload = {
        tableId,
        items: cartItems.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        customerNote: note,
        language: 'en',
      };
      const res = await orderAPI.create(payload);
      const orderId = res.data.orderId;
      clearCart();
      toast.success('Order placed! 🎉');
      navigate(`/status/${encodeURIComponent(orderId)}`);
    } catch (err) {
      toast.error(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '12px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontWeight: 700, fontSize: '18px' }}>
            🍽️ Grand Spice
          </span>
          <div style={{
            padding: '4px 12px', borderRadius: '50px',
            background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
            fontSize: '12px', color: 'var(--gold)', fontWeight: 600,
          }}>
            {t.table} {tableNumber}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <LanguageSwitcher compact />
          <WaiterCallButton tableId={tableId} tableNumber={tableNumber} />
          <button className="btn btn-ghost" style={{ fontSize: '13px' }} onClick={() => setHelpOpen(true)}>
            ❓ {t.help}
          </button>
        </div>
      </header>

      {/* Search bar */}
      <div style={{ padding: '14px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
        <input
          className="input"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '480px' }}
        />
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: '6px', padding: '12px 20px', overflowX: 'auto',
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
      }}>
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 18px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                background: active ? 'linear-gradient(135deg,var(--gold),var(--gold-light))' : 'var(--bg-card)',
                color: active ? '#0a0c14' : 'var(--text-secondary)',
                fontWeight: active ? 700 : 500, fontSize: '13px', whiteSpace: 'nowrap',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: active ? '0 4px 12px rgba(212,175,55,0.3)' : 'none',
              }}
            >
              {CATEGORY_ICONS[cat]} {t.categories[cat] || cat}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Menu grid */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
              <div className="spinner" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <p>No items found</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>{CATEGORY_ICONS[activeCategory]}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--text-primary)' }}>
                  {t.categories[activeCategory] || activeCategory}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({filtered.length} items)</span>
              </div>
              <div className="grid-2">
                {filtered.map((item, i) => (
                  <div key={item._id} className="fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
                    <MenuCard item={item} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop Cart sidebar */}
        <div style={{
          width: '340px', borderLeft: '1px solid var(--border)',
          background: 'var(--bg-secondary)', padding: '20px',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          '@media(maxWidth:768px)': { display: 'none' },
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '16px' }}>
            🛒 {t.cart}
          </h3>
          <Cart onPlaceOrder={placeOrder} loading={placing} tableId={tableId} />
        </div>
      </div>

      {/* Mobile FAB cart button */}
      <button
        className="fab"
        onClick={() => setCartOpen(true)}
        style={{
          background: 'linear-gradient(135deg,var(--gold),var(--gold-light))',
          color: '#0a0c14', boxShadow: '0 8px 24px rgba(212,175,55,0.4)',
        }}
      >
        🛒
        {totalItems > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#EF4444', color: '#fff', borderRadius: '50%',
            width: '22px', height: '22px', fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {totalItems}
          </span>
        )}
      </button>

      {/* Mobile Cart drawer */}
      {cartOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,12,20,0.85)', backdropFilter: 'blur(8px)',
        }} onClick={() => setCartOpen(false)}>
          <div
            className="fade-in"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 'min(100vw, 380px)',
              background: 'var(--bg-secondary)', padding: '24px',
              borderLeft: '1px solid var(--gold-border)', display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>🛒 {t.cart}</h3>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '22px', cursor: 'pointer' }}>✕</button>
            </div>
            <Cart onPlaceOrder={() => { setCartOpen(false); placeOrder(); }} loading={placing} tableId={tableId} />
          </div>
        </div>
      )}

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}
