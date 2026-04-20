import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Subscription } from 'rxjs';
import { Evento } from '../../../../shared/models/evento.model';
import { EventoService } from '../../../../core/service/evento.service';


declare const html2canvas: any;
declare const jspdf: any;

interface RelatorioData {
  titulo: string;
  dataRelatorio: string;
  periodo: string;
  objetivo: string;
  atividadesRealizadas: string;
  resultadosAlcancados: string;
  dificuldadesEncontradas: string;
  proximasAcoes: string;
  observacoes: string;
  totalEventos: number;
  totalParticipantes: number;
  taxaSucesso: number;
}

@Component({
  selector: 'app-relatorios',
  imports: [CommonModule, FormsModule],
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css',
})
export class Relatorios implements OnInit, OnDestroy{
 @ViewChild('previewRelatorio') previewRelatorio!: ElementRef;
  
  eventos: Evento[] = [];
  loading = true;
  
  // Dados do relatório
  relatorioData: RelatorioData = {
    titulo: '',
    dataRelatorio: new Date().toISOString().split('T')[0],
    periodo: '',
    objetivo: '',
    atividadesRealizadas: '',
    resultadosAlcancados: '',
    dificuldadesEncontradas: '',
    proximasAcoes: '',
    observacoes: '',
    totalEventos: 0,
    totalParticipantes: 0,
    taxaSucesso: 85
  };

  // Estatísticas
  totalEventos = 0;
  totalParticipantes = 0;
  eventosAtivos = 0;
  eventosFuturos = 0;
  taxaComparecimento = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(private eventoService: EventoService) {}

  ngOnInit(): void {
    this.carregarEventos();
    this.relatorioData.dataRelatorio = new Date().toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  carregarEventos(): void {
    this.loading = true;
    this.subscriptions.add(
      this.eventoService.listarEventos().subscribe({
        next: (eventos) => {
          this.eventos = eventos;
          this.calcularEstatisticas(eventos);
          this.loading = false;
        },
        error: (error) => {
          console.error('Erro ao carregar eventos:', error);
          this.loading = false;
        }
      })
    );
  }

  calcularEstatisticas(eventos: Evento[]): void {
    const agora = new Date();
    this.totalEventos = eventos.length;
    this.totalParticipantes = eventos.reduce((sum, e) => sum + (e.participantes || 0), 0);
    this.eventosAtivos = eventos.filter(e => new Date(e.dataHora) >= agora).length;
    this.eventosFuturos = eventos.filter(e => new Date(e.dataHora) >= agora).length;
    this.taxaComparecimento = eventos.length > 0 
      ? Math.round((eventos.filter(e => (e.participantes || 0) > 10).length / eventos.length) * 100)
      : 0;
    
    // Atualizar campos do relatório
    this.relatorioData.totalEventos = this.totalEventos;
    this.relatorioData.totalParticipantes = this.totalParticipantes;
  }

  atualizarPreview(): void {
    // O preview é atualizado automaticamente via two-way binding
  }

async gerarRelatorioPersonalizado(): Promise<void> {
  if (!this.relatorioData.titulo) {
    alert('Por favor, preencha o título do relatório.');
    return;
  }

  // Mostra loading
  const loading = document.createElement('div');
  loading.innerHTML = '<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border-radius:10px;z-index:9999;">Gerando PDF com imagens...</div>';
  document.body.appendChild(loading);

  try {
    // Cria um container invisível para renderizar o relatório com imagens
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.innerHTML = await this.montarRelatorioHTMLComImagens();
    document.body.appendChild(container);

    // Aguarda imagens carregarem
    const imagens = container.querySelectorAll('img');
    await Promise.all(Array.from(imagens).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
    }));

    // Usa html2canvas para capturar com imagens
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${this.relatorioData.titulo}.pdf`);
    document.body.removeChild(container);
    document.body.removeChild(loading);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF com imagens. Gerando versão simples...');
    this.gerarRelatorioSimples();
    document.body.removeChild(loading);
  }
}

private gerarRelatorioSimples(): void {
  const conteudo = this.montarRelatorioHTML();
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(conteudo);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

private async montarRelatorioHTMLComImagens(): Promise<string> {
  // Busca imagens dos eventos
  const imagensPromises = this.eventos.slice(0, 5).map(async evento => {
    let imgUrl = '';
    if (evento.imagemPrincipal) {
      imgUrl = this.eventoService.getImagemUrl(evento.imagemPrincipal);
    }
    return { id: evento.id, nome: evento.nome, imgUrl };
  });
  
  const imagens = await Promise.all(imagensPromises);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${this.relatorioData.titulo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Roboto', sans-serif;
          padding: 40px;
          background: white;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #2E8B57;
        }
        .header h1 { color: #2E8B57; font-size: 28px; margin-bottom: 10px; }
        .section { margin-bottom: 30px; }
        .section-title {
          color: #2E8B57;
          font-size: 20px;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e0e0e0;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
        }
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #2E8B57;
        }
        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .image-card {
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
          text-align: center;
        }
        .image-card img {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }
        .image-card p {
          padding: 10px;
          font-size: 12px;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 12px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌿 ${this.relatorioData.titulo}</h1>
        <p>Data: ${new Date(this.relatorioData.dataRelatorio).toLocaleDateString('pt-BR')}</p>
      </div>

      <div class="section">
        <h2 class="section-title">📊 Estatísticas Gerais</h2>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">${this.relatorioData.totalEventos}</div><div>Eventos</div></div>
          <div class="stat-card"><div class="stat-number">${this.relatorioData.totalParticipantes}</div><div>Participantes</div></div>
          <div class="stat-card"><div class="stat-number">${this.eventosAtivos}</div><div>Eventos Ativos</div></div>
          <div class="stat-card"><div class="stat-number">${this.relatorioData.taxaSucesso}%</div><div>Sucesso</div></div>
        </div>
      </div>

      ${imagens.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📸 Imagens dos Eventos</h2>
        <div class="images-grid">
          ${imagens.map(img => `
            <div class="image-card">
              <img src="${img.imgUrl}" alt="${img.nome}" crossorigin="anonymous">
              <p>${img.nome}</p>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      ${this.relatorioData.objetivo ? `<div class="section"><h2 class="section-title">🎯 Objetivo</h2><p>${this.relatorioData.objetivo}</p></div>` : ''}
      ${this.relatorioData.atividadesRealizadas ? `<div class="section"><h2 class="section-title">📋 Atividades</h2><p>${this.relatorioData.atividadesRealizadas}</p></div>` : ''}
      ${this.relatorioData.resultadosAlcancados ? `<div class="section"><h2 class="section-title">🏆 Resultados</h2><p>${this.relatorioData.resultadosAlcancados}</p></div>` : ''}

      <div class="footer">
        <p>Relatório gerado por EcoEventos Palmas</p>
      </div>
    </body>
    </html>
  `;
}

  montarRelatorioHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${this.relatorioData.titulo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Roboto', sans-serif;
            padding: 40px;
            background: white;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2E8B57;
          }
          .header h1 {
            color: #2E8B57;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header .subtitle {
            color: #6c757d;
            font-size: 14px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            color: #2E8B57;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
          }
          .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #2E8B57;
          }
          .stat-label {
            color: #6c757d;
            font-size: 14px;
            margin-top: 5px;
          }
          .content-text {
            margin-bottom: 15px;
            line-height: 1.6;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #6c757d;
          }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌿 ${this.relatorioData.titulo}</h1>
          <p class="subtitle">EcoEventos Palmas - Relatório Gerencial</p>
          <p class="subtitle">Data de emissão: ${new Date(this.relatorioData.dataRelatorio).toLocaleDateString('pt-BR')}</p>
          ${this.relatorioData.periodo ? `<p class="subtitle">Período: ${this.relatorioData.periodo}</p>` : ''}
        </div>

        <div class="section">
          <h2 class="section-title">📊 Resumo Executivo</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${this.relatorioData.totalEventos}</div>
              <div class="stat-label">Total de Eventos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${this.relatorioData.totalParticipantes}</div>
              <div class="stat-label">Participantes</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${this.eventosAtivos}</div>
              <div class="stat-label">Eventos Ativos</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${this.relatorioData.taxaSucesso}%</div>
              <div class="stat-label">Taxa de Sucesso</div>
            </div>
          </div>
        </div>

        ${this.relatorioData.objetivo ? `
        <div class="section">
          <h2 class="section-title">🎯 Objetivo/Resumo Executivo</h2>
          <p class="content-text">${this.relatorioData.objetivo.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${this.relatorioData.atividadesRealizadas ? `
        <div class="section">
          <h2 class="section-title">📋 Atividades Realizadas</h2>
          <p class="content-text">${this.relatorioData.atividadesRealizadas.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${this.relatorioData.resultadosAlcancados ? `
        <div class="section">
          <h2 class="section-title">🏆 Resultados Alcançados</h2>
          <p class="content-text">${this.relatorioData.resultadosAlcancados.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${this.relatorioData.dificuldadesEncontradas ? `
        <div class="section">
          <h2 class="section-title">⚠️ Dificuldades Encontradas</h2>
          <p class="content-text">${this.relatorioData.dificuldadesEncontradas.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${this.relatorioData.proximasAcoes ? `
        <div class="section">
          <h2 class="section-title">🚀 Próximas Ações/Recomendações</h2>
          <p class="content-text">${this.relatorioData.proximasAcoes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        ${this.relatorioData.observacoes ? `
        <div class="section">
          <h2 class="section-title">📝 Observações Finais</h2>
          <p class="content-text">${this.relatorioData.observacoes.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <div class="footer">
          <p>Relatório gerado por EcoEventos Palmas - Sistema de Gestão de Eventos Ambientais</p>
        </div>
      </body>
      </html>
    `;
  }

  private imprimirRelatorio(conteudo: string, titulo: string): void {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(conteudo);
      win.document.close();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  }

  exportarDadosCompletos(): void {
    const dados = {
      eventos: this.eventos,
      estatisticas: {
        totalEventos: this.totalEventos,
        totalParticipantes: this.totalParticipantes,
        eventosAtivos: this.eventosAtivos,
        eventosFuturos: this.eventosFuturos,
        taxaComparecimento: this.taxaComparecimento
      },
      dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_ecoeventos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Dados exportados com sucesso!');
  }

  gerarRelatorioMensal(): void {
    const dataAtual = new Date();
    const mesAtual = dataAtual.toLocaleString('pt-BR', { month: 'long' });
    const anoAtual = dataAtual.getFullYear();
    
    this.relatorioData.titulo = `Relatório Mensal - ${mesAtual} ${anoAtual}`;
    this.relatorioData.periodo = `${mesAtual} ${anoAtual}`;
    this.gerarRelatorioPersonalizado();
  }

  formatarData(data: string | Date): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  getStatusTexto(evento: Evento): string {
    return new Date(evento.dataHora) < new Date() ? 'Realizado' : 'Em breve';
  }

  getStatusClass(evento: Evento): string {
    return new Date(evento.dataHora) < new Date() ? 'status-inativo' : 'status-ativo';
  }

  getImagemUrl(imagemPrincipal: string | undefined): string {
    return this.eventoService.getImagemUrl(imagemPrincipal);
  }

  carregarModeloRelatorio(): void {
    this.relatorioData = {
      titulo: 'Relatório de Atividades - EcoEventos',
      dataRelatorio: new Date().toISOString().split('T')[0],
      periodo: `${new Date().toLocaleString('pt-BR', { month: 'long' })} ${new Date().getFullYear()}`,
      objetivo: 'Este relatório tem como objetivo apresentar as atividades realizadas, resultados alcançados e impactos gerados pelos eventos promovidos pela EcoEventos Palmas no período.',
      atividadesRealizadas: '• Organização de mutirões de limpeza em áreas verdes\n• Palestras educativas sobre sustentabilidade\n• Workshops de reciclagem e reaproveitamento\n• Plantio de árvores em áreas degradadas',
      resultadosAlcancados: '• Mais de 500 pessoas impactadas diretamente\n• 200 árvores plantadas\n• 2 toneladas de resíduos coletados\n• Parcerias com 10 instituições locais',
      dificuldadesEncontradas: '• Baixa adesão em algumas regiões\n• Limitação de recursos financeiros\n• Condições climáticas adversas em alguns eventos',
      proximasAcoes: '• Expandir parcerias com escolas\n• Buscar novas fontes de financiamento\n• Criar programa de voluntariado permanente',
      observacoes: 'Os resultados demonstram o compromisso da EcoEventos com a sustentabilidade e educação ambiental.',
      totalEventos: this.totalEventos,
      totalParticipantes: this.totalParticipantes,
      taxaSucesso: 85
    };
  }
}
