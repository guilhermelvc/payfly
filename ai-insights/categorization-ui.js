/**
 * =====================================================
 * PAYFLY - INTERFACE DE CATEGORIZAÇÃO INTELIGENTE
 * =====================================================
 * Sistema de interface para categorização inteligente de transações
 * Integra IA, sugestões automáticas e entrada manual
 */

class CategorizationUI {
  constructor() {
    this.smartCategorization = null;
    this.currentType = null;
    this.currentInput = null;
    this.init();
  }

  /**
   * Inicializa o sistema de categorização
   */
  async init() {
    try {
      // Carrega o sistema de categorização inteligente
      if (typeof SmartCategorizationSystem !== "undefined") {
        this.smartCategorization = new SmartCategorizationSystem();
        await this.smartCategorization.init();
      }

      // Configura eventos de input
      this.setupEventListeners();

      console.log("✅ Sistema de Categorização UI inicializado");
    } catch (error) {
      console.error("❌ Erro ao inicializar Categorização UI:", error);
    }
  }

  /**
   * Configura os event listeners para os campos de categoria
   */
  setupEventListeners() {
    // Escuta mudanças nos campos de categoria
    document.addEventListener("input", (e) => {
      if (e.target.name === "categoria") {
        this.handleCategoryInput(e.target);
      }
    });

    // Escuta cliques fora das sugestões para fechá-las
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".categoria-group")) {
        this.hideSuggestions();
      }
    });

    // Escuta teclas de navegação
    document.addEventListener("keydown", (e) => {
      if (e.target.name === "categoria") {
        this.handleKeyNavigation(e);
      }
    });
  }

  /**
   * Manipula entrada de texto no campo categoria
   */
  async handleCategoryInput(input) {
    const query = input.value.trim();

    if (query.length >= 2) {
      await this.showAutocompleteSuggestions(query);
    } else {
      this.hideSuggestions();
    }
  }

  /**
   * Mostra sugestões automáticas baseadas no texto digitado
   */
  async showAutocompleteSuggestions(query) {
    const suggestionsContainer = document.getElementById(
      "categoria-suggestions"
    );

    if (!suggestionsContainer) return;

    try {
      // Busca categorias existentes que correspondem à query
      const matchingCategories = await this.searchExistingCategories(query);

      if (matchingCategories.length > 0) {
        this.renderSuggestions(matchingCategories, suggestionsContainer);
        suggestionsContainer.classList.add("show");
      } else {
        this.hideSuggestions();
      }
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    }
  }

  /**
   * Busca categorias existentes no banco
   */
  async searchExistingCategories(query) {
    try {
      const { data, error } = await supabaseClient
        .from("categorias")
        .select("nome, tipo, frequencia_uso")
        .ilike("nome", `%${query}%`)
        .order("frequencia_uso", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return [];
    }
  }

  /**
   * Renderiza as sugestões na interface
   */
  renderSuggestions(suggestions, container) {
    container.innerHTML = "";

    suggestions.forEach((suggestion) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.innerHTML = `
                <span>${suggestion.nome}</span>
                <span class="suggestion-confidence">${
                  suggestion.frequencia_uso || 0
                } usos</span>
            `;

      item.addEventListener("click", () => {
        this.selectCategory(suggestion.nome);
      });

      container.appendChild(item);
    });
  }

  /**
   * Sugere categoria usando IA
   */
  async suggestCategory(type) {
    if (!this.smartCategorization) {
      this.showToast("Sistema de IA não disponível no momento", "warning");
      return;
    }

    this.currentType = type;

    // Coleta dados do formulário
    const formData = this.collectFormData();

    if (!formData.descricao) {
      this.showToast(
        "Digite uma descrição primeiro para a IA sugerir uma categoria",
        "info"
      );
      return;
    }

    try {
      // Mostra loading
      const iaBtn = document.querySelector(".ia-suggest-btn");
      const originalText = iaBtn.innerHTML;
      iaBtn.innerHTML = "⏳";
      iaBtn.disabled = true;

      // Solicita sugestão da IA
      const suggestion = await this.smartCategorization.suggestCategory(
        formData.descricao,
        type,
        formData.valor
      );

      // Restaura botão
      iaBtn.innerHTML = originalText;
      iaBtn.disabled = false;

      if (suggestion) {
        await this.showAISuggestions([suggestion]);
      } else {
        this.showToast(
          "IA não conseguiu sugerir uma categoria para esta descrição",
          "info"
        );
      }
    } catch (error) {
      console.error("Erro ao sugerir categoria:", error);
      this.showToast("Erro ao conectar com a IA", "error");

      // Restaura botão em caso de erro
      const iaBtn = document.querySelector(".ia-suggest-btn");
      iaBtn.innerHTML = "🤖 IA";
      iaBtn.disabled = false;
    }
  }

  /**
   * Mostra sugestões da IA
   */
  async showAISuggestions(suggestions) {
    const suggestionsContainer = document.getElementById(
      "categoria-suggestions"
    );

    if (!suggestionsContainer) return;

    suggestionsContainer.innerHTML = "";

    suggestions.forEach((suggestion) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.innerHTML = `
                <span>🤖 ${suggestion.categoria}</span>
                <span class="suggestion-confidence">${Math.round(
                  suggestion.confidence * 100
                )}%</span>
            `;

      item.addEventListener("click", () => {
        this.selectCategory(suggestion.categoria);
        // Aprende com a escolha do usuário
        if (this.smartCategorization) {
          this.smartCategorization.learnFromUserChoice(
            this.collectFormData().descricao,
            suggestion.categoria,
            this.currentType
          );
        }
      });

      suggestionsContainer.appendChild(item);
    });

    suggestionsContainer.classList.add("show");
  }

  /**
   * Seleciona uma categoria
   */
  selectCategory(categoryName) {
    const categoryInput = document.querySelector('input[name="categoria"]');

    if (categoryInput) {
      categoryInput.value = categoryName;

      // Atualiza tags visuais
      this.updateCategoryTags(categoryName);

      // Esconde sugestões
      this.hideSuggestions();

      // Trigger evento de mudança
      categoryInput.dispatchEvent(new Event("change"));
    }
  }

  /**
   * Atualiza tags de categoria visual
   */
  updateCategoryTags(selectedCategory) {
    const tags = document.querySelectorAll(".category-tag");

    tags.forEach((tag) => {
      tag.classList.remove("selected");
      if (tag.textContent.trim() === selectedCategory) {
        tag.classList.add("selected");
      }
    });
  }

  /**
   * Esconde sugestões
   */
  hideSuggestions() {
    const suggestionsContainer = document.getElementById(
      "categoria-suggestions"
    );
    if (suggestionsContainer) {
      suggestionsContainer.classList.remove("show");
    }
  }

  /**
   * Manipula navegação por teclado
   */
  handleKeyNavigation(e) {
    const suggestionsContainer = document.getElementById(
      "categoria-suggestions"
    );
    const items = suggestionsContainer.querySelectorAll(".suggestion-item");

    if (items.length === 0) return;

    const currentActive = suggestionsContainer.querySelector(
      ".suggestion-item.active"
    );
    let newActiveIndex = 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (currentActive) {
        const currentIndex = Array.from(items).indexOf(currentActive);
        newActiveIndex = (currentIndex + 1) % items.length;
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (currentActive) {
        const currentIndex = Array.from(items).indexOf(currentActive);
        newActiveIndex =
          currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      } else {
        newActiveIndex = items.length - 1;
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentActive) {
        currentActive.click();
      }
      return;
    } else if (e.key === "Escape") {
      this.hideSuggestions();
      return;
    } else {
      return;
    }

    // Remove classe active de todos
    items.forEach((item) => item.classList.remove("active"));

    // Adiciona classe active ao novo item
    if (items[newActiveIndex]) {
      items[newActiveIndex].classList.add("active");
    }
  }

  /**
   * Coleta dados do formulário atual
   */
  collectFormData() {
    const form = document.getElementById("form");
    if (!form) return {};

    const formData = new FormData(form);
    return {
      descricao: formData.get("descricao") || "",
      valor: parseFloat(formData.get("valor")) || 0,
      data: formData.get("data") || "",
      categoria: formData.get("categoria") || "",
    };
  }

  /**
   * Salva categoria personalizada no banco
   */
  async saveCustomCategory(categoryName, type) {
    try {
      const { data, error } = await supabaseClient.from("categorias").upsert(
        {
          nome: categoryName,
          tipo: type,
          is_custom: true,
          user_id: auth.currentUser?.id,
          frequencia_uso: 1,
        },
        {
          onConflict: "nome,tipo,user_id",
        }
      );

      if (error) throw error;

      console.log("Categoria personalizada salva:", categoryName);
      return true;
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      return false;
    }
  }

  /**
   * Incrementa uso da categoria
   */
  async incrementCategoryUsage(categoryName, type) {
    try {
      const { error } = await supabaseClient.rpc("increment_category_usage", {
        category_name: categoryName,
        category_type: type,
        user_id: auth.currentUser?.id,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao incrementar uso da categoria:", error);
    }
  }

  /**
   * Mostra toast de feedback
   */
  showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    const colors = {
      info: "#2196F3",
      success: "#4CAF50",
      warning: "#FF9800",
      error: "#F44336",
    };

    toast.style.background = colors[type] || colors.info;
    toast.querySelector(".description").textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  /**
   * Valida categoria antes do envio
   */
  validateCategory(categoryName, type) {
    if (!categoryName || categoryName.trim() === "") {
      return { valid: false, message: "Categoria é obrigatória" };
    }

    if (categoryName.length < 2) {
      return {
        valid: false,
        message: "Categoria deve ter pelo menos 2 caracteres",
      };
    }

    if (categoryName.length > 50) {
      return {
        valid: false,
        message: "Categoria não pode ter mais de 50 caracteres",
      };
    }

    return { valid: true };
  }

  /**
   * Processa envio de categoria
   */
  async processCategory(formData, type) {
    const categoryName = formData.categoria?.trim();

    if (!categoryName) return null;

    const validation = this.validateCategory(categoryName, type);

    if (!validation.valid) {
      this.showToast(validation.message, "warning");
      return null;
    }

    // Salva categoria se for nova
    await this.saveCustomCategory(categoryName, type);

    // Incrementa uso
    await this.incrementCategoryUsage(categoryName, type);

    return categoryName;
  }
}

// Instância global
window.CategorizationUI = new CategorizationUI();

// Função de conveniência para usar nos HTML
window.CategorizationUI.suggestCategory =
  window.CategorizationUI.suggestCategory.bind(window.CategorizationUI);
window.CategorizationUI.selectCategory =
  window.CategorizationUI.selectCategory.bind(window.CategorizationUI);

console.log("🎯 Categorization UI carregado e pronto para uso");
