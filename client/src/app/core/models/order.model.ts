export type OrderStatus =
  | "pending"
  | "in_preparation"
  | "ready"
  | "delivered"
  | "cancelled";

export type ItemStatus =
  | "pending"
  | "preparing"
  | "ready"
  | "served"
  | "cancelled";

export type FulfillmentType = "delivery" | "dine_in" | "pickup";

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
}

export interface GuestInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: string | null;
  guestInfo?: GuestInfo;
  items: OrderItem[];
  status: OrderStatus;
  fulfillment: Fulfillment;
  subtotal: number;
  discountApplied: number;
  pointsRedeemed: number;
  total: number;
  pointsEarned: number;
  createdAt?: string;
}

export interface CreateOrderPayload {
  items: { product: string; quantity: number }[];
  fulfillment: Fulfillment;
  guestInfo?: GuestInfo;
  pointsRedeemed?: number;
}
