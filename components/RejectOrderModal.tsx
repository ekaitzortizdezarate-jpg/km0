'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Send, Trash2 } from 'lucide-react';
import { rejectOrderWithReason } from '@/app/actions/order-status';
import { useRouter } from 'next/navigation';

interface RejectOrderModalProps {
  orderId: string;
  buyerName?: string;
  className?: string;
  label?: string;
}

export function RejectOrderModal({
  orderId,
  buyerName = 'el cliente',
  className = '',
  label = 'Rechazar Pedido',
}: RejectOrderModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage('');
    setError(null);
    setIsOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!loading) {
      setIsOpen(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await rejectOrderWithReason(orderId, message);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setLoading(false);
        setIsOpen(false);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al rechazar el pedido.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Rechazar y cancelar este pedido"
        className={`bg-white hover:bg-red-50 text-red-700 hover:text-red-800 border-2 border-red-300 font-black text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${className}`}
      >
        <Trash2 className="w-3.5 h-3.5 text-red-600" />
        <span>{label}</span>
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
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-900 text-base">Rechazar Pedido</h3>
                      <p className="text-xs font-semibold text-stone-500">
                        Pedido de {buyerName}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleClose}
                    className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl">
                    {error}
                  </div>
                )}

                <p className="text-xs font-medium text-stone-700">
                  Al rechazar el pedido, se cancelará la compra y se restablecerá el stock de tus productos. Puedes explicarle el motivo al comprador para que reciba un mensaje directo en el chat.
                </p>

                {/* Formulario */}
                <form onSubmit={handleConfirmReject} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-stone-900">
                      Mensaje / Motivo para el comprador (opcional):
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ej. Lo sentimos, no disponemos de suficiente cosecha para la fecha solicitada..."
                      className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-semibold text-stone-900 bg-white placeholder:text-stone-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleClose}
                      className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
                    >
                      Volver
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{loading ? 'Rechazando...' : 'Confirmar Rechazo'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default RejectOrderModal;
