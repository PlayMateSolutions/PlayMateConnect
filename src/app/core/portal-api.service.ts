import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { PortalResult } from './portal.models';

export class PortalApiError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class PortalApiService {
  async load(sheetId: string, phone: string, pin: string): Promise<PortalResult> {
    let response: Response;
    try {
      // text/plain avoids a CORS preflight, which Apps Script cannot answer.
      response = await fetch(`${environment.apiUrl}?action=customerPortal`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ sheetId, phone, pin })
      });
    } catch {
      throw new PortalApiError(0, 'Unable to connect. Check your internet connection and try again.');
    }

    let body: any;
    try {
      body = await response.json();
    } catch {
      throw new PortalApiError(0, 'Received an unexpected response. Please try again.');
    }

    if (body?.status !== 'success') {
      throw new PortalApiError(
        Number(body?.error?.code) || 500,
        body?.error?.message || 'Something went wrong. Please try again.'
      );
    }
    return body.data as PortalResult;
  }
}
