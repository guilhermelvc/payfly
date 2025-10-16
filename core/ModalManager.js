// ================ Modal Manager - Sistema de modais unificado ================
/**
 * Gerenciador centralizado de modais que elimina a duplicação de código
 * Substitui múltiplos sistemas de modal espalhados pelos models
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.modalStack = [];

    console.log("🪟 ModalManager inicializado");
    this.setupGlobalStyles();
    this.setupGlobalEventListeners();
  }

  /**
   * Registra um novo modal no sistema
   */
  registerModal(modalId, config) {
    const modal = {
      id: modalId,
      title: config.title || "Modal",
      size: config.size || "medium", // small, medium, large, fullscreen
      fields: config.fields || [],
      actions: config.actions || [],
      onSubmit: config.onSubmit || null,
      onCancel: config.onCancel || null,
      entityName: config.entityName || null,
      element: null,
    };

    this.modals.set(modalId, modal);
    this.createModalElement(modal);

    console.log(`🪟 Modal registrado: ${modalId}`);
    return modal;
  }

  /**
   * Cria elemento HTML do modal
   */
  createModalElement(modal) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-overlay-${modal.id}">
        <div class="modal-container modal-${modal.size}">
          <div class="modal-header">
            <h3 class="modal-title">${modal.title}</h3>
            <button class="modal-close" onclick="modalManager.closeModal('${
              modal.id
            }')">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body" id="modal-body-${modal.id}">
            ${this.generateModalFields(modal)}
          </div>
          <div class="modal-footer">
            ${this.generateModalActions(modal)}
          </div>
        </div>
      </div>
    `;

    // Remove modal existente se houver
    const existingModal = document.getElementById(`modal-overlay-${modal.id}`);
    if (existingModal) {
      existingModal.remove();
    }

    // Adiciona novo modal ao documento
    const modalElement = document.createElement("div");
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);

    modal.element = document.getElementById(`modal-overlay-${modal.id}`);
  }

  /**
   * Gera campos do formulário do modal
   */
  generateModalFields(modal) {
    if (!modal.fields.length) return "<p>Nenhum campo configurado</p>";

    let fieldsHTML =
      '<form class="modal-form" id="modal-form-' + modal.id + '">';

    modal.fields.forEach((field) => {
      fieldsHTML += `
        <div class="form-group">
          <label for="modal-${modal.id}-${field.name}">${field.label}:</label>
          ${this.generateFieldInput(modal.id, field)}
          ${field.required ? '<span class="required-indicator">*</span>' : ""}
        </div>
      `;
    });

    fieldsHTML += "</form>";
    return fieldsHTML;
  }

  /**
   * Gera input apropriado para o campo
   */
  generateFieldInput(modalId, field) {
    const inputId = `modal-${modalId}-${field.name}`;
    const commonAttrs = `id="${inputId}" name="${field.name}" class="form-input"`;
    const required = field.required ? "required" : "";

    switch (field.type) {
      case "text":
        return `<input type="text" ${commonAttrs} placeholder="${
          field.placeholder || ""
        }" ${required}>`;

      case "email":
        return `<input type="email" ${commonAttrs} placeholder="${
          field.placeholder || ""
        }" ${required}>`;

      case "password":
        return `<input type="password" ${commonAttrs} placeholder="${
          field.placeholder || ""
        }" ${required}>`;

      case "number":
        const min = field.min !== undefined ? `min="${field.min}"` : "";
        const max = field.max !== undefined ? `max="${field.max}"` : "";
        const step = field.step || "0.01";
        return `<input type="number" ${commonAttrs} step="${step}" ${min} ${max} placeholder="${
          field.placeholder || ""
        }" ${required}>`;

      case "date":
        return `<input type="date" ${commonAttrs} ${required}>`;

      case "datetime-local":
        return `<input type="datetime-local" ${commonAttrs} ${required}>`;

      case "select":
        const options = field.options || [];
        const optionsHTML = options
          .map((opt) => {
            const value = typeof opt === "object" ? opt.value : opt;
            const label = typeof opt === "object" ? opt.label : opt;
            return `<option value="${value}">${label}</option>`;
          })
          .join("");
        return `
          <select ${commonAttrs} ${required}>
            <option value="">Selecione...</option>
            ${optionsHTML}
          </select>
        `;

      case "textarea":
        const rows = field.rows || 3;
        return `<textarea ${commonAttrs} rows="${rows}" placeholder="${
          field.placeholder || ""
        }" ${required}></textarea>`;

      case "checkbox":
        return `
          <div class="checkbox-wrapper">
            <input type="checkbox" ${commonAttrs} ${required}>
            <label for="${inputId}" class="checkbox-label">${
          field.checkboxLabel || field.label
        }</label>
          </div>
        `;

      case "radio":
        const radioOptions = field.options || [];
        return radioOptions
          .map((opt, index) => {
            const value = typeof opt === "object" ? opt.value : opt;
            const label = typeof opt === "object" ? opt.label : opt;
            const radioId = `${inputId}-${index}`;
            return `
            <div class="radio-wrapper">
              <input type="radio" id="${radioId}" name="${field.name}" value="${value}" class="form-input" ${required}>
              <label for="${radioId}" class="radio-label">${label}</label>
            </div>
          `;
          })
          .join("");

      default:
        return `<input type="text" ${commonAttrs} placeholder="${
          field.placeholder || ""
        }" ${required}>`;
    }
  }

  /**
   * Gera botões de ação do modal
   */
  generateModalActions(modal) {
    let actionsHTML = "";

    // Ações customizadas
    modal.actions.forEach((action) => {
      const btnClass = `btn-${action.type || "secondary"}`;
      actionsHTML += `
        <button type="button" class="modal-btn ${btnClass}" onclick="${action.onClick}">
          ${action.label}
        </button>
      `;
    });

    // Ações padrão se não houver customizadas
    if (!modal.actions.length) {
      actionsHTML = `
        <button type="button" class="modal-btn btn-secondary" onclick="modalManager.closeModal('${modal.id}')">
          Cancelar
        </button>
        <button type="button" class="modal-btn btn-primary" onclick="modalManager.submitModal('${modal.id}')">
          Confirmar
        </button>
      `;
    }

    return actionsHTML;
  }

  /**
   * Abre modal
   */
  openModal(modalId, data = {}) {
    const modal = this.modals.get(modalId);
    if (!modal) {
      console.error(`❌ Modal não encontrado: ${modalId}`);
      return;
    }

    // Fecha modal ativo se houver
    if (this.activeModal) {
      this.modalStack.push(this.activeModal);
    }

    // Preenche campos se dados fornecidos
    if (Object.keys(data).length > 0) {
      setTimeout(() => this.populateModal(modalId, data), 100);
    }

    // Mostra modal
    modal.element.classList.add("active");
    this.activeModal = modalId;
    document.body.classList.add("modal-open");

    // Foca no primeiro campo
    setTimeout(() => {
      const firstInput = modal.element.querySelector(".form-input");
      if (firstInput) firstInput.focus();
    }, 150);

    console.log(`🪟 Modal aberto: ${modalId}`);
  }

  /**
   * Fecha modal
   */
  closeModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) return;

    modal.element.classList.remove("active");

    // Remove de modal ativo
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }

    // Restaura modal anterior se houver
    if (this.modalStack.length > 0) {
      this.activeModal = this.modalStack.pop();
    } else {
      document.body.classList.remove("modal-open");
    }

    // Limpa formulário
    this.clearModalForm(modalId);

    // Callback de cancelamento
    if (modal.onCancel) {
      modal.onCancel();
    }

    console.log(`🪟 Modal fechado: ${modalId}`);
  }

  /**
   * Submete modal
   */
  async submitModal(modalId) {
    const modal = this.modals.get(modalId);
    if (!modal) return;

    try {
      // Coleta dados do formulário
      const formData = this.collectFormData(modalId);

      // Valida dados
      const validationErrors = this.validateFormData(modal, formData);
      if (validationErrors.length > 0) {
        this.showValidationErrors(modalId, validationErrors);
        return;
      }

      // Callback de submit
      if (modal.onSubmit) {
        const result = await modal.onSubmit(formData);

        // Fecha modal se submit foi bem-sucedido
        if (result !== false) {
          this.closeModal(modalId);
        }
      } else {
        console.warn(
          `⚠️ Nenhum callback de submit configurado para: ${modalId}`
        );
        this.closeModal(modalId);
      }
    } catch (error) {
      console.error(`❌ Erro no submit do modal ${modalId}:`, error);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", "Não foi possível salvar os dados");
      }
    }
  }

  /**
   * Coleta dados do formulário
   */
  collectFormData(modalId) {
    const form = document.getElementById(`modal-form-${modalId}`);
    if (!form) return {};

    const formData = {};
    const inputs = form.querySelectorAll(".form-input");

    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        formData[input.name] = input.checked;
      } else if (input.type === "radio") {
        if (input.checked) {
          formData[input.name] = input.value;
        }
      } else {
        formData[input.name] = input.value;
      }
    });

    return formData;
  }

  /**
   * Valida dados do formulário
   */
  validateFormData(modal, formData) {
    const errors = [];

    modal.fields.forEach((field) => {
      const value = formData[field.name];

      // Campo obrigatório
      if (field.required && (!value || value.toString().trim() === "")) {
        errors.push(`${field.label} é obrigatório`);
      }

      // Validação de tipo número
      if (field.type === "number" && value && isNaN(parseFloat(value))) {
        errors.push(`${field.label} deve ser um número válido`);
      }

      // Validação de valor mínimo
      if (field.min !== undefined && parseFloat(value) < field.min) {
        errors.push(`${field.label} deve ser maior que ${field.min}`);
      }

      // Validação de valor máximo
      if (field.max !== undefined && parseFloat(value) > field.max) {
        errors.push(`${field.label} deve ser menor que ${field.max}`);
      }

      // Validação de email
      if (field.type === "email" && value && !this.isValidEmail(value)) {
        errors.push(`${field.label} deve ser um email válido`);
      }
    });

    return errors;
  }

  /**
   * Valida email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mostra erros de validação
   */
  showValidationErrors(modalId, errors) {
    // Remove erros anteriores
    const existingErrors = document.querySelectorAll(
      `#modal-overlay-${modalId} .validation-error`
    );
    existingErrors.forEach((error) => error.remove());

    // Adiciona novos erros
    const modalBody = document.getElementById(`modal-body-${modalId}`);
    const errorContainer = document.createElement("div");
    errorContainer.className = "validation-errors";
    errorContainer.innerHTML = `
      <div class="validation-error">
        <h4>Corrija os erros abaixo:</h4>
        <ul>
          ${errors.map((error) => `<li>${error}</li>`).join("")}
        </ul>
      </div>
    `;

    modalBody.insertBefore(errorContainer, modalBody.firstChild);

    // Remove erros após 5 segundos
    setTimeout(() => {
      errorContainer.remove();
    }, 5000);
  }

  /**
   * Preenche modal com dados
   */
  populateModal(modalId, data) {
    Object.entries(data).forEach(([fieldName, value]) => {
      const input = document.getElementById(`modal-${modalId}-${fieldName}`);
      if (input) {
        if (input.type === "checkbox") {
          input.checked = Boolean(value);
        } else {
          input.value = value || "";
        }
      }
    });
  }

  /**
   * Limpa formulário do modal
   */
  clearModalForm(modalId) {
    const form = document.getElementById(`modal-form-${modalId}`);
    if (form) {
      const inputs = form.querySelectorAll(".form-input");
      inputs.forEach((input) => {
        if (input.type === "checkbox") {
          input.checked = false;
        } else {
          input.value = "";
        }
      });
    }
  }

  /**
   * Fecha todos os modais
   */
  closeAllModals() {
    this.modals.forEach((modal, modalId) => {
      if (modal.element.classList.contains("active")) {
        this.closeModal(modalId);
      }
    });

    this.modalStack = [];
    this.activeModal = null;
    document.body.classList.remove("modal-open");
  }

  /**
   * Configuração de estilos globais
   */
  setupGlobalStyles() {
    const css = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .modal-container {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-height: 90vh;
        overflow-y: auto;
        transform: scale(0.7);
        transition: transform 0.3s ease;
      }

      .modal-overlay.active .modal-container {
        transform: scale(1);
      }

      .modal-small { width: 300px; }
      .modal-medium { width: 500px; }
      .modal-large { width: 800px; }
      .modal-fullscreen { width: 95vw; height: 95vh; }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #dee2e6;
      }

      .modal-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.3s ease;
      }

      .modal-close:hover {
        background: #f8f9fa;
      }

      .modal-body {
        padding: 20px;
      }

      .modal-form .form-group {
        margin-bottom: 20px;
      }

      .modal-form label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #495057;
      }

      .modal-form .form-input {
        width: 100%;
        padding: 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.3s ease;
      }

      .modal-form .form-input:focus {
        border-color: #007bff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
      }

      .required-indicator {
        color: #dc3545;
        margin-left: 3px;
      }

      .checkbox-wrapper, .radio-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .checkbox-wrapper input, .radio-wrapper input {
        width: auto;
      }

      .validation-errors {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 20px;
      }

      .validation-errors h4 {
        margin: 0 0 10px 0;
        font-size: 1rem;
      }

      .validation-errors ul {
        margin: 0;
        padding-left: 20px;
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 20px;
        border-top: 1px solid #dee2e6;
        background: #f8f9fa;
      }

      .modal-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
      }

      .btn-primary {
        background: #007bff;
        color: white;
      }

      .btn-primary:hover {
        background: #0056b3;
      }

      .btn-secondary {
        background: #6c757d;
        color: white;
      }

      .btn-secondary:hover {
        background: #545b62;
      }

      .btn-success {
        background: #28a745;
        color: white;
      }

      .btn-success:hover {
        background: #1e7e34;
      }

      .btn-danger {
        background: #dc3545;
        color: white;
      }

      .btn-danger:hover {
        background: #c82333;
      }

      body.modal-open {
        overflow: hidden;
      }

      @media (max-width: 768px) {
        .modal-small, .modal-medium, .modal-large {
          width: 95vw;
          margin: 20px;
        }
        
        .modal-fullscreen {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
        }
      }
    `;

    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Configuração de event listeners globais
   */
  setupGlobalEventListeners() {
    // Fechar modal com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.activeModal) {
        this.closeModal(this.activeModal);
      }
    });

    // Fechar modal clicando fora
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        const modalId = e.target.id.replace("modal-overlay-", "");
        this.closeModal(modalId);
      }
    });
  }
}

// ================ Instância Global ================
window.modalManager = new ModalManager();

console.log("✅ ModalManager carregado e disponível globalmente");
