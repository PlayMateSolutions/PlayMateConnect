import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertController,
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline } from 'ionicons/icons';
import {
  daysUntil,
  formatDate,
  formatMoney,
  na,
  parseDate
} from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

const EXPIRING_WITHIN_DAYS = 14;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonChip,
    IonButton,
    IonIcon,
    IonSkeletonText,
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

  readonly payments = computed(() =>
    [...(this.session.snapshot()?.payments ?? [])].sort(
      (a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0)
    )
  );

  /** Visits with a usable date, newest first. */
  readonly visits = computed(() =>
    (this.session.snapshot()?.attendance ?? [])
      .map((a) => ({ a, date: parseDate(a.date || a.checkInTime) }))
      .filter((v): v is { a: (typeof v)['a']; date: Date } => v.date !== null)
      .sort((x, y) => y.date.getTime() - x.date.getTime())
  );

  readonly expiry = computed(() => {
    const expiryDate = this.member()?.expiryDate;
    const days = daysUntil(expiryDate);
    if (days === null) {
      return { date: 'N/A', note: '', color: 'medium', progress: null as number | null, renew: false };
    }
    if (days < 0) {
      return { date: formatDate(expiryDate), note: 'Expired', color: 'danger', progress: 100, renew: true };
    }
    const note = days === 0 ? 'Expires today' : `${days} ${days === 1 ? 'day' : 'days'} left`;
    const expiring = days <= EXPIRING_WITHIN_DAYS;
    return {
      date: formatDate(expiryDate),
      note,
      color: expiring ? 'warning' : 'success',
      progress: this.periodProgress(),
      renew: expiring
    };
  });

  readonly stats = computed(() => {
    const now = new Date();
    const visitsThisMonth = this.visits().filter(
      (visit) => visit.date.getMonth() === now.getMonth() && visit.date.getFullYear() === now.getFullYear()
    ).length;
    const lastVisit = this.visits()[0]?.date;
    const lastPayment = this.payments()[0];
    return {
      visitsThisMonth: String(visitsThisMonth),
      lastVisit: lastVisit ? this.relativeDay(lastVisit) : 'N/A',
      lastPaymentAmount: lastPayment ? formatMoney(lastPayment.amount) : 'N/A',
      lastPaymentDate: lastPayment ? formatDate(lastPayment.date) : ''
    };
  });

  constructor() {
    addIcons({ arrowForwardOutline });
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  async renew(): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Renew membership',
      message: 'Please visit the club desk to renew your membership.',
      buttons: ['OK']
    });
    await alert.present();
  }

  /** Percent of the latest paid period elapsed; falls back to the join date when no period exists. */
  private periodProgress(): number | null {
    const end = parseDate(this.member()?.expiryDate);
    const latest = this.payments()
      .map((p) => ({ start: parseDate(p.periodStart), end: parseDate(p.periodEnd) }))
      .filter((p): p is { start: Date; end: Date } => p.start !== null && p.end !== null)
      .sort((x, y) => y.end.getTime() - x.end.getTime())[0];
    const start = latest?.start ?? parseDate(this.member()?.joinDate);
    if (!start || !end || end <= start) {
      return null;
    }
    const percent = ((Date.now() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  }

  private relativeDay(date: Date): string {
    const days = -(daysUntil(date.toISOString()) ?? 0);
    if (days <= 0) {
      return 'Today';
    }
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
}
