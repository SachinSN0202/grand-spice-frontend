/**
 * OrderStatus — Real-time order tracking page
 * Route: /status/:orderId
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import TimerBadge from '../components/TimerBadge';
import { COUNTER_COLORS, CATEGORY_ICONS } from '../utils/translations';
import socket from '../utils/socket';

export default function OrderStatus() {
  const { orderId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);

  const decodedOrderId = decodeURIComponent(orderId);

  // Fetch initial order
  useEffect(() => {
    orderAPI.getById(decodedOrderId)
      .then((res) => setOrder(res.data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [decodedOrderId]);

  // Socket: join table room & listen for updates
  useEffect(() => {
    if (!order) return;

    socket.emit('join-table', order.tableId);

    const handleStatusUpdate = ({ orderId: oid, counter, status }) => {
      if (oid !== decodedOrderId) return;
      setOrder((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counterOrders: prev.counterOrders.map((co) =>
            co.counter === counter
              ? { ...co, status, statusUpdatedAt: new Date().toISOString(), preparingStartedAt: status === 'preparing' ? new Date().toISOString() : co.preparingStartedAt }
              : co
          ),
        };
      });
      toast(`${counter}: ${status.toUpperCase()} 🔔`, { icon: '🍳' });
    };

    const handlePayment = () => {
      setPaid(true);
      toast.success(t.paymentSuccess);
    };

    socket.on('counter-status-updated', handleStatusUpdate);
    socket.on('payment-confirmed', handlePayment);

    return () => {
      socket.off('counter-status-updated', handleStatusUpdate);
      socket.off('payment-confirmed', handlePayment);
    };
  }, [order, decodedOrderId, t]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!order) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <p style={{ color: 'var(--text-muted)' }}>Order not found</p>
      <button className="btn btn-gold" onClick={() => navigate('/')}>Go Home</button>
    </div>
  );

  const allDelivered = order.counterOrders.every((co) => co.status === 'delivered');

  return (
    <div style={{ minHeight: '100vh', padding: '0 0 80px' }}>

      {/* Header */}
      <header style={{
        padding: '20px 24px', background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', fontWeight: 700 }}>
            🍽️ Grand Spice
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {t.orderStatus}
          </div>
        </div>
        <div style={{
          padding: '8px 16px', borderRadius: '8px',
          background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.table}</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
            {order.tableNumber}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}>

        {/* Order ID + payment success */}
        {paid ? (
          <div className="card card-gold fade-in" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '8px' }}>
              {t.paymentSuccess}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>{t.thankYou}</p>
            <button className="btn btn-gold" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        ) : (
          <div className="card fade-in" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Order ID</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: 'var(--gold)', marginTop: '4px' }}>
                {order.orderId}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grand Total</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)', fontWeight: 700 }}>
                ₹{order.grandTotal}
              </div>
            </div>
          </div>
        )}

        {/* Counter order cards */}
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '16px' }}>
          🔴 Live Kitchen Status
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {order.counterOrders.map((co) => {
            const color = COUNTER_COLORS[co.counter] || 'var(--gold)';
            return (
              <div key={co.counter} className="card fade-in" style={{ borderLeft: `4px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{CATEGORY_ICONS[co.counter]}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>{co.counter} Counter</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {co.items.length} item{co.items.length !== 1 ? 's' : ''} · Est. {co.estimatedTime} {t.mins}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {co.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span style={{ color: 'var(--gold)' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Timer badge */}
                <TimerBadge
                  status={co.status}
                  preparingStartedAt={co.preparingStartedAt}
                  estimatedTime={co.estimatedTime}
                />
              </div>
            );
          })}
        </div>

        {/* All delivered → show view bill */}
        {allDelivered && !paid && (
          <div className="card card-gold fade-in" style={{ marginTop: '24px', textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎊</div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '8px' }}>
              All food delivered!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Please proceed to the billing counter to pay.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span>{t.subtotal}</span><span>₹{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              <span>{t.gst}</span><span>₹{order.tax}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--gold)', fontWeight: 700, marginBottom: '20px' }}>
              <span>{t.grandTotal}</span><span>₹{order.grandTotal}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              💡 Show this screen or your table number at the billing counter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
