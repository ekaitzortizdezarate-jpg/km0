'use client';

import React, { createContext, useContext, useSyncExternalStore } from 'react';

export interface CartItem {
  cartItemId?: string; // Identificador único compuesto (producto + modalidad + punto)
  productId: string;
  sellerId: string;
  sellerName: string;
  sellerTown: string;
  sellerAvatarUrl?: string | null;
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
  deliveryBadgeDetail?: string;
  isOrganic?: boolean;
  deliveryMethods?: string[] | null;
  caserioSchedule?: string | null;
  selectedDeliveryType?: 'caserio' | 'punto_entrega' | 'domicilio';
  selectedPointId?: string | null;
  selectedPointName?: string | null;
  stock?: number;
  isUnlimitedStock?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  removeSellerItems: (sellerId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
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

function getItemKey(item: CartItem): string {
  return (
    item.cartItemId ||
    `${item.productId}_${item.selectedDeliveryType || 'caserio'}_${item.selectedPointId || 'none'}`
  );
}

function getSnapshot(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || '[]';
    if (raw !== cachedString) {
      cachedString = raw;
      const parsed: CartItem[] = JSON.parse(raw);
      cachedItems = parsed.map((item) => ({
        ...item,
        cartItemId: getItemKey(item),
      }));
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

const EMPTY_CART_ITEMS: CartItem[] = [];
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART_ITEMS;
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
    const itemKey = getItemKey(newItem);
    const fullItem: CartItem = { ...newItem, cartItemId: itemKey };

    const existingIndex = items.findIndex((i) => getItemKey(i) === itemKey);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += newItem.quantity;
      saveItems(updated);
    } else {
      saveItems([...items, fullItem]);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    saveItems(items.filter((i) => getItemKey(i) !== cartItemId && i.productId !== cartItemId));
  };

  const removeSellerItems = (sellerId: string) => {
    saveItems(items.filter((i) => i.sellerId !== sellerId));
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    const updated = items.map((item) =>
      getItemKey(item) === cartItemId || item.productId === cartItemId
        ? { ...item, quantity }
        : item
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
        removeSellerItems,
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
