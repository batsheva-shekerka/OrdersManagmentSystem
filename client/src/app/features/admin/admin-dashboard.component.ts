import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { OrderService } from "../../core/services/order.service";
import { OrderCardComponent } from "./order-card.component";

/**
 * Staff Kanban dashboard: three workflow columns backed by OrderService,
 * which owns loading, live socket updates, and status transitions. This
 * component only renders state and forwards button clicks.
 */
@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, OrderCardComponent],
  template: `
    <div class="dashboard">
      <header class="dashboard__header">
        <h1>לוח ניהול הזמנות</h1>
        <p class="dashboard__subtitle">מעקב בזמן אמת אחר כל ההזמנות הנכנסות</p>
      </header>

      @if (orderService.loading()) {
        <p class="dashboard__state">טוען הזמנות...</p>
      } @else {
        <div class="board">
          <section class="column">
            <header class="column__header">
              <h2>הזמנות חדשות</h2>
              <span class="column__count">{{ orderService.newOrders().length }}</span>
            </header>
            <div class="column__body">
              @if (orderService.newOrders().length === 0) {
                <p class="column__empty">אין הזמנות חדשות כרגע</p>
              }
              @for (order of orderService.newOrders(); track order._id) {
                <app-order-card
                  [order]="order"
                  stage="new"
                  (action)="orderService.markReadyForPickup(order)"
                />
              }
            </div>
          </section>

          <section class="column column--waiting">
            <header class="column__header">
              <h2>ממתינות לאיסוף</h2>
              <span class="column__count">{{ orderService.waitingPickupOrders().length }}</span>
            </header>
            <div class="column__body">
              @if (orderService.waitingPickupOrders().length === 0) {
                <p class="column__empty">אין הזמנות ממתינות</p>
              }
              @for (order of orderService.waitingPickupOrders(); track order._id) {
                <app-order-card
                  [order]="order"
                  stage="waiting"
                  (action)="orderService.markPickedUp(order)"
                />
              }
            </div>
          </section>

          <section class="column column--completed">
            <header class="column__header">
              <h2>הושלמו</h2>
              <span class="column__count">{{ orderService.completedOrders().length }}</span>
            </header>
            <div class="column__body">
              @if (orderService.completedOrders().length === 0) {
                <p class="column__empty">אין הזמנות שהושלמו עדיין</p>
              }
              @for (order of orderService.completedOrders(); track order._id) {
                <app-order-card [order]="order" stage="completed" />
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard {
        max-width: 1400px;
        margin: 0 auto;
        font-family: var(--font-family);
        color: var(--color-text);
      }
      .dashboard__header {
        margin-bottom: 1.75rem;
      }
      .dashboard__header h1 {
        margin: 0 0 0.35rem;
        font-size: 1.6rem;
        font-weight: 800;
      }
      .dashboard__subtitle {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.9rem;
      }
      .dashboard__state {
        text-align: center;
        color: var(--color-text-muted);
        margin-top: 3rem;
      }

      .board {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.25rem;
        align-items: start;
      }

      .column {
        background: rgba(0, 0, 0, 0.015);
        border: 1px solid var(--color-border);
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        max-height: calc(100vh - 220px);
      }
      .column__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem 1.1rem;
        border-bottom: 1px solid var(--color-border);
      }
      .column__header h2 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
      }
      .column__count {
        min-width: 1.6rem;
        height: 1.6rem;
        padding: 0 0.4rem;
        border-radius: 999px;
        background: var(--color-bg);
        color: var(--color-text-muted);
        font-size: 0.8rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .column--waiting .column__header {
        border-bottom-color: var(--color-primary);
      }
      .column--waiting .column__header h2 {
        color: var(--color-primary);
      }
      .column--waiting .column__count {
        background: var(--color-primary);
        color: #fff;
      }

      .column__body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;

        /* Firefox */
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
      }
      /* Chrome / Safari / Edge */
      .column__body::-webkit-scrollbar {
        width: 6px;
      }
      .column__body::-webkit-scrollbar-track {
        background: transparent;
      }
      .column__body::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 999px;
      }
      .column__body::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.28);
      }
      .column__empty {
        text-align: center;
        color: var(--color-text-muted);
        font-size: 0.85rem;
        margin: 1.5rem 0;
      }

      @media (max-width: 960px) {
        .board {
          grid-template-columns: 1fr;
        }
        .column {
          max-height: none;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  protected orderService = inject(OrderService);

  ngOnInit(): void {
    this.orderService.init();
  }
}
