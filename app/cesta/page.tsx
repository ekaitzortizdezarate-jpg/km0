'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBasket,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Truck,
  Store,
  MapPin,
  Clock,
  CheckCircle2,
  LogIn,
  UserPlus,
  Layers,
  Bookmark,
  X,
  AlertCircle,
  Split,
  Merge,
} from 'lucide-react';
import { useCart, CartItem } from '@/context/CartContext';
import { createCartOrders, CartCheckoutSellerGroup } from '@/app/actions/orders';
import { createClient } from '@/lib/supabase/client';
import { saveBuyerAddresses } from '@/app/actions/profile';
import { DeliveryMethodsBadges } from '@/components/DeliveryMethodsBadges';
import type { DeliveryPoint } from '@/types/database';
import {
  getCaserioEstimate,
  getPuntoEntregaEstimate,
  getDomicilioEstimate,
} from '@/lib/delivery';

export interface SellerShippingDetails {
  nombre: string;
  apellidos: string;
  calle: string;
  numero: string;
  piso: string;
  puerta: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  telefono: string;
  instrucciones: string;
}

interface SavedAddress {
  id: string;
  label: string;
  nombre: string;
  apellidos: string;
  calle: string;
  numero: string;
  piso: string;
  puerta: string;
  codigoPostal: string;
  poblacion: string;
  provincia: string;
  telefono: string;
  instrucciones: string;
  address: string;
}

function normalizeDeliveryType(type?: string | null): 'caserio' | 'sitio_fisico' | 'envio' {
  if (type === 'punto_entrega' || type === 'sitio_fisico') return 'sitio_fisico';
  if (type === 'domicilio' || type === 'envio') return 'envio';
  return 'caserio';
}

function getNormalizedMethods(methods?: string[] | null): ('caserio' | 'sitio_fisico' | 'envio')[] {
  if (!methods || methods.length === 0) return ['caserio'];
  const res = new Set<'caserio' | 'sitio_fisico' | 'envio'>();
  methods.forEach((m) => {
    if (m === 'caserio') res.add('caserio');
    if (m === 'punto_entrega' || m === 'sitio_fisico') res.add('sitio_fisico');
    if (m === 'domicilio' || m === 'envio') res.add('envio');
  });
  if (res.size === 0) res.add('caserio');
  return Array.from(res);
}

function getCommonDeliveryMethods(items: CartItem[]): ('caserio' | 'sitio_fisico' | 'envio')[] {
  if (items.length === 0) return ['caserio'];
  let common = new Set<'caserio' | 'sitio_fisico' | 'envio'>(getNormalizedMethods(items[0].deliveryMethods));
  for (let i = 1; i < items.length; i++) {
    const itemMethods = new Set(getNormalizedMethods(items[i].deliveryMethods));
    common = new Set(Array.from(common).filter((m) => itemMethods.has(m)));
  }
  return Array.from(common);
}

function formatFullAddress(details: SellerShippingDetails): string {
  const parts: string[] = [];
  const fullName = [details.nombre.trim(), details.apellidos.trim()].filter(Boolean).join(' ');
  if (fullName) {
    const phonePart = details.telefono.trim() ? ` (${details.telefono.trim()})` : '';
    parts.push(`Para: ${fullName}${phonePart}`);
  }
  const streetPart = [
    details.calle.trim(),
    details.numero.trim() ? `Nº ${details.numero.trim()}` : '',
    details.piso.trim() ? `Piso ${details.piso.trim()}` : '',
    details.puerta.trim() ? `Pta ${details.puerta.trim()}` : '',
  ].filter(Boolean).join(' ');
  if (streetPart) {
    parts.push(streetPart);
  }
  const locPart = [
    details.codigoPostal.trim(),
    details.poblacion.trim(),
    details.provincia.trim() ? `(${details.provincia.trim()})` : '',
  ].filter(Boolean).join(' ');
  if (locPart) {
    parts.push(locPart);
  }
  if (details.instrucciones?.trim()) {
    parts.push(`[Notas: ${details.instrucciones.trim()}]`);
  }
  return parts.join(' - ');
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, removeSellerItems, totalPrice } = useCart();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Puntos de entrega por caserío
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<
    Record<string, DeliveryPoint[]>
  >({});

  // 1. Configuración de unificación de modalidad de entrega por vendedor: 'separadas' (default) o 'unificado'
  const [deliveryUnifyModes, setDeliveryUnifyModes] = useState<
    Record<string, 'separadas' | 'unificado'>
  >({});

  // Modalidad elegida cuando se unifica (ej. 'caserio', 'sitio_fisico', 'envio')
  const [unifiedDeliveryTypes, setUnifiedDeliveryTypes] = useState<
    Record<string, 'caserio' | 'sitio_fisico' | 'envio'>
  >({});

  // 2. Configuración de plazos de entrega por vendedor: 'individual' (entregas separadas, default) o 'junto_tardio'
  const [dateGroupModes, setDateGroupModes] = useState<
    Record<string, 'individual' | 'junto_tardio'>
  >({});

  // Puntos de entrega seleccionados (por vendedor o por sub-bloque)
  const [selectedPoints, setSelectedPoints] = useState<Record<string, string>>({});

  // Formulario estructurado de envío a domicilio por cada vendedor
  const [shippingForms, setShippingForms] = useState<
    Record<string, SellerShippingDetails>
  >({});

  const [defaultShippingDetails, setDefaultShippingDetails] = useState<SellerShippingDetails>({
    nombre: '',
    apellidos: '',
    calle: '',
    numero: '',
    piso: '',
    puerta: '',
    codigoPostal: '',
    poblacion: '',
    provincia: '',
    telefono: '',
    instrucciones: '',
  });

  // Direcciones guardadas del comprador (hasta 5)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddressLabel, setNewAddressLabel] = useState('Casa');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderMsg, setSuccessOrderMsg] = useState<string | null>(null);

  // Modal de resumen individual por vendedor
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeCheckoutSellerId, setActiveCheckoutSellerId] = useState<string | null>(null);

  const supabase = createClient();

  // Cargar usuario y direcciones guardadas
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, address, town, postal_code, saved_addresses')
          .eq('id', user.id)
          .single();

        if (profile) {
          const names = (profile.full_name || '').trim().split(' ');
          const fName = names[0] || '';
          const lName = names.slice(1).join(' ') || '';

          const userDefaults: SellerShippingDetails = {
            nombre: fName,
            apellidos: lName,
            calle: profile.address || '',
            numero: '',
            piso: '',
            puerta: '',
            codigoPostal: profile.postal_code || '',
            poblacion: profile.town || '',
            provincia: '',
            telefono: profile.phone || '',
            instrucciones: '',
          };
          setDefaultShippingDetails(userDefaults);

          let list: SavedAddress[] = [];
          if (Array.isArray(profile.saved_addresses) && profile.saved_addresses.length > 0) {
            list = profile.saved_addresses.map((a: any, idx: number) => ({
              id: a.id || String(idx),
              label: a.label || 'Favorita',
              nombre: a.nombre || userDefaults.nombre,
              apellidos: a.apellidos || userDefaults.apellidos,
              calle: a.calle || a.street || a.address || '',
              numero: a.numero || '',
              piso: a.piso || '',
              puerta: a.puerta || '',
              codigoPostal: a.codigoPostal || a.postalCode || a.postal_code || '',
              poblacion: a.poblacion || a.town || '',
              provincia: a.provincia || '',
              telefono: a.telefono || userDefaults.telefono,
              instrucciones: a.instrucciones || '',
              address: a.address || '',
            }));
          }

          if (list.length === 0 && profile.address) {
            list = [
              {
                id: 'default-profile-addr',
                label: 'Principal',
                nombre: userDefaults.nombre,
                apellidos: userDefaults.apellidos,
                calle: profile.address,
                numero: '',
                piso: '',
                puerta: '',
                codigoPostal: profile.postal_code || '',
                poblacion: profile.town || '',
                provincia: '',
                telefono: profile.phone || '',
                instrucciones: '',
                address: profile.address,
              },
            ];
          }

          setSavedAddresses(list);
        }
      }
    }
    loadUser();
  }, [supabase]);

  // Validar que los productos de la cesta sigan existiendo en la base de datos (si el vendedor los borró, se quitan)
  useEffect(() => {
    async function validateCartProducts() {
      if (items.length === 0) return;
      const productIds = Array.from(new Set(items.map((i) => i.productId)));
      const { data: existingProds } = await supabase
        .from('products')
        .select('id')
        .in('id', productIds);

      const existingIds = new Set((existingProds || []).map((p: any) => p.id));
      const itemsToRemove = items.filter((item) => !existingIds.has(item.productId));
      if (itemsToRemove.length > 0) {
        itemsToRemove.forEach((it) => {
          const itemKey =
            it.cartItemId ||
            `${it.productId}_${it.selectedDeliveryType || 'caserio'}_${it.selectedPointId || 'none'}`;
          removeFromCart(itemKey);
        });
      }
    }
    validateCartProducts();
  }, [items.length, supabase]);

  // Agrupar productos por Caserío / Vendedor
  const groupedBySeller = items.reduce(
    (acc, item) => {
      if (!acc[item.sellerId]) {
        acc[item.sellerId] = {
          sellerName: item.sellerName,
          sellerTown: item.sellerTown,
          sellerAvatarUrl: item.sellerAvatarUrl || null,
          items: [],
        };
      }
      acc[item.sellerId].items.push(item);
      return acc;
    },
    {} as Record<
      string,
      { sellerName: string; sellerTown: string; sellerAvatarUrl?: string | null; items: CartItem[] }
    >
  );

  const sellerIds = Object.keys(groupedBySeller);

  // Cargar puntos de entrega físicos para cada vendedor
  useEffect(() => {
    async function fetchPoints() {
      if (sellerIds.length === 0) return;

      const { data } = await supabase
        .from('delivery_points')
        .select('*')
        .in('seller_id', sellerIds)
        .eq('is_active', true);

      if (data) {
        const map: Record<string, DeliveryPoint[]> = {};
        for (const pt of data) {
          if (!map[pt.seller_id]) map[pt.seller_id] = [];
          map[pt.seller_id].push(pt);
        }
        setSellerDeliveryPoints(map);
      }
    }

    fetchPoints();
  }, [sellerIds.join(','), supabase]);

  const handleShippingFieldChange = (
    sellerId: string,
    field: keyof SellerShippingDetails,
    value: string
  ) => {
    const current = shippingForms[sellerId] || { ...defaultShippingDetails };
    const updated = {
      ...current,
      [field]: value,
    };
    setShippingForms((prev) => ({
      ...prev,
      [sellerId]: updated,
    }));
  };

  const handleApplySavedAddress = (sellerId: string, sa: SavedAddress) => {
    const applied: SellerShippingDetails = {
      nombre: sa.nombre || defaultShippingDetails.nombre,
      apellidos: sa.apellidos || defaultShippingDetails.apellidos,
      calle: sa.calle || sa.address,
      numero: sa.numero || '',
      piso: sa.piso || '',
      puerta: sa.puerta || '',
      codigoPostal: sa.codigoPostal || '',
      poblacion: sa.poblacion || '',
      provincia: sa.provincia || '',
      telefono: sa.telefono || defaultShippingDetails.telefono,
      instrucciones: sa.instrucciones || '',
    };
    setShippingForms((prev) => ({
      ...prev,
      [sellerId]: applied,
    }));
  };

  const handleSaveFavoriteAddress = async (sellerId: string) => {
    const current = shippingForms[sellerId] || defaultShippingDetails;
    if (!current.calle.trim()) {
      alert('Debes indicar al menos la calle para guardarla como dirección favorita.');
      return;
    }

    const newSaved: SavedAddress = {
      id: String(Date.now()),
      label: newAddressLabel.trim() || 'Favorita',
      nombre: current.nombre,
      apellidos: current.apellidos,
      calle: current.calle,
      numero: current.numero,
      piso: current.piso,
      puerta: current.puerta,
      codigoPostal: current.codigoPostal,
      poblacion: current.poblacion,
      provincia: current.provincia,
      telefono: current.telefono,
      instrucciones: current.instrucciones,
      address: formatFullAddress(current),
    };

    const updated = [newSaved, ...savedAddresses.slice(0, 4)];
    setSavedAddresses(updated);
    await saveBuyerAddresses(updated);
    setNewAddressLabel('Casa');
  };

  // Abrir resumen para UN VENDEDOR específico
  const handleOpenSellerSummary = (sellerId: string) => {
    setError(null);
    setSuccessOrderMsg(null);
    const group = groupedBySeller[sellerId];
    if (!group) return;

    const unifyMode = deliveryUnifyModes[sellerId] || 'separadas';
    const distinctTypes = Array.from(
      new Set(group.items.map((i) => normalizeDeliveryType(i.selectedDeliveryType)))
    );
    const hasMultipleTypes = distinctTypes.length > 1;

    // Si es unificado a 'envio' o si hay entregas separadas con algún sub-bloque de 'envio'
    const needsShippingCheck =
      (hasMultipleTypes && unifyMode === 'unificado' && (unifiedDeliveryTypes[sellerId] || 'caserio') === 'envio') ||
      (!hasMultipleTypes && distinctTypes[0] === 'envio') ||
      (hasMultipleTypes && unifyMode === 'separadas' && distinctTypes.includes('envio'));

    if (needsShippingCheck) {
      const details = shippingForms[sellerId] || defaultShippingDetails;
      if (
        !details.nombre?.trim() ||
        !details.apellidos?.trim() ||
        !details.calle?.trim() ||
        !details.numero?.trim() ||
        !details.codigoPostal?.trim() ||
        !details.poblacion?.trim() ||
        !details.provincia?.trim()
      ) {
        setError(
          `Por favor, completa los campos obligatorios de envío a domicilio (Nombre, Apellidos, Calle, Número, Código Postal, Población y Provincia) para el caserío ${group.sellerName}.`
        );
        return;
      }
    }

    setActiveCheckoutSellerId(sellerId);
    setShowSummaryModal(true);
  };

  // Confirmar y procesar el pedido para UN VENDEDOR específico
  const handleConfirmAndCheckoutSeller = async (sellerId: string) => {
    setError(null);
    setLoading(true);

    const group = groupedBySeller[sellerId];
    if (!group) {
      setLoading(false);
      return;
    }

    const unifyMode = deliveryUnifyModes[sellerId] || 'separadas';
    const dateMode = dateGroupModes[sellerId] || 'individual';
    const distinctTypes = Array.from(
      new Set(group.items.map((i) => normalizeDeliveryType(i.selectedDeliveryType)))
    );
    const hasMultipleTypes = distinctTypes.length > 1;
    const physicalPoints = (sellerDeliveryPoints[sellerId] || []).filter((p) => p.type === 'sitio_fisico');

    const details = shippingForms[sellerId] || defaultShippingDetails;
    const computedShippingAddress = formatFullAddress(details) || savedAddresses[0]?.address || 'Dirección de entrega';

    const payloads: CartCheckoutSellerGroup[] = [];

    // Fechas unificadas si se seleccionó 'junto_tardio'
    const allDatesMs = group.items
      .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
      .filter((t) => t > 0);
    const maxAllDateMs = allDatesMs.length > 0 ? Math.max(...allDatesMs) : 0;
    const globalUnifiedDateStr = maxAllDateMs > 0 ? new Date(maxAllDateMs).toISOString() : null;

    if (hasMultipleTypes && unifyMode === 'unificado') {
      // 1 solo pedido con la modalidad unificada
      const uType = unifiedDeliveryTypes[sellerId] || 'caserio';
      const pointId = selectedPoints[sellerId] || physicalPoints[0]?.id || null;

      payloads.push({
        sellerId,
        deliveryType: uType,
        deliveryPointId: uType === 'sitio_fisico' ? pointId : null,
        shippingAddress: uType === 'envio' ? computedShippingAddress : null,
        estimatedDeliveryDate: dateMode === 'junto_tardio' ? globalUnifiedDateStr : null,
        items: group.items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity) || 1,
          unitPrice: it.unitPrice,
        })),
      });
    } else {
      // Entregas separadas: creamos 1 sub-pedido por cada modalidad de entrega distinta
      for (const dType of distinctTypes) {
        const subItems = group.items.filter(
          (it) => normalizeDeliveryType(it.selectedDeliveryType) === dType
        );
        if (subItems.length === 0) continue;

        const subDatesMs = subItems
          .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
          .filter((t) => t > 0);
        const maxSubDateMs = subDatesMs.length > 0 ? Math.max(...subDatesMs) : 0;
        const subDateStr =
          dateMode === 'junto_tardio'
            ? globalUnifiedDateStr
            : maxSubDateMs > 0
            ? new Date(maxSubDateMs).toISOString()
            : null;

        const pointId =
          selectedPoints[`${sellerId}_${dType}`] ||
          selectedPoints[sellerId] ||
          subItems[0]?.selectedPointId ||
          physicalPoints[0]?.id ||
          null;

        payloads.push({
          sellerId,
          deliveryType: dType,
          deliveryPointId: dType === 'sitio_fisico' ? pointId : null,
          shippingAddress: dType === 'envio' ? computedShippingAddress : null,
          estimatedDeliveryDate: subDateStr,
          items: subItems.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity) || 1,
            unitPrice: it.unitPrice,
          })),
        });
      }
    }

    const result = await createCartOrders(payloads);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      setShowSummaryModal(false);
    } else {
      removeSellerItems(sellerId);
      setShowSummaryModal(false);
      setLoading(false);

      const remainingSellers = sellerIds.filter((id) => id !== sellerId);
      if (remainingSellers.length === 0) {
        router.push('/comprador/pedidos');
      } else {
        setSuccessOrderMsg(
          `¡Pedido confirmado y enviado con éxito al caserío ${group.sellerName}! Puedes seguir tramitando los pedidos del resto de caseríos.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  if (!authLoading && !currentUser) {
    return (
      <div className="max-w-md mx-auto pt-2 sm:pt-4 pb-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBasket className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900">
            Inicia sesión para ver tu cesta o regístrate
          </h1>
          <p className="text-sm font-semibold text-stone-600 max-w-md mx-auto mt-2">
            Para realizar tus pedidos directos a los caseríos y coordinar la entrega con los baserritarras necesitas una cuenta en km0.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-black text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm"
          >
            <LogIn className="w-4 h-4" /> Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Registrarse Gratis
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-5">
        <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBasket className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-stone-900">Tu Cesta está vacía</h1>
          <p className="text-sm font-semibold text-stone-500 mt-1">
            Explora el mercado de caseríos locales y añade productos frescos a tu cesta.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md"
        >
          Explorar Mercado
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900">Cesta de Compra</h1>
        <p className="text-xs font-semibold text-stone-500 mt-1">
          Tus productos se gestionan agrupados por caserío productor para coordinar la entrega directa.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-900 border-2 border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {successOrderMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border-2 border-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{successOrderMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Pedidos agrupados por Caserío */}
        <div className="lg:col-span-8 space-y-6">
          {sellerIds.map((sellerId) => {
            const group = groupedBySeller[sellerId];
            const physicalPoints = (sellerDeliveryPoints[sellerId] || []).filter(
              (p) => p.type === 'sitio_fisico'
            );

            // 1. Detección de modalidades de entrega distintas
            const distinctTypes = Array.from(
              new Set(group.items.map((i) => normalizeDeliveryType(i.selectedDeliveryType)))
            );
            const hasMultipleDeliveryTypes = distinctTypes.length > 1;

            // Modalidades comunes compartidas por todos los productos de este caserío
            const commonMethods = getCommonDeliveryMethods(group.items);
            const hasCommonMethods = commonMethods.length > 0;

            // Estado de unificación de modalidad (por defecto: 'separadas')
            const unifyDeliveryMode = deliveryUnifyModes[sellerId] || 'separadas';
            const unifiedType = unifiedDeliveryTypes[sellerId] || commonMethods[0] || 'caserio';

            // 2. Detección de fechas de entrega distintas
            const datesMs = group.items
              .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
              .filter((t) => t > 0);
            const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
            const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;

            const datesSet = new Set(
              group.items.map((i) => i.estimatedDeliveryDate || i.deliveryBadge).filter(Boolean)
            );
            const hasMultipleDates = datesSet.size > 1;

            // Estado de agrupación de fechas (por defecto: 'individual' -> entregas separadas)
            const dateGroupMode = dateGroupModes[sellerId] || 'individual';

            const currentDetails = shippingForms[sellerId] || defaultShippingDetails;

            return (
              <div
                key={sellerId}
                className="bg-white rounded-3xl border-2 border-stone-200 p-5 sm:p-6 space-y-5 shadow-sm"
              >
                {/* Cabecera del Caserío: Chat arriba a la derecha, en el centro: nombre, debajo apellido, debajo población */}
                {(() => {
                  const nameParts = (group.sellerName || '').trim().split(' ');
                  const firstName = nameParts[0] || group.sellerName || 'Caserío';
                  const lastName = nameParts.slice(1).join(' ');

                  return (
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {group.sellerAvatarUrl ? (
                          <img
                            src={group.sellerAvatarUrl}
                            alt={group.sellerName}
                            className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-black text-sm border border-emerald-200 shrink-0 shadow-sm">
                            {group.sellerName?.charAt(0) || 'C'}
                          </div>
                        )}

                        <div className="flex flex-col justify-center leading-tight min-w-0">
                          <span className="text-sm font-black text-stone-900 truncate">
                            {firstName}
                          </span>
                          {lastName ? (
                            <span className="text-xs font-bold text-stone-700 truncate">
                              {lastName}
                            </span>
                          ) : null}
                          <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0 text-emerald-700" />
                            <span>{group.sellerTown}</span>
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/chat/${sellerId}`}
                        title="Chatear con el caserío"
                        className="h-12 w-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-900 flex flex-col items-center justify-center gap-0.5 border border-stone-200 transition-colors shrink-0 shadow-sm"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-[9px] font-black uppercase leading-none">Chat</span>
                      </Link>
                    </div>
                  );
                })()}

                {/* BANNER 1: MODALIDADES DE ENTREGA DISTINTAS (Opciones de Unificar o Entregas Separadas) */}
                {hasMultipleDeliveryTypes && (
                  <div className="p-4 bg-sky-50/90 rounded-2xl border-2 border-sky-200 space-y-3">
                    <div className="flex items-start gap-2">
                      <Split className="w-4 h-4 text-sky-800 shrink-0 mt-0.5" />
                      <div>
                        <label className="text-xs font-black text-sky-950 block">
                          Tus productos de este caserío tienen modalidades de entrega distintas:
                        </label>
                        <p className="text-[11px] font-semibold text-sky-800">
                          Aparecen separados por modalidad. Puedes mantenerlos separados o unificarlos si comparten alguna modalidad en común.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {/* Opción A: Entregas separadas (POR DEFECTO) */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveryUnifyModes((prev) => ({ ...prev, [sellerId]: 'separadas' }))
                        }
                        className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${
                          unifyDeliveryMode === 'separadas'
                            ? 'border-sky-700 bg-white ring-2 ring-sky-600 text-sky-950 font-black shadow-sm'
                            : 'border-sky-200 bg-white/70 text-sky-800 hover:bg-white font-bold'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="block font-black">📦 Entregas separadas por modalidad</span>
                          {unifyDeliveryMode === 'separadas' && (
                            <span className="text-[9px] font-black bg-sky-100 text-sky-900 px-1.5 py-0.5 rounded">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-sky-700 block mt-0.5">
                          Cada producto se entrega según la opción elegida al añadir a la cesta.
                        </span>
                      </button>

                      {/* Opción B: Unificar modalidad de entrega */}
                      {hasCommonMethods ? (
                        <button
                          type="button"
                          onClick={() =>
                            setDeliveryUnifyModes((prev) => ({ ...prev, [sellerId]: 'unificado' }))
                          }
                          className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${
                            unifyDeliveryMode === 'unificado'
                              ? 'border-sky-700 bg-white ring-2 ring-sky-600 text-sky-950 font-black shadow-sm'
                              : 'border-sky-200 bg-white/70 text-sky-800 hover:bg-white font-bold'
                          }`}
                        >
                          <span className="block font-black">🔄 Unificar modalidad de entrega</span>
                          <span className="text-[10px] font-semibold text-sky-700 block mt-0.5">
                            Unificar todos los productos en una modalidad común compartida.
                          </span>
                        </button>
                      ) : (
                        <div className="p-3 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-[11px] font-semibold flex items-center">
                          <span>Sin modalidad común disponible para unificar.</span>
                        </div>
                      )}
                    </div>

                    {/* Si seleccionó Unificar y hay más de 1 modalidad común, selector para elegir cuál */}
                    {unifyDeliveryMode === 'unificado' && hasCommonMethods && (
                      <div className="p-3 bg-white rounded-xl border border-sky-300 space-y-2">
                        <label className="block text-[11px] font-black text-stone-800">
                          Selecciona la modalidad común para unificar todos los productos:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {commonMethods.map((method) => {
                            const isSelected = unifiedType === method;
                            return (
                              <button
                                key={method}
                                type="button"
                                onClick={() =>
                                  setUnifiedDeliveryTypes((prev) => ({
                                    ...prev,
                                    [sellerId]: method,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-sky-800 text-white border-sky-900 shadow-sm'
                                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                                }`}
                              >
                                {method === 'caserio' && <Store className="w-3.5 h-3.5" />}
                                {method === 'sitio_fisico' && <MapPin className="w-3.5 h-3.5" />}
                                {method === 'envio' && <Truck className="w-3.5 h-3.5" />}
                                <span>
                                  {method === 'caserio'
                                    ? 'Recogida en Caserío'
                                    : method === 'sitio_fisico'
                                    ? 'Punto de Entrega'
                                    : 'Envío a Domicilio'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BANNER 2: PLAZOS DE ENTREGA DISTINTOS (Solo se muestra cuando comparten la misma modalidad de entrega o están unificados) */}
                {(!hasMultipleDeliveryTypes || unifyDeliveryMode === 'unificado') && hasMultipleDates && (
                  <div className="p-4 bg-amber-50/90 rounded-2xl border-2 border-amber-200 space-y-3">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-700" />
                      Tus productos de este caserío tienen plazos de entrega distintos:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Opción 1: Entregas separadas (POR DEFECTO) */}
                      <button
                        type="button"
                        onClick={() =>
                          setDateGroupModes((prev) => ({ ...prev, [sellerId]: 'individual' }))
                        }
                        className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${
                          dateGroupMode === 'individual'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/70 text-amber-800 hover:bg-white font-bold'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="block font-black">🚚 Entregas separadas por fecha</span>
                          {dateGroupMode === 'individual' && (
                            <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-700 block mt-0.5">
                          Según disponibilidad y fecha prevista de cada producto.
                        </span>
                      </button>

                      {/* Opción 2: Entregar todo junto */}
                      <button
                        type="button"
                        onClick={() =>
                          setDateGroupModes((prev) => ({ ...prev, [sellerId]: 'junto_tardio' }))
                        }
                        className={`p-3 rounded-xl border-2 text-left text-xs transition-all ${
                          dateGroupMode === 'junto_tardio'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/70 text-amber-800 hover:bg-white font-bold'
                        }`}
                      >
                        <span className="block font-black">📦 Entregar todo junto</span>
                        <span className="text-[10px] font-semibold text-amber-700 block mt-0.5">
                          {unifiedDateObj
                            ? `Fecha calculada: ${unifiedDateObj.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}`
                            : 'En la fecha del producto más tardío'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* RENDERIZADO DE PRODUCTOS Y SECCIONES */}
                {(() => {
                  // Si tiene modalidades distintas y están separadas (o si solo tiene 1 modalidad)
                  const isSeparatedView = hasMultipleDeliveryTypes && unifyDeliveryMode === 'separadas';

                  const renderProductRow = (item: CartItem) => {
                    const itemKey =
                      item.cartItemId ||
                      `${item.productId}_${item.selectedDeliveryType || 'caserio'}_${item.selectedPointId || 'none'}`;

                    const displayDeliveryDate =
                      dateGroupMode === 'junto_tardio' && unifiedDateObj
                        ? unifiedDateObj.toISOString()
                        : item.estimatedDeliveryDate;

                    return (
                      <div
                        key={itemKey}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-white text-emerald-800 flex items-center justify-center border border-stone-200 shrink-0 font-black text-xs">
                              km0
                            </div>
                          )}

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-xs font-black text-stone-900 leading-tight truncate">
                                {item.name}
                              </h3>
                              <DeliveryMethodsBadges deliveryMethods={item.deliveryMethods} />
                            </div>
                            <p className="text-[11px] font-semibold text-stone-600">
                              {item.unitPrice.toFixed(2)} € /{' '}
                              {item.format === 'granel'
                                ? 'kg'
                                : item.format === 'suelto' && item.weightKg
                                ? `${item.weightKg}kg`
                                : 'ud'}
                            </p>

                            {/* Modalidad de Entrega */}
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-white text-stone-800 border-stone-300">
                              {item.selectedDeliveryType === 'caserio' ? (
                                <>
                                  <Store className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Recogida en Caserío</span>
                                </>
                              ) : item.selectedDeliveryType === 'punto_entrega' ? (
                                <>
                                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Punto de Entrega: {item.selectedPointName || 'Punto acordado'}</span>
                                </>
                              ) : (
                                <>
                                  <Truck className="w-3 h-3 text-emerald-700 shrink-0" />
                                  <span>Envío a Domicilio</span>
                                </>
                              )}
                            </div>

                            {/* Fecha de Entrega */}
                            {displayDeliveryDate ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>
                                  Fecha estimada de entrega:{' '}
                                  {new Date(displayDeliveryDate).toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                  {dateGroupMode === 'junto_tardio' && hasMultipleDates ? ' (unificada)' : ''}
                                </span>
                              </div>
                            ) : item.deliveryBadge ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Fecha estimada: {item.deliveryBadge}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Controles de Cantidad y Subtotal */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-300">
                            <button
                              type="button"
                              onClick={() => {
                                const step = item.format === 'granel' ? 0.5 : 1;
                                const nextQty = Math.max(step, item.quantity - step);
                                updateQuantity(itemKey, nextQty);
                              }}
                              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 flex items-center justify-center font-black"
                              aria-label="Disminuir"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-xs font-black text-stone-900 px-2 min-w-[36px] text-center">
                              {item.quantity}{' '}
                              <span className="text-[10px] font-semibold text-stone-600">
                                {item.format === 'granel' ? 'kg' : 'uds'}
                              </span>
                            </span>

                            <button
                              type="button"
                              disabled={!item.isUnlimitedStock && item.stock !== undefined && item.quantity >= item.stock}
                              onClick={() => {
                                const step = item.format === 'granel' ? 0.5 : 1;
                                const maxStock = item.isUnlimitedStock ? 9999 : item.stock ?? 9999;
                                if (item.quantity < maxStock) {
                                  updateQuantity(itemKey, item.quantity + step);
                                }
                              }}
                              className="w-7 h-7 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white flex items-center justify-center font-black"
                              aria-label="Aumentar"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <span className="text-sm font-black text-stone-900 block">
                              {(item.unitPrice * item.quantity).toFixed(2)} €
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(itemKey)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Quitar producto de la cesta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  };

                  const renderDeliveryConfigBox = (
                    dType: 'caserio' | 'sitio_fisico' | 'envio',
                    subKey?: string
                  ) => {
                    const firstItem = group.items[0];
                    const caserioEst = getCaserioEstimate(firstItem);
                    const ptKey = subKey || sellerId;
                    const selectedPt =
                      physicalPoints.find((p) => p.id === selectedPoints[ptKey]) || physicalPoints[0];
                    const puntoEst = getPuntoEntregaEstimate(firstItem, selectedPt);

                    if (dType === 'caserio') {
                      return (
                        <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-stone-800 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                              <Store className="w-4 h-4 text-emerald-800" />
                              <span>Recogida directa en Caserío</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-800 capitalize">
                              📅 {caserioEst.dateStr}
                            </span>
                          </div>
                          <p className="text-stone-700 font-semibold text-[11px]">
                            🏡 Instalaciones del caserío en {group.sellerTown}.
                          </p>
                          {firstItem?.caserioSchedule && (
                            <p className="text-emerald-950 font-bold text-[10px]">
                              🕒 Horario habitual: {firstItem.caserioSchedule}
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (dType === 'sitio_fisico') {
                      return (
                        <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 text-xs text-stone-800 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                              <MapPin className="w-4 h-4 text-emerald-800" />
                              <span>Punto de Entrega físico</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-800 capitalize">
                              📅 {puntoEst.dateStr}
                            </span>
                          </div>

                          {physicalPoints.length > 1 ? (
                            <div className="pt-1">
                              <label className="block text-[10px] font-bold text-stone-700 mb-1">
                                Selecciona el punto de entrega:
                              </label>
                              <select
                                value={selectedPoints[ptKey] || physicalPoints[0]?.id}
                                onChange={(e) =>
                                  setSelectedPoints((prev) => ({
                                    ...prev,
                                    [ptKey]: e.target.value,
                                  }))
                                }
                                className="w-full px-3 py-1.5 border border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                              >
                                {physicalPoints.map((pt) => (
                                  <option key={pt.id} value={pt.id}>
                                    {pt.name} - {pt.town} ({pt.address_details})
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : physicalPoints.length === 1 ? (
                            <div className="flex items-start gap-2.5 pt-1 text-[11px] text-stone-700">
                              {physicalPoints[0].image_url ? (
                                <img
                                  src={physicalPoints[0].image_url}
                                  alt={physicalPoints[0].name}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : null}
                              <div className="space-y-0.5">
                                <p className="font-bold text-stone-900">
                                  {physicalPoints[0].name} ({physicalPoints[0].town})
                                </p>
                                <p>{physicalPoints[0].address_details}</p>
                                {physicalPoints[0].schedule_notes && (
                                  <p className="text-[10px] text-amber-900 font-bold">
                                    🕒 {physicalPoints[0].schedule_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-stone-600">
                              Punto físico acordado con el caserío ({group.sellerTown}).
                            </p>
                          )}
                        </div>
                      );
                    }

                    if (dType === 'envio') {
                      return (
                        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 font-black text-emerald-950 text-xs">
                              <Truck className="w-4 h-4 text-emerald-800" />
                              <span>Datos de Envío a Domicilio</span>
                            </span>
                          </div>

                          {/* Direcciones Guardadas */}
                          {savedAddresses.length > 0 && (
                            <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                              <span className="text-[10px] font-black text-stone-700 uppercase block">
                                Usar una de tus direcciones guardadas:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {savedAddresses.map((sa) => {
                                  const isSelected =
                                    currentDetails.calle === (sa.calle || sa.address) &&
                                    currentDetails.numero === sa.numero;
                                  return (
                                    <button
                                      key={sa.id}
                                      type="button"
                                      onClick={() => handleApplySavedAddress(sellerId, sa)}
                                      className={`p-2 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                                        isSelected
                                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                                      }`}
                                    >
                                      <span className="font-black flex items-center gap-1">
                                        <span>🏠 {sa.label}</span>
                                        {isSelected && (
                                          <span className="text-[10px] ml-auto bg-white/20 px-1.5 py-0.5 rounded font-bold">
                                            Activa
                                          </span>
                                        )}
                                      </span>
                                      <span
                                        className={`text-[11px] truncate ${
                                          isSelected ? 'text-emerald-100' : 'text-stone-600'
                                        }`}
                                      >
                                        {sa.calle || sa.address} {sa.poblacion ? `(${sa.poblacion})` : ''}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Formulario de campos */}
                          <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-3 shadow-2xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Nombre *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.nombre}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'nombre', e.target.value)
                                  }
                                  placeholder="Ej. Ane"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Apellidos *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.apellidos}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'apellidos', e.target.value)
                                  }
                                  placeholder="Ej. Goikoetxea"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                              <div className="sm:col-span-6">
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Calle / Avenida *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.calle}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'calle', e.target.value)
                                  }
                                  placeholder="Ej. Gran Vía"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Nº *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.numero}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'numero', e.target.value)
                                  }
                                  placeholder="14"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Piso
                                </label>
                                <input
                                  type="text"
                                  value={currentDetails.piso}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'piso', e.target.value)
                                  }
                                  placeholder="3º"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Puerta
                                </label>
                                <input
                                  type="text"
                                  value={currentDetails.puerta}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'puerta', e.target.value)
                                  }
                                  placeholder="B"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Código Postal *
                                </label>
                                <input
                                  type="text"
                                  required
                                  maxLength={5}
                                  value={currentDetails.codigoPostal}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'codigoPostal', e.target.value)
                                  }
                                  placeholder="48001"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Población *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.poblacion}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'poblacion', e.target.value)
                                  }
                                  placeholder="Bilbao"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Provincia *
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={currentDetails.provincia}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'provincia', e.target.value)
                                  }
                                  placeholder="Bizkaia"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Teléfono
                                </label>
                                <input
                                  type="tel"
                                  value={currentDetails.telefono}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'telefono', e.target.value)
                                  }
                                  placeholder="600 123 456"
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                  Instrucciones (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={currentDetails.instrucciones}
                                  onChange={(e) =>
                                    handleShippingFieldChange(sellerId, 'instrucciones', e.target.value)
                                  }
                                  placeholder="Dejar en portería..."
                                  className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-stone-700">Guardar como favorita:</span>
                                <input
                                  type="text"
                                  value={newAddressLabel}
                                  onChange={(e) => setNewAddressLabel(e.target.value)}
                                  placeholder="Etiqueta"
                                  className="w-28 px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-bold bg-stone-50 text-stone-900"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSaveFavoriteAddress(sellerId)}
                                disabled={!currentDetails.calle.trim()}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>Guardar en Favoritas</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  };

                  if (isSeparatedView) {
                    // Vista de entregas separadas por modalidad
                    return (
                      <div className="space-y-6">
                        {distinctTypes.map((dType) => {
                          const subItems = group.items.filter(
                            (it) => normalizeDeliveryType(it.selectedDeliveryType) === dType
                          );
                          if (subItems.length === 0) return null;

                          const subTotal = subItems.reduce(
                            (sum, it) => sum + it.unitPrice * (Number(it.quantity) || 1),
                            0
                          );

                          return (
                            <div
                              key={dType}
                              className="p-4 sm:p-5 rounded-3xl border-2 border-stone-200 bg-white space-y-3.5 shadow-2xs"
                            >
                              {/* Título de la sub-entrega */}
                              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-stone-900">
                                  {dType === 'caserio' && (
                                    <>
                                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <Store className="w-4 h-4" />
                                      </span>
                                      <span>Entrega 1: Recogida en Caserío</span>
                                    </>
                                  )}
                                  {dType === 'sitio_fisico' && (
                                    <>
                                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <MapPin className="w-4 h-4" />
                                      </span>
                                      <span>Entrega 2: Punto de Entrega Físico</span>
                                    </>
                                  )}
                                  {dType === 'envio' && (
                                    <>
                                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <Truck className="w-4 h-4" />
                                      </span>
                                      <span>Entrega 3: Envío a Domicilio</span>
                                    </>
                                  )}
                                </div>

                                <span className="text-xs font-black text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                  {subTotal.toFixed(2)} € ({subItems.length} {subItems.length === 1 ? 'producto' : 'productos'})
                                </span>
                              </div>

                              {/* Lista de productos de esta modalidad */}
                              <div className="space-y-2">
                                {subItems.map(renderProductRow)}
                              </div>

                              {/* Cuadro de configuración para esta modalidad */}
                              {renderDeliveryConfigBox(dType, `${sellerId}_${dType}`)}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Vista estándar / unificada
                  const effectiveType = hasMultipleDeliveryTypes && unifyDeliveryMode === 'unificado' ? unifiedType : distinctTypes[0] || 'caserio';

                  return (
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        {group.items.map(renderProductRow)}
                      </div>

                      {renderDeliveryConfigBox(effectiveType)}
                    </div>
                  );
                })()}

                {/* Subtotal y Botón INDIVIDUAL para confirmar y enviar el pedido de ESTE Caserío */}
                {(() => {
                  const sellerSubtotal = group.items.reduce(
                    (sum, it) => sum + it.unitPrice * (Number(it.quantity) || 1),
                    0
                  );
                  return (
                    <div className="p-4 sm:p-5 bg-emerald-50/80 rounded-2xl border-2 border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                      <div>
                        <span className="text-xs font-bold text-stone-600 block">
                          Subtotal pedido {group.sellerName}:
                        </span>
                        <span className="text-xl font-black text-emerald-950">
                          {sellerSubtotal.toFixed(2)} €
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenSellerSummary(sellerId)}
                        className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar y Enviar Pedido a {group.sellerName}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Columna Derecha: Resumen Global de la Cesta */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border-2 border-stone-200 p-6 space-y-5 sticky top-20 shadow-sm">
            <h2 className="text-lg font-black text-stone-900 border-b border-stone-100 pb-3">
              Resumen de la Cesta
            </h2>

            <div className="space-y-2.5 text-xs font-bold text-stone-700">
              <div className="flex justify-between">
                <span>Total Líneas:</span>
                <span className="font-black text-stone-900">{items.length} productos</span>
              </div>
              <div className="flex justify-between">
                <span>Caseríos Productores:</span>
                <span className="font-black text-stone-900">{sellerIds.length}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Cesta:</span>
                <span className="text-lg font-black text-emerald-950">
                  {totalPrice.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-semibold text-stone-600 space-y-1">
              <p className="font-bold text-stone-900 flex items-center gap-1">
                <span>ℹ️ Pedidos individuales por Caserío</span>
              </p>
              <p className="text-[11px]">
                En km0 los pedidos se confirman y envían directamente a cada baserritarra de forma independiente desde su tarjeta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE RESUMEN FINAL DEL PEDIDO INDIVIDUAL DEL CASERÍO SELECCIONADO */}
      {showSummaryModal && activeCheckoutSellerId && groupedBySeller[activeCheckoutSellerId] && (() => {
        const sId = activeCheckoutSellerId;
        const group = groupedBySeller[sId];
        const unifyMode = deliveryUnifyModes[sId] || 'separadas';
        const dateMode = dateGroupModes[sId] || 'individual';
        const distinctTypes = Array.from(
          new Set(group.items.map((i) => normalizeDeliveryType(i.selectedDeliveryType)))
        );
        const hasMultipleTypes = distinctTypes.length > 1;
        const physicalPoints = (sellerDeliveryPoints[sId] || []).filter(
          (p) => p.type === 'sitio_fisico'
        );

        const commonMethods = getCommonDeliveryMethods(group.items);
        const unifiedType = unifiedDeliveryTypes[sId] || commonMethods[0] || 'caserio';

        const details = shippingForms[sId] || defaultShippingDetails;
        const computedShippingAddress = formatFullAddress(details) || savedAddresses[0]?.address || 'Dirección indicada';

        const sellerTotal = group.items.reduce(
          (sum, it) => sum + it.unitPrice * (Number(it.quantity) || 1),
          0
        );

        const datesMs = group.items
          .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
          .filter((t) => t > 0);
        const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
        const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;
        const datesSet = new Set(
          group.items.map((i) => i.estimatedDeliveryDate || i.deliveryBadge).filter(Boolean)
        );
        const hasMultipleDates = datesSet.size > 1;

        const isSeparated = hasMultipleTypes && unifyMode === 'separadas';
        const effectiveType = hasMultipleTypes && unifyMode === 'unificado' ? unifiedType : distinctTypes[0] || 'caserio';

        return (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div
              className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl border-2 border-stone-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-2xl">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900">Resumen del Pedido</h3>
                    <p className="text-xs font-semibold text-stone-500">
                      Caserío {group.sellerName} ({group.sellerTown})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detalle del pedido / sub-pedidos */}
              <div className="space-y-3">
                {isSeparated ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-xs font-bold text-sky-950 flex items-center gap-2">
                      <Split className="w-4 h-4 text-sky-800 shrink-0" />
                      <span>Se tramitarán {distinctTypes.length} pedidos separados con este caserío:</span>
                    </div>

                    {distinctTypes.map((dType, idx) => {
                      const subItems = group.items.filter(
                        (it) => normalizeDeliveryType(it.selectedDeliveryType) === dType
                      );
                      const subTotal = subItems.reduce(
                        (sum, it) => sum + it.unitPrice * (Number(it.quantity) || 1),
                        0
                      );
                      const ptId = selectedPoints[`${sId}_${dType}`] || selectedPoints[sId] || subItems[0]?.selectedPointId || physicalPoints[0]?.id;
                      const ptObj = physicalPoints.find((p) => p.id === ptId);

                      return (
                        <div key={dType} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                          <div className="flex justify-between font-black text-stone-900 pb-1 border-b border-stone-200">
                            <span>Pedido {idx + 1}: {dType === 'caserio' ? '🏡 Recogida en Caserío' : dType === 'sitio_fisico' ? `📍 Punto de Entrega (${ptObj?.name || 'Punto acordado'})` : `🚚 Envío a Domicilio`}</span>
                            <span className="text-emerald-900">{subTotal.toFixed(2)} €</span>
                          </div>

                          <div className="space-y-2">
                            {subItems.map((it) => {
                              const itKey =
                                it.cartItemId ||
                                `${it.productId}_${it.selectedDeliveryType || 'caserio'}_${it.selectedPointId || 'none'}`;

                              const dateToDisplay =
                                dateMode === 'junto_tardio' && unifiedDateObj
                                  ? unifiedDateObj.toISOString()
                                  : it.estimatedDeliveryDate;

                              return (
                                <div
                                  key={itKey}
                                  className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {it.imageUrl ? (
                                      <img
                                        src={it.imageUrl}
                                        alt={it.name}
                                        className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                                        🌿
                                      </div>
                                    )}

                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-black text-stone-900 block truncate text-xs">
                                          {it.name}
                                        </span>
                                        <DeliveryMethodsBadges deliveryMethods={it.deliveryMethods} />
                                      </div>

                                      <span className="text-[11px] font-bold text-stone-500 block">
                                        {it.quantity} {it.format === 'granel' ? 'kg' : 'uds'} x {it.unitPrice.toFixed(2)} €
                                      </span>

                                      {dateToDisplay ? (
                                        <span className="text-[10px] text-emerald-950 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                          <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                          <span>
                                            Entrega estimada:{' '}
                                            {new Date(dateToDisplay).toLocaleDateString('es-ES', {
                                              weekday: 'short',
                                              day: 'numeric',
                                              month: 'short',
                                            })}
                                            {dateMode === 'junto_tardio' && hasMultipleDates ? ' (unificada)' : ''}
                                          </span>
                                        </span>
                                      ) : it.deliveryBadge ? (
                                        <span className="text-[10px] text-emerald-950 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                          <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                          <span>Entrega estimada: {it.deliveryBadge}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <span className="font-black text-stone-900 text-xs shrink-0">
                                    {(it.unitPrice * it.quantity).toFixed(2)} €
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
                    <div className="flex justify-between font-black text-stone-900">
                      <span>🏡 {group.sellerName}</span>
                      <span className="text-emerald-800">{group.sellerTown}</span>
                    </div>

                    <div className="pl-2 border-l-2 border-emerald-600 space-y-1">
                      <div className="font-bold text-stone-800">
                        Modalidad de Entrega:{' '}
                        <span className="font-black text-emerald-900">
                          {effectiveType === 'caserio'
                            ? 'Recogida en Caserío'
                            : effectiveType === 'sitio_fisico'
                            ? `Punto de Entrega (${physicalPoints.find((p) => p.id === selectedPoints[sId])?.name || physicalPoints[0]?.name || 'Punto acordado'})`
                            : `Envío a Domicilio (${computedShippingAddress})`}
                        </span>
                      </div>

                      <div className="text-stone-600 font-semibold">
                        Plan de entrega:{' '}
                        {dateMode === 'junto_tardio'
                          ? 'Entrega agrupada en la fecha calculada'
                          : 'Entregas individuales según disponibilidad'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-200 space-y-2">
                      {group.items.map((it) => {
                        const itKey =
                          it.cartItemId ||
                          `${it.productId}_${it.selectedDeliveryType || 'caserio'}_${it.selectedPointId || 'none'}`;

                        const dateToDisplay =
                          dateMode === 'junto_tardio' && unifiedDateObj
                            ? unifiedDateObj.toISOString()
                            : it.estimatedDeliveryDate;

                        return (
                          <div
                            key={itKey}
                            className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.name}
                                  className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                                  🌿
                                </div>
                              )}

                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-black text-stone-900 block truncate text-xs">
                                    {it.name}
                                  </span>
                                  <DeliveryMethodsBadges deliveryMethods={it.deliveryMethods} />
                                </div>

                                <span className="text-[11px] font-bold text-stone-500 block">
                                  {it.quantity} {it.format === 'granel' ? 'kg' : 'uds'} x {it.unitPrice.toFixed(2)} €
                                </span>

                                {dateToDisplay ? (
                                  <span className="text-[10px] text-emerald-950 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                    <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                    <span>
                                      Entrega estimada:{' '}
                                      {new Date(dateToDisplay).toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                      })}
                                      {dateMode === 'junto_tardio' && hasMultipleDates ? ' (unificada)' : ''}
                                    </span>
                                  </span>
                                ) : it.deliveryBadge ? (
                                  <span className="text-[10px] text-emerald-950 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 w-fit">
                                    <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                    <span>Entrega estimada: {it.deliveryBadge}</span>
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <span className="font-black text-stone-900 text-xs shrink-0">
                              {(it.unitPrice * it.quantity).toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Total individual a confirmar */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block uppercase">
                    Total Pedido ({group.sellerName})
                  </span>
                  <span className="text-2xl font-black text-emerald-950">{sellerTotal.toFixed(2)} €</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-300">
                  {group.items.length} productos
                </span>
              </div>

              <p className="text-[11px] font-medium text-stone-500 leading-snug">
                Al confirmar, el pedido se enviará exclusivamente al caserío <strong>{group.sellerName}</strong>. Podrás seguir su estado en la pestaña <strong>Pedidos</strong>.
              </p>

              {/* Botones modal */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs transition-colors"
                >
                  Atrás
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleConfirmAndCheckoutSeller(sId)}
                  className="flex-[2] py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    'Enviando pedido...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Enviar Pedido a {group.sellerName}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
