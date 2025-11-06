// ===============================================
// Interface de Chat AI Insights - PayFly
// ===============================================

class AIInsightsInterface {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.chatHistory = [];
    this.maxMessages = 50;
  }

  /**
   * Abrir modal de AI Insights
   */
  open() {
    if (this.isOpen) return;

    const modal = document.getElementById("aiInsightsModal");
    if (!modal) {
      console.error("❌ Modal aiInsightsModal não encontrado no DOM");
      return;
    }

    try {
      modal.classList.add("active");
      this.isOpen = true;

      // Focar no input
      setTimeout(() => {
        const input = document.getElementById("aiChatInput");
        if (input) input.focus();
      }, 300);

      console.log("🤖 AI Insights modal aberto");

      // Gerar insight automático se não houver mensagens
      if (this.chatHistory.length === 0) {
        setTimeout(() => {
          this.generateAutomaticInsight();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Erro ao abrir modal:", error);
    }
  }

  /**
   * Fechar modal
   */
  close() {
    if (!this.isOpen) return;

    const modal = document.getElementById("aiInsightsModal");
    if (modal) {
      modal.classList.remove("active");
      this.isOpen = false;

      console.log("🤖 AI Insights modal fechado");
    }
  }

  /**
   * Enviar mensagem para IA
   * @param {string} message - Mensagem opcional
   */
  async sendMessage(message = null) {
    if (this.isLoading) {
      this.showToast("Aguarde a resposta anterior...", "warning");
      return;
    }

    const input = document.getElementById("aiChatInput");
    const question = message || input?.value?.trim();

    if (!question) {
      this.showToast("Digite uma pergunta primeiro!", "error");
      return;
    }

    try {
      this.setLoading(true);

      // Limpar input se foi digitado
      if (!message && input) input.value = "";

      // Adicionar mensagem do usuário
      this.addMessage("user", question);

      // Obter dados financeiros
      const financialData = await window.FinancialAnalyzer.getDataForAI();

      // Fazer pergunta para IA
      const response = await window.GeminiAI.askQuestion(
        question,
        financialData
      );

      // Adicionar resposta da IA
      this.addMessage("ai", response);

      console.log("✅ Mensagem processada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);

      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = "Desculpe, ocorreu um erro ao processar sua pergunta.";
      let toastMessage = "Erro ao processar pergunta.";

      if (
        error.message.includes("quota") ||
        error.message.includes("Limite de uso diário") ||
        error.message.includes("RESOURCE_EXHAUSTED")
      ) {
        errorMessage =
          "📅 **Limite Diário Atingido**\n\nO limite de uso da IA foi atingido por hoje. A funcionalidade estará disponível novamente amanhã.\n\n💡 **Dica:** Continue explorando seus dados financeiros através dos gráficos e relatórios do painel!";
        toastMessage = "Limite diário da IA atingido. Tente amanhã.";
      } else if (
        error.message.includes("internet") ||
        error.message.includes("conexão")
      ) {
        errorMessage =
          "Erro de conexão com a IA. Verifique sua internet e tente novamente. 🌐";
        toastMessage = "Problema de conexão. Verifique sua internet.";
      } else if (
        error.message.includes("API") ||
        error.message.includes("servidor")
      ) {
        errorMessage =
          "Serviço de IA temporariamente indisponível. Tente novamente em alguns segundos. ⏱️";
        toastMessage = "Serviço temporariamente indisponível.";
      } else if (
        error.message.includes("limite") ||
        error.message.includes("429")
      ) {
        errorMessage =
          "Muitas perguntas em pouco tempo. Aguarde alguns segundos antes de tentar novamente. ⏰";
        toastMessage = "Aguarde alguns segundos antes de tentar novamente.";
      } else {
        errorMessage = `Erro: ${error.message} Tente reformular sua pergunta. 💭`;
        toastMessage = "Tente reformular sua pergunta.";
      }

      this.addMessage("ai", errorMessage);
      this.showToast(toastMessage, "error");
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Fazer pergunta rápida
   * @param {string} question - Pergunta pré-definida
   */
  async askQuickQuestion(question) {
    console.log("🤖 Pergunta rápida:", question);
    await this.sendMessage(question);
  }

  /**
   * Gerar insight automático
   */
  async generateAutomaticInsight() {
    try {
      console.log("🤖 Gerando insight automático...");

      const financialData = await window.FinancialAnalyzer.getDataForAI();

      if (Object.keys(financialData).length === 0) {
        this.addMessage(
          "ai",
          "Ainda não encontrei dados financeiros para analisar. Cadastre algumas receitas e despesas para que eu possa te dar insights personalizados! 📊"
        );
        return;
      }

      const insight = await window.GeminiAI.generateInsights(financialData);
      this.addMessage("ai", insight);
    } catch (error) {
      console.error("❌ Erro ao gerar insight automático:", error);
      this.addMessage(
        "ai",
        "Bem-vindo! Faça uma pergunta sobre suas finanças para começarmos a análise. 💰"
      );
    }
  }

  /**
   * Adicionar mensagem ao chat
   * @param {string} type - 'user' ou 'ai'
   * @param {string} content - Conteúdo da mensagem
   */
  addMessage(type, content) {
    const messagesContainer = document.getElementById("aiChatMessages");
    if (!messagesContainer) return;

    // Limpar mensagem de boas-vindas se for a primeira interação
    if (this.chatHistory.length === 0) {
      const welcomeMsg = messagesContainer.querySelector(".ai-welcome-message");
      if (welcomeMsg) welcomeMsg.style.display = "none";
    }

    // Criar elemento da mensagem
    const messageElement = document.createElement("div");
    messageElement.className = `ai-message ai-message-${type}`;

    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageElement.innerHTML = `
      <div class="message-avatar">
        <ion-icon name="${type === "user" ? "person" : "robot"}"></ion-icon>
      </div>
      <div class="message-bubble">
        <div class="message-text">${this.formatMessage(content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    // Adicionar ao container
    messagesContainer.appendChild(messageElement);

    // Scroll para o final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Adicionar ao histórico
    this.chatHistory.push({
      type,
      content,
      timestamp: new Date(),
    });

    // Limpar histórico antigo
    if (this.chatHistory.length > this.maxMessages) {
      this.chatHistory = this.chatHistory.slice(-this.maxMessages);

      // Remover mensagens antigas do DOM
      const messages = messagesContainer.querySelectorAll(".ai-message");
      if (messages.length > this.maxMessages) {
        for (let i = 0; i < messages.length - this.maxMessages; i++) {
          messages[i].remove();
        }
      }
    }
  }

  /**
   * Formatar mensagem para HTML
   * @param {string} content - Conteúdo da mensagem
   * @returns {string} - HTML formatado
   */
  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>")
      .replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>")
      .replace(/`(.*?)`/g, "<code>$1</code>");
  }

  /**
   * Definir estado de loading
   * @param {boolean} loading - Se está carregando
   */
  setLoading(loading) {
    this.isLoading = loading;
    const loadingElement = document.getElementById("aiLoading");
    const sendBtn = document.getElementById("aiSendBtn");

    if (loadingElement) {
      loadingElement.style.display = loading ? "flex" : "none";
    }

    if (sendBtn) {
      sendBtn.disabled = loading;
      sendBtn.style.opacity = loading ? "0.5" : "1";
    }
  }

  /**
   * Mostrar toast de notificação
   * @param {string} message - Mensagem
   * @param {string} type - Tipo: 'success', 'error', 'warning'
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `ai-toast ai-toast-${type}`;
    toast.innerHTML = `
      <ion-icon name="${
        type === "success"
          ? "checkmark-circle"
          : type === "error"
          ? "alert-circle"
          : "information-circle"
      }"></ion-icon>
      <span>${message}</span>
    `;

    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#d4edda"
          : type === "error"
          ? "#f8d7da"
          : "#fff3cd"
      };
      color: ${
        type === "success"
          ? "#155724"
          : type === "error"
          ? "#721c24"
          : "#856404"
      };
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Enter no input
    const input = document.getElementById("aiChatInput");
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Fechar modal clicando fora
    const modal = document.getElementById("aiInsightsModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.close();
        }
      });
    }

    // ESC para fechar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }
}

// Instância global da interface
window.AIInsights = new AIInsightsInterface();

// Funções globais para uso nos botões
window.openAIInsights = () => window.AIInsights.open();
window.closeAIInsights = () => window.AIInsights.close();
window.sendAIMessage = () => window.AIInsights.sendMessage();
window.askQuickQuestion = (question) =>
  window.AIInsights.askQuickQuestion(question);

// Configurar event listeners quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.AIInsights.setupEventListeners();
});

// Se o DOM já estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.AIInsights.setupEventListeners();
  });
} else {
  window.AIInsights.setupEventListeners();
}

console.log("🤖 AI Insights Interface initialized successfully");
