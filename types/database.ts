export type UserRole = 'comprador' | 'vendedor' | 'admin';
export type SellerStatus = 'pending' | 'approved' | 'rejected';
export type ProductCategory =
  | 'verduras_hortalizas'
  | 'frutas'
  | 'quesos_lacteos'
  | 'bebidas'
  | 'otros_alimentos'
  | 'plantas_flores'
  | 'articulos_diversos'
  | 'artesania';

export type ProductFormat = 'suelto' | 'pack_cesta';
export type CultivationType = 'exterior' | 'invernadero' | 'no_aplica';
export type DeliveryType = 'sitio_fisico' | 'envio';
export type OrderStatus =
  | 'pendiente'
  | 'confirmado'
  | 'preparando'
  | 'listo_entrega'
  | 'entregado'
  | 'cancelado';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  address: string | null;
  town: string;
  avatar_url: string | null;
  bio: string | null;
  seller_status: SellerStatus;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  format: ProductFormat;
  price: number;
  price_per_kilo: number | null;
  weight_grams: number | null;
  best_before_date: string | null;
  discount_percentage: number;
  is_organic: boolean;
  cultivation: CultivationType;
  stock: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryPoint {
  id: string;
  seller_id: string;
  name: string;
  type: DeliveryType;
  town: string;
  address_details: string;
  schedule_notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  delivery_point_id: string | null;
  shipping_address: string | null;
  status: OrderStatus;
  total_amount: number;
  is_recurring: boolean;
  recurrence_interval_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  order_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  order_id: string | null;
  reviewer_id: string;
  target_id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
  created_at: string;
}

export interface ProductWithSeller extends Product {
  profiles?: {
    id?: string;
    full_name: string;
    town: string;
    phone?: string | null;
    address?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
  } | null;
}