import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PortalSessionService } from './core/portal-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  template: `<ion-app><ion-router-outlet></ion-router-outlet></ion-app>`
})
export class AppComponent {
  private readonly session = inject(PortalSessionService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.session.isLoggedIn()) {
        void this.session.refresh();
      } else {
        void this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.session.refresh();
      }
    });
  }
}
