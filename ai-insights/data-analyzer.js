// ===============================================
// Analisador de Dados Financeiros - PayFly
// ===============================================

class FinancialDataAnalyzer {
  constructor() {
    this.cache = {
      data: null,
      timestamp: null,
      ttl: 5 * 60 * 1000, // 5 minutos
    };
  }

  /**
   * Obter análise completa dos dados financeiros
   * @param {boolean} useCache - Se deve usar cache
   * @returns {Promise<object>} - Dados analisados
   */
  async getFinancialAnalysis(useCache = true) {
    try {
      // Verificar cache
      if (useCache && this.isCacheValid()) {
        console.log("📊 FinancialAnalyzer: Usando dados do cache");
        return this.cache.data;
      }

      console.log("📊 FinancialAnalyzer: Coletando dados do Supabase...");

      if (!window.supabase) {
        console.error("❌ Supabase não encontrado");
        throw new Error("Sistema de dados não inicializado");
      }

      const { data: userData, error: userError } =
        await window.supabase.auth.getUser();

      if (userError) {
        console.error("❌ Erro ao buscar usuário:", userError);
        throw new Error("Erro de autenticação");
      }

      const user = userData?.user;

      if (!user) {
        console.error("❌ Usuário não autenticado");
        throw new Error("Usuário não autenticado");
      }

      console.log("👤 FinancialAnalyzer: Usuário autenticado:", user.id);

      // Buscar todos os dados em paralelo
      const [receitas, despesas, planos] = await Promise.all([
        this.getReceitas(user.id),
        this.getDespesas(user.id),
        this.getPlanos(user.id),
      ]);

      console.log("📈 FinancialAnalyzer: Dados coletados:", {
        receitas: receitas.length,
        despesas: despesas.length,
        planos: planos.length,
      });

      // Processar dados
      const analysis = {
        userId: user.id,
        totalReceitas: this.calculateTotal(receitas),
        totalDespesas: this.calculateTotal(despesas),
        receitas: receitas,
        despesas: despesas,
        planos: planos,
        categoriasDespesas: this.groupByCategory(despesas),
        categoriasReceitas: this.groupByCategory(receitas),
        tendencias: this.calculateTrends(receitas, despesas),
        insights: this.generateBasicInsights(receitas, despesas, planos),
        periodo: this.getAnalysisPeriod(),
        timestamp: new Date(),
      };

      // Atualizar cache
      this.updateCache(analysis);

      console.log("✅ FinancialAnalyzer: Análise completa:", {
        totalReceitas: analysis.totalReceitas,
        totalDespesas: analysis.totalDespesas,
        qtdReceitas: analysis.receitas.length,
        qtdDespesas: analysis.despesas.length,
        qtdPlanos: analysis.planos.length,
      });
      return analysis;
    } catch (error) {
      console.error("❌ FinancialAnalyzer: Erro detalhado na análise:");
      console.error("   - Tipo:", error.name);
      console.error("   - Mensagem:", error.message);
      console.error("   - Stack:", error.stack);

      // Retornar erro mais específico
      if (
        error.message.includes("autenticação") ||
        error.message.includes("Usuário")
      ) {
        throw new Error("Erro de autenticação. Faça login novamente.");
      } else if (
        error.message.includes("Supabase") ||
        error.message.includes("dados")
      ) {
        throw new Error("Erro ao acessar dados. Tente novamente.");
      } else {
        throw new Error("Erro ao analisar dados financeiros: " + error.message);
      }
    }
  }

  /**
   * Buscar receitas do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<array>} - Lista de receitas
   */
  async getReceitas(userId) {
    try {
      const { data, error } = await window.supabase
        .from("receitas")
        .select("*")
        .eq("usuario_id", userId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("⚠️ Erro ao buscar receitas:", error);
      return [];
    }
  }

  /**
   * Buscar despesas do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<array>} - Lista de despesas
   */
  async getDespesas(userId) {
    try {
      const { data, error } = await window.supabase
        .from("despesas")
        .select("*")
        .eq("usuario_id", userId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("⚠️ Erro ao buscar despesas:", error);
      return [];
    }
  }

  /**
   * Buscar planos do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<array>} - Lista de planos
   */
  async getPlanos(userId) {
    try {
      const { data, error } = await window.supabase
        .from("planos")
        .select("*")
        .eq("usuario_id", userId)
        .order("data", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn("⚠️ Erro ao buscar planos:", error);
      return [];
    }
  }

  /**
   * Calcular total de uma lista de itens
   * @param {array} items - Lista de itens com valor
   * @returns {number} - Total calculado
   */
  calculateTotal(items) {
    if (!items || !Array.isArray(items)) return 0;

    return items.reduce((total, item) => {
      const valor = parseFloat(item.valor) || 0;
      return total + valor;
    }, 0);
  }

  /**
   * Agrupar itens por categoria
   * @param {array} items - Lista de itens
   * @returns {object} - Objeto com categorias e totais
   */
  groupByCategory(items) {
    if (!items || !Array.isArray(items)) return {};

    const categories = {};

    items.forEach((item) => {
      const categoria = item.categoria || "Sem Categoria";
      const valor = parseFloat(item.valor) || 0;

      if (!categories[categoria]) {
        categories[categoria] = 0;
      }
      categories[categoria] += valor;
    });

    return categories;
  }

  /**
   * Calcular tendências dos últimos meses
   * @param {array} receitas - Lista de receitas
   * @param {array} despesas - Lista de despesas
   * @returns {object} - Tendências calculadas
   */
  calculateTrends(receitas, despesas) {
    const agora = new Date();
    const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const twoMesesAtras = new Date(
      agora.getFullYear(),
      agora.getMonth() - 2,
      1
    );

    // Filtrar dados por período
    const receitasMesAtual = this.filterByPeriod(receitas, mesPassado, agora);
    const receitasMesAnterior = this.filterByPeriod(
      receitas,
      twoMesesAtras,
      mesPassado
    );

    const despesasMesAtual = this.filterByPeriod(despesas, mesPassado, agora);
    const despesasMesAnterior = this.filterByPeriod(
      despesas,
      twoMesesAtras,
      mesPassado
    );

    // Calcular variações
    const receitasAtual = this.calculateTotal(receitasMesAtual);
    const receitasAnterior = this.calculateTotal(receitasMesAnterior);
    const receitasVariacao =
      receitasAnterior > 0
        ? ((receitasAtual - receitasAnterior) / receitasAnterior) * 100
        : 0;

    const despesasAtual = this.calculateTotal(despesasMesAtual);
    const despesasAnterior = this.calculateTotal(despesasMesAnterior);
    const despesasVariacao =
      despesasAnterior > 0
        ? ((despesasAtual - despesasAnterior) / despesasAnterior) * 100
        : 0;

    return {
      receitasVariacao,
      despesasVariacao,
      receitasMesAtual: receitasAtual,
      receitasMesAnterior: receitasAnterior,
      despesasMesAtual: despesasAtual,
      despesasMesAnterior: despesasAnterior,
      saldoAtual: receitasAtual - despesasAtual,
      saldoAnterior: receitasAnterior - despesasAnterior,
    };
  }

  /**
   * Filtrar itens por período de datas
   * @param {array} items - Lista de itens
   * @param {Date} inicio - Data de início
   * @param {Date} fim - Data de fim
   * @returns {array} - Itens filtrados
   */
  filterByPeriod(items, inicio, fim) {
    if (!items || !Array.isArray(items)) return [];

    return items.filter((item) => {
      if (!item.data) return false;
      const itemDate = new Date(item.data);
      return itemDate >= inicio && itemDate < fim;
    });
  }

  /**
   * Gerar insights básicos
   * @param {array} receitas - Lista de receitas
   * @param {array} despesas - Lista de despesas
   * @param {array} planos - Lista de planos
   * @returns {object} - Insights básicos
   */
  generateBasicInsights(receitas, despesas, planos) {
    const totalReceitas = this.calculateTotal(receitas);
    const totalDespesas = this.calculateTotal(despesas);
    const saldo = totalReceitas - totalDespesas;

    const categoriasDespesas = this.groupByCategory(despesas);
    const maiorGasto = Object.entries(categoriasDespesas).sort(
      ([, a], [, b]) => b - a
    )[0];

    const planosAtivos = planos.filter((plano) => {
      const progresso = (plano.valor_atual / plano.valor_objetivo) * 100;
      return progresso < 100;
    });

    return {
      saldoPositivo: saldo > 0,
      saldoValor: saldo,
      maiorCategoriaGasto: maiorGasto ? maiorGasto[0] : null,
      maiorCategoriaValor: maiorGasto ? maiorGasto[1] : 0,
      quantidadePlanos: planos.length,
      planosAtivos: planosAtivos.length,
      mediaReceita: receitas.length > 0 ? totalReceitas / receitas.length : 0,
      mediaDespesa: despesas.length > 0 ? totalDespesas / despesas.length : 0,
    };
  }

  /**
   * Obter período de análise
   * @returns {object} - Período analisado
   */
  getAnalysisPeriod() {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    return {
      inicio: inicioMes,
      fim: agora,
      mes: agora.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  }

  /**
   * Verificar se o cache é válido
   * @returns {boolean} - Se o cache é válido
   */
  isCacheValid() {
    if (!this.cache.data || !this.cache.timestamp) return false;

    const now = Date.now();
    const cacheAge = now - this.cache.timestamp;

    return cacheAge < this.cache.ttl;
  }

  /**
   * Atualizar cache
   * @param {object} data - Dados para cache
   */
  updateCache(data) {
    this.cache.data = data;
    this.cache.timestamp = Date.now();
  }

  /**
   * Limpar cache
   */
  clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }

  /**
   * Obter dados resumidos para o prompt da IA
   * @returns {Promise<object>} - Dados resumidos
   */
  async getDataForAI() {
    try {
      const analysis = await this.getFinancialAnalysis();

      return {
        totalReceitas: analysis.totalReceitas,
        totalDespesas: analysis.totalDespesas,
        categoriasDespesas: analysis.categoriasDespesas,
        categoriasReceitas: analysis.categoriasReceitas,
        planos: analysis.planos.map((plano) => ({
          descricao: plano.descricao,
          valor_objetivo: plano.valor_objetivo,
          valor_atual: plano.valor_atual,
          categoria: plano.categoria,
        })),
        tendencias: analysis.tendencias,
        insights: analysis.insights,
        periodo: analysis.periodo,
      };
    } catch (error) {
      console.error("❌ Erro ao obter dados para IA:", error);
      return {};
    }
  }
}

// Instância global do analisador
window.FinancialAnalyzer = new FinancialDataAnalyzer();

console.log("📊 Financial Data Analyzer initialized successfully");
