import { Injectable, OnDestroy, computed, inject, signal } from "@angular/core";
import { Subscription } from "rxjs";
import { ApiService } from "./api.service";
import { SocketService } from "./socket.service";
import { Order, OrderStatus } from "../models/order.model";

/**
 * Staff-facing workflow stage. The backend's five-value `OrderStatus` is
 * collapsed into three Kanban columns for the dashboard: an order is either
 * still being handled ("NEW"), ready and waiting for the customer
 * ("WAITING_PICKUP"), or finished ("COMPLETED", which also covers
 * cancellations — they still belong in the history column).
 */
export type DashboardColumn = "NEW" | "WAITING_PICKUP" | "COMPLETED";

const STATUS_TO_COLUMN: Record<OrderStatus, DashboardColumn> = {
  pending: "NEW",
  in_preparation: "NEW",
  ready: "WAITING_PICKUP",
  delivered: "COMPLETED",
  cancelled: "COMPLETED",
};

/**
 * Human-readable status label, aware of the order's fulfillment type: the
 * same underlying "ready"/"delivered" statuses mean something different for
 * a self-pickup order ("ready for pickup" / "picked up") than for a
 * delivery order ("out for delivery" / "delivered to customer"). Used by
 * both the staff dashboard and the customer's own order history so the two
 * stay in sync.
 */
export function getOrderStatusLabel(
  order: Pick<Order, "status" | "fulfillment">
): string {
  const isDelivery = order.fulfillment?.type === "delivery";
  switch (order.status) {
    case "pending":
      return "ממתין לטיפול";
    case "in_preparation":
      return "בהכנה";
    case "ready":
      return isDelivery ? "יצא למשלוח" : "מוכן לאיסוף";
    case "delivered":
      return isDelivery ? "נמסר ללקוח" : "נאסף";
    case "cancelled":
      return "בוטל";
    default:
      return order.status;
  }
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
}

interface OrderResponse {
  success: boolean;
  data: Order;
}

/**
 * Central store for admin order management: loads every order, keeps them
 * live via Socket.IO, and exposes them pre-grouped into Kanban columns for
 * the staff dashboard. `updateStatus` (and its `markReadyForPickup` /
 * `markPickedUp` shortcuts) is the single path for status transitions — it
 * calls the existing `PATCH /orders/:id/status` endpoint, which the backend
 * already broadcasts via `order:statusChanged` to both the admin room and
 * that specific order's room, so any customer watching their order (see
 * OrdersComponent) picks up the change automatically.
 */
@Injectable({ providedIn: "root" })
export class OrderService implements OnDestroy {
  private api = inject(ApiService);
  private socket = inject(SocketService);

  private orders = signal<Order[]>([]);
  readonly loading = signal(true);
  private initialized = false;
  private subs: Subscription[] = [];

  readonly newOrders = computed(() => this.byColumn("NEW"));
  readonly waitingPickupOrders = computed(() => this.byColumn("WAITING_PICKUP"));
  readonly completedOrders = computed(() => this.byColumn("COMPLETED"));

  /** Idempotent — safe to call every time the dashboard component mounts. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.loadAll();
    this.socket.joinAdmin();
    this.subs.push(
      this.socket
        .onOrderNew()
        .subscribe((order) => this.orders.update((list) => [order, ...list])),
      this.socket.onOrderStatusChanged().subscribe((updated) =>
        this.orders.update((list) =>
          list.map((o) => (o._id === updated._id ? updated : o))
        )
      )
    );
  }

  loadAll(): void {
    this.loading.set(true);
    this.api.get<OrdersResponse>("/orders").subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getByStatus(status: OrderStatus): Order[] {
    return this.orders().filter((o) => o.status === status);
  }

  updateStatus(orderId: string, status: OrderStatus): void {
    const previous = this.orders();
    // Optimistic update so staff see instant feedback; the server response
    // (and the socket echo it triggers) reconciles the authoritative state.
    this.orders.update((list) =>
      list.map((o) => (o._id === orderId ? { ...o, status } : o))
    );
    this.api.patch<OrderResponse>(`/orders/${orderId}/status`, { status }).subscribe({
      next: (res) =>
        this.orders.update((list) =>
          list.map((o) => (o._id === res.data._id ? res.data : o))
        ),
      error: () => this.orders.set(previous),
    });
  }

  markReadyForPickup(order: Order): void {
    this.updateStatus(order._id, "ready");
  }

  markPickedUp(order: Order): void {
    this.updateStatus(order._id, "delivered");
  }

  private byColumn(column: DashboardColumn): Order[] {
    return this.orders().filter((o) => STATUS_TO_COLUMN[o.status] === column);
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
