import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';


import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/service/auth.service';

@Component({
  selector: 'app-admin',
  imports: [MatSidenavModule, RouterModule, CommonModule ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class Admin implements OnInit, OnDestroy{
sidebarOpen = false;
  currentTitle = 'Dashboard';
  private routerSubscription: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });
  }

  ngOnInit(): void {
    this.updateTitle();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateTitle(): void {
    const path = this.router.url;
    if (path.includes('dashboard')) this.currentTitle = 'Dashboard';
    else if (path.includes('eventos') && !path.includes('novo')) this.currentTitle = 'Gerenciar Eventos';
    else if (path.includes('novo-evento')) this.currentTitle = 'Novo Evento';
    else if (path.includes('participantes')) this.currentTitle = 'Participantes';
    else if (path.includes('relatorios')) this.currentTitle = 'Relatórios';
    else this.currentTitle = 'Área Administrativa';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
