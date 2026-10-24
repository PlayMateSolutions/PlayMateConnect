import { Component, inject, Input } from '@angular/core';
import { IonButton, IonHeader, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ClubContextService } from '../core/club-context.service';
import { timeAgo } from '../core/format';
import { PortalSessionService } from '../core/portal-session.service';

@Component({
  selector: 'app-portal-header',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonButton, IonSpinner],
  template: `
    <ion-header>
      @if (showToolbar) {
        <ion-toolbar>
          <ion-title>
            {{ club.displayName() }}
            <div class="sync">
              @if (session.refreshing()) {
                <ion-spinner name="dots"></ion-spinner> Syncing
              } @else {
                Synced {{ ago(session.syncedAt()) }}
              }
            </div>
          </ion-title>
        </ion-toolbar>
      }
      @if (session.refreshError(); as message) {
        <div class="stale">
          <span>Couldn't refresh, showing saved data.</span>
          <ion-button size="small" fill="clear" (click)="session.refresh(true)">Retry</ion-button>
        </div>
      }
    </ion-header>
  `,
  styles: [
    `
      .sync {
        font-size: 12px;
        font-weight: 400;
        color: var(--ion-color-medium);
      }
      .stale {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 16px;
        font-size: 13px;
        background: rgba(var(--ion-color-warning-rgb), 0.2);
      }
    `
  ]
})
export class PortalHeaderComponent {
  @Input() showToolbar = true;
  readonly session = inject(PortalSessionService);
  readonly club = inject(ClubContextService);
  readonly ago = timeAgo;
}
