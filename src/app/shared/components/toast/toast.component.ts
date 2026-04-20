import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastService, Toast } from './toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 9999">
      <div
        *ngFor="let toast of toasts"
        class="toast show align-items-center border-0"
        [class]="'text-white bg-' + toast.type"
      >
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center gap-2">
            <i [class]="getIcon(toast.type)"></i>
            {{ toast.message }}
          </div>
          <button
            type="button"
            class="btn-close btn-close-white me-2 m-auto"
            (click)="remover(toast)"
          ></button>
        </div>
      </div>
    </div>
  `,
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub = new Subscription();

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub.add(this.toastService.toasts$.subscribe((toasts) => (this.toasts = toasts)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  remover(toast: Toast): void {
    this.toastService.remover(toast);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'bi bi-check-circle-fill',
      danger: 'bi bi-x-circle-fill',
      warning: 'bi bi-exclamation-triangle-fill',
      info: 'bi bi-info-circle-fill',
    };
    return icons[type] || 'bi bi-info-circle-fill';
  }
}
