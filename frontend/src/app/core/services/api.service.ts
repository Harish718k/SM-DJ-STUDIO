/**
 * api.service.ts
 * src/app/core/services/api.service.ts
 *
 * Single file — all services including ReviewService.
 * ReviewService is @Injectable({ providedIn: 'root' }) so Angular's DI
 * tree-shaker can find it without any module registration.
 *
 * IMPORTANT: submit-review.component.ts must import ReviewService from THIS file:
 *   import { ReviewService } from '../../../core/services/api.service';
 * NOT from a separate review.service.ts (that file does not exist).
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Booking, CreateBookingRequest, Package,
  AvailabilityResponse, AnalyticsSummary,
  MonthlyData, EventTypeData, ApiResponse, PaginatedResponse,
  Review, CreateReviewRequest, EligibleBooking,
} from '../../shared/models';

const API = environment.apiUrl;

// ── Booking Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BookingService {
  constructor(private http: HttpClient) {}

  createBooking(data: CreateBookingRequest): Observable<ApiResponse<Booking>> {
    return this.http.post<ApiResponse<Booking>>(`${API}/bookings`, data);
  }

  getMyBookings(): Observable<ApiResponse<Booking[]>> {
    return this.http.get<ApiResponse<Booking[]>>(`${API}/bookings/my`);
  }

  getAllBookings(status?: string, page = 1): Observable<PaginatedResponse<Booking>> {
    let params = new HttpParams().set('page', page.toString());
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<Booking>>(`${API}/bookings`, { params });
  }

  getBooking(id: string): Observable<ApiResponse<Booking>> {
    return this.http.get<ApiResponse<Booking>>(`${API}/bookings/${id}`);
  }

  updateStatus(id: string, status: string, adminNotes?: string): Observable<ApiResponse<Booking>> {
    return this.http.put<ApiResponse<Booking>>(
      `${API}/bookings/${id}/status`, { status, adminNotes }
    );
  }

  deleteBooking(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/bookings/${id}`);
  }
}

// ── Package Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class PackageService {
  constructor(private http: HttpClient) {}

  getPackages(): Observable<ApiResponse<Package[]>> {
    return this.http.get<ApiResponse<Package[]>>(`${API}/packages`);
  }

  getAllPackages(): Observable<ApiResponse<Package[]>> {
    return this.http.get<ApiResponse<Package[]>>(`${API}/packages/all`);
  }

  createPackage(data: Partial<Package>): Observable<ApiResponse<Package>> {
    return this.http.post<ApiResponse<Package>>(`${API}/packages`, data);
  }

  updatePackage(id: string, data: Partial<Package>): Observable<ApiResponse<Package>> {
    return this.http.put<ApiResponse<Package>>(`${API}/packages/${id}`, data);
  }

  deletePackage(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/packages/${id}`);
  }
}

// ── Calendar Service ──────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CalendarService {
  constructor(private http: HttpClient) {}

  getAvailability(year: number, month: number): Observable<ApiResponse<AvailabilityResponse>> {
    const params = new HttpParams()
      .set('year',  year.toString())
      .set('month', month.toString());
    return this.http.get<ApiResponse<AvailabilityResponse>>(
      `${API}/calendar/availability`, { params }
    );
  }

  blockDate(date: string, reason: string): Observable<any> {
    return this.http.post(`${API}/calendar/block`, { date, reason });
  }

  unblockDate(id: string): Observable<any> {
    return this.http.delete(`${API}/calendar/block/${id}`);
  }

  getBlockedDates(): Observable<any> {
    return this.http.get(`${API}/calendar/blocked`);
  }
}

// ── Analytics Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getSummary(): Observable<ApiResponse<AnalyticsSummary>> {
    return this.http.get<ApiResponse<AnalyticsSummary>>(`${API}/analytics/summary`);
  }

  getMonthly(year: number): Observable<ApiResponse<MonthlyData[]>> {
    return this.http.get<ApiResponse<MonthlyData[]>>(
      `${API}/analytics/monthly?year=${year}`
    );
  }

  getEventTypes(): Observable<ApiResponse<EventTypeData[]>> {
    return this.http.get<ApiResponse<EventTypeData[]>>(`${API}/analytics/event-types`);
  }

  getUpcoming(): Observable<ApiResponse<Booking[]>> {
    return this.http.get<ApiResponse<Booking[]>>(`${API}/analytics/upcoming`);
  }
}

// ── Review Service ────────────────────────────────────────────────────────────
// @Injectable({ providedIn: 'root' }) ensures Angular DI can resolve this
// without registering it in any NgModule or providers array.

export interface ReviewQueryParams {
  packageId?: string;
  eventType?: string;
  rating?:    number;
  sort?:      'newest' | 'oldest' | 'highest' | 'lowest';
  page?:      number;
  limit?:     number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private http: HttpClient) {}

  /**
   * POST /api/reviews
   * Requires: completed booking owned by the requesting client.
   * On success the backend also sets booking.reviewStatus = 'submitted'.
   */
  submitReview(data: CreateReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${API}/reviews`, data);
  }

  /**
   * GET /api/reviews  — public, no auth needed.
   */
  getReviews(params: ReviewQueryParams = {}): Observable<PaginatedResponse<Review>> {
    let p = new HttpParams();
    if (params.packageId) p = p.set('packageId', params.packageId);
    if (params.eventType) p = p.set('eventType', params.eventType);
    if (params.rating)    p = p.set('rating',    params.rating.toString());
    if (params.sort)      p = p.set('sort',       params.sort);
    if (params.page)      p = p.set('page',       params.page.toString());
    if (params.limit)     p = p.set('limit',      params.limit.toString());
    return this.http.get<PaginatedResponse<Review>>(`${API}/reviews`, { params: p });
  }

  /**
   * GET /api/reviews/my  — client's own submitted reviews.
   */
  getMyReviews(): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${API}/reviews/my`);
  }

  /**
   * GET /api/reviews/eligible
   * Returns completed bookings with reviewStatus === 'none'.
   */
  getEligibleBookings(): Observable<ApiResponse<EligibleBooking[]>> {
    return this.http.get<ApiResponse<EligibleBooking[]>>(`${API}/reviews/eligible`);
  }
}
