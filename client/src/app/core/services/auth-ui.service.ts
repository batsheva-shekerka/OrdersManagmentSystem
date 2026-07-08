import { Injectable, signal } from "@angular/core";

export type AuthModalMode = "login" | "register";

/** Pure UI state for the auth modal (open/closed + which panel is active). */
@Injectable({ providedIn: "root" })
export class AuthUiService {
  private _isOpen = signal(false);
  private _mode = signal<AuthModalMode>("login");

  readonly isOpen = this._isOpen.asReadonly();
  readonly mode = this._mode.asReadonly();

  open(mode: AuthModalMode = "login"): void {
    this._mode.set(mode);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  setMode(mode: AuthModalMode): void {
    this._mode.set(mode);
  }
}
