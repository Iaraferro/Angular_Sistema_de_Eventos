import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [MatSidenavModule, RouterModule ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
shouldRun = /(^|.)(stackblitz|webcontainer).(io|com)$/.test(window.location.host);
}
