import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'booking/:id',
    loadComponent: () =>
      import('./booking-detail/booking-detail.component')
        .then(m => m.BookingDetailComponent)
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../../shared/components/profile/profile.component')
        .then(m => m.ProfileComponent)
  },
  // ── Review route — accessible from booking-detail when status = completed ──
  {
    path: 'review/:bookingId',
    loadComponent: () =>
      import('../../shared/components/submit-review/submit-review.component')
        .then(m => m.SubmitReviewComponent)
  },
];
