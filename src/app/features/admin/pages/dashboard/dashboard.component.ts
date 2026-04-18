import { Component, OnDestroy, OnInit } from '@angular/core';
import { Evento } from '../../../../shared/models/evento.model';
import { Subscription } from 'rxjs';
import { EventoService } from '../../../../core/service/evento.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


interface DashboardStats {
  totalEventos: number;
  eventosFuturos: number;
  eventosRealizados: number;
  totalParticipantes: number;
  eventosPorMes: { mes: string; total: number }[];
  eventosPorCategoria: { categoria: string; total: number; percentual: number }[];
  eventosRecentes: Evento[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class Dashboard implements OnInit, OnDestroy{

  loading = true;
  stats: DashboardStats = {
    totalEventos: 0,
    eventosFuturos: 0,
    eventosRealizados: 0,
    totalParticipantes: 0,
    eventosPorMes: [],
    eventosPorCategoria: [],
    eventosRecentes: []
  };
  
  private subscriptions: Subscription = new Subscription();

  constructor(private eventoService: EventoService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarDados(): void {
    this.loading = true;
    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos) => {
          this.calcularEstatisticas(eventos);
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar dashboard:', error);
          this.loading = false;
        }
      })
    );
  }

  calcularEstatisticas(eventos: Evento[]): void {
    const agora = new Date();
    const eventosFuturos = eventos.filter(e => new Date(e.dataHora) >= agora);
    const eventosRealizados = eventos.filter(e => new Date(e.dataHora) < agora);
    const totalParticipantes = eventos.reduce((sum, e) => sum + (e.participantes || 0), 0);

    // Eventos por mês (últimos 6 meses)
    const eventosPorMes = this.calcularEventosPorMes(eventos);
    
    // Eventos por categoria com percentual
    const eventosPorCategoria = this.calcularEventosPorCategoria(eventos);
    
    // Últimos 5 eventos
    const eventosRecentes = [...eventos]
      .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
      .slice(0, 5);

    this.stats = {
      totalEventos: eventos.length,
      eventosFuturos: eventosFuturos.length,
      eventosRealizados: eventosRealizados.length,
      totalParticipantes,
      eventosPorMes,
      eventosPorCategoria,
      eventosRecentes
    };
  }

  calcularEventosPorMes(eventos: Evento[]): { mes: string; total: number }[] {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const contagem: { [key: string]: number } = {};
    
    eventos.forEach(evento => {
      const data = new Date(evento.dataHora);
      const mesKey = `${data.getFullYear()}-${data.getMonth()}`;
      contagem[mesKey] = (contagem[mesKey] || 0) + 1;
    });

    const ultimos6Meses = Object.entries(contagem)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, total]) => {
        const [ano, mes] = key.split('-');
        return { mes: `${meses[parseInt(mes)]}/${ano}`, total };
      });

    return ultimos6Meses;
  }

  calcularEventosPorCategoria(eventos: Evento[]): { categoria: string; total: number; percentual: number }[] {
    const contagem: { [key: string]: number } = {};
    const totalEventos = eventos.length;
    
    eventos.forEach(evento => {
      const categoria = evento.categoria || 'Sem categoria';
      contagem[categoria] = (contagem[categoria] || 0) + 1;
    });

    return Object.entries(contagem)
      .map(([categoria, total]) => ({ 
        categoria, 
        total,
        percentual: totalEventos > 0 ? (total / totalEventos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  formatarData(data: string | Date): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  getStatusClass(evento: Evento): string {
    return new Date(evento.dataHora) < new Date() ? 'badge-secondary' : 'badge-primary';
  }

  getStatusTexto(evento: Evento): string {
    return new Date(evento.dataHora) < new Date() ? 'Realizado' : 'Em breve';
  }

  

  getMaxEventosPorMes(): number {
    if (!this.stats.eventosPorMes.length) return 1;
    return Math.max(...this.stats.eventosPorMes.map(m => m.total));
  }

  getBarWidth(total: number): number {
    const max = this.getMaxEventosPorMes();
    return max > 0 ? (total / max) * 100 : 0;
  }

  isEventoRealizado(evento: Evento): boolean {
  return new Date(evento.dataHora) < new Date();
}
}
