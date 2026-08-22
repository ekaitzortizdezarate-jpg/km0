'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, X, Store, Truck, Clock, Check, Plus, Minus, MapPin } from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import type { DeliveryPoint } from '@/types/database';
import {
  getCaserioEstimate,
  getPuntoEntregaEstimate,
  getDomicilioEstimate,
} from '@/lib/delivery';

interface QuickAddToCartModalProps {
  item: CartItem & {
    deliveryMethods?: string[] | null;
    caserioSchedule?: string | null;
  };
  children?: React.ReactNode;
  className?: string;
  isCardOverlay?: boolean;
}

export function QuickAddToCartModal({
  item,
  children,
  className = '',
  isCardOverlay = false,
}: QuickAddToCartModalProps) {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState<number>(item.format === 'granel' ? 1 : 1);
  const [quantityInput, setQuantityInput] = useState<string>('1');

  // Opciones permitidas por el vendedor (estrictas)
  const rawMethods = item.deliveryMethods && item.deliveryMethods.length > 0
    ? item.deliveryMethods
    : ['caserio'];

  const availableMethods = Array.from(
    new Set(
      rawMethods.map((m) => {
        if (m === 'sitio_fisico') return 'punto_entrega';
        if (m === 'envio') return 'domicilio';
        return m;
      })
    )
  );

  const [deliveryMethod, setDeliveryMethod] = useState<string>(
    availableMethods[0] || 'caserio'
  );

  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string>('');
  const [added, setAdded] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.includes(deliveryMethod)) {
      setDeliveryMethod(availableMethods[0]);
    }
  }, [availableMethods, deliveryMethod]);

  useEffect(() => {
    async function loadDeliveryPoints() {
      if (!isOpen) return;
      // Solo puntos físicos guardados (sitio_fisico), sin mezclar con caserio
      const { data } = await supabase
        .from('delivery_points')
        .select('*')
        .eq('seller_id', item.sellerId)
        .eq('type', 'sitio_fisico')
        .eq('is_active', true);

      if (data && data.length > 0) {
        setDeliveryPoints(data);
        setSelectedPointId(data[0].id);
      } else {
        setDeliveryPoints([]);
        setSelectedPointId('');
      }
    }
    loadDeliveryPoints();
  }, [isOpen, item.sellerId, supabase]);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const initialQty = 1;
    setQuantity(initialQty);
    setQuantityInput(String(initialQty));
    setAdded(false);
    if (availableMethods.length > 0) {
      setDeliveryMethod(availableMethods[0]);
    }
    setIsOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const maxStock = item.isUnlimitedStock ? 9999 : Number(item.stock) || 0;
  const isOutOfStock = !item.isUnlimitedStock && maxStock <= 0;

  const handleQuantityInputChange = (val: string) => {
    setQuantityInput(val);
    const normalized = val.replace(',', '.').trim();
    const num = parseFloat(normalized);
    if (!isNaN(num) && num > 0) {
      const clamped = Math.min(maxStock, num);
      setQuantity(clamped);
    }
  };

  const updateQuantityStep = (delta: number) => {
    const step = item.format === 'granel' ? 0.5 : 1;
    const nextVal = Math.max(step, Math.min(maxStock, Math.round((quantity + delta * step) * 10) / 10));
    setQuantity(nextVal);
    setQuantityInput(String(nextVal).replace('.', ','));
  };

  const selectedPoint = deliveryPoints.find((p) => p.id === selectedPointId) || deliveryPoints[0];

  const caserioEst = getCaserioEstimate(item);
  const puntoEst = getPuntoEntregaEstimate(item, selectedPoint);
  const domicilioEst = getDomicilioEstimate(item);

  const handleConfirmAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const pointId = deliveryMethod === 'punto_entrega' ? selectedPoint?.id || null : null;
    const pointName = deliveryMethod === 'punto_entrega' ? selectedPoint?.name || null : null;
    const cartItemId = `${item.productId}_${deliveryMethod}_${pointId || 'none'}`;

    addToCart({
      ...item,
      cartItemId,
      quantity,
      selectedDeliveryType: deliveryMethod as 'caserio' | 'punto_entrega' | 'domicilio',
      selectedPointId: pointId,
      selectedPointName: pointName,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsOpen(false);
    }, 800);
  };

  const subtotal = (item.unitPrice * quantity).toFixed(2);
  const unitLabel = item.format === 'granel' ? 'kg' : 'uds';

  return (
    <div className={className}>
      {children ? (
        <div onClick={handleOpen} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          disabled={isOutOfStock}
          className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Agotado' : 'Añadir'}</span>
        </button>
      )}

      {/* Modal Portal */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={handleClose}
          >
            <div
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-stone-200 text-stone-900 relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Cabecera Producto */}
              <div className="flex items-start gap-3.5 pr-8">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 shrink-0">
                    <Store className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    {item.sellerAvatarUrl ? (
                      <img
                        src={item.sellerAvatarUrl}
                        alt={item.sellerName}
                        className="w-5 h-5 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[9px] flex items-center justify-center border border-emerald-300 shrink-0">
                        {item.sellerName?.charAt(0) || 'C'}
                      </div>
                    )}
                    <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider truncate">
                      {item.sellerName} ({item.sellerTown})
                    </span>
                  </div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-emerald-950">
                      {item.unitPrice.toFixed(2)} €
                      <span className="text-[11px] font-bold text-stone-500 ml-0.5">
                        /{item.format === 'granel' ? 'kg' : 'ud'}
                      </span>
                    </span>
                    {item.isOrganic && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded-md">
                        Ecológico
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector de Cantidad con soporte de decimales (kg) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                    Cantidad ({unitLabel}):
                  </label>
                  {!item.isUnlimitedStock && (
                    <span className="text-[11px] font-bold text-stone-500">
                      Disponible: <strong>{maxStock} {unitLabel}</strong>
                    </span>
                  )}
                </div>

                {isOutOfStock ? (
                  <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold text-center">
                    Este producto no tiene stock disponible en este momento.
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 bg-stone-50 p-2.5 rounded-2xl border border-stone-200">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantityStep(-1)}
                        className="w-9 h-9 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-900 flex items-center justify-center font-black"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex items-center bg-white px-2 py-1 rounded-xl border border-stone-300">
                        <input
                          type="text"
                          value={quantityInput}
                          onChange={(e) => handleQuantityInputChange(e.target.value)}
                          className="w-14 text-center font-black text-base text-stone-900 focus:outline-none bg-transparent"
                        />
                        <span className="text-xs font-bold text-stone-600 pr-1">{unitLabel}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateQuantityStep(1)}
                        disabled={!item.isUnlimitedStock && quantity >= maxStock}
                        className="w-9 h-9 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:opacity-40 text-white flex items-center justify-center font-black"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Pastillas de cantidad rápida */}
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 5]
                        .filter((num) => item.isUnlimitedStock || num <= maxStock)
                        .map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => {
                              setQuantity(num);
                              setQuantityInput(String(num));
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                              quantity === num
                                ? 'bg-emerald-800 text-white border-emerald-900'
                                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            {num} {unitLabel}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modalidades de Entrega y Entrega Prevista por cada modalidad */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                    {availableMethods.length === 1
                      ? 'Modalidad de entrega disponible:'
                      : 'Elige la modalidad de entrega:'}
                  </label>
                  <span className="text-[10px] font-bold text-stone-500">
                    {availableMethods.length} {availableMethods.length === 1 ? 'opción' : 'opciones'}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* 1. Opción: En Caserío */}
                  {availableMethods.includes('caserio') && (
                    <div
                      onClick={() => setDeliveryMethod('caserio')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                        deliveryMethod === 'caserio'
                          ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                          <Store className="w-4 h-4 text-emerald-800" />
                          <span>Recogida en Caserío</span>
                        </span>
                        <input
                          type="radio"
                          name="quick_modal_delivery_choice"
                          checked={deliveryMethod === 'caserio'}
                          onChange={() => setDeliveryMethod('caserio')}
                          className="w-4 h-4 text-emerald-700"
                        />
                      </div>

                      {/* Entrega Prevista específica para Caserío */}
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-0.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Entrega Prevista:</span>
                        </div>
                        <p className="text-stone-900 font-extrabold capitalize text-xs">
                          {caserioEst.dateStr}
                        </p>
                        <p className="text-stone-600 font-semibold text-[11px]">
                          🏡 Instalaciones del caserío en {item.sellerTown}.
                        </p>
                        {item.caserioSchedule && (
                          <p className="text-emerald-950 font-bold text-[10px] pt-0.5">
                            🕒 Horario habitual: {item.caserioSchedule}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Opción: Punto de Entrega */}
                  {availableMethods.includes('punto_entrega') && (
                    <div
                      onClick={() => setDeliveryMethod('punto_entrega')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                        deliveryMethod === 'punto_entrega'
                          ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                          <MapPin className="w-4 h-4 text-emerald-800" />
                          <span>Punto de Entrega (Mercado / Plaza)</span>
                        </span>
                        <input
                          type="radio"
                          name="quick_modal_delivery_choice"
                          checked={deliveryMethod === 'punto_entrega'}
                          onChange={() => setDeliveryMethod('punto_entrega')}
                          className="w-4 h-4 text-emerald-700"
                        />
                      </div>

                      {/* Entrega Prevista específica para Punto de Entrega */}
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-1.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Entrega Prevista:</span>
                        </div>
                        <p className="text-stone-900 font-extrabold capitalize text-xs">
                          {puntoEst.dateStr}
                        </p>

                        {deliveryPoints.length > 1 ? (
                          <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-[10px] font-bold text-stone-700 mb-1">
                              Selecciona el punto de entrega:
                            </label>
                            <select
                              value={selectedPointId || deliveryPoints[0]?.id}
                              onChange={(e) => setSelectedPointId(e.target.value)}
                              className="w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                            >
                              {deliveryPoints.map((pt) => (
                                <option key={pt.id} value={pt.id}>
                                  {pt.name} - {pt.town} ({pt.address_details})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : deliveryPoints.length === 1 ? (
                          <div className="text-[11px] text-stone-600 space-y-0.5 pt-0.5">
                            <p className="font-bold text-stone-900">{deliveryPoints[0].name} ({deliveryPoints[0].town})</p>
                            <p>{deliveryPoints[0].address_details}</p>
                            {deliveryPoints[0].schedule_notes && (
                              <p className="text-[10px] text-amber-900 font-bold">🕒 {deliveryPoints[0].schedule_notes}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-stone-600">Punto físico acordado con el caserío.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Opción: Envío a Domicilio */}
                  {availableMethods.includes('domicilio') && (
                    <div
                      onClick={() => setDeliveryMethod('domicilio')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                        deliveryMethod === 'domicilio'
                          ? 'border-emerald-700 bg-emerald-50/60 ring-2 ring-emerald-600 shadow-sm'
                          : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                          <Truck className="w-4 h-4 text-emerald-800" />
                          <span>Envío a Domicilio</span>
                        </span>
                        <input
                          type="radio"
                          name="quick_modal_delivery_choice"
                          checked={deliveryMethod === 'domicilio'}
                          onChange={() => setDeliveryMethod('domicilio')}
                          className="w-4 h-4 text-emerald-700"
                        />
                      </div>

                      {/* Entrega Prevista específica para Envío a Domicilio */}
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-0.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>Entrega Prevista:</span>
                        </div>
                        <p className="text-stone-900 font-extrabold capitalize text-xs">
                          {domicilioEst.dateStr}
                        </p>
                        {domicilioEst.detailLead && (
                          <p className="text-stone-600 font-semibold text-[11px]">
                            🚚 Reparto directo ({domicilioEst.detailLead})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Confirmación con Subtotal */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isOutOfStock || added}
                  onClick={handleConfirmAddToCart}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-between ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : isOutOfStock
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                      : 'bg-emerald-800 hover:bg-emerald-900 active:scale-98 text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                    <span>{added ? '¡Añadido a la Cesta!' : 'Añadir a la Cesta'}</span>
                  </span>

                  <span className="bg-black/20 px-3 py-1 rounded-xl text-xs font-black">
                    {subtotal} €
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default QuickAddToCartModal;
