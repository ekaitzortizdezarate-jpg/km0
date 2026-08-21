import Link from 'next/link';
import { ArrowLeft, Shield, FileText, Scale } from 'lucide-react';

export const metadata = {
  title: 'Aviso Legal | km0',
  description: 'Información legal, titularidad del sitio web y condiciones de uso de km0.',
};

export default function LegalNoticePage() {
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
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Aviso Legal</h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE)
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* 1. Datos Identificativos */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-700" />
              1. Datos Identificativos del Titular
            </h2>
            <p>
              En cumplimiento del artículo 10 de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</strong>, se ponen a disposición de los usuarios los datos identificativos de la plataforma <strong>km0</strong>:
            </p>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1 font-semibold text-stone-800">
              <p>• <strong>Denominación del Servicio:</strong> Plataforma km0 (Comercio Local y Proximidad de Caserío)</p>
              <p>• <strong>Finalidad:</strong> Plataforma digital de intermediación directa entre productores locales / caseríos y consumidores finales.</p>
              <p>• <strong>Ámbito territorial:</strong> Euskadi / Territorio Nacional.</p>
              <p>• <strong>Correo Electrónico de Contacto:</strong> <a href="mailto:info@km0caserio.eus" className="text-emerald-800 underline font-bold">info@km0caserio.eus</a> / <a href="mailto:soporte@km0caserio.eus" className="text-emerald-800 underline font-bold">soporte@km0caserio.eus</a></p>
              <p>• <strong>Formulario de atención:</strong> Accesible desde la sección <Link href="/contacto" className="text-emerald-800 underline font-bold">Contacto y Ayuda</Link>.</p>
            </div>
          </section>

          {/* 2. Objeto y Funcionamiento */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              2. Objeto y Naturaleza de la Plataforma
            </h2>
            <p>
              <strong>km0</strong> es una plataforma tecnológica diseñada para fomentar el consumo de proximidad y la soberanía alimentaria, facilitando el contacto directo y la compraventa sin intermediarios entre <strong>productores agrícolas, ganaderos y artesanos locales (vendedores/baserritarras)</strong> y <strong>consumidores particulares (compradores)</strong>.
            </p>
            <p>
              <strong>km0 actúa exclusivamente como canal e intermediario técnico</strong>, facilitando la publicación de productos de temporada, la gestión de pedidos, la coordinación de entregas (en caserío, punto de recogida o a domicilio) y la comunicación directa mediante chat.
            </p>
          </section>

          {/* 3. Condiciones de Acceso y Uso */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              3. Condiciones de Acceso y Utilización
            </h2>
            <p>
              El acceso a la web es gratuito. La navegación y el uso de los servicios atribuyen la condición de usuario, implicando la aceptación plena y sin reservas de las presentes disposiciones y de los <Link href="/terminos" className="text-emerald-800 underline font-bold">Términos y Condiciones de Uso</Link>.
            </p>
            <p>
              El usuario se compromete a hacer un uso diligente y lícito de la plataforma, absteniéndose de introducir contenidos fraudulentos, vulnerar derechos de terceros o alterar el correcto funcionamiento del sistema informático.
            </p>
          </section>

          {/* 4. Responsabilidad sobre los Productos y Transacciones */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              4. Responsabilidad sobre los Productos Alimentarios
            </h2>
            <p>
              De conformidad con la normativa de comercio y protección de los consumidores:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Los vendedores/caseríos</strong> son los únicos y exclusivos responsables de la veracidad de la información de sus cosechas, origen, etiquetado ecológico/tradicional, frescura, cumplimiento de la normativa higiénico-sanitaria alimentaria y de la correcta preparación y entrega del producto.
              </li>
              <li>
                <strong>km0</strong> no es propietario, almacenista ni distribuidor físico de los alimentos, por lo que declina cualquier responsabilidad derivada de la calidad, estado o posibles discrepancias en la entrega directa efectuada por los productores, sin perjuicio de colaborar activamente en la resolución de incidencias a través del canal de soporte.
              </li>
            </ul>
          </section>

          {/* 5. Propiedad Intelectual e Industrial */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              5. Propiedad Intelectual e Industrial
            </h2>
            <p>
              Todos los contenidos de la plataforma (código fuente, diseño gráfico, logotipos, iconos, textos e interfaces) son propiedad de <strong>km0</strong> o de terceros licenciantes, estando protegidos por la legislación española e internacional sobre propiedad intelectual e industrial.
            </p>
            <p>
              Las marcas o fotografías de productos aportadas por los caseríos pertenecen a sus respectivos titulares, quienes conceden a km0 una licencia de uso no exclusiva para la promoción y visualización en el catálogo.
            </p>
          </section>

          {/* 6. Enlaces Externos */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              6. Enlaces y Servicios de Terceros
            </h2>
            <p>
              El sitio web puede contener enlaces a servicios y mapas de terceros. km0 no se hace responsable de los contenidos, políticas de privacidad o prácticas de sitios web externos ajenos a su control.
            </p>
          </section>

          {/* 7. Legislación y Jurisdicción */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              7. Legislación Aplicable y Jurisdicción
            </h2>
            <p>
              Las relaciones entre el usuario y km0 se regirán por la normativa española vigente. Para la resolución de cualquier controversia, las partes se someterán a los Juzgados y Tribunales competentes según la legislación procesal y de consumidores.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-emerald-800">
          <Link href="/privacidad" className="hover:underline">Política de Privacidad</Link>
          <Link href="/terminos" className="hover:underline">Términos y Condiciones</Link>
          <Link href="/cookies" className="hover:underline">Política de Cookies</Link>
          <Link href="/contacto" className="hover:underline">Contacto y Soporte</Link>
        </div>
      </div>
    </div>
  );
}
