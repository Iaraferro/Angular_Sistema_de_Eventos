import { Subscription } from "rxjs";
import { UsuarioCreateDTO, UsuarioResponse } from "../../../../shared/models/auth.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { UsuarioService } from "../../../../core/service/usuario.service";

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioResponse[] = [];
  loading = true;
  salvando = false;
  excluindo = false;
  
  modalAberto = false;
  isEditMode = false;
  usuarioForm: UsuarioCreateDTO = {
    nome: '',
    email: '',
    username: '',
    senha: '',
    id_perfil: 2
  };
  usuarioEditandoId: number | null = null;
  
  modalExclusaoAberto = false;
  usuarioParaExcluir: UsuarioResponse | null = null;
  
  private subscriptions: Subscription = new Subscription();
  private modalElement: HTMLElement | null = null;
  private modalExclusaoElement: HTMLElement | null = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  ngAfterViewInit(): void {
    this.modalElement = document.getElementById('modalUsuario');
    this.modalExclusaoElement = document.getElementById('modalExclusao');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.fecharModal();
    this.fecharModalExclusao();
  }

  carregarUsuarios(): void {
    this.loading = true;
    this.subscriptions.add(
      this.usuarioService.listarUsuarios().subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar usuários:', error);
          this.loading = false;
          alert('Erro ao carregar usuários. Tente novamente.');
        }
      })
    );
  }

  abrirModalNovo(): void {
    this.isEditMode = false;
    this.usuarioForm = {
      nome: '',
      email: '',
      username: '',
      senha: '',
      id_perfil: 2
    };
    this.usuarioEditandoId = null;
    this.abrirModal();
  }

  abrirModalEditar(usuario: UsuarioResponse): void {
    this.isEditMode = true;
    this.usuarioForm = {
      nome: usuario.nome || '',
      email: usuario.email,
      username: usuario.username,
      senha: '',
      id_perfil: usuario.perfil?.id || 2
    };
    this.usuarioEditandoId = usuario.id;
    this.abrirModal();
  }

  abrirModal(): void {
    if (this.modalElement) {
      this.modalElement.style.display = 'block';
      this.modalElement.classList.add('show');
      document.body.classList.add('modal-open');
      
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modalBackdrop';
      document.body.appendChild(backdrop);
    }
  }

  fecharModal(): void {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
      this.modalElement.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      const backdrop = document.getElementById('modalBackdrop');
      if (backdrop) backdrop.remove();
    }
    this.modalAberto = false;
  }

  salvarUsuario(): void {
    if (!this.validarFormulario()) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    this.salvando = true;

    if (this.isEditMode && this.usuarioEditandoId) {
      const dadosAtualizacao: Partial<UsuarioCreateDTO> = {
        nome: this.usuarioForm.nome,
        email: this.usuarioForm.email,
        username: this.usuarioForm.username,
        id_perfil: this.usuarioForm.id_perfil
      };
      if (this.usuarioForm.senha) {
        dadosAtualizacao.senha = this.usuarioForm.senha;
      }
      
      this.subscriptions.add(
        this.usuarioService.atualizarUsuario(this.usuarioEditandoId, dadosAtualizacao).subscribe({
          next: () => {
            this.salvando = false;
            this.fecharModal();
            this.carregarUsuarios();
            alert('✅ Usuário atualizado com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao atualizar:', error);
            this.salvando = false;
            alert('❌ Erro ao atualizar usuário. Tente novamente.');
          }
        })
      );
    } else {
      this.subscriptions.add(
        this.usuarioService.criarUsuario(this.usuarioForm).subscribe({
          next: () => {
            this.salvando = false;
            this.fecharModal();
            this.carregarUsuarios();
            alert('✅ Usuário criado com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao criar:', error);
            this.salvando = false;
            alert('❌ Erro ao criar usuário. Tente novamente.');
          }
        })
      );
    }
  }

  validarFormulario(): boolean {
    if (!this.usuarioForm.nome?.trim()) return false;
    if (!this.usuarioForm.email?.trim()) return false;
    if (!this.usuarioForm.username?.trim()) return false;
    if (!this.isEditMode && !this.usuarioForm.senha?.trim()) return false;
    return true;
  }

  confirmarExclusao(usuario: UsuarioResponse): void {
    this.usuarioParaExcluir = usuario;
    this.abrirModalExclusao();
  }

  abrirModalExclusao(): void {
    if (this.modalExclusaoElement) {
      this.modalExclusaoElement.style.display = 'block';
      this.modalExclusaoElement.classList.add('show');
      document.body.classList.add('modal-open');
      
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modalBackdropExclusao';
      document.body.appendChild(backdrop);
    }
  }

  fecharModalExclusao(): void {
    if (this.modalExclusaoElement) {
      this.modalExclusaoElement.style.display = 'none';
      this.modalExclusaoElement.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      const backdrop = document.getElementById('modalBackdropExclusao');
      if (backdrop) backdrop.remove();
    }
    this.usuarioParaExcluir = null;
  }

  excluirUsuario(): void {
    if (!this.usuarioParaExcluir?.id) return;
    
    this.excluindo = true;
    this.subscriptions.add(
      this.usuarioService.deletarUsuario(this.usuarioParaExcluir.id).subscribe({
        next: () => {
          this.excluindo = false;
          this.fecharModalExclusao();
          this.carregarUsuarios();
          alert('✅ Usuário excluído com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao excluir:', error);
          this.excluindo = false;
          alert('❌ Erro ao excluir usuário. Tente novamente.');
        }
      })
    );
  }

  getPerfilNome(idPerfil: number): string {
    return idPerfil === 1 ? 'Administrador' : 'Usuário';
  }

  getPerfilBadgeClass(idPerfil: number): string {
    return idPerfil === 1 ? 'badge-admin' : 'badge-user';
  }
}