import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { CartService } from "../../core/services/cart.service";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Cart</h1>
    @if (cart.items().length === 0) {
      <p>Your cart is empty.</p>
    } @else {
      <ul>
        @for (line of cart.items(); track line.product._id) {
          <li>
            {{ line.product.name }} x{{ line.quantity }} —
            {{ line.product.price * line.quantity | currency: "ILS" }}
            <button (click)="cart.remove(line.product._id)">Remove</button>
          </li>
        }
      </ul>
      <p class="total">Subtotal: {{ cart.subtotal() | currency: "ILS" }}</p>
      <a routerLink="/checkout"><button>Proceed to checkout</button></a>
    }
  `,
})
export class CartComponent {
  cart = inject(CartService);
}
