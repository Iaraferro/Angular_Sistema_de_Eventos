import { RouterModule, Routes } from '@angular/router';
import { Admin } from './components/admin/admin';
import { Home } from './components/home/home';
import { Dashboard } from './components/dashboard/dashboard';
import { Eventos } from './components/eventos/eventos';
import { NovoEvento } from './components/novo-evento/novo-evento';
import { Participantes } from './components/participantes/participantes';
import { Relatorios } from './components/relatorios/relatorios';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    {path:'', component: Home, title:'Página inicial'},
    {
        path:'admin', 
        component: Admin,
        title: 'Area administrativa',
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'eventos', component: Eventos },
            { path: 'novo-evento', component: NovoEvento },
            { path: 'participantes', component: Participantes },
            { path: 'relatorios', component: Relatorios }
        ]}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports:[RouterModule]
})
export class AppRoutingModule{}