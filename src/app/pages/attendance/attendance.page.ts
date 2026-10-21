import { Component, computed, inject } from '@angular/core';
import { IonContent, IonIcon, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';
import { formatDuration, formatTime } from '../../core/format';
import { PortalSessionService } from '../../core/portal-session.service';
import { PortalHeaderComponent } from '../../shared/portal-header.component';

interface Row {
  key: string;
  weekday: string;
  day: string;
  time: string;
  duration: string;
}

interface MonthGroup {
  label: string;
  rows: Row[];
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

  readonly count = computed(() => this.session.snapshot()?.attendance.length ?? 0);

  readonly groups = computed<MonthGroup[]>(() => {
    const entries = (this.session.snapshot()?.attendance ?? []).map((a, index) => {
      const date = new Date(String(a.date || a.checkInTime || ''));
      return { a, index, date: isNaN(date.getTime()) ? null : date };
    });
    entries.sort((x, y) => (y.date?.getTime() ?? 0) - (x.date?.getTime() ?? 0));

    const groups = new Map<string, MonthGroup>();
    for (const { a, index, date } of entries) {
      const label = date
        ? date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        : 'Date unknown';
      const group = groups.get(label) ?? { label, rows: [] };
      groups.set(label, group);
      group.rows.push({
        key: a.id ?? String(index),
        weekday: date ? date.toLocaleDateString('en-GB', { weekday: 'short' }) : 'N/A',
        day: date ? String(date.getDate()) : '',
        time: a.checkInTime || a.checkOutTime ? `${formatTime(a.checkInTime)} – ${formatTime(a.checkOutTime)}` : 'N/A',
        duration: formatDuration(a.duration)
      });
    }
    return [...groups.values()];
  });

  constructor() {
    addIcons({ calendarOutline });
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.session.refresh(true);
    (event.target as HTMLIonRefresherElement).complete();
  }
}
