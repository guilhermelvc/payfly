// ===============================================
// Sistema de Testes Automatizados - PayFly
// ===============================================

class PayFlyTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      errors: [],
    };
    this.isRunning = false;
  }

  /**
   * Adicionar teste à suite
   */
  addTest(name, testFunction, category = "general") {
    this.tests.push({
      name,
      function: testFunction,
      category,
      status: "pending",
    });
  }

  /**
   * Executar todos os testes
   */
  async runAllTests() {
    if (this.isRunning) {
      console.warn("⚠️ Testes já estão em execução");
      return;
    }

    this.isRunning = true;
    this.results = { passed: 0, failed: 0, errors: [] };

    console.log("🧪 Iniciando suite de testes PayFly...");
    console.log(`📋 ${this.tests.length} testes programados`);

    const startTime = Date.now();

    for (const test of this.tests) {
      try {
        console.log(`\n🔍 Executando: ${test.name}`);

        const testStartTime = Date.now();
        const result = await test.function();
        const testDuration = Date.now() - testStartTime;

        if (result.success) {
          test.status = "passed";
          this.results.passed++;
          console.log(`✅ ${test.name} - PASSOU (${testDuration}ms)`);
          if (result.details) {
            console.log(`   📄 ${result.details}`);
          }
        } else {
          test.status = "failed";
          this.results.failed++;
          console.error(`❌ ${test.name} - FALHOU`);
          console.error(`   🐛 ${result.error}`);
          this.results.errors.push({
            test: test.name,
            error: result.error,
          });
        }
      } catch (error) {
        test.status = "error";
        this.results.failed++;
        console.error(`💥 ${test.name} - ERRO INESPERADO`);
        console.error(`   ⚠️ ${error.message}`);
        this.results.errors.push({
          test: test.name,
          error: error.message,
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    this.isRunning = false;

    this.printSummary(totalDuration);
    return this.results;
  }

  /**
   * Imprimir resumo dos testes
   */
  printSummary(duration) {
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DOS TESTES");
    console.log("=".repeat(60));
    console.log(`⏱️  Duração total: ${duration}ms`);
    console.log(`✅ Testes passaram: ${this.results.passed}`);
    console.log(`❌ Testes falharam: ${this.results.failed}`);
    console.log(
      `📈 Taxa de sucesso: ${(
        (this.results.passed / this.tests.length) *
        100
      ).toFixed(1)}%`
    );

    if (this.results.errors.length > 0) {
      console.log("\n🐛 ERROS ENCONTRADOS:");
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.test}: ${error.error}`);
      });
    }

    console.log("=".repeat(60));

    // Emitir evento com resultados
    window.dispatchEvent(
      new CustomEvent("testSuiteCompleted", {
        detail: this.results,
      })
    );
  }

  /**
   * Executar testes por categoria
   */
  async runTestsByCategory(category) {
    const categoryTests = this.tests.filter(
      (test) => test.category === category
    );

    if (categoryTests.length === 0) {
      console.warn(`⚠️ Nenhum teste encontrado para categoria: ${category}`);
      return;
    }

    console.log(`🧪 Executando testes da categoria: ${category}`);

    // Temporariamente substituir a lista de testes
    const originalTests = this.tests;
    this.tests = categoryTests;

    const results = await this.runAllTests();

    // Restaurar lista original
    this.tests = originalTests;

    return results;
  }

  /**
   * Helper para assertions
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
    return true;
  }

  /**
   * Helper para testar se elemento existe
   */
  assertElementExists(selector, message) {
    const element = document.querySelector(selector);
    this.assert(
      element !== null,
      message || `Elemento não encontrado: ${selector}`
    );
    return element;
  }

  /**
   * Helper para testar se função existe
   */
  assertFunctionExists(functionName, context = window, message) {
    const func = context[functionName];
    this.assert(
      typeof func === "function",
      message || `Função não encontrada: ${functionName}`
    );
    return func;
  }

  /**
   * Helper para aguardar condição
   */
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        if (await condition()) {
          return true;
        }
      } catch (error) {
        // Ignorar erros durante a espera
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Timeout aguardando condição (${timeout}ms)`);
  }
}

// ===============================================
// Testes Específicos do PayFly
// ===============================================

// Instância global da suite de testes
window.testSuite = new PayFlyTestSuite();

// ================ Testes de Arquitetura ================

window.testSuite.addTest(
  "Verificar carregamento do BaseModel",
  async function () {
    try {
      testSuite.assertFunctionExists("BaseModel", window);
      testSuite.assert(
        typeof BaseModel === "function",
        "BaseModel deve ser uma classe"
      );

      return {
        success: true,
        details: "BaseModel carregado e é uma classe válida",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "architecture"
);

window.testSuite.addTest(
  "Verificar EntityManager",
  async function () {
    try {
      testSuite.assertFunctionExists("EntityManager", window);
      testSuite.assert(
        window.entityManager instanceof EntityManager,
        "entityManager deve ser instância de EntityManager"
      );

      const entities = window.entityManager.getRegisteredEntities();
      testSuite.assert(
        Array.isArray(entities),
        "getRegisteredEntities deve retornar array"
      );

      return {
        success: true,
        details: `EntityManager ativo com ${entities.length} entidades registradas`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "architecture"
);

window.testSuite.addTest(
  "Verificar FilterSystem",
  async function () {
    try {
      testSuite.assertFunctionExists("FilterSystem", window);
      testSuite.assert(
        window.filterSystem instanceof FilterSystem,
        "filterSystem deve ser instância de FilterSystem"
      );

      const status = window.filterSystem.getStatus();
      testSuite.assert(
        typeof status === "object",
        "getStatus deve retornar objeto"
      );

      return {
        success: true,
        details: "FilterSystem carregado e funcional",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "architecture"
);

window.testSuite.addTest(
  "Verificar ModalManager",
  async function () {
    try {
      testSuite.assertFunctionExists("ModalManager", window);
      testSuite.assert(
        window.modalManager instanceof ModalManager,
        "modalManager deve ser instância de ModalManager"
      );

      return {
        success: true,
        details: "ModalManager carregado e funcional",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "architecture"
);

// ================ Testes de Models ================

window.testSuite.addTest(
  "Verificar ReceitaManager refatorado",
  async function () {
    try {
      testSuite.assertFunctionExists("ReceitaManager", window);
      testSuite.assert(
        window.receitaManager instanceof ReceitaManager,
        "receitaManager deve ser instância de ReceitaManager"
      );
      testSuite.assert(
        window.receitaManager instanceof BaseModel,
        "ReceitaManager deve herdar de BaseModel"
      );

      const config = window.receitaManager.getEntityConfig();
      testSuite.assert(
        config && config.title === "Receita",
        "Configuração da entidade deve estar correta"
      );

      return {
        success: true,
        details: "ReceitaManager refatorado e funcional",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "models"
);

window.testSuite.addTest(
  "Verificar InvestimentoManager refatorado",
  async function () {
    try {
      testSuite.assertFunctionExists("InvestimentoManager", window);
      testSuite.assert(
        window.investimentoManager instanceof InvestimentoManager,
        "investimentoManager deve ser instância de InvestimentoManager"
      );
      testSuite.assert(
        window.investimentoManager instanceof BaseModel,
        "InvestimentoManager deve herdar de BaseModel"
      );

      return {
        success: true,
        details: "InvestimentoManager refatorado e funcional",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "models"
);

window.testSuite.addTest(
  "Verificar compatibilidade com funções legacy",
  async function () {
    try {
      // Testar aliases de compatibilidade
      testSuite.assertFunctionExists("loadReceitasFromSupabase", window);
      testSuite.assertFunctionExists("saveReceita", window);
      testSuite.assertFunctionExists("deleteReceita", window);

      testSuite.assertFunctionExists("loadInvestimentosFromSupabase", window);
      testSuite.assertFunctionExists("saveInvestimento", window);
      testSuite.assertFunctionExists("deleteInvestimento", window);

      return {
        success: true,
        details: "Todas as funções de compatibilidade estão disponíveis",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "compatibility"
);

// ================ Testes de Interface ================

window.testSuite.addTest(
  "Verificar estrutura HTML unificada",
  async function () {
    try {
      // Verificar elementos principais da interface unificada
      testSuite.assertElementExists(
        ".app-container",
        "Container principal deve existir"
      );
      testSuite.assertElementExists(
        ".navigation",
        "Navegação lateral deve existir"
      );
      testSuite.assertElementExists(".main", "Área principal deve existir");

      // Verificar sistema de abas
      const tabs = document.querySelectorAll(".nav-item");
      testSuite.assert(tabs.length > 0, "Deve haver abas de navegação");

      return {
        success: true,
        details: `Interface unificada com ${tabs.length} abas encontradas`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "interface"
);

window.testSuite.addTest(
  "Verificar CSS modular carregado",
  async function () {
    try {
      // Verificar se as CSS variables estão disponíveis
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue("--primary-color");

      testSuite.assert(
        primaryColor.trim() !== "",
        "CSS variables devem estar carregadas"
      );

      // Verificar se classes específicas existem
      const hasComponentsCSS =
        document.querySelector(".btn") !== null ||
        document.styleSheets.length > 0;
      testSuite.assert(
        hasComponentsCSS,
        "CSS de componentes deve estar carregado"
      );

      return {
        success: true,
        details: "Sistema CSS modular carregado corretamente",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "interface"
);

// ================ Testes de AI ================

window.testSuite.addTest(
  "Verificar AI Service otimizado",
  async function () {
    try {
      testSuite.assertFunctionExists("AIService", window);
      testSuite.assert(
        window.aiService instanceof AIService,
        "aiService deve ser instância de AIService"
      );

      const status = window.aiService.getStatus();
      testSuite.assert(
        typeof status === "object",
        "getStatus deve retornar objeto"
      );
      testSuite.assert(
        Array.isArray(status.supportedProviders),
        "Deve ter lista de providers suportados"
      );
      testSuite.assert(
        status.supportedProviders.includes("gemini"),
        "Deve suportar Gemini"
      );
      testSuite.assert(
        status.supportedProviders.includes("openai"),
        "Deve suportar OpenAI"
      );

      return {
        success: true,
        details: `AI Service com ${status.supportedProviders.length} providers suportados`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "ai"
);

window.testSuite.addTest(
  "Verificar AI Configuration Manager",
  async function () {
    try {
      testSuite.assertFunctionExists("AIConfigurationManager", window);
      testSuite.assert(
        window.aiConfigManager instanceof AIConfigurationManager,
        "aiConfigManager deve ser instância de AIConfigurationManager"
      );

      // Verificar se modal de configuração foi criado
      const modal = document.getElementById("aiConfigModal");
      testSuite.assert(modal !== null, "Modal de configuração AI deve existir");

      return {
        success: true,
        details: "AI Configuration Manager carregado e modal criado",
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "ai"
);

// ================ Testes de Performance ================

window.testSuite.addTest(
  "Verificar tempo de carregamento dos módulos",
  async function () {
    try {
      const startTime = performance.now();

      // Simular carregamento de dados (sem requisições reais)
      const testData = [
        { id: 1, descricao: "Teste", valor: 100, data: "2024-01-01" },
        { id: 2, descricao: "Teste 2", valor: 200, data: "2024-01-02" },
      ];

      // Testar performance de processamento
      if (window.receitaManager) {
        window.receitaManager.postProcessData(testData);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      testSuite.assert(
        duration < 100,
        "Processamento deve ser rápido (< 100ms)"
      );

      return {
        success: true,
        details: `Processamento concluído em ${duration.toFixed(2)}ms`,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  "performance"
);

// ================ Função de Execução Rápida ================

/**
 * Executar testes básicos rapidamente
 */
window.runQuickTests = async function () {
  console.log("🚀 Executando testes rápidos...");

  const quickTests = [
    "Verificar carregamento do BaseModel",
    "Verificar EntityManager",
    "Verificar AI Service otimizado",
    "Verificar estrutura HTML unificada",
  ];

  const originalTests = window.testSuite.tests;
  window.testSuite.tests = originalTests.filter((test) =>
    quickTests.includes(test.name)
  );

  const results = await window.testSuite.runAllTests();

  window.testSuite.tests = originalTests;

  return results;
};

/**
 * Executar todos os testes
 */
window.runAllTests = function () {
  return window.testSuite.runAllTests();
};

/**
 * Executar testes por categoria
 */
window.runTestsByCategory = function (category) {
  return window.testSuite.runTestsByCategory(category);
};

// ================ Auto-inicialização ================

console.log("🧪 Sistema de testes PayFly carregado");
console.log("📋 Comandos disponíveis:");
console.log("   - runQuickTests(): Testes básicos");
console.log("   - runAllTests(): Todos os testes");
console.log('   - runTestsByCategory("category"): Testes por categoria');
console.log(
  "   - Categorias: architecture, models, interface, ai, performance, compatibility"
);

// Auto-executar testes rápidos se solicitado
if (window.location.search.includes("autotest=true")) {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      console.log("🎯 Auto-executando testes rápidos...");
      window.runQuickTests();
    }, 2000);
  });
}
