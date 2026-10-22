import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage)
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.page').then((m) => m.PaymentsPage)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance/attendance.page').then((m) => m.AttendancePage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage)
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
