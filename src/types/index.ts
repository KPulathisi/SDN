export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rdcId?: string;
  phone?: string;
  address?: string;
  createdAt?: Date;
}

export type UserRole = 'retail_customer' | 'rdc_staff' | 'logistics' | 'head_office';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  sku: string;
  unit: string;
  createdAt?: Date;
  updatedAt?: Date;
  promotion?: {
    type: 'discount' | 'bogo' | 'special';
    value: string;
  };
}

export interface InventoryItem {
  id: string;
  productId: string;
  rdcId: string;
  currentStock: number;
  reorderLevel: number;
  lastUpdated?: Date;
  movements: StockMovement[];
}

export interface StockMovement {
  id: string;
  type: 'in' | 'out' | 'transfer';
  quantity: number;
  reason: string;
  timestamp: Date;
  userId: string;
}

export interface Order {
  id: string;
  customerId: string;
  rdcId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryAddress: string;
  estimatedDelivery?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'dispatched' | 'in_transit' | 'delivered' | 'cancelled';

export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  vehicleId: string;
  status: DeliveryStatus;
  scheduledDate: Date;
  actualDelivery?: Date;
  route: RoutePoint[];
  currentLocation?: Location;
}

export type DeliveryStatus = 'scheduled' | 'en_route' | 'delivered' | 'failed';

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp?: Date;
  address: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method: 'card' | 'cash' | 'bank_transfer';
  stripePaymentId?: string;
  createdAt?: Date;
  paidAt?: Date;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface RDC {
  id: string;
  name: string;
  address: string;
  location: Location;
  manager: string;
  phone: string;
  email: string;
  isActive: boolean;
}