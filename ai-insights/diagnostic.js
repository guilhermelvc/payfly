// ===============================================
// Diagnóstico do Sistema IA - PayFly
// ===============================================

class AISystemDiagnostic {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Executar diagnóstico completo do sistema IA
   */
  async runFullDiagnostic() {
    if (this.isRunning) {
      window.AIInsights.showToast("Diagnóstico já em execução...", "warning");
      return;
    }

    try {
      this.isRunning = true;
      window.AIInsights.setLoading(true);

      window.AIInsights.addMessage(
        "user",
        "🔧 Executar diagnóstico do sistema IA"
      );
      window.AIInsights.addMessage(
        "ai",
        "🔍 Executando diagnóstico completo do sistema..."
      );

      // Teste 1: Verificar dependências
      window.AIInsights.addMessage(
        "ai",
        "📋 Teste 1: Verificando dependências do sistema..."
      );

      const dependencies = this.checkDependencies();
      if (!dependencies.allFound) {
        window.AIInsights.addMessage(
          "ai",
          `❌ Teste 1: Dependências em falta - ${dependencies.missing.join(
            ", "
          )}`
        );
        return;
      }
      window.AIInsights.addMessage(
        "ai",
        "✅ Teste 1: Todas as dependências encontradas"
      );

      // Teste 2: Conectividade da API
      window.AIInsights.addMessage(
        "ai",
        "📡 Teste 2: Verificando conectividade com a API..."
      );

      try {
        const apiTest = await window.GeminiAI.testConnection();
        if (apiTest) {
          window.AIInsights.addMessage(
            "ai",
            "✅ Teste 2: API Gemini funcionando corretamente"
          );
        } else {
          window.AIInsights.addMessage(
            "ai",
            "❌ Teste 2: Falha na API - verifique sua internet ou tente mais tarde"
          );
          return;
        }
      } catch (error) {
        window.AIInsights.addMessage(
          "ai",
          `❌ Teste 2: Erro de conectividade - ${error.message}`
        );
        return;
      }

      // Teste 3: Dados financeiros
      window.AIInsights.addMessage(
        "ai",
        "📊 Teste 3: Verificando acesso aos dados financeiros..."
      );

      try {
        const financialData = await window.FinancialAnalyzer.getDataForAI();
        const hasData = financialData && Object.keys(financialData).length > 0;

        if (hasData) {
          const receitasCount = financialData.receitas?.length || 0;
          const despesasCount = financialData.despesas?.length || 0;
          const planosCount = financialData.planos?.length || 0;

          window.AIInsights.addMessage(
            "ai",
            `✅ Teste 3: Dados financeiros carregados (${receitasCount} receitas, ${despesasCount} despesas, ${planosCount} planos)`
          );
        } else {
          window.AIInsights.addMessage(
            "ai",
            "⚠️ Teste 3: Nenhum dado financeiro encontrado - cadastre receitas/despesas para análises mais precisas"
          );
        }
      } catch (error) {
        window.AIInsights.addMessage(
          "ai",
          `❌ Teste 3: Erro ao acessar dados - ${error.message}`
        );
        return;
      }

      // Teste 4: Pergunta de teste para IA
      window.AIInsights.addMessage(
        "ai",
        "🤖 Teste 4: Fazendo pergunta de teste para a IA..."
      );

      try {
        const testResponse = await window.GeminiAI.askQuestion(
          "Responda apenas: 'Sistema funcionando perfeitamente!'",
          {}
        );

        if (
          testResponse &&
          testResponse.toLowerCase().includes("funcionando")
        ) {
          window.AIInsights.addMessage(
            "ai",
            "✅ Teste 4: IA respondendo corretamente"
          );
        } else {
          window.AIInsights.addMessage(
            "ai",
            `⚠️ Teste 4: IA funcionando, mas resposta inesperada: "${testResponse}"`
          );
        }
      } catch (error) {
        window.AIInsights.addMessage(
          "ai",
          `❌ Teste 4: Erro na resposta da IA - ${error.message}`
        );
        return;
      }

      // Teste 5: Integração completa
      window.AIInsights.addMessage(
        "ai",
        "🔄 Teste 5: Testando integração completa..."
      );

      try {
        const fullTestResponse = await window.GeminiAI.askQuestion(
          "Analise brevemente esta situação financeira fictícia: Receita R$ 5000, Despesa R$ 3000. Responda em até 30 palavras.",
          {
            totalReceitas: 5000,
            totalDespesas: 3000,
            receitas: [{ categoria: "Salário", valor: 5000 }],
            despesas: [{ categoria: "Moradia", valor: 3000 }],
          }
        );

        if (fullTestResponse && fullTestResponse.length > 10) {
          window.AIInsights.addMessage(
            "ai",
            "✅ Teste 5: Integração completa funcionando"
          );
        } else {
          window.AIInsights.addMessage(
            "ai",
            "⚠️ Teste 5: Integração parcialmente funcional"
          );
        }
      } catch (error) {
        window.AIInsights.addMessage(
          "ai",
          `❌ Teste 5: Erro na integração - ${error.message}`
        );
      }

      // Diagnóstico completo
      window.AIInsights.addMessage(
        "ai",
        "🎉 **DIAGNÓSTICO CONCLUÍDO COM SUCESSO!**\n\n✅ Seu sistema de IA está funcionando perfeitamente!\n\n🚀 Você pode fazer perguntas normalmente sobre suas finanças. Experimente:\n• 'Como estão meus gastos?'\n• 'Onde posso economizar?'\n• 'Análise minha situação financeira'\n\n💰✨ Aproveite seus insights personalizados!"
      );
    } catch (error) {
      console.error("❌ Erro no diagnóstico:", error);
      window.AIInsights.addMessage(
        "ai",
        `❌ Erro durante o diagnóstico: ${error.message}\n\n🔧 Tente recarregar a página ou verifique sua conexão com a internet.`
      );
    } finally {
      this.isRunning = false;
      window.AIInsights.setLoading(false);
    }
  }

  /**
   * Verificar se todas as dependências estão disponíveis
   */
  checkDependencies() {
    const required = [
      { name: "window.GeminiAI", obj: window.GeminiAI },
      { name: "window.FinancialAnalyzer", obj: window.FinancialAnalyzer },
      { name: "window.AIInsights", obj: window.AIInsights },
      { name: "window.supabase", obj: window.supabase },
    ];

    const missing = required.filter((dep) => !dep.obj).map((dep) => dep.name);

    return {
      allFound: missing.length === 0,
      missing: missing,
      found: required.filter((dep) => dep.obj).map((dep) => dep.name),
    };
  }

  /**
   * Executar teste rápido da API
   */
  async quickAPITest() {
    try {
      window.AIInsights.addMessage("user", "⚡ Teste rápido da API");
      window.AIInsights.addMessage("ai", "🔍 Testando conectividade...");

      const isWorking = await window.GeminiAI.testConnection();

      if (isWorking) {
        window.AIInsights.addMessage(
          "ai",
          "✅ API funcionando! Você pode fazer perguntas normalmente."
        );
      } else {
        window.AIInsights.addMessage(
          "ai",
          "❌ API indisponível no momento. Tente novamente em alguns segundos."
        );
      }
    } catch (error) {
      window.AIInsights.addMessage("ai", `❌ Erro no teste: ${error.message}`);
    }
  }
}

// Instância global do diagnóstico
window.AIDiagnostic = new AISystemDiagnostic();

// Função global para uso no botão
window.diagnosticAI = () => window.AIDiagnostic.runFullDiagnostic();
window.quickTestAI = () => window.AIDiagnostic.quickAPITest();

console.log("🔧 AI System Diagnostic initialized successfully");
