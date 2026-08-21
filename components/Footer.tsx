import Link from 'next/link';
import {
  Sprout,
  ShieldCheck,
  Mail,
  Heart,
  Scale,
  FileText,
  Cookie,
  HelpCircle,
  Store,
  ShoppingBasket,
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t-2 border-stone-800 mt-16 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Columna 1: Marca e Identidad */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2 text-white font-black text-xl tracking-tight">
              <span className="p-2 bg-emerald-800 rounded-xl text-white">
                <Sprout className="w-5 h-5" />
              </span>
              <span>km0 · Caserío y Proximidad</span>
            </Link>

            <p className="text-xs sm:text-sm text-stone-400 font-medium leading-relaxed max-w-sm">
              Plataforma digital para conectar directamente a productores locales (baserritarras) con consumidores. Alimentos frescos de temporada, sin intermediarios abusivos y con trato cercano.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-emerald-400">
              <span className="bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                🌱 Soberanía Alimentaria
              </span>
              <span className="bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                🚜 Comercio Justo Directo
              </span>
            </div>
          </div>

          {/* Columna 2: Plataforma */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-stone-400">
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
                  Mensajes y Chat Directo
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-400 transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-400 transition-colors">
                  Crear Cuenta
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Para Caseríos */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Para Productores
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-stone-400">
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
                <Link href="/vendedor/calendario" className="hover:text-emerald-400 transition-colors">
                  Calendario de Entregas
                </Link>
              </li>
              <li>
                <Link href="/vendedor/pedidos" className="hover:text-emerald-400 transition-colors">
                  Validación de Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Legal & Ayuda */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Legal y Soporte
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-stone-400">
              <li>
                <Link href="/aviso-legal" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>Aviso Legal</span>
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Política de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Términos y Condiciones</span>
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Cookie className="w-3.5 h-3.5" />
                  <span>Política de Cookies</span>
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contacto y FAQ</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra Inferior de Copyright */}
        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-stone-500">
          <p>
            © {currentYear} <strong>km0</strong>. Comercio de proximidad y producto local de caserío.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-stone-400 text-[11px]">
            <Link href="/aviso-legal" className="hover:text-stone-200">Aviso Legal</Link>
            <span>·</span>
            <Link href="/privacidad" className="hover:text-stone-200">Privacidad</Link>
            <span>·</span>
            <Link href="/terminos" className="hover:text-stone-200">Términos</Link>
            <span>·</span>
            <Link href="/cookies" className="hover:text-stone-200">Cookies</Link>
            <span>·</span>
            <Link href="/contacto" className="hover:text-stone-200">Ayuda</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
