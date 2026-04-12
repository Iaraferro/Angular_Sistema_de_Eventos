import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../../../../core/service/evento.service';
import { Subscription } from 'rxjs';
import { Evento } from '../../../../shared/models/evento.model';


interface Participante {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  dataInscricao: string;
  eventoId: number;
  eventoNome: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
}
@Component({
  selector: 'app-participantes',
  imports: [CommonModule, FormsModule],
  templateUrl: './participantes.component.html',
  styleUrl: './participantes.component.css',
})
export class Participantes implements OnInit, OnDestroy{

  participantes: Participante[] = [];
  eventos: Evento[] = [];
  loading = true;
  eventoFiltroId: number | null = null;
  statusFiltro: string = '';
  searchTerm: string = '';
  
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
          this.eventos = eventos;
          this.carregarParticipantes();
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  carregarParticipantes(): void {
    // TODO: Quando o back-end tiver endpoint de participantes, substituir por chamada real
    // Por enquanto, dados mockados baseados nos eventos
    this.participantes = this.gerarParticipantesMock();
    this.loading = false;
  }

  gerarParticipantesMock(): Participante[] {
    const participantes: Participante[] = [];
    const nomes = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Lucas Lima', 
                   'Fernanda Souza', 'Rafael Alves', 'Camila Rocha', 'Bruno Mendes', 'Patrícia Dias'];
    const emails = ['joao@email.com', 'maria@email.com', 'pedro@email.com', 'ana@email.com', 
                    'lucas@email.com', 'fernanda@email.com', 'rafael@email.com', 'camila@email.com',
                    'bruno@email.com', 'patricia@email.com'];
    
    this.eventos.forEach((evento, idx) => {
      const numParticipantes = Math.floor(Math.random() * 20) + 5;
      for (let i = 0; i < numParticipantes && i < nomes.length; i++) {
        participantes.push({
          id: participantes.length + 1,
          nome: nomes[i % nomes.length],
          email: emails[i % emails.length],
          telefone: `(63) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          dataInscricao: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          eventoId: evento.id!,
          eventoNome: evento.nome,
          status: ['confirmado', 'confirmado', 'pendente', 'confirmado', 'cancelado'][Math.floor(Math.random() * 5)] as any
        });
      }
    });
    
    return participantes;
  }

  get participantesFiltrados(): Participante[] {
    let filtrados = this.participantes;
    
    if (this.eventoFiltroId) {
      filtrados = filtrados.filter(p => p.eventoId === this.eventoFiltroId);
    }
    
    if (this.statusFiltro) {
      filtrados = filtrados.filter(p => p.status === this.statusFiltro);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtrados = filtrados.filter(p => 
        p.nome.toLowerCase().includes(term) || 
        p.email.toLowerCase().includes(term)
      );
    }
    
    return filtrados;
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'confirmado': return 'status-confirmado';
      case 'pendente': return 'status-pendente';
      case 'cancelado': return 'status-cancelado';
      default: return '';
    }
  }

  getStatusTexto(status: string): string {
    switch(status) {
      case 'confirmado': return 'Confirmado';
      case 'pendente': return 'Pendente';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  }

  limparFiltros(): void {
    this.eventoFiltroId = null;
    this.statusFiltro = '';
    this.searchTerm = '';
  }

  exportarCSV(): void {
    const headers = ['Nome', 'Email', 'Telefone', 'Evento', 'Data Inscrição', 'Status'];
    const dados = this.participantesFiltrados.map(p => [
      p.nome, p.email, p.telefone || '', p.eventoNome, 
      this.formatarData(p.dataInscricao), this.getStatusTexto(p.status)
    ]);
    
    const csvContent = [headers, ...dados].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `participantes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

}
