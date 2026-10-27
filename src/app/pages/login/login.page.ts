import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, callOutline, lockClosedOutline } from 'ionicons/icons';
import { ClubContextService } from '../../core/club-context.service';
import { PortalSessionService } from '../../core/portal-session.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner, IonIcon],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  private readonly session = inject(PortalSessionService);
  private readonly router = inject(Router);
  readonly club = inject(ClubContextService);

  phone = '';
  pin = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasGym = computed(() => this.club.sheetId() !== null);

  constructor() {
    addIcons({ alertCircleOutline, callOutline, lockClosedOutline });
  }

  get canSubmit(): boolean {
    return this.phone.trim().length > 0 && this.pin.length === 6;
  }

  onPinInput(event: Event): void {
    const input = event.target as HTMLIonInputElement;
    const digits = String(input.value ?? '').replace(/\D/g, '');
    if (digits !== input.value) {
      input.value = digits;
    }
    this.pin = digits;
    this.error.set(null);
  }

  async submit(): Promise<void> {
    const phone = this.phone.trim();
    const pin = this.pin.trim();
    if (!phone || !/^\d{6}$/.test(pin)) {
      this.error.set('Enter your phone number and 6-digit PIN.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      await this.session.login(phone, pin);
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.loading.set(false);
    }
  }
}
