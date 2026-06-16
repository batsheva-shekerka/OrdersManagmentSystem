import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../core/services/api.service";
import { Order } from "../../core/models/order.model";

interface OrdersResponse {
  success: boolean;
  data: Order[];
}

@Component({
  selector: "app-orders",
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>My Orders</h1>
    @if (loading()) {
      <p>Loading...</p>
    } @else if (orders().length === 0) {
      <p>You have no orders yet.</p>
    } @else {
      <ul>
        @for (order of orders(); track order._id) {
          <li>
            <strong>{{ order.orderNumber }}</strong> — {{ order.status }} —
            {{ order.total | currency: "ILS" }}
          </li>
        }
      </ul>
    }
  `,
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);

  orders = signal<Order[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<OrdersResponse>("/orders/mine").subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
