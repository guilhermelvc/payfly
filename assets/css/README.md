# 🎨 Assets - Recursos de Estilo e Mídia

## 📋 O que é?

A pasta **assets** armazena todos os recursos visuais e de estilo do PayFly: folhas de CSS, fontes, temas e configurações de apresentação. É o coração visual da aplicação.

## 🎯 Para que serve?

-   **Estilização Global**: Define aparência da aplicação
-   **Temas**: Suporta modo claro/escuro
-   **Responsividade**: Adapta interface para mobile/tablet/desktop
-   **Acessibilidade**: Garante contraste e legibilidade
-   **Reutilização**: CSS modular e componentes reutilizáveis

## 🏗️ Estrutura de Arquivos

```
assets/
├── README.md              # Este arquivo
└── css/
    ├── base.css          # Estilos base e reset CSS
    ├── layout.css        # Estrutura e grid da página
    ├── components.css    # Componentes reutilizáveis
    ├── accessibility.css # Acessibilidade e WCAG
    └── [importado em cada view]
```

## 📄 Arquivos CSS Detalhados

### 1. **base.css** - Fundação

```css
/* Reset CSS - Remove estilos padrão do navegador */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Variáveis de cores - Tema centralizado */
:root {
    --primary: #667eea; /* Roxo principal */
    --secondary: #f093fb; /* Rosa secundário */
    --success: #48bb78; /* Verde sucesso */
    --danger: #f56565; /* Vermelho erro */
}

/* Tipografia base */
body {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}
```

**Contém:**

-   Reset CSS universal
-   Variáveis de cor (theme)
-   Fontes padrão
-   Estilos de links
-   Tabelas e listas

### 2. **layout.css** - Estrutura

```css
/* Container principal */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Grid do dashboard */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

/* Sidebar navigation */
.sidebar {
    width: 250px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
}

/* Main content */
.main-content {
    margin-left: 250px;
    padding: 20px;
}
```

**Contém:**

-   Layout flexbox e grid
-   Sidebar e navbar
-   Containers responsivos
-   Sistema de espaçamento
-   Breakpoints para mobile

### 3. **components.css** - Componentes

```css
/* Botão padrão */
.standardized-button {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.standardized-button-primary {
    background: #667eea;
    color: white;
}

.standardized-button-primary:hover {
    background: #5568d3;
    transform: translateY(-2px);
}

/* Input padrão */
.standardized-input-group {
    margin-bottom: 16px;
}

.standardized-input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
}

/* Modal padrão */
.standardized-modal {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    max-width: 500px;
}
```

**Contém:**

-   Botões (primary, secondary, danger)
-   Inputs e formulários
-   Cards e painéis
-   Modais
-   Switch toggles
-   Tabelas
-   Badges e tags

### 4. **accessibility.css** - Acessibilidade

```css
/* Foco visível para navegação por teclado */
:focus-visible {
    outline: 3px solid #667eea;
    outline-offset: 2px;
}

/* Contraste suficiente para WCAG AA */
body {
    color: #212529;
    background: #fff;
}

/* Skip to content link */
.skip-to-content {
    position: absolute;
    top: -40px;
    left: 0;
    background: #667eea;
    color: white;
    padding: 8px;
    text-decoration: none;
}

.skip-to-content:focus {
    top: 0;
}

/* Suporte a prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation: none !important;
        transition: none !important;
    }
}
```

**Contém:**

-   WCAG 2.1 AA compliance
-   Indicadores de foco
-   Contraste mínimo de cores
-   Suporte a redução de movimento
-   Labels semânticas

## 🎨 Arquitetura de Estilo

```
BASE STYLES (base.css)
        ↓
    LAYOUT (layout.css)
        ↓
  COMPONENTS (components.css)
        ↓
ACCESSIBILITY (accessibility.css)
        ↓
    VIEWS (cada HTML importa todos)
```

## 🌈 Sistema de Cores

```javascript
// Variáveis CSS reutilizáveis
--primary:        #667eea  (Roxo - CTA principal)
--secondary:      #f093fb  (Rosa - Destaque)
--success:        #48bb78  (Verde - Positivo)
--warning:        #ecc94b  (Amarelo - Atenção)
--danger:         #f56565  (Vermelho - Erro)
--light:          #f7fafc  (Cinza claro - BG)
--dark:           #2d3748  (Cinza escuro - Texto)
```

## 📱 Responsividade

```css
/* Desktop (padrão) */
@media (max-width: 1024px) {
    /* Tablet */
    .sidebar {
        width: 180px;
    }
}

@media (max-width: 768px) {
    /* Mobile */
    .sidebar {
        width: 100%;
        position: relative;
    }
    .main-content {
        margin-left: 0;
    }
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
}
```

## 🚀 Como Importar nos HTMLs

```html
<!-- Em TODA a página HTML -->
<link rel="stylesheet" href="../assets/css/base.css" />
<link rel="stylesheet" href="../assets/css/layout.css" />
<link rel="stylesheet" href="../assets/css/components.css" />
<link rel="stylesheet" href="../assets/css/accessibility.css" />
<!-- Depois CSS específico da página -->
<link rel="stylesheet" href="./css/index.css" />
```

## 💡 Motivo da Modularização

✅ **Manutenção Fácil**: Cada arquivo tem responsabilidade clara
✅ **Reutilização**: Componentes CSS usados em múltiplas páginas
✅ **Performance**: Arquivos menores = carregamento mais rápido
✅ **Escalabilidade**: Fácil adicionar novos componentes
✅ **Consistência**: Tema centralizado em `base.css`

## 🎯 Exemplo de Uso

```html
<!-- Botão reutilizável -->
<button class="standardized-button standardized-button-primary">
    💾 Salvar
</button>

<!-- Input reutilizável -->
<div class="standardized-input-group">
    <label for="valor">Valor</label>
    <input type="number" id="valor" class="standardized-input" />
</div>

<!-- Modal reutilizável -->
<div class="standardized-modal-overlay">
    <div class="standardized-modal">
        <div class="standardized-modal-header">
            <h2>Título</h2>
        </div>
        <div class="standardized-modal-body">Conteúdo</div>
    </div>
</div>
```

## 📊 Estatísticas

-   **base.css**: ~2KB - Estilos base
-   **layout.css**: ~4KB - Estrutura
-   **components.css**: ~8KB - Componentes
-   **accessibility.css**: ~2KB - Acessibilidade
-   **Total**: ~16KB (gzipped)

## 🔧 Manutenção

**Ao adicionar novo componente:**

1. Defina classe em `components.css`
2. Use variáveis de cores de `base.css`
3. Teste responsividade em `layout.css`
4. Verifique contraste em `accessibility.css`

**Ao modificar cores:**

1. Atualize variável em `:root` do `base.css`
2. Afeta automaticamente toda aplicação
3. Fácil implementar tema claro/escuro

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
