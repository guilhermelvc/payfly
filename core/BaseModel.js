// ================ Base Model - Elimina redundância entre todos os models ================
/**
 * Classe base que unifica todas as operações CRUD comuns aos models
 * Elimina ~80% da duplicação de código entre receita.js, despesa.js, investimentos.js, etc.
 */

class BaseModel {
  constructor(config) {
    this.tableName = config.tableName;
    this.entityName = config.entityName;
    this.displayField = config.displayField || "totalDisplay";
    this.dateField = config.dateField || "data";
    this.valueField = config.valueField || "valor";
    this.descriptionField = config.descriptionField || "descricao";

    // Estado interno
    this.total = 0;
    this.editingId = null;
    this.isFilterActive = false;
    this.currentFilterCriteria = null;
    this.data = [];

    // Configurações específicas da entidade
    this.fields = config.fields || {};
    this.validationRules = config.validationRules || {};
    this.tableColumns = config.tableColumns || [];

    console.log(`🏗️ BaseModel inicializado para ${this.entityName}`);
  }

  // ================ Operações CRUD Unificadas ================

  /**
   * Carrega dados do Supabase com filtros opcionais
   */
  async loadFromSupabase(filters = null) {
    try {
      if (this.isFilterActive && !filters) {
        console.log(
          `⏸️ ${this.entityName}: Carregamento bloqueado - filtro ativo`
        );
        return;
      }

      if (!window.supabase) throw new Error("Supabase não inicializado");

      const { data: userData } = await window.supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      let query = window.supabase
        .from(this.tableName)
        .select("*")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      // Aplicar filtros se fornecidos
      if (filters) {
        query = this.applyFilters(query, filters);
      }

      const { data, error } = await query;
      if (error) throw error;

      this.clearTable();
      this.data = data || [];
      this.total = 0;

      this.data.forEach((item) => {
        this.addToTable(item, item.id);
        this.total += Number(item[this.valueField] || 0);
      });

      this.updateDisplay();
      console.log(
        `✅ ${this.entityName}: ${this.data.length} registros carregados`
      );
    } catch (err) {
      console.error(`❌ Erro carregando ${this.entityName}:`, err);
      if (typeof showErrorToast === "function") {
        showErrorToast(
          "Erro",
          `Não foi possível carregar ${this.entityName.toLowerCase()}`
        );
      }
    }
  }

  /**
   * Remove item do Supabase
   */
  async removeFromSupabase(itemId, itemValue) {
    try {
      if (!window.supabase) throw new Error("Supabase não inicializado");

      const { error } = await window.supabase
        .from(this.tableName)
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      // Remove da tabela
      const row = document.getElementById(`row-${itemId}`);
      if (row) {
        row.remove();
        this.total -= Number(itemValue);
        this.updateDisplay();
      }

      // Recarrega respeitando filtros
      await this.reloadDataRespectingFilter();

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Sucesso", `${this.entityName} removido com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro removendo ${this.entityName}:`, err);
      if (typeof showErrorToast === "function") {
        showErrorToast(
          "Erro",
          `Não foi possível remover ${this.entityName.toLowerCase()}`
        );
      }
    }
  }

  /**
   * Atualiza item no Supabase
   */
  async updateInSupabase(itemId, updatedData) {
    try {
      if (!window.supabase) throw new Error("Supabase não inicializado");

      const { error } = await window.supabase
        .from(this.tableName)
        .update(updatedData)
        .eq("id", itemId);

      if (error) throw error;

      await this.reloadDataRespectingFilter();

      if (typeof showSuccessToast === "function") {
        showSuccessToast(
          "Sucesso",
          `${this.entityName} atualizado com sucesso`
        );
      }
    } catch (err) {
      console.error(`❌ Erro atualizando ${this.entityName}:`, err);
      if (typeof showErrorToast === "function") {
        showErrorToast(
          "Erro",
          `Não foi possível atualizar ${this.entityName.toLowerCase()}`
        );
      }
    }
  }

  /**
   * Salva novo item no Supabase
   */
  async saveToSupabase(itemData) {
    try {
      if (!window.supabase) throw new Error("Supabase não inicializado");

      const { data: userData } = await window.supabase.auth.getUser();
      const user = userData?.user;
      if (!user) throw new Error("Usuário não autenticado");

      // Adiciona ID do usuário
      itemData.usuario_id = user.id;

      const { data, error } = await window.supabase
        .from(this.tableName)
        .insert([itemData])
        .select();

      if (error) throw error;

      await this.reloadDataRespectingFilter();

      if (typeof showSuccessToast === "function") {
        showSuccessToast(
          "Sucesso",
          `${this.entityName} adicionado com sucesso`
        );
      }

      return data[0];
    } catch (err) {
      console.error(`❌ Erro salvando ${this.entityName}:`, err);
      if (typeof showErrorToast === "function") {
        showErrorToast(
          "Erro",
          `Não foi possível salvar ${this.entityName.toLowerCase()}`
        );
      }
      throw err;
    }
  }

  // ================ Sistema de Filtros Unificado ================

  /**
   * Aplica filtros à query
   */
  applyFilters(query, filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;

      if (key === this.descriptionField && typeof value === "string") {
        query = query.ilike(key, `%${value}%`);
      } else if (key === this.valueField && !isNaN(parseFloat(value))) {
        query = query.eq(key, parseFloat(value));
      } else if (typeof value === "string" && value.includes("%")) {
        query = query.ilike(key, value);
      } else {
        query = query.eq(key, value);
      }
    });

    return query;
  }

  /**
   * Ativa filtro e armazena critérios
   */
  async activateFilter(criteria) {
    try {
      const { data: userData } = await window.supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      this.currentFilterCriteria = { ...criteria, userId: user.id };
      this.isFilterActive = true;

      await this.loadFromSupabase(criteria);

      console.log(
        `🔍 ${this.entityName}: Filtro ativado com`,
        Object.keys(criteria).length,
        "critérios"
      );
    } catch (error) {
      console.error(`❌ Erro no filtro ${this.entityName}:`, error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível aplicar o filtro");
      }
    }
  }

  /**
   * Remove filtro e recarrega todos os dados
   */
  async clearFilter() {
    this.isFilterActive = false;
    this.currentFilterCriteria = null;
    await this.loadFromSupabase();
    console.log(`🔄 ${this.entityName}: Filtro removido`);
  }

  /**
   * Recarrega dados respeitando filtros ativos
   */
  async reloadDataRespectingFilter() {
    if (this.isFilterActive && this.currentFilterCriteria) {
      console.log(
        `🔄 ${this.entityName}: Reaplicando filtro após operação CRUD`
      );
      await this.loadFromSupabase(this.currentFilterCriteria);
    } else {
      await this.loadFromSupabase();
    }
  }

  // ================ Manipulação de Tabela ================

  /**
   * Limpa tabela completamente
   */
  clearTable() {
    const table = document.getElementById("data-table");
    if (!table) return;

    const tbody = table.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
      console.log(`🧹 ${this.entityName}: Tbody limpo`);
    } else {
      // Preserva thead, remove o resto
      const thead = table.querySelector("thead");
      const allRows = table.querySelectorAll("tr");
      allRows.forEach((row, index) => {
        if (index > 0) row.remove();
      });
      console.log(`🧹 ${this.entityName}: Tabela limpa (preservando thead)`);
    }
  }

  /**
   * Adiciona item à tabela (deve ser implementado por subclasses)
   */
  addToTable(item, itemId) {
    console.warn(
      `⚠️ ${this.entityName}: addToTable deve ser implementado pela subclasse`
    );
  }

  // ================ Helpers Comuns ================

  /**
   * Formata data para padrão brasileiro
   */
  formatDate(date) {
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("pt-BR");
    } catch (e) {
      console.warn(`❌ Erro formatando data: ${date}`);
      return date;
    }
  }

  /**
   * Formata valor monetário
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  }

  /**
   * Atualiza display do total
   */
  updateDisplay() {
    const el = document.getElementById(this.displayField);
    if (el) {
      el.textContent = this.formatCurrency(this.total);
    }
  }

  /**
   * Abre modal de edição
   */
  openEditModal(itemId, itemData) {
    this.editingId = itemId;
    // Implementação específica por subclasse
    console.log(
      `📝 ${this.entityName}: Abrindo modal de edição para ID ${itemId}`
    );
  }

  /**
   * Fecha modal de edição
   */
  closeEditModal() {
    this.editingId = null;
    // Implementação específica por subclasse
    console.log(`❌ ${this.entityName}: Fechando modal de edição`);
  }

  // ================ Validação ================

  /**
   * Valida dados antes de salvar
   */
  validateData(data) {
    const errors = [];

    Object.entries(this.validationRules).forEach(([field, rules]) => {
      const value = data[field];

      if (rules.required && (!value || value.toString().trim() === "")) {
        errors.push(`${rules.label || field} é obrigatório`);
      }

      if (rules.type === "number" && value && isNaN(parseFloat(value))) {
        errors.push(`${rules.label || field} deve ser um número válido`);
      }

      if (rules.min && parseFloat(value) < rules.min) {
        errors.push(`${rules.label || field} deve ser maior que ${rules.min}`);
      }
    });

    return errors;
  }
}

// ================ Export ================
window.BaseModel = BaseModel;
console.log("✅ BaseModel carregado e disponível globalmente");
