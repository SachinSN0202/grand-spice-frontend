/**
 * AdminDashboard — Manager overview: all orders + waiter calls
 * Route: /admin
 */
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { orderAPI, waiterAPI } from '../utils/api';
import { CATEGORY_ICONS, COUNTER_COLORS } from '../utils/translations';
import socket from '../utils/socket';

const REASON_LABELS = {
  waiter: '🙋 Needs Waiter',
  help: '❓ Needs Help',
  bill: '💳 Needs Bill',
  issue: '⚠️ Has Issue',
};

function WaiterCallCard({ call, onAcknowledge }) {
  const elapsed = Math.floor((Date.now() - new Date(call.createdAt).getTime()) / 60000);
  return (
    <div className="card" style={{
      borderLeft: `4px solid ${call.status === 'acknowledged' ? 'var(--ready)' : 'var(--delayed)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
      animation: call.status === 'pending' ? 'pulse 2s infinite' : 'none',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--gold)' }}>
            Table {call.tableNumber}
          </span>
          <span style={{ fontSize: '13px', color: call.status === 'pending' ? 'var(--delayed)' : 'var(--ready)' }}>
            {call.status === 'pending' ? '🔴 PENDING' : '🟢 Acknowledged'}
          </span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {REASON_LABELS[call.reason] || call.reason}
        </div>
        {call.message && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>"{call.message}"</div>}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{elapsed} min ago</div>
      </div>
      {call.status === 'pending' && (
        <button
          className="btn btn-gold"
          style={{ fontSize: '13px', padding: '10px 18px', whiteSpace: 'nowrap' }}
          onClick={() => onAcknowledge(call._id)}
        >
          ✓ Acknowledge
        </button>
      )}
    </div>
  );
}

function OrderSummaryRow({ order }) {
  const allDone = order.counterOrders.every(co => co.status === 'delivered');
  return (
    <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
        background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--gold)',
      }}>
        {order.tableNumber}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Table {order.tableNumber}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{order.orderId}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {order.counterOrders.map(co => {
            const colors = { pending: 'var(--pending)', preparing: 'var(--preparing)', ready: 'var(--ready)', delivered: 'var(--delivered)', delayed: 'var(--delayed)' };
            return (
              <span key={co.counter} style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '50px',
                background: `${colors[co.status]}22`, color: colors[co.status],
                border: `1px solid ${colors[co.status]}44`,
              }}>
                {CATEGORY_ICONS[co.counter]} {co.counter}: {co.status}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--gold)', fontWeight: 700 }}>₹{order.grandTotal}</div>
        <div style={{ fontSize: '11px', color: allDone ? 'var(--ready)' : 'var(--text-muted)' }}>
          {allDone ? '✅ All delivered' : '⏳ In progress'}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [orders, setOrders]       = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('orders'); // orders | waiter | tables
  const [time, setTime]           = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Initial fetch
  useEffect(() => {
    Promise.all([
      orderAPI.getAll({ status: 'active' }),
      waiterAPI.getAll(),
    ])
      .then(([ordRes, callRes]) => {
        setOrders(ordRes.data || []);
        setWaiterCalls(callRes.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  // Socket
  useEffect(() => {
    socket.emit('join-admin');

    socket.on('new-order-admin', (order) => {
      setOrders(prev => [order, ...prev.filter(o => o.orderId !== order.orderId)]);
      toast(`New order — Table ${order.tableNumber}`, { icon: '📋' });
    });

    socket.on('counter-status-updated', ({ orderId, counter, status }) => {
      setOrders(prev => prev.map(o => {
        if (o.orderId !== orderId) return o;
        return {
          ...o,
          counterOrders: o.counterOrders.map(co =>
            co.counter === counter ? { ...co, status } : co
          ),
        };
      }));
    });

    socket.on('order-completed', ({ orderId }) => {
      setOrders(prev => prev.filter(o => o.orderId !== orderId));
    });

    socket.on('waiter-called', (call) => {
      setWaiterCalls(prev => [call, ...prev]);
      toast(`🔔 Table ${call.tableNumber} needs waiter!`, { duration: 6000 });
    });

    return () => {
      socket.off('new-order-admin');
      socket.off('counter-status-updated');
      socket.off('order-completed');
      socket.off('waiter-called');
    };
  }, []);

  const acknowledgeWaiter = async (id) => {
    try {
      await waiterAPI.updateStatus(id, 'acknowledged');
      setWaiterCalls(prev => prev.map(c => c._id === id ? { ...c, status: 'acknowledged' } : c));
      toast.success('Waiter call acknowledged');
    } catch {
      toast.error('Failed to acknowledge');
    }
  };

  const pendingCalls = waiterCalls.filter(c => c.status === 'pending').length;

  const TAB_STYLE = (active) => ({
    padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
    background: active ? 'var(--gold-dim)' : 'transparent',
    color: active ? 'var(--gold)' : 'var(--text-secondary)',
    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        padding: '18px 28px', background: 'var(--bg-secondary)',
        borderBottom: '3px solid var(--gold)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '32px' }}>👨‍💼</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>Admin Dashboard</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Grand Spice — Manager View</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {[
            { label: 'ACTIVE ORDERS', val: orders.length, color: 'var(--gold)' },
            { label: 'WAITER CALLS', val: pendingCalls, color: pendingCalls > 0 ? 'var(--delayed)' : 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <button style={TAB_STYLE(tab === 'orders')} onClick={() => setTab('orders')}>
          📋 Active Orders ({orders.length})
        </button>
        <button style={TAB_STYLE(tab === 'waiter')} onClick={() => setTab('waiter')}>
          🔔 Waiter Calls {pendingCalls > 0 && <span style={{ marginLeft: '6px', background: 'var(--delayed)', color: '#fff', borderRadius: '50px', padding: '1px 7px', fontSize: '11px' }}>{pendingCalls}</span>}
        </button>
        <button style={TAB_STYLE(tab === 'counters')} onClick={() => setTab('counters')}>
          🍳 Counter Links
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner" /></div>
        ) : (
          <>
            {/* Orders Tab */}
            {tab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                    <p>No active orders right now</p>
                  </div>
                ) : (
                  orders.map(o => <OrderSummaryRow key={o.orderId} order={o} />)
                )}
              </div>
            )}

            {/* Waiter Calls Tab */}
            {tab === 'waiter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {waiterCalls.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔔</div>
                    <p>No waiter calls</p>
                  </div>
                ) : (
                  waiterCalls.map(c => <WaiterCallCard key={c._id} call={c} onAcknowledge={acknowledgeWaiter} />)
                )}
              </div>
            )}

            {/* Counter Links Tab */}
            {tab === 'counters' && (
              <div className="grid-2">
                {['South Indian', 'North Indian', 'Chinese', 'Chats', 'Juice', 'Tea'].map(counter => (
                  <a
                    key={counter}
                    href={`/counter/${encodeURIComponent(counter)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="card" style={{ borderLeft: `4px solid ${COUNTER_COLORS[counter]}`, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div style={{ fontSize: '36px', marginBottom: '8px' }}>{CATEGORY_ICONS[counter]}</div>
                      <div style={{ fontWeight: 700, fontSize: '16px', color: COUNTER_COLORS[counter], marginBottom: '4px' }}>{counter} Counter</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Click to open TV display →</div>
                    </div>
                  </a>
                ))}
                <a href="/billing" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ borderLeft: '4px solid var(--gold)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>💰</div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--gold)', marginBottom: '4px' }}>Billing Counter</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Open cashier screen →</div>
                  </div>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
