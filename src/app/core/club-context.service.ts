import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const SHEET_ID_KEY = 'pmportal:sheetId';
const CLUB_NAME_KEY = 'pmportal:clubName';
export const SESSION_KEY_PREFIX = 'pmportal:session';
const SHEET_ID_PATTERN = /^[a-zA-Z0-9_-]{20,}$/;

@Injectable({ providedIn: 'root' })
export class ClubContextService {
  private readonly _sheetId = signal<string | null>(null);
  private readonly _clubName = signal<string | null>(null);

  readonly sheetId = this._sheetId.asReadonly();
  readonly clubName = this._clubName.asReadonly();
  readonly displayName = computed(() => this._clubName() || environment.appName);

  /** Resolves context from the URL, falling back to localStorage; run before routing. */
  init(): void {
    const params = new URLSearchParams(window.location.search);
    const urlSheetId = (params.get('sheetId') || '').trim();
    const urlClubName = (params.get('club') || '').trim();
    const storedSheetId = localStorage.getItem(SHEET_ID_KEY);

    if (SHEET_ID_PATTERN.test(urlSheetId)) {
      if (storedSheetId !== urlSheetId) {
        this.clearGymData();
        localStorage.removeItem(CLUB_NAME_KEY);
      }
      localStorage.setItem(SHEET_ID_KEY, urlSheetId);
      if (urlClubName) {
        localStorage.setItem(CLUB_NAME_KEY, urlClubName);
      }
    }

    const sheetId = localStorage.getItem(SHEET_ID_KEY);
    this._sheetId.set(sheetId && SHEET_ID_PATTERN.test(sheetId) ? sheetId : null);
    this._clubName.set(localStorage.getItem(CLUB_NAME_KEY));
  }

  private clearGymData(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(SESSION_KEY_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  }
}
