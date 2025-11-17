# 📚 PayFly - Documentação Completa do Sistema

## 🎯 Visão Geral

**PayFly** é uma aplicação web de gestão financeira pessoal com IA integrada. Permite que os usuários controlem receitas, despesas, poupança, investimentos e planos financeiros com sugestões inteligentes fornecidas pelo Google Gemini.

**Stack de Tecnologia:**

-   **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
-   **Backend**: Supabase (PostgreSQL + Auth)
-   **IA**: Google Gemini API
-   **Hospedagem**: [A configurar]

## 🏗️ Estrutura de Pastas

```
payfly/
├── ai-insights/           # 🤖 Módulo de IA (Google Gemini)
├── assets/css/            # 🎨 Estilos globais
├── controllers/           # 🎮 Lógica de controle
├── core/                  # 🏗️ Núcleo (padrões, bases)
├── models/                # 📊 Modelos de dados
├── views/                 # 👀 Páginas HTML + CSS
├── index.html             # 📄 Landing page
├── README.md              # Este arquivo
└── supabase_schema.sql    # 🗄️ Schema do banco
```

## 📂 Detalhe de Cada Pasta

### 1. 🤖 **ai-insights/** - Inteligência Artificial

**O que é?** Módulo que conecta a app com Google Gemini para análise financeira

**Arquivos principais:**

-   `ai-service.js` - Comunicação com API Gemini
-   `data-analyzer.js` - Coleta dados financeiros
-   `chat-interface.js` - Interface de chat com IA
-   `smart-categorization.js` - Sugestões de categoria

**Fluxo:**

```
Usuário pergunta → ChatInterface captura →
FinancialAnalyzer busca dados →
AIService envia para Gemini →
Resposta formatada para usuário
```

**Exemplo de pergunta:** "Onde posso economizar mais?"
→ IA analisa categorias → Retorna insights personalizados

📖 Veja: `ai-insights/README.md`

---

### 2. 🎨 **assets/css/** - Estilos

**O que é?** Folhas de estilo CSS modularizadas

**Arquivos:**

-   `base.css` - Reset, variáveis, tipografia
-   `layout.css` - Grid, flexbox, responsividade
-   `components.css` - Botões, modais, inputs, cards
-   `accessibility.css` - WCAG 2.1 AA compliance

**Cor primária:** `#667eea` (Roxo)
**Cor secundária:** `#f093fb` (Rosa)

📖 Veja: `assets/css/README.md`

---

### 3. 🎮 **controllers/** - Controle Central

**O que é?** Orquestra fluxos, inicialização, notificações

**Arquivos principais:**

-   `main.js` - Inicialização DOMContentLoaded
-   `AppController.js` - Gerenciador central de estado
-   `toast-system.js` - Notificações (toasts)
-   `pdf-generator.js` - Geração de relatórios PDF
-   `accessibility.js` - Funcionalidades acessíveis

**Responsabilidades:**

-   ✅ Setup do Supabase
-   ✅ Autenticação
-   ✅ Estado global
-   ✅ Navegação

📖 Veja: `controllers/README.md`

---

### 4. 🏗️ **core/** - Núcleo da Arquitetura

**O que é?** Classes base e padrões reutilizáveis

**Arquivos:**

-   `BaseModel.js` - Classe base CRUD
-   `EntityManager.js` - Gerenciador genérico
-   `FilterSystem.js` - Sistema de filtros
-   `ModalManager.js` - Gerenciador de modais

**Exemplo:**

```javascript
class DespesaModel extends BaseModel {
    constructor() {
        super("despesas"); // Herda CRUD automaticamente
    }
}
```

📖 Veja: `core/README.md`

---

### 5. 📊 **models/** - Modelos de Dados

**O que é?** Classes que representam entidades do negócio

**Arquivos:**

-   `despesa.js` - Gestão de despesas
-   `receita.js` - Gestão de receitas
-   `poupanca.js` - Gestão de poupança
-   `investimentos.js` - Gestão de investimentos
-   `plano.js` - Gestão de planos/objetivos
-   `dashboard.js` - Agregação de dados

**Cada modelo:**

-   Herda de `BaseModel`
-   Implementa validações
-   Contém lógica de negócio
-   Comunica com Supabase

📖 Veja: `models/README.md`

---

### 6. 👀 **views/** - Páginas HTML

**O que é?** Interface visual (HTMLs + CSSs)

**Páginas principais:**

-   `Login.html` - Autenticação
-   `Cadastro.html` - Registro
-   `Painel.html` - Dashboard
-   `Despesas.html` - Gestão de despesas
-   `Receitas.html` - Gestão de receitas
-   `Poupanca.html` - Gestão de poupança
-   `Investimentos.html` - Gestão de investimentos
-   `Planos.html` - Gestão de objetivos

**Cada página tem:**

-   Tabela de dados
-   Modal de adicionar
-   Modal de editar
-   Modal de filtrar
-   Modal de IA Insights

📖 Veja: `views/README.md`

---

## 🔄 Arquitetura em Camadas

```
┌──────────────────────────────────────┐
│         VIEWS (HTML/CSS)             │
│    Interface com o Usuário           │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│      CONTROLLERS (main.js)           │
│    Orquestração e Inicialização      │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│   MODELS (despesa.js, etc)           │
│   Lógica de Negócio + Validação      │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│    CORE (BaseModel, Filters)         │
│   Padrões Reutilizáveis              │
└─────────────────┬────────────────────┘
                  ↓
┌──────────────────────────────────────┐
│   SUPABASE (PostgreSQL + Auth)       │
│   Banco de Dados + Autenticação      │
└──────────────────────────────────────┘
```

## 🔐 Segurança

### Row Level Security (RLS)

```sql
-- Cada usuário só vê seus próprios dados
CREATE POLICY "Usuario vê seus dados"
  ON despesas
  USING (usuario_id = auth.uid());
```

### Variáveis de Ambiente

-   `SUPABASE_URL` - URL do Supabase (público)
-   `SUPABASE_KEY` - Chave anon (público)
-   `GEMINI_API_KEY` - Chave IA (PRIVADO)

⚠️ **CRÍTICO**: Nunca versionem `supabase-init.env` ou `supabase-guard.env`

## 💾 Banco de Dados

### Tabelas Principais

```sql
-- Usuários
users (id, email, nome)

-- Transações
despesas (id, usuario_id, descricao, valor, data, categoria,
          is_recorrente, recorrencia_meses)
receitas (id, usuario_id, descricao, valor, data, categoria,
          is_recorrente, recorrencia_meses)

-- Patrimônio
poupanca (id, usuario_id, valor, tipo, data, is_recorrente)
investimentos (id, usuario_id, valor_investido, rentabilidade)

-- Objetivos
planos (id, usuario_id, descricao, valor, data,
        valor_poupado, progresso_percentual, is_recorrente)

-- Categorias
categorias (id, usuario_id, nome, tipo, frequencia_uso)
```

### Colunas de Recorrência

Todas as tabelas de transações têm:

-   `is_recorrente` (BOOLEAN) - Se é recorrente
-   `recorrencia_meses` (INTEGER) - Duração em meses
-   `[tabela]_pai_id` (UUID) - Referência à transação pai

## 🔄 Fluxos Principais

### 1️⃣ Cadastro e Login

```
1. Usuário preenche email/senha
2. supabase.auth.signUp() ou signInWithPassword()
3. Se novo → cria linha em "usuarios"
4. Se sucesso → salva token no localStorage
5. Redireciona para Painel.html
```

### 2️⃣ Adicionar Despesa Recorrente

```
1. Usuário clica "Adicionar"
2. Modal abre com formulário
3. Ativa "Recorrente?" e preenche duração (6 meses)
4. Clica "Salvar"
5. DespesaModel.saveWithRecurrence() cria:
   - 1 transação pai (é_recorrente=true)
   - 5 transações filhas (mes +1, +2, +3, +4, +5)
6. Mostra toast "Salvo!"
```

### 3️⃣ Filtrar Despesas

```
1. Usuário clica "Filtrar"
2. Modal de filtro abre
3. Preenche: categoria="Alimentação", recorrência="Sim"
4. Clica "Filtrar"
5. FilterSystem.apply() retorna apenas:
   - Despesas da categoria "Alimentação"
   - Que são recorrentes (is_recorrente=true)
6. Tabela atualiza em tempo real
```

### 4️⃣ IA Insights

```
1. Usuário clica "💡 AI Insights"
2. Modal de chat abre
3. Digita pergunta: "Como estão meus gastos?"
4. Clica enviar
5. Mostra LOADING com spinner
6. FinancialAnalyzer busca dados das 4 tabelas
7. Calcula totais, médias, categorias
8. Envia para Google Gemini com prompt estruturado
9. Gemini analisa e retorna resposta inteligente
10. Exibe resposta no chat
11. Remove LOADING
```

## 🎯 Funcionalidades Principais

### ✅ Receitas

-   Adicionar/editar/deletar receitas
-   Suporte a recorrência
-   Filtrar por categoria, período, valor
-   Badge "N×" para recorrentes

### ✅ Despesas

-   Adicionar/editar/deletar despesas
-   Suporte a recorrência com replicação automática
-   Filtrar por categoria, período, valor, recorrência
-   Categorização automática via IA

### ✅ Poupança

-   Registrar depósitos e saques
-   Vincular a planos
-   Acompanhar progresso
-   Gráficos de evolução

### ✅ Investimentos

-   Registrar investimentos
-   Acompanhar rentabilidade
-   Calcular patrimônio atual
-   Análise de lucro/prejuízo

### ✅ Planos (Objetivos)

-   Definir metas financeiras
-   Acompanhar progresso (%)
-   Sugerir quanto poupar/mês
-   Status: ativo, pausado, concluído

### ✅ Dashboard

-   Cards com totais (receita, despesa, saldo)
-   Gráficos de gastos por categoria
-   Progresso de planos
-   Últimas transações

### ✅ IA Insights

-   Chat com IA
-   Perguntas rápidas predefinidas
-   Análise de gastos
-   Sugestões de economia
-   Análise de patrimônio
-   Relatórios personalizados

## 📈 Exemplo: Ganho Mensal Total

```javascript
// Calcular receitas - despesas = saldo mês

async function getMonthlyBalance() {
    const receitas = new ReceitaModel();
    const despesas = new DespesaModel();

    const totalReceitas = await receitas.getTotalByMonth(
        new Date().getMonth(),
        new Date().getFullYear()
    );

    const totalDespesas = await despesas.getTotalByMonth(
        new Date().getMonth(),
        new Date().getFullYear()
    );

    const saldo = totalReceitas - totalDespesas;

    return {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: saldo,
        economia: saldo > 0 ? "✅ Economizando" : "⚠️ Gastando mais",
    };
}
```

## 🚀 Deploy e Produção

### Requisitos

-   Node.js 16+
-   Conta Supabase
-   Chave API Google Gemini

### Variáveis de Ambiente (.env)

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-publica
GEMINI_API_KEY=sua-chave-secreta
```

### Build

```bash
# Nenhum build necessário (JS puro)
# Apenas servir arquivos estáticos
python -m http.server 8000
```

## 📊 Estatísticas do Projeto

-   **Total de arquivos**: 50+
-   **Linhas de código**: ~20.000+
-   **Componentes CSS**: 30+
-   **Modelos de dados**: 8+
-   **Páginas HTML**: 10+
-   **Funções JS**: 200+

## 🎓 Tecnologias Utilizadas

| Tecnologia           | Uso             |
| -------------------- | --------------- |
| HTML5                | Estrutura       |
| CSS3                 | Estilo e Layout |
| JavaScript (Vanilla) | Lógica          |
| Supabase             | Backend + BD    |
| PostgreSQL           | Banco de Dados  |
| Google Gemini        | IA              |
| Ionicons             | Ícones          |
| jsPDF                | Geração PDF     |

## 🔍 Próximas Melhorias

-   [ ] PWA (Progressive Web App)
-   [ ] Modo offline
-   [ ] Sincronização entre dispositivos
-   [ ] Notificações push
-   [ ] Integração com Open Banking
-   [ ] Exportar para Excel
-   [ ] Relatórios agendados
-   [ ] Dark mode
-   [ ] Multi-idioma

## 📞 Suporte e Documentação

Cada pasta tem seu próprio `README.md`:

-   `ai-insights/README.md` - Documentação de IA
-   `assets/css/README.md` - Documentação de estilos
-   `controllers/README.md` - Documentação de controladores
-   `core/README.md` - Documentação de núcleo
-   `models/README.md` - Documentação de modelos
-   `views/README.md` - Documentação de views

## 👥 Contribuição

1. Siga o padrão de código existente
2. Crie função/arquivo em sua pasta apropriada
3. Adicione comentários explicativos
4. Teste em múltiplos navegadores
5. Atualize README.md correspondente

## 📄 Licença

Proprietário - PayFly © 2025

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Em Produção  
**Desenvolvedor**: Guilherme VC
