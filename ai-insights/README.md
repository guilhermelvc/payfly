# 🤖 AI Insights - Módulo de Inteligência Artificial

## 📋 O que é?

O módulo **AI Insights** é o coração inteligente do PayFly. Ele utiliza a API do **Google Gemini** para analisar dados financeiros em tempo real e fornecer insights, recomendações e respostas personalizadas para perguntas do usuário.

## 🎯 Para que serve?

-   **Análise de Gastos**: Identifica padrões de gastos e oportunidades de economia
-   **Recomendações Personalizadas**: Sugere ações baseadas no comportamento financeiro
-   **Respostas a Perguntas**: Interpreta perguntas naturais sobre finanças
-   **Categorização Inteligente**: Sugere categorias para transações automaticamente
-   **Relatórios Financeiros**: Gera resumos e análises de patrimônio

## 🏗️ Estrutura de Arquivos

```
ai-insights/
├── README.md                      # Este arquivo
├── ai-service.js                  # Conexão com API Gemini
├── ai-configuration.js            # Configurações e constantes
├── data-analyzer.js               # Analisa dados financeiros
├── chat-interface.js              # Interface de chat com IA
├── smart-categorization.js        # Sugestões de categorias
└── categorization-ui.js           # UI para categorização
```

## 🔧 Como Funciona?

### 1. **ai-service.js** - Comunicação com IA

```javascript
// Faz requisições para Google Gemini API
class GeminiAI {
    async askQuestion(question, financialData) {
        // Envia pergunta + dados financeiros para IA
        // Processa resposta e trata erros
    }
}
```

**Por quê Gemini?**

-   Modelo mais recente e eficiente do Google
-   Bom custo-benefício
-   Excelente em análise de texto e padrões

### 2. **data-analyzer.js** - Análise de Dados

```javascript
// Coleta e processa dados financeiros
class FinancialAnalyzer {
    async getDataForAI() {
        // Busca receitas, despesas, investimentos
        // Calcula totais, categorias, períodos
        // Formata dados para IA entender
    }
}
```

**O que coleta:**

-   Receitas (últimos 30, 90, 365 dias)
-   Despesas por categoria
-   Investimentos e patrimônio
-   Planos e metas
-   Poupança

### 3. **chat-interface.js** - Interface de Chat

```javascript
// Gerencia a interface do usuário
class AIInsightsInterface {
    async sendMessage(message) {
        this.addLoadingMessage(); // Mostra loading
        const response = await api.ask(message, data);
        this.addMessage("ai", response); // Mostra resposta
    }
}
```

**Recursos:**

-   Suporte a múltiplas mensagens (chat)
-   Indicador de loading visual
-   Proteção contra duplos cliques
-   Histórico de conversas

### 4. **smart-categorization.js** - Categorização Inteligente

```javascript
// Sugere categorias para transações
async function suggestCategory(description) {
    // Envia descrição da transação para IA
    // Retorna categoria sugerida com confiança
}
```

**Exemplo:**

-   Descrição: "Padaria Pão Quente"
-   Categoria sugerida: "Alimentação" (92% confiança)

## 🔄 Fluxo de Funcionamento

```
Usuário digita pergunta
    ↓
ChatInterface captura input
    ↓
Mostra indicador de LOADING
    ↓
FinancialAnalyzer coleta dados do Supabase
    ↓
AIService envia para Google Gemini API
    ↓
Gemini processa e retorna resposta
    ↓
Mostra resposta formatada no chat
    ↓
Remove indicador de LOADING
```

## ⚙️ Configuração

### arquivo: **ai-configuration.js**

```javascript
const AI_CONFIG = {
    MAX_INPUT_LENGTH: 200, // Limite de caracteres
    API_TIMEOUT: 30000, // Timeout em ms
    RETRY_ATTEMPTS: 3, // Tentativas de reconexão
    DAILY_QUOTA: 100, // Limite diário de requisições
    MODEL: "gemini-2.0-flash", // Modelo da IA
};
```

## 🛡️ Tratamento de Erros

O módulo trata automaticamente:

-   ❌ Limite diário atingido
-   ❌ Erro de conexão
-   ❌ Timeout da API
-   ❌ Limite de requisições (429)
-   ❌ Erros de servidor

Cada erro exibe mensagem amigável ao usuário.

## 📊 Integração com Dados

A IA recebe um JSON estruturado com:

```json
{
  "usuario": { "id": "...", "nome": "..." },
  "receitas": { "total": 5000, "categorias": {...} },
  "despesas": { "total": 2000, "por_categoria": {...} },
  "investimentos": { "total": 15000 },
  "planos": { "total": 50000, "progresso": 45 },
  "poupanca": { "total": 8000 },
  "periodo": "últimos 30 dias"
}
```

## 🚀 Motivo da Escolha

✅ **Modular**: Fácil de manter e expandir
✅ **Escalável**: Suporta múltiplas IA (pode adicionar ChatGPT, Claude, etc)
✅ **Econômico**: Google Gemini tem ótimo custo-benefício
✅ **Eficiente**: Processa grandes volumes de dados rapidamente
✅ **Seguro**: Respeita limites de quota e erro handling

## 📝 Exemplo de Uso

```html
<!-- No HTML -->
<button onclick="AIInsights.open()">💡 AI Insights</button>

<!-- No JavaScript -->
// Perguntas rápidas await AIInsights.askQuickQuestion("Como estão meus
gastos?"); // Pergunta customizada await AIInsights.sendMessage("Devo aumentar
meus investimentos?");
```

## 🔐 Limitações e Quotas

-   **100 requisições/dia** por usuário (limite Google Gemini)
-   **200 caracteres** máximo por mensagem
-   **30 segundos** de timeout por requisição
-   **3 tentativas** de reconexão automática

## 🎨 Interface Visual

-   Modal flutuante com chat
-   Animação de digitação
-   Timestamps em português
-   Avatares (usuário 👤 / IA 🤖)
-   Mensagens formatadas com Markdown

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
