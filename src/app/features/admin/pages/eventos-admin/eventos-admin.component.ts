import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Evento } from '../../../../shared/models/evento.model';
import { EventoService } from '../../../../core/service/evento.service';

@Component({
  selector: 'app-eventos-admin',
  imports: [CommonModule, RouterModule],
  templateUrl: './eventos-admin.component.html',
  styleUrl: './eventos-admin.component.css',
})
export class EventosAdmin implements OnInit, AfterViewInit{
  eventos: Evento[] = [];
  loading = true;
  excluindo = false;
  eventoParaExcluir: Evento | null = null;
  private subscriptions: Subscription = new Subscription();
  private modalElement: HTMLElement | null = null;

  constructor(
    private eventoService: EventoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  ngAfterViewInit(): void {
    this.modalElement = document.getElementById('modalExclusao');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.fecharModalExclusao();
  }

  carregarEventos(): void {
    this.loading = true;
    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos: Evento[]) => {
          this.eventos = eventos.sort((a, b) => 
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
          );
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
          alert('Erro ao carregar eventos. Tente novamente.');
        }
      })
    );
  }

  getImagemUrl(imagemPrincipal: string | undefined): string {
    return this.eventoService.getImagemUrl(imagemPrincipal);
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/evento-placeholder.jpg';
  }

  formatarData(data: string | Date): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  isEventoConcluido(evento: Evento): boolean {
    return new Date(evento.dataHora) < new Date();
  }

  visualizarEvento(evento: Evento): void {
    this.router.navigate(['/eventos', evento.id]);
  }

  editarEvento(evento: Evento): void {
    this.router.navigate(['/admin/editar-evento', evento.id]);
  }

  abrirModalExclusao(evento: Evento): void {
    this.eventoParaExcluir = evento;
    if (this.modalElement) {
      this.modalElement.style.display = 'block';
      this.modalElement.classList.add('show');
      document.body.classList.add('modal-open');
      
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modalBackdrop';
      document.body.appendChild(backdrop);
    }
  }

  fecharModalExclusao(): void {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
      this.modalElement.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      const backdrop = document.getElementById('modalBackdrop');
      if (backdrop) backdrop.remove();
    }
    this.eventoParaExcluir = null;
  }

  confirmarExclusao(evento: Evento): void {
    this.abrirModalExclusao(evento);
  }

  excluirEvento(): void {
    if (!this.eventoParaExcluir?.id) {
      alert('Evento inválido para exclusão');
      this.fecharModalExclusao();
      return;
    }

    this.excluindo = true;
    this.subscriptions.add(
      this.eventoService.deletarEvento(this.eventoParaExcluir.id).subscribe({
        next: () => {
          this.excluindo = false;
          this.fecharModalExclusao();
          this.carregarEventos();
          alert(' Evento excluído com sucesso!');
        },
        error: (error: any) => {
          console.error('Erro ao excluir evento:', error);
          this.excluindo = false;
          alert('Erro ao excluir evento. Tente novamente.');
        }
      })
    );
  }
}
