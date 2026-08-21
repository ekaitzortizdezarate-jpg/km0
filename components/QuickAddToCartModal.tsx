'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, X, Store, Truck, Clock, Check, Plus, Minus } from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import type { DeliveryPoint } from '@/types/database';

interface QuickAddToCartModalProps {
  item: CartItem & {
    deliveryMethods?: string[] | null;
    caserioSchedule?: string | null;
  };
  className?: string;
  isCardOverlay?: boolean;
}

export function QuickAddToCartModal({
  item,
  className = '',
  isCardOverlay = true,
}: QuickAddToCartModalProps) {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Opciones permitidas por el vendedor
  const availableMethods = item.deliveryMethods && item.deliveryMethods.length > 0
    ? item.deliveryMethods
    : ['caserio', 'punto_entrega', 'domicilio'];

  const [deliveryMethod, setDeliveryMethod] = useState<string>(
    availableMethods.includes('caserio')
      ? 'caserio'
      : availableMethods.includes('punto_entrega')
      ? 'punto_entrega'
      : 'domicilio'
  );

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [added, setAdded] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadDeliveryPoints() {
      if (!isOpen) return;
      const { data } = await supabase
        .from('delivery_points')
        .select('*')
        .eq('seller_id', item.sellerId)
        .eq('is_active', true);

      if (data && data.length > 0) {
        setDeliveryPoints(data);
        setSelectedPointId(data[0].id);
      }
    }
    loadDeliveryPoints();
  }, [isOpen, item.sellerId, supabase]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity(1);
    setAdded(false);
    setIsOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const handleConfirmAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      ...item,
      quantity,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsOpen(false);
    }, 900);
  };

  const subtotal = (item.unitPrice * quantity).toFixed(2);
  const unitLabel = item.format === 'granel' ? 'kg' : 'uds';

  return (
    <>
      {/* Botón Overlay que hace que toda la tarjeta sea pulsable */}
      {isCardOverlay && (
        <button
          type="button"
          onClick={handleOpen}
          className="absolute inset-0 z-0 w-full h-full cursor-pointer text-left focus:outline-none"
          aria-label={`Añadir ${item.name} a la cesta`}
        />
      )}

      {/* Botón visible de Añadir */}
      <button
        type="button"
        onClick={handleOpen}
        title="Configurar y añadir a la cesta"
        className={`relative z-10 px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm bg-emerald-700 hover:bg-emerald-800 text-white ${className}`}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Añadir</span>
      </button>

      {isOpen && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={handleClose}
            >
              <div
                className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl border-2 border-stone-200 relative text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera modal */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-stone-300 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 font-black text-sm flex items-center justify-center shrink-0">
                        km0
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-stone-900 text-base leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs font-bold text-stone-600 mt-0.5">
                        {item.sellerName} · {item.sellerTown}
                      </p>
                      <p className="text-xs font-black text-emerald-800 mt-0.5">
                        {item.unitPrice.toFixed(2)} € / {unitLabel}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Fecha y Plazo de Entrega */}
                {item.deliveryBadge && (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Entrega estimada: <strong>{item.deliveryBadge}</strong></span>
                  </div>
                )}

                {/* Selector de Cantidad */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                    Cantidad deseada ({unitLabel}):
                  </label>

                  <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-900 flex items-center justify-center font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="text-xl font-black text-stone-900 px-3 min-w-[50px] text-center">
                        {quantity}{' '}
                        <span className="text-xs font-bold text-stone-600">{unitLabel}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-9 h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pastillas de cantidad rápida */}
                    <div className="flex flex-wrap gap-1">
                      {(item.format === 'granel' ? [2, 5, 10] : [2, 3, 5]).map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setQuantity(num)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                            quantity === num
                              ? 'bg-emerald-700 text-white border-emerald-800'
                              : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {num} {unitLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modalidad de entrega */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                    Opciones de Entrega del Caserío:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {availableMethods.includes('caserio') && (
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('caserio')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                          deliveryMethod === 'caserio'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-emerald-700" />
                          <span>En Caserío</span>
                        </span>
                        <span className="text-[9px] font-semibold text-stone-500">Recogida directa</span>
                      </button>
                    )}

                    {availableMethods.includes('punto_entrega') && (
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('punto_entrega')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                          deliveryMethod === 'punto_entrega'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Punto Entrega</span>
                        </span>
                        <span className="text-[9px] font-semibold text-stone-500">Mercado / Plaza</span>
                      </button>
                    )}

                    {availableMethods.includes('domicilio') && (
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('domicilio')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-black transition-all flex flex-col justify-between gap-1 ${
                          deliveryMethod === 'domicilio'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-sm'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>A Domicilio</span>
                        </span>
                        <span className="text-[9px] font-semibold text-stone-500">Envío directo</span>
                      </button>
                    )}
                  </div>

                  {/* Horario Caserío */}
                  {deliveryMethod === 'caserio' && item.caserioSchedule && (
                    <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-700 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Horario de recogida: <strong>{item.caserioSchedule}</strong></span>
                    </div>
                  )}

                  {/* Puntos de Entrega */}
                  {deliveryMethod === 'punto_entrega' && deliveryPoints.length > 0 && (
                    <div className="space-y-1">
                      <select
                        value={selectedPointId}
                        onChange={(e) => setSelectedPointId(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900"
                      >
                        {deliveryPoints.map((pt) => (
                          <option key={pt.id} value={pt.id}>
                            {pt.name} ({pt.town}) · {pt.address_details}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Subtotal y Botón Final */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 block uppercase">
                      Subtotal ({quantity} {unitLabel})
                    </span>
                    <span className="text-2xl font-black text-stone-900">{subtotal} €</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmAddToCart}
                    className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                      added
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> ¡Añadido a la Cesta!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" /> Añadir a la Cesta
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default QuickAddToCartModal;
