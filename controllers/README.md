# 🎮 Controllers - Controladores da Aplicação

## 📋 O que é?

A pasta **controllers** contém a lógica de controle da aplicação - scripts que orquestram fluxos, gerenciam o estado, interagem com o banco de dados e coordenam as diferentes partes do sistema.

## 🎯 Para que serve?

-   **Inicialização**: Setup do Supabase e variáveis globais
-   **Navegação**: Controle de fluxo entre páginas
-   **Notificações**: Sistema de toasts (mensagens)
-   **PDF**: Geração de relatórios em PDF
-   **Acessibilidade**: Funcionalidades acessíveis
-   **Carregamento de Dados**: Busca e sincronização com Supabase
    nes

## 🏗️ Estrutura de Arquivos

```
controllers/
├── README.md                      # Este arquivo
├── main.js                        # Inicialização principal
├── AppController.js               # Gerenciador central da app
├── accessibility.js               # Acessibilidade (WCAG)
├── toast-system.js                # Sistema de notificações
├── pdf-generator.js               # Geração de PDF/relatórios
├── supabase-init.env              # Credenciais (NÃO versionar!)
└── supabase-guard.env             # Guard de proteção (NÃO versionar!)
```

## 🔧 Arquivos Detalhados

### 1. **main.js** - Inicialização Principal

```javascript
// Executa quando página carrega
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 PayFly iniciando...");

    // 1. Inicializa Supabase
    await initSupabase();

    // 2. Carrega usuário autenticado
    const user = await supabase.auth.getUser();

    // 3. Se não autenticado, redireciona para login
    if (!user.data.user) {
        window.location.href = "./Login.html";
        return;
    }

    // 4. Inicializa controlador principal
    AppController.init();

    // 5. Carrega dados iniciais
    await AppController.loadInitialData();

    console.log("✅ PayFly pronto!");
});
```

**Responsabilidades:**

-   Verificação de autenticação
-   Inicialização do Supabase
-   Carregamento de dados globais
-   Setup de listeners de eventos

### 2. **AppController.js** - Gestor Central

```javascript
class AppController {
    static async init() {
        this.currentUser = await supabase.auth.getUser();
        this.financialData = {};
        this.filters = {};
        this.isLoading = false;
    }

    // Carregar dados de todas as tabelas
    static async loadInitialData() {
        try {
            this.isLoading = true;

            const [despesas, receitas, poupanca, investimentos] =
                await Promise.all([
                    this.loadDespesas(),
                    this.loadReceitas(),
                    this.loadPoupanca(),
                    this.loadInvestimentos(),
                ]);

            this.financialData = {
                despesas,
                receitas,
                poupanca,
                investimentos,
            };

            this.isLoading = false;
        } catch (error) {
            this.showError("Erro ao carregar dados");
        }
    }

    // Exemplo: Carregar despesas
    static async loadDespesas() {
        const { data } = await supabase
            .from("despesas")
            .select("*")
            .eq("usuario_id", this.currentUser.id);

        return data || [];
    }
}
```

**Responsabilidades:**

-   Gerenciamento de estado global
-   Carregamento de dados
-   Orquestração de operações
-   Tratamento de erros centralizado

### 3. **toast-system.js** - Notificações

```javascript
class ToastSystem {
    // Mostrar notificação de sucesso
    static success(message, duration = 3000) {
        this.show(message, "success", duration);
    }

    // Mostrar notificação de erro
    static error(message, duration = 5000) {
        this.show(message, "error", duration);
    }

    // Mostrar notificação genérica
    static show(message, type = "info", duration = 3000) {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <ion-icon name="${this.getIcon(type)}"></ion-icon>
      <span>${message}</span>
    `;

        // Posiciona no canto superior direito
        toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    `;

        document.body.appendChild(toast);

        // Remove após duração
        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease-out";
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static getIcon(type) {
        const icons = {
            success: "checkmark-circle",
            error: "alert-circle",
            warning: "warning",
            info: "information-circle",
        };
        return icons[type] || icons.info;
    }
}
```

**Exemplo de uso:**

```javascript
// Em qualquer lugar da aplicação
ToastSystem.success("Despesa salva com sucesso!");
ToastSystem.error("Erro ao salvar despesa");
```

### 4. **pdf-generator.js** - Geração de Relatórios

```javascript
class PDFGenerator {
    // Gerar relatório de despesas
    static generateDespesasReport(data) {
        const doc = new jsPDF();

        // Cabeçalho
        doc.text("Relatório de Despesas - PayFly", 20, 20);
        doc.text(`Período: ${data.periodo}`, 20, 30);

        // Tabela
        const rows = data.despesas.map((d) => [
            d.descricao,
            d.categoria,
            `R$ ${d.valor.toFixed(2)}`,
            new Date(d.data).toLocaleDateString(),
        ]);

        doc.autoTable({
            head: [["Descrição", "Categoria", "Valor", "Data"]],
            body: rows,
            startY: 40,
        });

        // Rodapé com total
        const totalY = doc.lastAutoTable.finalY + 20;
        doc.text(`Total: R$ ${data.total.toFixed(2)}`, 20, totalY);

        // Salvar
        doc.save(`relatorio_despesas_${new Date().toISOString()}.pdf`);
    }
}
```

**Exemplo de uso:**

```javascript
const report = await PDFGenerator.generateDespesasReport(despesasData);
// Abre diálogo de download
```

### 5. **accessibility.js** - Acessibilidade

```javascript
class AccessibilityManager {
    // Ativar modo de alto contraste
    static enableHighContrast() {
        document.body.classList.add("high-contrast");
        localStorage.setItem("a11y-highContrast", "true");
    }

    // Aumentar tamanho de fonte
    static increaseFontSize() {
        const size = localStorage.getItem("a11y-fontSize") || 100;
        const newSize = parseInt(size) + 10;
        document.documentElement.style.fontSize = `${newSize}%`;
        localStorage.setItem("a11y-fontSize", newSize);
    }

    // Ativar navegação por teclado
    static enableKeyboardNavigation() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Tab") {
                document.body.classList.add("keyboard-nav");
            }
        });
    }

    // Restaurar preferências salvas
    static restorePreferences() {
        if (localStorage.getItem("a11y-highContrast")) {
            this.enableHighContrast();
        }
        const fontSize = localStorage.getItem("a11y-fontSize");
        if (fontSize) {
            document.documentElement.style.fontSize = `${fontSize}%`;
        }
    }
}
```

### 6. **Arquivos de Configuração (NÃO versionar!)**

```javascript
// supabase-init.env
const SUPABASE_URL = "https://seu-projeto.supabase.co";
const SUPABASE_KEY = "sua-chave-anon-publica";

// supabase-guard.env
const GEMINI_API_KEY = "sua-chave-gemini";
```

⚠️ **CRÍTICO**: Estes arquivos **NUNCA** devem ir para Git!

## 🔄 Fluxo de Inicialização

```
1. main.js DOMContentLoaded
   ↓
2. Verifica autenticação (Supabase)
   ↓
3. Se não autenticado → Login.html
   ↓
4. Se autenticado → inicializa AppController
   ↓
5. Carrega dados das 4 tabelas em paralelo
   ↓
6. Renderiza interface
   ↓
7. Aguarda interação do usuário
```

## 📊 Fluxo de Dados

```
Usuário Interage (click, input)
    ↓
Listener dispara evento
    ↓
Controller intercepta
    ↓
Valida dados
    ↓
Envia para Supabase
    ↓
Recebe resposta
    ↓
Atualiza UI
    ↓
Mostra Toast (sucesso/erro)
```

## 🚀 Padrão de Uso

```javascript
// Em qualquer modelo (models/despesa.js, etc)
// SEMPRE usar AppController para operações globais

// Salvar despesa
async function saveDespesa(data) {
    try {
        ToastSystem.show("Salvando...", "info"); // UI feedback

        const result = await supabase.from("despesas").insert([data]);

        ToastSystem.success("Despesa salva!");
        await AppController.loadDespesas(); // Atualiza global
    } catch (error) {
        ToastSystem.error("Erro ao salvar: " + error.message);
    }
}
```

## 🛡️ Proteção e Segurança

**Guards de Proteção:**

-   ✅ Valida autenticação em cada página
-   ✅ Verifica RLS policies no Supabase
-   ✅ Sanitiza inputs
-   ✅ Tratamento robusto de erros

## 💡 Motivo da Arquitetura

✅ **Centralizado**: Evita duplicação de código
✅ **Modular**: Cada controller tem responsabilidade clara
✅ **Testável**: Lógica separada da UI
✅ **Manutenível**: Fácil encontrar/corrigir bugs
✅ **Escalável**: Adicionar novo controller é trivial

## 🗄️ Por que Supabase?

O Supabase foi escolhido como backend por várias razões:

-   ✅ **Open Source**: Código aberto, sem lock-in de vendor
-   ✅ **PostgreSQL Real**: Banco de dados relacional robusto e maduro
-   ✅ **Auth Integrada**: Suporte nativo a OAuth (Google, GitHub, etc)
-   ✅ **Row Level Security (RLS)**: Segurança em nível de linha no banco
-   ✅ **Real-time**: Atualizações em tempo real via WebSockets
-   ✅ **Escalável**: Funciona desde hobby até aplicações em produção
-   ✅ **Sem Servidor**: Sem preocupação com infraestrutura
-   ✅ **Documentação Excelente**: APIs bem documentadas
-   ✅ **Custo-Benefício**: Tier gratuito generoso, pricing justo
-   ✅ **JS SDK**: Integração perfeita com JavaScript/TypeScript

**Comparação com alternativas:**

-   Firebase: Mais caro, menos controle, não é open-source
-   MongoDB Atlas: NoSQL, menos segurança em nível de dados
-   Prisma + Node: Requer backend próprio, mais complexo
-   Supabase: Melhor balanço entre simplicidade e funcionalidades

---

## 📝 Convenções

-   Nomes em **CamelCase**: `AppController`, `ToastSystem`
-   Métodos estáticos para utilitários: `ToastSystem.success()`
-   Classes para gerenciadores de estado
-   Funções para operações simples

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
