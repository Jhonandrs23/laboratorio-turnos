import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';

type WindowStatus = 'available' | 'busy';

interface ServiceWindow {
  id: number;
  name: string;
  status: WindowStatus;
  currentTurn: string | null;
}

interface QueueStatus {
  waiting: string[];
  windows: ServiceWindow[];
  nextNumber: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly apiBase = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';
  private poller?: Subscription;
  private previousBusy = new Map<number, boolean>();

  status: QueueStatus = { waiting: [], windows: [], nextNumber: 1 };
  lastTurn = '';
  message = '';
  loading = false;

  get isClientsScreen(): boolean {
    return window.location.pathname.includes('clientes') || window.location.pathname === '/';
  }

  get isWindowsScreen(): boolean {
    return window.location.pathname.includes('ventanillas');
  }

  get activeWindows(): ServiceWindow[] {
    return this.status.windows.filter((windowItem) => windowItem.status === 'busy');
  }

  ngOnInit(): void {
    this.loadStatus();
    this.poller = interval(2500).subscribe(() => this.loadStatus(false));
  }

  ngOnDestroy(): void {
    this.poller?.unsubscribe();
  }

  createTurn(): void {
    this.loading = true;
    this.http.post<QueueStatus & { turn: string }>(`${this.apiBase}/turns`, {}).subscribe({
      next: (response) => {
        this.lastTurn = response.turn;
        this.message = `Turno generado: ${response.turn}`;
        this.applyStatus(response);
        this.loading = false;
      },
      error: () => {
        this.message = 'No se pudo generar el turno. Revisa que el backend este encendido.';
        this.loading = false;
      }
    });
  }

  assignTurn(windowItem: ServiceWindow): void {
    this.loading = true;
    this.http.post<QueueStatus & { assignedTurn: string }>(`${this.apiBase}/windows/${windowItem.id}/assign`, {}).subscribe({
      next: (response) => {
        this.message = `${windowItem.name}: pase el turno ${response.assignedTurn}`;
        this.applyStatus(response);
        this.speak(`Pase turno ${response.assignedTurn} a ${windowItem.name}`);
        this.loading = false;
      },
      error: (error) => {
        this.message = error.error?.error ?? 'No hay turnos disponibles para asignar.';
        this.loading = false;
      }
    });
  }

  finishTurn(windowItem: ServiceWindow): void {
    this.loading = true;
    this.http.post<QueueStatus & { finishedTurn: string | null }>(`${this.apiBase}/windows/${windowItem.id}/finish`, {}).subscribe({
      next: (response) => {
        this.message = `${windowItem.name} disponible. Puede pasar el siguiente turno.`;
        this.applyStatus(response);
        this.playAvailableSound();
        this.speak(`${windowItem.name} disponible. Pase el siguiente turno.`);
        this.loading = false;
      },
      error: () => {
        this.message = 'No se pudo finalizar la atencion.';
        this.loading = false;
      }
    });
  }

  resetSystem(): void {
    this.loading = true;
    this.http.post<QueueStatus>(`${this.apiBase}/reset`, {}).subscribe({
      next: (response) => {
        this.lastTurn = '';
        this.message = 'Sistema reiniciado.';
        this.applyStatus(response);
        this.loading = false;
      },
      error: () => {
        this.message = 'No se pudo reiniciar el sistema.';
        this.loading = false;
      }
    });
  }

  private loadStatus(showError = true): void {
    this.http.get<QueueStatus>(`${this.apiBase}/status`).subscribe({
      next: (response) => this.applyStatus(response),
      error: () => {
        if (showError) {
          this.message = 'Backend no disponible. Inicia Flask en el puerto 5000.';
        }
      }
    });
  }

  private applyStatus(response: QueueStatus): void {
    response.windows.forEach((windowItem) => {
      const wasBusy = this.previousBusy.get(windowItem.id);
      if (wasBusy && windowItem.status === 'available' && this.isWindowsScreen) {
        this.playAvailableSound();
      }
      this.previousBusy.set(windowItem.id, windowItem.status === 'busy');
    });
    this.status = response;
  }

  private playAvailableSound(): void {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, audioContext.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.48);
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
