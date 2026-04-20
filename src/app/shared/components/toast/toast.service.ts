import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  toasts$ = this.toastsSubject.asObservable();

  private mostrar(message: string, type: Toast['type']): void {
    const toast: Toast = { message, type };
    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    setTimeout(() => this.remover(toast), 4000);
  }

  sucesso(message: string): void {
    this.mostrar(message, 'success');
  }
  erro(message: string): void {
    this.mostrar(message, 'danger');
  }
  aviso(message: string): void {
    this.mostrar(message, 'warning');
  }
  info(message: string): void {
    this.mostrar(message, 'info');
  }

  remover(toast: Toast): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((t) => t !== toast));
  }
}
