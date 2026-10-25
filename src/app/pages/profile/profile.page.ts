import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonLabel,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, logOutOutline } from 'ionicons/icons';
import { ClubContextService } from '../../core/club-context.service';
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
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonLabel,
    IonChip,
    IonButton,
    IonIcon,
    PortalHeaderComponent
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage {
  private readonly session = inject(PortalSessionService);
  private readonly alerts = inject(AlertController);
  readonly club = inject(ClubContextService);

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

  constructor() {
    addIcons({ arrowBackOutline, logOutOutline });
  }

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