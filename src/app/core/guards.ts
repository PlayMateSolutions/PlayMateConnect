import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortalSessionService } from './portal-session.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(PortalSessionService);
  return session.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};

export const loginGuard: CanActivateFn = () => {
  const session = inject(PortalSessionService);
  return session.isLoggedIn() ? inject(Router).parseUrl('/home') : true;
};
