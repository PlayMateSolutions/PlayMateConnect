import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

// Placeholder until 3b.
@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [IonContent, PortalHeaderComponent],
  template: `<app-portal-header></app-portal-header><ion-content class="ion-padding">Payments coming next.</ion-content>`
})
export class PaymentsPage {}
