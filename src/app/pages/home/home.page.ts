import { Component, computed, inject } from '@angular/core';
import {
  AlertController,
  IonButton,
  IonChip,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { daysUntil, formatDate, na } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

interface Section {
  title: string;
  rows: { label: string; value: string }[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonChip,
    IonButton,
    PortalHeaderComponent
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  private readonly session = inject(PortalSessionService);
  private readonly alerts = inject(AlertController);

  readonly member = computed(() => this.session.snapshot()?.member ?? null);

  readonly fullName = computed(() => {
    const m = this.member();
    return [m?.firstName, m?.lastName].filter(Boolean).join(' ') || 'N/A';
  });

  readonly initials = computed(() => {
    const m = this.member();
    return ((m?.firstName?.[0] ?? '') + (m?.lastName?.[0] ?? '')).toUpperCase() || '?';
  });

  readonly status = computed(() => na(this.member()?.status));
  readonly statusColor = computed(() =>
    this.status().toLowerCase() === 'active' ? 'success' : this.status() === 'N/A' ? 'medium' : 'danger'
  );

  readonly expiry = computed(() => {
    const expiryDate = this.member()?.expiryDate;
    const days = daysUntil(expiryDate);
    if (days === null) {
      return { date: 'N/A', note: '', color: 'medium' };
    }
    if (days < 0) {
      return { date: formatDate(expiryDate), note: 'Expired', color: 'danger' };
    }
    const note = days === 0 ? 'Expires today' : `${days} ${days === 1 ? 'day' : 'days'} left`;
    return { date: formatDate(expiryDate), note, color: days <= 14 ? 'warning' : 'success' };
  });

  readonly sections = computed<Section[]>(() => {
    const m = this.member();
    return [
      {
        title: 'Contact',
        rows: [
          { label: 'Email', value: na(m?.email) },
          { label: 'Phone', value: na(m?.phone) },
          { label: 'Place', value: na(m?.place) }
        ]
      },
      {
        title: 'Membership',
        rows: [
          { label: 'Type', value: na(m?.membershipType) },
          { label: 'Joined', value: formatDate(m?.joinDate) },
          { label: 'Expires', value: this.expiry().date },
          { label: 'Sports', value: na(m?.sports) }
        ]
      },
      {
        title: 'Personal',
        rows: [
          { label: 'Gender', value: na(m?.gender) },
          { label: 'Date of birth', value: formatDate(m?.dateOfBirth) }
        ]
      }
    ];
  });

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Log out?',
      message: 'You will need your phone number and PIN to sign in again.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Log out', role: 'destructive', handler: () => this.session.logout() }
      ]
    });
    await alert.present();
  }
}
