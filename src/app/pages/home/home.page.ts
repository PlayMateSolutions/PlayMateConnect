import { Component, inject } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular/standalone';
import { PortalSessionService } from '../../core/portal-session.service';

// Placeholder until the Member page (3a) replaces it.
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content class="ion-padding">
      <h2>{{ session.snapshot()?.member?.firstName }} {{ session.snapshot()?.member?.lastName }}</h2>
      <p>Status: {{ session.snapshot()?.member?.status ?? 'N/A' }}</p>
      <p>Payments: {{ session.snapshot()?.payments?.length }} · Attendance: {{ session.snapshot()?.attendance?.length }}</p>
      <p>Synced: {{ session.syncedAt() }}</p>
      <ion-button (click)="session.logout()">Log out</ion-button>
    </ion-content>
  `
})
export class HomePage {
  readonly session = inject(PortalSessionService);
}
