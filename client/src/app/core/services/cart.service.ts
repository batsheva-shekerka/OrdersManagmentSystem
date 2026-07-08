import { Injectable, computed, signal } from "@angular/core";
import { Product } from "../models/product.model";

export interface CartLine {
  product: Product;
  quantity: number;
}

@Injectable({ providedIn: "root" })
export class CartService {
  private lines = signal<CartLine[]>([]);
  readonly items = this.lines.asReadonly();

  readonly count = computed(() =>
    this.lines().reduce((sum, line) => sum + line.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.lines().reduce(
      (sum, line) => sum + line.product.price * line.quantity,
      0
    )
  );

  add(product: Product, quantity = 1): void {
    const existing = this.lines().find((l) => l.product._id === product._id);
    if (existing) {
      this.lines.update((lines) =>
        lines.map((l) =>
          l.product._id === product._id
            ? { ...l, quantity: l.quantity + quantity }
            : l
        )
      );
    } else {
      this.lines.update((lines) => [...lines, { product, quantity }]);
    }
  }

  remove(productId: string): void {
    this.lines.update((lines) =>
      lines.filter((l) => l.product._id !== productId)
    );
  }

  /** Current quantity of a product in the cart (0 if absent). Used by quantity steppers. */
  quantityOf(productId: string): number {
    return this.lines().find((l) => l.product._id === productId)?.quantity ?? 0;
  }

  /** Decrease quantity by one; removes the line entirely once it reaches zero. */
  decrement(productId: string): void {
    const line = this.lines().find((l) => l.product._id === productId);
    if (!line) return;
    if (line.quantity <= 1) {
      this.remove(productId);
    } else {
      this.lines.update((lines) =>
        lines.map((l) =>
          l.product._id === productId ? { ...l, quantity: l.quantity - 1 } : l
        )
      );
    }
  }

  clear(): void {
    this.lines.set([]);
  }

  toOrderItems(): { product: string; quantity: number }[] {
    return this.lines().map((l) => ({
      product: l.product._id,
      quantity: l.quantity,
    }));
  }
}
