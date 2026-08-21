import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  FileText,
  Cookie,
  Mail,
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t-2 border-stone-800 mt-16 pt-8 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs">
          {/* Columna 1: Plataforma */}
          <div className="space-y-2.5">
            <h4 className="font-black text-white uppercase tracking-wider text-[11px]">
              Plataforma
            </h4>
            <ul className="space-y-1.5 font-semibold text-stone-400">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Catálogo de Productos
                </Link>
              </li>
              <li>
                <Link href="/cesta" className="hover:text-emerald-400 transition-colors">
                  Cesta de la Compra
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-emerald-400 transition-colors">
                  Mensajes
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 2: Para Caseríos */}
          <div className="space-y-2.5">
            <h4 className="font-black text-white uppercase tracking-wider text-[11px]">
              Productores
            </h4>
            <ul className="space-y-1.5 font-semibold text-stone-400">
              <li>
                <Link href="/vendedor/productos/nuevo" className="hover:text-emerald-400 transition-colors">
                  Publicar Cosecha
                </Link>
              </li>
              <li>
                <Link href="/vendedor/puntos-entrega" className="hover:text-emerald-400 transition-colors">
                  Puntos de Entrega
                </Link>
              </li>
              <li>
                <Link href="/vendedor/pedidos" className="hover:text-emerald-400 transition-colors">
                  Gestión de Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div className="space-y-2.5">
            <h4 className="font-black text-white uppercase tracking-wider text-[11px]">
              Legal
            </h4>
            <ul className="space-y-1.5 font-semibold text-stone-400">
              <li>
                <Link href="/aviso-legal" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Scale className="w-3 h-3" />
                  <span>Aviso Legal</span>
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Política de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  <span>Términos y Condiciones</span>
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Cookie className="w-3 h-3" />
                  <span>Política de Cookies</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Ayuda y Contacto */}
          <div className="space-y-2.5">
            <h4 className="font-black text-white uppercase tracking-wider text-[11px]">
              Soporte
            </h4>
            <ul className="space-y-1.5 font-semibold text-stone-400">
              <li>
                <Link href="/contacto" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold text-emerald-400">
                  <Mail className="w-3 h-3" />
                  <span>Contacto y FAQ</span>
                </Link>
              </li>
              <li>
                <a href="mailto:soporte@km0caserio.eus" className="hover:text-stone-200 transition-colors block text-[11px]">
                  soporte@km0caserio.eus
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior de Copyright */}
        <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-stone-500">
          <p>
            © {currentYear} <strong>km0</strong>. Comercio de proximidad y caserío.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-stone-400 text-[11px]">
            <Link href="/aviso-legal" className="hover:text-stone-200">Aviso Legal</Link>
            <span>·</span>
            <Link href="/privacidad" className="hover:text-stone-200">Privacidad</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-stone-200">Términos</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-stone-200">Cookies</Link>
            <span>·</span>
            <Link href="/contacto" className="hover:text-stone-200">Contacto</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
