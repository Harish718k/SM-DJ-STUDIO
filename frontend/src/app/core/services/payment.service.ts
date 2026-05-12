/**
 * PaymentService
 *
 * Add this class to the bottom of your existing api.service.ts,
 * following the same pattern as BookingService, PackageService, etc.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Booking } from '../../shared/models';

const API = environment.apiUrl;

export interface PaymentIntentResponse {
  clientSecret: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  /**
   * Step 1 — Create a Stripe PaymentIntent for the deposit.
   * Returns clientSecret used to mount the Stripe Payment Element.
   */
  createPaymentIntent(
    bookingId: string,
    amount: number,
  ): Observable<ApiResponse<PaymentIntentResponse>> {
    return this.http.post<ApiResponse<PaymentIntentResponse>>(
      `${API}/payments/create-intent`,
      { bookingId, amount },
    );
  }

  /**
   * Step 2 — After stripe.confirmPayment() succeeds on the frontend,
   * call this to verify the intent with Stripe server-side and update
   * the booking (depositPaid = true, status = 'confirmed').
   */
  confirmPayment(
    bookingId: string,
    paymentIntentId: string,
  ): Observable<ApiResponse<Booking>> {
    return this.http.post<ApiResponse<Booking>>(
      `${API}/payments/confirm-payment`,
      { bookingId, paymentIntentId },
    );
  }
}
