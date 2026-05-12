// ── User ─────────────────────────────────────────────────────────────────────
export interface User {
  id:              string;
  name:            string;
  email:           string;
  role:            'admin' | 'client';
  phone?:          string;
  profilePicture?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data:    { token: string; user: User };
}

export interface LoginRequest    { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; phone?: string; }

// ── Booking ───────────────────────────────────────────────────────────────────
export type BookingStatus  = 'awaiting_payment' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type ReviewStatus   = 'none' | 'submitted';
export type EventType      = 'wedding' | 'birthday' | 'corporate' | 'club' | 'festival' | 'other';

export interface Venue {
  name:    string;
  address: string;
  city:    string;
  state?:  string;
}

export interface Booking {
  _id:                   string;
  client:                User;
  package:               Package;
  eventType:             EventType;
  eventDate:             string;
  startTime:             string;
  endTime:               string;
  venue:                 Venue;
  guestCount:            number;
  specialRequests?:      string;
  status:                BookingStatus;
  reviewStatus?:          ReviewStatus;  // 'none' | 'submitted' — drives the review button
  totalPrice:            number;
  depositPaid:           boolean;
  depositAmount:         number;
  stripePaymentIntentId?: string | null;
  adminNotes?:           string;
  createdAt:             string;
}

export interface CreateBookingRequest {
  packageId:        string;
  eventType:        EventType;
  eventDate:        string;
  startTime:        string;
  endTime:          string;
  venue:            Venue;
  guestCount:       number;
  specialRequests?: string;
}

// ── Package ───────────────────────────────────────────────────────────────────
export interface Package {
  _id:            string;
  name:           string;
  description:    string;
  duration:       number;
  basePrice:      number;
  features:       string[];
  isActive:       boolean;
  averageRating?: number;
  reviewCount?:   number;
}

// ── Calendar ──────────────────────────────────────────────────────────────────
export interface CalendarDay {
  date:    string;
  status:  'available' | 'booked' | 'blocked' | 'past';
  reason?: string;
}

export interface AvailabilityResponse {
  bookedDates:  { date: string; status: string }[];
  blockedDates: { date: string; status: string; reason: string }[];
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalBookings:  number;
  pendingCount:   number;
  confirmedCount: number;
  completedCount: number;
  totalClients:   number;
  monthlyRevenue: number;
  totalRevenue:   number;
}

export interface MonthlyData   { month: number; monthName: string; bookings: number; revenue: number; }
export interface EventTypeData { eventType: EventType; count: number; }

// ── Review ────────────────────────────────────────────────────────────────────
export interface Review {
  _id:         string;
  client:      { _id: string; name: string; profilePicture?: string | null };
  booking:     string | Booking;
  package?:    { _id: string; name: string; basePrice?: number } | null;
  eventType?:  EventType;
  eventDate?:  string;
  rating:      number;
  comment:     string;
  isPublished: boolean;
  createdAt:   string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating:    number;
  comment:   string;
}

export interface EligibleBooking {
  _id:       string;
  eventType: EventType;
  eventDate: string;
  venue:     Venue;
  status:    BookingStatus;
  package?:  { _id: string; name: string } | null;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data:    T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count:   number;
  total:   number;
  page:    number;
  pages:   number;
  data:    T[];
}
