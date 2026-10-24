import { Component, computed, inject, signal } from '@angular/core';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline, calendarOutline } from 'ionicons/icons';
import { formatDuration, formatTime, parseDate } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

interface Row {
  key: string;
  dateKey: string;
  date: Date;
  time: string;
  duration: string;
}

interface CalendarDay {
  date: Date;
  key: string;
  visits: number;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [IonContent, IonRefresher, IonRefresherContent, IonIcon, PortalHeaderComponent],
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss']
})
export class AttendancePage {
  private readonly session = inject(PortalSessionService);
  private readonly today = new Date();
  readonly month = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  readonly selectedDateKey = signal(this.dateKey(this.today));
  readonly historyDateKey = signal<string | null>(null);
  readonly weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly todayKey = this.dateKey(this.today);

  readonly visits = computed<Row[]>(() => {
    const entries = (this.session.snapshot()?.attendance ?? [])
      .map((attendance, index) => ({ attendance, index, date: parseDate(attendance.date || attendance.checkInTime) }))
      .filter((entry): entry is { attendance: (typeof entry)['attendance']; index: number; date: Date } => entry.date !== null)
      .map(({ attendance, index, date }) => ({
        key: attendance.id ?? String(index),
        dateKey: this.dateKey(date),
        date,
        time: attendance.checkInTime || attendance.checkOutTime
          ? `${formatTime(attendance.checkInTime)} – ${formatTime(attendance.checkOutTime)}`
          : 'N/A',
        duration: formatDuration(attendance.duration)
      }));
    return entries.sort((first, second) => second.date.getTime() - first.date.getTime());
  });

  readonly monthLabel = computed(() =>
    this.month().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  );

  readonly monthVisits = computed(() => this.visits().filter((visit) => this.isInMonth(visit.date, this.month())));

  readonly thisWeekVisits = computed(() => {
    const today = new Date(this.today);
    today.setHours(23, 59, 59, 999);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    return this.visits().filter((visit) => visit.date >= weekStart && visit.date <= today).length;
  });

  readonly daysVisited = computed(() => new Set(this.monthVisits().map((visit) => visit.dateKey)).size);

  readonly weeks = computed<(CalendarDay | null)[][]>(() => {
    const month = this.month();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = firstDay.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const visitsByDay = new Map<string, number>();
    for (const visit of this.monthVisits()) {
      visitsByDay.set(visit.dateKey, (visitsByDay.get(visit.dateKey) ?? 0) + 1);
    }

    const cells: (CalendarDay | null)[] = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const key = this.dateKey(date);
      cells.push({ date, key, visits: visitsByDay.get(key) ?? 0 });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  });

  readonly visibleVisits = computed(() => {
    const dateKey = this.historyDateKey();
    const visits = this.monthVisits();
    return dateKey ? visits.filter((visit) => visit.dateKey === dateKey) : visits;
  });

  readonly historyLabel = computed(() => {
    const dateKey = this.historyDateKey();
    if (!dateKey) {
      return 'Visit history';
    }
    const visitDate = this.visibleVisits()[0]?.date;
    return visitDate
      ? visitDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  });

  constructor() {
    addIcons({ calendarOutline, chevronBackOutline, chevronForwardOutline });
  }

  changeMonth(offset: number): void {
    const current = this.month();
    this.month.set(new Date(current.getFullYear(), current.getMonth() + offset, 1));
    this.selectedDateKey.set('');
    this.historyDateKey.set(null);
  }

  goToCurrentMonth(): void {
    this.month.set(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
    this.selectedDateKey.set(this.todayKey);
    this.historyDateKey.set(null);
  }

  selectDate(day: CalendarDay): void {
    this.selectedDateKey.set(day.key);
    this.historyDateKey.set(day.key);
  }

  showAllVisits(): void {
    this.historyDateKey.set(null);
  }

  dayLabel(day: CalendarDay): string {
    const label = day.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    return day.visits ? `${label}, ${day.visits} ${day.visits === 1 ? 'visit' : 'visits'}` : label;
  }

  private isInMonth(date: Date, month: Date): boolean {
    return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
  }

  private dateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }
}
