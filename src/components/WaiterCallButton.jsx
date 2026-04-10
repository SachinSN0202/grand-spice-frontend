import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { waiterAPI } from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

export default function WaiterCallButton({ tableId, tableNumber }) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const call = async () => {
    setLoading(true);
    try {
      await waiterAPI.call({ tableId, tableNumber: parseInt(tableNumber), reason: 'waiter', message: '' });
      toast.success(t.waiterCalled);
    } catch {
      toast.error('Could not call waiter. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-outline"
      onClick={call}
      disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      {loading ? '⏳' : '🔔'} {t.callWaiter}
    </button>
  );
}
