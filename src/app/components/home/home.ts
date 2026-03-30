import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Evento } from '../../models/evento.model';
import { Subscription } from 'rxjs';
import { EventoService } from '../../service/evento-service';
import { E } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy{
  proximosEventos: Evento[] = [];
  eventosConcluidos: Evento[] = [];
  loading = true;
  private subscription: Subscription = new Subscription();

  constructor(private eventoService: EventoService) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  carregarEventos(): void {
    this.subscription.add(
      this.eventoService.listarEvento().subscribe({
        next: (eventos) => {
          const agora = new Date();
          
          // Separar eventos em próximos e concluídos
          this.proximosEventos = eventos
            .filter(e => new Date(e.dataHora) >= agora)
            .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
            .slice(0, 6); // Limitar a 6 eventos

          this.eventosConcluidos = eventos
            .filter(e => new Date(e.dataHora) < agora)
            .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
            .slice(0, 6); // Limitar a 6 eventos

          this.loading = false;
          
          // Renderizar os cards
          this.renderizarCards();
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  renderizarCards(): void {
    this.renderizarCardsProximos();
    this.renderizarCardsConcluidos();
  }

  renderizarCardsProximos(): void {
    const container = document.getElementById('proximos-eventos-container');
    if (!container) return;

    container.innerHTML = this.proximosEventos.map(evento => this.criarCardEvento(evento, false)).join('');
  }

  renderizarCardsConcluidos(): void {
    const container = document.getElementById('eventos-concluidos-container');
    if (!container) return;

    container.innerHTML = this.eventosConcluidos.map(evento => this.criarCardEvento(evento, true)).join('');
  }

  criarCardEvento(evento: Evento, concluido: boolean): string {
    const data = new Date(evento.dataHora);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card event-card clickable-card" onclick="window.location.href='/eventos/${evento.id}'">
          <div class="position-relative event-image-container">
            <img src="${this.getImagemUrl(evento.imagem || '')}" 
                 class="card-img-top event-image" 
                 alt="${evento.nome}">
            <span class="badge ${concluido ? 'bg-secondary' : 'bg-success'} status-badge">
              ${concluido ? 'Realizado' : 'Em breve'}
            </span>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-start gap-3 mb-3">
              <div class="event-date">
                <div class="event-day">${dia}</div>
                <div class="event-month">${mes}</div>
              </div>
              <div>
                <h5 class="card-title mb-1">${evento.nome
                  
                }</h5>
                <p class="text-muted small mb-0">
                  <i class="bi bi-geo-alt me-1"></i>${evento.local}
                </p>
              </div>
            </div>
            <p class="card-text text-muted small">
              ${evento.descricao.substring(0, 100)}...
            </p>
            <div class="d-flex justify-content-between align-items-center mt-3">
              <span class="badge bg-light text-dark">${evento.categoria}</span>
              <small class="text-muted">
                <i class="bi bi-people me-1"></i>${evento.participantes || 0} participantes
              </small>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getImagemUrl(imagem: string): string {
    if (!imagem) return 'assets/images/evento-placeholder.jpg';
    if (imagem.startsWith('http')) return imagem;
    return `http://localhost:8080/arquivos/${imagem}`;
  }
}
