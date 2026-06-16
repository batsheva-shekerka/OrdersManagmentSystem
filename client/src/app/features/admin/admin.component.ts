import { Component, OnDestroy, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subscription } from "rxjs";
import { ApiService } from "../../core/services/api.service";
import { SocketService } from "../../core/services/socket.service";
import { Order, OrderStatus } from "../../core/models/order.model";

interface OrdersResponse {
  success: boolean;
  data: Order[];
}

interface OrderResponse {
  success: boolean;
  data: Order;
}

@Component({
  selector: "app-admin",
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Admin — Incoming Orders</h1>
    @if (orders().length === 0) {
      <p>No orders.</p>
    } @else {
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Total</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (order of orders(); track order._id) {
            <tr>
              <td>{{ order.orderNumber }}</td>
              <td>{{ order.total | currency: "ILS" }}</td>
              <td>{{ order.status }}</td>
              <td>
                <button (click)="advance(order, 'in_preparation')">
                  Preparing
                </button>
                <button (click)="advance(order, 'ready')">Ready</button>
                <button (click)="advance(order, 'delivered')">Delivered</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private socket = inject(SocketService);

  orders = signal<Order[]>([]);
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.load();
    this.socket.joinAdmin();
    this.subs.push(
      this.socket.onOrderNew().subscribe((order) =>
        this.orders.update((list) => [order, ...list])
      ),
      this.socket.onOrderStatusChanged().subscribe((updated) =>
        this.orders.update((list) =>
          list.map((o) => (o._id === updated._id ? updated : o))
        )
      )
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  load(): void {
    this.api.get<OrdersResponse>("/orders").subscribe((res) => {
      this.orders.set(res.data);
    });
  }

  advance(order: Order, status: OrderStatus): void {
    this.api
      .patch<OrderResponse>(`/orders/${order._id}/status`, { status })
      .subscribe((res) => {
        this.orders.update((list) =>
          list.map((o) => (o._id === res.data._id ? res.data : o))
        );
      });
  }
}
