// ===============================================
// Investimentos Model - Refatorado com BaseModel
// ===============================================

class InvestimentoManager extends BaseModel {
  constructor() {
    super("investimentos");
    this.totalAtual = 0;
    this.totalInvestido = 0;
    this.rentabilidade = 0;
  }

  /**
   * Configuração específica da entidade
   */
  getEntityConfig() {
    return {
      title: "Investimento",
      titlePlural: "Investimentos",
      displayField: "totalInvestimentosDisplay",
      tableId: "data-table",
      modalId: "standardized-modal-overlay",
      formFields: {
        nome: { type: "text", required: true, label: "Nome do Investimento" },
        tipo: { type: "select", required: true, label: "Tipo" },
        valor_inicial: {
          type: "number",
          required: true,
          label: "Valor Inicial (R$)",
          step: "0.01",
        },
        valor_atual: {
          type: "number",
          required: true,
          label: "Valor Atual (R$)",
          step: "0.01",
        },
        data_inicio: { type: "date", required: true, label: "Data de Início" },
        data_vencimento: {
          type: "date",
          required: false,
          label: "Data de Vencimento",
        },
        instituicao: { type: "text", required: false, label: "Instituição" },
        rentabilidade_ano: {
          type: "number",
          required: false,
          label: "Rentabilidade ao Ano (%)",
          step: "0.01",
        },
        observacoes: {
          type: "textarea",
          required: false,
          label: "Observações",
        },
      },
      validationRules: {
        nome: { min: 3, max: 100 },
        valor_inicial: { min: 0.01, max: 999999999 },
        valor_atual: { min: 0, max: 999999999 },
        rentabilidade_ano: { min: -100, max: 1000 },
        observacoes: { max: 500 },
      },
      defaultValues: {
        data_inicio: () => new Date().toISOString().split("T")[0],
        tipo: "CDB",
      },
      categories: [
        "CDB",
        "LCI/LCA",
        "Tesouro Direto",
        "Ações",
        "Fundos",
        "Poupança",
        "Debêntures",
        "Cripto",
        "Imóveis",
        "Outros",
      ],
    };
  }

  /**
   * Formatação específica para tabela
   */
  formatTableRow(investimento) {
    const valorInicial = parseFloat(investimento.valor_inicial) || 0;
    const valorAtual = parseFloat(investimento.valor_atual) || 0;
    const rentabilidade =
      valorInicial > 0 ? ((valorAtual - valorInicial) / valorInicial) * 100 : 0;

    return {
      id: investimento.id,
      nome: investimento.nome || "",
      tipo: investimento.tipo || "Não especificado",
      valor_inicial: this.formatCurrency(valorInicial),
      valor_atual: this.formatCurrency(valorAtual),
      rentabilidade: this.formatPercentage(rentabilidade),
      data_inicio: this.formatDate(investimento.data_inicio),
      data_vencimento: investimento.data_vencimento
        ? this.formatDate(investimento.data_vencimento)
        : "-",
      instituicao: investimento.instituicao || "-",
      status: this.getInvestmentStatus(investimento),
      actions: this.generateRowActions(investimento.id),
    };
  }

  /**
   * Determinar status do investimento
   */
  getInvestmentStatus(investimento) {
    const valorInicial = parseFloat(investimento.valor_inicial) || 0;
    const valorAtual = parseFloat(investimento.valor_atual) || 0;
    const dataVencimento = investimento.data_vencimento
      ? new Date(investimento.data_vencimento)
      : null;
    const hoje = new Date();

    // Verificar se venceu
    if (dataVencimento && dataVencimento <= hoje) {
      return '<span class="badge badge-warning">Vencido</span>';
    }

    // Verificar rentabilidade
    if (valorAtual > valorInicial) {
      return '<span class="badge badge-success">Positivo</span>';
    } else if (valorAtual < valorInicial) {
      return '<span class="badge badge-danger">Negativo</span>';
    } else {
      return '<span class="badge badge-secondary">Neutro</span>';
    }
  }

  /**
   * Formatar porcentagem
   */
  formatPercentage(value) {
    const color = value > 0 ? "text-success" : value < 0 ? "text-danger" : "";
    const icon = value > 0 ? "↗" : value < 0 ? "↘" : "→";
    return `<span class="${color}">${icon} ${value.toFixed(2)}%</span>`;
  }

  /**
   * Calcular totais específicos
   */
  calculateTotals(items) {
    const totals = {
      investido: 0,
      atual: 0,
      rentabilidade: 0,
      count: items.length,
    };

    items.forEach((item) => {
      totals.investido += parseFloat(item.valor_inicial) || 0;
      totals.atual += parseFloat(item.valor_atual) || 0;
    });

    totals.rentabilidade =
      totals.investido > 0
        ? ((totals.atual - totals.investido) / totals.investido) * 100
        : 0;

    this.totalInvestido = totals.investido;
    this.totalAtual = totals.atual;
    this.rentabilidade = totals.rentabilidade;

    return totals;
  }

  /**
   * Validação customizada
   */
  validateData(data) {
    const errors = super.validateData(data);

    // Validar valores
    const valorInicial = parseFloat(data.valor_inicial);
    const valorAtual = parseFloat(data.valor_atual);

    if (valorInicial && valorInicial <= 0) {
      errors.valor_inicial = "O valor inicial deve ser maior que zero";
    }

    if (valorAtual && valorAtual < 0) {
      errors.valor_atual = "O valor atual não pode ser negativo";
    }

    // Validar datas
    if (data.data_inicio && data.data_vencimento) {
      const inicio = new Date(data.data_inicio);
      const vencimento = new Date(data.data_vencimento);

      if (vencimento <= inicio) {
        errors.data_vencimento =
          "A data de vencimento deve ser posterior à data de início";
      }
    }

    // Validar rentabilidade
    if (
      data.rentabilidade_ano &&
      (data.rentabilidade_ano < -100 || data.rentabilidade_ano > 1000)
    ) {
      errors.rentabilidade_ano = "Rentabilidade deve estar entre -100% e 1000%";
    }

    return errors;
  }

  /**
   * Processamento antes de salvar
   */
  preprocessData(data) {
    const processed = super.preprocessData(data);

    // Capitalize nome
    if (processed.nome) {
      processed.nome =
        processed.nome.charAt(0).toUpperCase() + processed.nome.slice(1);
    }

    // Garantir valores numéricos
    ["valor_inicial", "valor_atual", "rentabilidade_ano"].forEach((field) => {
      if (processed[field]) {
        processed[field] = parseFloat(processed[field]);
      }
    });

    return processed;
  }

  /**
   * Processamento após carregar dados
   */
  postProcessData(items) {
    const processed = super.postProcessData(items);

    // Calcular totais
    const totals = this.calculateTotals(processed);
    this.updateTotalDisplay(totals);

    // Atualizar insights
    this.updateInsights(processed, totals);

    return processed;
  }

  /**
   * Atualizar display dos totais
   */
  updateTotalDisplay(totals) {
    // Total atual
    const elementAtual = document.getElementById("totalInvestimentosDisplay");
    if (elementAtual) {
      elementAtual.textContent = this.formatCurrency(totals.atual);
    }

    // Total investido
    const elementInvestido = document.getElementById("totalInvestidoDisplay");
    if (elementInvestido) {
      elementInvestido.textContent = this.formatCurrency(totals.investido);
    }

    // Rentabilidade
    const elementRentabilidade = document.getElementById(
      "rentabilidadeDisplay"
    );
    if (elementRentabilidade) {
      const color =
        totals.rentabilidade > 0
          ? "text-success"
          : totals.rentabilidade < 0
          ? "text-danger"
          : "";
      elementRentabilidade.innerHTML = `<span class="${color}">${totals.rentabilidade.toFixed(
        2
      )}%</span>`;
    }

    // Animação de atualização
    [elementAtual, elementInvestido, elementRentabilidade].forEach((el) => {
      if (el) {
        el.classList.add("updating");
        setTimeout(() => el.classList.remove("updating"), 300);
      }
    });
  }

  /**
   * Gerar insights automáticos
   */
  updateInsights(investimentos, totals) {
    if (!investimentos || investimentos.length === 0) return;

    const insights = {
      totals,
      count: investimentos.length,
      byType: this.getTypeBreakdown(investimentos),
      byInstitution: this.getInstitutionBreakdown(investimentos),
      performance: this.getPerformanceAnalysis(investimentos),
      recommendations: this.getRecommendations(investimentos, totals),
    };

    // Emitir evento
    window.dispatchEvent(
      new CustomEvent("investimentosUpdated", {
        detail: { investimentos, insights },
      })
    );

    console.log("📊 Insights de investimentos atualizados:", insights);
  }

  /**
   * Análise por tipo
   */
  getTypeBreakdown(investimentos) {
    const breakdown = {};

    investimentos.forEach((inv) => {
      const tipo = inv.tipo || "Não especificado";
      if (!breakdown[tipo]) {
        breakdown[tipo] = {
          investido: 0,
          atual: 0,
          count: 0,
          rentabilidade: 0,
        };
      }

      const valorInicial = parseFloat(inv.valor_inicial) || 0;
      const valorAtual = parseFloat(inv.valor_atual) || 0;

      breakdown[tipo].investido += valorInicial;
      breakdown[tipo].atual += valorAtual;
      breakdown[tipo].count++;
    });

    // Calcular rentabilidade por tipo
    Object.keys(breakdown).forEach((tipo) => {
      const data = breakdown[tipo];
      data.rentabilidade =
        data.investido > 0
          ? ((data.atual - data.investido) / data.investido) * 100
          : 0;
      data.percentage =
        this.totalAtual > 0 ? (data.atual / this.totalAtual) * 100 : 0;
    });

    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b.atual - a.atual)
      .map(([tipo, data]) => ({ tipo, ...data }));
  }

  /**
   * Análise por instituição
   */
  getInstitutionBreakdown(investimentos) {
    const breakdown = {};

    investimentos.forEach((inv) => {
      const instituicao = inv.instituicao || "Não informado";
      if (!breakdown[instituicao]) {
        breakdown[instituicao] = { atual: 0, count: 0 };
      }
      breakdown[instituicao].atual += parseFloat(inv.valor_atual) || 0;
      breakdown[instituicao].count++;
    });

    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b.atual - a.atual)
      .map(([instituicao, data]) => ({
        instituicao,
        ...data,
        percentage:
          this.totalAtual > 0 ? (data.atual / this.totalAtual) * 100 : 0,
      }));
  }

  /**
   * Análise de performance
   */
  getPerformanceAnalysis(investimentos) {
    const vencendoProximamente = investimentos.filter((inv) => {
      if (!inv.data_vencimento) return false;
      const vencimento = new Date(inv.data_vencimento);
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);
      return vencimento <= em30Dias && vencimento > new Date();
    });

    const melhorPerformance = investimentos
      .map((inv) => {
        const inicial = parseFloat(inv.valor_inicial) || 0;
        const atual = parseFloat(inv.valor_atual) || 0;
        const rentabilidade =
          inicial > 0 ? ((atual - inicial) / inicial) * 100 : 0;
        return { ...inv, rentabilidade_calculada: rentabilidade };
      })
      .sort((a, b) => b.rentabilidade_calculada - a.rentabilidade_calculada)
      .slice(0, 3);

    const piorPerformance = investimentos
      .map((inv) => {
        const inicial = parseFloat(inv.valor_inicial) || 0;
        const atual = parseFloat(inv.valor_atual) || 0;
        const rentabilidade =
          inicial > 0 ? ((atual - inicial) / inicial) * 100 : 0;
        return { ...inv, rentabilidade_calculada: rentabilidade };
      })
      .sort((a, b) => a.rentabilidade_calculada - b.rentabilidade_calculada)
      .slice(0, 3);

    return {
      vencendoProximamente,
      melhorPerformance,
      piorPerformance,
      diversificacao: this.getDiversificationScore(investimentos),
    };
  }

  /**
   * Score de diversificação
   */
  getDiversificationScore(investimentos) {
    const tipos = new Set(investimentos.map((inv) => inv.tipo));
    const instituicoes = new Set(
      investimentos.map((inv) => inv.instituicao).filter(Boolean)
    );

    // Score baseado na quantidade de tipos e instituições diferentes
    const tipoScore = Math.min(tipos.size / 5, 1); // Max 5 tipos diferentes
    const instituicaoScore = Math.min(instituicoes.size / 3, 1); // Max 3 instituições diferentes

    return {
      score: (((tipoScore + instituicaoScore) / 2) * 100).toFixed(0),
      tipos: tipos.size,
      instituicoes: instituicoes.size,
      nivel: this.getDiversificationLevel((tipoScore + instituicaoScore) / 2),
    };
  }

  /**
   * Nível de diversificação
   */
  getDiversificationLevel(score) {
    if (score >= 0.8) return "Excelente";
    if (score >= 0.6) return "Boa";
    if (score >= 0.4) return "Moderada";
    if (score >= 0.2) return "Baixa";
    return "Muito baixa";
  }

  /**
   * Recomendações automáticas
   */
  getRecommendations(investimentos, totals) {
    const recommendations = [];

    // Recomendação de diversificação
    if (totals.count < 3) {
      recommendations.push({
        type: "diversification",
        priority: "high",
        message:
          "Considere diversificar com mais tipos de investimento para reduzir riscos.",
      });
    }

    // Recomendação para investimentos com performance negativa
    const negativos = investimentos.filter((inv) => {
      const inicial = parseFloat(inv.valor_inicial) || 0;
      const atual = parseFloat(inv.valor_atual) || 0;
      return atual < inicial;
    });

    if (negativos.length > 0) {
      recommendations.push({
        type: "performance",
        priority: "medium",
        message: `${negativos.length} investimento(s) com performance negativa. Avalie se é momento de realizar ou aguardar.`,
      });
    }

    // Recomendação de vencimentos
    const vencendoEm30Dias = investimentos.filter((inv) => {
      if (!inv.data_vencimento) return false;
      const vencimento = new Date(inv.data_vencimento);
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);
      return vencimento <= em30Dias && vencimento > new Date();
    });

    if (vencendoEm30Dias.length > 0) {
      recommendations.push({
        type: "maturity",
        priority: "high",
        message: `${vencendoEm30Dias.length} investimento(s) vencendo em 30 dias. Planeje o reinvestimento.`,
      });
    }

    return recommendations;
  }

  /**
   * Simular crescimento futuro
   */
  simulateGrowth(investimentos, meses = 12) {
    return investimentos.map((inv) => {
      const valorAtual = parseFloat(inv.valor_atual) || 0;
      const rentabilidadeAno = parseFloat(inv.rentabilidade_ano) || 0;
      const rentabilidadeMes = rentabilidadeAno / 100 / 12;

      let projecao = valorAtual;
      for (let i = 0; i < meses; i++) {
        projecao *= 1 + rentabilidadeMes;
      }

      return {
        ...inv,
        projecao_valor: projecao,
        projecao_ganho: projecao - valorAtual,
        projecao_percentual:
          valorAtual > 0 ? ((projecao - valorAtual) / valorAtual) * 100 : 0,
      };
    });
  }
}

// ===============================================
// Funções de compatibilidade (legacy)
// ===============================================

// Instância global
window.investimentoManager = new InvestimentoManager();

// Aliases para compatibilidade
window.totalInvestimento = 0;
window.loadInvestimentosFromSupabase = () =>
  window.investimentoManager.loadData();
window.saveInvestimento = (data) => window.investimentoManager.save(data);
window.updateInvestimento = (id, data) =>
  window.investimentoManager.update(id, data);
window.deleteInvestimento = (id) => window.investimentoManager.delete(id);

// Modal helpers (compatibilidade)
const Modal = {
  open() {
    document
      .querySelector(".standardized-modal-overlay")
      ?.classList.add("active");
  },
  close() {
    document
      .querySelector(".standardized-modal-overlay")
      ?.classList.remove("active");
  },
};

// Eventos para compatibilidade
window.addEventListener("investimentosUpdated", (event) => {
  const { investimentos, insights } = event.detail;
  window.totalInvestimento = insights.totals.atual;
});

// Exportar para uso global
window.Modal = Modal;
window.InvestimentoManager = InvestimentoManager;

console.log("📈 InvestimentoManager: Modelo refatorado carregado");

// Auto-inicialização
document.addEventListener("DOMContentLoaded", () => {
  if (window.entityManager) {
    window.entityManager.registerEntity(
      "investimentos",
      window.investimentoManager
    );
  }
});
