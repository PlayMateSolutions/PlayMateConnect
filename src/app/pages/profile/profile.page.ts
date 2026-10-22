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
import { formatDate, na } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

interface ProfileSection {
  title: string;
  rows: { label: string; value: string }[];
}

@Component({
  selector: 'app-profile',
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
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage {
  private readonly session = inject(PortalSessionService);
  private readonly alerts = inject(AlertController);

  readonly member = computed(() => this.session.snapshot()?.member ?? null);
  readonly fullName = computed(() => {
    const member = this.member();
    return [member?.firstName, member?.lastName].filter(Boolean).join(' ') || 'N/A';
  });
  readonly initials = computed(() => {
    const member = this.member();
    return ((member?.firstName?.[0] ?? '') + (member?.lastName?.[0] ?? '')).toUpperCase() || '?';
  });
  readonly status = computed(() => na(this.member()?.status));
  readonly statusColor = computed(() =>
    this.status().toLowerCase() === 'active' ? 'success' : this.status() === 'N/A' ? 'medium' : 'danger'
  );

  readonly sections = computed<ProfileSection[]>(() => {
    const member = this.member();
    return [
      {
        title: 'Membership',
        rows: [
          { label: 'Type', value: na(member?.membershipType) },
          { label: 'Joined', value: formatDate(member?.joinDate) },
          { label: 'Expires', value: formatDate(member?.expiryDate) }
        ]
      },
      {
        title: 'Contact',
        rows: [
          { label: 'Email', value: na(member?.email) },
          { label: 'Phone', value: na(member?.phone) },
          { label: 'Place', value: na(member?.place) }
        ]
      },
      {
        title: 'Personal',
        rows: [
          { label: 'Gender', value: na(member?.gender) },
          { label: 'Date of birth', value: formatDate(member?.dateOfBirth) }
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