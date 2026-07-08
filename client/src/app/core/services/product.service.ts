import { Injectable, inject, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { ApiService } from "./api.service";
import { Product, ProductStatus } from "../models/product.model";

/** Form data collected by the admin add/edit product modal. */
export interface ProductFormPayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  imageFile?: File | null;
}

interface ProductsResponse {
  success: boolean;
  data: Product[];
}

interface ProductResponse {
  success: boolean;
  data: Product;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Admin product management store. `loadAll()` fetches every product
 * regardless of status via `GET /products?status=all` (an admin-only
 * listing mode) — customer-facing pages are untouched and keep using their
 * own `?status=available` fetch in `category-products.component.ts`.
 *
 * Create/update accept either a plain image URL or an uploaded `File`; when
 * a file is present the request is sent as `multipart/form-data` so the
 * backend's multer middleware can store it (see `src/utils/upload.js`).
 */
@Injectable({ providedIn: "root" })
export class ProductService {
  private api = inject(ApiService);

  private products = signal<Product[]>([]);
  readonly all = this.products.asReadonly();
  readonly loading = signal(true);

  loadAll(): void {
    this.loading.set(true);
    this.api.get<ProductsResponse>("/products", { status: "all" }).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(payload: ProductFormPayload): Observable<ProductResponse> {
    return this.api.post<ProductResponse>("/products", this.buildBody(payload)).pipe(
      tap((res) => this.products.update((list) => [res.data, ...list]))
    );
  }

  update(id: string, payload: ProductFormPayload): Observable<ProductResponse> {
    return this.api.put<ProductResponse>(`/products/${id}`, this.buildBody(payload)).pipe(
      tap((res) =>
        this.products.update((list) =>
          list.map((p) => (p._id === res.data._id ? res.data : p))
        )
      )
    );
  }

  remove(id: string): Observable<DeleteResponse> {
    return this.api.delete<DeleteResponse>(`/products/${id}`).pipe(
      tap(() => this.products.update((list) => list.filter((p) => p._id !== id)))
    );
  }

  /** Flips between "available" and "out_of_stock" — instantly reflected to customers, who filter on this same status field. */
  toggleAvailability(product: Product): Observable<ProductResponse> {
    const nextStatus: ProductStatus =
      product.status === "available" ? "out_of_stock" : "available";
    return this.api
      .put<ProductResponse>(`/products/${product._id}`, { status: nextStatus })
      .pipe(
        tap((res) =>
          this.products.update((list) =>
            list.map((p) => (p._id === res.data._id ? res.data : p))
          )
        )
      );
  }

  private buildBody(payload: ProductFormPayload): FormData | Record<string, unknown> {
    if (payload.imageFile) {
      const form = new FormData();
      form.append("name", payload.name);
      form.append("price", String(payload.price));
      form.append("category", payload.category);
      form.append("description", payload.description ?? "");
      form.append("image", payload.imageFile);
      return form;
    }
    return {
      name: payload.name,
      description: payload.description ?? "",
      price: payload.price,
      category: payload.category,
      ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
    };
  }
}
