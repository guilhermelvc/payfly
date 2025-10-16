// ===============================================
// Receita Model - Refatorado com BaseModel
// ===============================================

class ReceitaManager extends BaseModel {
  constructor() {
    super("receitas");
    this.totalGlobal = 0;
  }

  /**
   * Configuração específica da entidade
   */
  getEntityConfig() {
    return {
      title: "Receita",
      titlePlural: "Receitas",
      displayField: "totalReceitaDisplay",
      tableId: "data-table",
      modalId: "standardized-modal-overlay",
      formFields: {
        descricao: { type: "text", required: true, label: "Descrição" },
        valor: {
          type: "number",
          required: true,
          label: "Valor (R$)",
          step: "0.01",
        },
        data: { type: "date", required: true, label: "Data" },
        categoria: { type: "text", required: true, label: "Categoria" },
      },
      validationRules: {
        descricao: { min: 3, max: 100 },
        valor: { min: 0.01, max: 999999999 },
        categoria: { min: 2, max: 50 },
      },
      defaultValues: {
        data: () => new Date().toISOString().split("T")[0],
      },
      categories: [
        "Salário",
        "Freelance",
        "Investimentos",
        "Aluguel",
        "Vendas",
        "Prêmios",
        "Outros",
      ],
    };
  }

  /**
   * Formatação específica para tabela
   */
  formatTableRow(receita) {
    const config = this.getEntityConfig();
    return {
      id: receita.id,
      descricao: receita.descricao || "",
      valor: this.formatCurrency(receita.valor),
      data: this.formatDate(receita.data),
      categoria: receita.categoria || "Sem categoria",
      actions: this.generateRowActions(receita.id),
    };
  }

  /**
   * Calcular total específico
   */
  calculateTotal(items) {
    const total = items.reduce((sum, item) => {
      return sum + (parseFloat(item.valor) || 0);
    }, 0);

    this.totalGlobal = total;
    return total;
  }

  /**
   * Validação customizada
   */
  validateData(data) {
    const errors = super.validateData(data);
    const config = this.getEntityConfig();

    // Validação específica de receita
    if (data.valor && parseFloat(data.valor) <= 0) {
      errors.valor = "O valor da receita deve ser maior que zero";
    }

    // Validação de data futura (aviso)
    if (data.data) {
      const inputDate = new Date(data.data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        // Não é erro, apenas aviso
        if (!errors._warnings) errors._warnings = [];
        errors._warnings.push(
          "Data futura detectada - verifique se está correto"
        );
      }
    }

    return errors;
  }

  /**
   * Processamento antes de salvar
   */
  preprocessData(data) {
    const processed = super.preprocessData(data);

    // Capitalize primeira letra da descrição
    if (processed.descricao) {
      processed.descricao =
        processed.descricao.charAt(0).toUpperCase() +
        processed.descricao.slice(1).toLowerCase();
    }

    // Formatar categoria
    if (processed.categoria) {
      processed.categoria =
        processed.categoria.charAt(0).toUpperCase() +
        processed.categoria.slice(1).toLowerCase();
    }

    return processed;
  }

  /**
   * Processamento após carregar dados
   */
  postProcessData(items) {
    const processed = super.postProcessData(items);

    // Atualizar total global
    this.calculateTotal(processed);
    this.updateTotalDisplay();

    // Atualizar insights automáticos
    this.updateInsights(processed);

    return processed;
  }

  /**
   * Atualizar display do total
   */
  updateTotalDisplay() {
    const element = document.getElementById("totalReceitaDisplay");
    if (element) {
      element.textContent = this.formatCurrency(this.totalGlobal);

      // Animação de atualização
      element.classList.add("updating");
      setTimeout(() => {
        element.classList.remove("updating");
      }, 300);
    }
  }

  /**
   * Gerar insights automáticos
   */
  updateInsights(receitas) {
    if (!receitas || receitas.length === 0) return;

    const insights = {
      total: this.totalGlobal,
      count: receitas.length,
      average: this.totalGlobal / receitas.length,
      categories: this.getCategoryBreakdown(receitas),
      trends: this.getTrends(receitas),
    };

    // Emitir evento para outros componentes
    window.dispatchEvent(
      new CustomEvent("receitasUpdated", {
        detail: { receitas, insights },
      })
    );

    console.log("📊 Insights de receitas atualizados:", insights);
  }

  /**
   * Análise por categoria
   */
  getCategoryBreakdown(receitas) {
    const breakdown = {};

    receitas.forEach((receita) => {
      const categoria = receita.categoria || "Sem categoria";
      if (!breakdown[categoria]) {
        breakdown[categoria] = { total: 0, count: 0 };
      }
      breakdown[categoria].total += parseFloat(receita.valor) || 0;
      breakdown[categoria].count++;
    });

    // Ordenar por valor total
    return Object.entries(breakdown)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([categoria, data]) => ({
        categoria,
        total: data.total,
        count: data.count,
        percentage: ((data.total / this.totalGlobal) * 100).toFixed(1),
      }));
  }

  /**
   * Análise de tendências
   */
  getTrends(receitas) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthReceitas = receitas.filter((receita) => {
      const date = new Date(receita.data);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const lastMonthReceitas = receitas.filter((receita) => {
      const date = new Date(receita.data);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return (
        date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      );
    });

    const currentTotal = this.calculateTotal(currentMonthReceitas);
    const lastTotal = this.calculateTotal(lastMonthReceitas);

    const growth =
      lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    return {
      currentMonth: {
        total: currentTotal,
        count: currentMonthReceitas.length,
      },
      lastMonth: {
        total: lastTotal,
        count: lastMonthReceitas.length,
      },
      growth: {
        percentage: growth.toFixed(1),
        direction: growth > 0 ? "up" : growth < 0 ? "down" : "stable",
      },
    };
  }

  /**
   * Exportar receitas para análise
   */
  async exportData(format = "json") {
    try {
      const data = await this.loadFromSupabase();

      if (format === "csv") {
        return this.exportToCSV(data);
      } else if (format === "xlsx") {
        return this.exportToExcel(data);
      }

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("❌ Erro ao exportar receitas:", error);
      throw error;
    }
  }

  /**
   * Importar receitas de arquivo
   */
  async importData(fileData, format = "json") {
    try {
      let receitas;

      if (format === "csv") {
        receitas = this.parseCSV(fileData);
      } else if (format === "json") {
        receitas = JSON.parse(fileData);
      } else {
        throw new Error("Formato não suportado");
      }

      // Validar dados importados
      const validReceitas = [];
      const errors = [];

      for (let i = 0; i < receitas.length; i++) {
        const receita = receitas[i];
        const validation = this.validateData(receita);

        if (
          Object.keys(validation).length === 0 ||
          (Object.keys(validation).length === 1 && validation._warnings)
        ) {
          validReceitas.push(this.preprocessData(receita));
        } else {
          errors.push({ row: i + 1, errors: validation });
        }
      }

      // Salvar receitas válidas
      for (const receita of validReceitas) {
        await this.saveToSupabase(receita);
      }

      return {
        imported: validReceitas.length,
        errors: errors.length,
        errorDetails: errors,
      };
    } catch (error) {
      console.error("❌ Erro ao importar receitas:", error);
      throw error;
    }
  }

  /**
   * Obter estatísticas detalhadas
   */
  getStatistics(receitas) {
    if (!receitas || receitas.length === 0) {
      return {
        total: 0,
        count: 0,
        average: 0,
        median: 0,
        highest: 0,
        lowest: 0,
      };
    }

    const values = receitas
      .map((r) => parseFloat(r.valor) || 0)
      .sort((a, b) => a - b);
    const total = values.reduce((sum, val) => sum + val, 0);

    return {
      total,
      count: receitas.length,
      average: total / receitas.length,
      median: values[Math.floor(values.length / 2)],
      highest: Math.max(...values),
      lowest: Math.min(...values),
    };
  }
}

// ===============================================
// Funções de compatibilidade (legacy)
// ===============================================

// Instância global
window.receitaManager = new ReceitaManager();

// Aliases para compatibilidade
window.totalReceitaGlobal = 0;
window.loadReceitasFromSupabase = () => window.receitaManager.loadData();
window.saveReceita = (data) => window.receitaManager.save(data);
window.updateReceita = (id, data) => window.receitaManager.update(id, data);
window.deleteReceita = (id) => window.receitaManager.delete(id);
window.searchReceitas = (criteria) => window.receitaManager.search(criteria);

// Eventos para compatibilidade
window.addEventListener("receitasUpdated", (event) => {
  const { receitas, insights } = event.detail;
  window.totalReceitaGlobal = insights.total;

  // Atualizar elementos legados
  const element = document.getElementById("totalReceitaDisplay");
  if (element) {
    element.textContent = window.receitaManager.formatCurrency(insights.total);
  }
});

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

// Exportar para uso global
window.Modal = Modal;
window.ReceitaManager = ReceitaManager;

console.log("💰 ReceitaManager: Modelo refatorado carregado");

// Auto-inicialização
document.addEventListener("DOMContentLoaded", () => {
  if (window.entityManager) {
    window.entityManager.registerEntity("receitas", window.receitaManager);
  }
});
