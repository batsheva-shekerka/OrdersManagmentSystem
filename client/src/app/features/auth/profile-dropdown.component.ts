import { Component, HostListener, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { CartService } from "../../core/services/cart.service";

const IL_PHONE_RE = /^0(5[0-9][-]?\d{7}|[2-9]\d[-]?\d{6,7})$/;

function israeliPhoneValidator(): ValidatorFn {
  return (ctrl: AbstractControl) => {
    const v = (ctrl.value ?? "").replace(/\s/g, "");
    if (!v) return null;
    return IL_PHONE_RE.test(v) ? null : { invalidPhone: true };
  };
}

/**
 * Profile avatar button + dropdown panel.
 * Shows user details, an inline edit form, and a logout button.
 * Placed inside the header actions area; rendered only when the user is logged in.
 */
@Component({
  selector: "app-profile-dropdown",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <!-- Avatar trigger button -->
    <div class="profile-wrap" (click)="$event.stopPropagation()">
      <button
        type="button"
        class="avatar-btn"
        [class.avatar-btn--open]="open()"
        (click)="toggleOpen()"
        aria-label="פרופיל משתמש"
      >
        <span class="avatar-btn__initials">{{ userInitial }}</span>
      </button>

      @if (open()) {
        <div class="profile-panel" role="dialog" aria-label="תפריט משתמש">

          <!-- ── Header ── -->
          @if (!editing()) {
            <div class="panel-header">
              <div class="panel-avatar">{{ userInitial }}</div>
              <div class="panel-header__info">
                <span class="panel-header__name">{{ auth.user()?.name }}</span>
                @if (auth.user()?.email) {
                  <span class="panel-header__email">{{ auth.user()?.email }}</span>
                }
                @if (auth.user()?.phone) {
                  <span class="panel-header__email">{{ auth.user()?.phone }}</span>
                }
              </div>
            </div>

            <!-- Loyalty chip -->
            <div class="loyalty-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{{ auth.user()?.loyaltyBalance ?? 0 }} נקודות נאמנות</span>
            </div>

            <div class="panel-divider"></div>

            <a routerLink="/orders" class="panel-item" (click)="open.set(false)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
              ההזמנות שלי
            </a>

            <button type="button" class="panel-item" (click)="startEdit()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              עריכת פרופיל
            </button>

            <div class="panel-divider"></div>

            <button type="button" class="panel-item panel-item--logout" (click)="logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              יציאה
            </button>
          }

          <!-- ── Edit form ── -->
          @if (editing()) {
            <div class="edit-header">
              <span class="edit-header__title">עריכת פרופיל</span>
              <button type="button" class="edit-header__back" (click)="cancelEdit()" aria-label="חזרה">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="edit-form">

              <div class="edit-field">
                <label class="edit-field__label">שם מלא</label>
                <input
                  type="text"
                  formControlName="name"
                  class="edit-field__input"
                  [class.edit-field__input--error]="editForm.controls.name.touched && editForm.controls.name.invalid"
                />
                @if (editForm.controls.name.touched && editForm.controls.name.hasError('required')) {
                  <span class="edit-field__error">שדה זה הינו חובה</span>
                } @else if (editForm.controls.name.touched && editForm.controls.name.hasError('minlength')) {
                  <span class="edit-field__error">השם חייב להכיל לפחות 2 תווים</span>
                }
              </div>

              <div class="edit-field">
                <label class="edit-field__label">כתובת מייל</label>
                <input
                  type="email"
                  formControlName="email"
                  class="edit-field__input"
                  [class.edit-field__input--error]="editForm.controls.email.touched && editForm.controls.email.invalid"
                />
                @if (editForm.controls.email.touched && editForm.controls.email.hasError('email')) {
                  <span class="edit-field__error">כתובת האימייל אינה תקינה</span>
                }
              </div>

              <div class="edit-field">
                <label class="edit-field__label">טלפון</label>
                <input
                  type="tel"
                  formControlName="phone"
                  placeholder="050-1234567"
                  class="edit-field__input"
                  [class.edit-field__input--error]="editForm.controls.phone.touched && editForm.controls.phone.invalid"
                />
                @if (editForm.controls.phone.touched && editForm.controls.phone.hasError('invalidPhone')) {
                  <span class="edit-field__error">מספר טלפון לא תקין</span>
                }
              </div>

              @if (saveError()) {
                <p class="edit-form__server-error">{{ saveError() }}</p>
              }

              <div class="edit-form__actions">
                <button
                  type="button"
                  class="edit-btn edit-btn--cancel"
                  (click)="cancelEdit()"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  class="edit-btn edit-btn--save"
                  [disabled]="saving()"
                >
                  {{ saving() ? "שומר..." : "שמירה" }}
                </button>
              </div>
            </form>
          }

        </div>
      }
    </div>
  `,
  styles: [
    `
      .profile-wrap {
        position: relative;
      }

      /* ── Avatar trigger ── */
      .avatar-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: 2px solid var(--color-border);
        background: var(--color-primary-light);
        color: var(--color-primary);
        font-weight: 800;
        font-size: 0.9rem;
        font-family: var(--font-family);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }
      .avatar-btn:hover,
      .avatar-btn--open {
        border-color: var(--color-primary);
        background: var(--color-primary);
        color: #fff;
      }
      .avatar-btn__initials {
        line-height: 1;
        user-select: none;
      }

      /* ── Panel ── */
      .profile-panel {
        position: absolute;
        top: calc(100% + 10px);
        inset-inline-end: 0;
        width: 260px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        z-index: 500;
        animation: dropdown-in 0.15s ease;
        overflow: hidden;
      }
      @keyframes dropdown-in {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      /* ── Panel header ── */
      .panel-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1rem 0.75rem;
      }
      .panel-avatar {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 50%;
        background: var(--color-primary);
        color: #fff;
        font-weight: 800;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .panel-header__info {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
      }
      .panel-header__name {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--color-text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .panel-header__email {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── Loyalty chip ── */
      .loyalty-chip {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin: 0 1rem 0.75rem;
        padding: 0.35rem 0.65rem;
        background: var(--color-primary-light);
        border-radius: 999px;
        color: var(--color-primary);
        font-size: 0.75rem;
        font-weight: 700;
        width: fit-content;
      }

      /* ── Divider ── */
      .panel-divider {
        height: 1px;
        background: var(--color-border);
        margin: 0.25rem 0;
      }

      /* ── Panel items ── */
      .panel-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.65rem 1rem;
        font-family: var(--font-family);
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--color-text);
        text-decoration: none;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: right;
        transition: background 0.12s, color 0.12s;
      }
      .panel-item:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .panel-item--logout {
        color: #e53e3e;
      }
      .panel-item--logout:hover {
        background: #fff5f5;
        color: #c53030;
      }

      /* ── Edit form ── */
      .edit-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1rem 0.6rem;
        border-bottom: 1px solid var(--color-border);
      }
      .edit-header__title {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--color-text);
      }
      .edit-header__back {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        padding: 0.2rem;
        border-radius: var(--radius-sm);
      }
      .edit-header__back:hover {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }

      .edit-form {
        padding: 0.75rem 1rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }
      .edit-field {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .edit-field__label {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--color-text-muted);
      }
      .edit-field__input {
        width: 100%;
        padding: 0.5rem 0.7rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        font-family: var(--font-family);
        background: var(--color-bg);
        color: var(--color-text);
        transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .edit-field__input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .edit-field__input--error {
        border-color: #e53e3e !important;
      }
      .edit-field__error {
        font-size: 0.68rem;
        color: #e53e3e;
      }
      .edit-form__server-error {
        margin: 0;
        font-size: 0.75rem;
        color: #e53e3e;
        text-align: center;
      }
      .edit-form__actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.25rem;
      }
      .edit-btn {
        flex: 1;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-sm);
        font-family: var(--font-family);
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        border: none;
        transition: background 0.15s, opacity 0.15s;
      }
      .edit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .edit-btn--cancel {
        background: transparent;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
      }
      .edit-btn--cancel:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
      .edit-btn--save {
        background: var(--color-primary);
        color: #fff;
      }
      .edit-btn--save:hover:not(:disabled) {
        opacity: 0.85;
      }
    `,
  ],
})
export class ProfileDropdownComponent {
  protected auth = inject(AuthService);
  private cart = inject(CartService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  open = signal(false);
  editing = signal(false);
  saving = signal(false);
  saveError = signal("");

  editForm = this.fb.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2)]],
    email: ["", Validators.email],
    phone: ["", israeliPhoneValidator()],
  });

  get userInitial(): string {
    return this.auth.user()?.name?.charAt(0)?.toUpperCase() ?? "?";
  }

  toggleOpen(): void {
    this.open.update((v) => !v);
    if (!this.open()) this.cancelEdit();
  }

  startEdit(): void {
    const u = this.auth.user();
    this.editForm.reset({
      name: u?.name ?? "",
      email: u?.email ?? "",
      phone: u?.phone ?? "",
    });
    this.saveError.set("");
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.saveError.set("");
  }

  saveProfile(): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    this.saving.set(true);
    this.saveError.set("");

    const { name, email, phone } = this.editForm.getRawValue();
    this.auth
      .updateProfile({
        name,
        email: email || undefined,
        phone: phone || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.saveError.set(err?.error?.message ?? "שגיאה בשמירה, נסו שוב.");
        },
      });
  }

  logout(): void {
    this.auth.logout();
    this.cart.clear();
    this.open.set(false);
    this.router.navigate(["/menu"]);
  }

  /** Close the panel when the user clicks anywhere outside the component. */
  @HostListener("document:click")
  onDocumentClick(): void {
    if (this.open()) {
      this.open.set(false);
      this.cancelEdit();
    }
  }
}
