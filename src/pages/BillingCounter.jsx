/**
 * BillingCounter — Cashier screen showing all active table orders
 * Route: /billing
 */
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { orderAPI } from '../utils/api';
import { COUNTER_COLORS, CATEGORY_ICONS } from '../utils/translations';
import socket from '../utils/socket';

function StatusDot({ status }) {
  const colors = { pending: 'var(--pending)', preparing: 'var(--preparing)', ready: 'var(--ready)', delivered: 'var(--delivered)', delayed: 'var(--delayed)' };
  return (
    <span style={{
      display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%',
      background: colors[status] || '#888', flexShrink: 0,
    }} />
  );
}

function QRModal({ orderId, amount, onClose }) {
  // Fake UPI QR — In production connect to a payment gateway
  const upiLink = `upi://pay?pa=grandspice@upi&pn=GrandSpice&am=${amount}&cu=INR&tn=Order${orderId}`;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,12,20,0.9)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div className="card card-gold fade-in" style={{ maxWidth: '360px', width: '100%', padding: '36px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '8px' }}>📱 QR Payment</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>Scan with any UPI app to pay</p>
        {/* QR placeholder box */}
        <div style={{ width: '200px', height: '200px', margin: '0 auto 20px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#333', padding: '12px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📲</div>
            <div style={{ wordBreak: 'break-all', fontSize: '11px' }}>{upiLink.slice(0, 60)}...</div>
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--gold)', fontWeight: 700, marginBottom: '20px' }}>₹{amount}</div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>UPI ID: grandspice@upi</p>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function TableBillCard({ order, onMarkPaid }) {
  const [payLoading, setPayLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const allStatuses = order.counterOrders.map(co => co.status);
  const allDone = allStatuses.every(s => s === 'delivered');

  const handlePay = async (method) => {
    setPayLoading(true);
    try {
      await orderAPI.confirmPayment(order.orderId, method);
      toast.success(`Payment confirmed — ${method.toUpperCase()}! 🎉`);
      onMarkPaid(order.orderId);
    } catch {
      toast.error('Payment failed. Try again.');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <>
      <div className="card" style={{ borderLeft: `4px solid ${allDone ? 'var(--ready)' : 'var(--pending)'}`, display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Table header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              background: 'var(--gold-dim)', border: '1px solid var(--gold-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: 'var(--gold)',
            }}>
              {order.tableNumber}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Table {order.tableNumber}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {order.orderId}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--gold)' }}>₹{order.grandTotal}</div>
            <div style={{ fontSize: '11px', color: allDone ? 'var(--ready)' : 'var(--pending)' }}>
              {allDone ? '✅ All delivered' : '⏳ In progress'}
            </div>
          </div>
        </div>

        {/* Counter status strips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {order.counterOrders.map((co) => (
            <div key={co.counter} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '50px', fontSize: '12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            }}>
              <StatusDot status={co.status} />
              <span style={{ color: 'var(--text-secondary)' }}>{CATEGORY_ICONS[co.counter]} {co.counter}</span>
            </div>
          ))}
        </div>

        {/* Item list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {order.counterOrders.flatMap(co => co.items).map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ color: 'var(--text-primary)' }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Subtotal</span><span>₹{order.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span>GST 5%</span><span>₹{order.tax}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--gold)', fontWeight: 700 }}>
            <span>Grand Total</span><span>₹{order.grandTotal}</span>
          </div>
        </div>

        {/* Payment buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn"
            disabled={payLoading}
            onClick={() => handlePay('cash')}
            style={{ flex: 1, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: 'var(--ready)', fontSize: '14px', padding: '12px' }}
          >
            💵 Cash
          </button>
          <button
            className="btn"
            disabled={payLoading}
            onClick={() => setShowQR(true)}
            style={{ flex: 1, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.35)', color: 'var(--preparing)', fontSize: '14px', padding: '12px' }}
          >
            📱 QR / UPI
          </button>
        </div>
      </div>
      {showQR && <QRModal orderId={order.orderId} amount={order.grandTotal} onClose={() => setShowQR(false)} onPay={() => { setShowQR(false); handlePay('qr'); }} />}
    </>
  );
}

export default function BillingCounter() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    orderAPI.getAll({ status: 'active' })
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    socket.emit('join-billing');

    const handleNewOrder = (order) => {
      setOrders((prev) => {
        if (prev.find(o => o.orderId === order.orderId)) return prev;
        return [order, ...prev];
      });
      toast(`New order — Table ${order.tableNumber}! 💰`, { icon: '💳' });
    };

    const handleStatusUpdate = ({ orderId, counter, status }) => {
      setOrders((prev) => prev.map(o => {
        if (o.orderId !== orderId) return o;
        return {
          ...o,
          counterOrders: o.counterOrders.map(co =>
            co.counter === counter
              ? { ...co, status, preparingStartedAt: status === 'preparing' ? new Date().toISOString() : co.preparingStartedAt }
              : co
          ),
        };
      }));
    };

    const handleCompleted = ({ orderId }) => {
      setOrders((prev) => prev.filter(o => o.orderId !== orderId));
    };

    socket.on('new-order-billing', handleNewOrder);
    socket.on('counter-status-updated', handleStatusUpdate);
    socket.on('order-completed', handleCompleted);
    return () => {
      socket.off('new-order-billing', handleNewOrder);
      socket.off('counter-status-updated', handleStatusUpdate);
      socket.off('order-completed', handleCompleted);
    };
  }, []);

  const handleMarkPaid = useCallback((orderId) => {
    setOrders((prev) => prev.filter(o => o.orderId !== orderId));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Header */}
      <header style={{
        padding: '20px 32px', background: 'var(--bg-secondary)',
        borderBottom: '3px solid var(--gold)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '36px' }}>💰</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--gold)' }}>
              Billing Counter
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Grand Spice — Cashier Dashboard</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--gold)', fontWeight: 700 }}>
              {orders.length}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ACTIVE TABLES</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', color: 'var(--ready)', fontWeight: 700 }}>
              ₹{totalRevenue.toFixed(0)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PENDING REVENUE</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </header>

      {/* Orders grid */}
      <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>💳</div>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '8px' }}>No active orders</h2>
            <p>New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid-2">
            {orders.map((order) => (
              <div key={order.orderId} className="fade-in">
                <TableBillCard order={order} onMarkPaid={handleMarkPaid} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
