import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Evento } from '../../shared/models/evento.model';
import { Subscription } from 'rxjs';

import { EventoService } from '../../core/service/evento.service';
import { AuthService } from '../../core/service/auth.service';

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
  activeTab: 'proximos' | 'realizados' = 'proximos';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private eventoService: EventoService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.carregarEventos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarEventos(): void {
    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos) => {
          const agora = new Date();
          
          this.proximosEventos = eventos
            .filter(e => new Date(e.dataHora) >= agora)
            .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime())
            .slice(0, 6);

          this.eventosConcluidos = eventos
            .filter(e => new Date(e.dataHora) < agora)
            .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
            .slice(0, 6);

          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  getImagemUrl(imagemPrincipal: string | undefined): string {
    return this.eventoService.getImagemUrl(imagemPrincipal);
  }

  formatarData(dataHora: string): { dia: string; mes: string } {
    const data = new Date(dataHora);
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return { dia, mes };
  }
}
