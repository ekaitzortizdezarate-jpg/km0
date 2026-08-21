import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, ShoppingBasket, Truck, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones de Uso | km0',
  description: 'Términos y condiciones de uso, compra y venta directa entre productores de caserío y compradores en km0.',
};

export default function TermsPage() {
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
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
              Términos y Condiciones de Uso y Compra
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Normas que regulan la compraventa directa y el uso de la plataforma km0
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* 1. Introducción */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              1. Objeto y Ámbito de Aplicación
            </h2>
            <p>
              El presente documento establece las condiciones contractuales aplicables al uso de la plataforma digital <strong>km0</strong> y a las operaciones de reserva y compraventa formalizadas a través de la misma.
            </p>
            <p>
              Al registrarse o tramitar pedidos en <strong>km0</strong>, el usuario declara ser mayor de 18 años con plena capacidad jurídica y acepta íntegramente estos términos.
            </p>
          </section>

          {/* 2. Modelo de Comercio Directo km0 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <ShoppingBasket className="w-5 h-5 text-emerald-700" />
              2. Modelo de Intermediación Directa
            </h2>
            <p>
              <strong>km0</strong> opera como un espacio digital de encuentro y canal tecnológico de proximidad:
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-emerald-950 font-semibold">
              <p>
                • <strong>Contrato Directo:</strong> El contrato de compraventa de los alimentos o productos se celebra directa y exclusivamente entre el <strong>Comprador</strong> y el <strong>Caserío / Productor vendedor</strong>.
              </p>
              <p>
                • <strong>Sin intermediarios comerciales:</strong> El productor fija libremente los precios de su cosecha y gestiona su disponibilidad real.
              </p>
            </div>
          </section>

          {/* 3. Precios, Formatos y Pesajes */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              3. Precios, Formatos de Venta y Pesaje
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Precios Claros:</strong> Todos los precios indicados en el catálogo se expresan en Euros (€) e incluyen los impuestos aplicables (IVA superreducido o general correspondiente a cada producto).
              </li>
              <li>
                <strong>Formatos a Granel / Kilos:</strong> En productos vendidos a peso o granel, el precio se calcula en base al importe por kilogramo (€/kg) indicado por el vendedor.
              </li>
              <li>
                <strong>Formatos por Unidad o Piezas:</strong> Productos con peso aproximado o por unidad se tarifican según lo anunciado en la ficha del producto.
              </li>
              <li>
                <strong>Packs y Cestas de Temporada:</strong> Se detallan los productos incluidos en la descripción del lote.
              </li>
            </ul>
          </section>

          {/* 4. Proceso de Pedido y Reserva de Stock */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              4. Procedimiento de Pedido, Reserva de Stock y Validación
            </h2>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>
                <strong>Añadir a la Cesta y Selección de Entrega:</strong> El comprador selecciona la cantidad deseada y la modalidad de entrega ofrecida por el caserío.
              </li>
              <li>
                <strong>Reserva Inmediata de Stock:</strong> Al pulsar "Confirmar y Enviar Pedido", el stock se descuenta y queda reservado automáticamente para evitar sobreventas, quedando el pedido en estado <code>pendiente</code>.
              </li>
              <li>
                <strong>Validación por el Caserío:</strong> El baserritarra recibe la solicitud, comprueba el estado de la cosecha/preparación y confirma la fecha exacta de entrega.
              </li>
              <li>
                <strong>Cancelación antes de Validación:</strong> Mientras el pedido esté en estado <code>pendiente</code> (por validar), el comprador puede cancelarlo libremente desde su panel de Pedidos, restaurándose el stock de forma inmediata.
              </li>
            </ol>
          </section>

          {/* 5. Modalidades de Entrega */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-700" />
              5. Modalidades de Entrega de los Pedidos
            </h2>
            <p>El vendedor puede habilitar una o varias de las siguientes modalidades:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>🏡 Recogida en Caserío:</strong> El comprador acude a las instalaciones del productor dentro del horario fijado.
              </li>
              <li>
                <strong>📍 Punto de Entrega Acordado:</strong> Recogida en puestos de mercado, plazas o puntos físicos definidos por el vendedor.
              </li>
              <li>
                <strong>🚚 Envío a Domicilio:</strong> Entrega directa en la dirección indicada por el comprador según los plazos de cosecha (día siguiente o días fijos de reparto semanal).
              </li>
            </ul>
          </section>

          {/* 6. Excepción al Derecho de Desistimiento en Alimentos Perecederos */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
              6. Derecho de Desistimiento y Alimentos Perecederos
            </h2>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-amber-950">
              <p>
                De conformidad con el <strong>artículo 103, letra d) del Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios)</strong>, el derecho de desistimiento <strong>no es aplicable al suministro de bienes que puedan deteriorarse o caducar con rapidez</strong> (frutas, verduras frescas, hortalizas, lácteos frescos y alimentos perecederos).
              </p>
              <p className="text-xs font-semibold">
                No obstante, si el producto presentara defectos de calidad manifiesta o no se correspondiera con lo solicitado, el comprador podrá comunicarlo inmediatamente al caserío mediante el chat o a través del soporte de km0 para gestionar la sustitución o abono correspondiente.
              </p>
            </div>
          </section>

          {/* 7. Obligaciones de los Productores y Compradores */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              7. Obligaciones y Conducta de los Usuarios
            </h2>
            <p>
              <strong>Obligaciones del Productor:</strong> Garantizar el origen local de sus productos, mantener actualizados sus precios y stock, velar por las normas higiénico-sanitarias y responder diligentemente a los pedidos y mensajes.
            </p>
            <p>
              <strong>Obligaciones del Comprador:</strong> Proporcionar datos de contacto y entrega veraces, acudir a la recogida en los horarios acordados o facilitar la recepción en envíos a domicilio.
            </p>
          </section>

          {/* 8. Reseñas y Valoraciones */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              8. Reseñas y Comentarios
            </h2>
            <p>
              Los compradores pueden publicar valoraciones sobre los productos y caseríos en base a compras reales. Quedan expresamente prohibidos comentarios ofensivos, difamatorios o fraudulentos, reservándose km0 el derecho de moderación y retirada.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-emerald-800">
          <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          <Link href="/privacidad" className="hover:underline">Política de Privacidad</Link>
          <Link href="/cookies" className="hover:underline">Política de Cookies</Link>
          <Link href="/contacto" className="hover:underline">Contacto y Soporte</Link>
        </div>
      </div>
    </div>
  );
}
