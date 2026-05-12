import {
  Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroArrowRight, heroCheckCircle, heroCalendarDays,
  heroUsers, heroClock, heroMapPin, heroChevronLeft, heroChevronRight,
  heroLockClosed, heroCreditCard,
} from '@ng-icons/heroicons/outline';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

import { BookingService, PackageService, CalendarService } from '../../core/services/api.service';
import { PaymentService } from '../../core/services/payment.service';
import { Package } from '../../shared/models';
import { environment } from '../../../environments/environment';

// ── Step enum ─────────────────────────────────────────────────────────────────
const enum BookingStep {
  Package = 0,
  Date    = 1,
  Details = 2,
  Confirm = 3,
  Payment = 4,   // Stripe Payment Element
  Success = 5,   // post-payment confirmation
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroArrowLeft, heroArrowRight, heroCheckCircle, heroCalendarDays,
    heroUsers, heroClock, heroMapPin, heroChevronLeft, heroChevronRight,
    heroLockClosed, heroCreditCard,
  })],
  template: `
    <div class="min-h-screen bg-cream">

      <!-- Header / Step Indicator -->
      <div class="bg-white border-b border-stone-200">
        <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2 text-stone-400 hover:text-accent text-sm font-medium no-underline transition-colors">
            <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back to Home
          </a>
          <div class="font-display text-lg font-bold text-stone-800">🎧 DJ <span class="text-accent">BookPro</span></div>
          <div class="flex items-center gap-2">
            <div *ngFor="let s of stepLabels; let i = index" class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                     [class.bg-accent]="currentStep>=i" [class.text-white]="currentStep>=i"
                     [class.bg-stone-100]="currentStep<i" [class.text-stone-400]="currentStep<i">
                  <ng-icon *ngIf="currentStep>i" name="heroCheckCircle" class="w-4 h-4"/>
                  <span *ngIf="currentStep<=i">{{ i+1 }}</span>
                </div>
                <span class="hidden md:block text-xs font-semibold"
                      [class.text-accent]="currentStep===i" [class.text-stone-400]="currentStep!==i">{{ s }}</span>
              </div>
              <div *ngIf="i<stepLabels.length-1" class="w-6 h-px bg-stone-200"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-5xl mx-auto px-6 py-10">

        <!-- STEP 0: Package -->
        <div *ngIf="currentStep===0">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Choose a Package</h2>
          <p class="text-stone-400 text-sm mb-7">Select the service package that best fits your event.</p>
          <div *ngIf="packages.length===0" class="flex justify-center py-16 gap-3 text-stone-400">
            <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
            Loading packages…
          </div>
          <div class="grid md:grid-cols-3 gap-5 mb-8">
            <div *ngFor="let p of packages"
                 (click)="selectPackage(p)"
                 class="card p-6 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative"
                 [ngClass]="{'border-2 border-accent': selectedPackage?._id===p._id}">
              <div *ngIf="selectedPackage?._id===p._id"
                   class="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                <ng-icon name="heroCheckCircle" class="w-4 h-4 text-white"/>
              </div>
              <div class="font-display text-3xl font-bold text-accent mb-1">\${{ p.basePrice }}</div>
              <h3 class="font-display text-lg font-bold text-stone-900 mb-2">{{ p.name }}</h3>
              <p class="text-xs text-stone-400 mb-4 leading-relaxed">{{ p.description }}</p>
              <div class="text-xs text-stone-400 mb-4 flex items-center gap-1">
                <ng-icon name="heroClock" class="w-3.5 h-3.5"/>Up to {{ p.duration }} hours
              </div>
              <ul class="flex flex-col gap-2">
                <li *ngFor="let f of p.features.slice(0,3)" class="flex items-start gap-2 text-xs text-stone-600">
                  <span class="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>{{ f }}
                </li>
              </ul>
            </div>
          </div>
          <div class="flex justify-end">
            <button [disabled]="!selectedPackage" (click)="currentStep=1"
                    class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Next: Choose Date <ng-icon name="heroArrowRight" class="w-4 h-4"/>
            </button>
          </div>
        </div>

        <!-- STEP 1: Date -->
        <div *ngIf="currentStep===1">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Select a Date</h2>
          <p class="text-stone-400 text-sm mb-7">Choose your preferred event date.</p>
          <div class="max-w-md mx-auto">
            <div class="card p-6 mb-5">
              <div class="flex items-center justify-between mb-5">
                <button (click)="prevMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 hover:border-accent hover:text-accent transition-all bg-white">
                  <ng-icon name="heroChevronLeft" class="w-4 h-4"/>
                </button>
                <span class="font-display text-base font-bold text-stone-800">{{ monthLabel }}</span>
                <button (click)="nextMonth()" class="w-9 h-9 flex items-center justify-center rounded-xl border border-stone-200 hover:border-accent hover:text-accent transition-all bg-white">
                  <ng-icon name="heroChevronRight" class="w-4 h-4"/>
                </button>
              </div>
              <div class="grid grid-cols-7 mb-2">
                <div *ngFor="let d of dayNames" class="text-center text-[10px] font-bold uppercase tracking-wide text-stone-400 py-1">{{ d }}</div>
              </div>
              <div class="grid grid-cols-7 gap-1">
                <div *ngFor="let c of calCells"
                     class="aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all"
                     [ngClass]="{
                       'opacity-0':                          !c.date,
                       'cursor-pointer':                      c.date && !c.isPast && !c.isUnavailable,
                       'cursor-not-allowed':                  c.isPast || c.isUnavailable,
                       'bg-stone-50 hover:bg-orange-50 hover:text-accent': c.date && !c.isPast && !c.isUnavailable && !c.isSelected,
                       'text-stone-300 bg-stone-50':          c.isPast,
                       'bg-red-50 text-red-300':              c.isUnavailable && !c.isPast,
                       'bg-accent text-white font-bold':      c.isSelected,
                       'ring-2 ring-navy font-bold':          c.isToday && !c.isSelected
                     }"
                     (click)="c.date && !c.isPast && !c.isUnavailable && selectDate(c.date)">
                  <span *ngIf="c.date">{{ c.date | date:'d' }}</span>
                </div>
              </div>
            </div>
            <div *ngIf="selectedDate" class="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-semibold text-accent mb-5">
              <ng-icon name="heroCalendarDays" class="w-4 h-4"/>{{ selectedDate | date:'EEEE, MMMM d, y' }}
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button (click)="currentStep=0" class="btn-ghost">
              <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
            </button>
            <button [disabled]="!selectedDate" (click)="currentStep=2"
                    class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Next: Event Details <ng-icon name="heroArrowRight" class="w-4 h-4"/>
            </button>
          </div>
        </div>

        <!-- STEP 2: Details -->
        <div *ngIf="currentStep===2">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Event Details</h2>
          <p class="text-stone-400 text-sm mb-7">Tell us more about your event.</p>
          <form [formGroup]="detailsForm" class="max-w-2xl">
            <div class="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label class="form-label">Event Type</label>
                <select formControlName="eventType" class="form-input">
                  <option value="">Select type…</option>
                  <option *ngFor="let t of eventTypes" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Guest Count</label>
                <input type="number" formControlName="guestCount" class="form-input" placeholder="100"/>
              </div>
              <div>
                <label class="form-label">Start Time</label>
                <input type="time" formControlName="startTime" class="form-input"/>
              </div>
              <div>
                <label class="form-label">End Time</label>
                <input type="time" formControlName="endTime" class="form-input"/>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-5 mb-5">
              <div>
                <label class="form-label">Venue Name</label>
                <input type="text" formControlName="venueName" class="form-input" placeholder="The Grand Ballroom"/>
              </div>
              <div>
                <label class="form-label">City</label>
                <input type="text" formControlName="venueCity" class="form-input" placeholder="New York"/>
              </div>
              <div class="col-span-2">
                <label class="form-label">Address</label>
                <input type="text" formControlName="venueAddress" class="form-input" placeholder="123 Main Street"/>
              </div>
            </div>
            <div class="mb-6">
              <label class="form-label">Special Requests (optional)</label>
              <textarea formControlName="specialRequests" rows="3" class="form-input resize-none"></textarea>
            </div>
            <div class="flex justify-between">
              <button type="button" (click)="currentStep=1" class="btn-ghost">
                <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
              </button>
              <button type="button" [disabled]="detailsForm.invalid" (click)="currentStep=3"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                Review Booking <ng-icon name="heroArrowRight" class="w-4 h-4"/>
              </button>
            </div>
          </form>
        </div>

        <!-- STEP 3: Confirm / Review -->
        <div *ngIf="currentStep===3">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Review & Confirm</h2>
          <p class="text-stone-400 text-sm mb-7">Review your booking before proceeding to payment.</p>
          <div class="max-w-2xl">
            <div class="card p-6 mb-5">
              <div class="flex flex-col gap-0">
                <div class="flex justify-between py-3 border-b border-stone-50 text-sm"><span class="text-stone-400">Package</span><strong class="text-stone-800">{{ selectedPackage?.name }} — \${{ selectedPackage?.basePrice }}</strong></div>
                <div class="flex justify-between py-3 border-b border-stone-50 text-sm"><span class="text-stone-400">Date</span><strong class="text-stone-800">{{ selectedDate | date:'EEEE, MMMM d, y' }}</strong></div>
                <div class="flex justify-between py-3 border-b border-stone-50 text-sm"><span class="text-stone-400">Time</span><strong class="text-stone-800">{{ detailsForm.value.startTime }} – {{ detailsForm.value.endTime }}</strong></div>
                <div class="flex justify-between py-3 border-b border-stone-50 text-sm"><span class="text-stone-400">Event</span><strong class="text-stone-800">{{ detailsForm.value.eventType | titlecase }}</strong></div>
                <div class="flex justify-between py-3 border-b border-stone-50 text-sm"><span class="text-stone-400">Venue</span><strong class="text-stone-800">{{ detailsForm.value.venueName }}, {{ detailsForm.value.venueCity }}</strong></div>
                <div class="flex justify-between py-3 text-sm"><span class="text-stone-400">Guests</span><strong class="text-stone-800">{{ detailsForm.value.guestCount }}</strong></div>
              </div>
            </div>

            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-sm text-stone-600">
              <strong class="text-accent block mb-1">Deposit Due Now</strong>
              A 30% deposit of <strong class="text-accent font-bold">\${{ depositAmount | number:'1.2-2' }}</strong>
              is required to secure your date. The remaining
              <strong>\${{ remainingAmount | number:'1.2-2' }}</strong> is due on the event day.
            </div>

            <div *ngIf="submitError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">
              ⚠ {{ submitError }}
            </div>

            <div class="flex justify-between">
              <button (click)="currentStep=2" class="btn-ghost">
                <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
              </button>
              <button (click)="submitBookingAndCreateIntent()" [disabled]="isSubmitting"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                <span *ngIf="!isSubmitting" class="flex items-center gap-2">
                  <ng-icon name="heroCreditCard" class="w-4 h-4"/>Continue to Payment
                </span>
                <span *ngIf="isSubmitting" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Saving booking…
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 4: Payment (Stripe Payment Element) -->
        <div *ngIf="currentStep===4">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Secure Payment</h2>
          <p class="text-stone-400 text-sm mb-7">
            Pay the 30% deposit of
            <strong class="text-accent">\${{ depositAmount | number:'1.2-2' }}</strong>
            to confirm your booking.
          </p>

          <div class="max-w-lg">
            <div class="card p-6 mb-4">
              <!-- Stripe loading skeleton -->
              <div *ngIf="isStripeLoading" class="flex items-center justify-center gap-3 py-10 text-stone-400">
                <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
                Initialising secure payment…
              </div>
              <!-- Stripe mounts here; hidden via CSS until ready to avoid flash -->
              <div id="stripe-payment-element" [class.hidden]="isStripeLoading"></div>
            </div>

            <div *ngIf="paymentError" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
              ⚠ {{ paymentError }}
            </div>

            <div class="flex items-center gap-2 text-xs text-stone-400 mb-5">
              <ng-icon name="heroLockClosed" class="w-3.5 h-3.5"/>
              Payments processed securely by Stripe. Card details are never stored on our servers.
            </div>

            <div class="flex justify-between">
              <button (click)="currentStep=3" [disabled]="isProcessingPayment"
                      class="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
              </button>
              <button (click)="confirmPayment()" [disabled]="isStripeLoading || isProcessingPayment"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px] justify-center">
                <span *ngIf="!isProcessingPayment" class="flex items-center gap-2">
                  <ng-icon name="heroLockClosed" class="w-4 h-4"/>
                  Pay \${{ depositAmount | number:'1.2-2' }}
                </span>
                <span *ngIf="isProcessingPayment" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Processing…
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- STEP 5: Success -->
        <div *ngIf="currentStep===5" class="text-center py-16">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ng-icon name="heroCheckCircle" class="w-10 h-10 text-emerald-500"/>
          </div>
          <h2 class="font-display text-3xl font-bold text-stone-900 mb-3">Booking Confirmed!</h2>
          <p class="text-stone-500 text-base mb-2 max-w-md mx-auto">
            Your deposit of <strong class="text-accent">\${{ depositAmount | number:'1.2-2' }}</strong> has been received.
          </p>
          <p class="text-stone-400 text-sm mb-8">A confirmation email has been sent with all the details.</p>
          <div class="flex justify-center gap-4">
            <a routerLink="/dashboard" class="btn-primary">Go to Dashboard</a>
            <a routerLink="/" class="btn-ghost">Back to Home</a>
          </div>
        </div>

      </div>
    </div>
  `,
})
export class BookingComponent implements OnInit, OnDestroy, AfterViewChecked {

  // ── Data ──────────────────────────────────────────────────────────────────
  packages: Package[]     = [];
  selectedPackage: Package | null = null;
  selectedDate: Date | null       = null;

  // ── Step state ────────────────────────────────────────────────────────────
  currentStep = BookingStep.Package;
  stepLabels  = ['Package', 'Date', 'Details', 'Confirm', 'Payment'];

  // ── Form ──────────────────────────────────────────────────────────────────
  detailsForm: FormGroup;
  isSubmitting = false;
  submitError  = '';

  // ── Calendar ──────────────────────────────────────────────────────────────
  blockedDates: string[] = [];
  calMonth  = new Date();
  dayNames  = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  eventTypes = [
    { value: 'wedding',   label: 'Wedding'         },
    { value: 'birthday',  label: 'Birthday Party'  },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'club',      label: 'Club Night'      },
    { value: 'festival',  label: 'Festival'        },
    { value: 'other',     label: 'Other'           },
  ];

  // ── Stripe ────────────────────────────────────────────────────────────────
  private stripe:         Stripe | null         = null;
  private stripeElements: StripeElements | null  = null;
  private paymentElement: StripePaymentElement | null = null;
  private savedBookingId  = '';   // set after createBooking succeeds
  private clientSecret    = '';   // from create-intent
  private intentId        = '';   // pi_xxx extracted from clientSecret

  isStripeLoading     = false;
  isProcessingPayment = false;
  paymentError        = '';

  // Guard: mount the Payment Element only once per clientSecret
  private elementMounted = false;

  constructor(
    private bookingService:  BookingService,
    private packageService:  PackageService,
    private calendarService: CalendarService,
    private paymentService:  PaymentService,
    private fb:              FormBuilder,
    private router:          Router,
    private cdr:             ChangeDetectorRef,
  ) {
    this.detailsForm = this.fb.group({
      eventType:       ['',   Validators.required],
      guestCount:      [null, [Validators.required, Validators.min(1)]],
      startTime:       ['',   Validators.required],
      endTime:         ['',   Validators.required],
      venueName:       ['',   Validators.required],
      venueAddress:    ['',   Validators.required],
      venueCity:       ['',   Validators.required],
      venueState:      [''],
      specialRequests: [''],
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.packageService.getPackages().subscribe({ next: r => this.packages = r.data });
    this.loadAvailability();
    this.initStripe();  // pre-load Stripe.js in background
  }

  /**
   * Mount the Stripe Payment Element the first time step 4 renders
   * and we have a clientSecret + an initialised Stripe instance.
   */
  ngAfterViewChecked(): void {
    if (
      this.currentStep === BookingStep.Payment &&
      !this.elementMounted &&
      this.clientSecret &&
      this.stripe
    ) {
      this.mountStripeElement();
    }
  }

  ngOnDestroy(): void {
    this.paymentElement?.destroy();
    this.stripeElements  = null;
    this.paymentElement  = null;
  }

  // ── Calendar helpers ──────────────────────────────────────────────────────

  loadAvailability(): void {
    this.calendarService
      .getAvailability(this.calMonth.getFullYear(), this.calMonth.getMonth() + 1)
      .subscribe({
        next: r => {
          this.blockedDates = (r.data?.blockedDates ?? []).map(
            (d: any) => new Date(d.date).toDateString(),
          );
        },
      });
  }

  selectPackage(p: Package): void { this.selectedPackage = p; }
  selectDate(d: Date):       void { this.selectedDate    = d; }

  get monthLabel(): string {
    return this.calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    this.calMonth = new Date(this.calMonth.getFullYear(), this.calMonth.getMonth() - 1, 1);
    this.loadAvailability();
  }

  nextMonth(): void {
    this.calMonth = new Date(this.calMonth.getFullYear(), this.calMonth.getMonth() + 1, 1);
    this.loadAvailability();
  }

  get calCells(): any[] {
    const y = this.calMonth.getFullYear(), m = this.calMonth.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cells: any[] = [];
    for (let i = 0; i < first; i++) cells.push({ date: null });
    for (let d = 1; d <= days; d++) {
      const dt = new Date(y, m, d);
      cells.push({
        date:          dt,
        isPast:        dt < today,
        isUnavailable: this.blockedDates.includes(dt.toDateString()),
        isSelected:    this.selectedDate?.toDateString() === dt.toDateString(),
        isToday:       dt.toDateString() === today.toDateString(),
      });
    }
    return cells;
  }

  // ── Computed amounts ──────────────────────────────────────────────────────

  get depositAmount(): number {
    return Math.round((this.selectedPackage?.basePrice ?? 0) * 0.3 * 100) / 100;
  }

  get remainingAmount(): number {
    return (this.selectedPackage?.basePrice ?? 0) - this.depositAmount;
  }

  // ── Main flow: Step 3 → "Continue to Payment" ────────────────────────────

  submitBookingAndCreateIntent(): void {
    if (!this.selectedPackage || !this.selectedDate) return;
    this.isSubmitting = true;
    this.submitError  = '';

    const v = this.detailsForm.value;

    // 1. Save the booking
    this.bookingService.createBooking({
      packageId:       this.selectedPackage._id,
      eventDate:       this.selectedDate.toISOString(),
      startTime:       v.startTime,
      endTime:         v.endTime,
      eventType:       v.eventType,
      guestCount:      v.guestCount,
      venue: {
        name:    v.venueName,
        address: v.venueAddress,
        city:    v.venueCity,
        state:   v.venueState,
      },
      specialRequests: v.specialRequests,
    }).subscribe({
      next: bookingRes => {
        this.savedBookingId = (bookingRes.data as any)._id as string;

        // 2. Create the Stripe PaymentIntent
        this.paymentService
          .createPaymentIntent(this.savedBookingId, this.depositAmount)
          .subscribe({
            next: intentRes => {
              this.clientSecret = intentRes.data.clientSecret;
              // Extract pi_xxx from "pi_xxx_secret_yyy" — used in confirm call
              this.intentId     = this.clientSecret.split('_secret_')[0];
              this.elementMounted = false;   // reset guard for fresh mount
              this.isSubmitting   = false;
              this.currentStep    = BookingStep.Payment;   // → step 4
              this.cdr.detectChanges();
            },
            error: err => {
              this.isSubmitting = false;
              this.submitError  = err.error?.message ?? 'Failed to initialise payment.';
            },
          });
      },
      error: err => {
        this.isSubmitting = false;
        this.submitError  = err.error?.message ?? 'Booking submission failed.';
      },
    });
  }

  // ── Stripe helpers ────────────────────────────────────────────────────────

  /** Pre-loads Stripe.js in the background so step 4 is instant */
  private async initStripe(): Promise<void> {
    this.stripe = await loadStripe(
      (environment as any).stripePublishableKey ?? '',
    );
  }

  /** Called once from ngAfterViewChecked when #stripe-payment-element exists */
  private mountStripeElement(): void {
    if (!this.stripe || !this.clientSecret) return;
    this.elementMounted  = true;
    this.isStripeLoading = true;

    this.stripeElements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary:    '#dc6b2f',   // --accent
          colorBackground: '#faf8f5',   // --cream
          borderRadius:    '12px',
          fontFamily:      '"DM Sans", sans-serif',
        },
      },
    });

    this.paymentElement = this.stripeElements.create('payment');
    this.paymentElement.mount('#stripe-payment-element');

    this.paymentElement.on('ready', () => {
      this.isStripeLoading = false;
      this.cdr.detectChanges();
    });
  }

  // ── Step 4 → "Pay" button ─────────────────────────────────────────────────

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.stripeElements) return;

    this.isProcessingPayment = true;
    this.paymentError        = '';

    // 1. Ask Stripe to confirm the payment using the card entered
    const { error } = await this.stripe.confirmPayment({
      elements:       this.stripeElements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect:       'if_required',   // stay SPA for cards that don't need redirect
    });

    if (error) {
      this.paymentError        = error.message ?? 'Payment failed. Please try again.';
      this.isProcessingPayment = false;
      this.cdr.detectChanges();
      return;
    }

    // 2. Payment succeeded on Stripe's side — verify server-side and
    //    update booking (depositPaid = true, status = 'confirmed')
    this.paymentService.confirmPayment(this.savedBookingId, this.intentId)
      .subscribe({
        next: () => {
          this.isProcessingPayment = false;
          this.currentStep         = BookingStep.Success;   // → step 5
          this.cdr.detectChanges();
        },
        error: err => {
          // Payment went through but DB update failed — surface clearly
          this.paymentError        = err.error?.message ?? 'Payment received but booking update failed. Contact support.';
          this.isProcessingPayment = false;
          this.cdr.detectChanges();
        },
      });
  }
}
