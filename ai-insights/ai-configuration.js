// ===============================================
// Configurador de IA - Interface para Setup de API
// ===============================================

class AIConfigurationManager {
  constructor() {
    this.modal = null;
    this.isVisible = false;
    this.validationTimeout = null;
  }

  /**
   * Inicializar o configurador
   */
  init() {
    this.createModal();
    this.bindEvents();
    console.log("🔧 AIConfigurationManager: Inicializado");
  }

  /**
   * Criar modal de configuração
   */
  createModal() {
    const modalHTML = `
      <div id="aiConfigModal" class="modal-overlay" style="display: none;">
        <div class="modal-content ai-config-modal">
          <div class="modal-header">
            <h3>
              <i class="fas fa-robot"></i>
              Configuração de IA
            </h3>
            <button type="button" class="btn-close" id="closeAIConfig">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="config-section">
              <h4>Escolha seu Provedor de IA</h4>
              <p class="help-text">
                Configure sua chave API para ativar os recursos de inteligência artificial.
              </p>

              <div class="provider-selection">
                <div class="provider-option" data-provider="gemini">
                  <div class="provider-header">
                    <input type="radio" name="aiProvider" value="gemini" id="providerGemini" checked>
                    <label for="providerGemini">
                      <strong>Google Gemini</strong>
                      <span class="badge badge-recommended">Recomendado</span>
                    </label>
                  </div>
                  <p class="provider-description">
                    API gratuita do Google com 60 requisições por minuto.
                    <a href="https://makersuite.google.com/app/apikey" target="_blank">
                      Obter chave gratuita <i class="fas fa-external-link-alt"></i>
                    </a>
                  </p>
                </div>

                <div class="provider-option" data-provider="openai">
                  <div class="provider-header">
                    <input type="radio" name="aiProvider" value="openai" id="providerOpenAI">
                    <label for="providerOpenAI">
                      <strong>OpenAI GPT</strong>
                      <span class="badge badge-premium">Premium</span>
                    </label>
                  </div>
                  <p class="provider-description">
                    ChatGPT da OpenAI (requer créditos pagos).
                    <a href="https://platform.openai.com/api-keys" target="_blank">
                      Obter chave API <i class="fas fa-external-link-alt"></i>
                    </a>
                  </p>
                </div>
              </div>

              <div class="form-group">
                <label for="aiApiKey">Chave da API</label>
                <div class="input-group">
                  <input 
                    type="password" 
                    id="aiApiKey" 
                    placeholder="Cole sua chave API aqui..."
                    class="form-control"
                  >
                  <button type="button" class="btn btn-outline-secondary" id="toggleApiKeyVisibility">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
                <div class="validation-feedback" id="apiKeyValidation"></div>
                <small class="form-text text-muted">
                  Sua chave é armazenada apenas localmente e nunca enviada para nossos servidores.
                </small>
              </div>

              <div class="form-group" id="modelSelection" style="display: none;">
                <label for="aiModel">Modelo (Opcional)</label>
                <select id="aiModel" class="form-control">
                  <!-- Opções preenchidas dinamicamente -->
                </select>
                <small class="form-text text-muted">
                  Deixe em branco para usar o modelo padrão.
                </small>
              </div>

              <div class="connection-status" id="connectionStatus" style="display: none;">
                <div class="status-indicator">
                  <div class="spinner" id="testSpinner" style="display: none;"></div>
                  <i class="status-icon fas fa-check-circle text-success" id="statusSuccess" style="display: none;"></i>
                  <i class="status-icon fas fa-exclamation-triangle text-warning" id="statusWarning" style="display: none;"></i>
                  <i class="status-icon fas fa-times-circle text-danger" id="statusError" style="display: none;"></i>
                </div>
                <div class="status-message" id="statusMessage"></div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="cancelAIConfig">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" id="testConnection" disabled>
              <i class="fas fa-flask"></i>
              Testar Conexão
            </button>
            <button type="button" class="btn btn-success" id="saveAIConfig" disabled>
              <i class="fas fa-save"></i>
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.modal = document.getElementById("aiConfigModal");
  }

  /**
   * Vincular eventos
   */
  bindEvents() {
    const modal = this.modal;

    // Fechar modal
    modal
      .querySelector("#closeAIConfig")
      .addEventListener("click", () => this.hide());
    modal
      .querySelector("#cancelAIConfig")
      .addEventListener("click", () => this.hide());

    // Clique fora do modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.hide();
    });

    // Seleção de provedor
    modal.querySelectorAll('input[name="aiProvider"]').forEach((radio) => {
      radio.addEventListener("change", () => this.onProviderChange());
    });

    // Toggle visibilidade da chave
    modal
      .querySelector("#toggleApiKeyVisibility")
      .addEventListener("click", () => {
        this.toggleApiKeyVisibility();
      });

    // Validação da chave em tempo real
    modal.querySelector("#aiApiKey").addEventListener("input", () => {
      this.debounceValidation();
    });

    // Testar conexão
    modal.querySelector("#testConnection").addEventListener("click", () => {
      this.testConnection();
    });

    // Salvar configuração
    modal.querySelector("#saveAIConfig").addEventListener("click", () => {
      this.saveConfiguration();
    });

    // Escape para fechar
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isVisible) {
        this.hide();
      }
    });
  }

  /**
   * Mostrar modal
   */
  show() {
    this.modal.style.display = "flex";
    this.isVisible = true;
    this.loadCurrentConfiguration();

    // Focar no campo de chave após animação
    setTimeout(() => {
      this.modal.querySelector("#aiApiKey").focus();
    }, 300);
  }

  /**
   * Esconder modal
   */
  hide() {
    this.modal.style.display = "none";
    this.isVisible = false;
    this.resetForm();
  }

  /**
   * Mudança de provedor
   */
  onProviderChange() {
    const selectedProvider = this.modal.querySelector(
      'input[name="aiProvider"]:checked'
    ).value;
    const modelSelect = this.modal.querySelector("#aiModel");
    const modelGroup = this.modal.querySelector("#modelSelection");

    // Atualizar opções de modelo
    if (
      window.aiService &&
      window.aiService.supportedProviders[selectedProvider]
    ) {
      const models =
        window.aiService.supportedProviders[selectedProvider].models;
      modelSelect.innerHTML = '<option value="">Padrão (recomendado)</option>';

      models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });

      modelGroup.style.display = "block";
    } else {
      modelGroup.style.display = "none";
    }

    // Revalidar chave se preenchida
    const apiKey = this.modal.querySelector("#aiApiKey").value;
    if (apiKey) {
      this.debounceValidation();
    }
  }

  /**
   * Toggle visibilidade da chave API
   */
  toggleApiKeyVisibility() {
    const input = this.modal.querySelector("#aiApiKey");
    const button = this.modal.querySelector("#toggleApiKeyVisibility");
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "fas fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fas fa-eye";
    }
  }

  /**
   * Validação com debounce
   */
  debounceValidation() {
    clearTimeout(this.validationTimeout);
    this.validationTimeout = setTimeout(() => {
      this.validateApiKey();
    }, 500);
  }

  /**
   * Validar chave API
   */
  validateApiKey() {
    const apiKey = this.modal.querySelector("#aiApiKey").value.trim();
    const provider = this.modal.querySelector(
      'input[name="aiProvider"]:checked'
    ).value;
    const validation = this.modal.querySelector("#apiKeyValidation");
    const testBtn = this.modal.querySelector("#testConnection");

    if (!apiKey) {
      validation.textContent = "";
      validation.className = "validation-feedback";
      testBtn.disabled = true;
      return;
    }

    if (window.aiService && window.aiService.validateApiKey(apiKey, provider)) {
      validation.textContent = "✓ Formato da chave válido";
      validation.className = "validation-feedback text-success";
      testBtn.disabled = false;
    } else {
      validation.textContent = "✗ Formato da chave inválido";
      validation.className = "validation-feedback text-danger";
      testBtn.disabled = true;
    }
  }

  /**
   * Testar conexão
   */
  async testConnection() {
    const apiKey = this.modal.querySelector("#aiApiKey").value.trim();
    const provider = this.modal.querySelector(
      'input[name="aiProvider"]:checked'
    ).value;
    const model = this.modal.querySelector("#aiModel").value || null;

    const statusDiv = this.modal.querySelector("#connectionStatus");
    const spinner = this.modal.querySelector("#testSpinner");
    const message = this.modal.querySelector("#statusMessage");
    const saveBtn = this.modal.querySelector("#saveAIConfig");

    // Mostrar loading
    statusDiv.style.display = "flex";
    spinner.style.display = "block";
    this.hideStatusIcons();
    message.textContent = "Testando conexão...";

    try {
      const result = await window.aiService.configure(apiKey, provider, model);

      if (result.success) {
        this.showStatusIcon("success");
        message.textContent = `✓ Conexão estabelecida com ${result.provider}:${result.model}`;
        message.className = "status-message text-success";
        saveBtn.disabled = false;
      } else {
        this.showStatusIcon("error");
        message.textContent = `✗ Erro: ${result.error}`;
        message.className = "status-message text-danger";
        saveBtn.disabled = true;
      }
    } catch (error) {
      this.showStatusIcon("error");
      message.textContent = `✗ Erro inesperado: ${error.message}`;
      message.className = "status-message text-danger";
      saveBtn.disabled = true;
    } finally {
      spinner.style.display = "none";
    }
  }

  /**
   * Salvar configuração
   */
  async saveConfiguration() {
    const saveBtn = this.modal.querySelector("#saveAIConfig");
    const originalText = saveBtn.innerHTML;

    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
    saveBtn.disabled = true;

    try {
      // A configuração já foi testada e aplicada no testConnection
      if (window.aiService && window.aiService.getStatus().configured) {
        this.showNotification(
          "Configuração de IA salva com sucesso!",
          "success"
        );
        this.hide();

        // Atualizar UI se necessário
        if (window.updateAIStatus) {
          window.updateAIStatus();
        }
      } else {
        throw new Error("Configuração não foi aplicada corretamente");
      }
    } catch (error) {
      this.showNotification(`Erro ao salvar: ${error.message}`, "error");
    } finally {
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  }

  /**
   * Carregar configuração atual
   */
  loadCurrentConfiguration() {
    if (window.aiService) {
      const status = window.aiService.getStatus();
      const savedConfig = window.aiService.loadSavedConfiguration();

      if (savedConfig) {
        // Selecionar provedor salvo
        const providerRadio = this.modal.querySelector(
          `input[value="${savedConfig.provider}"]`
        );
        if (providerRadio) {
          providerRadio.checked = true;
          this.onProviderChange();

          // Selecionar modelo salvo
          const modelSelect = this.modal.querySelector("#aiModel");
          if (modelSelect && savedConfig.model) {
            modelSelect.value = savedConfig.model;
          }
        }
      }
    }
  }

  /**
   * Resetar formulário
   */
  resetForm() {
    this.modal.querySelector("#aiApiKey").value = "";
    this.modal.querySelector("#apiKeyValidation").textContent = "";
    this.modal.querySelector("#connectionStatus").style.display = "none";
    this.modal.querySelector("#testConnection").disabled = true;
    this.modal.querySelector("#saveAIConfig").disabled = true;

    // Resetar visibilidade da chave
    const input = this.modal.querySelector("#aiApiKey");
    const icon = this.modal.querySelector("#toggleApiKeyVisibility i");
    input.type = "password";
    icon.className = "fas fa-eye";
  }

  /**
   * Utilitários para ícones de status
   */
  hideStatusIcons() {
    ["statusSuccess", "statusWarning", "statusError"].forEach((id) => {
      this.modal.querySelector(`#${id}`).style.display = "none";
    });
  }

  showStatusIcon(type) {
    this.hideStatusIcons();
    const iconMap = {
      success: "statusSuccess",
      warning: "statusWarning",
      error: "statusError",
    };
    const iconId = iconMap[type];
    if (iconId) {
      this.modal.querySelector(`#${iconId}`).style.display = "block";
    }
  }

  /**
   * Mostrar notificação
   */
  showNotification(message, type = "info") {
    if (window.showToast) {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }
}

// CSS específico para o modal de configuração
const aiConfigStyles = `
<style id="aiConfigStyles">
.ai-config-modal {
  max-width: 600px;
  width: 90%;
}

.provider-selection {
  margin: 1rem 0;
}

.provider-option {
  border: 2px solid var(--gray);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all var(--transition-fast);
  cursor: pointer;
}

.provider-option:hover {
  border-color: var(--primary-color);
  background: var(--light-gray);
}

.provider-option:has(input:checked) {
  border-color: var(--primary-color);
  background: rgba(var(--primary-rgb), 0.1);
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.provider-header label {
  cursor: pointer;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
}

.provider-description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--dark-gray);
  line-height: 1.4;
}

.provider-description a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.provider-description a:hover {
  text-decoration: underline;
}

.badge-recommended {
  background: var(--success-color);
}

.badge-premium {
  background: var(--warning-color);
}

.input-group {
  display: flex;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-group .btn {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: 0;
}

.validation-feedback {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--light-gray);
  border-radius: var(--border-radius-md);
  margin-top: 1rem;
}

.status-indicator {
  position: relative;
  min-width: 24px;
  height: 24px;
}

.status-icon {
  font-size: 1.5rem;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--gray);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-message {
  flex: 1;
  font-weight: 500;
}

.help-text {
  color: var(--dark-gray);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}
</style>
`;

// Adicionar estilos ao documento
if (!document.getElementById("aiConfigStyles")) {
  document.head.insertAdjacentHTML("beforeend", aiConfigStyles);
}

// Instância global
window.aiConfigManager = new AIConfigurationManager();

// Auto-inicialização
document.addEventListener("DOMContentLoaded", () => {
  window.aiConfigManager.init();
});

console.log("⚙️ AIConfigurationManager: Módulo carregado");
