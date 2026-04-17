import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../core/service/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, CommonModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class Menu {
  navOpen = false;

  constructor(public authService: AuthService) {}

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  closeNav(): void {
    this.navOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeNav();
  }
}
