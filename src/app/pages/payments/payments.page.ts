import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cardOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { formatDate, formatMoney, na, parseDate } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [IonContent, IonRefresher, IonRefresherContent, IonIcon, IonSelect, IonSelectOption, PortalHeaderComponent],
  templateUrl: './payments.page.html',
  styleUrls: ['./payments.page.scss']
})
export class PaymentsPage {
  private readonly session = inject(PortalSessionService);
  readonly selectedYear = signal(this.latestPaymentYear());
  readonly selectedCategory = signal('all');

  readonly allPayments = computed(() =>
    (this.session.snapshot()?.payments ?? [])
      .map((payment, index) => {
        const date = parseDate(payment.date);
        return {
        key: payment.id ?? `${payment.date}-${payment.amount}-${index}`,
        year: date?.getFullYear() ?? null,
        sortDate: date?.getTime() ?? 0,
        day: date?.toLocaleDateString('en-GB', { day: 'numeric' }) ?? '',
        month: date?.toLocaleDateString('en-GB', { month: 'short' }) ?? '',
        category: payment.category?.trim() || 'Uncategorized',
        amountValue: Number(payment.amount) || 0,
        amount: formatMoney(payment.amount),
        type: na(payment.paymentType),
        notes: payment.notes?.trim() || '',
        status: na(payment.status),
        showStatus: Boolean(payment.status) && !['paid', 'completed', 'success'].includes(String(payment.status).toLowerCase()),
        period: `${formatDate(payment.periodStart)} – ${formatDate(payment.periodEnd)}`,
        item: payment.category ? `${payment.category}${payment.quantity ? ` × ${payment.quantity}` : ''}` : ''
      };
      })
      .sort((first, second) => second.sortDate - first.sortDate)
  );

  readonly payments = computed(() => {
    const year = this.selectedYear();
    const category = this.selectedCategory();
    return this.allPayments().filter((payment) =>
      payment.year === year && (category === 'all' || payment.category === category)
    );
  });

  readonly total = computed(() =>
    formatMoney(this.payments().reduce((sum, payment) => sum + payment.amountValue, 0))
  );

  readonly categories = computed(() =>
    [...new Set(this.allPayments()
      .filter((payment) => payment.year === this.selectedYear())
      .map((payment) => payment.category))]
      .sort((first, second) => first.localeCompare(second))
  );

  readonly yearBounds = computed(() => {
    const currentYear = new Date().getFullYear();
    const years = this.allPayments()
      .map((payment) => payment.year)
      .filter((year): year is number => year !== null);
    return {
      minimum: Math.min(currentYear, ...years),
      maximum: Math.max(currentYear, ...years)
    };
  });

  constructor() {
    addIcons({ cardOutline, chevronBackOutline, chevronForwardOutline });
  }

  canChangeYear(offset: number): boolean {
    const bounds = this.yearBounds();
    return this.selectedYear() + offset >= bounds.minimum && this.selectedYear() + offset <= bounds.maximum;
  }

  changeYear(offset: number): void {
    if (!this.canChangeYear(offset)) {
      return;
    }
    this.selectedYear.update((year) => year + offset);
    this.selectedCategory.set('all');
  }

  setCategory(category: string | null | undefined): void {
    this.selectedCategory.set(category || 'all');
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  private latestPaymentYear(): number {
    const currentYear = new Date().getFullYear();
    const years = (this.session.snapshot()?.payments ?? [])
      .map((payment) => parseDate(payment.date)?.getFullYear())
      .filter((year): year is number => year !== undefined);
    const currentOrEarlier = years.filter((year) => year <= currentYear);
    return currentOrEarlier.length ? Math.max(...currentOrEarlier) : Math.max(currentYear, ...years);
  }

}
