# 🎨 Views - Interface do Usuário

## 📋 O que é?

A pasta **views** contém todas as páginas HTML do PayFly, bem como seus estilos CSS específicos. São as interfaces visuais com as quais o usuário interage.

## 🎯 Para que serve?

-   **Páginas**: Diferentes seções/funcionalidades do app
-   **Formulários**: Entrada de dados (CRUD)
-   **Modais**: Diálogos e confirmações
-   **Gráficos**: Visualização de dados
-   **Estilos**: CSS de cada página

## 🏗️ Estrutura de Arquivos

```
views/
├── README.md                      # Este arquivo
│
├── HTML Pages (Principais)
├── Login.html                     # Autenticação
├── Cadastro.html                  # Registro de novo usuário
├── Painel.html                    # Dashboard principal
├── PainelUnificado.html           # Visão consolidada
├── Receitas.html                  # Gerenciamento de receitas
├── Despesas.html                  # Gerenciamento de despesas
├── Poupanca.html                  # Gerenciamento de poupança
├── Investimentos.html             # Gerenciamento de investimentos
├── Planos.html                    # Gerenciamento de objetivos
├── Configurações.html             # Configurações do usuário
│
├── css/
│   ├── style.css                  # CSS global (principal)
│   ├── login.css                  # Login/Cadastro específico
│   ├── index.css                  # Painel principal
│   ├── dashboard.css              # Dashboard específico
│   ├── data-tables.css            # Tabelas
│   ├── config-utils.css           # Utilidades
│   ├── cadastro.css               # Formulários
│   └── auth.css                   # Autenticação
│
└── imgs/
    ├── Login-Cadastro/            # Imagens de auth
    └── pages/                     # Ícones e imagens
```

## 🔧 Estrutura de Página Padrão

Cada página segue o padrão:

```html
<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PayFly - Despesas</title>

        <!-- CSS Base (assets/) -->
        <link rel="stylesheet" href="../assets/css/base.css" />
        <link rel="stylesheet" href="../assets/css/layout.css" />
        <link rel="stylesheet" href="../assets/css/components.css" />
        <link rel="stylesheet" href="../assets/css/accessibility.css" />

        <!-- CSS da Página -->
        <link rel="stylesheet" href="./css/style.css" />
        <link rel="stylesheet" href="./css/data-tables.css" />
    </head>

    <body>
        <!-- ========== NAVBAR ========== -->
        <nav class="navbar">
            <div class="logo">PayFly 💰</div>
            <div class="nav-links">
                <a href="Painel.html">Dashboard</a>
                <a href="Despesas.html">Despesas</a>
                <a href="Receitas.html">Receitas</a>
            </div>
        </nav>

        <!-- ========== MAIN CONTENT ========== -->
        <main class="main-content">
            <!-- Botões de ação -->
            <div class="action-bar">
                <h1>💸 Despesas</h1>
                <button onclick="openAddModal()">➕ Adicionar</button>
                <button onclick="FilterModal.open()">🔍 Filtrar</button>
            </div>

            <!-- Tabela de dados -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="despesas-table-body">
                    <!-- Preenchido dinamicamente -->
                </tbody>
            </table>
        </main>

        <!-- ========== MODAL: ADICIONAR ========== -->
        <div class="standardized-modal-overlay" id="add-modal-overlay">
            <div class="standardized-modal">
                <div class="standardized-modal-header">
                    <h2>➕ Adicionar Despesa</h2>
                    <button
                        class="standardized-modal-close"
                        onclick="closeAddModal()"
                    >
                        ×
                    </button>
                </div>

                <div class="standardized-modal-body">
                    <form id="add-form" onsubmit="saveDespesa(event)">
                        <div class="standardized-input-group">
                            <label for="descricao">Descrição</label>
                            <input type="text" id="descricao" required />
                        </div>

                        <div class="standardized-input-group">
                            <label for="valor">Valor (R$)</label>
                            <input
                                type="number"
                                id="valor"
                                step="0.01"
                                required
                            />
                        </div>

                        <div class="standardized-input-group">
                            <label for="data">Data</label>
                            <input type="date" id="data" required />
                        </div>

                        <!-- Recorrência -->
                        <div class="standardized-input-group recorrencia-group">
                            <label
                                for="is_recorrente"
                                class="recorrencia-label"
                            >
                                <span class="recorrencia-text"
                                    >Despesa Recorrente?</span
                                >
                                <div class="switch-toggle">
                                    <input
                                        type="checkbox"
                                        id="is_recorrente"
                                        onchange="toggleRecorrenciaFields()"
                                    />
                                    <span class="slider"></span>
                                </div>
                            </label>
                        </div>

                        <div
                            class="standardized-input-group"
                            id="recorrencia_meses_group"
                            style="display: none;"
                        >
                            <label for="recorrencia_meses"
                                >Duração (meses)</label
                            >
                            <input
                                type="number"
                                id="recorrencia_meses"
                                min="1"
                                max="120"
                                value="1"
                            />
                            <div class="standardized-help-text">
                                Será replicada a cada mês até o prazo
                                especificado.
                            </div>
                        </div>

                        <div class="standardized-modal-actions">
                            <button
                                type="button"
                                class="standardized-button standardized-button-secondary"
                                onclick="closeAddModal()"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="standardized-button standardized-button-primary"
                            >
                                💾 Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- ========== MODAL: FILTRAR ========== -->
        <div class="standardized-modal-overlay" id="filter-modal-overlay">
            <div class="standardized-modal">
                <div class="standardized-modal-header">
                    <h2>🔍 Filtrar Despesas</h2>
                    <button
                        class="standardized-modal-close"
                        onclick="FilterModal.close()"
                    >
                        ×
                    </button>
                </div>

                <div class="standardized-modal-body">
                    <form id="filter-form" onsubmit="filterDespesas(event)">
                        <div class="standardized-input-group">
                            <label for="filter-categoria">Categoria</label>
                            <input type="text" id="filter-categoria" />
                        </div>

                        <div class="standardized-input-group">
                            <label for="filter-valor">Valor</label>
                            <input
                                type="number"
                                id="filter-valor"
                                step="0.01"
                            />
                        </div>

                        <div class="standardized-input-group">
                            <label for="filter-recorrente"
                                >Filtrar por Recorrência</label
                            >
                            <select id="filter-recorrente">
                                <option value="">Todas</option>
                                <option value="sim">Apenas Recorrentes</option>
                                <option value="nao">Apenas Únicas</option>
                            </select>
                        </div>

                        <div class="standardized-modal-actions">
                            <button
                                type="button"
                                class="standardized-button 
              standardized-button-secondary"
                                onclick="FilterModal.close()"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                class="standardized-button 
              standardized-button-primary"
                            >
                                🔍 Filtrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- ========== SCRIPTS ========== -->
        <script src="../controllers/main.js"></script>
        <script src="../models/despesa.js"></script>
        <script src="../controllers/toast-system.js"></script>

        <!-- Ionicons (ícones) -->
        <script
            type="module"
            src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"
        ></script>
    </body>
</html>
```

## 📄 Páginas Detalhadas

### 1. **Login.html** - Autenticação

```javascript
// Fluxo:
// 1. Usuário digita email/senha
// 2. supabase.auth.signInWithPassword()
// 3. Se sucesso → redireciona para Painel.html
// 4. Se erro → exibe mensagem
```

**Funcionalidades:**

-   Login com email/senha
-   Esqueci minha senha
-   Link para cadastro
-   Validação client-side

### 2. **Cadastro.html** - Novo Usuário

```javascript
// Fluxo:
// 1. Usuário preenche formulário
// 2. supabase.auth.signUp()
// 3. Cria usuário na tabela "usuarios"
// 4. Envia email de verificação
// 5. Redireciona para Login após confirmação
```

### 3. **Painel.html** - Dashboard Principal

```javascript
// Mostra:
// - Total de receitas/despesas (mês)
// - Saldo líquido
// - Gráficos de gastos por categoria
// - Progresso de planos
// - Últimas transações

// Código:
async function loadDashboard() {
    const summary = await DashboardModel.getCompleteSummary();

    // Atualizar cards
    document.getElementById(
        "total-receitas"
    ).textContent = `R$ ${summary.totalReceitas.toFixed(2)}`;

    // Atualizar gráficos
    const chartData = await DashboardModel.getChartData();
    chart.update(chartData);
}
```

### 4. **Despesas.html** - Gerenciar Despesas

```javascript
// Recursos:
// ✅ Tabela com todas as despesas
// ✅ Adicionar nova despesa (com recorrência)
// ✅ Editar despesa existente
// ✅ Deletar despesa
// ✅ Filtrar por categoria/valor/data
// ✅ Indicador "N×" para despesas recorrentes
// ✅ Relatório em PDF
```

Padrão idêntico para: **Receitas.html**, **Poupanca.html**, **Investimentos.html**, **Planos.html**

## 🎨 Componentes Reutilizáveis

### Switch Toggle (Recorrência)

```html
<div class="switch-toggle">
    <input
        type="checkbox"
        id="is_recorrente"
        onchange="toggleRecorrenciaFields()"
    />
    <span class="slider"></span>
</div>
```

### Botão Padrão

```html
<button class="standardized-button standardized-button-primary">
    💾 Salvar
</button>
```

### Card de Informação

```html
<div class="info-card">
    <div class="card-header">Receitas</div>
    <div class="card-value">R$ 5.000,00</div>
    <div class="card-footer">+12% vs mês anterior</div>
</div>
```

## 🔄 Ciclo de Vida de uma Página

```
HTML carrega
    ↓
main.js executa DOMContentLoaded
    ↓
Verifica autenticação
    ↓
Carrega modelo (e.g., DespesaModel)
    ↓
Busca dados do Supabase
    ↓
Renderiza tabela/cards
    ↓
Aguarda interação (clique, input)
    ↓
Chama função (e.g., saveDespesa)
    ↓
Atualiza UI / Mostra Toast
```

## 💡 Fluxo de Exemplo: Adicionar Despesa

```javascript
// 1. HTML: Usuário clica em "Adicionar"
<button onclick="openAddModal()">➕ Adicionar</button>

// 2. JS: Abre modal
function openAddModal() {
  ModalManager.open('add-modal-overlay');
}

// 3. HTML: Usuário preenche formulário e clica "Salvar"
<form onsubmit="saveDespesa(event)">

// 4. JS: Captura dados e valida
async function saveDespesa(event) {
  event.preventDefault();

  const data = {
    descricao: document.getElementById('descricao').value,
    valor: parseFloat(document.getElementById('valor').value),
    data: document.getElementById('data').value,
    categoria: document.getElementById('categoria').value,
    is_recorrente: document.getElementById('is_recorrente').checked,
    recorrencia_meses: document.getElementById('recorrencia_meses').value
  };

  try {
    // 5. Envia para model
    await despesaModel.saveWithRecurrence(data);

    // 6. Sucesso!
    ToastSystem.success("Despesa salva!");

    // 7. Fecha modal
    ModalManager.close('add-modal-overlay');

    // 8. Recarrega tabela
    await loadDespesas();

  } catch (error) {
    // 9. Se erro, exibe mensagem
    ToastSystem.error("Erro: " + error.message);
  }
}
```

## 📊 Tabelas Padrão

```html
<table class="data-table">
    <thead>
        <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Recorrente</th>
            <th>Ações</th>
        </tr>
    </thead>
    <tbody id="table-body">
        <!-- Preenchido dinamicamente -->
    </tbody>
</table>
```

## 🎯 Responsividade

Todas as páginas são responsivas:

-   **Desktop**: Layout de 2+ colunas
-   **Tablet**: Layout de 1 coluna com ajustes
-   **Mobile**: Stack vertical, menu hamburger

## 🚀 Boas Práticas

✅ **Semântica HTML**: Use tags corretas (`<header>`, `<main>`, `<section>`)
✅ **Acessibilidade**: Labels em inputs, ARIA quando necessário
✅ **Performance**: Lazy loading de imagens, async scripts
✅ **SEO**: Meta tags, alt text em imagens
✅ **Segurança**: Sanitize inputs, escape HTML

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
