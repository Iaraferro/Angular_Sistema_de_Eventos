import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Evento } from '../../shared/models/evento.model';
import { Subscription } from 'rxjs';

import { EventoService } from '../../core/service/evento.service';
import { AuthService } from '../../core/service/auth.service';
import {MatPaginatorModule} from '@angular/material/paginator';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, MatPaginatorModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  
})
export class Home implements OnInit, OnDestroy{
  proximosEventos: Evento[] = [];
  eventosConcluidos: Evento[] = [];
  loading = true;
  activeTab: 'proximos' | 'realizados' = 'proximos';
  private subscriptions: Subscription = new Subscription();

  // Propriedades de paginação
  totalElements = 0;
  totalProximos = 0;
  totalRealizados = 0;
  pageSize = 6;
  currentPage = 0;

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
    this.loading = true;
    
    // Define o status baseado na aba ativa
    let status = '';
    if (this.activeTab === 'proximos') {
      status = 'proximos';
    } else if (this.activeTab === 'realizados') {
      status = 'realizados';
    }
    
    this.subscriptions.add(
      this.eventoService.listarPaginado(this.currentPage, this.pageSize, status).subscribe({
        next: (response) => {
          if (this.activeTab === 'proximos') {
            this.proximosEventos = response.content;
            this.totalProximos = response.totalElements;
          } else {
            this.eventosConcluidos = response.content;
            this.totalRealizados = response.totalElements;
          }
          this.totalElements = response.totalElements;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  // Método para mudar de página
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregarEventos();
  }

  // Método para mudar de aba
  changeTab(tab: 'proximos' | 'realizados'): void {
    if (this.activeTab === tab) return;
    
    this.activeTab = tab;
    this.currentPage = 0; // Volta para primeira página
    this.carregarEventos();
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

  isProximo(evento: Evento): boolean {
    const dataEvento = new Date(evento.dataHora);
    const agora = new Date();
    const diffDias = Math.ceil((dataEvento.getTime() - agora.getTime()) / (1000 * 3600 * 24));
    return diffDias <= 7 && diffDias >= 0;
  }

}