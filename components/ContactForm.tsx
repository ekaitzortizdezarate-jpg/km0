'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'duda_general',
    message: '',
    consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.consent) {
      setError('Debes aceptar la política de privacidad para enviar el mensaje.');
      return;
    }

    setLoading(true);

    // Simulación de envío de soporte / email
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) {
    return (
      <div className="p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-300 text-center space-y-3 animate-fadeIn">
        <div className="w-12 h-12 bg-emerald-700 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-emerald-950">¡Mensaje recibido con éxito!</h3>
        <p className="text-xs sm:text-sm font-semibold text-emerald-900 max-w-md mx-auto">
          Gracias por contactar con <strong>km0</strong>. Hemos recibido tu consulta y nuestro equipo te responderá a la dirección <strong>{formData.email}</strong> en un plazo máximo de 24-48h laborables.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setFormData({
              name: '',
              email: '',
              phone: '',
              subject: 'duda_general',
              message: '',
              consent: false,
            });
          }}
          className="mt-3 inline-block bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black px-4 py-2 rounded-xl transition-all"
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-300 text-red-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Tu Nombre o Nombre de Caserío *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej. Mikel / Caserío Arrieta"
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="tucorreo@ejemplo.com"
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Teléfono de Contacto (opcional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="600 000 000"
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Motivo de tu Consulta *
          </label>
          <select
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="duda_general">Duda general sobre la plataforma</option>
            <option value="soporte_caserio">Soy productor / Ayuda para mi caserío</option>
            <option value="soporte_comprador">Soy comprador / Consulta sobre un pedido</option>
            <option value="incidencia_tecnica">Incidencia técnica o error</option>
            <option value="sugerencia">Sugerencia de mejora</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 mb-1">
          Mensaje / Consulta detallada *
        </label>
        <textarea
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Explícanos en qué podemos ayudarte..."
          className="w-full px-3.5 py-2.5 border-2 border-stone-300 rounded-xl text-xs font-bold text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Checkbox de consentimiento RGPD */}
      <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer pt-1">
        <input
          type="checkbox"
          required
          checked={formData.consent}
          onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
          className="mt-0.5 w-4 h-4 text-emerald-700 rounded border-stone-300 focus:ring-emerald-600"
        />
        <span>
          He leído y acepto la{' '}
          <Link href="/privacidad" target="_blank" className="font-bold text-emerald-800 underline">
            Política de Privacidad
          </Link>{' '}
          y consiento el tratamiento de mis datos para responder a mi consulta.
        </span>
      </label>

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Enviando mensaje...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Enviar Mensaje</span>
          </>
        )}
      </button>
    </form>
  );
}

export default ContactForm;
