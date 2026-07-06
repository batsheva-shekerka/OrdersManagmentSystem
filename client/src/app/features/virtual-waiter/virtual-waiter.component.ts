import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AgentService, AgentHistoryTurn } from "../../core/services/agent.service";
import { AuthService } from "../../core/services/auth.service";

interface ChatMessage {
  sender: "user" | "agent";
  text: string;
}

/**
 * Fallback identifier used when no user is logged in yet, so the Virtual
 * Waiter can still demo cart operations end-to-end. Must be a valid
 * MongoDB ObjectId string (24 hex chars) since Cart.user is an ObjectId ref.
 * TODO: remove once guest checkout / full auth flow is wired up.
 */
const GUEST_USER_ID = "000000000000000000000001";

/**
 * NOTE on memory: we intentionally do NOT rebuild Gemini history from the
 * displayed chat bubbles. The raw history returned by the backend contains
 * the actual tool calls/results (e.g. real product IDs from searchProducts),
 * so replaying it verbatim is what lets the agent correctly resolve
 * follow-ups like "add the cheapest one" without hallucinating IDs.
 */

@Component({
  selector: "app-virtual-waiter",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating toggle button -->
    <button class="fab" (click)="toggleChat()" [attr.aria-label]="isOpen() ? 'סגור צ׳אט' : 'פתח מלצר וירטואלי'">
      @if (isOpen()) {
        <span class="fab__icon">✕</span>
      } @else {
        <span class="fab__icon">🍽️</span>
        @if (unread() > 0) {
          <span class="fab__badge">{{ unread() }}</span>
        }
      }
    </button>

    <!-- Chat window -->
    @if (isOpen()) {
      <div class="chat-window" dir="rtl">

        <!-- Header -->
        <div class="chat-header">
          <span class="chat-header__avatar">🍽️</span>
          <div class="chat-header__info">
            <span class="chat-header__name">מלצר גולדיס</span>
            <span class="chat-header__status">מחובר</span>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-body" #scrollContainer>
          @for (msg of messages(); track $index) {
            <div class="bubble-row" [class.bubble-row--user]="msg.sender === 'user'">
              @if (msg.sender === 'agent') {
                <span class="bubble-avatar">🍽️</span>
              }
              <div
                class="bubble"
                [class.bubble--user]="msg.sender === 'user'"
                [class.bubble--agent]="msg.sender === 'agent'"
              >{{ msg.text }}</div>
            </div>
          }

          @if (loading()) {
            <div class="bubble-row">
              <span class="bubble-avatar">🍽️</span>
              <div class="bubble bubble--agent bubble--typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          }
        </div>

        <!-- Input -->
        <div class="chat-footer">
          <input
            class="chat-input"
            type="text"
            placeholder="שאל אותי על התפריט..."
            [(ngModel)]="inputText"
            (keydown.enter)="send()"
            [disabled]="loading()"
          />
          <button class="chat-send" (click)="send()" [disabled]="loading() || !inputText.trim()">
            שלח
          </button>
        </div>

      </div>
    }
  `,
  styles: [`
    /* ---- Floating Action Button ---- */
    .fab {
      position: fixed;
      bottom: 1.5rem;
      left: 1.5rem;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: #b5862b;
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.25);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      transition: transform .2s, background .2s;
    }
    .fab:hover { background: #9a7024; transform: scale(1.08); }
    .fab__icon { line-height: 1; }
    .fab__badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #e53e3e;
      color: #fff;
      font-size: .65rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 1px 5px;
      min-width: 1.1rem;
      text-align: center;
    }

    /* ---- Chat window ---- */
    .chat-window {
      position: fixed;
      bottom: 5.5rem;
      left: 1.5rem;
      width: 360px;
      max-height: 520px;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 8px 32px rgba(0,0,0,.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 999;
      font-family: 'Segoe UI', Arial, sans-serif;
      animation: slideUp .22s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .chat-header {
      background: #b5862b;
      color: #fff;
      padding: .75rem 1rem;
      display: flex;
      align-items: center;
      gap: .75rem;
    }
    .chat-header__avatar { font-size: 1.6rem; }
    .chat-header__name { font-weight: 700; font-size: 1rem; display: block; }
    .chat-header__status { font-size: .75rem; opacity: .85; }

    /* Messages area */
    .chat-body {
      flex: 1;
      overflow-y: auto;
      padding: .75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      background: #faf9f6;
    }

    .bubble-row {
      display: flex;
      align-items: flex-end;
      gap: .4rem;
    }
    .bubble-row--user {
      flex-direction: row-reverse;
    }

    .bubble-avatar { font-size: 1.2rem; flex-shrink: 0; }

    .bubble {
      max-width: 74%;
      padding: .55rem .85rem;
      border-radius: 1rem;
      font-size: .9rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .bubble--agent {
      background: #fff;
      border: 1px solid #e8e2d6;
      border-bottom-right-radius: .25rem;
      color: #2d2d2d;
    }
    .bubble--user {
      background: #b5862b;
      color: #fff;
      border-bottom-left-radius: .25rem;
    }

    /* Typing indicator */
    .bubble--typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: .6rem .85rem;
    }
    .bubble--typing span {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #b5862b;
      animation: blink 1.2s infinite;
      display: inline-block;
    }
    .bubble--typing span:nth-child(2) { animation-delay: .2s; }
    .bubble--typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes blink {
      0%, 80%, 100% { opacity: .2; transform: scale(.8); }
      40%           { opacity: 1;  transform: scale(1); }
    }

    /* Footer / input */
    .chat-footer {
      display: flex;
      gap: .5rem;
      padding: .65rem .75rem;
      border-top: 1px solid #eee;
      background: #fff;
    }
    .chat-input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: .5rem;
      padding: .45rem .75rem;
      font-size: .9rem;
      direction: rtl;
      outline: none;
      transition: border-color .15s;
    }
    .chat-input:focus { border-color: #b5862b; }
    .chat-send {
      background: #b5862b;
      color: #fff;
      border: none;
      border-radius: .5rem;
      padding: .45rem .9rem;
      font-size: .9rem;
      cursor: pointer;
      font-weight: 600;
      transition: background .15s;
    }
    .chat-send:hover:not(:disabled) { background: #9a7024; }
    .chat-send:disabled, .chat-input:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class VirtualWaiterComponent implements OnInit {
  private agentService = inject(AgentService);
  private authService = inject(AuthService);

  @ViewChild("scrollContainer") private scrollContainer!: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  loading = signal(false);
  unread = signal(0);
  messages = signal<ChatMessage[]>([]);
  inputText = "";

  /** Raw Gemini conversation history, opaque to the UI — round-tripped with the backend. */
  private conversationHistory: AgentHistoryTurn[] = [];

  ngOnInit(): void {
    // Greet the user automatically on first open
    this.messages.set([
      {
        sender: "agent",
        text: "שלום! אני המלצר הווירטואלי של גולדיס 🍽️\nאפשר לשאול אותי על התפריט, לחפש מוצרים לפי קטגוריה או מחיר, ולהוסיף לסל.",
      },
    ]);
  }

  toggleChat(): void {
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.unread.set(0);
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.inputText = "";
    this.messages.update((msgs) => [...msgs, { sender: "user", text }]);
    this.loading.set(true);
    setTimeout(() => this.scrollToBottom(), 30);

    // Fall back to a shared guest identity until real auth is wired in,
    // so cart operations always have a valid userId to work with.
    const userId = this.authService.user()?._id ?? GUEST_USER_ID;

    this.agentService.chat(text, userId, this.conversationHistory).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.conversationHistory = res.history ?? this.conversationHistory;
        this.messages.update((msgs) => [
          ...msgs,
          { sender: "agent", text: res.response },
        ]);
        if (!this.isOpen()) this.unread.update((n) => n + 1);
        setTimeout(() => this.scrollToBottom(), 30);
      },
      error: () => {
        this.loading.set(false);
        this.messages.update((msgs) => [
          ...msgs,
          { sender: "agent", text: "אירעה שגיאה. אנא נסה שנית." },
        ]);
        setTimeout(() => this.scrollToBottom(), 30);
      },
    });
  }

  private scrollToBottom(): void {
    const el = this.scrollContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
