# ============================================================
# STAGE 1 — Build (Node 20 + Angular CLI)
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copia manifesto de dependências primeiro (cache de camada)
COPY package*.json ./
RUN npm ci

# Copia o restante do código e compila para produção
COPY . .
RUN npm run build

# ============================================================
# STAGE 2 — Serve (nginx leve)
# O Angular gera arquivos estáticos; nginx os serve.
# ============================================================
FROM nginx:alpine

# Remove config padrão e adiciona a nossa (suporte a HTML5 routing)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do Angular
# Angular 17+ com @angular/build:application gera em dist/{project}/browser/
COPY --from=build /app/dist/Angular_Sistema_de_Eventos/browser /usr/share/nginx/html

EXPOSE 80
