export type OrderStatus =
  | "pending"
  | "in_preparation"
  | "ready"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "card" | "cash";
export type PaymentStatus = "pending" | "paid" | "cash_on_delivery";

export type ItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type FulfillmentType = "delivery" | "dine_in" | "pickup";
export type PickupLocation = "bnei_brak" | "jerusalem";

export interface OrderItem {
  _id?: string;
  product: string;
  name: string;
  unitPrice: number;
  quantity: number;
  itemStatus: ItemStatus;
}

export interface Fulfillment {
  type: FulfillmentType;
  deliveryAddress?: string;
  tableNumber?: string;
  pickupTime?: string;
  pickupLocation?: PickupLocation;
}

export interface GuestInfo {
  name?: string;
  phone?: string;
  email?: string;
}

/** Populated shape of `Order.user` when fetched by the admin order list. */
export interface OrderUserRef {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string | OrderUserRef | null;
  guestInfo?: GuestInfo;
  items: OrderItem[];
  status: OrderStatus;
  fulfillment: Fulfillment;
  subtotal: number;
  discountApplied: number;
  pointsRedeemed: number;
  total: number;
  pointsEarned: number;
  appliedTier?: string | null;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  createdAt?: string;
}

export interface CreateOrderPayload {
  items: { product: string; quantity: number }[];
  fulfillment: Fulfillment;
  guestInfo?: GuestInfo;
  pointsRedeemed?: number;
  paymentMethod?: PaymentMethod;
}
