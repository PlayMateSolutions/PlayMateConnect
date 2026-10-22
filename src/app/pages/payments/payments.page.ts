import { Component, computed, inject } from '@angular/core';
import { IonChip, IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline } from 'ionicons/icons';
import { formatDate, formatMoney, na } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [IonContent, IonRefresher, IonRefresherContent, IonChip, IonIcon, PortalHeaderComponent],
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss']
})
export class PaymentsPage {
  private readonly session = inject(PortalSessionService);

  readonly payments = computed(() =>
    [...(this.session.snapshot()?.payments ?? [])]
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .map((p) => ({
        key: p.id ?? `${p.date}-${p.amount}`,
        amount: formatMoney(p.amount),
        date: formatDate(p.date),
        type: na(p.paymentType),
        status: na(p.status),
        statusColor: this.statusColor(p.status),
        period: `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}`,
        item: p.category ? `${p.category}${p.quantity ? ` × ${p.quantity}` : ''}` : ''
      }))
  );

  readonly total = computed(() =>
    formatMoney(
      (this.session.snapshot()?.payments ?? []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    )
  );

  constructor() {
    addIcons({ cardOutline });
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  private statusColor(status: unknown): string {
    const value = String(status ?? '').toLowerCase();
    if (['paid', 'completed', 'success'].includes(value)) {
      return 'success';
    }
    if (['pending', 'partial'].includes(value)) {
      return 'warning';
    }
    return 'medium';
  }
}
