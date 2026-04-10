import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';

import Home from './pages/Home';
import OrderPage from './pages/OrderPage';
import OrderStatus from './pages/OrderStatus';
import CounterDisplay from './pages/CounterDisplay';
import BillingCounter from './pages/BillingCounter';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#161b2e',
                color: '#F5EDD6',
                border: '1px solid rgba(212,175,55,0.3)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10B981', secondary: '#161b2e' } },
              error:   { iconTheme: { primary: '#EF4444', secondary: '#161b2e' } },
            }}
          />
          <Routes>
            <Route path="/"                        element={<Home />} />
            <Route path="/order/:tableId"          element={<OrderPage />} />
            <Route path="/status/:orderId"         element={<OrderStatus />} />
            <Route path="/counter/:counterName"    element={<CounterDisplay />} />
            <Route path="/billing"                 element={<BillingCounter />} />
            <Route path="/admin"                   element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </LanguageProvider>
  );
}
