import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { ActivatedRoute, Router } from '@angular/router';
import { Evento } from '../../../../shared/models/evento.model';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { EventoService } from '../../../../core/service/evento.service';
import { Subscription } from 'rxjs';



@Component({
  selector: 'app-novo-evento',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './eventos-form.component.html',
  styleUrl: './eventos-form.component.css',
})
export class EventoForm implements OnInit, OnDestroy {
  evento: Partial<Evento> = {
    nome: '',
    descricao: '',
    dataHora: '',
    local: '',
    categoria: '',
    contato: '',
    requisitos: '',
    participantes: 0,
    linkInscricao: ''
  };

  isEditMode = false;
  eventoId: number | null = null;
  imagemFile: File | null = null;
  imagemPreview: string | null = null;
  loading = false;
  carregandoEvento = false;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private eventoService: EventoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.eventoId = +params['id'];
        this.carregarEvento();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarEvento(): void {
    if (!this.eventoId) return;
    
    this.carregandoEvento = true;
    this.subscriptions.add(
      this.eventoService.buscarEventoPorId(this.eventoId).subscribe({
        next: (evento) => {
          this.evento = {
            id: evento.id,
            nome: evento.nome,
            descricao: evento.descricao,
            dataHora: evento.dataHora.split('T')[0], // Formato para input date
            local: evento.local,
            categoria: evento.categoria,
            contato: evento.contato,
            requisitos: evento.requisitos,
            participantes: evento.participantes,
            linkInscricao: evento.linkInscricao
          };
          
          if (evento.imagemPrincipal) {
            this.imagemPreview = this.eventoService.getImagemUrl(evento.imagemPrincipal);
          }
          
          this.carregandoEvento = false;
        },
        error: (error) => {
          console.error('Erro ao carregar evento:', error);
          this.carregandoEvento = false;
          alert('Erro ao carregar evento para edição');
          this.router.navigate(['/admin/eventos']);
        }
      })
    );
  }

  previewImagem(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imagemFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.imagemPreview = reader.result as string;
      reader.readAsDataURL(this.imagemFile);
    }
  }

  salvarEvento(): void {
    if (!this.validarFormulario()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    this.loading = true;

    let dataHoraFormatada = this.evento.dataHora;

if (dataHoraFormatada && !dataHoraFormatada.includes('T')) {
  dataHoraFormatada = `${dataHoraFormatada}T00:00:00`;
}
    const eventoParaEnviar: Partial<Evento> = {
      nome: this.evento.nome,
      descricao: this.evento.descricao,
      dataHora: dataHoraFormatada,
      local: this.evento.local,
      categoria: this.evento.categoria,
      contato: this.evento.contato,
      requisitos: this.evento.requisitos,
      participantes: this.evento.participantes || 0,
      linkInscricao: this.evento.linkInscricao
    };

  

    if (this.isEditMode && this.eventoId) {
      // Atualizar evento existente
      this.subscriptions.add(
        this.eventoService.atualizarEvento(this.eventoId, eventoParaEnviar).subscribe({
          next: (eventoAtualizado) => {
            this.processarImagem(eventoAtualizado.id!);
          },
          error: (error) => {
            console.error('Erro ao atualizar:', error);
            this.loading = false;
            alert('Erro ao atualizar evento. Verifique se você está logado como ADMIN.');
          }
        })
      );
    } else {
      // Criar novo evento
      this.subscriptions.add(
        this.eventoService.criarEvento(eventoParaEnviar).subscribe({
          next: (eventoCriado) => {
            this.processarImagem(eventoCriado.id!);
          },
          error: (error) => {
            console.error('Erro ao criar:', error);
            this.loading = false;
            alert('Erro ao criar evento. Verifique se você está logado como ADMIN.');
          }
        })
      );
    }
  }

  processarImagem(eventoId: number): void {
    if (this.imagemFile) {
      this.eventoService.uploadImagem(eventoId, this.imagemFile).subscribe({
        next: () => {
          this.loading = false;
          alert(this.isEditMode ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
          this.router.navigate(['/eventos', eventoId]);
        },
        error: (error) => {
          console.error('Erro ao enviar imagem:', error);
          this.loading = false;
          alert(this.isEditMode ? 'Evento atualizado mas erro ao enviar imagem' : 'Evento criado mas erro ao enviar imagem');
          this.router.navigate(['/eventos', eventoId]);
        }
      });
    } else {
      this.loading = false;
      alert(this.isEditMode ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
      this.router.navigate(['/eventos', eventoId]);
    }
  }

  validarFormulario(): boolean {
    return !!(this.evento.nome?.trim() && 
              this.evento.descricao?.trim() && 
              this.evento.dataHora && 
              this.evento.local?.trim() && 
              this.evento.contato?.trim());
  }

  cancelar(): void {
    if (this.isEditMode) {
      this.router.navigate(['/admin/eventos']);
    } else {
      this.router.navigate(['/']);
    }
  }

  voltar(): void {
    this.router.navigate(['/admin/eventos']);
  }
}
