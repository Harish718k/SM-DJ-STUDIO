import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// ── Auth Guard — requires login ──────────────────────────────────────────────
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) return true;

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// ── Admin Guard — requires admin role ────────────────────────────────────────
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.isAdmin) return true;

  if (authService.isLoggedIn) router.navigate(['/dashboard']);
  else router.navigate(['/login']);
  return false;
};

// ── Client Guard — requires client role ──────────────────────────────────────
export const clientGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && !authService.isAdmin) return true;

  if (authService.isAdmin) router.navigate(['/admin']);
  else router.navigate(['/login']);
  return false;
};
