import { Component, OnInit } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/service/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
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
      
  }
  login(): void {
    if (!this.username || !this.senha) {
      this.errorMessage = 'Preencha usuário e senha';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({
      username: this.username,
      senha: this.senha
    }).subscribe({
      next: (response) => {
        console.log('Login successful', response);
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
