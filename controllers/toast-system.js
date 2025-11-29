// ================ Sistema Global de Toast Notifications ================
// Sistema padronizado de notificações para todo o PayFly
// Uso: showToast("Título", "Mensagem", "tipo") ou showErrorToast("Título", "Mensagem")

// Função para garantir que o container de toast existe
function ensureToastContainer() {
  let container = document.getElementById("toast-container");

  if (!container) {
    // Cria o container se não existir
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);

    // Adiciona estilos CSS se não existirem
    addToastStyles();
  }

  return container;
}

// Função para adicionar estilos CSS do toast
function addToastStyles() {
  const existingStyle = document.getElementById("toast-styles");
  if (existingStyle) return;

  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    /* Sistema de Toast Notifications */
    .toast {
      background: white;
      border-radius: 10px;
      padding: 16px 20px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
      border-left: 4px solid #2a2185;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 350px;
      pointer-events: auto;
      animation: toastSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .toast.success {
      border-left-color: #28a745;
    }

    .toast.error {
      border-left-color: #dc3545;
    }

    .toast.warning {
      border-left-color: #ffc107;
    }

    .toast.info {
      border-left-color: #17a2b8;
    }

    body:not(.light-theme) .toast {
      background: #1f1f1f;
      border-left-color: #0f766e;
      box-shadow: 0 12px 30px rgba(0,0,0,0.6);
    }

    body:not(.light-theme) .toast.warning {
      border-left-color: #f59f0b;
    }

    body:not(.light-theme) .toast.error {
      border-left-color: #f87171;
    }

    body:not(.light-theme) .toast.success {
      border-left-color: #22c55e;
    }

    body:not(.light-theme) .toast.info {
      border-left-color: #38bdf8;
    }

    .toast:hover {
      transform: translateX(-5px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.2);
    }

    body:not(.light-theme) .toast:hover {
      box-shadow: 0 16px 40px rgba(0,0,0,0.7);
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast.success .toast-icon {
      color: #28a745;
    }

    .toast.error .toast-icon {
      color: #dc3545;
    }

    .toast.warning .toast-icon {
      color: #ffc107;
    }

    .toast.info .toast-icon {
      color: #17a2b8;
    }

    body:not(.light-theme) .toast-icon,
    body:not(.light-theme) .toast.success .toast-icon,
    body:not(.light-theme) .toast.error .toast-icon,
    body:not(.light-theme) .toast.warning .toast-icon,
    body:not(.light-theme) .toast.info .toast-icon {
      color: #fff;
    }

    .toast-content {
      flex-grow: 1;
    }

    .toast-title {
      font-weight: 600;
      color: #2a2185;
      margin-bottom: 4px;
      font-size: 14px;
    }

    body:not(.light-theme) .toast-title,
    body:not(.light-theme) .toast-message {
      color: #f5f5f5;
    }

    .toast-message {
      color: #666;
      font-size: 13px;
      line-height: 1.4;
    }

    .toast-close {
      color: #999;
      font-size: 18px;
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .toast-close:hover {
      color: #666;
    }

    body:not(.light-theme) .toast-close {
      color: #d1d1d1;
    }

    body:not(.light-theme) .toast-close:hover {
      color: #ffffff;
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast.fade-out {
      animation: toastSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes toastSlideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }

    /* Responsividade para Toast */
    @media (max-width: 576px) {
      #toast-container {
        top: 10px !important;
        right: 10px !important;
        left: 10px !important;
      }

      .toast {
        max-width: none;
      }
    }
  `;

  document.head.appendChild(style);
}

// Função principal para exibir toast
function showToast(title, message, type = "info", duration = 4000) {
  const container = ensureToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Ícones usando caracteres Unicode como fallback para ion-icons
  const icons = {
    success: "✓",
    error: "⚠",
    warning: "⚠",
    info: "ℹ",
  };

  // Tenta usar ion-icons se disponível, senão usa caracteres Unicode
  const iconElement = document.querySelector('script[src*="ionicons"]')
    ? `<ion-icon name="${getIonIcon(type)}" class="toast-icon"></ion-icon>`
    : `<span class="toast-icon">${icons[type]}</span>`;

  const closeIcon = document.querySelector('script[src*="ionicons"]')
    ? `<ion-icon name="close-outline" class="toast-close"></ion-icon>`
    : `<span class="toast-close">×</span>`;

  toast.innerHTML = `
    ${iconElement}
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    ${closeIcon}
  `;

  // Adiciona event listeners
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeToast(toast);
  });

  toast.addEventListener("click", () => {
    removeToast(toast);
  });

  // Adiciona ao container
  container.appendChild(toast);

  // Remove automaticamente após duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentNode) {
        removeToast(toast);
      }
    }, duration);
  }

  return toast;
}

// Função para obter ícones do Ion Icons
function getIonIcon(type) {
  const ionIcons = {
    success: "checkmark-circle-outline",
    error: "alert-circle-outline",
    warning: "warning-outline",
    info: "information-circle-outline",
  };
  return ionIcons[type] || ionIcons.info;
}

// Função para remover toast com animação
function removeToast(toast) {
  toast.classList.add("fade-out");
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}

// Versões específicas do toast para facilitar o uso
function showSuccessToast(title, message, duration = 4000) {
  return showToast(title, message, "success", duration);
}

function showErrorToast(title, message, duration = 6000) {
  return showToast(title, message, "error", duration);
}

function showWarningToast(title, message, duration = 5000) {
  return showToast(title, message, "warning", duration);
}

function showInfoToast(title, message, duration = 4000) {
  return showToast(title, message, "info", duration);
}

// Helper genérico para notificar com fallback em caso de ausência do sistema de toast
function notifyToast(title, message, type = "info", duration) {
  const defaultDurations = {
    success: 4000,
    error: 6000,
    warning: 5000,
    info: 4000,
  };

  if (typeof showToast === "function") {
    return showToast(
      title,
      message,
      type,
      duration ?? defaultDurations[type] ?? defaultDurations.info
    );
  }

  if (typeof window !== "undefined" && typeof window.alert === "function") {
    const prefix = title ? `${title}: ` : "";
    window.alert(prefix + message);
  } else {
    console.warn("Toast indisponível:", { title, message, type });
  }

  return null;
}

// Funções de validação com toast integrado
function validateRequired(value, fieldName) {
  if (!value || value.trim() === "") {
    showErrorToast("Campo obrigatório", `O campo ${fieldName} é obrigatório.`);
    return false;
  }
  return true;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showErrorToast("Email inválido", "Por favor, insira um email válido.");
    return false;
  }
  return true;
}

function validatePassword(password, minLength = 6) {
  if (password.length < minLength) {
    showErrorToast(
      "Senha muito curta",
      `A senha deve ter pelo menos ${minLength} caracteres.`
    );
    return false;
  }
  return true;
}

function validateNumber(value, fieldName, min = null, max = null) {
  if (isNaN(value) || value === "") {
    showErrorToast(
      "Valor inválido",
      `O campo ${fieldName} deve ser um número válido.`
    );
    return false;
  }

  const num = parseFloat(value);

  if (min !== null && num < min) {
    showErrorToast(
      "Valor muito baixo",
      `O campo ${fieldName} deve ser pelo menos ${min}.`
    );
    return false;
  }

  if (max !== null && num > max) {
    showErrorToast(
      "Valor muito alto",
      `O campo ${fieldName} não pode exceder ${max}.`
    );
    return false;
  }

  return true;
}

function validateDate(dateString, fieldName) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    showErrorToast(
      "Data inválida",
      `A data informada em ${fieldName} é inválida.`
    );
    return false;
  }
  return true;
}

// Funções para feedback de ações
function showLoadingToast(
  title = "Carregando",
  message = "Processando sua solicitação..."
) {
  return showInfoToast(title, message, 0); // Duration 0 = não remove automaticamente
}

function showSuccessAction(action) {
  showSuccessToast("Sucesso!", `${action} realizada com sucesso!`);
}

function showErrorAction(action, error = null) {
  const errorMsg = error ? `: ${error}` : "";
  showErrorToast("Erro!", `Falha ao ${action}${errorMsg}`);
}

// Expõe as funções globalmente para uso em qualquer página
if (typeof window !== "undefined") {
  // Funções principais
  window.showToast = showToast;
  window.showSuccessToast = showSuccessToast;
  window.showErrorToast = showErrorToast;
  window.showWarningToast = showWarningToast;
  window.showInfoToast = showInfoToast;
  window.notifyToast = notifyToast;

  // Funções de validação
  window.validateRequired = validateRequired;
  window.validateEmail = validateEmail;
  window.validatePassword = validatePassword;
  window.validateNumber = validateNumber;
  window.validateDate = validateDate;

  // Funções de feedback de ações
  window.showLoadingToast = showLoadingToast;
  window.showSuccessAction = showSuccessAction;
  window.showErrorAction = showErrorAction;
  window.removeToast = removeToast;
}

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureToastContainer);
} else {
  ensureToastContainer();
}
