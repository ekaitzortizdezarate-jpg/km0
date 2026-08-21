import Link from 'next/link';
import { ArrowLeft, Cookie, Shield, CheckCircle2, Settings } from 'lucide-react';

export const metadata = {
  title: 'Política de Cookies | km0',
  description: 'Información detallada sobre el uso de cookies y almacenamiento local en la plataforma km0.',
};

export default function CookiesPolicyPage() {
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
            <Cookie className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Política de Cookies</h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Información sobre las cookies técnicas y de funcionamiento utilizadas en km0
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* 1. ¿Qué son las cookies? */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              1. ¿Qué son las cookies y tecnologías de almacenamiento local?
            </h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en su navegador o dispositivo al visitarlos. Permiten que la web recuerde información sobre su visita, como su sesión de usuario autenticado o los productos que ha añadido a su cesta de la compra.
            </p>
          </section>

          {/* 2. Cookies que utilizamos */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              2. Tipos de Cookies y Almacenamiento Utilizados en km0
            </h2>
            <p>
              En <strong>km0 no utilizamos cookies publicitarias de terceros ni herramientas de rastreo comercial invasivo</strong>. Únicamente utilizamos tecnologías esenciales para el funcionamiento de la plataforma:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-stone-50 rounded-2xl overflow-hidden text-xs">
                <thead>
                  <tr className="bg-emerald-900 text-white font-black">
                    <th className="p-3">Nombre / Clave</th>
                    <th className="p-3">Tipo / Origen</th>
                    <th className="p-3">Finalidad</th>
                    <th className="p-3">Duración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-semibold text-stone-800">
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-950">sb-*-auth-token</td>
                    <td className="p-3">Técnica (Propia / Supabase)</td>
                    <td className="p-3">Mantiene la sesión de usuario iniciada de forma segura mediante token cifrado.</td>
                    <td className="p-3">Sesión / Persistente</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-950">km0_shopping_cart</td>
                    <td className="p-3">Técnica (LocalStorage)</td>
                    <td className="p-3">Guarda temporalmente los productos seleccionados en la cesta para no perderlos al navegar.</td>
                    <td className="p-3">Persistente local</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-emerald-950">km0_cookie_consent</td>
                    <td className="p-3">Preferencias (LocalStorage)</td>
                    <td className="p-3">Registra si el usuario ha aceptado o configurado el aviso de cookies.</td>
                    <td className="p-3">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Base de Legitimación */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              3. Legitimación para el Uso de Cookies Técnicas
            </h2>
            <p>
              De conformidad con el <strong>artículo 22.2 de la Ley 34/2002 (LSSI-CE)</strong> y las directrices de la Agencia Española de Protección de Datos (AEPD), las <strong>cookies técnicas y estrictamente necesarias para la prestación de un servicio expresamente solicitado por el usuario</strong> (como iniciar sesión o usar la cesta de la compra) no requieren consentimiento previo obligatorio, aunque se informa de ellas de manera transparente.
            </p>
          </section>

          {/* 4. Cómo gestionar las cookies desde el navegador */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-700" />
              4. ¿Cómo desactivar o eliminar las cookies en su navegador?
            </h2>
            <p>
              Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador de Internet:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.
              </li>
              <li>
                <strong>Mozilla Firefox:</strong> Ajustes &gt; Privacidad &amp; Seguridad &gt; Cookies y datos del sitio.
              </li>
              <li>
                <strong>Apple Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.
              </li>
              <li>
                <strong>Microsoft Edge:</strong> Configuración &gt; Cookies y permisos del sitio.
              </li>
            </ul>
            <p className="text-xs text-stone-500 mt-1">
              * Tenga en cuenta que si desactiva las cookies técnicas, algunas funcionalidades como mantener su sesión iniciada o guardar productos en la cesta no funcionarán correctamente.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-emerald-800">
          <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          <Link href="/privacidad" className="hover:underline">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:underline">Términos y Condiciones</Link>
          <Link href="/contacto" className="hover:underline">Contacto y Soporte</Link>
        </div>
      </div>
    </div>
  );
}
