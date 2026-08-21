'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

export interface CartItem {
  productId: string;
  sellerId: string;
  sellerName: string;
  sellerTown: string;
  name: string;
  category: string;
  format: 'granel' | 'suelto' | 'pack';
  price: number;
  unitPrice: number;
  weightKg: number | null;
  imageUrl: string | null;
  quantity: number;
  packItems?: string | null;
  availabilityType?: string;
  availabilityDays?: number | null;
  availabilityWeekdays?: string[] | null;
  availableFromDate?: string | null;
  estimatedDeliveryDate?: string;
  deliveryBadge?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'km0_shopping_cart';

let cachedItems: CartItem[] = [];
let cachedString = '';

function subscribe(callback: () => void) {
  window.addEventListener('km0_cart_updated', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('km0_cart_updated', callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || '[]';
    if (raw !== cachedString) {
      cachedString = raw;
      cachedItems = JSON.parse(raw);
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

function getServerSnapshot(): CartItem[] {
  return [];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveItems = (newItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
      window.dispatchEvent(new Event('km0_cart_updated'));
    } catch {
      // Ignore
    }
  };

  const addToCart = (newItem: CartItem) => {
    const existingIndex = items.findIndex((i) => i.productId === newItem.productId);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += newItem.quantity;
      saveItems(updated);
    } else {
      saveItems([...items, newItem]);
    }
  };

  const removeFromCart = (productId: string) => {
    saveItems(items.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartCount = items.length;
  const totalPrice = items.reduce(
    (acc, item) => acc + item.unitPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
