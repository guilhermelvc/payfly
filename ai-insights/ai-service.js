// ===============================================
// Serviço de Integração com Google Gemini API
// ===============================================

class GeminiAIService {
  constructor() {
    this.apiKey = "AIzaSyCSJ8E6evq0NrMTZYTA20OVtVU6GIbAOEk";
    this.baseUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent";
    this.isProcessing = false;
  }

  /**
   * Fazer pergunta para o Gemini
   * @param {string} question - Pergunta do usuário
   * @param {object} context - Contexto financeiro do usuário
   * @returns {Promise<string>} - Resposta da IA
   */
  async askQuestion(question, context = {}) {
    try {
      console.log("🤖 GeminiAI: Processando pergunta:", question);
      console.log("📊 GeminiAI: Contexto recebido:", context);

      const prompt = this.buildPrompt(question, context);
      console.log(
        "📝 GeminiAI: Prompt gerado (primeiras 200 chars):",
        prompt.substring(0, 200) + "..."
      );

      try {
        const response = await this.callGeminiAPI(prompt);
        console.log("✅ GeminiAI: Resposta recebida com sucesso");
        return response;
      } catch (apiError) {
        // Se for erro 404, tentar configurar dinamicamente
        if (
          apiError.message.includes("404") ||
          apiError.message.includes("not found")
        ) {
          console.log(
            "🔄 Modelo não encontrado, tentando descobrir modelo disponível..."
          );
          await this.setupApiUrl();

          // Tentar novamente com novo modelo
          const response = await this.callGeminiAPI(prompt);
          console.log("✅ GeminiAI: Resposta recebida com modelo alternativo");
          return response;
        }
        throw apiError;
      }
    } catch (error) {
      console.error("❌ GeminiAI: Erro detalhado ao processar pergunta:");
      console.error("   - Tipo do erro:", error.name);
      console.error("   - Mensagem:", error.message);
      console.error("   - Stack:", error.stack);

      // Retornar erro mais específico
      if (error.message.includes("fetch")) {
        throw new Error(
          "Erro de conexão com a IA. Verifique sua internet e tente novamente."
        );
      } else if (error.message.includes("API")) {
        throw new Error(
          "Erro na API da IA. Tente novamente em alguns segundos."
        );
      } else {
        throw new Error("Erro inesperado na IA: " + error.message);
      }
    }
  }

  /**
   * Construir prompt contextualizado
   * @param {string} question - Pergunta do usuário
   * @param {object} context - Dados financeiros
   * @returns {string} - Prompt formatado
   */
  buildPrompt(question, context) {
    const financialSummary = this.formatFinancialContext(context);

    return `Você é um assistente de finanças pessoais especializado em análise de dados financeiros.

CONTEXTO FINANCEIRO DO USUÁRIO:
${financialSummary}

PERGUNTA DO USUÁRIO: ${question}

INSTRUÇÕES:
1. Responda em português brasileiro
2. Seja específico e use os dados fornecidos
3. Dê insights práticos e acionáveis
4. Use valores monetários quando relevante
5. Seja conciso mas informativo (máximo 200 palavras)
6. Se não houver dados suficientes, mencione isso
7. Forneça sugestões construtivas

RESPOSTA:`;
  }

  /**
   * Formatar contexto financeiro para o prompt
   * @param {object} context - Dados financeiros
   * @returns {string} - Contexto formatado
   */
  formatFinancialContext(context) {
    if (!context || Object.keys(context).length === 0) {
      return "Nenhum dado financeiro disponível no momento.";
    }

    let summary = [];

    // Resumo geral
    if (
      context.totalReceitas !== undefined &&
      context.totalDespesas !== undefined
    ) {
      const saldo = context.totalReceitas - context.totalDespesas;
      summary.push(`💰 RESUMO FINANCEIRO:`);
      summary.push(`- Receitas: R$ ${context.totalReceitas.toFixed(2)}`);
      summary.push(`- Despesas: R$ ${context.totalDespesas.toFixed(2)}`);
      summary.push(`- Saldo: R$ ${saldo.toFixed(2)}`);
      summary.push("");
    }

    // Categorias de despesas
    if (
      context.categoriasDespesas &&
      Object.keys(context.categoriasDespesas).length > 0
    ) {
      summary.push(`📊 GASTOS POR CATEGORIA:`);
      Object.entries(context.categoriasDespesas)
        .sort(([, a], [, b]) => (b || 0) - (a || 0))
        .slice(0, 5)
        .forEach(([categoria, valor]) => {
          const valorSeguro = Number(valor) || 0;
          summary.push(`- ${categoria}: R$ ${valorSeguro.toFixed(2)}`);
        });
      summary.push("");
    }

    // Planos de economia
    if (context.planos && context.planos.length > 0) {
      summary.push(`🎯 PLANOS DE ECONOMIA:`);
      context.planos.slice(0, 3).forEach((plano) => {
        // Verificar se os valores existem e são números válidos
        const valorAtual = plano.valor_atual || 0;
        const valorObjetivo = plano.valor_objetivo || 1; // Evitar divisão por zero
        const progresso = ((valorAtual / valorObjetivo) * 100).toFixed(1);

        summary.push(
          `- ${
            plano.descricao || "Plano"
          }: ${progresso}% concluído (R$ ${valorAtual.toFixed(
            2
          )} / R$ ${valorObjetivo.toFixed(2)})`
        );
      });
      summary.push("");
    }

    // Tendências (se disponível)
    if (context.tendencias) {
      summary.push(`📈 TENDÊNCIAS:`);
      if (
        context.tendencias.receitasVariacao !== undefined &&
        context.tendencias.receitasVariacao !== null
      ) {
        const variacao = Number(context.tendencias.receitasVariacao) || 0;
        summary.push(
          `- Receitas: ${variacao > 0 ? "+" : ""}${variacao.toFixed(
            1
          )}% no período`
        );
      }
      if (
        context.tendencias.despesasVariacao !== undefined &&
        context.tendencias.despesasVariacao !== null
      ) {
        const variacao = Number(context.tendencias.despesasVariacao) || 0;
        summary.push(
          `- Despesas: ${variacao > 0 ? "+" : ""}${variacao.toFixed(
            1
          )}% no período`
        );
      }
    }

    return summary.length > 0
      ? summary.join("\n")
      : "Dados financeiros em análise...";
  }

  /**
   * Fazer chamada para a API do Gemini
   * @param {string} prompt - Prompt formatado
   * @returns {Promise<string>} - Resposta da API
   */
  async callGeminiAPI(prompt) {
    try {
      const url = `${this.baseUrl}?key=${this.apiKey}`;
      console.log("🔗 GeminiAI: Fazendo requisição para:", this.baseUrl);

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      };

      console.log(
        "📦 GeminiAI: Enviando payload (tamanho):",
        JSON.stringify(requestBody).length,
        "chars"
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "📡 GeminiAI: Status da resposta:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Gemini API Error Response:", errorData);

        // Mensagens de erro mais amigáveis
        if (response.status === 400) {
          throw new Error("Requisição inválida para a API da IA");
        } else if (response.status === 401) {
          throw new Error("Chave de API inválida");
        } else if (response.status === 403) {
          throw new Error("Acesso negado à API da IA");
        } else if (response.status === 429) {
          throw new Error(
            "Limite de requisições excedido. Tente novamente em alguns segundos"
          );
        } else if (response.status >= 500) {
          throw new Error("Servidor da IA temporariamente indisponível");
        } else {
          throw new Error(`Erro na API: ${response.status} - ${errorData}`);
        }
      }

      const data = await response.json();
      console.log("📋 GeminiAI: Estrutura da resposta:", Object.keys(data));

      if (!data.candidates || data.candidates.length === 0) {
        console.error("❌ Nenhum candidato na resposta:", data);
        throw new Error(
          "IA não conseguiu gerar uma resposta. Tente reformular sua pergunta"
        );
      }

      const candidate = data.candidates[0];

      // Verificar se a resposta foi truncada
      if (candidate.finishReason === "MAX_TOKENS") {
        console.warn("⚠️ Resposta truncada devido ao limite de tokens");
        throw new Error("Pergunta muito longa. Tente ser mais conciso.");
      }

      // Verificar outros problemas de finalização
      if (candidate.finishReason && candidate.finishReason !== "STOP") {
        console.warn("⚠️ IA parou inesperadamente:", candidate.finishReason);
        throw new Error(`IA parou de responder: ${candidate.finishReason}`);
      }

      // Verificar estrutura da resposta
      if (
        !candidate.content ||
        !candidate.content.parts ||
        !candidate.content.parts.length ||
        !candidate.content.parts[0] ||
        !candidate.content.parts[0].text
      ) {
        console.error("❌ Estrutura de resposta inválida:", candidate);
        throw new Error("Resposta da IA em formato inválido ou vazia");
      }

      const responseText = candidate.content.parts[0].text;
      console.log(
        "✅ GeminiAI: Texto da resposta (primeiros 100 chars):",
        responseText.substring(0, 100) + "..."
      );

      return responseText;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Erro de conexão. Verifique sua internet e tente novamente"
        );
      }
      throw error;
    }
  }

  /**
   * Gerar insights automáticos
   * @param {object} context - Dados financeiros
   * @returns {Promise<string>} - Insights gerados
   */
  async generateInsights(context) {
    const insightPrompts = [
      "Analise minha situação financeira atual e dê 3 insights importantes",
      "Onde posso economizar baseado nos meus gastos?",
      "Como estão meus planos de economia?",
      "Há algum padrão preocupante nos meus gastos?",
    ];

    const randomPrompt =
      insightPrompts[Math.floor(Math.random() * insightPrompts.length)];
    return await this.askQuestion(randomPrompt, context);
  }

  /**
   * Verificar se o serviço está disponível
   * @returns {boolean} - Status do serviço
   */
  isAvailable() {
    return !!this.apiKey && !this.isProcessing;
  }

  /**
   * Listar modelos disponíveis na API
   * @returns {Promise<Array>} - Lista de modelos
   */
  async listAvailableModels() {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao listar modelos: ${response.status}`);
      }

      const data = await response.json();
      console.log("📋 Modelos disponíveis:", data);

      return data.models || [];
    } catch (error) {
      console.error("❌ Erro ao listar modelos:", error);
      return [];
    }
  }

  /**
   * Encontrar melhor modelo disponível
   * @returns {Promise<string>} - Nome do modelo
   */
  async findBestAvailableModel() {
    try {
      const models = await this.listAvailableModels();

      // Procurar por modelos preferenciais em ordem de prioridade
      const preferredModels = [
        "gemini-1.5-pro-latest",
        "gemini-pro-latest",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-pro",
        "gemini-pro-vision",
        "text-bison-001",
      ];

      for (const preferred of preferredModels) {
        const foundModel = models.find(
          (model) =>
            model.name.includes(preferred) &&
            model.supportedGenerationMethods?.includes("generateContent")
        );

        if (foundModel) {
          console.log("✅ Melhor modelo encontrado:", foundModel.name);
          return foundModel.name.split("/").pop(); // Pegar apenas o nome final
        }
      }

      // Se nenhum preferencial for encontrado, pegar o primeiro disponível
      const anyModel = models.find((model) =>
        model.supportedGenerationMethods?.includes("generateContent")
      );

      if (anyModel) {
        console.log("⚠️ Usando modelo alternativo:", anyModel.name);
        return anyModel.name.split("/").pop();
      }

      throw new Error("Nenhum modelo compatível encontrado");
    } catch (error) {
      console.error("❌ Erro ao encontrar modelo:", error);
      // Fallback para modelo conhecido
      return "gemini-1.5-pro";
    }
  }

  /**
   * Configurar URL da API dinamicamente
   */
  async setupApiUrl() {
    try {
      const modelName = await this.findBestAvailableModel();
      this.baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
      console.log("🔧 URL da API configurada:", this.baseUrl);
    } catch (error) {
      console.error("❌ Erro ao configurar URL:", error);
      // Manter URL padrão se houver erro
    }
  }

  /**
   * Testar conectividade com a API
   * @returns {Promise<boolean>} - Se o teste passou
   */
  async testConnection() {
    try {
      console.log("🔍 GeminiAI: Testando conectividade...");

      const testPrompt = "Responda apenas: 'Teste OK'";
      const response = await this.callGeminiAPI(testPrompt);

      const isWorking = response && response.includes("Teste OK");
      console.log(
        isWorking
          ? "✅ GeminiAI: Teste de conectividade passou"
          : "⚠️ GeminiAI: Teste de conectividade falhou"
      );

      return isWorking;
    } catch (error) {
      console.error("❌ GeminiAI: Falha no teste de conectividade:", error);
      return false;
    }
  }

  /**
   * Obter status do processamento
   * @returns {boolean} - Se está processando
   */
  getProcessingStatus() {
    return this.isProcessing;
  }
}

// Instância global do serviço
window.GeminiAI = new GeminiAIService();

console.log("🤖 GeminiAI Service initialized successfully");
