import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { ApiService } from "../../core/services/api.service";
import { CartService } from "../../core/services/cart.service";
import { AuthService } from "../../core/services/auth.service";
import { AuthUiService } from "../../core/services/auth-ui.service";
import { LoginFormComponent } from "../auth/login-form.component";
import {
  CreateOrderPayload,
  FulfillmentType,
  Order,
  PaymentMethod,
  PickupLocation,
} from "../../core/models/order.model";

interface OrderResponse {
  success: boolean;
  data: Order;
}

const PICKUP_BRANCHES: { id: PickupLocation; name: string; address: string }[] = [
  { id: "bnei_brak", name: "בני ברק", address: "מאדה 9" },
  { id: "jerusalem", name: "ירושלים", address: "עזרת תורה 18" },
];

/** Accepts: 05X-XXXXXXX | 05XXXXXXXX | 0X-XXXXXXX | 0XXXXXXXX (landlines too) */
const IL_PHONE_RE = /^0(5[0-9][-]?\d{7}|[2-9]\d[-]?\d{6,7})$/;

function israeliPhoneValidator(): ValidatorFn {
  return (ctrl: AbstractControl) => {
    const v = (ctrl.value ?? "").replace(/\s/g, "");
    if (!v) return null; // required check handled separately
    return IL_PHONE_RE.test(v) ? null : { invalidPhone: true };
  };
}

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoginFormComponent],
  template: `
    <div class="checkout-page">
      @if (cart.items().length === 0) {
        <p class="state">הסל שלכם ריק כרגע.</p>
        <a class="back-link" routerLink="/menu">חזרה לתפריט</a>
      } @else if (!showCheckoutForm()) {
        <!-- ---- Auth gate ---- -->
        <div class="gate">
          <h1 class="gate__title">ביצוע הזמנה</h1>
          <div class="gate__grid">
            <div class="gate__col">
              <h2 class="gate__col-title">משתמש חדש/אורח</h2>
              <p class="gate__text">
                המשיכו בתהליך הצ'קאאוט בהליך מקוצר כאורח, מבלי להיות משתמש רשום.
              </p>
              <button class="btn btn-primary" type="button" (click)="continueAsGuest()">המשך כאורח</button>
              <span class="gate__or">או</span>
              <button class="link-btn" type="button" (click)="authUi.open('register')">להרשמה</button>
            </div>
            <div class="gate__col gate__col--login">
              <h2 class="gate__col-title">כבר רשומים? התחברו</h2>
              <app-login-form />
            </div>
          </div>
        </div>
      } @else {
        <!-- ---- Final checkout form ---- -->
        <form [formGroup]="form" class="checkout-form">
          <h1 class="checkout-form__title">סגירת הזמנה</h1>

          <div class="checkout-layout">
            <div class="checkout-main">
              <section class="card">
                <h2 class="card__title">אופן קבלת ההזמנה</h2>
                <div class="fulfillment-tabs">
                  <button
                    type="button"
                    class="fulfillment-tab"
                    [class.is-active]="form.value.type === 'delivery'"
                    (click)="setType('delivery')"
                  >
                    משלוח עד הבית
                  </button>
                  <button
                    type="button"
                    class="fulfillment-tab"
                    [class.is-active]="form.value.type === 'dine_in'"
                    (click)="setType('dine_in')"
                  >
                    ישיבה במקום
                  </button>
                  <button
                    type="button"
                    class="fulfillment-tab"
                    [class.is-active]="form.value.type === 'pickup'"
                    (click)="setType('pickup')"
                  >
                    איסוף עצמי
                  </button>
                </div>

                @if (form.value.type === "delivery") {
                  <div class="field">
                    <label>כתובת למשלוח</label>
                    <input
                      formControlName="deliveryAddress"
                      placeholder="רחוב, מספר בית, עיר"
                      [class.field__input--error]="form.controls.deliveryAddress.touched && !form.controls.deliveryAddress.value?.trim()"
                    />
                    @if (form.controls.deliveryAddress.touched && !form.controls.deliveryAddress.value?.trim()) {
                      <span class="field__error">יש להזין כתובת למשלוח</span>
                    }
                  </div>
                }

                @if (form.value.type === "pickup") {
                  <div class="pickup-branches">
                    @for (branch of branches; track branch.id) {
                      <button
                        type="button"
                        class="pickup-branch"
                        [class.is-active]="form.value.pickupLocation === branch.id"
                        (click)="setPickupLocation(branch.id)"
                      >
                        <span class="pickup-branch__name">{{ branch.name }}</span>
                        <span class="pickup-branch__address">{{ branch.address }}</span>
                      </button>
                    }
                  </div>
                  @if (form.controls.pickupLocation.touched && !form.value.pickupLocation) {
                    <span class="field__error" style="margin-top:0.4rem; display:block">יש לבחור סניף לאיסוף</span>
                  }
                }
              </section>

              @if (!auth.isLoggedIn()) {
                <section class="card">
                  <h2 class="card__title">פרטי אורח</h2>
                  <div class="field-row">
                    <div class="field">
                      <label>שם מלא</label>
                      <input
                        formControlName="guestName"
                        placeholder="שם מלא"
                        [class.field__input--error]="form.controls.guestName.touched && form.controls.guestName.invalid"
                      />
                      @if (form.controls.guestName.touched && form.controls.guestName.hasError('required')) {
                        <span class="field__error">שדה זה הינו חובה</span>
                      }
                    </div>
                    <div class="field">
                      <label>טלפון</label>
                      <input
                        type="tel"
                        formControlName="guestPhone"
                        placeholder="05X-XXXXXXX"
                        inputmode="tel"
                        maxlength="11"
                        [class.field__input--error]="isPhoneInvalid()"
                      />
                      @if (isPhoneInvalid()) {
                        <span class="field__error">מספר טלפון לא תקין — יש להזין מספר ישראלי (לדוגמה: 050-1234567)</span>
                      }
                    </div>
                  </div>
                </section>
              }

              @if (auth.isLoggedIn()) {
                <section class="card card--loyalty">
                  <div class="loyalty-header">
                    <div>
                      <h2 class="card__title">מועדון חברים</h2>
                      <p class="loyalty-balance">
                        יש לכם <strong>{{ auth.user()?.loyaltyBalance ?? 0 }}</strong> נקודות זמינות
                      </p>
                    </div>
                    <label class="toggle" [class.toggle--disabled]="maxRedeemable() === 0">
                      <input
                        type="checkbox"
                        [checked]="redeemPoints()"
                        [disabled]="maxRedeemable() === 0"
                        (change)="toggleRedeem($event)"
                      />
                      <span class="toggle__track"><span class="toggle__thumb"></span></span>
                    </label>
                  </div>
                  @if (redeemPoints() && pointsToRedeem() > 0) {
                    <p class="loyalty-discount">
                      מימוש {{ pointsToRedeem() }} נקודות = הנחה של {{ pointsToRedeem() | currency: "ILS" }}
                    </p>
                  }
                </section>
              }

              <!-- ---- Payment method ---- -->
              <section class="card" [formGroup]="paymentForm">
                <h2 class="card__title">אמצעי תשלום</h2>

                <div class="payment-tabs">
                  <button
                    type="button"
                    class="payment-tab"
                    [class.is-active]="paymentForm.value.method === 'card'"
                    (click)="setPaymentMethod('card')"
                  >
                    <svg class="payment-tab__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <span>כרטיס אשראי</span>
                  </button>
                  <button
                    type="button"
                    class="payment-tab"
                    [class.is-active]="paymentForm.value.method === 'cash'"
                    (click)="setPaymentMethod('cash')"
                  >
                    <svg class="payment-tab__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="6" width="20" height="12" rx="2"/>
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M6 12h.01M18 12h.01" stroke-linecap="round"/>
                    </svg>
                    <span>מזומן / תשלום באיסוף</span>
                  </button>
                </div>

                @if (paymentForm.value.method === 'cash') {
                  <p class="payment-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    התשלום יתבצע פיזית בעת קבלת ההזמנה
                  </p>
                }

                @if (paymentForm.value.method === 'card') {
                  <div class="card-form">
                    <div class="card-form__secure">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      פרטי הכרטיס מוצפנים ומאובטחים
                    </div>

                    <div class="field">
                      <label>מספר כרטיס</label>
                      <input
                        type="text"
                        formControlName="cardNumber"
                        placeholder="0000  0000  0000  0000"
                        maxlength="19"
                        inputmode="numeric"
                        autocomplete="cc-number"
                        (input)="formatCardNumber($event)"
                        [class.field__input--error]="isFieldInvalid('cardNumber')"
                      />
                      @if (isFieldInvalid('cardNumber')) {
                        <span class="field__error">יש להזין 16 ספרות</span>
                      }
                    </div>

                    <div class="card-form__row">
                      <div class="field">
                        <label>תוקף</label>
                        <input
                          type="text"
                          formControlName="expiry"
                          placeholder="MM/YY"
                          maxlength="5"
                          inputmode="numeric"
                          autocomplete="cc-exp"
                          (input)="formatExpiry($event)"
                          [class.field__input--error]="isFieldInvalid('expiry')"
                        />
                        @if (isFieldInvalid('expiry')) {
                          <span class="field__error">פורמט לא תקין</span>
                        }
                      </div>

                      <div class="field">
                        <label>CVV</label>
                        <input
                          type="password"
                          formControlName="cvv"
                          placeholder="···"
                          maxlength="3"
                          inputmode="numeric"
                          autocomplete="cc-csc"
                          [class.field__input--error]="isFieldInvalid('cvv')"
                        />
                        @if (isFieldInvalid('cvv')) {
                          <span class="field__error">3 ספרות</span>
                        }
                      </div>

                      <div class="field">
                        <label>ת.ז. בעל הכרטיס</label>
                        <input
                          type="text"
                          formControlName="ownerId"
                          placeholder="000000000"
                          maxlength="9"
                          inputmode="numeric"
                          [class.field__input--error]="isFieldInvalid('ownerId')"
                        />
                        @if (isFieldInvalid('ownerId')) {
                          <span class="field__error">9 ספרות</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </section>
            </div>

            <aside class="checkout-summary">
              <h2 class="card__title">סיכום הזמנה</h2>
              <div class="summary-items">
                @for (line of cart.items(); track line.product._id) {
                  <div class="summary-item">
                    <span class="summary-item__qty">{{ line.quantity }}x</span>
                    <span class="summary-item__name">{{ line.product.name }}</span>
                    <span class="summary-item__price">{{ line.product.price * line.quantity | currency: "ILS" }}</span>
                  </div>
                }
              </div>

              <div class="summary-row">
                <span>סכום ביניים</span>
                <span>{{ cart.subtotal() | currency: "ILS" }}</span>
              </div>
              @if (redeemPoints() && pointsToRedeem() > 0) {
                <div class="summary-row summary-row--discount">
                  <span>הנחת נקודות</span>
                  <span>-{{ pointsToRedeem() | currency: "ILS" }}</span>
                </div>
              }
              <div class="summary-row summary-row--total">
                <span>סה"כ לתשלום</span>
                <span>{{ finalTotal() | currency: "ILS" }}</span>
              </div>

              @if (error()) {
                <p class="checkout-error">{{ error() }}</p>
              }

              <button
                class="btn btn-primary btn-block checkout-submit"
                type="button"
                (click)="submit()"
                [disabled]="submitting() || !canSubmit()"
              >
                {{ submitting() ? "שולח הזמנה..." : "אישור ותשלום" }}
              </button>
            </aside>
          </div>
        </form>
      }
    </div>
  `,
  styles: [
    `
      .checkout-page {
        max-width: 1100px;
        margin: 0 auto;
        font-family: var(--font-family);
        color: var(--color-text);
      }
      .state {
        text-align: center;
        color: var(--color-text-muted);
        margin-top: 3rem;
        font-size: 1.1rem;
      }
      .back-link {
        display: block;
        text-align: center;
        color: var(--color-primary);
        text-decoration: none;
        font-weight: 700;
      }

      /* ---- Auth gate ---- */
      .gate {
        background: var(--color-bg);
        padding: 2rem 1rem 3rem;
      }
      .gate__title {
        text-align: center;
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 2.5rem;
      }
      .gate__grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        max-width: 760px;
        margin: 0 auto;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        overflow: hidden;
      }
      .gate__col {
        padding: 2.5rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.9rem;
      }
      .gate__col--login {
        border-inline-start: 1px solid var(--color-border);
      }
      .gate__col-title {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 800;
      }
      .gate__text {
        margin: 0 0 0.5rem;
        color: var(--color-text-muted);
        font-size: 0.9rem;
        line-height: 1.6;
      }
      .gate__or {
        color: var(--color-text-muted);
        font-size: 0.85rem;
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
        .gate__grid {
          grid-template-columns: 1fr;
        }
        .gate__col--login {
          border-inline-start: none;
          border-top: 1px solid var(--color-border);
        }
      }

      /* ---- Final checkout form ---- */
      .checkout-form {
        padding: 1.5rem 1rem 3rem;
      }
      .checkout-form__title {
        font-size: 1.75rem;
        font-weight: 800;
        margin: 0 0 1.5rem;
      }
      .checkout-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 1.5rem;
        align-items: start;
      }
      .checkout-main {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .card {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1.5rem;
      }
      .card__title {
        margin: 0 0 1rem;
        font-size: 1.05rem;
        font-weight: 800;
      }

      .fulfillment-tabs {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .fulfillment-tab {
        flex: 1 1 auto;
        min-width: 120px;
        padding: 0.7rem 1rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        background: var(--color-surface);
        color: var(--color-text);
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s, color 0.15s;
        font-family: var(--font-family);
      }
      .fulfillment-tab:hover {
        border-color: var(--color-primary);
      }
      .fulfillment-tab.is-active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #fff;
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .field label {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--color-text-muted);
      }
      .field input {
        padding: 0.65rem 0.85rem;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-sm);
        font-size: 0.9rem;
        font-family: var(--font-family);
        background: var(--color-bg);
        color: var(--color-text);
      }
      .field input:focus {
        outline: none;
        border-color: var(--color-primary);
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .pickup-branches {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .pickup-branch {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        padding: 1rem;
        border: 1.5px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
        font-family: var(--font-family);
      }
      .pickup-branch:hover {
        border-color: var(--color-primary);
      }
      .pickup-branch.is-active {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
      }
      .pickup-branch__name {
        font-weight: 800;
        font-size: 0.95rem;
        color: var(--color-text);
      }
      .pickup-branch__address {
        font-size: 0.78rem;
        color: var(--color-text-muted);
      }

      /* Loyalty */
      .loyalty-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .loyalty-balance {
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
      }
      .loyalty-discount {
        margin: 0.75rem 0 0;
        color: var(--color-primary);
        font-weight: 700;
        font-size: 0.85rem;
      }
      .toggle {
        position: relative;
        display: inline-block;
        width: 2.6rem;
        height: 1.5rem;
        flex-shrink: 0;
      }
      .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
        position: absolute;
      }
      .toggle__track {
        position: absolute;
        inset: 0;
        background: var(--color-border);
        border-radius: 999px;
        transition: background 0.2s;
      }
      .toggle__thumb {
        position: absolute;
        top: 2px;
        inset-inline-start: 2px;
        width: 1.15rem;
        height: 1.15rem;
        background: #fff;
        border-radius: 50%;
        transition: inset-inline-start 0.2s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      }
      .toggle input:checked + .toggle__track {
        background: var(--color-primary);
      }
      .toggle input:checked + .toggle__track .toggle__thumb {
        inset-inline-start: calc(100% - 1.15rem - 2px);
      }
      .toggle--disabled {
        opacity: 0.5;
        pointer-events: none;
      }

      /* ---- Payment ---- */
      .payment-tabs {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
      }
      .payment-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        padding: 0.85rem 1rem;
        border: 1.5px solid var(--color-border);
        border-radius: var(--radius-md);
        background: var(--color-bg);
        font-family: var(--font-family);
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s, color 0.15s;
      }
      .payment-tab:hover {
        border-color: var(--color-primary);
        color: var(--color-text);
      }
      .payment-tab.is-active {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      .payment-tab__icon {
        flex-shrink: 0;
      }
      .payment-note {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        color: var(--color-text-muted);
        font-size: 0.85rem;
        background: var(--color-bg);
        padding: 0.7rem 1rem;
        border-radius: var(--radius-sm);
      }
      .card-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .card-form__secure {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #1a9e5c;
        margin-bottom: 0.25rem;
      }
      .card-form__row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.85rem;
      }
      .field__input--error {
        border-color: var(--color-primary) !important;
      }
      .field__error {
        font-size: 0.72rem;
        color: var(--color-primary);
        margin-top: 0.15rem;
      }

      @media (max-width: 480px) {
        .payment-tabs {
          flex-direction: column;
        }
        .card-form__row {
          grid-template-columns: 1fr 1fr;
        }
      }

      /* Summary */
      .checkout-summary {
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        padding: 1.5rem;
        position: sticky;
        top: 1rem;
      }
      .summary-items {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--color-border);
      }
      .summary-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.5rem;
        font-size: 0.85rem;
      }
      .summary-item__qty {
        color: var(--color-text-muted);
        font-weight: 700;
      }
      .summary-item__name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .summary-item__price {
        font-weight: 700;
        white-space: nowrap;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        padding: 0.3rem 0;
      }
      .summary-row--discount {
        color: var(--color-primary);
      }
      .summary-row--total {
        border-top: 1px solid var(--color-border);
        margin-top: 0.4rem;
        padding-top: 0.75rem;
        font-size: 1.1rem;
        font-weight: 800;
      }
      .checkout-error {
        color: var(--color-primary);
        font-size: 0.85rem;
        text-align: center;
        margin: 0.75rem 0 0;
      }
      .checkout-submit {
        margin-top: 1rem;
        padding: 0.85rem;
        font-size: 1rem;
      }

      @media (max-width: 860px) {
        .checkout-layout {
          grid-template-columns: 1fr;
        }
        .checkout-summary {
          position: static;
        }
        .field-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  protected cart = inject(CartService);
  protected auth = inject(AuthService);
  protected authUi = inject(AuthUiService);

  protected branches = PICKUP_BRANCHES;

  guestMode = signal(false);
  showCheckoutForm = computed(() => this.auth.isLoggedIn() || this.guestMode());

  submitting = signal(false);
  error = signal<string | null>(null);

  redeemPoints = signal(false);
  maxRedeemable = computed(() =>
    Math.min(this.auth.user()?.loyaltyBalance ?? 0, this.cart.subtotal())
  );
  pointsToRedeem = computed(() => (this.redeemPoints() ? this.maxRedeemable() : 0));
  finalTotal = computed(() => this.cart.subtotal() - this.pointsToRedeem());

  form = this.fb.nonNullable.group({
    type: ["delivery" as FulfillmentType, Validators.required],
    deliveryAddress: [""],
    pickupLocation: [""],
    guestName: ["", Validators.required],
    guestPhone: ["", israeliPhoneValidator()],
  });

  paymentForm = this.fb.nonNullable.group({
    method: ["card" as "card" | "cash", Validators.required],
    cardNumber: [""],
    expiry: [""],
    cvv: [""],
    ownerId: [""],
  });

  ngOnInit(): void {
    // The balance in AuthService is a snapshot from login/register — pull
    // the authoritative value before the customer decides how many points
    // to redeem (it may have changed since then, e.g. from a prior order).
    this.auth.refreshProfile().subscribe();
  }

  continueAsGuest(): void {
    this.guestMode.set(true);
  }

  setType(type: FulfillmentType): void {
    this.form.patchValue({ type });
  }

  setPickupLocation(pickupLocation: PickupLocation): void {
    this.form.patchValue({ pickupLocation });
  }

  setPaymentMethod(method: "card" | "cash"): void {
    this.paymentForm.patchValue({ method });
    // Clear card fields when switching away so stale validation errors disappear.
    if (method === "cash") {
      this.paymentForm.patchValue({ cardNumber: "", expiry: "", cvv: "", ownerId: "" });
      this.paymentForm.markAsPristine();
    }
  }

  toggleRedeem(event: Event): void {
    this.redeemPoints.set((event.target as HTMLInputElement).checked);
  }

  /** Auto-inserts spaces every 4 digits: "1234 5678 9012 3456". */
  formatCardNumber(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, "").slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, "$1 ").trim();
    input.value = formatted;
    this.paymentForm.patchValue({ cardNumber: digits });
  }

  /** Auto-inserts slash: "MM/YY". */
  formatExpiry(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    input.value = formatted;
    this.paymentForm.patchValue({ expiry: formatted });
  }

  /** Returns true when a payment field has been touched and is invalid (for error display). */
  isFieldInvalid(field: "cardNumber" | "expiry" | "cvv" | "ownerId"): boolean {
    if (this.paymentForm.value.method !== "card") return false;
    const ctrl = this.paymentForm.get(field);
    return !!(ctrl && ctrl.touched && !this.isCardFieldValid(field));
  }

  private isCardFieldValid(field: "cardNumber" | "expiry" | "cvv" | "ownerId"): boolean {
    const v = this.paymentForm.getRawValue();
    switch (field) {
      case "cardNumber": return /^\d{16}$/.test(v.cardNumber);
      case "expiry":     return /^\d{2}\/\d{2}$/.test(v.expiry);
      case "cvv":        return /^\d{3}$/.test(v.cvv);
      case "ownerId":    return /^\d{9}$/.test(v.ownerId);
    }
  }

  /** Shows phone error only after the user has touched the field. */
  isPhoneInvalid(): boolean {
    const ctrl = this.form.get("guestPhone");
    return !!(ctrl?.touched && ctrl?.hasError("invalidPhone"));
  }

  canSubmit(): boolean {
    const v = this.form.getRawValue();
    if (!v.type) return false;
    if (v.type === "delivery" && !v.deliveryAddress.trim()) return false;
    if (v.type === "pickup" && !v.pickupLocation) return false;
    if (!this.auth.isLoggedIn()) {
      if (!v.guestName.trim()) return false;
      if (!v.guestPhone.trim()) return false;
      if (this.form.get("guestPhone")?.hasError("invalidPhone")) return false;
    }
    // Payment validation
    if (this.paymentForm.value.method === "card") {
      if (
        !this.isCardFieldValid("cardNumber") ||
        !this.isCardFieldValid("expiry") ||
        !this.isCardFieldValid("cvv") ||
        !this.isCardFieldValid("ownerId")
      ) return false;
    }
    return true;
  }

  submit(): void {
    // Touch all fields so inline errors appear immediately on first attempt.
    this.form.markAllAsTouched();
    this.paymentForm.markAllAsTouched();
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const payload: CreateOrderPayload = {
      items: this.cart.toOrderItems(),
      fulfillment: {
        type: v.type,
        deliveryAddress: v.type === "delivery" ? v.deliveryAddress : undefined,
        pickupLocation: v.type === "pickup" ? (v.pickupLocation as PickupLocation) : undefined,
      },
      guestInfo: !this.auth.isLoggedIn()
        ? { name: v.guestName, phone: v.guestPhone }
        : undefined,
      pointsRedeemed: this.pointsToRedeem(),
      paymentMethod: this.paymentForm.getRawValue().method as PaymentMethod,
    };

    this.api.post<OrderResponse>("/orders", payload).subscribe({
      next: (res) => {
        this.cart.clear();
        // The backend just earned/redeemed points on this order — refresh
        // the cached balance so it's correct anywhere the user goes next.
        if (this.auth.isLoggedIn()) {
          this.auth.refreshProfile().subscribe();
        }
        this.router.navigate(["/orders"]);
        console.log("Order placed:", res.data.orderNumber);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? "שגיאה בשליחת ההזמנה, נסו שוב.");
        this.submitting.set(false);
      },
    });
  }
}
