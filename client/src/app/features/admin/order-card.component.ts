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
      <div class="order-card__body">
        <div class="order-card__top">
          <div class="order-card__id-block">
            <span class="order-card__number">{{ order.orderNumber }}</span>
            @if (order.createdAt) {
              <span class="order-card__time">{{ order.createdAt | date: "HH:mm" }}</span>
            }
          </div>
          <span class="order-card__type-badge" [class]="'order-card__type-badge--' + order.fulfillment.type">
            {{ fulfillmentLabel }}
          </span>
        </div>

        <div class="order-card__customer">
          <span class="order-card__customer-name">{{ customerName }}</span>
          @if (customerPhone) {
            <a class="order-card__phone" [href]="'tel:' + customerPhone">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.46 16z"/></svg>
              {{ customerPhone }}
            </a>
          }
        </div>

        @if (deliveryAddress) {
          <p class="order-card__address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ deliveryAddress }}
          </p>
        }

        <ul class="order-card__items">
          @for (item of order.items; track item._id; let last = $last) {
            <li class="order-card__item" [class.order-card__item--divider]="!last">
              <span class="order-card__item-qty">{{ item.quantity }}×</span>
              <span class="order-card__item-name">{{ item.name }}</span>
            </li>
          }
        </ul>

        <div class="order-card__bottom-row">
          <div class="order-card__price-block">
            <span class="order-card__total">{{ order.total | currency: "ILS" }}</span>
            <span
              class="order-card__payment-badge"
              [class]="'order-card__payment-badge--' + (order.paymentStatus ?? 'cash_on_delivery')"
            >
              {{ paymentLabel }}
            </span>
          </div>
          <span class="order-card__status-badge" [class]="'order-card__status-badge--' + order.status">
            {{ statusLabel }}
          </span>
        </div>
      </div>

      @if (actionLabel) {
        <button class="order-card__action" type="button" (click)="action.emit()">
          {{ actionLabel }}
        </button>
      }
    </article>
  `,
  styles: [
    `
      .order-card {
        display: flex;
        flex-direction: column;
        background: var(--color-surface);
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        font-family: var(--font-family);
        transition: box-shadow 0.2s ease, transform 0.15s ease;
      }
      .order-card:hover {
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .order-card__body {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        padding: 1rem 1.1rem;
      }

      /* ── Top row: id + type badge ── */
      .order-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .order-card__id-block {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .order-card__number {
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        color: var(--color-text-muted);
      }
      .order-card__time {
        font-size: 0.7rem;
        color: var(--color-text-muted);
        opacity: 0.75;
      }
      .order-card__type-badge {
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        white-space: nowrap;
      }
      .order-card__type-badge--delivery {
        background: #eff6ff;
        color: #1d4ed8;
      }
      .order-card__type-badge--pickup {
        background: #f5f3ff;
        color: #6d28d9;
      }
      .order-card__type-badge--dine_in {
        background: #ecfeff;
        color: #0e7490;
      }

      /* ── Customer ── */
      .order-card__customer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .order-card__customer-name {
        font-weight: 800;
        font-size: 1.05rem;
        color: var(--color-text);
      }
      .order-card__phone {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-text-muted);
        text-decoration: none;
        transition: color 0.15s;
      }
      .order-card__phone:hover {
        color: var(--color-text);
      }
      .order-card__phone svg {
        flex-shrink: 0;
        opacity: 0.7;
      }

      /* ── Address ── */
      .order-card__address {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--color-text);
        background: var(--color-bg);
        border-radius: 8px;
        padding: 0.45rem 0.65rem;
      }
      .order-card__address svg {
        flex-shrink: 0;
        color: var(--color-text-muted);
      }

      /* ── Items ── */
      .order-card__items {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
      }
      .order-card__item {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        padding: 0.35rem 0;
        font-size: 0.85rem;
        color: var(--color-text);
      }
      .order-card__item--divider {
        border-bottom: 1px dashed var(--color-border);
      }
      .order-card__item-qty {
        font-weight: 800;
        color: var(--color-primary);
        min-width: 1.6rem;
      }
      .order-card__item-name {
        flex: 1;
      }

      /* ── Bottom row: price + status ── */
      .order-card__bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 0.15rem;
        padding-top: 0.65rem;
        border-top: 1px solid var(--color-border);
      }
      .order-card__price-block {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .order-card__total {
        font-size: 1.05rem;
        font-weight: 800;
        color: var(--color-text);
      }
      .order-card__payment-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.16rem 0.5rem;
        border-radius: 999px;
        width: fit-content;
      }
      .order-card__payment-badge--paid {
        background: #d1fae5;
        color: #065f46;
      }
      .order-card__payment-badge--cash_on_delivery {
        background: #fef3c7;
        color: #92400e;
      }
      .order-card__payment-badge--pending {
        background: #f3f4f6;
        color: #6b7280;
      }

      .order-card__status-badge {
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.22rem 0.6rem;
        border-radius: 999px;
        background: var(--color-bg);
        color: var(--color-text-muted);
        white-space: nowrap;
      }
      .order-card__status-badge--ready {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .order-card__status-badge--delivered {
        background: #d1fae5;
        color: #065f46;
      }
      .order-card__status-badge--cancelled {
        background: #f3f4f6;
        color: #9a9a9a;
        text-decoration: line-through;
      }

      /* ── Action button: always pinned full-width at the very bottom ── */
      .order-card__action {
        border: none;
        width: 100%;
        padding: 0.8rem 1rem;
        background: var(--color-primary);
        color: var(--color-text-on-primary);
        font-family: var(--font-family);
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.15s;
      }
      .order-card__action:hover {
        background: var(--color-primary-dark);
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
        return "שולם";
      case "cash_on_delivery":
        return "תשלום באיסוף";
      case "pending":
        return "ממתין לתשלום";
      default:
        return "תשלום באיסוף";
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
