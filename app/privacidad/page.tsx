import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, UserCheck, Eye, Database } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | km0',
  description: 'Información sobre el tratamiento y protección de datos personales de usuarios y caseríos en km0 (RGPD / LOPDGDD).',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Política de Privacidad</h1>
            <p className="text-xs sm:text-sm font-semibold text-stone-600">
              Reglamento General de Protección de Datos (RGPD UE 2016/679) y LOPDGDD 3/2018
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {/* Introducción */}
          <p>
            En <strong>km0</strong> nos tomamos muy en serio la privacidad y protección de los datos personales de nuestros usuarios (compradores y baserritarras/vendedores). La presente Política de Privacidad describe de forma clara y transparente cómo recopilamos, tratamos y protegemos su información.
          </p>

          {/* 1. Responsable del Tratamiento */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" />
              1. Responsable del Tratamiento de sus Datos
            </h2>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1 font-semibold text-stone-800">
              <p>• <strong>Identidad:</strong> Plataforma km0 (Comercio Local y Proximidad)</p>
              <p>• <strong>Email de contacto para Privacidad:</strong> <a href="mailto:privacidad@km0caserio.eus" className="text-emerald-800 underline font-bold">privacidad@km0caserio.eus</a></p>
              <p>• <strong>Delegado de Protección de Datos / Soporte:</strong> <a href="mailto:soporte@km0caserio.eus" className="text-emerald-800 underline font-bold">soporte@km0caserio.eus</a></p>
            </div>
          </section>

          {/* 2. Datos que recopilamos */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-700" />
              2. ¿Qué datos personales recopilamos?
            </h2>
            <p>Recopilamos únicamente los datos necesarios para la prestación del servicio:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Datos de Registro y Perfil:</strong> Nombre completo o denominación del caserío, correo electrónico, contraseña cifrada, teléfono de contacto y municipio/pueblo.
              </li>
              <li>
                <strong>Datos de Pedidos y Entregas:</strong> Productos seleccionados, cantidades, fecha estimada de cosecha/entrega, dirección de entrega en caso de envío a domicilio o punto físico de recogida acordado.
              </li>
              <li>
                <strong>Datos de Comunicación / Chat Interno:</strong> Mensajes intercambiados entre comprador y vendedor para la validación y coordinación del pedido.
              </li>
              <li>
                <strong>Datos Técnicos de Navegación:</strong> Cookies técnicas necesarias para mantener la sesión abierta y gestionar la cesta de la compra local.
              </li>
            </ul>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              3. ¿Con qué finalidad tratamos sus datos?
            </h2>
            <p>Tratamos sus datos para las siguientes finalidades explícitas:</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Gestionar el registro de usuarios (perfiles de comprador o vendedor).</li>
              <li>Permitir a los vendedores publicar cosechas, fijar precios y configurar horarios y modalidades de entrega.</li>
              <li>Tramitar la cesta de la compra, reserva de stock y emisión de pedidos directos a los caseríos.</li>
              <li>Facilitar la mensajería interna entre comprador y productor para confirmar detalles y solventar dudas sobre la cosecha.</li>
              <li>Atender consultas y solicitudes de soporte a través del formulario de contacto.</li>
              <li>Cumplir con las obligaciones legales aplicables en materia de comercio electrónico y facturación.</li>
            </ol>
          </section>

          {/* 4. Base de Legitimación */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              4. Base Jurídica que Legítima el Tratamiento
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Ejecución de un contrato / relación de servicio (Art. 6.1.b RGPD):</strong> Necesaria para la creación de cuenta, tramitación de pedidos, intermediación en la entrega y mensajería de soporte.
              </li>
              <li>
                <strong>Consentimiento explícito (Art. 6.1.a RGPD):</strong> Al registrarse, enviar mensajes a través de los formularios o aceptar la política de cookies.
              </li>
              <li>
                <strong>Cumplimiento de obligaciones legales (Art. 6.1.c RGPD):</strong> En materia fiscal, contable y de defensa de consumidores.
              </li>
            </ul>
          </section>

          {/* 5. Comunicación de Datos */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              5. ¿A quién se comunican sus datos?
            </h2>
            <p>
              <strong>Sus datos nunca se venden ni ceden a terceros con fines publicitarios.</strong> Únicamente se comunican en los siguientes supuestos estrictamente necesarios:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Entre Comprador y Vendedor:</strong> Cuando se tramita un pedido, se comparten los datos de contacto y dirección estrictamente necesarios para que el caserío prepare y entregue el pedido acordado.
              </li>
              <li>
                <strong>Proveedores Tecnológicos de Infraestructura:</strong> Entidades que prestan servicios de alojamiento de base de datos segura y autenticación (Supabase / PostgreSQL) con servidores en la Unión Europea y plenas garantías de seguridad (cifrado SSL/TLS en tránsito y en reposo).
              </li>
              <li>
                <strong>Organismos Públicos y Autoridades:</strong> Cuando exista una obligación legal aplicable.
              </li>
            </ul>
          </section>

          {/* 6. Plazo de Conservación */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900">
              6. ¿Durante cuánto tiempo conservamos sus datos?
            </h2>
            <p>
              Los datos se conservarán mientras mantenga su cuenta activa en la plataforma. Puede solicitar la baja o eliminación de su cuenta en cualquier momento. Tras la baja, los datos se mantendrán bloqueados durante los plazos legales obligatorios para la prescripción de posibles responsabilidades.
            </p>
          </section>

          {/* 7. Derechos de los Usuarios (ARCO-POL) */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              7. Sus Derechos en Protección de Datos
            </h2>
            <p>Como titular de sus datos personales, tiene derecho a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Acceso:</strong> Conocer qué datos personales tratamos sobre usted.</li>
              <li><strong>Rectificación:</strong> Modificar datos inexactos o incompletos desde su perfil.</li>
              <li><strong>Supresión ("Derecho al Olvido"):</strong> Solicitar el borrado de sus datos cuando ya no sean necesarios.</li>
              <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos en supuestos concretos.</li>
              <li><strong>Limitación del tratamiento:</strong> Solicitar que suspendamos cautelarmente el tratamiento.</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en un formato digital estructurado de uso común.</li>
            </ul>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, puede enviar una solicitud por correo electrónico a <a href="mailto:privacidad@km0caserio.eus" className="text-emerald-800 underline font-bold">privacidad@km0caserio.eus</a> indicando su nombre y el derecho que desea ejercer.
            </p>
            <p className="text-stone-500 text-xs">
              Asimismo, si considera que sus derechos no han sido debidamente atendidos, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD - <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="underline">www.aepd.es</a>).
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-stone-200 flex flex-wrap gap-4 text-xs font-bold text-emerald-800">
          <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          <Link href="/terminos" className="hover:underline">Términos y Condiciones</Link>
          <Link href="/cookies" className="hover:underline">Política de Cookies</Link>
          <Link href="/contacto" className="hover:underline">Contacto y Soporte</Link>
        </div>
      </div>
    </div>
  );
}
