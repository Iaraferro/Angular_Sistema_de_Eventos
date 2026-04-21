import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../core/service/auth.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-menu',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class Menu {
   constructor(public authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
