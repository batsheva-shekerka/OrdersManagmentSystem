import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { AuthUiService } from "../../core/services/auth-ui.service";
import { LoginFormComponent } from "./login-form.component";

@Component({
  selector: "app-auth-modal",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoginFormComponent],
  template: `
    @if (ui.isOpen()) {
      <div class="modal-backdrop" (click)="ui.close()"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <button class="modal__close" type="button" (click)="ui.close()" aria-label="סגירה">✕</button>

        <div class="modal__grid">
          <!-- Left column: guest / new user -->
          <div class="modal__col">
            @if (ui.mode() === "register") {
              <h2 class="modal__title">יצירת חשבון חדש</h2>
              <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="auth-form">
                <input type="text" formControlName="name" placeholder="שם מלא" />
                <input type="email" formControlName="email" placeholder="כתובת מייל" />
                <input type="tel" formControlName="phone" placeholder="טלפון" />
                <input type="password" formControlName="password" placeholder="סיסמה" />
                @if (registerError()) {
                  <p class="auth-error">{{ registerError() }}</p>
                }
                <button
                  class="btn btn-primary btn-block"
                  type="submit"
                  [disabled]="registerForm.invalid || registerLoading()"
                >
                  {{ registerLoading() ? "יוצר חשבון..." : "יצירת חשבון" }}
                </button>
              </form>
              <button class="link-btn" type="button" (click)="ui.setMode('login')">כבר יש לי חשבון</button>
            } @else {
              <h2 class="modal__title">משתמש חדש/אורח</h2>
              <p class="modal__text">
                דאגנו לכם ליצירת חשבון קלה ומהירה במיוחד. המשיכו למילוי פרטים
                ותוכלו ליהנות מהטבות ומהיסטוריית הזמנות אישית שלכם, כבר עכשיו.
              </p>
              <button class="btn btn-primary" type="button" (click)="ui.setMode('register')">להרשמה</button>
            }
          </div>

          <!-- Right column: existing user login -->
          <div class="modal__col modal__col--login">
            <h2 class="modal__title">כבר רשומים? התחברו</h2>
            <app-login-form (success)="ui.close()" />
          </div>
        </div>
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
        width: min(720px, 92vw);
        max-height: 90vh;
        overflow-y: auto;
        background: var(--color-bg);
        box-shadow: var(--shadow-md);
        border-radius: var(--radius-md);
        font-family: var(--font-family);
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

      .modal__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      .modal__col {
        padding: 3rem 2.25rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 1rem;
      }
      .modal__col--login {
        background: var(--color-surface);
        border-inline-start: 1px solid var(--color-border);
      }
      .modal__title {
        margin: 0;
        font-size: 1.3rem;
        font-weight: 800;
      }
      .modal__text {
        margin: 0 0 0.5rem;
        color: var(--color-text-muted);
        font-size: 0.9rem;
        line-height: 1.6;
      }

      .auth-form {
        width: 100%;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .auth-form input {
        width: 100%;
        padding: 0.7rem 0.9rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-family: var(--font-family);
        background: var(--color-surface);
        color: var(--color-text);
      }
      .auth-form input::placeholder {
        color: #a3a3a3;
      }
      .auth-form input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .auth-error {
        margin: 0;
        color: var(--color-primary);
        font-size: 0.82rem;
        text-align: center;
      }
      .link-btn {
        border: none;
        background: transparent;
        color: var(--color-text-muted);
        text-decoration: underline;
        cursor: pointer;
        font-size: 0.85rem;
        font-family: var(--font-family);
      }
      .link-btn:hover {
        color: var(--color-primary);
      }

      @media (max-width: 640px) {
        .modal__grid {
          grid-template-columns: 1fr;
        }
        .modal__col--login {
          border-inline-start: none;
          border-top: 1px solid var(--color-border);
        }
        .modal__col {
          padding: 2rem 1.25rem;
        }
      }
    `,
  ],
})
export class AuthModalComponent {
  protected ui = inject(AuthUiService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  registerLoading = signal(false);
  registerError = signal("");

  registerForm = this.fb.nonNullable.group({
    name: ["", Validators.required],
    email: ["", [Validators.email]],
    phone: [""],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  submitRegister(): void {
    if (this.registerForm.invalid) return;
    this.registerLoading.set(true);
    this.registerError.set("");
    this.auth.register(this.registerForm.getRawValue()).subscribe({
      next: () => {
        this.registerLoading.set(false);
        this.registerForm.reset({ name: "", email: "", phone: "", password: "" });
        this.ui.close();
      },
      error: (err) => {
        this.registerLoading.set(false);
        this.registerError.set(err?.error?.message ?? "שגיאה בהרשמה, נסו שוב.");
      },
    });
  }
}
