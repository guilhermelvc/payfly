// ===============================================
// Interface de Chat AI Insights - PayFly
// ===============================================

class AIInsightsInterface {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.chatHistory = [];
    this.maxMessages = 50;
    this.isFullscreen = false;
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

      // ⚠️ NÃO gerar insights automáticos para economizar quota
      // Mostrar mensagem de boas-vindas quando abrir pela primeira vez
      if (this.chatHistory.length === 0) {
        this.addMessage(
          "ai",
          "👋 **Bem-vindo ao AI Insights!**\n\n💡 Sou seu assistente financeiro pessoal. Faça perguntas como:\n\n📊 'Como estão meus gastos?'\n💰 'Onde posso economizar?'\n📈 'Qual meu patrimônio total?'\n🎯 'Estou no caminho certo para meus objetivos?'\n\n✨ Estou aqui para ajudar!"
        );
      }

      // ⚠️ Se quota foi excedida, mostrar mensagem de limite
      if (window.GeminiAI.quotaExceeded) {
        this.addMessage(
          "ai",
          "📅 **Limite Diário Atingido**\n\nO limite de uso da IA foi atingido por hoje. A funcionalidade estará disponível novamente amanhã.\n\n💡 Enquanto isso, explore seus dados através dos **gráficos** e **relatórios** do painel!"
        );
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
      modal.classList.remove("fullscreen");
      this.isFullscreen = false;
      this.isOpen = false;

      console.log("🤖 AI Insights modal fechado");
    }
  }

  /**
   * Alternar modo tela cheia dentro da página
   */
  toggleFullscreen() {
    const modalOverlay = document.getElementById("aiInsightsModal");
    const modal = modalOverlay?.querySelector(".ai-modal");

    if (!modalOverlay || !modal) {
      console.error(
        "❌ Elementos do modal de AI Insights não encontrados para tela cheia"
      );
      return;
    }

    this.isFullscreen = !this.isFullscreen;

    if (this.isFullscreen) {
      modalOverlay.classList.add("fullscreen");
      modal.classList.add("fullscreen");
    } else {
      modalOverlay.classList.remove("fullscreen");
      modal.classList.remove("fullscreen");
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

      // Mostrar indicador de loading
      this.addLoadingMessage();

      // Obter dados financeiros
      const financialData = await window.FinancialAnalyzer.getDataForAI();

      // Fazer pergunta para IA
      const response = await window.GeminiAI.askQuestion(
        question,
        financialData
      );

      // Remover loading e adicionar resposta da IA
      this.removeLoadingMessage();
      this.addMessage("ai", response);

      console.log("✅ Mensagem processada com sucesso");
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);

      // Remover loading ao ocorrer erro
      this.removeLoadingMessage();

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
        error.message.includes("429") ||
        error.message.includes("Limite de requisições")
      ) {
        errorMessage =
          "⏳ **Limite de Requisições Atingido**\n\nA IA está recebendo muitas requisições. Por favor, **aguarde alguns minutos** e tente novamente.\n\n💡 Enquanto isso, você pode explorar seus dados nos gráficos e relatórios do painel.";
        toastMessage = "Limite de requisições. Aguarde alguns minutos.";
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
    // Não permitir múltiplas perguntas simultâneas
    if (this.isLoading) {
      this.showToast("Aguarde a resposta anterior...", "warning");
      return;
    }

    console.log("🤖 Pergunta rápida:", question);
    await this.sendMessage(question);
  }

  /**
   * Gerar insight automático
   */
  async generateAutomaticInsight() {
    console.warn(
      "⚠️ generateAutomaticInsight() foi descontinuado para economizar quota da API"
    );
    this.addMessage(
      "ai",
      "⚠️ Geração automática de insights foi desabilitada para economizar quota da API.\n\nFaça uma pergunta específica para começarmos a análise! 💡"
    );
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
   * Adicionar mensagem de loading
   */
  addLoadingMessage() {
    const messagesContainer = document.getElementById("aiChatMessages");
    if (!messagesContainer) return;

    // Remover loading anterior se existir
    this.removeLoadingMessage();

    const loadingElement = document.createElement("div");
    loadingElement.className = "ai-message ai-message-ai ai-loading-message";
    loadingElement.id = "ai-loading-msg";

    const timestamp = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    loadingElement.innerHTML = `
      <div class="message-avatar">
        <ion-icon name="sparkles"></ion-icon>
      </div>
      <div class="message-bubble">
        <div class="message-text">
          <div class="ai-typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p style="margin-top: 8px; color: #888; font-size: 0.85em;">Analisando seus dados financeiros...</p>
        </div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    messagesContainer.appendChild(loadingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Remover mensagem de loading
   */
  removeLoadingMessage() {
    const loadingMsg = document.getElementById("ai-loading-msg");
    if (loadingMsg) {
      loadingMsg.remove();
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
    const input = document.getElementById("aiChatInput");
    const quickQuestionBtns = document.querySelectorAll(".quick-question-btn");

    if (loadingElement) {
      loadingElement.style.display = loading ? "flex" : "none";
    }

    if (sendBtn) {
      sendBtn.disabled = loading;
      sendBtn.style.opacity = loading ? "0.5" : "1";
    }

    // Desabilitar input e botões de perguntas rápidas durante loading
    if (input) {
      input.disabled = loading;
    }

    quickQuestionBtns.forEach((btn) => {
      btn.disabled = loading;
      btn.style.opacity = loading ? "0.5" : "1";
      btn.style.cursor = loading ? "not-allowed" : "pointer";
    });
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
window.toggleAIInsightsFullscreen = () => window.AIInsights.toggleFullscreen();

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
