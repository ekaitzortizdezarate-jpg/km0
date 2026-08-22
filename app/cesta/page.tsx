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

interface SellerDeliveryConfig {
  deliveryType: 'caserio' | 'sitio_fisico' | 'envio';
  deliveryPointId: string | null;
  shippingAddress: string;
  groupMode: 'junto_tardio' | 'individual';
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
  const { items, updateQuantity, removeFromCart, removeSellerItems, clearCart, totalPrice } = useCart();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Puntos de entrega por caserío
  const [sellerDeliveryPoints, setSellerDeliveryPoints] = useState<
    Record<string, DeliveryPoint[]>
  >({});

  // Configuración de entrega elegida para cada caserío
  const [deliveryConfigs, setDeliveryConfigs] = useState<
    Record<string, SellerDeliveryConfig>
  >({});

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

  // 1. Cargar usuario y direcciones guardadas
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
              telefono: a.telefono || a.recipientPhone || userDefaults.telefono,
              instrucciones: a.instrucciones || a.deliveryNotes || '',
              address: a.address || `${a.calle || a.address || ''} ${a.poblacion || a.town || ''}`.trim(),
            }));
          } else if (profile.address) {
            list = [
              {
                id: 'default',
                label: 'Casa',
                nombre: fName,
                apellidos: lName,
                calle: profile.address,
                numero: '',
                piso: '',
                puerta: '',
                codigoPostal: profile.postal_code || '',
                poblacion: profile.town || '',
                provincia: '',
                telefono: profile.phone || '',
                instrucciones: '',
                address: `${profile.address}, ${profile.postal_code || ''} ${profile.town || ''}`.trim(),
              },
            ];
          }
          setSavedAddresses(list.slice(0, 5));
        }
      }
    }
    loadUser();
  }, [supabase]);

  // 2. Agrupar productos por Caserío / Vendedor
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

  // 3. Cargar puntos de entrega físicos para cada vendedor
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

        // Inicializar configuraciones respetando lo seleccionado al añadir a la cesta
        setDeliveryConfigs((prev) => {
          const next = { ...prev };
          for (const sId of sellerIds) {
            const sellerItems = groupedBySeller[sId]?.items || [];
            const firstItem = sellerItems[0];

            let chosenType: 'caserio' | 'sitio_fisico' | 'envio' = 'caserio';
            if (firstItem?.selectedDeliveryType === 'punto_entrega') {
              chosenType = 'sitio_fisico';
            } else if (firstItem?.selectedDeliveryType === 'domicilio') {
              chosenType = 'envio';
            } else {
              chosenType = 'caserio';
            }

            // Validar si el tipo está permitido por los métodos del producto
            const allowedMethods = new Set<string>();
            sellerItems.forEach((it) => {
              const methods = (it.deliveryMethods && it.deliveryMethods.length > 0)
                ? it.deliveryMethods
                : ['caserio'];
              methods.forEach((m: string) => {
                if (m === 'caserio') allowedMethods.add('caserio');
                if (m === 'punto_entrega' || m === 'sitio_fisico') allowedMethods.add('sitio_fisico');
                if (m === 'domicilio' || m === 'envio') allowedMethods.add('envio');
              });
            });

            if (!allowedMethods.has(chosenType)) {
              if (allowedMethods.has('caserio')) chosenType = 'caserio';
              else if (allowedMethods.has('sitio_fisico')) chosenType = 'sitio_fisico';
              else if (allowedMethods.has('envio')) chosenType = 'envio';
            }

            const chosenPointId = firstItem?.selectedPointId || map[sId]?.[0]?.id || null;
            const defaultAddr = savedAddresses[0]?.address || '';

            if (!next[sId]) {
              next[sId] = {
                deliveryType: chosenType,
                deliveryPointId: chosenPointId,
                shippingAddress: defaultAddr,
                groupMode: 'junto_tardio',
              };
            }
          }
          return next;
        });
      }
    }

    fetchPoints();
  }, [sellerIds.join(','), savedAddresses.length, supabase]);

  const handleDeliveryTypeChange = (
    sellerId: string,
    type: 'caserio' | 'sitio_fisico' | 'envio'
  ) => {
    const physicalPoints = (sellerDeliveryPoints[sellerId] || []).filter(
      (p) => p.type === 'sitio_fisico'
    );
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        deliveryType: type,
        deliveryPointId:
          type === 'sitio_fisico'
            ? prev[sellerId]?.deliveryPointId || physicalPoints[0]?.id || null
            : null,
        shippingAddress: prev[sellerId]?.shippingAddress || savedAddresses[0]?.address || '',
        groupMode: prev[sellerId]?.groupMode || 'junto_tardio',
      },
    }));
  };

  const handleDeliveryPointChange = (sellerId: string, pointId: string) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        deliveryPointId: pointId,
      },
    }));
  };

  const handleAddressChange = (sellerId: string, address: string) => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        shippingAddress: address,
      },
    }));
  };

  const handleGroupModeChange = (sellerId: string, mode: 'junto_tardio' | 'individual') => {
    setDeliveryConfigs((prev) => ({
      ...prev,
      [sellerId]: {
        ...prev[sellerId],
        groupMode: mode,
      },
    }));
  };

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

    handleAddressChange(sellerId, formatFullAddress(updated));
  };

  const handleApplySavedAddress = (sellerId: string, sa: SavedAddress) => {
    const details: SellerShippingDetails = {
      nombre: sa.nombre || defaultShippingDetails.nombre || '',
      apellidos: sa.apellidos || defaultShippingDetails.apellidos || '',
      calle: sa.calle || sa.address,
      numero: sa.numero || '',
      piso: sa.piso || '',
      puerta: sa.puerta || '',
      codigoPostal: sa.codigoPostal || defaultShippingDetails.codigoPostal || '',
      poblacion: sa.poblacion || defaultShippingDetails.poblacion || '',
      provincia: sa.provincia || '',
      telefono: sa.telefono || defaultShippingDetails.telefono || '',
      instrucciones: sa.instrucciones || '',
    };

    setShippingForms((prev) => ({
      ...prev,
      [sellerId]: details,
    }));

    handleAddressChange(sellerId, formatFullAddress(details));
  };

  const handleSaveFavoriteAddress = async (sellerId: string) => {
    const details = shippingForms[sellerId] || defaultShippingDetails;
    if (!details.calle.trim()) {
      setError('Por favor, introduce al menos la calle antes de guardar en favoritas.');
      return;
    }

    const fullStr = formatFullAddress(details);
    const newObj: SavedAddress = {
      id: String(Date.now()),
      label: newAddressLabel.trim() || 'Favorita',
      nombre: details.nombre.trim(),
      apellidos: details.apellidos.trim(),
      calle: details.calle.trim(),
      numero: details.numero.trim(),
      piso: details.piso.trim(),
      puerta: details.puerta.trim(),
      codigoPostal: details.codigoPostal.trim(),
      poblacion: details.poblacion.trim(),
      provincia: details.provincia.trim(),
      telefono: details.telefono.trim(),
      instrucciones: details.instrucciones.trim(),
      address: fullStr,
    };

    const updated = [...savedAddresses.filter((a) => a.address !== fullStr), newObj].slice(0, 5);
    setSavedAddresses(updated);
    await saveBuyerAddresses(updated);
    setNewAddressLabel('Casa');
  };

  const getSellerConfig = (sellerId: string): SellerDeliveryConfig => {
    const group = groupedBySeller[sellerId];
    if (!group || group.items.length === 0) {
      return {
        deliveryType: 'caserio',
        deliveryPointId: null,
        shippingAddress: savedAddresses[0]?.address || '',
        groupMode: 'junto_tardio',
      };
    }

    const firstItem = group.items[0];
    const itemSelectedType = firstItem?.selectedDeliveryType;
    const itemSelectedPointId = firstItem?.selectedPointId;

    // Métodos permitidos según los productos de este vendedor
    const allowedMethods = new Set<string>();
    group.items.forEach((it) => {
      (it.deliveryMethods || []).forEach((m: string) => {
        if (m === 'caserio') allowedMethods.add('caserio');
        if (m === 'punto_entrega' || m === 'sitio_fisico') allowedMethods.add('sitio_fisico');
        if (m === 'domicilio' || m === 'envio') allowedMethods.add('envio');
      });
    });

    if (allowedMethods.size === 0) {
      allowedMethods.add('caserio');
    }

    // Modalidad por defecto respetando lo elegido al añadir a la cesta
    let defaultType: 'caserio' | 'sitio_fisico' | 'envio' = 'caserio';
    if (itemSelectedType === 'punto_entrega') {
      defaultType = 'sitio_fisico';
    } else if (itemSelectedType === 'domicilio') {
      defaultType = 'envio';
    } else {
      defaultType = 'caserio';
    }

    // Si la opción elegida no está permitida por el vendedor, usar la primera permitida
    if (!allowedMethods.has(defaultType)) {
      if (allowedMethods.has('caserio')) defaultType = 'caserio';
      else if (allowedMethods.has('sitio_fisico')) defaultType = 'sitio_fisico';
      else if (allowedMethods.has('envio')) defaultType = 'envio';
    }

    const currentConfig = deliveryConfigs[sellerId];
    const effectiveDeliveryType =
      currentConfig?.deliveryType && allowedMethods.has(currentConfig.deliveryType)
        ? currentConfig.deliveryType
        : defaultType;

    const physicalPoints = (sellerDeliveryPoints[sellerId] || []).filter(
      (p) => p.type === 'sitio_fisico'
    );

    const effectiveDeliveryPointId =
      currentConfig?.deliveryPointId && physicalPoints.some((p) => p.id === currentConfig.deliveryPointId)
        ? currentConfig.deliveryPointId
        : itemSelectedPointId && physicalPoints.some((p) => p.id === itemSelectedPointId)
        ? itemSelectedPointId
        : physicalPoints[0]?.id || null;

    const currentDetails = shippingForms[sellerId] || defaultShippingDetails;
    const computedShippingAddress =
      currentConfig?.shippingAddress && currentConfig.shippingAddress.trim()
        ? currentConfig.shippingAddress
        : formatFullAddress(currentDetails) || savedAddresses[0]?.address || '';

    return {
      deliveryType: effectiveDeliveryType,
      deliveryPointId: effectiveDeliveryPointId,
      shippingAddress: computedShippingAddress,
      groupMode: currentConfig?.groupMode || 'junto_tardio',
    };
  };

  // Abrir resumen para UN VENDEDOR específico
  const handleOpenSellerSummary = (sellerId: string) => {
    setError(null);
    setSuccessOrderMsg(null);
    const group = groupedBySeller[sellerId];
    if (!group) return;

    const config = getSellerConfig(sellerId);

    if (config.deliveryType === 'envio') {
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

    const config = getSellerConfig(sellerId);

    let finalEstimatedDate: string | null = null;
    if (group.items.length > 0) {
      const dates = group.items
        .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
        .filter((t) => t > 0);

      if (dates.length > 0) {
        const maxTime = Math.max(...dates);
        finalEstimatedDate = new Date(maxTime).toISOString();
      }
    }

    const singlePayload: CartCheckoutSellerGroup = {
      sellerId,
      deliveryType: config.deliveryType,
      deliveryPointId: config.deliveryType === 'sitio_fisico' ? config.deliveryPointId : null,
      shippingAddress: config.deliveryType === 'envio' ? config.shippingAddress : null,
      estimatedDeliveryDate: finalEstimatedDate,
      items: group.items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity) || 1,
        unitPrice: it.unitPrice,
      })),
    };

    const result = await createCartOrders([singlePayload]);

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
        <div className="p-4 bg-red-50 text-red-900 border-2 border-red-200 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Pedidos agrupados por Caserío */}
        <div className="lg:col-span-8 space-y-6">
          {sellerIds.map((sellerId) => {
            const group = groupedBySeller[sellerId];
            const config = getSellerConfig(sellerId);
            const points = sellerDeliveryPoints[sellerId] || [];

            // Calcular fecha unificada más tardía para este caserío
            const datesMs = group.items
              .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
              .filter((t) => t > 0);
            const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
            const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;

            const datesSet = new Set(
              group.items.map((i) => i.estimatedDeliveryDate || i.deliveryBadge).filter(Boolean)
            );
            const hasMultipleDates = datesSet.size > 1;

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

                {/* Lista de Productos de este Caserío */}
                <div className="space-y-3">
                  {group.items.map((item) => {
                    const itemKey =
                      item.cartItemId ||
                      `${item.productId}_${item.selectedDeliveryType || 'caserio'}_${item.selectedPointId || 'none'}`;

                    // Si se eligió entregar todo junto, se muestra la fecha unificada calculada
                    const displayDeliveryDate =
                      config.groupMode === 'junto_tardio' && unifiedDateObj
                        ? unifiedDateObj.toISOString()
                        : item.estimatedDeliveryDate;

                    return (
                      <div
                        key={itemKey}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200"
                      >
                        <div className="flex items-center gap-3">
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

                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-xs font-black text-stone-900">{item.name}</h3>
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

                            {/* Modalidad de Entrega del producto */}
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border mt-1 bg-white text-stone-800 border-stone-300">
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
                                  <span>Envío</span>
                                </>
                              )}
                            </div>

                            {/* Fecha de Entrega */}
                            {displayDeliveryDate ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>
                                  Fecha estimada de entrega:{' '}
                                  {new Date(displayDeliveryDate).toLocaleDateString('es-ES', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                  })}
                                  {config.groupMode === 'junto_tardio' && hasMultipleDates ? ' (unificada)' : ''}
                                </span>
                              </div>
                            ) : item.deliveryBadge ? (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md mt-1 border border-emerald-300">
                                <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Fecha estimada de entrega: {item.deliveryBadge}</span>
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
                  })}
                </div>

                {/* Agrupación de fechas si son distintas */}
                {hasMultipleDates && (
                  <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-700" />
                      Tus productos de este caserío tienen plazos de entrega distintos:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleGroupModeChange(sellerId, 'junto_tardio')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                          config.groupMode === 'junto_tardio'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/60 text-amber-800 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black">📦 Entregar todo junto</span>
                        <span className="text-[10px] font-semibold text-amber-700 block">
                          {unifiedDateObj
                            ? `Fecha calculada: ${unifiedDateObj.toLocaleDateString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}`
                            : 'En la fecha del producto más tardío'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGroupModeChange(sellerId, 'individual')}
                        className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold transition-all ${
                          config.groupMode === 'individual'
                            ? 'border-amber-700 bg-white ring-2 ring-amber-600 text-amber-950 font-black shadow-sm'
                            : 'border-amber-200 bg-white/60 text-amber-800 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black">🚚 Entregas separadas</span>
                        <span className="text-[10px] font-semibold text-amber-700 block">
                          Según disponibilidad de cada producto
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Selección de Modalidad de Entrega (solo las permitidas por el vendedor para este producto) */}
                {(() => {
                  const allowedMethods = new Set<string>();
                  group.items.forEach((it) => {
                    const methods = (it.deliveryMethods && it.deliveryMethods.length > 0)
                      ? it.deliveryMethods
                      : ['caserio'];
                    methods.forEach((m: string) => {
                      if (m === 'caserio') allowedMethods.add('caserio');
                      if (m === 'punto_entrega' || m === 'sitio_fisico') allowedMethods.add('sitio_fisico');
                      if (m === 'domicilio' || m === 'envio') allowedMethods.add('envio');
                    });
                  });

                  if (allowedMethods.size === 0) allowedMethods.add('caserio');

                  const allowsCaserio = allowedMethods.has('caserio');
                  const allowsPunto = allowedMethods.has('sitio_fisico');
                  const allowsEnvio = allowedMethods.has('envio');

                  // Calcular estimaciones para este caserío / productos
                  const firstItem = group.items[0];
                  const caserioEst = getCaserioEstimate(firstItem);
                  const physicalPoints = (sellerDeliveryPoints[sellerId] || []).filter(
                    (p) => p.type === 'sitio_fisico'
                  );
                  const selectedPt = physicalPoints.find((p) => p.id === config.deliveryPointId) || physicalPoints[0];
                  const puntoEst = getPuntoEntregaEstimate(firstItem, selectedPt);
                  const domicilioEst = getDomicilioEstimate(firstItem);

                  return (
                    <div className="p-4 sm:p-5 bg-stone-100/70 rounded-3xl border border-stone-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-stone-900 uppercase tracking-wider">
                          Modalidad de Entrega para este Caserío:
                        </label>
                        <span className="text-[10px] font-bold text-stone-500">
                          {allowedMethods.size} {allowedMethods.size === 1 ? 'modalidad disponible' : 'modalidades disponibles'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* 1. Caserío */}
                        {allowsCaserio && (
                          <div
                            onClick={() => handleDeliveryTypeChange(sellerId, 'caserio')}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                              config.deliveryType === 'caserio'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                                : 'border-stone-200 bg-white/70 hover:bg-white text-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                                <Store className="w-4 h-4 text-emerald-800" />
                                <span>Recogida en Caserío</span>
                              </span>
                              <input
                                type="radio"
                                name={`delivery_type_${sellerId}`}
                                checked={config.deliveryType === 'caserio'}
                                onChange={() => handleDeliveryTypeChange(sellerId, 'caserio')}
                                className="w-4 h-4 text-emerald-700 cursor-pointer"
                              />
                            </div>

                            {/* Estimación y Datos de Caserío */}
                            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-1 shadow-sm">
                              <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Entrega Prevista:</span>
                              </div>
                              <p className="text-stone-900 font-extrabold capitalize text-xs">
                                {caserioEst.dateStr}
                              </p>
                              <div className="flex items-center gap-2 pt-0.5">
                                {(() => {
                                  const caserioPt = (sellerDeliveryPoints[sellerId] || []).find((p) => p.type === 'caserio');
                                  return caserioPt?.image_url ? (
                                    <img
                                      src={caserioPt.image_url}
                                      alt={caserioPt.name}
                                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                    />
                                  ) : null;
                                })()}
                                <p className="text-stone-600 font-semibold text-[11px]">
                                  🏡 Instalaciones del caserío en {group.sellerTown}.
                                </p>
                              </div>
                              {firstItem.caserioSchedule && (
                                <p className="text-emerald-950 font-bold text-[10px]">
                                  🕒 Horario habitual: {firstItem.caserioSchedule}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Punto de Entrega */}
                        {allowsPunto && (
                          <div
                            onClick={() => handleDeliveryTypeChange(sellerId, 'sitio_fisico')}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                              config.deliveryType === 'sitio_fisico'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                                : 'border-stone-200 bg-white/70 hover:bg-white text-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                                <MapPin className="w-4 h-4 text-emerald-800" />
                                <span>Punto de Entrega</span>
                              </span>
                              <input
                                type="radio"
                                name={`delivery_type_${sellerId}`}
                                checked={config.deliveryType === 'sitio_fisico'}
                                onChange={() => handleDeliveryTypeChange(sellerId, 'sitio_fisico')}
                                className="w-4 h-4 text-emerald-700 cursor-pointer"
                              />
                            </div>

                            {/* Estimación y Datos de Punto de Entrega */}
                            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-1.5 shadow-sm">
                              <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Entrega Prevista:</span>
                              </div>
                              <p className="text-stone-900 font-extrabold capitalize text-xs">
                                {puntoEst.dateStr}
                              </p>

                              {physicalPoints.length > 1 ? (
                                <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                                  <label className="block text-[10px] font-bold text-stone-700 mb-1">
                                    Selecciona el punto de entrega:
                                  </label>
                                  <select
                                    value={config.deliveryPointId || physicalPoints[0]?.id}
                                    onChange={(e) => handleDeliveryPointChange(sellerId, e.target.value)}
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
                                <div className="flex items-start gap-2.5 pt-1 text-[11px] text-stone-600">
                                  {physicalPoints[0].image_url ? (
                                    <img
                                      src={physicalPoints[0].image_url}
                                      alt={physicalPoints[0].name}
                                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                                    />
                                  ) : null}
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-stone-900">{physicalPoints[0].name} ({physicalPoints[0].town})</p>
                                    <p>{physicalPoints[0].address_details}</p>
                                    {physicalPoints[0].schedule_notes && (
                                      <p className="text-[10px] text-amber-900 font-bold">🕒 {physicalPoints[0].schedule_notes}</p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[11px] text-stone-600">Punto físico acordado con el caserío ({group.sellerTown}).</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. Envío a Domicilio */}
                        {allowsEnvio && (
                          <div
                            onClick={() => handleDeliveryTypeChange(sellerId, 'envio')}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                              config.deliveryType === 'envio'
                                ? 'border-emerald-700 bg-white ring-2 ring-emerald-600 shadow-sm'
                                : 'border-stone-200 bg-white/70 hover:bg-white text-stone-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-xs font-black text-stone-900">
                                <Truck className="w-4 h-4 text-emerald-800" />
                                <span>Envío a Domicilio</span>
                              </span>
                              <input
                                type="radio"
                                name={`delivery_type_${sellerId}`}
                                checked={config.deliveryType === 'envio'}
                                onChange={() => handleDeliveryTypeChange(sellerId, 'envio')}
                                className="w-4 h-4 text-emerald-700 cursor-pointer"
                              />
                            </div>

                            {/* Estimación y Datos de Domicilio */}
                            <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-stone-800 space-y-2 shadow-sm">
                              <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] uppercase font-black">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>Entrega Prevista:</span>
                              </div>
                              <p className="text-stone-900 font-extrabold capitalize text-xs">
                                {domicilioEst.dateStr}
                              </p>
                              {domicilioEst.detailLead && (
                                <p className="text-stone-600 font-semibold text-[11px]">
                                  🚚 Reparto directo ({domicilioEst.detailLead})
                                </p>
                              )}

                              {/* Formulario Completo de Dirección y Mis Direcciones Favoritas si Envío a Domicilio está seleccionado */}
                              {config.deliveryType === 'envio' && (() => {
                                const currentDetails = shippingForms[sellerId] || defaultShippingDetails;

                                return (
                                  <div className="space-y-3 pt-2 border-t border-emerald-200/70" onClick={(e) => e.stopPropagation()}>
                                    {/* 1. Selector de Mis Direcciones Favoritas */}
                                    {savedAddresses.length > 0 && (
                                      <div className="space-y-1.5 p-3 bg-white rounded-2xl border border-emerald-200 shadow-sm">
                                        <label className="text-[11px] font-black text-stone-800 flex items-center gap-1.5 uppercase tracking-wider">
                                          <Bookmark className="w-3.5 h-3.5 text-emerald-700" />
                                          <span>⭐ Mis Direcciones Favoritas:</span>
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                          {savedAddresses.map((sa) => {
                                            const isSelected =
                                              (currentDetails.calle && sa.calle === currentDetails.calle) ||
                                              sa.address === config.shippingAddress;
                                            return (
                                              <button
                                                type="button"
                                                key={sa.id}
                                                onClick={() => handleApplySavedAddress(sellerId, sa)}
                                                className={`p-2.5 rounded-xl text-left text-xs transition-all border flex flex-col justify-between gap-0.5 ${
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
                                                <span className={`text-[11px] truncate ${isSelected ? 'text-emerald-100' : 'text-stone-600'}`}>
                                                  {sa.calle || sa.address} {sa.poblacion ? `(${sa.poblacion})` : ''}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* 2. Todos los 9 campos individuales para el envío a domicilio */}
                                    <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-3 shadow-sm">
                                      <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                                        <Truck className="w-4 h-4 text-emerald-700" />
                                        <span>Datos para el Envío a Domicilio:</span>
                                      </div>

                                      {/* Fila 1: Nombre y Apellidos */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Nombre *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={currentDetails.nombre}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'nombre', e.target.value)}
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
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'apellidos', e.target.value)}
                                            placeholder="Ej. Goikoetxea Uriarte"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Fila 2: Calle, Número, Piso, Puerta */}
                                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                        <div className="sm:col-span-6">
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Calle / Avenida / Plaza *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={currentDetails.calle}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'calle', e.target.value)}
                                            placeholder="Ej. Gran Vía"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>

                                        <div className="sm:col-span-2">
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Número *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={currentDetails.numero}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'numero', e.target.value)}
                                            placeholder="Ej. 14"
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
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'piso', e.target.value)}
                                            placeholder="Ej. 3º"
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
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'puerta', e.target.value)}
                                            placeholder="Ej. B / Izq"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Fila 3: Código Postal, Población, Provincia */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        <div>
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Código Postal (CP) *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            maxLength={5}
                                            value={currentDetails.codigoPostal}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'codigoPostal', e.target.value)}
                                            placeholder="Ej. 48001"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Población / Municipio *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            value={currentDetails.poblacion}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'poblacion', e.target.value)}
                                            placeholder="Ej. Bilbao"
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
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'provincia', e.target.value)}
                                            placeholder="Ej. Bizkaia"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Fila 4: Teléfono e Instrucciones */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Teléfono de Contacto (para el repartidor)
                                          </label>
                                          <input
                                            type="tel"
                                            value={currentDetails.telefono}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'telefono', e.target.value)}
                                            placeholder="Ej. 600 123 456"
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-black text-stone-700 uppercase mb-1">
                                            Instrucciones para la entrega (Opcional)
                                          </label>
                                          <input
                                            type="text"
                                            value={currentDetails.instrucciones}
                                            onChange={(e) => handleShippingFieldChange(sellerId, 'instrucciones', e.target.value)}
                                            placeholder="Ej. Dejar en conserjería..."
                                            className="w-full px-3 py-2 border-2 border-stone-300 rounded-xl text-xs font-bold bg-white text-stone-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Guardar en mis direcciones favoritas */}
                                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] font-bold text-stone-700">Guardar como favorita:</span>
                                          <input
                                            type="text"
                                            value={newAddressLabel}
                                            onChange={(e) => setNewAddressLabel(e.target.value)}
                                            placeholder="Etiqueta (ej. Casa, Trabajo)"
                                            className="w-36 px-2.5 py-1 border border-stone-300 rounded-lg text-xs font-bold bg-stone-50 text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
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
        const config = getSellerConfig(sId);
        const physicalPoints = (sellerDeliveryPoints[sId] || []).filter(
          (p) => p.type === 'sitio_fisico'
        );
        const pointObj = physicalPoints.find((p) => p.id === config.deliveryPointId);

        const datesMs = group.items
          .map((i) => (i.estimatedDeliveryDate ? new Date(i.estimatedDeliveryDate).getTime() : 0))
          .filter((t) => t > 0);
        const maxDateMs = datesMs.length > 0 ? Math.max(...datesMs) : 0;
        const unifiedDateObj = maxDateMs > 0 ? new Date(maxDateMs) : null;

        const sellerTotal = group.items.reduce(
          (sum, it) => sum + it.unitPrice * (Number(it.quantity) || 1),
          0
        );

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

              {/* Detalle del caserío */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 text-xs">
                <div className="flex justify-between font-black text-stone-900">
                  <span>🏡 {group.sellerName}</span>
                  <span className="text-emerald-800">{group.sellerTown}</span>
                </div>

                <div className="pl-2 border-l-2 border-emerald-600 space-y-1">
                  <div className="font-bold text-stone-800">
                    Modalidad de Entrega:{' '}
                    <span className="font-black text-emerald-900">
                      {config?.deliveryType === 'caserio'
                        ? 'Recogida en Caserío'
                        : config?.deliveryType === 'sitio_fisico'
                        ? `Punto de Entrega (${pointObj?.name || 'Punto acordado'})`
                        : `Envío a Domicilio (${config?.shippingAddress})`}
                    </span>
                  </div>

                  <div className="text-stone-600 font-semibold">
                    Plan de entrega:{' '}
                    {config?.groupMode === 'junto_tardio'
                      ? 'Entrega agrupada en la fecha calculada'
                      : 'Entregas individuales según disponibilidad'}
                  </div>
                </div>

                {/* Lista de productos de este caserío */}
                <div className="pt-2 border-t border-stone-200 space-y-2 font-semibold text-stone-700">
                  {group.items.map((it) => {
                    const itKey =
                      it.cartItemId ||
                      `${it.productId}_${it.selectedDeliveryType || 'caserio'}_${it.selectedPointId || 'none'}`;

                    const dateToDisplay =
                      config.groupMode === 'junto_tardio' && unifiedDateObj
                        ? unifiedDateObj.toISOString()
                        : it.estimatedDeliveryDate;

                    return (
                      <div
                        key={itKey}
                        className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-stone-200"
                      >
                        <div className="flex items-center gap-2.5">
                          {it.imageUrl ? (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-11 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                              km0
                            </div>
                          )}

                          <div>
                            <span className="font-black text-stone-900 block leading-tight">
                              {it.name}
                            </span>
                            <span className="text-[11px] font-bold text-stone-500">
                              {it.quantity} {it.format === 'granel' ? 'kg' : 'uds'} x {it.unitPrice.toFixed(2)} €
                            </span>

                            {dateToDisplay ? (
                              <span className="text-[10px] text-emerald-900 font-bold block">
                                📅 Entrega prevista:{' '}
                                {new Date(dateToDisplay).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                })}
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
