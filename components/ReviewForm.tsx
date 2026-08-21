'use client';

import { useState } from 'react';
import { submitReview } from '@/app/actions/reviews';
import { Star, CheckCircle } from 'lucide-react';

export default function ReviewForm({
  orderId,
  targetId,
}: {
  orderId: string;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('order_id', orderId);
    formData.append('target_id', targetId);
    formData.append('rating', rating.toString());

    const res = await submitReview(formData);
    if (res?.success) {
      setSubmitted(true);
      setTimeout(() => setOpen(false), 1500);
    }
  }

  if (submitted) {
    return (
      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
        <CheckCircle className="w-3.5 h-3.5" /> ¡Valoración enviada!
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
      >
        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Valorar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-700">Puntuación:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              className="text-amber-500"
            >
              <Star className={`w-4 h-4 ${star <= rating ? 'fill-amber-500' : 'text-stone-300'}`} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <input
          name="comment"
          type="text"
          maxLength={50}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Opinión (máx. 50 letras)..."
          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs bg-white"
        />
        <span className="text-[10px] text-stone-400 block text-right">{comment.length}/50</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <label className="text-[11px] text-stone-600 flex items-center gap-1">
          <input name="is_anonymous" type="checkbox" className="rounded text-emerald-600" />
          Anónima
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-xs text-stone-500 px-2 py-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs px-3 py-1 rounded-lg"
          >
            Enviar
          </button>
        </div>
      </div>
    </form>
  );
}