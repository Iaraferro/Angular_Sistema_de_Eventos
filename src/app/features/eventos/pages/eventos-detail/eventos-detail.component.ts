import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Evento } from '../../../../shared/models/evento.model';

import { EventoService } from '../../../../core/service/evento.service';
import { AuthService } from '../../../../core/service/auth.service';
import { InscricaoService } from '../../../../core/service/inscricao.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ToastComponent } from '../../../../shared/components/toast/toast.component';

@Component({
  selector: 'app-eventos',
  imports: [MatIconModule, RouterModule, FormsModule, ToastComponent],
  templateUrl: './eventos-detail.component.html',
  styleUrl: './eventos-detail.component.css',
})
export class Eventos implements OnInit, OnDestroy {
  evento: Evento | null = null;
  loading = true;
  error = false;
  isConcluido = false;
  imagemHeroUrl = 'assets/images/evento-placeholder.jpg';
  imagemPrincipalUrl = 'assets/images/evento-placeholder.jpg';
  private subscriptions: Subscription = new Subscription();
  consentimento = false;
  mostrarFormInscricao = false;

  inscricao = {
    nome: '',
    email: '',
    telefone: '',
    eventoId: 0,
  };

  salvando = false;

  constructor(
    private route: ActivatedRoute,
    private inscricaoService: InscricaoService,
    private eventoService: EventoService,
    public authService: AuthService,
    private toast: ToastService,
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
        },
      }),
    );
  }

  participarEvento(): void {
    const user = this.authService.getCurrentUser();
    this.inscricao = {
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: '',
      eventoId: this.evento?.id || 0,
    };
    this.consentimento = false;
    this.mostrarFormInscricao = true;
  }

  cancelarInscricao(): void {
    this.mostrarFormInscricao = false;
    this.inscricao = { nome: '', email: '', telefone: '', eventoId: 0 };
    this.consentimento = false;
  }

  salvarInscricao(): void {
    if (!this.inscricao.nome || !this.inscricao.email || !this.inscricao.telefone) {
      this.toast.aviso('Preencha todos os campos');
      return;
    }

    if (!this.consentimento) {
      this.toast.aviso('Você precisa autorizar o uso dos seus dados para prosseguir');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.inscricao.email)) {
      this.toast.aviso('Digite um e-mail válido');
      return;
    }

    this.salvando = true;

    this.subscriptions.add(
      this.inscricaoService
        .criarInscricao({
          eventoId: this.inscricao.eventoId,
          nome: this.inscricao.nome,
          email: this.inscricao.email,
          telefone: this.inscricao.telefone,
        })
        .subscribe({
          next: () => {
            this.salvando = false;
            this.mostrarFormInscricao = false;
            this.toast.sucesso('Inscrição realizada com sucesso!');
            this.inscricao = { nome: '', email: '', telefone: '', eventoId: 0 };
            this.consentimento = false;
            if (this.evento) {
              this.evento.participantes = (this.evento.participantes || 0) + 1;
            }
          },
          error: (error) => {
            this.salvando = false;
            console.error('Erro na inscrição:', error);
            if (error.status === 400) {
              this.toast.erro('Este e-mail já está inscrito neste evento!');
            } else {
              this.toast.erro('Erro ao realizar inscrição. Tente novamente.');
            }
          },
        }),
    );
  }

  mostrarErro(): void {
    this.loading = false;
    this.error = true;
  }

  getDataFormatada(data: string | Date): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  getHorarioFormatado(data: string | Date): string {
    return new Date(data).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDescricaoCurta(): string {
    if (!this.evento?.descricao) return '';
    return this.evento.descricao.length > 150
      ? this.evento.descricao.substring(0, 150) + '...'
      : this.evento.descricao;
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
