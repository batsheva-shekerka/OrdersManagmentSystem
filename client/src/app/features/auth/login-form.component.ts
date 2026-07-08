import { Component, EventEmitter, Output, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";

/**
 * Reusable "existing user" login form — the email/password/remember/forgot
 * widget shown both inside the global AuthModalComponent and inline on the
 * checkout auth gate. Emits `success` once AuthService confirms the login;
 * the parent decides what to do next (close a modal, reveal checkout, etc).
 */
@Component({
  selector: "app-login-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
      <div class="input-wrap">
        <input
          type="email"
          formControlName="email"
          placeholder="כתובת מייל"
          [class.input--error]="form.controls.email.touched && form.controls.email.invalid"
        />
        @if (form.controls.email.touched && form.controls.email.hasError('required')) {
          <span class="field-error">שדה זה הינו חובה</span>
        } @else if (form.controls.email.touched && form.controls.email.hasError('email')) {
          <span class="field-error">כתובת האימייל אינה תקינה</span>
        }
      </div>

      <div class="input-wrap">
        <input
          type="password"
          formControlName="password"
          placeholder="סיסמה..."
          [class.input--error]="form.controls.password.touched && form.controls.password.invalid"
        />
        @if (form.controls.password.touched && form.controls.password.hasError('required')) {
          <span class="field-error">שדה זה הינו חובה</span>
        }
      </div>
      <div class="auth-row">
        <label class="remember">
          <input type="checkbox" formControlName="remember" />
          זכור אותי
        </label>
        <a href="javascript:void(0)" class="forgot">שכחתי סיסמה</a>
      </div>
      @if (error()) {
        <p class="auth-error">{{ error() }}</p>
      }
      <button class="btn btn-primary btn-block" type="submit" [disabled]="form.invalid || loading()">
        {{ loading() ? "מתחבר..." : "כניסה" }}
      </button>
    </form>
  `,
  styles: [
    `
      .auth-form {
        width: 100%;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .input-wrap {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .field-error {
        font-size: 0.72rem;
        color: var(--color-primary);
      }
      .input--error {
        border-color: var(--color-primary) !important;
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
      .auth-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.8rem;
      }
      .remember {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--color-text-muted);
        cursor: pointer;
      }
      .forgot {
        color: var(--color-text-muted);
        text-decoration: none;
      }
      .forgot:hover {
        color: var(--color-primary);
        text-decoration: underline;
      }
      .auth-error {
        margin: 0;
        color: var(--color-primary);
        font-size: 0.82rem;
        text-align: center;
      }
    `,
  ],
})
export class LoginFormComponent {
  @Output() success = new EventEmitter<void>();

  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal("");

  form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", Validators.required],
    remember: [false],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set("");
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.form.reset({ email: "", password: "", remember: false });
        this.success.emit();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? "שגיאה בהתחברות, נסו שוב.");
      },
    });
  }
}
