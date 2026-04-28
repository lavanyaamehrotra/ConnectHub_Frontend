import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  // Simple check for now: if user is stored in localStorage, allow access
  const userStr = localStorage.getItem('user');
  
  if (userStr) {
    return true;
  }
  
  router.navigate(['/auth/login']);
  return false;
};
