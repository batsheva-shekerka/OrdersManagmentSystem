import { Injectable, signal } from "@angular/core";

/**
 * Pure UI state for the cart drawer (open/closed). Deliberately separate from
 * CartService, which owns the actual cart data — this service only tracks
 * whether the slide-out drawer is currently visible.
 */
@Injectable({ providedIn: "root" })
export class CartUiService {
  private _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((v) => !v);
  }
}
