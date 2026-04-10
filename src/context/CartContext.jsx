/**
 * CartContext — Manages the shopping cart state
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);   // { menuItemId, name, price, quantity, isVeg, preparationTime, counter }
  const [note, setNote] = useState('');

  const addItem = useCallback((menuItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.menuItemId === menuItem._id);
      if (exists) {
        return prev.map((i) =>
          i.menuItemId === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          isVeg: menuItem.isVeg,
          preparationTime: menuItem.preparationTime,
          counter: menuItem.counter,
          emoji: menuItem.emoji,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.menuItemId === menuItemId);
      if (!exists) return prev;
      if (exists.quantity === 1) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setNote('');
  }, []);

  const getQuantity = useCallback(
    (menuItemId) => items.find((i) => i.menuItemId === menuItemId)?.quantity || 0,
    [items]
  );

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const grandTotal = parseFloat((subtotal + tax).toFixed(2));
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, note, setNote, addItem, removeItem, clearCart, getQuantity, subtotal, tax, grandTotal, totalItems }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
