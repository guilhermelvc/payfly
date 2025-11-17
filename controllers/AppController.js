// ================ App Controller - Controlador principal da aplicação unificada ================
/**
 * Substitui múltiplos controladores dispersos por um sistema centralizado
 * Gerencia navegação, estado da aplicação e coordenação entre módulos
 */

class AppController {
  constructor() {
    this.currentTab = "dashboard";
    this.user = null;
    this.isInitialized = false;
    this.entities = new Map();

    console.log("🚀 AppController inicializando...");
    this.init();
  }

  /**
   * Inicialização da aplicação
   */
  async init() {
    try {
      // Aguarda Supabase estar pronto
      await this.waitForSupabase();

      // Verifica autenticação
      await this.checkAuth();

      // Inicializa módulos
      await this.initializeModules();

      // Configura UI
      this.setupUI();

      // Carrega dados iniciais
      await this.loadInitialData();

      // Oculta loading e mostra app
      this.showApp();

      this.isInitialized = true;
      console.log("✅ AppController inicializado com sucesso");
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
      this.showError("Erro na inicialização da aplicação");
    }
  }

  /**
   * Aguarda Supabase estar disponível
   */
  async waitForSupabase() {
    return new Promise((resolve) => {
      const checkSupabase = () => {
        if (window.supabase && window.SUPABASE_CONFIGURED) {
          resolve();
        } else {
          setTimeout(checkSupabase, 100);
        }
      };
      checkSupabase();
    });
  }

  /**
   * Verifica autenticação do usuário
   */
  async checkAuth() {
    const {
      data: { user },
    } = await window.supabase.auth.getUser();

    if (!user) {
      // Redireciona para login se não autenticado
      window.location.href = "../views/Login.html";
      return;
    }

    this.user = user;
    console.log(`👤 Usuário autenticado: ${user.email}`);
  }

  /**
   * Inicializa módulos da aplicação
   */
  async initializeModules() {
    // EntityManager já inicializado automaticamente

    // Configura filtros para cada entidade
    ["receitas", "despesas", "investimentos", "poupanca", "planos"].forEach(
      (entityName) => {
        window.filterSystem.createFilterUI(entityName, `${entityName}-filters`);
      }
    );

    console.log("📦 Módulos inicializados");
  }

  /**
   * Configura interface do usuário
   */
  setupUI() {
    // Configura navegação sidebar
    this.setupSidebarNavigation();

    // Configura toggle do menu
    this.setupMenuToggle();

    // Configura nome do usuário
    this.updateUserInfo();

    // Configura event listeners globais
    this.setupEventListeners();

    console.log("🎨 UI configurada");
  }

  /**
   * Configuração da navegação sidebar
   */
  setupSidebarNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        // Remove classe ativa de todos os itens
        navItems.forEach((navItem) => navItem.classList.remove("active"));

        // Adiciona classe ativa ao item clicado
        item.classList.add("active");
      });

      // Hover effect
      item.addEventListener("mouseenter", () => {
        item.classList.add("hovered");
      });

      item.addEventListener("mouseleave", () => {
        item.classList.remove("hovered");
      });
    });
  }

  /**
   * Configuração do toggle do menu
   */
  setupMenuToggle() {
    const toggle = document.getElementById("toggle");
    const navigation = document.getElementById("navigation");
    const main = document.getElementById("main");

    if (toggle && navigation && main) {
      toggle.addEventListener("click", () => {
        navigation.classList.toggle("active");
        main.classList.toggle("active");
      });
    }
  }

  /**
   * Event listeners globais
   */
  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            this.switchTab("dashboard");
            break;
          case "2":
            e.preventDefault();
            this.switchTab("receitas");
            break;
          case "3":
            e.preventDefault();
            this.switchTab("despesas");
            break;
          case "r":
            e.preventDefault();
            this.refreshCurrentTab();
            break;
        }
      }
    });

    // Window resize handler
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Auth state changes
    window.supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "../views/Login.html";
      }
    });
  }

  /**
   * Atualiza informações do usuário na UI
   */
  async updateUserInfo() {
    if (!this.user) return;

    try {
      // Busca dados do usuário na tabela usuarios
      const { data: userData } = await window.supabase
        .from("usuarios")
        .select("nome")
        .eq("id", this.user.id)
        .single();

      const userName = userData?.nome || this.user.email.split("@")[0];

      const userNameElement = document.getElementById("user-sidebar-name");
      if (userNameElement) {
        userNameElement.textContent = userName;
      }
    } catch (error) {
      console.warn("⚠️ Erro buscando dados do usuário:", error);
    }
  }

  /**
   * Carrega dados iniciais da aplicação
   */
  async loadInitialData() {
    try {
      // Carrega dados de todas as entidades
      await window.entityManager.loadAllData();

      // Atualiza dashboard
      this.updateDashboard();

      console.log("📊 Dados iniciais carregados");
    } catch (error) {
      console.error("❌ Erro carregando dados iniciais:", error);
    }
  }

  /**
   * Atualiza dashboard com dados atuais
   */
  updateDashboard() {
    const summary = window.entityManager.getFinancialSummary();

    // Atualiza cards de resumo
    this.updateElement(
      "totalReceitaDisplay",
      this.formatCurrency(summary.totalReceitas)
    );
    this.updateElement(
      "totalDespesaDisplay",
      this.formatCurrency(summary.totalDespesas)
    );
    this.updateElement(
      "saldoLiquidoDisplay",
      this.formatCurrency(summary.saldoLiquido)
    );
    this.updateElement(
      "totalInvestimentosDisplay",
      this.formatCurrency(summary.totalInvestimentos)
    );

    // Atualiza classe do saldo (positivo/negativo)
    const saldoElement = document.getElementById("saldoLiquidoDisplay");
    if (saldoElement) {
      saldoElement.className =
        summary.saldoLiquido >= 0 ? "positive" : "negative";
    }
  }

  /**
   * Troca de abas
   */
  switchTab(tabName) {
    // Oculta todas as abas
    const allTabs = document.querySelectorAll(".tab-content");
    allTabs.forEach((tab) => tab.classList.remove("active"));

    // Remove classe ativa de todos os nav items
    const allNavItems = document.querySelectorAll(".nav-item");
    allNavItems.forEach((item) => item.classList.remove("active"));

    // Mostra aba selecionada
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
      targetTab.classList.add("active");
    }

    // Ativa nav item correspondente
    const navItem = document.querySelector(`[data-tab="${tabName}"]`);
    if (navItem) {
      navItem.classList.add("active");
    }

    // Atualiza estado atual
    this.currentTab = tabName;

    // Executa lógica específica da aba
    this.onTabSwitch(tabName);

    console.log(`📑 Aba alterada para: ${tabName}`);
  }

  /**
   * Lógica específica ao trocar de aba
   */
  onTabSwitch(tabName) {
    switch (tabName) {
      case "dashboard":
        this.updateDashboard();
        break;

      case "receitas":
        this.setupDataTable("receitas");
        break;

      case "despesas":
        this.setupDataTable("despesas");
        break;

      case "investimentos":
        this.setupDataTable("investimentos");
        break;

      case "poupanca":
        this.setupDataTable("poupanca");
        break;

      case "planos":
        this.setupDataTable("planos");
        break;

      case "ai-insights":
        // ⚠️ NÃO carregar insights automáticos para economizar quota da API
        // Os insights serão gerados apenas quando o usuário solicitar explicitamente
        console.log("📌 AI Insights: Aba aberta - aguardando ação do usuário");
        break;
    }
  }

  /**
   * Configura tabela de dados para entidade específica
   */
  setupDataTable(entityName) {
    const entity = window.entityManager.getEntity(entityName);
    if (!entity) return;

    // Configura ID da tabela específica
    const tableId =
      entityName === "receitas" ? "data-table" : `data-table-${entityName}`;

    // Atualiza referência da tabela na entidade
    const originalMethod = entity.addToTable;
    entity.addToTable = function (item, itemId) {
      // Temporariamente altera ID da tabela
      const originalTable = document.getElementById("data-table");
      const targetTable = document.getElementById(tableId);

      if (targetTable && originalTable !== targetTable) {
        targetTable.id = "data-table";
        originalTable.id = "temp-table";
      }

      // Chama método original
      originalMethod.call(this, item, itemId);

      // Restaura IDs
      if (targetTable && originalTable) {
        targetTable.id = tableId;
        originalTable.id = "data-table";
      }
    };

    // Recarrega dados
    entity.loadFromSupabase();
  }

  /**
   * Carrega insights da IA
   * ⚠️ DESCONTINUADO - Chamadas automáticas foram removidas para economizar quota
   */
  async loadAIInsights() {
    console.log(
      "📌 AI Insights: Modo manual - aguardando solicitação do usuário"
    );
    // Não fazer nada aqui - deixar o usuário iniciar a conversa manualmente
  }

  /**
   * Atualiza aba atual
   */
  async refreshCurrentTab() {
    switch (this.currentTab) {
      case "dashboard":
        await this.loadInitialData();
        break;

      default:
        const entity = window.entityManager.getEntity(this.currentTab);
        if (entity) {
          await entity.loadFromSupabase();
        }
    }

    if (typeof showSuccessToast === "function") {
      showSuccessToast("Atualizado", "Dados atualizados com sucesso");
    }
  }

  /**
   * Exporta dashboard para PDF
   */
  async exportDashboard() {
    if (typeof generateDashboardPDF === "function") {
      await generateDashboardPDF();
    } else {
      console.warn("⚠️ Função de exportação PDF não disponível");
    }
  }

  /**
   * Logout do usuário
   */
  async logout() {
    try {
      await window.supabase.auth.signOut();
      window.location.href = "../views/Login.html";
    } catch (error) {
      console.error("❌ Erro no logout:", error);
    }
  }

  /**
   * Manipula redimensionamento da janela
   */
  handleResize() {
    // Fecha menu em dispositivos móveis quando redimensiona
    if (window.innerWidth <= 768) {
      const navigation = document.getElementById("navigation");
      const main = document.getElementById("main");

      if (navigation && navigation.classList.contains("active")) {
        navigation.classList.remove("active");
        main.classList.remove("active");
      }
    }
  }

  /**
   * Mostra aplicação após carregamento
   */
  showApp() {
    const loadingScreen = document.getElementById("loading-screen");
    const appContainer = document.getElementById("app-container");

    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }

    if (appContainer) {
      appContainer.style.display = "flex";
    }
  }

  /**
   * Mostra erro na aplicação
   */
  showError(message) {
    if (typeof showErrorToast === "function") {
      showErrorToast("Erro", message);
    } else {
      alert("Erro: " + message);
    }
  }

  /**
   * Helpers de formatação
   */
  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  // ================ Métodos de Configuração ================

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile() {
    const nameInput = document.getElementById("user-name");
    if (!nameInput) return;

    try {
      const { error } = await window.supabase.from("usuarios").upsert({
        id: this.user.id,
        nome: nameInput.value,
        email: this.user.email,
      });

      if (error) throw error;

      this.updateUserInfo();

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Sucesso", "Perfil atualizado com sucesso");
      }
    } catch (error) {
      console.error("❌ Erro atualizando perfil:", error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível atualizar o perfil");
      }
    }
  }

  /**
   * Altera tema da aplicação
   */
  changeTheme() {
    const themeSelector = document.getElementById("theme-selector");
    if (!themeSelector) return;

    const theme = themeSelector.value;
    document.body.className = `theme-${theme}`;

    // Salva preferência no localStorage
    localStorage.setItem("payfly-theme", theme);
  }

  /**
   * Exporta dados do usuário
   */
  async exportData() {
    try {
      const summary = window.entityManager.getFinancialSummary();
      const stats = window.entityManager.getSystemStats();

      const exportData = {
        user: this.user.email,
        exportDate: new Date().toISOString(),
        summary,
        stats,
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `payfly-dados-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Sucesso", "Dados exportados com sucesso");
      }
    } catch (error) {
      console.error("❌ Erro exportando dados:", error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível exportar os dados");
      }
    }
  }

  /**
   * Limpa cache da aplicação
   */
  clearCache() {
    if (
      confirm(
        "Deseja limpar o cache da aplicação? Isso pode melhorar a performance."
      )
    ) {
      localStorage.clear();
      sessionStorage.clear();

      if (typeof showSuccessToast === "function") {
        showSuccessToast("Sucesso", "Cache limpo com sucesso");
      }
    }
  }

  /**
   * Exclui conta do usuário
   */
  async deleteAccount() {
    const confirmation = prompt(
      "ATENÇÃO: Esta ação é irreversível!\n\n" +
        'Digite "EXCLUIR CONTA" para confirmar a exclusão permanente de todos os seus dados:'
    );

    if (confirmation === "EXCLUIR CONTA") {
      try {
        // Aqui seria implementada a exclusão completa da conta
        // Por segurança, não implementamos neste exemplo

        if (typeof showWarningToast === "function") {
          showWarningToast(
            "Aviso",
            "Funcionalidade de exclusão de conta ainda não implementada por segurança"
          );
        }
      } catch (error) {
        console.error("❌ Erro excluindo conta:", error);
        if (typeof showErrorToast === "function") {
          showErrorToast("Erro", "Não foi possível excluir a conta");
        }
      }
    }
  }
}

// ================ Instância Global ================
window.app = new AppController();

console.log("✅ AppController carregado e inicializando...");
