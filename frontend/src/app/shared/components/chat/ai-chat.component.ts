/**
 * ai-chat.component.ts  — FULL REPLACEMENT
 *
 * Payment gate changes:
 *  - bookingPreview now carries clientSecret from the backend
 *  - "Proceed to Payment" no longer routes to /booking — it mounts
 *    Stripe Elements inline within the chat panel
 *  - stripe.confirmPayment() handles the card — on success, calls
 *    POST /api/bookings/:id/confirm to finalise the booking
 *  - Pay button gated by Stripe 'change' event (isCardComplete)
 *  - On any Stripe error: stays on payment view with inline error message
 *  - On server confirm error: shows error, never shows success
 */

import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ElementRef, ViewChild, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroChatBubbleLeftRight, heroXMark, heroPaperAirplane,
  heroSparkles, heroCheckCircle, heroCreditCard, heroLockClosed,
  heroCalendarDays, heroUsers, heroMapPin,
} from '@ng-icons/heroicons/outline';
import { Subscription } from 'rxjs';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface BookingPreview {
  bookingId:    string;
  clientSecret: string;   // used to mount Stripe Elements inline
  packageName:  string;
  totalPrice:   number;
  depositDue:   number;
  eventDate:    string;
  startTime:    string;
  endTime:      string;
  eventType:    string;
  venue:        string;
  guestCount:   number;
}

// View states for the payment section of the chat panel
type PaymentView = 'preview' | 'stripe' | 'success' | 'error';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroChatBubbleLeftRight, heroXMark, heroPaperAirplane,
    heroSparkles, heroCheckCircle, heroCreditCard, heroLockClosed,
    heroCalendarDays, heroUsers, heroMapPin,
  })],
  template: `
    <!-- ── Floating bubble ──────────────────────────────────────────────────── -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3"
         (mouseenter)="isHoveringBubble=true" (mouseleave)="isHoveringBubble=false">
      <!-- Tooltip: only visible when hovering the bubble AND panel is closed -->
      <div *ngIf="!isOpen && isHoveringBubble"
           class="bg-navy text-white text-sm font-semibold px-4 py-2.5 rounded-2xl rounded-br-sm shadow-xl max-w-[200px] text-center"
           style="animation:fadeUp .15s ease">
        Need help choosing? Ask Maya! 🎧
        <div class="absolute -bottom-2 right-5 w-0 h-0
                    border-l-[7px] border-l-transparent
                    border-r-[7px] border-r-transparent
                    border-t-[8px] border-t-navy"></div>
      </div>
      <button (click)="togglePanel()"
              class="relative w-14 h-14 bg-accent text-white rounded-full shadow-xl flex items-center justify-center transition-all hover:bg-accent-dark hover:scale-105 active:scale-95 border-0">
        <ng-icon *ngIf="!isOpen" name="heroChatBubbleLeftRight" class="w-6 h-6"/>
        <ng-icon *ngIf="isOpen"  name="heroXMark"               class="w-6 h-6"/>
        <span *ngIf="unreadCount>0 && !isOpen"
              class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {{ unreadCount }}
        </span>
      </button>
    </div>

    <!-- ── Chat panel ───────────────────────────────────────────────────────── -->
    <div *ngIf="isOpen"
         class="fixed bottom-24 right-6 z-50 w-[390px] max-h-[640px] flex flex-col bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
         style="animation:slideUp .2s ease">

      <!-- Header -->
      <div class="bg-navy px-5 py-4 flex items-center gap-3 shrink-0">
        <div class="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
          <ng-icon name="heroSparkles" class="w-5 h-5 text-accent"/>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-white font-bold text-sm">Maya — AI Booking Assistant</div>
          <div class="flex items-center gap-1.5 mt-0.5">
            <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
            <span class="text-white/40 text-xs">Online · DJ BookPro</span>
          </div>
        </div>
        <button (click)="clearChat()" class="text-white/30 hover:text-white/70 text-xs font-medium border-0 bg-transparent transition-colors">
          Clear
        </button>
      </div>

      <!-- Messages -->
      <div #scrollContainer class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-stone-50"
           style="min-height:300px;max-height:440px">

        <!-- Welcome empty state -->
        <div *ngIf="messages.length===0" class="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
          <div class="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <ng-icon name="heroSparkles" class="w-8 h-8 text-accent"/>
          </div>
          <div>
            <p class="font-bold text-stone-800 mb-1">Hi! I'm Maya 👋</p>
            <p class="text-stone-400 text-sm leading-relaxed">I can help you find the perfect DJ package, check availability, and book your event — all in one conversation.</p>
          </div>
          <div class="flex flex-wrap gap-2 justify-center">
            <button *ngFor="let s of quickStarters" (click)="sendQuick(s)"
                    class="text-xs font-semibold px-3 py-1.5 bg-white border border-stone-200 text-stone-600 rounded-full hover:border-accent hover:text-accent transition-all cursor-pointer">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Message bubbles -->
        <ng-container *ngFor="let msg of messages">
          <div *ngIf="msg.role==='user'" class="flex justify-end">
            <div class="bg-accent text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
              {{ msg.text }}
            </div>
          </div>
          <div *ngIf="msg.role==='assistant'" class="flex gap-2 items-end">
            <div class="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mb-0.5">
              <ng-icon name="heroSparkles" class="w-3.5 h-3.5 text-navy"/>
            </div>
            <div class="bg-white border border-stone-200 text-stone-700 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%] leading-relaxed shadow-sm"
                 [innerHTML]="formatText(msg.text)"></div>
          </div>
        </ng-container>

        <!-- ── Booking preview card ─────────────────────────────────────────── -->
        <div *ngIf="bookingPreview && paymentView==='preview'"
             class="bg-white border-2 border-accent/30 rounded-2xl p-4 shadow-md mx-1">
          <div class="flex items-center gap-2 mb-3">
            <ng-icon name="heroCheckCircle" class="w-5 h-5 text-emerald-500"/>
            <span class="font-bold text-stone-800 text-sm">Booking Preview</span>
            <span class="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">Awaiting Payment</span>
          </div>
          <div class="flex flex-col gap-2 text-xs text-stone-600 mb-4">
            <div class="flex items-center gap-2">
              <ng-icon name="heroSparkles" class="w-3.5 h-3.5 text-accent shrink-0"/>
              <span><strong>{{ bookingPreview.packageName }}</strong></span>
            </div>
            <div class="flex items-center gap-2">
              <ng-icon name="heroCalendarDays" class="w-3.5 h-3.5 text-stone-400 shrink-0"/>
              <span>{{ bookingPreview.eventDate | date:'EEE, MMM d, y' }} · {{ bookingPreview.startTime }} – {{ bookingPreview.endTime }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ng-icon name="heroMapPin" class="w-3.5 h-3.5 text-stone-400 shrink-0"/>
              <span>{{ bookingPreview.venue }}</span>
            </div>
            <div class="flex items-center gap-2">
              <ng-icon name="heroUsers" class="w-3.5 h-3.5 text-stone-400 shrink-0"/>
              <span>{{ bookingPreview.guestCount }} guests · {{ bookingPreview.eventType | titlecase }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between pt-3 border-t border-stone-100">
            <div>
              <div class="text-stone-400 text-[10px] uppercase tracking-wide">Deposit due</div>
              <div class="font-display font-bold text-accent text-lg">\${{ bookingPreview.depositDue }}</div>
            </div>
            <button (click)="openStripeInChat()"
                    class="flex items-center gap-2 bg-accent text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-accent-dark transition-colors border-0">
              <ng-icon name="heroCreditCard" class="w-4 h-4"/>Proceed to Payment
            </button>
          </div>
        </div>

        <!-- ── Inline Stripe payment ────────────────────────────────────────── -->
        <div *ngIf="bookingPreview && paymentView==='stripe'"
             class="bg-white border-2 border-stone-200 rounded-2xl p-4 mx-1 shadow-md">
          <div class="flex items-center justify-between mb-3">
            <span class="font-bold text-stone-800 text-sm flex items-center gap-1.5">
              <ng-icon name="heroLockClosed" class="w-4 h-4 text-accent"/>Secure Payment
            </span>
            <span class="font-display font-bold text-accent">\${{ bookingPreview.depositDue }}</span>
          </div>

          <div *ngIf="isStripeLoading" class="flex items-center justify-center gap-2 py-6 text-stone-400 text-sm">
            <div class="w-4 h-4 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
            Initialising payment…
          </div>
          <!-- Stripe mounts here -->
          <div id="chat-stripe-element" [class.hidden]="isStripeLoading" class="mb-3"></div>

          <div *ngIf="paymentError" class="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-600 mb-3 flex items-start gap-1.5">
            <span class="font-bold shrink-0">⚠</span>
            <span>{{ paymentError }}</span>
          </div>
          <div *ngIf="paymentError" class="text-center mb-2">
            <button (click)="resumeChat()"
                    class="text-xs text-stone-400 hover:text-accent transition-colors border-0 bg-transparent underline cursor-pointer">
              Cancel payment and return to chat
            </button>
          </div>

          <div class="flex items-center gap-1.5 text-[10px] text-stone-400 mb-3">
            <ng-icon name="heroLockClosed" class="w-3 h-3 shrink-0"/>Secured by Stripe. Card details never stored on our servers.
          </div>

          <div class="flex gap-2">
            <button (click)="paymentView='preview'" [disabled]="isProcessingPayment"
                    class="flex-1 py-2 rounded-xl text-xs font-semibold border border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-400 transition-all disabled:opacity-40 border-0-r">
              ← Back
            </button>
            <button (click)="confirmChatPayment()"
                    [disabled]="isStripeLoading || !isCardComplete || isProcessingPayment"
                    class="flex-[2] flex items-center justify-center gap-1.5 bg-accent text-white font-bold py-2 rounded-xl text-xs hover:bg-accent-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed border-0">
              <span *ngIf="!isProcessingPayment" class="flex items-center gap-1.5">
                <ng-icon name="heroLockClosed" class="w-3.5 h-3.5"/>Pay \${{ bookingPreview.depositDue }}
              </span>
              <span *ngIf="isProcessingPayment" class="flex items-center gap-1.5">
                <div class="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Processing…
              </span>
            </button>
          </div>
        </div>

        <!-- ── Payment success ──────────────────────────────────────────────── -->
        <div *ngIf="paymentView==='success'"
             class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mx-1 text-center">
          <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ng-icon name="heroCheckCircle" class="w-7 h-7 text-emerald-500"/>
          </div>
          <p class="font-bold text-stone-800 mb-1">Booking Confirmed!</p>
          <p class="text-stone-500 text-xs leading-relaxed mb-3">Your deposit has been received. A confirmation email is on its way!</p>
          <div class="flex items-center justify-center gap-2">
            <a routerLink="/dashboard" (click)="isOpen=false"
               class="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl no-underline hover:bg-accent-dark transition-colors">
              View My Bookings →
            </a>
            <button (click)="resumeChat()"
                    class="text-xs font-semibold text-stone-500 hover:text-accent transition-colors border-0 bg-transparent underline cursor-pointer">
              Continue chatting
            </button>
          </div>
        </div>

        <!-- Typing indicator -->
        <div *ngIf="isLoading" class="flex gap-2 items-end">
          <div class="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center shrink-0">
            <ng-icon name="heroSparkles" class="w-3.5 h-3.5 text-navy"/>
          </div>
          <div class="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
            <div class="flex gap-1 items-center">
              <div class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:0ms"></div>
              <div class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:150ms"></div>
              <div class="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style="animation-delay:300ms"></div>
            </div>
          </div>
        </div>

        <!-- Login prompt -->
        <div *ngIf="showLoginPrompt" class="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-stone-600">
          <strong class="text-accent block mb-1">Sign in to continue</strong>
          To create a booking you'll need to be signed in.
          <a routerLink="/login" (click)="isOpen=false" class="text-accent font-semibold ml-1 no-underline hover:underline">Sign in →</a>
        </div>
      </div>

      <!-- Input (hidden during payment) -->
      <div class="shrink-0 border-t border-stone-100 bg-white px-4 py-3 flex items-end gap-2">
        <textarea #inputEl [(ngModel)]="userInput" (keydown.enter)="onEnter($any($event))"
                  [disabled]="isLoading" rows="1"
                  placeholder="Ask about packages, dates, or start booking…"
                  class="flex-1 resize-none text-sm bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-accent transition-colors text-stone-700 placeholder:text-stone-400 disabled:opacity-50"
                  style="max-height:120px;overflow-y:auto"
                  (input)="autoResize($event)"></textarea>
        <button (click)="sendMessage()" [disabled]="!userInput.trim() || isLoading"
                class="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-accent-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed border-0">
          <ng-icon name="heroPaperAirplane" class="w-4 h-4"/>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .border-0-r { border-width: 1px !important; }
  `]
})
export class AiChatComponent implements OnInit, AfterViewChecked, OnDestroy {

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl')         inputEl!: ElementRef<HTMLTextAreaElement>;

  isOpen     = false;
  isLoading  = false;
  userInput  = '';
  messages: ChatMessage[] = [];
  unreadCount = 0;
  bookingPreview: BookingPreview | null = null;
  showLoginPrompt = false;
  paymentView: PaymentView = 'preview';

  // ── Stripe (inline in chat) ───────────────────────────────────────────────
  private stripe:         Stripe | null          = null;
  private stripeElements: StripeElements | null   = null;
  private paymentElement: StripePaymentElement | null = null;

  isStripeLoading     = false;
  isProcessingPayment = false;
  isCardComplete      = false;
  paymentError        = '';
  private chatElementMounted = false;

  private geminiHistory: any[] = [];
  private authSub!: Subscription;
  private currentUserId = '';
  isHoveringBubble = false;

  quickStarters = [
    '💰 Show me packages',
    '📅 Check a date',
    '🎂 Birthday party',
    '💍 Wedding DJ',
  ];

  constructor(
    private http:        HttpClient,
    private authService: AuthService,
    private router:      Router,
    private cdr:         ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initStripe();

    // Wipe chat state whenever the logged-in user changes (login, logout, switch).
    // The component lives in the app shell and is never destroyed between routes,
    // so without this guard user A's history would be visible to user B.
    this.authSub = this.authService.currentUser$.subscribe(user => {
      const incomingId = user?.id ?? '';
      if (incomingId !== this.currentUserId) {
        this.currentUserId = incomingId;
        this.wipeSessionState();
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
    // Mount inline Stripe element when paymentView switches to 'stripe'
    if (
      this.paymentView === 'stripe' &&
      !this.chatElementMounted &&
      this.bookingPreview?.clientSecret &&
      this.stripe
    ) {
      this.mountChatStripeElement();
    }
  }

  ngOnDestroy(): void {
    this.paymentElement?.destroy();
    this.authSub?.unsubscribe();
  }

  // ── Panel ─────────────────────────────────────────────────────────────────

  togglePanel(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      setTimeout(() => this.inputEl?.nativeElement.focus(), 100);
    }
  }

  // ── Messaging ─────────────────────────────────────────────────────────────

  sendQuick(text: string): void { this.userInput = text; this.sendMessage(); }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) { event.preventDefault(); this.sendMessage(); }
  }

  autoResize(event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.isLoading) return;
    this.showLoginPrompt = false;
    this.userInput = '';
    this.resetTextareaHeight();
    this.messages.push({ role: 'user', text, timestamp: new Date() });
    this.isLoading = true;
    this.cdr.detectChanges();

    this.http.post<any>(`${environment.apiUrl}/agent/chat`, {
      message: text,
      history: this.geminiHistory,
    }).subscribe({
      next: res => {
        const data = res.data;
        this.geminiHistory = data.history ?? [];
        this.isLoading = false;
        if (data.reply) {
          this.messages.push({ role: 'assistant', text: data.reply, timestamp: new Date() });
        }
        if (data.bookingPreview) {
          this.bookingPreview = data.bookingPreview;
          this.paymentView    = 'preview';
          this.chatElementMounted = false;
        }
        if (!this.isOpen) this.unreadCount++;
        this.cdr.detectChanges();
      },
      error: err => {
        this.isLoading = false;
        if (err.status === 401) {
          this.showLoginPrompt = true;
          this.messages.push({ role: 'assistant', text: "To create a booking I need you to be signed in. You can still ask me about packages and pricing!", timestamp: new Date() });
        } else {
          this.messages.push({ role: 'assistant', text: 'Sorry, something went wrong. Please try again in a moment.', timestamp: new Date() });
        }
        this.cdr.detectChanges();
      },
    });
  }

  // ── Payment flow ──────────────────────────────────────────────────────────

  /** User clicks "Proceed to Payment" on the booking preview card */
  openStripeInChat(): void {
    this.paymentView       = 'stripe';
    this.chatElementMounted = false;
    this.paymentError      = '';
    this.isCardComplete    = false;
    this.cdr.detectChanges();
  }

  private async initStripe(): Promise<void> {
    this.stripe = await loadStripe((environment as any).stripePublishableKey ?? '');
  }

  private mountChatStripeElement(): void {
    if (!this.stripe || !this.bookingPreview?.clientSecret) return;
    this.chatElementMounted = true;
    this.isStripeLoading    = true;
    this.isCardComplete     = false;

    // Destroy any previous element instance
    this.paymentElement?.destroy();

    this.stripeElements = this.stripe.elements({
      clientSecret: this.bookingPreview.clientSecret,
      appearance: {
        theme:     'stripe',
        variables: {
          colorPrimary:    '#dc6b2f',
          colorBackground: '#ffffff',
          borderRadius:    '10px',
          fontFamily:      '"DM Sans", sans-serif',
          fontSizeBase:    '13px',
        },
      },
    });

    this.paymentElement = this.stripeElements.create('payment');
    this.paymentElement.mount('#chat-stripe-element');

    this.paymentElement.on('ready', () => {
      this.isStripeLoading = false;
      this.cdr.detectChanges();
    });

    // Gate the Pay button until card is complete
    this.paymentElement.on('change', (event: any) => {
      this.isCardComplete = event.complete === true;
      if (event.complete) this.paymentError = '';
      this.cdr.detectChanges();
    });
  }

  /** User clicks "Pay $X" inside the chat panel */
  async confirmChatPayment(): Promise<void> {
    if (!this.stripe || !this.stripeElements || !this.isCardComplete || !this.bookingPreview) return;

    this.isProcessingPayment = true;
    this.paymentError        = '';

    // 1. Stripe confirms the card
    const { error: stripeError } = await this.stripe.confirmPayment({
      elements:       this.stripeElements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect:       'if_required',
    });

    if (stripeError) {
      // Stay on Stripe view — show error — force re-entry
      this.paymentError        = stripeError.message ?? 'Payment failed. Please try a different card.';
      this.isProcessingPayment = false;
      this.isCardComplete      = false;
      this.cdr.detectChanges();
      return;
    }

    // 2. Backend verifies Stripe and finalises booking
    this.http.post<any>(
      `${environment.apiUrl}/bookings/${this.bookingPreview.bookingId}/confirm`,
      {}
    ).subscribe({
      next: () => {
        this.isProcessingPayment = false;
        this.paymentView         = 'success';   // ← only path to success
        this.cdr.detectChanges();
      },
      error: err => {
        this.paymentError = err.error?.message
          ?? 'Payment received but confirmation failed. Contact support with ref: ' + this.bookingPreview?.bookingId;
        this.isProcessingPayment = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  /** Wipe ALL per-user state — called on every user identity change */
  private wipeSessionState(): void {
    this.messages           = [];
    this.geminiHistory      = [];
    this.bookingPreview     = null;
    this.paymentView        = 'preview';
    this.paymentError       = '';
    this.isCardComplete     = false;
    this.isProcessingPayment = false;
    this.isLoading          = false;
    this.unreadCount        = 0;
    this.showLoginPrompt    = false;
    this.chatElementMounted = false;
    this.paymentElement?.destroy();
    this.paymentElement  = null;
    this.stripeElements  = null;
    // Close the panel so the new user always starts with a fresh closed state
    this.isOpen = false;
  }

  /** Dismiss the payment/success card and return to normal chat flow */
  resumeChat(): void {
    this.paymentView        = 'preview';
    this.bookingPreview     = null;
    this.paymentError       = '';
    this.isCardComplete     = false;
    this.isProcessingPayment = false;
    this.chatElementMounted = false;
    this.paymentElement?.destroy();
    this.paymentElement  = null;
    this.stripeElements  = null;
    // Refocus the textarea so the user can immediately keep typing
    setTimeout(() => this.inputEl?.nativeElement?.focus(), 80);
  }

  clearChat(): void {
    this.wipeSessionState();
    // Re-open is allowed after manual clear (unlike auth-triggered wipe)
    this.isOpen = true;
  }

  formatText(text: string): string {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/\n/g,            '<br>');
  }

  private scrollToBottom(): void {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  private resetTextareaHeight(): void {
    if (this.inputEl?.nativeElement) this.inputEl.nativeElement.style.height = 'auto';
  }
}
