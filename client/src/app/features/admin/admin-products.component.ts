import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProductService } from "../../core/services/product.service";
import { CategoryService } from "../../core/services/category.service";
import { Product } from "../../core/models/product.model";
import { AdminProductCardComponent } from "./admin-product-card.component";
import { ProductFormModalComponent } from "./product-form-modal.component";

/**
 * Staff "Menu Management" page: search + grid of admin product cards, and
 * the add/edit modal. All data flows through `ProductService`/`CategoryService`
 * — toggling availability or deleting here updates the same `Product`
 * documents the storefront reads, so changes are reflected to customers
 * immediately (no separate "admin copy" of the catalog).
 */
@Component({
  selector: "app-admin-products",
  standalone: true,
  imports: [CommonModule, AdminProductCardComponent, ProductFormModalComponent],
  template: `
    <div class="admin-products">
      <header class="admin-products__header">
        <div>
          <h1>ניהול תפריט</h1>
          <p class="admin-products__subtitle">הוספה, עריכה וניהול זמינות של מוצרי התפריט</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="openCreate()">+ הוספת מוצר חדש</button>
      </header>

      <div class="admin-products__toolbar">
        <input
          type="text"
          class="admin-products__search"
          placeholder="חיפוש מוצר לפי שם..."
          [value]="searchTerm()"
          (input)="searchTerm.set($any($event.target).value)"
        />
      </div>

      @if (productService.loading()) {
        <p class="admin-products__state">טוען מוצרים...</p>
      } @else if (filteredProducts().length === 0) {
        <p class="admin-products__state">לא נמצאו מוצרים.</p>
      } @else {
        <div class="admin-products__grid">
          @for (product of filteredProducts(); track product._id) {
            <app-admin-product-card
              [product]="product"
              (edit)="openEdit(product)"
              (remove)="deleteProduct(product)"
              (toggleAvailability)="toggleAvailability(product)"
            />
          }
        </div>
      }
    </div>

    <app-product-form-modal
      [open]="isModalOpen()"
      [categories]="categoryService.all()"
      [product]="editingProduct()"
      (close)="closeModal()"
      (saved)="onSaved()"
    />
  `,
  styles: [
    `
      .admin-products {
        max-width: 1400px;
        margin: 0 auto;
        font-family: var(--font-family);
        color: var(--color-text);
      }
      .admin-products__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .admin-products__header h1 {
        margin: 0 0 0.35rem;
        font-size: 1.6rem;
        font-weight: 800;
      }
      .admin-products__subtitle {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.9rem;
      }
      .admin-products__toolbar {
        margin-bottom: 1.5rem;
      }
      .admin-products__search {
        width: 100%;
        max-width: 360px;
        padding: 0.65rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-family: var(--font-family);
        background: var(--color-surface);
        color: var(--color-text);
      }
      .admin-products__search:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .admin-products__state {
        text-align: center;
        color: var(--color-text-muted);
        margin-top: 3rem;
      }
      .admin-products__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1.25rem;
      }
    `,
  ],
})
export class AdminProductsComponent implements OnInit {
  protected productService = inject(ProductService);
  protected categoryService = inject(CategoryService);

  searchTerm = signal("");
  isModalOpen = signal(false);
  editingProduct = signal<Product | null>(null);

  filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.productService.all();
    if (!term) return all;
    return all.filter((p) => p.name.toLowerCase().includes(term));
  });

  ngOnInit(): void {
    this.productService.loadAll();
    this.categoryService.loadAll();
  }

  openCreate(): void {
    this.editingProduct.set(null);
    this.isModalOpen.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  onSaved(): void {
    this.closeModal();
  }

  deleteProduct(product: Product): void {
    if (!confirm(`למחוק את "${product.name}"? פעולה זו אינה הפיכה.`)) return;
    this.productService.remove(product._id).subscribe();
  }

  toggleAvailability(product: Product): void {
    this.productService.toggleAvailability(product).subscribe();
  }
}
