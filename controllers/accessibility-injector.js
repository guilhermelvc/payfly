// =============== Injetor de Barra de Acessibilidade ===============
// Este script injeta a barra de acessibilidade em todas as páginas do sistema

(function injectAccessibilityBar() {
    "use strict";

    function inject() {
        // Verificar se a barra já foi injetada pelo script
        if (document.getElementById("accessibility-bar-injected")) {
            console.log(
                "⚠️ Barra de acessibilidade já foi injetada anteriormente"
            );
            return;
        }

        // Verificar se existe uma barra no HTML com conteúdo (não vazia)
        const existingBars = document.querySelectorAll(".accessibility-bar");
        for (let bar of existingBars) {
            // Se a barra tem botões, significa que é a barra completa do HTML
            if (bar.querySelector("#accessibility-toggle")) {
                console.log("✅ Usando barra hardcoded do HTML");
                return;
            }
        }

        // HTML da barra de acessibilidade
        const accessibilityBarHTML = `
        <div class="accessibility-bar" id="accessibility-bar-injected">
            <button
                class="accessibility-toggle-btn"
                id="accessibility-toggle"
                title="Acessibilidade"
            >
                <ion-icon name="accessibility-outline"></ion-icon>
            </button>
            <div class="accessibility-controls" id="accessibility-controls">
                <button
                    class="accessibility-btn"
                    id="decrease-font-btn"
                    title="Diminuir fonte (Ctrl + -)"
                >
                    <ion-icon name="remove-outline"></ion-icon>
                </button>
                <span class="font-size-display" id="font-size-display"
                    >16px</span
                >
                <button
                    class="accessibility-btn"
                    id="increase-font-btn"
                    title="Aumentar fonte (Ctrl + +)"
                >
                    <ion-icon name="add-outline"></ion-icon>
                </button>
                <button
                    class="accessibility-btn"
                    id="reset-font-btn"
                    title="Resetar fonte (Ctrl + 0)"
                >
                    <ion-icon name="refresh-outline"></ion-icon>
                </button>
                <div class="accessibility-divider"></div>
                <button
                    class="accessibility-btn"
                    id="theme-toggle-btn"
                    title="Alternar tema (Ctrl + Shift + T)"
                >
                    <ion-icon name="sunny-outline"></ion-icon>
                </button>
            </div>
        </div>
    `;

        // Injetar a barra no início do body
        const body = document.querySelector("body");
        if (body) {
            const div = document.createElement("div");
            div.innerHTML = accessibilityBarHTML;
            body.insertBefore(div.firstElementChild, body.firstChild);
            console.log("✅ Barra de acessibilidade injetada");
        } else {
            console.error("❌ Body não encontrado");
        }
    }

    // Executar quando o DOM estiver pronto
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inject);
    } else {
        inject();
    }
})();
