// =============== Sistema de Acessibilidade ===============

(function initAccessibility() {
  "use strict";

  // Configurações padrão
  const DEFAULT_FONT_SIZE = 16;
  const MIN_FONT_SIZE = 12;
  const MAX_FONT_SIZE = 24;
  const FONT_STEP = 2;

  // Estado atual
  let currentFontSize = DEFAULT_FONT_SIZE;
  let currentTheme = "dark";

  // Inicialização
  function init() {
    loadPreferences();
    applyPreferences();
    setupEventListeners();
    console.log("✅ Sistema de acessibilidade inicializado");
  }

  // Carregar preferências do localStorage
  function loadPreferences() {
    const savedFontSize = localStorage.getItem("fontSize");
    const savedTheme = localStorage.getItem("theme");

    if (savedFontSize) {
      currentFontSize = parseInt(savedFontSize, 10);
      if (currentFontSize < MIN_FONT_SIZE) currentFontSize = MIN_FONT_SIZE;
      if (currentFontSize > MAX_FONT_SIZE) currentFontSize = MAX_FONT_SIZE;
    }

    if (savedTheme) {
      currentTheme = savedTheme;
    }
  }

  // Aplicar preferências
  function applyPreferences() {
    applyFontSize();
    applyTheme();
    updateDisplay();
  }

  // Aplicar tamanho de fonte
  function applyFontSize() {
    const scale = currentFontSize / DEFAULT_FONT_SIZE;
    document.documentElement.style.setProperty("--font-scale", scale);
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${DEFAULT_FONT_SIZE}px`
    );

    // Forçar redesenho dos gráficos Chart.js se existirem
    if (typeof Chart !== "undefined" && Chart.instances) {
      Object.values(Chart.instances).forEach((chart) => {
        if (chart && chart.options && chart.options.plugins) {
          // Atualiza tamanho da fonte nos gráficos
          if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.font = {
              size: Math.round(12 * scale),
            };
          }
          if (chart.options.plugins.tooltip) {
            chart.options.plugins.tooltip.bodyFont = {
              size: Math.round(12 * scale),
            };
            chart.options.plugins.tooltip.titleFont = {
              size: Math.round(13 * scale),
            };
          }
          // Atualiza escalas (eixos X e Y)
          if (chart.options.scales) {
            Object.keys(chart.options.scales).forEach((scaleKey) => {
              if (chart.options.scales[scaleKey].ticks) {
                chart.options.scales[scaleKey].ticks.font = {
                  size: Math.round(11 * scale),
                };
              }
              // Atualiza título dos eixos se existir
              if (chart.options.scales[scaleKey].title) {
                chart.options.scales[scaleKey].title.font = {
                  size: Math.round(12 * scale),
                };
              }
            });
          }
          // Atualiza plugins adicionais
          if (chart.options.plugins.datalabels) {
            chart.options.plugins.datalabels.font = {
              size: Math.round(11 * scale),
            };
          }
          chart.update();
        }
      });
    }

    // Atualizar legendas HTML customizadas
    const legendElements = document.querySelectorAll(
      ".chartjs-legend, #timelineChartLegend, .chart-legend, .chart-selector-info, .chart-title, .timeline-legend-container, .timeline-legend-item"
    );
    legendElements.forEach((legend) => {
      legend.style.fontSize = `${0.875 * scale}rem`;
    });

    // Atualizar botões e spans dentro das legendas
    const legendItems = document.querySelectorAll(
      "#timelineChartLegend button, #timelineChartLegend span, .chart-legend button, .chart-legend span, .timeline-legend-label"
    );
    legendItems.forEach((item) => {
      item.style.fontSize = `${0.875 * scale}rem`;
    });
  }

  // Aplicar tema
  function applyTheme() {
    if (currentTheme === "light") {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  }

  // Atualizar display do tamanho de fonte
  function updateDisplay() {
    const display = document.getElementById("font-size-display");
    if (display) {
      display.textContent = `${currentFontSize}px`;
    }
  }

  // Aumentar fonte
  function increaseFontSize() {
    if (currentFontSize < MAX_FONT_SIZE) {
      currentFontSize += FONT_STEP;
      applyFontSize();
      updateDisplay();
      savePreferences();
      showNotification(`Fonte aumentada para ${currentFontSize}px`);
    } else {
      showNotification("Tamanho máximo de fonte atingido");
    }
  }

  // Diminuir fonte
  function decreaseFontSize() {
    if (currentFontSize > MIN_FONT_SIZE) {
      currentFontSize -= FONT_STEP;
      applyFontSize();
      updateDisplay();
      savePreferences();
      showNotification(`Fonte reduzida para ${currentFontSize}px`);
    } else {
      showNotification("Tamanho mínimo de fonte atingido");
    }
  }

  // Resetar fonte
  function resetFontSize() {
    currentFontSize = DEFAULT_FONT_SIZE;
    applyFontSize();
    updateDisplay();
    savePreferences();
    showNotification("Fonte restaurada ao tamanho padrão");
  }

  // Alternar tema
  function toggleTheme() {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme();
    savePreferences();

    const themeName = currentTheme === "light" ? "Claro" : "Escuro";
    showNotification(`Tema ${themeName} ativado`);

    // Atualizar ícone do botão
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      const icon = themeBtn.querySelector("ion-icon");
      if (icon) {
        icon.setAttribute(
          "name",
          currentTheme === "light" ? "moon-outline" : "sunny-outline"
        );
      }
    }
  }

  // Salvar preferências
  function savePreferences() {
    localStorage.setItem("fontSize", currentFontSize.toString());
    localStorage.setItem("theme", currentTheme);
  }

  // Mostrar notificação
  function showNotification(message) {
    // Remove notificação existente
    const existing = document.querySelector(".accessibility-notification");
    if (existing) {
      existing.remove();
    }

    // Cria nova notificação
    const notification = document.createElement("div");
    notification.className = "accessibility-notification";
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 70px;
      right: 20px;
      background: rgba(42, 33, 133, 0.95);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10005;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remove após 2 segundos
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Botão aumentar fonte
    const increaseBtn = document.getElementById("increase-font-btn");
    if (increaseBtn) {
      increaseBtn.addEventListener("click", increaseFontSize);
    }

    // Botão diminuir fonte
    const decreaseBtn = document.getElementById("decrease-font-btn");
    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", decreaseFontSize);
    }

    // Botão resetar fonte
    const resetBtn = document.getElementById("reset-font-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", resetFontSize);
    }

    // Botão alternar tema
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", toggleTheme);
    }

    // Atalhos de teclado
    document.addEventListener("keydown", function (e) {
      // Ctrl + = ou Ctrl + + para aumentar
      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        increaseFontSize();
      }
      // Ctrl + - para diminuir
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        decreaseFontSize();
      }
      // Ctrl + 0 para resetar
      if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        resetFontSize();
      }
      // Ctrl + Shift + T para alternar tema
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // Adicionar animações ao head
  function addAnimations() {
    if (document.getElementById("accessibility-animations")) return;

    const style = document.createElement("style");
    style.id = "accessibility-animations";
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Exportar funções globalmente
  window.accessibility = {
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleTheme,
    getCurrentFontSize: () => currentFontSize,
    getCurrentTheme: () => currentTheme,
  };

  // Inicializar quando DOM estiver pronto
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      addAnimations();
      init();
    });
  } else {
    addAnimations();
    init();
  }
})();
