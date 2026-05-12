/**
 * review.service.ts
 *
 * ADD this class to the bottom of:
 *   src/app/core/services/api.service.ts
 *
 * Also add these imports at the top of api.service.ts if not already present:
 *   import { Review, CreateReviewRequest, EligibleBooking } from '../../shared/models';
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Review, CreateReviewRequest, EligibleBooking,
  ApiResponse, PaginatedResponse,
} from 'src/app/shared/models';
import { environment } from 'src/environments/environment';

const API = environment.apiUrl;

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
   * Submit a review. Only succeeds if the booking is 'completed'
   * and belongs to the requesting client.
   */
  submitReview(data: CreateReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${API}/reviews`, data);
  }

  /**
   * GET /api/reviews
   * Fetch published reviews — no auth required (public endpoint).
   */
  getReviews(params: ReviewQueryParams = {}): Observable<PaginatedResponse<Review>> {
    let httpParams = new HttpParams();
    if (params.packageId) httpParams = httpParams.set('packageId', params.packageId);
    if (params.eventType) httpParams = httpParams.set('eventType', params.eventType);
    if (params.rating)    httpParams = httpParams.set('rating',    params.rating.toString());
    if (params.sort)      httpParams = httpParams.set('sort',      params.sort);
    if (params.page)      httpParams = httpParams.set('page',      params.page.toString());
    if (params.limit)     httpParams = httpParams.set('limit',     params.limit.toString());
    return this.http.get<PaginatedResponse<Review>>(`${API}/reviews`, { params: httpParams });
  }

  /**
   * GET /api/reviews/my
   * Returns the authenticated client's own submitted reviews.
   */
  getMyReviews(): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${API}/reviews/my`);
  }

  /**
   * GET /api/reviews/eligible
   * Returns completed bookings that the client has NOT yet reviewed.
   * Use this to conditionally show "Leave a Review" buttons in the dashboard.
   */
  getEligibleBookings(): Observable<ApiResponse<EligibleBooking[]>> {
    return this.http.get<ApiResponse<EligibleBooking[]>>(`${API}/reviews/eligible`);
  }
}
