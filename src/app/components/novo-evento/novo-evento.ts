import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { Router } from '@angular/router';
import { Evento } from '../../models/evento.model';
import { EventoService } from '../../service/evento-service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Eventos } from '../eventos/eventos';


@Component({
  selector: 'app-novo-evento',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './novo-evento.html',
  styleUrl: './novo-evento.css',
})
export class NovoEvento implements OnInit {

  evento = {
    nome: '',
    descricao: '',
    dataHora: '',
    local: '',
    categoria: '',
    organizador: '',
    contato: '',
    requisitos: '',
    vagas: 50,
    imagem: null as File | null
  };

  imagemPreview: string | null = null;
  loading = false;

  constructor(
    private eventoService : EventoService,
    private router: Router
  ){ }

 ngOnInit(): void {
    console.log("Componente iniciado")
  }

  previewImagem(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.evento.imagem = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagemPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  criarEvento() {
    if (!this.validarFormulario()) {
      alert('Preencha todos os campos obrigatórios (*)');
      return;
    }

    this.loading = true;

  const evento: Evento = {
  nome: this.evento.nome,
  descricao: this.evento.descricao,
  dataHora: this.evento.dataHora,
  local: this.evento.local,
  categoria: this.evento.categoria,
  organizador: this.evento.organizador,
  contato: this.evento.contato,
  requisitos: this.evento.requisitos
  };
   

    this.eventoService.criarEvento(evento).subscribe({
      next: (response : Evento) => {
        alert('Evento criado com sucesso!');
        this.router.navigate(['/eventos', response.id]);
      },
      error: (error: Evento) => {
        console.error('Erro ao criar evento:', error);
        alert('Erro ao criar evento. Tente novamente.');
        this.loading = false;
      }
    });

  }

  validarFormulario(): boolean {
    return !!(
      this.evento.nome &&
      this.evento.descricao &&
      this.evento.dataHora &&
      this.evento.local &&
      this.evento.categoria &&
      this.evento.organizador &&
      this.evento.contato
    );
  }

  cancelar() {
    this.router.navigate(['/']);
  }
}
