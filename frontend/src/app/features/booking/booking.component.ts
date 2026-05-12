/**
 * booking.component.ts  — FULL REPLACEMENT
 *
 * Payment gate flow:
 *   Step 0  Package selection
 *   Step 1  Date selection  (booked = blue/unselectable, blocked = red/unselectable)
 *   Step 2  Event details   (time chip grid, 12-hour format)
 *   Step 3  Review & submit → POST /api/bookings returns { bookingId, clientSecret }
 *   Step 4  Payment         → Stripe Elements mounted with clientSecret
 *                             "Pay" button disabled until card is complete (Stripe 'change' event)
 *                             stripe.confirmPayment() → on success → POST /api/bookings/:id/confirm
 *   Step 5  Success         → only reachable after server confirms payment
 *
 *   On any payment failure: stay on Step 4, show inline error, never advance.
 */

import {
  Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroArrowRight, heroCheckCircle, heroCalendarDays,
  heroClock, heroChevronLeft, heroChevronRight, heroLockClosed, heroCreditCard,
} from '@ng-icons/heroicons/outline';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { BookingService, PackageService, CalendarService } from '../../core/services/api.service';
import { Package } from '../../shared/models';
import { environment } from '../../../environments/environment';

// ── 12-hour time slots shown in chip grid ─────────────────────────────────────
const TIME_SLOTS = [
  '8:00 AM','9:00 AM','10:00 AM','11:00 AM',
  '12:00 PM','1:00 PM','2:00 PM','3:00 PM',
  '4:00 PM','5:00 PM','6:00 PM','7:00 PM',
  '8:00 PM','9:00 PM','10:00 PM','11:00 PM',
];

function to24(t: string): string {
  const [time, mer] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

// ── Step constants (plain object — const enum breaks Angular compiler) ────────
const BookingStep = {
  Package: 0, Date: 1, Details: 2,
  Confirm: 3, Payment: 4, Success: 5,
} as const;

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroArrowLeft, heroArrowRight, heroCheckCircle, heroCalendarDays,
    heroClock, heroChevronLeft, heroChevronRight, heroLockClosed, heroCreditCard,
  })],
  template: `
    <div class="min-h-screen bg-cream">

      <!-- Header / step indicator -->
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

        <!-- ── Step 0: Package ─────────────────────────────────────────────── -->
        <div *ngIf="currentStep===0">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Choose a Package</h2>
          <p class="text-stone-400 text-sm mb-7">Select the service package that fits your event.</p>
          <div *ngIf="packages.length===0" class="flex justify-center py-16 gap-3 text-stone-400">
            <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>Loading packages…
          </div>
          <div class="grid md:grid-cols-3 gap-5 mb-8">
            <div *ngFor="let p of packages" (click)="selectPackage(p)"
                 class="card p-6 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative"
                 [ngClass]="{'border-2 border-accent ring-2 ring-accent/20': selectedPackage?._id===p._id}">
              <div *ngIf="selectedPackage?._id===p._id" class="absolute top-3 right-3 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
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

        <!-- ── Step 1: Date ────────────────────────────────────────────────── -->
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
                     class="aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative"
                     [ngClass]="{
                       'opacity-0 pointer-events-none':                !c.date,
                       'cursor-pointer hover:bg-orange-50 hover:text-accent': c.date && !c.isPast && !c.isBooked && !c.isBlocked,
                       'cursor-not-allowed':                           c.isPast || c.isBooked || c.isBlocked,
                       'bg-stone-50 text-stone-700':                   c.date && !c.isPast && !c.isBooked && !c.isBlocked && !c.isSelected,
                       'text-stone-300':                               c.isPast,
                       'bg-blue-50 text-blue-500 border border-blue-200':  c.isBooked,
                       'bg-red-50 text-red-400 border border-red-200':     c.isBlocked && !c.isBooked,
                       'bg-accent text-white font-bold shadow-md':     c.isSelected,
                       'ring-2 ring-navy/40 font-bold':                c.isToday && !c.isSelected
                     }"
                     (click)="onDayClick(c)">
                  <span *ngIf="c.date">{{ c.date | date:'d' }}</span>
                  <span *ngIf="c.isBooked  && !c.isSelected" class="text-[7px] font-bold leading-none mt-0.5 text-blue-400">BOOKED</span>
                  <span *ngIf="c.isBlocked && !c.isBooked && !c.isSelected" class="text-[7px] font-bold leading-none mt-0.5 text-red-400">CLOSED</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-3 mt-4 pt-4 border-t border-stone-100">
                <div class="flex items-center gap-1.5 text-xs text-stone-400"><div class="w-3 h-3 rounded-sm bg-stone-100 border border-stone-200"></div>Available</div>
                <div class="flex items-center gap-1.5 text-xs text-stone-400"><div class="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200"></div>Booked</div>
                <div class="flex items-center gap-1.5 text-xs text-stone-400"><div class="w-3 h-3 rounded-sm bg-red-50 border border-red-200"></div>Closed</div>
                <div class="flex items-center gap-1.5 text-xs text-stone-400"><div class="w-3 h-3 rounded-sm bg-accent"></div>Selected</div>
              </div>
            </div>
            <div *ngIf="selectedDate" class="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm font-semibold text-accent mb-5">
              <ng-icon name="heroCalendarDays" class="w-4 h-4"/>{{ selectedDate | date:'EEEE, MMMM d, y' }}
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <button (click)="currentStep=0" class="btn-ghost"><ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back</button>
            <button [disabled]="!selectedDate" (click)="currentStep=2"
                    class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Next: Event Details <ng-icon name="heroArrowRight" class="w-4 h-4"/>
            </button>
          </div>
        </div>

        <!-- ── Step 2: Details ─────────────────────────────────────────────── -->
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
            </div>

            <!-- Start time chip grid -->
            <div class="mb-5">
              <label class="form-label">Start Time</label>
              <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <button *ngFor="let slot of timeSlots" type="button" (click)="selectStartTime(slot)"
                        class="px-2 py-2 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="{
                          'bg-accent text-white border-accent shadow-sm': selectedStartTime===slot,
                          'bg-stone-50 border-stone-200 text-stone-600 hover:border-accent hover:text-accent': selectedStartTime!==slot
                        }">{{ slot }}</button>
              </div>
              <p *ngIf="!selectedStartTime && formSubmitAttempted" class="text-red-500 text-xs mt-1.5">Please select a start time</p>
            </div>

            <!-- End time chip grid -->
            <div class="mb-5">
              <label class="form-label">End Time</label>
              <div class="grid grid-cols-4 sm:grid-cols-8 gap-2">
                <button *ngFor="let slot of timeSlots" type="button" (click)="selectEndTime(slot)"
                        [disabled]="isEndTimeDisabled(slot)"
                        class="px-2 py-2 rounded-xl text-xs font-semibold border transition-all"
                        [ngClass]="{
                          'bg-navy text-white border-navy shadow-sm': selectedEndTime===slot,
                          'bg-stone-50 border-stone-200 text-stone-600 hover:border-navy hover:text-navy': selectedEndTime!==slot && !isEndTimeDisabled(slot),
                          'opacity-30 cursor-not-allowed': isEndTimeDisabled(slot)
                        }">{{ slot }}</button>
              </div>
              <p *ngIf="!selectedEndTime && formSubmitAttempted" class="text-red-500 text-xs mt-1.5">Please select an end time</p>
            </div>

            <div *ngIf="selectedStartTime && selectedEndTime" class="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 mb-5 text-sm">
              <ng-icon name="heroClock" class="w-4 h-4 text-accent"/>
              <span class="font-semibold text-stone-700">{{ selectedStartTime }}</span>
              <span class="text-stone-400">→</span>
              <span class="font-semibold text-stone-700">{{ selectedEndTime }}</span>
              <span class="text-stone-400 text-xs ml-1">({{ durationHours }}h)</span>
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
              <div>
                <label class="form-label">State</label>
                <input type="text" formControlName="venueState" class="form-input" placeholder="NY"/>
              </div>
              <div>
                <label class="form-label">Address</label>
                <input type="text" formControlName="venueAddress" class="form-input" placeholder="123 Main St"/>
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
              <button type="button" (click)="tryNextFromDetails()"
                      class="btn-primary">
                Review Booking <ng-icon name="heroArrowRight" class="w-4 h-4"/>
              </button>
            </div>
          </form>
        </div>

        <!-- ── Step 3: Review & submit ─────────────────────────────────────── -->
        <div *ngIf="currentStep===3">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Review & Confirm</h2>
          <p class="text-stone-400 text-sm mb-7">Review details, then proceed to secure payment.</p>
          <div class="max-w-2xl">
            <div class="card p-6 mb-5">
              <div class="flex flex-col gap-0">
                <div class="flex justify-between py-2.5 border-b border-stone-50 text-sm"><span class="text-stone-400">Package</span><strong class="text-stone-800">{{ selectedPackage?.name }} — \${{ selectedPackage?.basePrice }}</strong></div>
                <div class="flex justify-between py-2.5 border-b border-stone-50 text-sm"><span class="text-stone-400">Date</span><strong class="text-stone-800">{{ selectedDate | date:'EEEE, MMMM d, y' }}</strong></div>
                <div class="flex justify-between py-2.5 border-b border-stone-50 text-sm"><span class="text-stone-400">Time</span><strong class="text-stone-800">{{ selectedStartTime }} – {{ selectedEndTime }}</strong></div>
                <div class="flex justify-between py-2.5 border-b border-stone-50 text-sm"><span class="text-stone-400">Event</span><strong class="text-stone-800">{{ detailsForm.value.eventType | titlecase }}</strong></div>
                <div class="flex justify-between py-2.5 border-b border-stone-50 text-sm"><span class="text-stone-400">Venue</span><strong class="text-stone-800">{{ detailsForm.value.venueName }}, {{ detailsForm.value.venueCity }}</strong></div>
                <div class="flex justify-between py-2.5 text-sm"><span class="text-stone-400">Guests</span><strong class="text-stone-800">{{ detailsForm.value.guestCount }}</strong></div>
              </div>
            </div>
            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 text-sm text-stone-600">
              <strong class="text-accent block mb-1">Deposit Due Now</strong>
              A 30% deposit of <strong class="text-accent">\${{ depositAmount | number:'1.2-2' }}</strong> is required to confirm your date.
              The remaining <strong>\${{ remainingAmount | number:'1.2-2' }}</strong> is due on the event day.
            </div>
            <div *ngIf="submitError" class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">⚠ {{ submitError }}</div>
            <div class="flex justify-between">
              <button (click)="currentStep=2" class="btn-ghost"><ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back</button>
              <button (click)="submitAndCreateIntent()" [disabled]="isSubmitting"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                <span *ngIf="!isSubmitting" class="flex items-center gap-2">
                  <ng-icon name="heroCreditCard" class="w-4 h-4"/>Continue to Payment
                </span>
                <span *ngIf="isSubmitting" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Saving…
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Step 4: Payment ─────────────────────────────────────────────── -->
        <div *ngIf="currentStep===4">
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-1">Secure Payment</h2>
          <p class="text-stone-400 text-sm mb-7">
            Pay the 30% deposit of
            <strong class="text-accent">\${{ depositAmount | number:'1.2-2' }}</strong>
            to confirm your date.
          </p>
          <div class="max-w-lg">
            <div class="card p-6 mb-4">
              <div *ngIf="isStripeLoading" class="flex items-center justify-center gap-3 py-10 text-stone-400">
                <div class="w-5 h-5 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
                Initialising secure payment…
              </div>
              <!-- Stripe mounts here -->
              <div id="stripe-payment-element" [class.hidden]="isStripeLoading"></div>
            </div>

            <div *ngIf="paymentError" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4 flex items-start gap-2">
              <span class="text-red-500 font-bold shrink-0">⚠</span>
              <span>{{ paymentError }}</span>
            </div>

            <div class="flex items-center gap-2 text-xs text-stone-400 mb-5">
              <ng-icon name="heroLockClosed" class="w-3.5 h-3.5"/>
              Payments are processed securely by Stripe. Your card details are never stored on our servers.
            </div>

            <div class="flex justify-between">
              <!-- Back disabled while processing to prevent double-submission -->
              <button (click)="currentStep=3" [disabled]="isProcessingPayment"
                      class="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
                <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back
              </button>
              <!--
                Pay button is disabled until:
                  (a) Stripe Elements has finished loading
                  (b) The card details are complete (isCardComplete from Stripe 'change' event)
                  (c) Not currently processing
              -->
              <button (click)="confirmPayment()"
                      [disabled]="isStripeLoading || !isCardComplete || isProcessingPayment"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px] justify-center">
                <span *ngIf="!isProcessingPayment" class="flex items-center gap-2">
                  <ng-icon name="heroLockClosed" class="w-4 h-4"/>
                  Pay \${{ depositAmount | number:'1.2-2' }}
                </span>
                <span *ngIf="isProcessingPayment" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Processing…
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── Step 5: Success (locked — only reachable after server confirms) -->
        <div *ngIf="currentStep===5" class="text-center py-16">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ng-icon name="heroCheckCircle" class="w-10 h-10 text-emerald-500"/>
          </div>
          <h2 class="font-display text-3xl font-bold text-stone-900 mb-3">Booking Confirmed!</h2>
          <p class="text-stone-500 text-base mb-2 max-w-md mx-auto">
            Your deposit of <strong class="text-accent">\${{ depositAmount | number:'1.2-2' }}</strong> has been received and your booking is now active.
          </p>
          <p class="text-stone-400 text-sm mb-8">A confirmation email has been sent to you.</p>
          <div class="flex justify-center gap-4">
            <a routerLink="/dashboard" class="btn-primary">Go to Dashboard</a>
            <a routerLink="/" class="btn-ghost">Back to Home</a>
          </div>
        </div>

      </div>
    </div>
  `
})
export class BookingComponent implements OnInit, OnDestroy, AfterViewChecked {

  // ── Data ──────────────────────────────────────────────────────────────────
  packages: Package[]     = [];
  selectedPackage: Package | null = null;
  selectedDate: Date | null       = null;
  currentStep: number = BookingStep.Package;

  // ── Form state ────────────────────────────────────────────────────────────
  detailsForm: FormGroup;
  isSubmitting       = false;
  submitError        = '';
  formSubmitAttempted = false;

  // ── Calendar ──────────────────────────────────────────────────────────────
  bookedDates:  string[] = [];
  blockedDates: string[] = [];
  calMonth  = new Date();
  dayNames  = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // ── Time chips ────────────────────────────────────────────────────────────
  timeSlots         = TIME_SLOTS;
  selectedStartTime = '';
  selectedEndTime   = '';

  // ── Stripe ────────────────────────────────────────────────────────────────
  private stripe:         Stripe | null          = null;
  private stripeElements: StripeElements | null   = null;
  private paymentElement: StripePaymentElement | null = null;
  private savedBookingId  = '';
  private clientSecret    = '';
  private intentId        = '';   // pi_xxx extracted from clientSecret

  isStripeLoading     = false;
  isProcessingPayment = false;
  isCardComplete      = false;   // set by Stripe 'change' event — gates the Pay button
  paymentError        = '';
  private elementMounted = false;

  stepLabels = ['Package','Date','Details','Confirm','Payment'];
  eventTypes = [
    { value: 'wedding',   label: 'Wedding'         },
    { value: 'birthday',  label: 'Birthday Party'  },
    { value: 'corporate', label: 'Corporate Event' },
    { value: 'club',      label: 'Club Night'      },
    { value: 'festival',  label: 'Festival'        },
    { value: 'other',     label: 'Other'           },
  ];

  constructor(
    private bookingService:  BookingService,
    private packageService:  PackageService,
    private calendarService: CalendarService,
    private http:            HttpClient,
    private fb:              FormBuilder,
    private router:          Router,
    private cdr:             ChangeDetectorRef,
  ) {
    this.detailsForm = this.fb.group({
      eventType:       ['',   Validators.required],
      guestCount:      [null, [Validators.required, Validators.min(1)]],
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
    this.initStripe();
  }

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

  // ── Calendar ──────────────────────────────────────────────────────────────

  loadAvailability(): void {
    this.calendarService
      .getAvailability(this.calMonth.getFullYear(), this.calMonth.getMonth() + 1)
      .subscribe({
        next: r => {
          this.bookedDates  = (r.data?.bookedDates  ?? []).map((d: any) => new Date(d.date).toDateString());
          this.blockedDates = (r.data?.blockedDates ?? []).map((d: any) => new Date(d.date).toDateString());
        },
      });
  }

  selectPackage(p: Package): void { this.selectedPackage = p; }

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
      const ds = dt.toDateString();
      cells.push({
        date: dt, isPast: dt < today,
        isBooked:  this.bookedDates.includes(ds),
        isBlocked: this.blockedDates.includes(ds),
        isSelected: this.selectedDate?.toDateString() === ds,
        isToday: ds === today.toDateString(),
      });
    }
    return cells;
  }

  onDayClick(cell: any): void {
    if (!cell.date || cell.isPast || cell.isBooked || cell.isBlocked) return;
    this.selectedDate = cell.date;
  }

  // ── Time chips ────────────────────────────────────────────────────────────

  selectStartTime(slot: string): void {
    this.selectedStartTime = slot;
    if (this.selectedEndTime && this.slotIndex(this.selectedEndTime) <= this.slotIndex(slot)) {
      this.selectedEndTime = '';
    }
  }

  selectEndTime(slot: string): void { this.selectedEndTime = slot; }

  isEndTimeDisabled(slot: string): boolean {
    return !!this.selectedStartTime && this.slotIndex(slot) <= this.slotIndex(this.selectedStartTime);
  }

  private slotIndex(slot: string): number { return this.timeSlots.indexOf(slot); }

  get durationHours(): number {
    if (!this.selectedStartTime || !this.selectedEndTime) return 0;
    return this.slotIndex(this.selectedEndTime) - this.slotIndex(this.selectedStartTime);
  }

  // ── Computed amounts ──────────────────────────────────────────────────────

  get depositAmount(): number {
    return Math.round((this.selectedPackage?.basePrice ?? 0) * 0.3 * 100) / 100;
  }
  get remainingAmount(): number {
    return (this.selectedPackage?.basePrice ?? 0) - this.depositAmount;
  }

  // ── Step 2 → 3 guard ─────────────────────────────────────────────────────

  tryNextFromDetails(): void {
    this.formSubmitAttempted = true;
    this.detailsForm.markAllAsTouched();
    if (this.detailsForm.invalid || !this.selectedStartTime || !this.selectedEndTime) return;
    this.currentStep = BookingStep.Confirm;
  }

  // ── Step 3 → Step 4: create booking + payment intent ─────────────────────

  submitAndCreateIntent(): void {
    if (!this.selectedPackage || !this.selectedDate) return;
    this.isSubmitting = true;
    this.submitError  = '';

    const v = this.detailsForm.value;

    this.bookingService.createBooking({
      packageId:       this.selectedPackage._id,
      eventDate:       this.selectedDate.toISOString(),
      startTime:       to24(this.selectedStartTime),
      endTime:         to24(this.selectedEndTime),
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
      next: (res: any) => {
        // Backend now returns { bookingId, clientSecret, depositAmount, totalPrice }
        this.savedBookingId = res.data.bookingId;
        this.clientSecret   = res.data.clientSecret;
        this.intentId       = this.clientSecret.split('_secret_')[0];
        this.elementMounted = false;   // allow fresh mount
        this.isSubmitting   = false;
        this.currentStep    = BookingStep.Payment;
        this.cdr.detectChanges();
      },
      error: err => {
        this.isSubmitting = false;
        this.submitError  = err.error?.message ?? 'Booking submission failed.';
      },
    });
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  private async initStripe(): Promise<void> {
    this.stripe = await loadStripe((environment as any).stripePublishableKey ?? '');
  }

  private mountStripeElement(): void {
    if (!this.stripe || !this.clientSecret) return;
    this.elementMounted  = true;
    this.isStripeLoading = true;
    this.isCardComplete  = false;

    this.stripeElements = this.stripe.elements({
      clientSecret: this.clientSecret,
      appearance: {
        theme:     'stripe',
        variables: {
          colorPrimary:    '#dc6b2f',
          colorBackground: '#faf8f5',
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

    // ── Card validity gate ────────────────────────────────────────────────────
    // The 'change' event fires whenever the user edits card fields.
    // complete:true means all required fields are filled and valid.
    // The Pay button is disabled until this is true.
    this.paymentElement.on('change', (event: any) => {
      this.isCardComplete = event.complete === true;
      // Clear any previous payment error when user re-enters card details
      if (event.complete) this.paymentError = '';
      this.cdr.detectChanges();
    });
  }

  // ── Step 4 → Step 5: confirm payment ─────────────────────────────────────

  async confirmPayment(): Promise<void> {
    if (!this.stripe || !this.stripeElements || !this.isCardComplete) return;

    this.isProcessingPayment = true;
    this.paymentError        = '';

    // 1. Ask Stripe to process the card — stays SPA for cards that don't need redirect
    const { error: stripeError } = await this.stripe.confirmPayment({
      elements:       this.stripeElements,
      confirmParams: { return_url: `${window.location.origin}/dashboard` },
      redirect:       'if_required',
    });

    if (stripeError) {
      // Payment failed or was declined — stay on Step 4 with error message
      this.paymentError        = stripeError.message ?? 'Payment failed. Please try a different card.';
      this.isProcessingPayment = false;
      this.isCardComplete      = false;   // force user to re-enter card
      this.cdr.detectChanges();
      return;
    }

    // 2. Stripe succeeded — call backend to verify and finalise booking
    //    POST /api/bookings/:id/confirm
    this.http.post<any>(
      `${(environment as any).apiUrl}/bookings/${this.savedBookingId}/confirm`,
      {}
    ).subscribe({
      next: () => {
        this.isProcessingPayment = false;
        this.currentStep         = BookingStep.Success;   // ← only path to Step 5
        this.cdr.detectChanges();
      },
      error: err => {
        // Edge case: Stripe succeeded but our DB update failed
        // Show a support-style error — do NOT advance to success
        this.paymentError = err.error?.message
          ?? 'Payment was received but booking confirmation failed. Please contact support with your reference: ' + this.savedBookingId;
        this.isProcessingPayment = false;
        this.cdr.detectChanges();
      },
    });
  }
}
