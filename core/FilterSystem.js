// ================ Filter System - Sistema de filtros unificado ================
/**
 * Sistema centralizado de filtros que funciona com qualquer entidade
 * Elimina a duplicação de lógica de filtros em todos os models
 */

class FilterSystem {
  constructor() {
    this.activeFilters = new Map();
    this.filterHistory = [];
    this.maxHistorySize = 10;

    console.log("🔍 FilterSystem inicializado");
  }

  /**
   * Cria filtro dinâmico baseado nos campos da entidade
   */
  createFilterUI(entityName, containerId) {
    const entity = window.entityManager.getEntity(entityName);
    if (!entity) {
      console.error(`❌ Entidade não encontrada: ${entityName}`);
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container não encontrado: ${containerId}`);
      return;
    }

    // Limpa container
    container.innerHTML = "";

    // Cria formulário de filtro
    const filterForm = document.createElement("div");
    filterForm.className = "filter-form";
    filterForm.innerHTML = `
      <div class="filter-header">
        <h3>🔍 Filtrar ${entity.entityName}</h3>
        <div class="filter-actions">
          <button type="button" class="btn-apply-filter" onclick="filterSystem.applyFilter('${entityName}')">
            Aplicar Filtro
          </button>
          <button type="button" class="btn-clear-filter" onclick="filterSystem.clearFilter('${entityName}')">
            Limpar Filtro
          </button>
        </div>
      </div>
      <div class="filter-fields" id="filter-fields-${entityName}">
        ${this.generateFilterFields(entity)}
      </div>
      <div class="filter-status" id="filter-status-${entityName}">
        <span class="status-text">Filtro inativo</span>
      </div>
    `;

    container.appendChild(filterForm);
    this.attachEventListeners(entityName);

    console.log(`🎛️ UI de filtro criada para ${entityName}`);
  }

  /**
   * Gera campos de filtro baseados na configuração da entidade
   */
  generateFilterFields(entity) {
    let fieldsHTML = "";

    Object.entries(entity.fields).forEach(([fieldName, config]) => {
      const inputId = `filter-${entity.entityName}-${fieldName}`;

      fieldsHTML += `
        <div class="filter-field">
          <label for="${inputId}">${config.label}:</label>
          ${this.generateFilterInput(inputId, fieldName, config)}
        </div>
      `;
    });

    return fieldsHTML;
  }

  /**
   * Gera input apropriado baseado no tipo de campo
   */
  generateFilterInput(inputId, fieldName, config) {
    switch (config.type) {
      case "date":
        return `<input type="date" id="${inputId}" class="filter-input">`;

      case "number":
        return `<input type="number" id="${inputId}" class="filter-input" placeholder="Valor exato..." step="0.01" min="0">`;

      case "select":
        const options = config.options || [];
        const optionsHTML = options
          .map((opt) => `<option value="${opt}">${opt}</option>`)
          .join("");
        return `
          <select id="${inputId}" class="filter-input">
            <option value="">Todos</option>
            ${optionsHTML}
          </select>
        `;

      case "text":
      default:
        return `<input type="text" id="${inputId}" class="filter-input" placeholder="Digite para buscar...">`;
    }
  }

  /**
   * Anexa event listeners aos filtros
   */
  attachEventListeners(entityName) {
    const filterInputs = document.querySelectorAll(
      `#filter-fields-${entityName} .filter-input`
    );

    filterInputs.forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.applyFilter(entityName);
        }
      });
    });
  }

  /**
   * Aplica filtro à entidade
   */
  async applyFilter(entityName) {
    try {
      const entity = window.entityManager.getEntity(entityName);
      if (!entity) throw new Error(`Entidade não encontrada: ${entityName}`);

      const criteria = this.collectFilterCriteria(entityName);

      // Verifica se há critérios válidos
      const hasValidCriteria = Object.values(criteria).some(
        (value) => value !== null && value !== undefined && value !== ""
      );

      if (!hasValidCriteria) {
        if (typeof showWarningToast === "function") {
          showWarningToast(
            "Aviso",
            "Preencha pelo menos um campo para filtrar"
          );
        }
        return;
      }

      // Aplica filtro
      await entity.activateFilter(criteria);

      // Atualiza status
      this.updateFilterStatus(entityName, true, criteria);

      // Adiciona ao histórico
      this.addToHistory(entityName, criteria);

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Filtro", "Filtro aplicado com sucesso");
      }
    } catch (error) {
      console.error(`❌ Erro aplicando filtro:`, error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível aplicar o filtro");
      }
    }
  }

  /**
   * Coleta critérios dos campos de filtro
   */
  collectFilterCriteria(entityName) {
    const entity = window.entityManager.getEntity(entityName);
    const criteria = {};

    Object.keys(entity.fields).forEach((fieldName) => {
      const inputId = `filter-${entityName}-${fieldName}`;
      const input = document.getElementById(inputId);

      if (input && input.value.trim()) {
        criteria[fieldName] = input.value.trim();
      }
    });

    return criteria;
  }

  /**
   * Remove filtro da entidade
   */
  async clearFilter(entityName) {
    try {
      const entity = window.entityManager.getEntity(entityName);
      if (!entity) throw new Error(`Entidade não encontrada: ${entityName}`);

      await entity.clearFilter();

      // Limpa campos do formulário
      this.clearFilterForm(entityName);

      // Atualiza status
      this.updateFilterStatus(entityName, false);

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Filtro", "Filtro removido");
      }
    } catch (error) {
      console.error(`❌ Erro removendo filtro:`, error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível remover o filtro");
      }
    }
  }

  /**
   * Limpa formulário de filtro
   */
  clearFilterForm(entityName) {
    const filterInputs = document.querySelectorAll(
      `#filter-fields-${entityName} .filter-input`
    );
    filterInputs.forEach((input) => {
      if (input.type === "checkbox") {
        input.checked = false;
      } else {
        input.value = "";
      }
    });
  }

  /**
   * Atualiza status visual do filtro
   */
  updateFilterStatus(entityName, isActive, criteria = null) {
    const statusElement = document.getElementById(
      `filter-status-${entityName}`
    );
    if (!statusElement) return;

    const statusText = statusElement.querySelector(".status-text");
    if (!statusText) return;

    if (isActive && criteria) {
      const criteriaCount = Object.keys(criteria).length;
      statusText.textContent = `✅ Filtro ativo (${criteriaCount} critério${
        criteriaCount > 1 ? "s" : ""
      })`;
      statusElement.className = "filter-status active";
    } else {
      statusText.textContent = "⚪ Filtro inativo";
      statusElement.className = "filter-status inactive";
    }
  }

  /**
   * Adiciona filtro ao histórico
   */
  addToHistory(entityName, criteria) {
    const historyEntry = {
      entityName,
      criteria,
      timestamp: new Date(),
      criteriaText: this.formatCriteriaText(criteria),
    };

    this.filterHistory.unshift(historyEntry);

    // Limita tamanho do histórico
    if (this.filterHistory.length > this.maxHistorySize) {
      this.filterHistory = this.filterHistory.slice(0, this.maxHistorySize);
    }

    console.log(
      `📝 Filtro adicionado ao histórico: ${entityName} - ${historyEntry.criteriaText}`
    );
  }

  /**
   * Formata critérios para exibição
   */
  formatCriteriaText(criteria) {
    return Object.entries(criteria)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  /**
   * Obtém histórico de filtros
   */
  getFilterHistory() {
    return this.filterHistory.map((entry) => ({
      ...entry,
      timestamp: entry.timestamp.toLocaleString("pt-BR"),
    }));
  }

  /**
   * Reaplicar filtro do histórico
   */
  async reapplyFromHistory(historyIndex) {
    if (historyIndex < 0 || historyIndex >= this.filterHistory.length) {
      console.error("❌ Índice de histórico inválido");
      return;
    }

    const entry = this.filterHistory[historyIndex];
    await this.applyFilter(entry.entityName, entry.criteria);

    console.log(`🔄 Filtro reaplicado do histórico: ${entry.criteriaText}`);
  }

  /**
   * Remove todos os filtros ativos
   */
  async clearAllFilters() {
    try {
      await window.entityManager.clearAllFilters();

      // Atualiza todas as UIs de filtro
      this.activeFilters.forEach((_, entityName) => {
        this.clearFilterForm(entityName);
        this.updateFilterStatus(entityName, false);
      });

      this.activeFilters.clear();

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Filtros", "Todos os filtros foram removidos");
      }
    } catch (error) {
      console.error("❌ Erro removendo todos os filtros:", error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível remover todos os filtros");
      }
    }
  }

  /**
   * Obtém estatísticas dos filtros
   */
  getFilterStats() {
    return {
      activeFiltersCount: this.activeFilters.size,
      historySize: this.filterHistory.length,
      entities: Array.from(this.activeFilters.keys()),
    };
  }
}

// ================ Instância Global ================
window.filterSystem = new FilterSystem();

// ================ CSS para o sistema de filtros ================
const filterCSS = `
.filter-form {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.filter-header h3 {
  margin: 0;
  color: #495057;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-apply-filter, .btn-clear-filter {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-apply-filter {
  background: #007bff;
  color: white;
}

.btn-apply-filter:hover {
  background: #0056b3;
}

.btn-clear-filter {
  background: #6c757d;
  color: white;
}

.btn-clear-filter:hover {
  background: #545b62;
}

.filter-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-field {
  display: flex;
  flex-direction: column;
}

.filter-field label {
  font-weight: 500;
  margin-bottom: 5px;
  color: #495057;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.filter-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-status {
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.filter-status.active {
  background: #d1edff;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.filter-status.inactive {
  background: #e2e3e5;
  color: #6c757d;
  border: 1px solid #d6d8db;
}

@media (max-width: 768px) {
  .filter-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .filter-actions {
    justify-content: center;
  }
  
  .filter-fields {
    grid-template-columns: 1fr;
  }
}
`;

// Adiciona CSS ao documento
const style = document.createElement("style");
style.textContent = filterCSS;
document.head.appendChild(style);

console.log("✅ FilterSystem carregado e disponível globalmente");
