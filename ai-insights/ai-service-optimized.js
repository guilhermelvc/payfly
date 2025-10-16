// ===============================================
// Serviço de Integração com IA - Otimizado
// ===============================================

class AIService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = null;
    this.model = null;
    this.isConfigured = false;
    this.isProcessing = false;
    this.supportedProviders = {
      gemini: {
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
        models: ["gemini-pro", "gemini-pro-latest", "gemini-1.5-flash"],
        keyPattern: /^AIza[0-9A-Za-z-_]{35}$/,
      },
      openai: {
        baseUrl: "https://api.openai.com/v1/chat/completions",
        models: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"],
        keyPattern: /^sk-[a-zA-Z0-9]{48}$/,
      },
    };
  }

  /**
   * Configurar o serviço com chave API dinâmica
   * @param {string} apiKey - Chave da API
   * @param {string} provider - Provedor (gemini, openai)
   * @param {string} model - Modelo específico (opcional)
   */
  async configure(apiKey, provider = "gemini", model = null) {
    try {
      console.log(`🔧 AIService: Configurando provider ${provider}...`);

      if (!apiKey || !this.validateApiKey(apiKey, provider)) {
        throw new Error(`Chave API inválida para o provider ${provider}`);
      }

      this.apiKey = apiKey;
      this.provider = provider;
      this.model = model || this.supportedProviders[provider].models[0];

      await this.setupProvider();

      // Testar configuração
      const testResult = await this.testConnection();
      if (!testResult.success) {
        throw new Error(`Falha no teste de conexão: ${testResult.error}`);
      }

      this.isConfigured = true;
      console.log(
        `✅ AIService: Configurado com sucesso - ${provider}:${this.model}`
      );

      // Salvar configuração localmente (sem a chave)
      this.saveConfiguration(provider, this.model);

      return { success: true, provider, model: this.model };
    } catch (error) {
      console.error("❌ AIService: Erro na configuração:", error);
      this.isConfigured = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar formato da chave API
   */
  validateApiKey(apiKey, provider) {
    const pattern = this.supportedProviders[provider]?.keyPattern;
    if (!pattern) return false;
    return pattern.test(apiKey);
  }

  /**
   * Configurar provider específico
   */
  async setupProvider() {
    const config = this.supportedProviders[this.provider];

    if (this.provider === "gemini") {
      this.baseUrl = `${config.baseUrl}/${this.model}:generateContent`;
    } else if (this.provider === "openai") {
      this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Testar conexão com o serviço
   */
  async testConnection() {
    try {
      const testPrompt = "Teste de conexão - responda apenas 'OK'";

      if (this.provider === "gemini") {
        const response = await this.callGeminiAPI(testPrompt);
        return { success: true, response };
      } else if (this.provider === "openai") {
        const response = await this.callOpenAIAPI(testPrompt);
        return { success: true, response };
      }

      return { success: false, error: "Provider não suportado" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Fazer pergunta para a IA
   * @param {string} question - Pergunta do usuário
   * @param {object} context - Contexto financeiro do usuário
   * @returns {Promise<string>} - Resposta da IA
   */
  async askQuestion(question, context = {}) {
    if (!this.isConfigured) {
      throw new Error("Serviço AI não configurado. Use configure() primeiro.");
    }

    if (this.isProcessing) {
      throw new Error("Já existe uma consulta em processamento. Aguarde.");
    }

    try {
      this.isProcessing = true;
      console.log(
        `🤖 AIService: Processando pergunta via ${this.provider}:`,
        question
      );

      const prompt = this.buildPrompt(question, context);

      let response;
      if (this.provider === "gemini") {
        response = await this.callGeminiAPI(prompt);
      } else if (this.provider === "openai") {
        response = await this.callOpenAIAPI(prompt);
      } else {
        throw new Error("Provider não suportado");
      }

      console.log("✅ AIService: Resposta recebida com sucesso");
      return response;
    } catch (error) {
      console.error("❌ AIService: Erro na consulta:", error);

      // Tentar reconfiguração automática se for erro de modelo
      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        await this.autoReconfigure();
        // Tentar novamente
        return await this.askQuestion(question, context);
      }

      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Chamar API do Gemini
   */
  async callGeminiAPI(prompt) {
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
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
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
      ],
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API Error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Resposta inválida da API Gemini");
    }

    return data.candidates[0].content.parts[0].text;
  }

  /**
   * Chamar API do OpenAI
   */
  async callOpenAIAPI(prompt) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Você é um consultor financeiro especializado em análise de dados pessoais.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenAI API Error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Resposta inválida da API OpenAI");
    }

    return data.choices[0].message.content;
  }

  /**
   * Tentar reconfiguração automática
   */
  async autoReconfigure() {
    console.log("🔄 AIService: Tentando reconfiguração automática...");

    if (this.provider === "gemini") {
      const models = this.supportedProviders.gemini.models;
      const currentIndex = models.indexOf(this.model);
      const nextModel = models[(currentIndex + 1) % models.length];

      console.log(`🔄 Tentando modelo alternativo: ${nextModel}`);
      this.model = nextModel;
      await this.setupProvider();
    }
  }

  /**
   * Construir prompt contextualizado
   */
  buildPrompt(question, context) {
    const currentDate = new Date().toLocaleDateString("pt-BR");

    let prompt = `Você é um consultor financeiro pessoal especializado em análise de dados.
Data atual: ${currentDate}

CONTEXTO FINANCEIRO DO USUÁRIO:
`;

    // Adicionar dados de receitas
    if (context.receitas && context.receitas.length > 0) {
      const totalReceitas = context.receitas.reduce(
        (sum, item) => sum + (parseFloat(item.valor) || 0),
        0
      );
      prompt += `
📈 RECEITAS (Total: R$ ${totalReceitas.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}):
`;
      context.receitas.slice(0, 10).forEach((receita) => {
        prompt += `- ${receita.descricao}: R$ ${parseFloat(
          receita.valor || 0
        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${
          receita.categoria || "Sem categoria"
        })
`;
      });
    }

    // Adicionar dados de despesas
    if (context.despesas && context.despesas.length > 0) {
      const totalDespesas = context.despesas.reduce(
        (sum, item) => sum + (parseFloat(item.valor) || 0),
        0
      );
      prompt += `
📉 DESPESAS (Total: R$ ${totalDespesas.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}):
`;
      context.despesas.slice(0, 10).forEach((despesa) => {
        prompt += `- ${despesa.descricao}: R$ ${parseFloat(
          despesa.valor || 0
        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${
          despesa.categoria || "Sem categoria"
        })
`;
      });
    }

    // Adicionar dados de investimentos
    if (context.investimentos && context.investimentos.length > 0) {
      const totalInvestimentos = context.investimentos.reduce(
        (sum, item) => sum + (parseFloat(item.valor_atual) || 0),
        0
      );
      prompt += `
💰 INVESTIMENTOS (Total: R$ ${totalInvestimentos.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })}):
`;
      context.investimentos.slice(0, 5).forEach((inv) => {
        prompt += `- ${inv.nome}: R$ ${parseFloat(
          inv.valor_atual || 0
        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (${
          inv.tipo || "Tipo não especificado"
        })
`;
      });
    }

    prompt += `

PERGUNTA DO USUÁRIO: ${question}

INSTRUÇÕES:
1. Analise os dados financeiros fornecidos
2. Responda em português brasileiro
3. Seja específico e use os números reais do contexto
4. Forneça conselhos práticos e actionáveis
5. Use formatação clara com emojis para melhor legibilidade
6. Mantenha tom profissional mas acessível
7. Se não houver dados suficientes, mencione isso e peça mais informações

Resposta:`;

    return prompt;
  }

  /**
   * Salvar configuração local (sem chave API)
   */
  saveConfiguration(provider, model) {
    try {
      const config = {
        provider,
        model,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem("payfly_ai_config", JSON.stringify(config));
    } catch (error) {
      console.warn("Não foi possível salvar configuração local:", error);
    }
  }

  /**
   * Carregar configuração salva
   */
  loadSavedConfiguration() {
    try {
      const saved = localStorage.getItem("payfly_ai_config");
      if (saved) {
        const config = JSON.parse(saved);
        // Verificar se não expirou (30 dias)
        const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        if (config.timestamp > thirtyDaysAgo) {
          return config;
        }
      }
    } catch (error) {
      console.warn("Erro ao carregar configuração salva:", error);
    }
    return null;
  }

  /**
   * Gerar insights automáticos
   */
  async generateInsights(financialData) {
    if (!this.isConfigured) {
      return {
        success: false,
        error: "Serviço AI não configurado",
      };
    }

    try {
      const context = {
        receitas: financialData.receitas || [],
        despesas: financialData.despesas || [],
        investimentos: financialData.investimentos || [],
      };

      const question = `Analise minha situação financeira atual e forneça 3 insights principais sobre:
1. Padrões de gastos
2. Oportunidades de economia
3. Sugestões de investimento

Por favor, seja específico com os números e categorias dos meus dados.`;

      const insights = await this.askQuestion(question, context);

      return {
        success: true,
        insights: insights,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Obter status do serviço
   */
  getStatus() {
    return {
      configured: this.isConfigured,
      processing: this.isProcessing,
      provider: this.provider || null,
      model: this.model || null,
      supportedProviders: Object.keys(this.supportedProviders),
    };
  }
}

// Instância global do serviço
window.aiService = new AIService();

// Auto-carregar configuração salva na inicialização
document.addEventListener("DOMContentLoaded", () => {
  const savedConfig = window.aiService.loadSavedConfiguration();
  if (savedConfig) {
    console.log(
      "📁 Configuração AI salva encontrada:",
      savedConfig.provider,
      savedConfig.model
    );
    // Não carrega automaticamente - usuário precisa fornecer chave API
  }
});

console.log("🤖 AIService: Módulo otimizado carregado");
