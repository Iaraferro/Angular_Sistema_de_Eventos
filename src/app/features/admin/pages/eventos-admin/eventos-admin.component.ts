import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Evento } from '../../../../shared/models/evento.model';
import { EventoService } from '../../../../core/service/evento.service';
import { AuthService } from '../../../../core/service/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import {MatPaginatorModule} from '@angular/material/paginator';

@Component({
  selector: 'app-eventos-admin',
  imports: [CommonModule, RouterModule, MatPaginatorModule],
  templateUrl: './eventos-admin.component.html',
  styleUrl: './eventos-admin.component.css',
})
export class EventosAdmin implements OnInit, OnDestroy {
  eventos: any[] = [];
  loading = true;
  excluindo = false;

  totalElements = 0;
  pageSize = 10;
  currentPage = 0;

  private subscriptions = new Subscription();

  constructor(
    private eventoService: EventoService,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

   carregarEventos(): void {
    this.loading = true;

    // ✅ Usando paginação em vez de listarEventos()
    this.subscriptions.add(
      this.eventoService.listarPaginado(this.currentPage, this.pageSize).subscribe({
        next: (response) => {
          this.eventos = response.content
            .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
            .map((evento) => ({
              ...evento,
              imagemUrl: 'assets/images/evento-placeholder.jpg',
              imagemPrincipalReal: evento.imagemPrincipal,
              dataFormatada: new Date(evento.dataHora).toLocaleDateString('pt-BR'),
              concluido: new Date(evento.dataHora) < new Date(),
            }));

          this.totalElements = response.totalElements;
          this.loading = false;

          // Carrega as imagens
          this.eventos.forEach((evento) => {
            if (evento.imagemPrincipalReal) {
              const img = new Image();
              img.onload = () => {
                evento.imagemUrl = this.eventoService.getImagemUrl(evento.imagemPrincipalReal);
              };
              img.onerror = () => {
                evento.imagemUrl = 'assets/images/evento-placeholder.jpg';
              };
              img.src = this.eventoService.getImagemUrl(evento.imagemPrincipalReal);
            }
          });
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
          this.toast.erro('Erro ao carregar eventos.');
        },
      })
    );
  }

  // ✅ Método para mudar de página
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregarEventos();
  }
  trackByEventoId(index: number, evento: any): number {
    return evento.id;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/evento-placeholder.jpg';
  }

  visualizarEvento(evento: any): void {
    this.router.navigate(['/eventos', evento.id]);
  }

  editarEvento(evento: any): void {
    if (!this.authService.isAdmin()) {
      alert('Apenas administradores podem editar eventos.');
      return;
    }
    this.router.navigate(['/admin/editar-evento', evento.id]);
  }

  excluirEvento(id: number, nome: string): void {
    if (!this.authService.isAdmin()) {
      this.toast.aviso('Apenas administradores podem excluir eventos.');
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir "${nome}"?\n\nEsta ação não pode ser desfeita!`,
    );
    if (!confirmar) return;

    this.excluindo = true;
    this.subscriptions.add(
      this.eventoService.deletarEvento(id).subscribe({
        next: () => {
          this.excluindo = false;
          this.carregarEventos();
          this.toast.sucesso(`Evento "${nome}" excluído com sucesso!`);
        },
        error: (error) => {
          this.excluindo = false;
          if (error.status === 403) {
            this.toast.erro('Você não tem permissão para excluir eventos.');
          } else if (error.status === 401) {
            this.toast.aviso('Sua sessão expirou. Faça login novamente.');
            this.authService.logout();
          } else {
            this.toast.erro(`Erro ao excluir evento: ${error.error?.mensagem || error.message}`);
          }
        },
      }),
    );
  }
}
