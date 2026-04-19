import { Component, OnDestroy, OnInit } from "@angular/core";
import { Inscricao } from "../../../../shared/models/inscricao.model";
import { Evento } from "../../../../shared/models/evento.model";
import { Subscription } from "rxjs";
import { InscricaoService } from "../../../../core/service/inscricao.service";
import { EventoService } from "../../../../core/service/evento.service";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-inscricoes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inscricoes-admin.component.html',
  styleUrls: ['./inscricoes-admin.component.css']
})
export class InscricaoAdmin implements OnInit, OnDestroy{
  inscricoes: Inscricao[] = [];
  inscricoesFiltradas: Inscricao[] = [];
  eventos: Evento[] = [];
  loading = true;
  eventoFiltroId: number | null = null;
  searchTerm: string = '';
  private subscriptions: Subscription = new Subscription();

  constructor(
    private inscricaoService: InscricaoService,
    private eventoService: EventoService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarDados(): void {
    this.loading = true;
    
    // Carrega eventos e inscrições em paralelo
    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos) => {
          this.eventos = eventos;
          this.carregarInscricoes();
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  // ✅ CORRIGIDO: Use listarTodasComEventos se disponível, senão carrega otimizado
  carregarInscricoes(): void {
    // Tenta carregar todas de uma vez (se backend suportar)
    this.subscriptions.add(
      this.inscricaoService.listarTodas().subscribe({
        next: (inscricoes) => {
          // Enriquecer com nome do evento
          this.inscricoes = inscricoes.map(inscricao => ({
            ...inscricao,
            eventoNome: this.eventos.find(e => e.id === inscricao.eventoId)?.nome || 'Evento não encontrado'
          }));
          this.filtrarInscricoes();
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar inscrições:', error);
          this.loading = false;
        }
      })
    );
  }

  filtrarInscricoes(): void {
    let filtradas = [...this.inscricoes];
    
    if (this.eventoFiltroId) {
      filtradas = filtradas.filter(i => i.eventoId === this.eventoFiltroId);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtradas = filtradas.filter(i => 
        i.nome.toLowerCase().includes(term) || 
        i.email?.toLowerCase().includes(term) ||
        i.telefone?.includes(term)
      );
    }
    
    filtradas.sort((a, b) => 
      new Date(b.dataInscricao).getTime() - new Date(a.dataInscricao).getTime()
    );
    
    this.inscricoesFiltradas = filtradas;
  }

  limparFiltros(): void {
    this.eventoFiltroId = null;
    this.searchTerm = '';
    this.filtrarInscricoes();
  }

  formatarData(data: string): string {
    if (!data) return 'Data não informada';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  deletarInscricao(id: number): void {
    if (confirm('Tem certeza que deseja cancelar esta inscrição?')) {
      this.subscriptions.add(
        this.inscricaoService.deletarInscricao(id).subscribe({
          next: () => {
            this.inscricoes = this.inscricoes.filter(i => i.id !== id);
            this.filtrarInscricoes();
            alert('Inscrição cancelada com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao deletar:', error);
            if (error.status === 403) {
              alert('Você não tem permissão para cancelar inscrições.');
            } else {
              alert('Erro ao cancelar inscrição.');
            }
          }
        })
      );
    }
  }

  getTotalInscricoes(): number {
    return this.inscricoesFiltradas.length;
  }

  exportarCSV(): void {
    const headers = ['Nome', 'Email', 'Telefone', 'Evento', 'Data Inscrição'];
    const dados = this.inscricoesFiltradas.map(i => [
      i.nome,
      i.email || '',
      i.telefone,
      i.eventoNome,
      this.formatarData(i.dataInscricao)
    ]);
    
    const csvContent = [headers, ...dados].map(row => row.join(',')).join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `inscricoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}