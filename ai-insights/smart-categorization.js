// ===============================================
// Sistema de Categorização Inteligente - PayFly
// ===============================================

class SmartCategorizationSystem {
  constructor() {
    this.categories = {
      receita: [
        {
          name: "Salário",
          keywords: [
            "salario",
            "salário",
            "ordenado",
            "vencimento",
            "pagamento trabalho",
            "empresa",
          ],
          confidence: 0.9,
        },
        {
          name: "Freelance",
          keywords: [
            "freelance",
            "freela",
            "trabalho extra",
            "projeto",
            "consultoria",
            "99jobs",
            "upwork",
          ],
          confidence: 0.85,
        },
        {
          name: "Investimentos",
          keywords: [
            "dividendos",
            "rendimento",
            "investimento",
            "ações",
            "fundo",
            "tesouro",
            "cdb",
            "lci",
          ],
          confidence: 0.9,
        },
        {
          name: "Vendas",
          keywords: [
            "venda",
            "mercado livre",
            "olx",
            "shopee",
            "amazon",
            "loja",
            "comércio",
          ],
          confidence: 0.8,
        },
        {
          name: "Bônus",
          keywords: [
            "bonus",
            "bônus",
            "13°",
            "decimo terceiro",
            "gratificação",
            "comissão",
            "premio",
          ],
          confidence: 0.85,
        },
      ],
      despesa: [
        {
          name: "Alimentação",
          keywords: [
            "ifood",
            "uber eats",
            "mercado",
            "supermercado",
            "restaurante",
            "lanche",
            "comida",
            "padaria",
            "açougue",
            "hortifruti",
            "mcdonalds",
            "burger king",
            "kfc",
          ],
          confidence: 0.9,
        },
        {
          name: "Transporte",
          keywords: [
            "uber",
            "99",
            "taxi",
            "ônibus",
            "metro",
            "gasolina",
            "combustivel",
            "estacionamento",
            "pedágio",
            "ipva",
            "multa",
            "carro",
            "moto",
          ],
          confidence: 0.85,
        },
        {
          name: "Moradia",
          keywords: [
            "aluguel",
            "condominio",
            "iptu",
            "luz",
            "energia",
            "água",
            "gás",
            "internet",
            "limpeza",
            "manutenção",
            "reforma",
          ],
          confidence: 0.9,
        },
        {
          name: "Saúde",
          keywords: [
            "farmacia",
            "drogaria",
            "hospital",
            "médico",
            "consulta",
            "exame",
            "remedio",
            "plano saude",
            "unimed",
            "bradesco saude",
            "amil",
          ],
          confidence: 0.9,
        },
        {
          name: "Educação",
          keywords: [
            "escola",
            "faculdade",
            "curso",
            "livro",
            "material escolar",
            "mensalidade",
            "udemy",
            "coursera",
            "alura",
          ],
          confidence: 0.85,
        },
        {
          name: "Lazer",
          keywords: [
            "cinema",
            "teatro",
            "show",
            "viagem",
            "hotel",
            "parque",
            "diversão",
            "jogo",
            "entretenimento",
            "festa",
          ],
          confidence: 0.8,
        },
        {
          name: "Roupas",
          keywords: [
            "roupa",
            "sapato",
            "tênis",
            "camisa",
            "calça",
            "vestido",
            "zara",
            "c&a",
            "renner",
            "riachuelo",
            "nike",
            "adidas",
          ],
          confidence: 0.85,
        },
        {
          name: "Tecnologia",
          keywords: [
            "celular",
            "computador",
            "notebook",
            "fone",
            "carregador",
            "cabo",
            "eletrônicos",
            "apple",
            "samsung",
            "xiaomi",
          ],
          confidence: 0.85,
        },
        {
          name: "Impostos",
          keywords: [
            "imposto",
            "taxa",
            "irpf",
            "iptu",
            "ipva",
            "darf",
            "receita federal",
            "governo",
          ],
          confidence: 0.9,
        },
      ],
      plano: [
        {
          name: "Streaming",
          keywords: [
            "netflix",
            "spotify",
            "amazon prime",
            "disney+",
            "youtube premium",
            "apple music",
            "deezer",
            "paramount+",
          ],
          confidence: 0.95,
        },
        {
          name: "Academia",
          keywords: [
            "academia",
            "smart fit",
            "bio ritmo",
            "bodytech",
            "musculação",
            "pilates",
            "yoga",
          ],
          confidence: 0.9,
        },
        {
          name: "Software",
          keywords: [
            "adobe",
            "microsoft office",
            "canva",
            "dropbox",
            "google drive",
            "software",
            "app premium",
          ],
          confidence: 0.85,
        },
        {
          name: "Seguros",
          keywords: [
            "seguro",
            "bradesco seguros",
            "porto seguro",
            "mapfre",
            "seguro auto",
            "seguro vida",
          ],
          confidence: 0.9,
        },
        {
          name: "Telefonia",
          keywords: [
            "vivo",
            "tim",
            "claro",
            "oi",
            "telefone",
            "celular plano",
            "internet móvel",
          ],
          confidence: 0.9,
        },
        {
          name: "Internet",
          keywords: [
            "internet",
            "vivo fibra",
            "net",
            "oi fibra",
            "tim fibra",
            "banda larga",
          ],
          confidence: 0.9,
        },
      ],
    };

    this.loadUserPreferences();
  }

  // Carrega preferências do usuário para melhorar a IA
  loadUserPreferences() {
    try {
      const preferences = localStorage.getItem("payfly_category_preferences");
      if (preferences) {
        this.userPreferences = JSON.parse(preferences);
      } else {
        this.userPreferences = {};
      }
    } catch (error) {
      console.log("Erro ao carregar preferências:", error);
      this.userPreferences = {};
    }
  }

  // Salva preferências do usuário
  saveUserPreferences() {
    try {
      localStorage.setItem(
        "payfly_category_preferences",
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.log("Erro ao salvar preferências:", error);
    }
  }

  // Função principal de categorização com IA
  suggestCategory(description, amount, type = "despesa") {
    if (!description || !type) {
      return { category: "Outros", confidence: 0.1, suggestions: [] };
    }

    const cleanDescription = this.cleanText(description);
    const categoriesForType = this.categories[type] || [];

    let bestMatch = { name: "Outros", confidence: 0 };
    let allSuggestions = [];

    // Verificar preferências do usuário primeiro
    const userMatch = this.checkUserPreferences(cleanDescription);
    if (userMatch && userMatch.confidence > 0.7) {
      bestMatch = userMatch;
    } else {
      // Análise por palavras-chave
      for (const category of categoriesForType) {
        const confidence = this.calculateConfidence(
          cleanDescription,
          category.keywords
        );

        if (confidence > 0) {
          allSuggestions.push({
            name: category.name,
            confidence: confidence * category.confidence,
            reason: "Palavras-chave encontradas",
          });

          if (confidence * category.confidence > bestMatch.confidence) {
            bestMatch = {
              name: category.name,
              confidence: confidence * category.confidence,
            };
          }
        }
      }
    }

    // Análise por valor (para despesas)
    if (type === "despesa") {
      const valueBasedSuggestion = this.suggestByValue(amount);
      if (valueBasedSuggestion) {
        allSuggestions.push(valueBasedSuggestion);
        if (valueBasedSuggestion.confidence > bestMatch.confidence) {
          bestMatch = valueBasedSuggestion;
        }
      }
    }

    // Ordenar sugestões por confiança
    allSuggestions.sort((a, b) => b.confidence - a.confidence);

    return {
      category: bestMatch.name,
      confidence: bestMatch.confidence,
      suggestions: allSuggestions.slice(0, 3), // Top 3 sugestões
    };
  }

  // Limpa e normaliza texto
  cleanText(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/g, " ") // Remove pontuação
      .replace(/\s+/g, " ") // Normaliza espaços
      .trim();
  }

  // Calcula confiança baseada em palavras-chave
  calculateConfidence(text, keywords) {
    let matches = 0;
    let totalWeight = 0;

    for (const keyword of keywords) {
      const cleanKeyword = this.cleanText(keyword);
      if (text.includes(cleanKeyword)) {
        matches++;
        totalWeight += keyword.length; // Palavras maiores têm mais peso
      }
    }

    if (matches === 0) return 0;

    // Fórmula de confiança: (matches / total) * (peso das palavras / texto)
    const matchRatio = matches / keywords.length;
    const weightRatio = Math.min(totalWeight / text.length, 1);

    return matchRatio * 0.7 + weightRatio * 0.3;
  }

  // Verifica preferências aprendidas do usuário
  checkUserPreferences(text) {
    for (const [description, category] of Object.entries(
      this.userPreferences
    )) {
      const similarity = this.calculateSimilarity(text, description);
      if (similarity > 0.8) {
        return {
          name: category,
          confidence: similarity,
          reason: "Baseado no seu histórico",
        };
      }
    }
    return null;
  }

  // Sugere categoria baseada no valor (para despesas)
  suggestByValue(amount) {
    const value = parseFloat(amount);
    if (isNaN(value)) return null;

    if (value <= 20) {
      return {
        name: "Alimentação",
        confidence: 0.6,
        reason: "Valor típico de alimentação",
      };
    } else if (value >= 500 && value <= 2000) {
      return {
        name: "Moradia",
        confidence: 0.5,
        reason: "Valor típico de moradia",
      };
    } else if (value >= 50 && value <= 200) {
      return {
        name: "Transporte",
        confidence: 0.4,
        reason: "Valor típico de transporte",
      };
    }

    return null;
  }

  // Calcula similaridade entre textos
  calculateSimilarity(text1, text2) {
    const words1 = text1.split(" ");
    const words2 = text2.split(" ");
    const commonWords = words1.filter((word) => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Aprende com a escolha do usuário
  learnFromUserChoice(description, chosenCategory) {
    const cleanDescription = this.cleanText(description);
    this.userPreferences[cleanDescription] = chosenCategory;
    this.saveUserPreferences();

    console.log(`🤖 IA aprendeu: "${description}" → "${chosenCategory}"`);
  }

  // Obtém todas as categorias disponíveis por tipo
  getAvailableCategories(type) {
    const categories = this.categories[type] || [];
    return categories.map((cat) => cat.name).concat(["Outros"]);
  }

  // Obtém categorias personalizadas do usuário (será integrado com Supabase)
  async getUserCustomCategories(type) {
    try {
      const { data: categorias } = await window.supabase
        .from("categorias")
        .select("nome, icone, cor")
        .or(`tipo.eq.${type},tipo.eq.todas`)
        .or(
          "e_padrao.eq.true,usuario_id.eq." +
            (
              await window.supabase.auth.getUser()
            ).data.user?.id
        )
        .order("e_padrao", { ascending: false })
        .order("nome");

      return categorias || [];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return this.getAvailableCategories(type).map((name) => ({
        nome: name,
        icone: "📁",
        cor: "#667eea",
      }));
    }
  }

  // Cria uma nova categoria personalizada
  async createCustomCategory(name, type, icon = "📁", color = "#667eea") {
    try {
      const user = await window.supabase.auth.getUser();
      if (!user.data.user) throw new Error("Usuário não autenticado");

      const { data, error } = await window.supabase.from("categorias").insert({
        usuario_id: user.data.user.id,
        nome: name,
        icone: icon,
        cor: color,
        tipo: type,
        e_padrao: false,
      });

      if (error) throw error;

      console.log(`✅ Categoria "${name}" criada com sucesso`);
      return data;
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      throw error;
    }
  }
}

// Instância global do sistema de categorização
window.SmartCategorization = new SmartCategorizationSystem();

// Funções globais para uso nos modais
window.suggestCategoryAI = (description, amount, type) => {
  return window.SmartCategorization.suggestCategory(description, amount, type);
};

window.learnCategoryChoice = (description, category) => {
  window.SmartCategorization.learnFromUserChoice(description, category);
};

window.getCategories = async (type) => {
  return await window.SmartCategorization.getUserCustomCategories(type);
};

window.createCategory = async (name, type, icon, color) => {
  return await window.SmartCategorization.createCustomCategory(
    name,
    type,
    icon,
    color
  );
};

console.log(
  "🤖 Sistema de Categorização Inteligente inicializado com sucesso!"
);
