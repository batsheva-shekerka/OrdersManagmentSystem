import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { Order } from "../../core/models/order.model";

interface OrderResponse {
  success: boolean;
  data: Order;
}

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <h1>Checkout</h1>
    @if (cart.items().length === 0) {
      <p>Your cart is empty.</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Fulfillment
          <select formControlName="type">
            <option value="delivery">Delivery</option>
            <option value="dine_in">Dine-in</option>
            <option value="pickup">Pickup</option>
          </select>
        </label>

        @if (form.value.type === "delivery") {
          <label>Address <input formControlName="deliveryAddress" /></label>
        }

        <fieldset>
          <legend>Guest details (skip if logged in)</legend>
          <label>Name <input formControlName="guestName" /></label>
          <label>Phone <input formControlName="guestPhone" /></label>
        </fieldset>

        <button type="submit" [disabled]="submitting()">Place order</button>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    }
  `,
  styles: [
    `
      form {
        display: grid;
        gap: 0.75rem;
        max-width: 360px;
      }
      .error {
        color: var(--brand);
      }
    `,
  ],
})
export class CheckoutComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  cart = inject(CartService);

  submitting = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    type: ["delivery", Validators.required],
    deliveryAddress: [""],
    guestName: [""],
    guestPhone: [""],
  });

  submit(): void {
    this.submitting.set(true);
    this.error.set(null);

    const value = this.form.getRawValue();
    const payload = {
      items: this.cart.toOrderItems(),
      fulfillment: {
        type: value.type as "delivery" | "dine_in" | "pickup",
        deliveryAddress: value.deliveryAddress || undefined,
      },
      guestInfo: value.guestName
        ? { name: value.guestName, phone: value.guestPhone }
        : undefined,
    };

    this.api.post<OrderResponse>("/orders", payload).subscribe({
      next: (res) => {
        this.cart.clear();
        this.router.navigate(["/orders"]);
        console.log("Order placed:", res.data.orderNumber);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? "Failed to place order");
        this.submitting.set(false);
      },
    });
  }
}
