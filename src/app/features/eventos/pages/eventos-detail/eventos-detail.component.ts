import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Evento } from '../../../../shared/models/evento.model';

import { CommonModule } from '@angular/common';
import { EventoService } from '../../../../core/service/evento.service';
import { AuthService } from '../../../../core/service/auth.service';



@Component({
  selector: 'app-eventos',
  imports: [MatIconModule, CommonModule, RouterModule],
  templateUrl: './eventos-detail.component.html',
  styleUrl: './eventos-detail.component.css',
})
export class Eventos implements OnInit, OnDestroy{
evento: Evento | null = null;
  loading = true;
  error = false;
  isConcluido = false;
  imagemHeroUrl = 'assets/images/evento-placeholder.jpg';
  imagemPrincipalUrl = 'assets/images/evento-placeholder.jpg';
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private eventoService: EventoService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (!id) {
      this.mostrarErro();
      return;
    }

    this.carregarEvento(parseInt(id));
    this.configurarBotaoVoltarTopo();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  carregarEvento(id: number): void {
    this.loading = true;
    this.subscriptions.add(
      this.eventoService.buscarEventoPorId(id).subscribe({
        next: (evento) => {
          this.evento = evento;
          this.isConcluido = new Date(evento.dataHora) < new Date();
          this.imagemHeroUrl = this.eventoService.getImagemUrl(evento.imagemPrincipal);
          this.imagemPrincipalUrl = this.eventoService.getImagemUrl(evento.imagemPrincipal);
          this.loading = false;
          document.title = `${evento.nome} - EcoEventos Palmas`;
        },
        error: (error) => {
          console.error('Erro ao carregar evento:', error);
          this.mostrarErro();
        }
      })
    );
  }

  getImagemUrl(imagemPrincipal: string | undefined): string {
    return this.eventoService.getImagemUrl(imagemPrincipal);
  }

  getDataFormatada(data: string | Date): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getHorarioFormatado(data: string | Date): string {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDescricaoCurta(): string {
    if (!this.evento?.descricao) return '';
    return this.evento.descricao.length > 150 
      ? this.evento.descricao.substring(0, 150) + '...' 
      : this.evento.descricao;
  }

  participarEvento(): void {
    if (!this.authService.isLoggedIn()) {
      alert('🔐 Faça login para se inscrever no evento');
      return;
    }
    
    if (this.evento?.linkInscricao) {
      window.open(this.evento.linkInscricao, '_blank');
    } else {
      alert('📝 Link de inscrição não disponível no momento. Entre em contato com o organizador.');
    }
  }

  mostrarErro(): void {
    this.loading = false;
    this.error = true;
  }

  private configurarBotaoVoltarTopo(): void {
    window.addEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleScroll(): void {
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      if (window.scrollY > 300) {
        backToTop.classList.add('show');
      } else {
        backToTop.classList.remove('show');
      }
    }
  }

  voltarAoTopo(event: Event): void {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
