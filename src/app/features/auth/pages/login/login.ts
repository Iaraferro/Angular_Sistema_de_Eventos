import { Component, OnInit } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/service/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
 username = '';
  senha = '';
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }
  
  login(): void {
    if (!this.username || !this.senha) {
      this.errorMessage = 'Preencha usuário e senha';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // ✅ CORRIGIDO: Removeu o objeto com logout fictício
    this.authService.login({
      username: this.username,
      senha: this.senha
    }).subscribe({
      next: (user) => {
        console.log('Login successful', user);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        console.error('Login error:', error);
        this.errorMessage = error.status === 401 
          ? 'Usuário ou senha inválidos' 
          : 'Erro ao conectar com o servidor';
        this.loading = false;
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
