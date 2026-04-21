import { RouterModule, Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Login } from './features/auth/pages/login/login';
import { Eventos } from './features/eventos/pages/eventos-detail/eventos-detail.component';
import { Admin } from './features/admin/admin.component';
import { authGuard } from './core/guards/auth-guard';
import { Dashboard } from './features/admin/pages/dashboard/dashboard.component';
import { EventosAdmin } from './features/admin/pages/eventos-admin/eventos-admin.component';
import { EventoForm } from './features/admin/pages/eventos-form/eventos-form.component';
import { Relatorios } from './features/admin/pages/relatorios/relatorios.component';

import { InscricaoAdmin } from './features/admin/pages/inscricoes/inscricoes-admin.component';



export const routes: Routes = [
  { path: '', component: Home, title: 'EcoEventos Palmas' },
  { path: 'eventos/:id', component: Eventos, title: 'Detalhes do Evento' },
  { path: 'login', component: Login, title: 'Login' },
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard],
    title: 'Área Administrativa',
    children: [
      { path: 'dashboard', component: Dashboard, title: 'Dashboard' },
      { path: 'eventos', component: EventosAdmin, title: 'Gerenciar Eventos' },
      { path: 'novo-evento', component: EventoForm, title: 'Novo Evento' },
      { path: 'editar-evento/:id', component: EventoForm, title: 'Editar Evento' },
      { path: 'relatorios', component: Relatorios, title: 'Relatórios' },
       { path: 'inscricoes', component: InscricaoAdmin, title: 'Inscrições'
  },
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];


