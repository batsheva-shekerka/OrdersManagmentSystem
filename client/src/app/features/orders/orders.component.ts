import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import { Order } from "../../core/models/order.model";
import { getOrderStatusLabel } from "../../core/services/order.service";

interface OrdersResponse {
  success: boolean;
  data: Order[];
}

/**
 * Customer's own order history. In addition to the initial `GET
 * /orders/mine` fetch, each loaded order joins its own Socket.IO room
 * (`order:{id}`) so that when staff update its status from the admin
 * dashboard, this page updates live without a refresh.
 */
@Component({
  selector: "app-orders",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orders-page">

      <!-- Header -->
      <div class="orders-header">
        <div>
          <h1 class="orders-header__title">ההזמנות שלי</h1>
          @if (!loading() && orders().length > 0) {
            <p class="orders-header__sub">{{ orders().length }} הזמנות בסך הכל</p>
          }
        </div>
      </div>

      <!-- Loading skeleton -->
      @if (loading()) {
        <div class="orders-list">
          @for (i of [1,2,3]; track i) {
            <div class="order-card order-card--skeleton">
              <div class="skeleton-line skeleton-line--wide"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line skeleton-line--narrow"></div>
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @else if (orders().length === 0) {
        <div class="empty-state">
          <div class="empty-state__icon">🛍️</div>
          <h2 class="empty-state__title">עדיין אין הזמנות</h2>
          <p class="empty-state__text">כשתבצעו הזמנה ראשונה היא תופיע כאן</p>
        </div>
      }

      <!-- Order cards -->
      @else {
        <div class="orders-list">
          @for (order of orders(); track order._id) {
            <article class="order-card">

              <!-- Card top strip: status color bar -->
              <div class="order-card__strip" [class]="'order-card__strip--' + order.status"></div>

              <div class="order-card__body">

                <!-- Row 1: number + date + status badge -->
                <div class="order-card__top">
                  <div class="order-card__meta">
                    <span class="order-card__number">{{ order.orderNumber }}</span>
                    @if (order.createdAt) {
                      <span class="order-card__date">{{ order.createdAt | date:'d/M/yy, HH:mm' }}</span>
                    }
                  </div>
                  <span class="order-card__status-badge" [class]="'order-card__status-badge--' + order.status">
                    {{ getOrderStatusLabel(order) }}
                  </span>
                </div>

                <!-- Row 2: items list -->
                <ul class="order-card__items">
                  @for (item of order.items; track item._id) {
                    <li class="order-card__item">
                      <span class="order-card__item-qty">{{ item.quantity }}×</span>
                      <span class="order-card__item-name">{{ item.name }}</span>
                      <span class="order-card__item-price">{{ item.unitPrice * item.quantity | currency:'ILS' }}</span>
                    </li>
                  }
                </ul>

                <!-- Row 3: fulfillment + payment pill -->
                <div class="order-card__badges">
                  <span class="order-card__fulfillment">{{ getFulfillmentLabel(order) }}</span>
                  <span class="order-card__payment" [class]="'order-card__payment--' + (order.paymentStatus ?? 'cash_on_delivery')">
                    {{ getPaymentLabel(order.paymentStatus) }}
                  </span>
                </div>

                <!-- Row 4: points + total -->
                <div class="order-card__footer">
                  <div class="order-card__points-row">
                    @if (order.pointsEarned > 0) {
                      <span class="order-card__points-earned">+{{ order.pointsEarned }} נקודות נצברו</span>
                    }
                    @if (order.pointsRedeemed > 0) {
                      <span class="order-card__points-redeemed">{{ order.pointsRedeemed }} נקודות מומשו</span>
                    }
                  </div>
                  <span class="order-card__total">{{ order.total | currency:'ILS' }}</span>
                </div>

              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      /* ── Page shell ── */
      .orders-page {
        max-width: 680px;
        margin: 0 auto;
        padding: 2rem 1rem 4rem;
        font-family: var(--font-family);
        color: var(--color-text);
      }

      /* ── Header ── */
      .orders-header {
        margin-bottom: 1.75rem;
      }
      .orders-header__title {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0 0 0.2rem;
      }
      .orders-header__sub {
        margin: 0;
        font-size: 0.85rem;
        color: var(--color-text-muted);
      }

      /* ── List ── */
      .orders-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      /* ── Card ── */
      .order-card {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
        border: 1px solid var(--color-border);
      }

      /* Colored top strip by status */
      .order-card__strip {
        height: 4px;
        background: var(--color-border);
      }
      .order-card__strip--pending        { background: #e2a900; }
      .order-card__strip--in_preparation { background: #3b82f6; }
      .order-card__strip--ready          { background: var(--color-primary); }
      .order-card__strip--delivered      { background: #1a9e5c; }
      .order-card__strip--cancelled      { background: #d1d5db; }

      .order-card__body {
        padding: 1.1rem 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      /* Top row */
      .order-card__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.75rem;
      }
      .order-card__meta {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }
      .order-card__number {
        font-weight: 800;
        font-size: 0.92rem;
        color: var(--color-text);
      }
      .order-card__date {
        font-size: 0.72rem;
        color: var(--color-text-muted);
      }

      /* Status badge */
      .order-card__status-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        white-space: nowrap;
        background: var(--color-bg);
        color: var(--color-text-muted);
        border: 1px solid var(--color-border);
      }
      .order-card__status-badge--pending        { background: #fef9e7; color: #92400e; border-color: #fde68a; }
      .order-card__status-badge--in_preparation { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
      .order-card__status-badge--ready          { background: var(--color-primary-light); color: var(--color-primary); border-color: #fca89a; }
      .order-card__status-badge--delivered      { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
      .order-card__status-badge--cancelled      { background: #f3f4f6; color: #9ca3af; border-color: #e5e7eb; text-decoration: line-through; }

      /* Items */
      .order-card__items {
        margin: 0;
        padding: 0.75rem 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        border-top: 1px solid var(--color-border);
        border-bottom: 1px solid var(--color-border);
      }
      .order-card__item {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        font-size: 0.875rem;
      }
      .order-card__item-qty {
        font-weight: 700;
        color: var(--color-primary);
        min-width: 1.5rem;
        text-align: start;
      }
      .order-card__item-name {
        flex: 1;
        color: var(--color-text);
      }
      .order-card__item-price {
        font-weight: 600;
        color: var(--color-text-muted);
        font-size: 0.8rem;
      }

      /* Badges row */
      .order-card__badges {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .order-card__fulfillment {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        background: var(--color-bg);
        color: var(--color-text-muted);
        border: 1px solid var(--color-border);
      }
      .order-card__payment {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
        white-space: nowrap;
      }
      .order-card__payment--paid             { background: #d1fae5; color: #065f46; }
      .order-card__payment--cash_on_delivery { background: #fef3c7; color: #92400e; }
      .order-card__payment--pending          { background: #f3f4f6; color: #6b7280; }

      /* Footer */
      .order-card__footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .order-card__points-row {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .order-card__points-earned {
        font-size: 0.72rem;
        font-weight: 700;
        color: #1a9e5c;
      }
      .order-card__points-redeemed {
        font-size: 0.72rem;
        color: var(--color-text-muted);
      }
      .order-card__total {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--color-primary);
      }

      /* ── Empty state ── */
      .empty-state {
        text-align: center;
        padding: 4rem 1rem;
        color: var(--color-text-muted);
      }
      .empty-state__icon {
        font-size: 3.5rem;
        margin-bottom: 1rem;
      }
      .empty-state__title {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-text);
        margin: 0 0 0.4rem;
      }
      .empty-state__text {
        margin: 0;
        font-size: 0.9rem;
      }

      /* ── Skeleton ── */
      .order-card--skeleton {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        pointer-events: none;
      }
      .skeleton-line {
        height: 14px;
        border-radius: 4px;
        background: linear-gradient(90deg, #e8e0d4 25%, #f3ede4 50%, #e8e0d4 75%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
        width: 60%;
      }
      .skeleton-line--wide   { width: 80%; }
      .skeleton-line--narrow { width: 35%; }

      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* ── Responsive ── */
      @media (max-width: 480px) {
        .order-card__top { flex-wrap: wrap; }
        .order-card__total { font-size: 1rem; }
      }
    `,
  ],
})
export class OrdersComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private socket = inject(SocketService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  getOrderStatusLabel = getOrderStatusLabel;

  getPaymentLabel(status?: string): string {
    switch (status) {
      case "paid":             return "✓ שולם";
      case "cash_on_delivery": return "💵 תשלום באיסוף";
      default:                 return "💵 תשלום באיסוף";
    }
  }

  getFulfillmentLabel(order: Order): string {
    switch (order.fulfillment?.type) {
      case "delivery": return "🛵 משלוח עד הבית";
      case "dine_in":  return "🍽️ ישיבה במקום";
      case "pickup": {
        const loc = order.fulfillment?.pickupLocation;
        if (loc === "jerusalem") return "📍 איסוף · ירושלים";
        if (loc === "bnei_brak") return "📍 איסוף · בני ברק";
        return "📍 איסוף עצמי";
      }
      default: return "";
    }
  }

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.api.get<OrdersResponse>("/orders/mine").subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
        res.data.forEach((order) => this.socket.joinOrder(order._id));
      },
      error: () => this.loading.set(false),
    });

    this.subs.push(
      this.socket.onOrderStatusChanged().subscribe((updated) => {
        this.orders.update((list) =>
          list.map((o) => (o._id === updated._id ? updated : o))
        );
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
