import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-menu',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css',
})
export class Menu {
   
}
