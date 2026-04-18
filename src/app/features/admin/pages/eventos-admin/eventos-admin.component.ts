import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Router, RouterModule } from '@angular/router';

import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Evento } from '../../../../shared/models/evento.model';
import { EventoService } from '../../../../core/service/evento.service';
import { AuthService } from '../../../../core/service/auth.service';


@Component({
  selector: 'app-eventos-admin',
  imports: [CommonModule, RouterModule],
  templateUrl: './eventos-admin.component.html',
  styleUrl: './eventos-admin.component.css',
})
export class EventosAdmin implements OnInit, OnDestroy{
  eventos: any[] = [];
  loading = true;
  excluindo = false;
  mostrarModal = false;
  eventoParaExcluir: Evento | null = null;
  private subscriptions = new Subscription();

  constructor(
    private eventoService: EventoService,
    private router: Router,
    private authService: AuthService 
  ) {}

  ngOnInit(): void {
    this.carregarEventos();
    this.verificarPermissaoAdmin(); 
  }

 
  verificarPermissaoAdmin(): void {
    const isAdmin = this.authService.isAdmin();
    console.log('É ADMIN?', isAdmin);
    console.log('Usuário logado:', this.authService.getCurrentUser());
    
    if (!isAdmin) {
      console.warn('Usuário não é ADMIN. Ações de exclusão/edição podem falhar!');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarEventos(): void {
    this.loading = true;

    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos: Evento[]) => {
          this.eventos = eventos
            .sort((a, b) =>
              new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
            )
            .map(evento => ({
              ...evento,
              imagemUrl: 'assets/images/evento-placeholder.jpg',
              imagemPrincipalReal: evento.imagemPrincipal,
              dataFormatada: new Date(evento.dataHora).toLocaleDateString('pt-BR'),
              concluido: new Date(evento.dataHora) < new Date()
            }));

          this.loading = false;

          this.eventos.forEach(evento => {
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
          alert('Erro ao carregar eventos.');
        }
      })
    );
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

  confirmarExclusao(evento: Evento): void {

    if (!this.authService.isAdmin()) {
      alert('Apenas administradores podem excluir eventos.');
      return;
    }
    this.eventoParaExcluir = evento;
    this.mostrarModal = true;
  }

  fecharModalExclusao(): void {
    this.mostrarModal = false;
    this.eventoParaExcluir = null;
  }

  excluirEvento(): void {
    if (!this.eventoParaExcluir?.id) {
      return;
    }

    
    if (!this.authService.isAdmin()) {
      alert('Você não tem permissão para excluir eventos.');
      this.fecharModalExclusao();
      return;
    }

    this.excluindo = true;
    console.log('Tentando excluir evento ID:', this.eventoParaExcluir.id);

    this.subscriptions.add(
      this.eventoService.deletarEvento(this.eventoParaExcluir.id).subscribe({
        next: () => {
          console.log('Evento excluído com sucesso!');
          this.excluindo = false;
          this.fecharModalExclusao();
          this.carregarEventos();
          alert('Evento excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro detalhado:', error);
          this.excluindo = false;
          
          
          if (error.status === 403) {
            alert('Você não tem permissão para excluir eventos. Apenas administradores podem fazer isso.');
          } else if (error.status === 401) {
            alert('Sua sessão expirou. Faça login novamente.');
            this.authService.logout();
          } else {
            alert(`Erro ao excluir evento: ${error.error?.mensagem || error.message}`);
          }
        }
      })
    );
  }
}
