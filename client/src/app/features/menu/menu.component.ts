import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { Product } from "../../core/models/product.model";

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

@Component({
  selector: "app-menu",
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Menu</h1>
    @if (loading()) {
      <p>Loading products...</p>
    } @else if (products().length === 0) {
      <p>No products available yet.</p>
    } @else {
      <div class="grid">
        @for (product of products(); track product._id) {
          <article class="card">
            <h3>{{ product.name }}</h3>
            <p class="price">{{ product.price | currency: "ILS" }}</p>
            <p class="status">{{ product.status }}</p>
            <button
              [disabled]="product.status !== 'available'"
              (click)="addToCart(product)"
            >
              Add to cart
            </button>
          </article>
        }
      </div>
    }
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
      .card {
        background: #fff;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      }
      .price {
        font-weight: 700;
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  private api = inject(ApiService);
  private cart = inject(CartService);

  products = signal<Product[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.api.get<ProductsResponse>("/products").subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addToCart(product: Product): void {
    this.cart.add(product);
  }
}
