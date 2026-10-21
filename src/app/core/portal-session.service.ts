import { Injectable, computed, inject, signal } from '@angular/core';
import { ClubContextService, SESSION_KEY_PREFIX } from './club-context.service';
import { PortalApiError, PortalApiService } from './portal-api.service';
import { PortalResult, PortalSnapshot } from './portal.models';

const SESSION_KEY = `${SESSION_KEY_PREFIX}`;
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

interface StoredSession {
  sheetId: string;
  phone: string;
  pin: string;
  snapshot: PortalSnapshot;
  syncedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PortalSessionService {
  private readonly api = inject(PortalApiService);
  private readonly club = inject(ClubContextService);
  private readonly state = signal<StoredSession | null>(this.read());

  readonly isLoggedIn = computed(() => this.state() !== null);
  readonly snapshot = computed(() => this.state()?.snapshot ?? null);
  readonly syncedAt = computed(() => this.state()?.syncedAt ?? null);
  readonly refreshing = signal(false);
  /** Set when the last refresh failed and cached data is being shown. */
  readonly refreshError = signal<string | null>(null);

  async login(phone: string, pin: string): Promise<void> {
    const sheetId = this.club.sheetId();
    if (!sheetId) {
      throw new PortalApiError(400, 'This gym link is invalid. Scan the gym QR code again.');
    }
    const result = await this.api.load(sheetId, phone, pin);
    this.save({ sheetId, phone, pin, ...result });
    this.refreshError.set(null);
  }

  /** Refreshes only when the cache is 24h old, unless forced. */
  async refresh(force = false): Promise<void> {
    const current = this.state();
    if (!current || this.refreshing()) {
      return;
    }
    const age = Date.now() - new Date(current.syncedAt).getTime();
    if (!force && age < REFRESH_AFTER_MS) {
      return;
    }

    this.refreshing.set(true);
    try {
      const result = await this.api.load(current.sheetId, current.phone, current.pin);
      this.save({ ...current, ...result });
      this.refreshError.set(null);
    } catch (error) {
      if (error instanceof PortalApiError && error.code === 403) {
        this.logout();
      } else {
        this.refreshError.set(error instanceof Error ? error.message : 'Unable to refresh.');
      }
    } finally {
      this.refreshing.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.refreshError.set(null);
    this.state.set(null);
  }

  private save(session: StoredSession & Partial<PortalResult>): void {
    const stored: StoredSession = {
      sheetId: session.sheetId,
      phone: session.phone,
      pin: session.pin,
      snapshot: session.snapshot,
      syncedAt: session.syncedAt
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
    this.state.set(stored);
  }

  private read(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredSession) : null;
      if (parsed && parsed.sheetId === this.club.sheetId()) {
        return parsed;
      }
    } catch {
      // Corrupt entry; fall through and discard it.
    }
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}
