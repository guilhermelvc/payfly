// ================ Entity Manager - Gerenciador centralizado de entidades ================
/**
 * Gerencia todas as entidades do sistema de forma unificada
 * Elimina a necessidade de múltiplos arquivos de model separados
 */

class EntityManager {
  constructor() {
    this.entities = new Map();
    this.activeEntity = null;
    this.initialized = false;

    console.log("🏗️ EntityManager inicializado");
  }

  /**
   * Registra uma nova entidade no sistema
   */
  registerEntity(name, config) {
    const entity = new BaseModel({
      tableName: config.table,
      entityName: name,
      displayField: config.displayField,
      ...config,
    });

    this.entities.set(name, entity);
    console.log(`📋 Entidade registrada: ${name}`);

    return entity;
  }

  /**
   * Obtém entidade por nome
   */
  getEntity(name) {
    return this.entities.get(name);
  }

  /**
   * Define entidade ativa (para UI atual)
   */
  setActiveEntity(name) {
    const entity = this.entities.get(name);
    if (entity) {
      this.activeEntity = entity;
      console.log(`🎯 Entidade ativa: ${name}`);
      return entity;
    }
    throw new Error(`Entidade não encontrada: ${name}`);
  }

  /**
   * Inicializa todas as entidades padrão do sistema
   */
  initializeDefaultEntities() {
    if (this.initialized) {
      console.log("⚠️ EntityManager já inicializado");
      return;
    }

    // ================ DESPESAS ================
    this.registerEntity("despesas", {
      table: "despesas",
      displayField: "totalDespesaDisplay",
      fields: {
        descricao: { type: "text", label: "Descrição" },
        valor: { type: "number", label: "Valor" },
        data: { type: "date", label: "Data" },
        categoria: { type: "text", label: "Categoria" },
      },
      validationRules: {
        descricao: { required: true, label: "Descrição" },
        valor: { required: true, type: "number", min: 0.01, label: "Valor" },
        data: { required: true, label: "Data" },
      },
      tableColumns: ["Descrição", "Valor", "Data", "Categoria", "Ações"],
    });

    // ================ RECEITAS ================
    this.registerEntity("receitas", {
      table: "receitas",
      displayField: "totalReceitaDisplay",
      fields: {
        descricao: { type: "text", label: "Descrição" },
        valor: { type: "number", label: "Valor" },
        data: { type: "date", label: "Data" },
        categoria: { type: "text", label: "Categoria" },
      },
      validationRules: {
        descricao: { required: true, label: "Descrição" },
        valor: { required: true, type: "number", min: 0.01, label: "Valor" },
        data: { required: true, label: "Data" },
      },
      tableColumns: ["Descrição", "Valor", "Data", "Categoria", "Ações"],
    });

    // ================ INVESTIMENTOS ================
    this.registerEntity("investimentos", {
      table: "investimentos",
      displayField: "totalInvestimentosDisplay",
      valueField: "valor_investido",
      fields: {
        descricao: { type: "text", label: "Nome" },
        valor_investido: { type: "number", label: "Valor Investido" },
        valor_atual: { type: "number", label: "Valor Atual" },
        data: { type: "date", label: "Data" },
        tipo: { type: "text", label: "Tipo" },
      },
      validationRules: {
        descricao: { required: true, label: "Nome do investimento" },
        valor_investido: {
          required: true,
          type: "number",
          min: 0.01,
          label: "Valor investido",
        },
        data: { required: true, label: "Data" },
        tipo: { required: true, label: "Tipo" },
      },
      tableColumns: [
        "Nome",
        "Valor Investido",
        "Valor Atual",
        "Rentabilidade",
        "Data",
        "Tipo",
        "Ações",
      ],
    });

    // ================ PLANOS ================
    this.registerEntity("planos", {
      table: "planos",
      displayField: "totalPlanoDisplay",
      fields: {
        descricao: { type: "text", label: "Descrição" },
        valor: { type: "number", label: "Meta" },
        data_limite: { type: "date", label: "Data Limite" },
        categoria: { type: "text", label: "Categoria" },
      },
      validationRules: {
        descricao: { required: true, label: "Descrição" },
        valor: { required: true, type: "number", min: 0.01, label: "Meta" },
        data_limite: { required: true, label: "Data limite" },
      },
      tableColumns: [
        "Descrição",
        "Meta",
        "Progresso",
        "Data Limite",
        "Status",
        "Ações",
      ],
    });

    // ================ POUPANÇA ================
    this.registerEntity("poupanca", {
      table: "poupanca",
      displayField: "totalPoupancaDisplay",
      fields: {
        descricao: { type: "text", label: "Descrição" },
        valor: { type: "number", label: "Valor" },
        data: { type: "date", label: "Data" },
        tipo: { type: "select", label: "Tipo", options: ["depósito", "saque"] },
        plano_vinculado_nome: { type: "text", label: "Plano Vinculado" },
      },
      validationRules: {
        descricao: { required: true, label: "Descrição" },
        valor: { required: true, type: "number", min: 0.01, label: "Valor" },
        data: { required: true, label: "Data" },
        tipo: { required: true, label: "Tipo" },
      },
      tableColumns: ["Descrição", "Valor", "Tipo", "Data", "Plano", "Ações"],
    });

    this.initialized = true;
    console.log("✅ Todas as entidades padrão foram registradas");
  }

  /**
   * Carrega dados para entidade específica
   */
  async loadEntityData(entityName, filters = null) {
    const entity = this.getEntity(entityName);
    if (!entity) {
      throw new Error(`Entidade não encontrada: ${entityName}`);
    }

    await entity.loadFromSupabase(filters);
  }

  /**
   * Carrega dados para todas as entidades (usado no dashboard)
   */
  async loadAllData() {
    console.log("📊 Carregando dados de todas as entidades...");

    const promises = Array.from(this.entities.keys()).map(
      async (entityName) => {
        try {
          await this.loadEntityData(entityName);
          console.log(`✅ ${entityName} carregado`);
        } catch (error) {
          console.error(`❌ Erro carregando ${entityName}:`, error);
        }
      }
    );

    await Promise.all(promises);
    console.log("🎉 Todos os dados carregados");
  }

  /**
   * Obtém resumo financeiro de todas as entidades
   */
  getFinancialSummary() {
    const summary = {
      totalReceitas: 0,
      totalDespesas: 0,
      totalInvestimentos: 0,
      totalPoupanca: 0,
      totalPlanos: 0,
      saldoLiquido: 0,
    };

    const receitas = this.getEntity("receitas");
    const despesas = this.getEntity("despesas");
    const investimentos = this.getEntity("investimentos");
    const poupanca = this.getEntity("poupanca");
    const planos = this.getEntity("planos");

    if (receitas) summary.totalReceitas = receitas.total;
    if (despesas) summary.totalDespesas = despesas.total;
    if (investimentos) summary.totalInvestimentos = investimentos.total;
    if (poupanca) summary.totalPoupanca = poupanca.total;
    if (planos) summary.totalPlanos = planos.total;

    summary.saldoLiquido = summary.totalReceitas - summary.totalDespesas;

    return summary;
  }

  /**
   * Aplica filtro em entidade específica
   */
  async applyFilter(entityName, criteria) {
    const entity = this.getEntity(entityName);
    if (entity) {
      await entity.activateFilter(criteria);
    }
  }

  /**
   * Remove filtro de entidade específica
   */
  async clearFilter(entityName) {
    const entity = this.getEntity(entityName);
    if (entity) {
      await entity.clearFilter();
    }
  }

  /**
   * Remove filtros de todas as entidades
   */
  async clearAllFilters() {
    const promises = Array.from(this.entities.values()).map((entity) =>
      entity.clearFilter()
    );
    await Promise.all(promises);
    console.log("🔄 Todos os filtros removidos");
  }

  /**
   * Obtém estatísticas do sistema
   */
  getSystemStats() {
    const stats = {
      totalEntities: this.entities.size,
      activeFilters: 0,
      totalRecords: 0,
      entities: {},
    };

    this.entities.forEach((entity, name) => {
      stats.entities[name] = {
        recordCount: entity.data.length,
        total: entity.total,
        hasActiveFilter: entity.isFilterActive,
      };

      if (entity.isFilterActive) stats.activeFilters++;
      stats.totalRecords += entity.data.length;
    });

    return stats;
  }
}

// ================ Instância Global ================
window.entityManager = new EntityManager();

// Auto-inicializar quando Supabase estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  // Aguarda Supabase estar disponível
  const checkSupabase = () => {
    if (window.supabase) {
      window.entityManager.initializeDefaultEntities();
      console.log("🚀 EntityManager pronto para uso");
    } else {
      setTimeout(checkSupabase, 100);
    }
  };
  checkSupabase();
});

console.log("✅ EntityManager carregado e disponível globalmente");
