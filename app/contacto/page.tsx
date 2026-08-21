import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  HelpCircle,
  MessageCircle,
  Store,
  ShoppingBasket,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { ContactForm } from '@/components/ContactForm';

export const metadata = {
  title: 'Contacto y Ayuda | km0',
  description: 'Canal de soporte y contacto directo de la plataforma km0. Ayuda para caseríos y compradores.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Cabecera */}
        <div className="flex items-center gap-3 pb-6 border-b border-stone-200">
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Contacto y Soporte</h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              ¿Tienes dudas o necesitas ayuda? Estamos aquí para ayudarte a ti y a tu caserío
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tarjetas de contacto rápido */}
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl w-fit">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-stone-900">Email de Soporte</h3>
            <p className="text-xs font-semibold text-stone-600">
              Escríbenos directamente para dudas o incidencias técnicas:
            </p>
            <a
              href="mailto:soporte@km0caserio.eus"
              className="text-xs font-bold text-emerald-800 underline block"
            >
              soporte@km0caserio.eus
            </a>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl w-fit">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-stone-900">Atención a Caseríos</h3>
            <p className="text-xs font-semibold text-stone-600">
              Soporte para productores, altas y configuración de puntos de entrega:
            </p>
            <a
              href="mailto:caserios@km0caserio.eus"
              className="text-xs font-bold text-emerald-800 underline block"
            >
              caserios@km0caserio.eus
            </a>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl w-fit">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black text-stone-900">Horario de Atención</h3>
            <p className="text-xs font-semibold text-stone-600">
              Lunes a Viernes de 8:30 a 19:00 h.
            </p>
            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
              Respuesta en &lt; 24-48h
            </span>
          </div>
        </div>

        {/* Formulario */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <div>
            <h2 className="text-lg font-black text-stone-900">Envíanos un mensaje</h2>
            <p className="text-xs font-semibold text-stone-600">
              Rellena el siguiente formulario y nos pondremos en contacto contigo lo antes posible.
            </p>
          </div>

          <ContactForm />
        </div>

        {/* Preguntas Frecuentes (FAQ) */}
        <div className="pt-8 border-t border-stone-200 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-black text-stone-900">Preguntas Frecuentes (FAQ)</h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <details className="p-4 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer group">
              <summary className="font-black text-stone-900 list-none flex items-center justify-between">
                <span>¿Cómo compro productos en km0?</span>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-stone-600 font-medium mt-2 leading-relaxed">
                Navega por el catálogo, selecciona la cantidad que deseas de cada producto y añade a la cesta. Al confirmar, el pedido llega directamente al caserío, quien confirmará la fecha exacta de entrega.
              </p>
            </details>

            <details className="p-4 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer group">
              <summary className="font-black text-stone-900 list-none flex items-center justify-between">
                <span>¿Cómo coordino la recogida o envío con el baserritarra?</span>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-stone-600 font-medium mt-2 leading-relaxed">
                Cada caserío define sus modalidades de entrega (recogida en caserío con horario, punto de entrega acordado o envío directo a tu casa). Además, dispones de una pestaña de <strong>Mensajes</strong> para chatear directamente con el productor.
              </p>
            </details>

            <details className="p-4 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer group">
              <summary className="font-black text-stone-900 list-none flex items-center justify-between">
                <span>¿Soy productor, cómo puedo vender mis cosechas?</span>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-stone-600 font-medium mt-2 leading-relaxed">
                Crea una cuenta seleccionando el rol <strong>Productor / Caserío</strong>. Podrás publicar tus productos indicando fotos, si es a granel o por pieza, fijar tus precios y configurar tus puntos de entrega y horarios.
              </p>
            </details>

            <details className="p-4 bg-stone-50 rounded-2xl border border-stone-200 cursor-pointer group">
              <summary className="font-black text-stone-900 list-none flex items-center justify-between">
                <span>¿Puedo cancelar un pedido?</span>
                <span className="text-stone-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-stone-600 font-medium mt-2 leading-relaxed">
                Sí, mientras el pedido esté en estado <code>pendiente</code> (esperando confirmación por el caserío), puedes cancelarlo libremente desde tu sección de <strong>Pedidos</strong> y el stock volverá a quedar disponible de inmediato.
              </p>
            </details>
          </div>
        </div>

        {/* Enlaces legales inferiores */}
        <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-emerald-800">
          <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          <Link href="/privacidad" className="hover:underline">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:underline">Términos y Condiciones</Link>
          <Link href="/cookies" className="hover:underline">Política de Cookies</Link>
        </div>
      </div>
    </div>
  );
}
