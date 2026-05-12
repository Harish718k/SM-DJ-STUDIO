import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'bookings',    loadComponent: () => import('./bookings/admin-bookings.component').then(m => m.AdminBookingsComponent) },
      { path: 'calendar',    loadComponent: () => import('./calendar/admin-calendar.component').then(m => m.AdminCalendarComponent) },
      { path: 'packages',    loadComponent: () => import('./packages/admin-packages.component').then(m => m.AdminPackagesComponent) },
      { path: 'new-booking', loadComponent: () => import('../booking/booking.component').then(m => m.BookingComponent) },
      { path: 'profile',     loadComponent: () => import('../../shared/components/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  }
];
