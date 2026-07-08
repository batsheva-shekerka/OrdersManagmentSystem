import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Order } from "../../core/models/order.model";
import { getOrderStatusLabel } from "../../core/services/order.service";

/** Which Kanban column the card is currently rendered in. Drives the label
 * (and existence) of the primary action button — the actual status
 * transition it triggers is still decided by the parent/OrderService. */
export type OrderCardStage = "new" | "waiting" | "completed";

/**
 * Purely presentational order card used across the staff dashboard columns.
 * Knows nothing about status transitions — the parent decides what happens
 * when the action button is clicked.
 */
@Component({
  selector: "app-order-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="order-card">
      <header class="order-card__header">
        <span class="order-card__number">{{ order.orderNumber }}</span>
        @if (order.createdAt) {
          <span class="order-card__time">{{ order.createdAt | date: "HH:mm" }}</span>
        }
      </header>

      <div class="order-card__customer-row">
        <span class="order-card__customer">{{ customerName }}</span>
        @if (customerPhone) {
          <a class="order-card__phone" [href]="'tel:' + customerPhone">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.46 16z"/></svg>
            {{ customerPhone }}
          </a>
        }
      </div>

      <ul class="order-card__items">
        @for (item of order.items; track item._id) {
          <li>{{ item.quantity }}× {{ item.name }}</li>
        }
      </ul>

      <div class="order-card__meta">
        <span class="order-card__fulfillment">{{ fulfillmentLabel }}</span>
        <span class="order-card__status" [class]="'order-card__status--' + order.status">
          {{ statusLabel }}
        </span>
      </div>

      @if (deliveryAddress) {
        <p class="order-card__address">📍 {{ deliveryAddress }}</p>
      }

      <div class="order-card__footer">
        <div class="order-card__footer-left">
          <span class="order-card__total">{{ order.total | currency: "ILS" }}</span>
          <span class="order-card__payment" [class]="'order-card__payment--' + (order.paymentStatus ?? 'cash_on_delivery')">
            {{ paymentLabel }}
          </span>
        </div>
        @if (actionLabel) {
          <button class="btn btn-primary order-card__action" type="button" (click)="action.emit()">
            {{ actionLabel }}
          </button>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .order-card {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1rem;
        font-family: var(--font-family);
      }
      .order-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .order-card__number {
        font-weight: 800;
        font-size: 0.88rem;
        color: var(--color-text);
      }
      .order-card__time {
        font-size: 0.78rem;
        color: var(--color-text-muted);
      }
      .order-card__customer-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .order-card__customer {
        font-weight: 700;
        font-size: 0.95rem;
      }
      .order-card__phone {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
        background: var(--color-primary-light);
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        white-space: nowrap;
        transition: background 0.12s;
      }
      .order-card__phone:hover {
        background: #fca89a;
      }
      .order-card__items {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        color: var(--color-text-muted);
        font-size: 0.82rem;
      }
      .order-card__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .order-card__fulfillment {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
      .order-card__address {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-text);
        background: var(--color-bg);
        border-radius: var(--radius-sm);
        padding: 0.4rem 0.6rem;
      }
      .order-card__status {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        background: var(--color-bg);
        color: var(--color-text-muted);
        white-space: nowrap;
      }
      .order-card__status--ready {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .order-card__status--cancelled {
        background: #f0f0f0;
        color: #9a9a9a;
        text-decoration: line-through;
      }
      .order-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-top: 0.2rem;
        padding-top: 0.6rem;
        border-top: 1px solid var(--color-border);
      }
      .order-card__footer-left {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .order-card__total {
        font-weight: 800;
        color: var(--color-primary);
      }
      .order-card__payment {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        width: fit-content;
      }
      .order-card__payment--paid {
        background: #d1fae5;
        color: #065f46;
      }
      .order-card__payment--cash_on_delivery {
        background: #fef3c7;
        color: #92400e;
      }
      .order-card__payment--pending {
        background: #f3f4f6;
        color: #6b7280;
      }
      .order-card__action {
        padding: 0.45rem 0.9rem;
        font-size: 0.8rem;
        white-space: nowrap;
      }
    `,
  ],
})
export class OrderCardComponent {
  @Input({ required: true }) order!: Order;
  @Input() stage: OrderCardStage = "completed";
  @Output() action = new EventEmitter<void>();

  get customerName(): string {
    const guestName = this.order.guestInfo?.name;
    if (guestName) return guestName;
    const user = this.order.user;
    if (user && typeof user === "object" && "name" in user) {
      return user.name;
    }
    return "לקוח";
  }

  get customerPhone(): string | null {
    const guestPhone = this.order.guestInfo?.phone;
    if (guestPhone) return guestPhone;
    const user = this.order.user;
    if (user && typeof user === "object" && "phone" in user) {
      return (user as { phone?: string }).phone ?? null;
    }
    return null;
  }

  get statusLabel(): string {
    return getOrderStatusLabel(this.order);
  }

  /** Primary action button text — differs for pickup vs. delivery orders. */
  get actionLabel(): string | null {
    const isDelivery = this.order.fulfillment?.type === "delivery";
    if (this.stage === "new") {
      return isDelivery ? "יצא למשלוח" : "מוכן לאיסוף";
    }
    if (this.stage === "waiting") {
      return isDelivery ? "נמסר ללקוח" : "נאסף / בוצע";
    }
    return null;
  }

  /** Delivery address, shown only for delivery orders so staff can prep the run. */
  get deliveryAddress(): string | null {
    if (this.order.fulfillment?.type !== "delivery") return null;
    return this.order.fulfillment.deliveryAddress ?? null;
  }

  get paymentLabel(): string {
    switch (this.order.paymentStatus) {
      case "paid":
        return "✓ שולם";
      case "cash_on_delivery":
        return "💵 תשלום באיסוף";
      case "pending":
        return "⏳ ממתין לתשלום";
      default:
        return "💵 תשלום באיסוף";
    }
  }

  get fulfillmentLabel(): string {
    switch (this.order.fulfillment.type) {
      case "delivery":
        return "משלוח";
      case "dine_in":
        return "ישיבה במקום";
      case "pickup":
        return this.order.fulfillment.pickupLocation === "jerusalem"
          ? "איסוף · ירושלים"
          : this.order.fulfillment.pickupLocation === "bnei_brak"
            ? "איסוף · בני ברק"
            : "איסוף עצמי";
      default:
        return "";
    }
  }
}
