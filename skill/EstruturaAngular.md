---
name: EstruturaAngular
description: Guia de estrutura do projeto Angular Sistema de Eventos (EcoEventos). Use sempre que precisar entender, modificar ou criar componentes, serviços, rotas, guards, interceptors ou integrações com a API do frontend.
---

# EstruturaAngular — Guia do Projeto EcoEventos (Frontend)

## Visão Geral

Frontend do sistema **EcoEventos Palmas**, uma aplicação de gerenciamento de eventos ecológicos. Permite que visitantes naveguem eventos, que usuários autenticados acessem detalhes e que administradores (`perfil.nome === 'Adm'`) gerenciem eventos, usuários, participantes e relatórios em uma área restrita.

Consome uma API REST Quarkus/Java em `http://localhost:8080` com autenticação JWT. Endpoints principais:

- `POST /auth` — login (retorna token como texto puro)
- `GET /usuarios/perfil` — perfil do usuário logado
- `GET|POST|PUT|DELETE /usuarios` e `/usuarios/{id}`
- `GET|POST|PUT|DELETE /eventos` e `/eventos/{id}`
- `POST|DELETE /eventos/{id}/imagem` — imagem principal do evento
- `GET|POST /eventos/{id}/arquivos` — arquivos anexos por evento
- `GET|DELETE /arquivos/{nomeArquivo}` — download / exclusão de arquivos

Papéis suportados: `Adm` (id_perfil = 1) e `User` (id_perfil = 2).

## Stack & Versões

- **Angular 20.2** (standalone components, sem NgModule)
- **TypeScript 5.9**
- **RxJS 7.8**, **Zone.js 0.15**
- **Angular Material 20.2** + **Angular CDK** (toolbar, sidenav, botões, ícones)
- **Bootstrap 5.3** + **Bootstrap Icons 1.13** (layout e grid)
- Estilos globais: `src/styles.css` e `src/custom-theme.scss` (tema Material)
- Testes: Karma + Jasmine
- Build: `@angular/build:application` (novo builder)
- Prettier configurado em `package.json` (printWidth 100, aspas simples)

## Estrutura de Pastas

```
Angular_Sistema_de_Eventos/
├── angular.json                  # config do workspace (prefix: app, styles, assets)
├── package.json                  # deps e scripts npm
├── tsconfig*.json
├── public/                       # assets públicos
└── src/
    ├── main.ts                   # bootstrap standalone: bootstrapApplication(App, appConfig)
    ├── index.html
    ├── styles.css                # estilos globais
    ├── custom-theme.scss         # tema Angular Material
    ├── assets/
    │   └── images/
    │       └── evento-placeholder.jpg   # fallback da imagem do evento
    └── app/
        ├── app.ts                # componente raiz <app-root> (RouterOutlet + Menu)
        ├── app.html / app.css
        ├── app.config.ts         # provideRouter + provideHttpClient(withInterceptors)
        ├── app.routes.ts         # definição de rotas
        │
        ├── core/                 # singletons (serviços, guards, interceptors)
        │   ├── guards/
        │   │   └── auth-guard.ts             # authGuard (CanActivate)
        │   ├── interceptors/
        │   │   └── auth-interceptor.ts       # authInterceptor (HttpInterceptorFn)
        │   └── service/
        │       ├── auth.service.ts           # login, logout, token, perfil atual
        │       ├── evento.service.ts         # CRUD de eventos + imagem
        │       ├── usuario.service.ts        # CRUD de usuários
        │       ├── arquivo.service.ts        # upload/listagem/download/delete de arquivos
        │       └── relatorio.service.ts      # (placeholder — arquivo vazio)
        │
        ├── features/             # telas agrupadas por domínio
        │   ├── home/                         # página pública inicial
        │   │   ├── home.ts / home.html / home.css
        │   ├── auth/
        │   │   └── pages/login/              # tela de login
        │   │       ├── login.ts / login.html / login.css
        │   ├── eventos/
        │   │   └── pages/eventos-detail/     # detalhe público de um evento
        │   │       └── eventos-detail.component.{ts,html,css}
        │   └── admin/                        # área administrativa (layout + sidenav)
        │       ├── admin.component.{ts,html,css}
        │       └── pages/
        │           ├── dashboard/            # visão geral
        │           ├── eventos-admin/        # lista de eventos (admin)
        │           ├── eventos-form/         # criar/editar evento
        │           ├── participantes/
        │           ├── relatorios/
        │           └── usuarios/
        │
        └── shared/               # reaproveitável entre features
            ├── components/
            │   └── menu/                     # <app-menu> (toolbar Material)
            │       └── menu.component.{ts,html,css}
            ├── models/
            │   ├── auth.model.ts             # Auth, Perfil, UsuarioResponse, UsuarioCreateDTO
            │   ├── evento.model.ts           # Evento, EventoCreateDTO, EventoUpdateDTO
            │   ├── usuario.model.ts          # Usuario
            │   └── arquivo.model.ts          # Arquivo
            └── pipes/
                └── date-format.pipe.ts       # (placeholder — arquivo vazio)
```

## Rotas (`src/app/app.routes.ts`)

| Path                          | Componente        | Observação                             |
|-------------------------------|-------------------|----------------------------------------|
| `''`                          | `Home`            | título `EcoEventos Palmas`             |
| `login`                       | `Login`           |                                        |
| `eventos/:id`                 | `Eventos` (detail)| detalhes públicos do evento            |
| `admin` (canActivate: authGuard) | `Admin`         | layout com sidenav, filhos abaixo      |
| `admin/dashboard`             | `Dashboard`       |                                        |
| `admin/eventos`               | `EventosAdmin`    | lista/gerenciamento                    |
| `admin/novo-evento`           | `EventoForm`      | formulário de criação                  |
| `admin/editar-evento/:id`     | `EventoForm`      | mesmo componente, modo edição          |
| `admin/participantes`         | `Participantes`   |                                        |
| `admin/relatorios`            | `Relatorios`      |                                        |
| `admin/usuarios`              | `UsuariosComponent` |                                      |
| `admin` (vazio)               | redirect          | → `admin/dashboard`                    |
| `**`                          | redirect          | → `''`                                 |

## Autenticação

### Fluxo

1. Usuário envia credenciais em `Login` → `AuthService.login({ username, senha })`.
2. `POST http://localhost:8080/auth` retorna o **JWT como texto puro** (`responseType: 'text'`).
3. O token é salvo em `localStorage` sob a chave `auth_token`.
4. Em seguida, `AuthService.fetchCurrentUser(token)` chama `GET /usuarios/perfil` e armazena o `UsuarioResponse` em `localStorage` (`current_user`) e em um `BehaviorSubject` `currentUserSubject` (exposto como `currentUser$`).
5. Login bem-sucedido redireciona para `/admin/dashboard`.

### `AuthService` (`core/service/auth.service.ts`)

Principais métodos:

- `login(credentials: Auth): Observable<string>`
- `fetchCurrentUser(token): Observable<UsuarioResponse>`
- `logout(): void` — limpa storage e navega para `/login`
- `getToken(): string | null`
- `isLoggedIn(): boolean`
- `isAdmin(): boolean` — compara `currentUser.perfil.nome === 'Adm'`
- `getCurrentUser(): UsuarioResponse | null`
- Observável público: `currentUser$`

### `authGuard` (`core/guards/auth-guard.ts`)

Classe `CanActivate` que:

- Redireciona para `/login` se não houver token.
- Se a URL contém `/admin` e o usuário **não** for `Adm`, redireciona para `/`.
- Caso contrário, permite acesso.

> Nota: implementado como classe com `canActivate()`, mas registrado em `app.routes.ts` como `canActivate: [authGuard]`. Mantenha o padrão atual ao adicionar novos guards.

### `authInterceptor` (`core/interceptors/auth-interceptor.ts`)

Função `HttpInterceptorFn` registrada em `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`. Ela:

- Lê o token de `AuthService.getToken()`.
- Se existir, clona a requisição adicionando `Authorization: Bearer <token>`.
- Em respostas `401`, chama `authService.logout()` e navega para `/login`.

## Serviços e Integração com API

Todos os serviços usam `HttpClient` e são `providedIn: 'root'`. A base é sempre `http://localhost:8080` hard-coded (sem `environment.ts`).

### `EventoService` (`core/service/evento.service.ts`)

Base: `http://localhost:8080/eventos`

| Método                                   | Endpoint                          |
|------------------------------------------|-----------------------------------|
| `listarEventos()`                        | `GET /eventos`                    |
| `buscarEventoPorId(id)`                  | `GET /eventos/{id}`               |
| `criarEvento(evento)`                    | `POST /eventos`                   |
| `atualizarEvento(id, evento)`            | `PUT /eventos/{id}`               |
| `deletarEvento(id)`                      | `DELETE /eventos/{id}`            |
| `uploadImagem(idEvento, file)`           | `POST /eventos/{id}/imagem` (multipart: `imagem`, `nomeArquivo`) |
| `removerImagem(idEvento)`                | `DELETE /eventos/{id}/imagem`     |
| `getImagemUrl(nomeArquivo)`              | helper: monta URL `/arquivos/{nome}` ou retorna placeholder |

### `UsuarioService` (`core/service/usuario.service.ts`)

Base: `http://localhost:8080/usuarios`

| Método                              | Endpoint                  |
|-------------------------------------|---------------------------|
| `criarUsuario(dto)`                 | `POST /usuarios`          |
| `listarUsuarios()`                  | `GET /usuarios`           |
| `buscarUsuarioPorId(id)`            | `GET /usuarios/{id}`      |
| `atualizarUsuario(id, dto)`         | `PUT /usuarios/{id}`      |
| `deletarUsuario(id)`                | `DELETE /usuarios/{id}`   |

### `ArquivoService` (`core/service/arquivo.service.ts`)

Bases: `http://localhost:8080/eventos` e `http://localhost:8080/arquivos`

| Método                            | Endpoint                                 |
|-----------------------------------|------------------------------------------|
| `upload(idEvento, file)`          | `POST /eventos/{id}/arquivos` (multipart: `arquivo`, `nomeArquivo`) |
| `listarPorEvento(idEvento)`       | `GET /eventos/{id}/arquivos`             |
| `baixar(nomeArquivo)`             | `GET /arquivos/{nome}` (`responseType: 'blob'`) |
| `deletar(nomeArquivo)`            | `DELETE /arquivos/{nome}`                |

### `AuthService`

- `POST /auth` (login)
- `GET /usuarios/perfil` (perfil atual)

### `RelatorioService` (`core/service/relatorio.service.ts`)

Arquivo presente mas vazio — criar aqui os métodos de relatórios quando necessários.

## Modelos (`src/app/shared/models/`)

- **`auth.model.ts`**: `Auth { username, senha? }`, `Perfil { id, nome }`, `UsuarioResponse { id, nome, username, email, perfil }`, `UsuarioCreateDTO { nome, email, username, senha, id_perfil }` (1 = Adm, 2 = User).
- **`evento.model.ts`**: `Evento` (com `id?`, `nome`, `descricao`, `dataHora`, `local`, `categoria?`, `organizador?`, `contato?`, `requisitos?`, `participantes?`, `arquivos?`, `imagemPrincipal?`, `linkInscricao?`), `EventoCreateDTO`, `EventoUpdateDTO`.
- **`usuario.model.ts`**: `Usuario` simples.
- **`arquivo.model.ts`**: `Arquivo { id, nomeOriginal, nomeSalvo, mimeType, dataUpload, evento? }`.

## Componentes e Páginas Principais

- **`App` (`app.ts`)** — raiz `<app-root>`, renderiza `<app-menu>` e `<router-outlet>`. Usa signals (`signal('Angular_Sistema_de_Eventos')`).
- **`Menu` (`shared/components/menu`)** — toolbar Material (`MatToolbar`, `MatButton`, `MatIcon`) com login/logout e navegação, lê `AuthService` publicamente.
- **`Home` (`features/home`)** — página pública. Carrega todos os eventos via `EventoService.listarEventos()`, separa `proximosEventos` e `eventosConcluidos` (6 mais próximos/recentes), formata data em pt-BR, usa `getImagemUrl` como fallback.
- **`Login` (`features/auth/pages/login`)** — formulário template-driven (`FormsModule`) com `username`, `senha`, `showPassword`, tratamento de erro 401 ("Usuário ou senha inválidos"). Redireciona para `/admin/dashboard` em sucesso.
- **`Eventos` (`features/eventos/pages/eventos-detail`)** — detalhe público de um evento.
- **`Admin` (`features/admin/admin.component.ts`)** — layout da área administrativa. Usa `MatSidenav`, assina `router.events` (`NavigationEnd`) para atualizar `currentTitle` conforme a URL (`dashboard`, `eventos`, `novo-evento`, `participantes`, `relatorios`).
- **Páginas admin** em `features/admin/pages/`:
  - `dashboard/` — visão geral.
  - `eventos-admin/` — listagem/gerenciamento de eventos.
  - `eventos-form/` — criação e edição (usado por `novo-evento` e `editar-evento/:id`).
  - `participantes/` — inscrições/participantes.
  - `relatorios/` — relatórios.
  - `usuarios/` — CRUD de usuários (componente exportado como `UsuariosComponent`).

## Convenções e Padrões

- **Standalone components em todo lugar**. Nenhum `NgModule` é usado — imports são declarados direto no decorador do componente.
- **Bootstrap standalone**: `main.ts` chama `bootstrapApplication(App, appConfig)`. Providers globais ficam em `src/app/app.config.ts`.
- **Prefix**: `app` (configurado em `angular.json`).
- **Nomes de arquivos mistos**: algumas pastas usam `nome.ts` (ex.: `home.ts`, `login.ts`, `app.ts`) e outras usam `nome.component.ts` (ex.: páginas admin, `menu.component.ts`). Ao criar arquivo novo, siga o padrão da pasta em que vai colocar.
- **Classes sem sufixo**: os componentes são exportados como `Home`, `Login`, `Admin`, `Menu`, etc., e não como `HomeComponent`. Exceções: `EventosAdmin`, `EventoForm`, `Dashboard`, `Participantes`, `Relatorios`, `UsuariosComponent` (há inconsistência — mantenha o nome existente ao editar).
- **HTTP**: sempre via serviços em `core/service/`, com `HttpClient`, retornando `Observable<T>`. Não há `environment.ts` — a URL `http://localhost:8080` está hard-coded em cada serviço.
- **Autenticação**: token JWT em `localStorage` (`auth_token`), usuário atual em `localStorage` (`current_user`) e num `BehaviorSubject`. O `authInterceptor` anexa o header `Authorization` automaticamente.
- **Guards de rota**: use `authGuard` para proteger rotas administrativas (ele também valida papel `Adm` para paths que contenham `/admin`).
- **Estilos**: CSS por componente (`styleUrl` ou `styleUrls`). Globalmente, Bootstrap + Material via `custom-theme.scss` e Bootstrap Icons.
- **Templates**: template-driven forms (`FormsModule`) em vez de Reactive Forms no login.
- **RxJS**: uso de `Subscription` + `unsubscribe()` em `ngOnDestroy` (ex.: `Home`).

## Como Adicionar Novos Recursos

### Nova página pública

1. Criar pasta em `src/app/features/<area>/pages/<nome>/`.
2. Criar `<nome>.component.ts` (ou `<nome>.ts`, conforme padrão da feature) como standalone: `@Component({ selector: 'app-<nome>', imports: [CommonModule, RouterModule, ...], templateUrl, styleUrl })`.
3. Registrar rota em `src/app/app.routes.ts`.

### Nova página administrativa

1. Criar em `src/app/features/admin/pages/<nome>/` seguindo o padrão `.component.ts/html/css`.
2. Adicionar rota filha em `app.routes.ts` dentro do nó `admin` (já protegido por `authGuard`).
3. Atualizar a lógica de `updateTitle()` em `admin.component.ts` se quiser título dinâmico no header do layout admin.
4. Adicionar link no `menu.component.html` ou no sidenav do `admin.component.html` conforme necessário.

### Novo serviço de API

1. Criar `src/app/core/service/<nome>.service.ts` com `@Injectable({ providedIn: 'root' })`.
2. Injetar `HttpClient` via construtor.
3. Definir `private apiUrl = 'http://localhost:8080/<recurso>'`.
4. Expor métodos retornando `Observable<T>`. Para upload usar `FormData` (ver `EventoService.uploadImagem`).
5. Definir modelos correspondentes em `src/app/shared/models/`.

### Novo guard ou interceptor

- Guards: `src/app/core/guards/<nome>-guard.ts`, registrar em `canActivate`/`canMatch` na rota.
- Interceptors: `src/app/core/interceptors/<nome>-interceptor.ts` como `HttpInterceptorFn`, adicionar ao array em `app.config.ts` → `provideHttpClient(withInterceptors([authInterceptor, novoInterceptor]))`.

### Novo modelo

Criar em `src/app/shared/models/<nome>.model.ts` exportando `interface`s. Importar onde necessário.

## Comandos Úteis

```bash
# instalar dependências
npm install

# servidor de desenvolvimento (http://localhost:4200)
npm start           # ou: ng serve

# build de produção
npm run build       # ou: ng build

# build incremental em modo desenvolvimento
npm run watch

# testes unitários (Karma + Jasmine)
npm test            # ou: ng test

# Angular CLI
ng generate component features/<area>/pages/<nome> --standalone
ng generate service core/service/<nome>
```

> Lembre-se: a API Quarkus deve estar rodando em `http://localhost:8080` para o frontend funcionar. Não existe `environment.ts` — se precisar trocar a URL, altere diretamente cada serviço em `src/app/core/service/`.
