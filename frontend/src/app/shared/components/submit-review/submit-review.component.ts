import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowLeft, heroCheckCircle,
  heroPaperAirplane, heroExclamationCircle,
} from '@ng-icons/heroicons/outline';

// Both services live in api.service.ts — NOT a separate review.service.ts
import { BookingService, ReviewService } from '../../../core/services/api.service';
import { Booking } from '../../../shared/models';

/** Rejects 0 (default); accepts 1–5 only */
function ratingRequiredValidator(c: AbstractControl): ValidationErrors | null {
  const v = Number(c.value);
  return v >= 1 && v <= 5 ? null : { ratingRequired: true };
}

@Component({
  selector: 'app-submit-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIconComponent],
  viewProviders: [provideIcons({
    heroArrowLeft, heroCheckCircle,
    heroPaperAirplane, heroExclamationCircle,
  })],
  template: `
    <div class="min-h-screen bg-cream py-10 px-4">
      <div class="max-w-xl mx-auto">

        <a routerLink="/dashboard"
           class="inline-flex items-center gap-2 text-stone-400 hover:text-accent
                  text-sm font-medium no-underline transition-colors mb-8">
          <ng-icon name="heroArrowLeft" class="w-4 h-4"/>Back to My Bookings
        </a>

        <!-- ── Success screen ─────────────────────────────────────────────── -->
        <div *ngIf="submitted" class="card p-10 text-center">
          <div class="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ng-icon name="heroCheckCircle" class="w-10 h-10 text-emerald-500"/>
          </div>
          <h2 class="font-display text-2xl font-bold text-stone-900 mb-3">
            Thank You for Your Review!
          </h2>
          <p class="text-stone-400 text-sm leading-relaxed mb-4">
            Your feedback has been published and helps other clients choose DJ BookPro.
          </p>
          <!-- Star display -->
          <div class="flex items-center justify-center gap-1 my-4">
            <svg *ngFor="let s of starsArray(submittedRating)"
                 viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 text-amber-400">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p class="text-stone-500 text-sm italic mb-8">
            "{{ submittedComment | slice:0:120 }}{{ submittedComment.length > 120 ? '…' : '' }}"
          </p>
          <a routerLink="/dashboard" class="btn-primary">Back to My Bookings</a>
        </div>

        <!-- ── Review form ─────────────────────────────────────────────────── -->
        <div *ngIf="!submitted" class="card overflow-hidden">

          <!-- Header -->
          <div class="px-7 py-6 border-b border-stone-100 bg-gradient-to-r from-cream to-orange-50/40">
            <div class="text-xs font-bold uppercase tracking-widest text-accent mb-1">
              Verified Review
            </div>
            <h1 class="font-display text-2xl font-bold text-stone-900 mb-1">How Did We Do?</h1>
            <p class="text-stone-400 text-sm">
              Share your experience. Only clients with a completed event can leave a review.
            </p>
          </div>

          <!-- Booking summary pill -->
          <div *ngIf="booking && !isLoadingBooking"
               class="mx-7 mt-5 flex items-center gap-3 bg-stone-50 border border-stone-200
                      rounded-2xl px-4 py-3">
            <span class="text-xl shrink-0">{{ getEventIcon(booking.eventType) }}</span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-stone-800 truncate">
                {{ booking.eventType | titlecase }}
                <span *ngIf="booking.venue?.name"> — {{ booking.venue.name }}</span>
              </div>
              <div class="text-xs text-stone-400 mt-0.5">
                {{ booking.eventDate | date:'MMMM d, y' }}
                <span *ngIf="booking.package?.name"> · {{ booking.package.name }}</span>
              </div>
            </div>
            <span class="badge-completed shrink-0">Completed</span>
          </div>

          <!-- Loading -->
          <div *ngIf="isLoadingBooking"
               class="flex items-center gap-3 mx-7 mt-5 text-stone-400 text-sm">
            <div class="w-4 h-4 border-2 border-stone-200 border-t-accent rounded-full animate-spin"></div>
            Loading booking details…
          </div>

          <!-- Load error (status not completed, already reviewed, not found) -->
          <div *ngIf="loadError"
               class="mx-7 mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3
                      text-sm text-red-600 flex items-center gap-2">
            <ng-icon name="heroExclamationCircle" class="w-4 h-4 shrink-0"/>
            {{ loadError }}
          </div>

          <!-- Form — hidden when there is a loadError -->
          <form *ngIf="!loadError" [formGroup]="form" (ngSubmit)="submit()" class="p-7">

            <!-- ── Star picker ─────────────────────────────────────────────── -->
            <div class="mb-7">
              <label class="form-label mb-3 block">
                Your Rating <span class="text-red-400">*</span>
              </label>

              <div class="flex items-center gap-1.5">
                <button *ngFor="let star of [1,2,3,4,5]" type="button"
                        (click)="setRating(star)"
                        (mouseenter)="hoveredStar = star"
                        (mouseleave)="hoveredStar = 0"
                        class="focus:outline-none border-0 bg-transparent p-0.5
                               transition-transform hover:scale-110 active:scale-95">
                  <!-- Filled -->
                  <svg *ngIf="star <= (hoveredStar || selectedRating)"
                       viewBox="0 0 24 24" fill="currentColor" class="w-10 h-10 transition-colors"
                       [class.text-amber-400]="hoveredStar === 0 && star <= selectedRating"
                       [class.text-amber-300]="hoveredStar > 0 && star <= hoveredStar">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <!-- Empty -->
                  <svg *ngIf="star > (hoveredStar || selectedRating)"
                       viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                       class="w-10 h-10 text-stone-300">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>

                <span class="ml-2 text-sm font-semibold min-w-20"
                      [class.text-amber-500]="selectedRating > 0"
                      [class.text-stone-400]="selectedRating === 0">
                  {{ ratingLabel }}
                </span>
              </div>

              <p *ngIf="f['rating'].invalid && formSubmitted"
                 class="text-red-500 text-xs mt-2 flex items-center gap-1">
                <ng-icon name="heroExclamationCircle" class="w-3.5 h-3.5"/>
                Please select a star rating.
              </p>
            </div>

            <!-- ── Comment ─────────────────────────────────────────────────── -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-1.5">
                <label class="form-label">
                  Your Review <span class="text-red-400">*</span>
                </label>
                <span class="text-xs font-medium"
                      [class.text-stone-400]="commentLength <= 800"
                      [class.text-amber-500]="commentLength > 800 && commentLength <= 950"
                      [class.text-red-500]="commentLength > 950">
                  {{ commentLength }} / 1000
                </span>
              </div>

              <textarea formControlName="comment" rows="5"
                        class="form-input resize-none leading-relaxed"
                        placeholder="Tell us about your experience — the music, energy, professionalism…"
                        (input)="updateCharCount($event)"></textarea>

              <ng-container *ngIf="f['comment'].invalid && (f['comment'].dirty || formSubmitted)">
                <p *ngIf="f['comment'].errors?.['required']"
                   class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <ng-icon name="heroExclamationCircle" class="w-3.5 h-3.5"/>
                  A comment is required.
                </p>
                <p *ngIf="f['comment'].errors?.['minlength']"
                   class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <ng-icon name="heroExclamationCircle" class="w-3.5 h-3.5"/>
                  Please write at least 10 characters.
                </p>
                <p *ngIf="f['comment'].errors?.['maxlength']"
                   class="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <ng-icon name="heroExclamationCircle" class="w-3.5 h-3.5"/>
                  Maximum 1000 characters.
                </p>
              </ng-container>
            </div>

            <!-- Submit error -->
            <div *ngIf="submitError"
                 class="bg-red-50 border border-red-200 rounded-xl px-4 py-3
                        text-sm text-red-600 mb-4 flex items-start gap-2">
              <ng-icon name="heroExclamationCircle" class="w-4 h-4 shrink-0 mt-0.5"/>
              {{ submitError }}
            </div>

            <!-- Info note -->
            <div class="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3
                        text-xs text-stone-500 mb-6 flex items-start gap-2">
              <ng-icon name="heroCheckCircle" class="w-4 h-4 text-accent shrink-0 mt-0.5"/>
              Your review is published immediately under your name.
              Only <strong>Completed</strong> bookings are eligible.
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between">
              <a routerLink="/dashboard" class="btn-ghost">Cancel</a>
              <button type="submit" [disabled]="isSubmitting"
                      class="btn-primary disabled:opacity-40 disabled:cursor-not-allowed
                             min-w-36 justify-center">
                <span *ngIf="!isSubmitting" class="flex items-center gap-2">
                  <ng-icon name="heroPaperAirplane" class="w-4 h-4"/>Submit Review
                </span>
                <span *ngIf="isSubmitting" class="flex items-center gap-2">
                  <div class="w-4 h-4 border-2 border-white/40 border-t-white
                              rounded-full animate-spin"></div>Submitting…
                </span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `
})
export class SubmitReviewComponent implements OnInit {

  form:             FormGroup;
  booking:          Booking | null = null;
  isLoadingBooking  = true;
  loadError         = '';
  isSubmitting      = false;
  submitError       = '';
  formSubmitted     = false;

  // Passed in from the dashboard via query params
  // — no extra HTTP call needed for basic submit
  prefillPackageId  = '';

  // Star picker
  selectedRating    = 0;
  hoveredStar       = 0;
  commentLength     = 0;

  // Post-submit
  submitted         = false;
  submittedRating   = 0;
  submittedComment  = '';

  constructor(
    private fb:             FormBuilder,
    private route:          ActivatedRoute,
    private router:         Router,
    private bookingService: BookingService,
    private reviewService:  ReviewService,
  ) {
    this.form = this.fb.group({
      rating:  [0, [Validators.required, ratingRequiredValidator]],
      comment: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(1000),
      ]],
    });
  }

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');

    // Read packageId from query params — passed by the dashboard button.
    // Falls back gracefully to '' if not present (e.g. direct URL navigation).
    this.prefillPackageId = this.route.snapshot.queryParamMap.get('packageId') ?? '';

    if (!bookingId) {
      this.loadError        = 'No booking ID provided.';
      this.isLoadingBooking = false;
      return;
    }

    // Fetch the full booking for the summary pill and server-side guards
    this.bookingService.getBooking(bookingId).subscribe({
      next: res => {
        this.booking          = res.data;
        this.isLoadingBooking = false;

        if (this.booking.status !== 'completed') {
          this.loadError =
            `This booking is '${this.booking.status}'. ` +
            `Reviews can only be left for completed events.`;
          return;
        }

        if (this.booking.reviewStatus === 'submitted') {
          this.loadError = 'You have already submitted a review for this booking.';
        }
      },
      error: () => {
        this.isLoadingBooking = false;
        this.loadError = 'Booking not found or you do not have access to it.';
      },
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get f() { return this.form.controls; }

  get ratingLabel(): string {
    const active = this.hoveredStar || this.selectedRating;
    return ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][active] ?? '';
  }

  starsArray(n: number): number[] {
    return Array(Math.max(0, n)).fill(0);
  }

  getEventIcon(type: string): string {
    const map: Record<string, string> = {
      wedding: '💍', birthday: '🎂', corporate: '🏢',
      club: '🎉', festival: '🎪', other: '✨',
    };
    return map[type] ?? '🎧';
  }

  // ── UI helpers ─────────────────────────────────────────────────────────────

  setRating(star: number): void {
    this.selectedRating = star;
    this.f['rating'].setValue(star);
    this.f['rating'].markAsDirty();
  }

  updateCharCount(event: Event): void {
    this.commentLength = (event.target as HTMLTextAreaElement).value.length;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    this.formSubmitted = true;
    this.f['rating'].markAsDirty();
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.booking) return;

    this.isSubmitting = true;
    this.submitError  = '';

    this.reviewService.submitReview({
      bookingId: this.booking._id,
      rating:    this.form.value.rating,
      comment:   this.form.value.comment,
    }).subscribe({
      next: () => {
        this.isSubmitting = false;

        // ── Immediate in-memory state update ──────────────────────────────
        // Sets reviewStatus on the local booking object so that IF the user
        // presses Back (browser history) the dashboard re-evaluates the
        // *ngIf binding before the next getMyBookings() call fires.
        // The backend has already persisted reviewStatus='submitted' in MongoDB
        // so any fresh navigation will also show the correct state.
        if (this.booking) {
          this.booking.reviewStatus = 'submitted';
        }

        this.submittedRating  = this.form.value.rating;
        this.submittedComment = this.form.value.comment;
        this.submitted        = true;   // switches to the success screen
      },
      error: err => {
        this.isSubmitting = false;
        this.submitError  =
          err.error?.message ?? 'Submission failed. Please try again.';
      },
    });
  }
}
