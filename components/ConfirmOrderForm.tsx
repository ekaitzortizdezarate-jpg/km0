'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { validateAndConfirmOrder } from '@/app/actions/order-status';
import { useRouter } from 'next/navigation';
import { RejectOrderModal } from '@/components/RejectOrderModal';
import { markOrderAsRead } from '@/lib/order-read-tracker';

interface ConfirmOrderFormProps {
  orderId: string;
  defaultDateStr: string;
  buyerName?: string;
}

export function ConfirmOrderForm({
  orderId,
  defaultDateStr,
  buyerName = 'el cliente',
}: ConfirmOrderFormProps) {
  const router = useRouter();
  const [confirmedDate, setConfirmedDate] = useState(defaultDateStr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await validateAndConfirmOrder(orderId, confirmedDate);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        markOrderAsRead(orderId, new Date().toISOString());
        setSuccess(true);
        setLoading(false);
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al validar el pedido.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-amber-300 space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>¡Pedido confirmado con éxito!</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleConfirm} className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-black text-stone-900">
              Confirmar fecha de entrega al cliente:
            </label>
            <input
              type="date"
              required
              value={confirmedDate}
              onChange={(e) => setConfirmedDate(e.target.value)}
              className="px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 sm:mt-5"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Confirmando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar y Confirmar</span>
              </>
            )}
          </button>
        </form>

        <div className="sm:mt-5">
          <RejectOrderModal orderId={orderId} buyerName={buyerName} />
        </div>
      </div>
    </div>
  );
}

export default ConfirmOrderForm;
