import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Category } from "../../core/models/category.model";
import { Product } from "../../core/models/product.model";
import { ProductFormPayload, ProductService } from "../../core/services/product.service";
import { resolveAssetUrl } from "../../core/utils/asset-url";

/**
 * Centered add/edit product modal (reuses the same backdrop/pop-in visual
 * language as `auth-modal.component.ts`, single-column instead of split).
 * `product` being `null` means "create" mode; any other value means "edit".
 */
@Component({
  selector: "app-product-form-modal",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="close.emit()"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal__close" type="button" (click)="close.emit()" aria-label="סגירה">✕</button>

        <h2 class="modal__title">{{ isEditing ? "עריכת מוצר" : "הוספת מוצר חדש" }}</h2>

        <form [formGroup]="form" (ngSubmit)="submit()" class="product-form">
          <label class="product-form__field">
            <span>שם המוצר</span>
            <input type="text" formControlName="name" placeholder="לדוגמה: פיצה שווארמה" />
          </label>

          <label class="product-form__field">
            <span>קטגוריה</span>
            <select formControlName="category">
              <option value="" disabled>בחרו קטגוריה</option>
              @for (category of categories; track category._id) {
                <option [value]="category._id">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="product-form__field">
            <span>תיאור</span>
            <textarea formControlName="description" rows="3" placeholder="תיאור קצר ומפתה של המוצר"></textarea>
          </label>

          <label class="product-form__field">
            <span>מחיר (₪)</span>
            <input type="number" formControlName="price" min="0" step="0.5" />
          </label>

          <div class="product-form__field">
            <span>תמונה</span>
            <div class="image-picker">
              @if (previewUrl) {
                <div class="image-picker__preview" [style.background-image]="'url(' + previewUrl + ')'"></div>
              }
              <div class="image-picker__inputs">
                <label class="file-btn">
                  <input type="file" accept="image/png,image/jpeg,image/webp" (change)="onFileSelected($event)" />
                  העלאת קובץ
                </label>
                <input
                  type="text"
                  formControlName="imageUrl"
                  placeholder="או הדביקו כתובת URL לתמונה"
                  (input)="onImageUrlTyped()"
                />
              </div>
            </div>
          </div>

          @if (error()) {
            <p class="product-form__error">{{ error() }}</p>
          }

          <div class="product-form__actions">
            <button type="button" class="btn btn-secondary" (click)="close.emit()">ביטול</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              {{ saving() ? "שומר..." : "שמירה" }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1300;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1301;
        width: min(520px, 92vw);
        max-height: 90vh;
        overflow-y: auto;
        background: var(--color-bg);
        box-shadow: var(--shadow-md);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
        padding: 2.25rem 2rem;
        animation: popIn 0.2s ease;
      }
      @keyframes popIn {
        from { opacity: 0; transform: translate(-50%, -48%) scale(0.97); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      .modal__close {
        position: absolute;
        top: 0.75rem;
        left: 0.9rem;
        border: none;
        background: transparent;
        font-size: 1.1rem;
        cursor: pointer;
        color: var(--color-text-muted);
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
      }
      .modal__close:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .modal__title {
        margin: 0 0 1.5rem;
        font-size: 1.25rem;
        font-weight: 800;
        text-align: center;
      }

      .product-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .product-form__field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--color-text-muted);
      }
      .product-form__field input[type="text"],
      .product-form__field input[type="number"],
      .product-form__field select,
      .product-form__field textarea {
        width: 100%;
        padding: 0.65rem 0.85rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-family: var(--font-family);
        background: var(--color-surface);
        color: var(--color-text);
        resize: vertical;
      }
      .product-form__field input:focus,
      .product-form__field select:focus,
      .product-form__field textarea:focus {
        outline: none;
        border-color: var(--color-primary);
      }

      .image-picker {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }
      .image-picker__preview {
        width: 64px;
        height: 64px;
        flex-shrink: 0;
        border-radius: var(--radius-sm);
        background-color: var(--color-border);
        background-size: cover;
        background-position: center;
      }
      .image-picker__inputs {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .file-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 0.9rem;
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--color-text-muted);
        cursor: pointer;
        background: var(--color-surface);
      }
      .file-btn:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
      .file-btn input[type="file"] {
        display: none;
      }
      .image-picker__inputs input[type="text"] {
        padding: 0.5rem 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.82rem;
        font-family: var(--font-family);
      }

      .product-form__error {
        margin: 0;
        color: var(--color-primary);
        font-size: 0.82rem;
        text-align: center;
      }
      .product-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
      .btn-secondary {
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text);
        padding: 0.6rem 1.2rem;
        border-radius: var(--radius-sm);
        font-weight: 600;
        cursor: pointer;
        font-family: var(--font-family);
      }
      .btn-secondary:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    `,
  ],
})
export class ProductFormModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  @Input() open = false;
  @Input() categories: Category[] = [];
  @Input() product: Product | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Product>();

  saving = signal(false);
  error = signal("");
  previewUrl: string | null = null;
  private selectedFile: File | null = null;

  form = this.fb.nonNullable.group({
    name: ["", Validators.required],
    category: ["", Validators.required],
    description: [""],
    price: [0, [Validators.required, Validators.min(0)]],
    imageUrl: [""],
  });

  get isEditing(): boolean {
    return !!this.product;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["open"] && this.open) {
      this.resetForm();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    if (file) {
      this.previewUrl = URL.createObjectURL(file);
      this.form.patchValue({ imageUrl: "" });
    }
  }

  onImageUrlTyped(): void {
    const url = this.form.controls.imageUrl.value;
    if (url) {
      this.selectedFile = null;
      this.previewUrl = url;
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set("");

    const raw = this.form.getRawValue();
    const payload: ProductFormPayload = {
      name: raw.name,
      description: raw.description,
      price: Number(raw.price),
      category: raw.category,
      imageUrl: raw.imageUrl || undefined,
      imageFile: this.selectedFile,
    };

    const request$ = this.product
      ? this.productService.update(this.product._id, payload)
      : this.productService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saved.emit(res.data);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message ?? "שגיאה בשמירת המוצר, נסו שוב.");
      },
    });
  }

  private resetForm(): void {
    this.selectedFile = null;
    this.previewUrl = this.product?.imageUrl ? resolveAssetUrl(this.product.imageUrl) : null;
    this.error.set("");
    this.form.reset({
      name: this.product?.name ?? "",
      category: this.extractCategoryId(this.product?.category),
      description: this.product?.description ?? "",
      price: this.product?.price ?? 0,
      imageUrl: this.product?.imageUrl ?? "",
    });
  }

  private extractCategoryId(category?: Category | string): string {
    if (!category) return "";
    return typeof category === "string" ? category : category._id;
  }
}
