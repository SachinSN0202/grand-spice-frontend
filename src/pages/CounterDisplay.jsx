/**
 * CounterDisplay — Kitchen counter TV screen
 * Route: /counter/:counterName
 * Designed for 24/7 kiosk/TV display
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { orderAPI } from '../utils/api';
import { COUNTER_COLORS, CATEGORY_ICONS } from '../utils/translations';
import socket from '../utils/socket';

// Live countdown timer hook
function useCountdown(preparingStartedAt, estimatedTime, status) {
  const [secs, setSecs] = useState(null);
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    if (status !== 'preparing' || !preparingStartedAt || !estimatedTime) {
      setSecs(null); setDelayed(false); return;
    }
    const tick = () => {
      const elapsed = (Date.now() - new Date(preparingStartedAt).getTime()) / 1000;
      const rem = estimatedTime * 60 - elapsed;
      if (rem <= 0) { setDelayed(true); setSecs(0); }
      else { setDelayed(false); setSecs(Math.floor(rem)); }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [preparingStartedAt, estimatedTime, status]);

  return { secs, delayed };
}

function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function CounterOrderCard({ co, orderId, tableNumber, createdAt, onStatusChange }) {
  const { secs, delayed } = useCountdown(co.preparingStartedAt, co.estimatedTime, co.status);
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);

  const statusColor = {
    pending: 'var(--pending)', preparing: 'var(--preparing)',
    ready: 'var(--ready)', delivered: 'var(--delivered)', delayed: 'var(--delayed)',
  }[co.status] || 'var(--text-muted)';

  const isDelayed = delayed || co.status === 'delayed';

  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: '16px',
      border: `2px solid ${isDelayed ? 'var(--delayed)' : statusColor}`,
      padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
      animation: isDelayed ? 'pulse 2s infinite' : 'none',
      boxShadow: `0 0 20px ${isDelayed ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.3)'}`,
    }}>

      {/* Table number — big */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Table</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '52px', fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>
            {tableNumber}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{elapsed} min ago</div>
          <div style={{
            marginTop: '6px', padding: '6px 14px', borderRadius: '50px', fontSize: '12px', fontWeight: 700,
            background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}55`,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {isDelayed ? '⚠️ DELAYED' : co.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {co.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</span>
            <span style={{
              background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
              color: 'var(--gold)', borderRadius: '50px', padding: '2px 12px', fontSize: '14px', fontWeight: 700,
            }}>×{item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Timer */}
      {co.status === 'preparing' && (
        <div style={{ textAlign: 'center', padding: '12px', borderRadius: '10px', background: isDelayed ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)' }}>
          {isDelayed ? (
            <div style={{ color: 'var(--delayed)', fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700 }}>
              ⚠️ TIME EXCEEDED
            </div>
          ) : secs !== null ? (
            <>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>TIME REMAINING</div>
              <div style={{ fontFamily: 'monospace', fontSize: '42px', fontWeight: 700, color: 'var(--preparing)', letterSpacing: '0.05em' }}>
                {fmt(secs)}
              </div>
            </>
          ) : null}
        </div>
      )}

      {co.status === 'ready' && (
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px' }}>
          <div style={{ fontSize: '28px', marginBottom: '4px' }}>✅</div>
          <div style={{ color: 'var(--ready)', fontWeight: 700, fontSize: '16px' }}>READY — Waiter collecting</div>
        </div>
      )}

      {co.status === 'delivered' && (
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(110,231,183,0.1)', borderRadius: '10px' }}>
          <div style={{ color: 'var(--delivered)', fontWeight: 700, fontSize: '16px' }}>✓ DELIVERED TO TABLE {tableNumber}</div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {co.status === 'pending' && (
          <button
            className="btn"
            style={{ flex: 1, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: 'var(--preparing)', fontSize: '14px', padding: '12px' }}
            onClick={() => onStatusChange(orderId, co.counter, 'preparing')}
          >
            🔵 Start Preparing
          </button>
        )}
        {co.status === 'preparing' && (
          <button
            className="btn"
            style={{ flex: 1, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: 'var(--ready)', fontSize: '14px', padding: '12px' }}
            onClick={() => onStatusChange(orderId, co.counter, 'ready')}
          >
            🟢 Mark Ready
          </button>
        )}
        {co.status === 'ready' && (
          <button
            className="btn"
            style={{ flex: 1, background: 'rgba(110,231,183,0.15)', border: '1px solid rgba(110,231,183,0.4)', color: 'var(--delivered)', fontSize: '14px', padding: '12px' }}
            onClick={() => onStatusChange(orderId, co.counter, 'delivered')}
          >
            ✅ Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

export default function CounterDisplay() {
  const { counterName } = useParams();
  const counter = decodeURIComponent(counterName);
  const color = COUNTER_COLORS[counter] || 'var(--gold)';
  const icon = CATEGORY_ICONS[counter] || '🍽️';

  const [orders, setOrders] = useState([]); // [{orderId, tableNumber, counterOrder, createdAt}]
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch active orders for this counter
  useEffect(() => {
    orderAPI.getAll({ status: 'active' })
      .then((res) => {
        const allOrders = res.data || [];
        const filtered = [];
        allOrders.forEach((order) => {
          const co = order.counterOrders.find((c) => c.counter === counter && c.status !== 'delivered');
          if (co) filtered.push({ orderId: order.orderId, tableNumber: order.tableNumber, tableId: order.tableId, counterOrder: co, createdAt: order.createdAt });
        });
        setOrders(filtered);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [counter]);

  // Socket: join counter room
  useEffect(() => {
    socket.emit('join-counter', counter);

    const handleNewOrder = (data) => {
      if (data.counterOrder?.counter !== counter) return;
      setOrders((prev) => {
        const exists = prev.find((o) => o.orderId === data.orderId);
        if (exists) return prev;
        return [{ orderId: data.orderId, tableNumber: data.tableNumber, tableId: data.tableId, counterOrder: data.counterOrder, createdAt: data.createdAt }, ...prev];
      });
      toast(`New order — Table ${data.tableNumber}! 🔔`, { icon: '🍳' });
    };

    const handleStatusUpdate = ({ orderId, counter: updCounter, status }) => {
      if (updCounter !== counter) return;
      setOrders((prev) => prev.map((o) => {
        if (o.orderId !== orderId) return o;
        if (status === 'delivered') return null; // remove delivered
        return {
          ...o,
          counterOrder: {
            ...o.counterOrder,
            status,
            statusUpdatedAt: new Date().toISOString(),
            preparingStartedAt: status === 'preparing' ? new Date().toISOString() : o.counterOrder.preparingStartedAt,
          },
        };
      }).filter(Boolean));
    };

    socket.on('new-order', handleNewOrder);
    socket.on('counter-status-updated', handleStatusUpdate);
    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('counter-status-updated', handleStatusUpdate);
    };
  }, [counter]);

  const handleStatusChange = useCallback(async (orderId, counterName, newStatus) => {
    try {
      await orderAPI.updateCounterStatus(orderId, counterName, newStatus);
      if (newStatus === 'delivered') {
        setOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => {
          if (o.orderId !== orderId) return o;
          return {
            ...o,
            counterOrder: {
              ...o.counterOrder,
              status: newStatus,
              preparingStartedAt: newStatus === 'preparing' ? new Date().toISOString() : o.counterOrder.preparingStartedAt,
            },
          };
        }));
      }
      toast.success(`Status updated: ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  }, []);

  const pendingCount = orders.filter(o => o.counterOrder.status === 'pending').length;
  const preparingCount = orders.filter(o => o.counterOrder.status === 'preparing').length;
  const readyCount = orders.filter(o => o.counterOrder.status === 'ready').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* Counter header */}
      <header style={{
        padding: '20px 32px', background: 'var(--bg-secondary)',
        borderBottom: `3px solid ${color}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '48px' }}>{icon}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color }}>
              {counter} Counter
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Kitchen Display System</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Stats */}
          {[
            { label: 'PENDING', count: pendingCount, color: 'var(--pending)' },
            { label: 'PREPARING', count: preparingCount, color: 'var(--preparing)' },
            { label: 'READY', count: readyCount, color: 'var(--ready)' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '8px 20px', borderRadius: '10px', background: 'var(--bg-card)', border: `1px solid ${s.color}44` }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.count}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}

          {/* Clock */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>
      </header>

      {/* Orders grid */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '16px' }}>
            <div style={{ fontSize: '80px' }}>{icon}</div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: '24px' }}>
              No active orders
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>New orders will appear here automatically</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {orders.map((o) => (
              <CounterOrderCard
                key={`${o.orderId}-${o.counterOrder.counter}`}
                co={o.counterOrder}
                orderId={o.orderId}
                tableNumber={o.tableNumber}
                createdAt={o.createdAt}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* All counters nav */}
      <div style={{ padding: '12px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Counters:</span>
        {['South Indian', 'North Indian', 'Chinese', 'Chats', 'Juice', 'Tea'].map((c) => (
          <a key={c} href={`/counter/${encodeURIComponent(c)}`} style={{
            padding: '5px 14px', borderRadius: '50px', fontSize: '12px', textDecoration: 'none',
            background: c === counter ? `${COUNTER_COLORS[c]}22` : 'var(--bg-card)',
            border: `1px solid ${c === counter ? COUNTER_COLORS[c] : 'var(--border)'}`,
            color: c === counter ? COUNTER_COLORS[c] : 'var(--text-muted)',
          }}>
            {CATEGORY_ICONS[c]} {c}
          </a>
        ))}
      </div>
    </div>
  );
}
