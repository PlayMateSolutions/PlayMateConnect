import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

// Placeholder until 3c.
@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [IonContent, PortalHeaderComponent],
  template: `<app-portal-header></app-portal-header><ion-content class="ion-padding">Attendance coming next.</ion-content>`
})
export class AttendancePage {}
