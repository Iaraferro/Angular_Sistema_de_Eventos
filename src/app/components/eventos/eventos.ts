import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth-service';
import { Evento } from '../../models/evento.model';

import { CommonModule } from '@angular/common';
import { EventoService } from '../../service/evento-service';


@Component({
  selector: 'app-eventos',
  imports: [MatIconModule, CommonModule, RouterModule],
  templateUrl: './eventos.html',
  styleUrl: './eventos.css',
})
export class Eventos implements OnInit, OnDestroy{

  evento: Evento | null = null;
  loading = true;
  error: boolean = false;
  isConcluido = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private eventoService : EventoService,
    public authService: AuthService
  ){}

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
    this.subscription.unsubscribe();
    window.removeEventListener('scroll', this.handleScroll);
  }

  carregarEvento(id: number): void {
    this.subscription.add(
      this.eventoService.buscarEventoPorId(id).subscribe({
        next: (evento) => {
          this.evento = evento;
          this.isConcluido = new Date(evento.dataHora) < new Date();
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

  getImagemUrl(imagem: string): string {
    if (!imagem) return '';
    if (imagem.startsWith('http')) return imagem;
    return `http://localhost:8080/arquivos/${imagem}`;
  }

  getDataFormatada(data: string | Date) {
    return new Date(data).toLocaleDateString();
  }

  getDescricaoCurta(): string {
    if (!this.evento?.descricao) return '';
    return this.evento.descricao.length > 150 
      ? this.evento.descricao.substring(0, 150) + '...' 
      : this.evento.descricao;
  }

  participarEvento(): void {
    if (!this.authService.isLoggedIn()) {
      // Redirecionar para login ou mostrar modal
      alert('Faça login para participar do evento');
      return;
    }
      
    
   if (this.evento?.id) {
  this.eventoService.participarEvento(this.evento.id).subscribe();
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
