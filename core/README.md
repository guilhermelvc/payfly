# 🏗️ Core - Núcleo de Arquitetura

## 📋 O que é?

A pasta **core** contém classes base e utilitários fundamentais que toda aplicação depende. É o "esqueleto" sobre o qual tudo mais é construído.

## 🎯 Para que serve?

-   **Padrão Base**: Classe base para todos os modelos
-   **Gerenciamento de Entidades**: CRUD centralizado
-   **Filtros**: Sistema de filtros reutilizável
-   **Modais**: Gerenciador de modais da UI

## 🏗️ Estrutura de Arquivos

```
core/
├── README.md              # Este arquivo
├── BaseModel.js           # Classe base para modelos
├── EntityManager.js       # Gerenciador de CRUD
├── FilterSystem.js        # Sistema de filtros
└── ModalManager.js        # Gerenciador de modais
```

## 🔧 Arquivos Detalhados

### 1. **BaseModel.js** - Classe Base

```javascript
class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.data = [];
        this.currentUser = null;
    }

    // Inicializar modelo
    async init() {
        this.currentUser = await supabase.auth.getUser();
        console.log(`✅ ${this.tableName} initialized`);
    }

    // Buscar todos os registros
    async getAll() {
        const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("usuario_id", this.currentUser.id);

        if (error) throw error;
        this.data = data;
        return data;
    }

    // Buscar um registro
    async getById(id) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id)
            .single();

        if (error) throw error;
        return data;
    }

    // Criar novo registro
    async create(item) {
        const { data, error } = await supabase.from(this.tableName).insert([
            {
                ...item,
                usuario_id: this.currentUser.id,
                criado_em: new Date().toISOString(),
            },
        ]);

        if (error) throw error;
        return data[0];
    }

    // Atualizar registro
    async update(id, updates) {
        const { data, error } = await supabase
            .from(this.tableName)
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) throw error;
        return data[0];
    }

    // Deletar registro
    async delete(id) {
        const { error } = await supabase
            .from(this.tableName)
            .delete()
            .eq("id", id);

        if (error) throw error;
        return true;
    }
}
```

**Por que?** Evita repetir código CRUD em cada modelo. Cada modelo herda disso:

```javascript
// models/despesa.js
class DespesaModel extends BaseModel {
    constructor() {
        super("despesas"); // Nome da tabela
    }

    // Métodos específicos de Despesa
    async getDespesasByCategory(category) {
        return this.data.filter((d) => d.categoria === category);
    }
}
```

### 2. **EntityManager.js** - Gerenciador de CRUD

```javascript
class EntityManager {
    static models = {};

    // Registrar modelo
    static register(name, model) {
        this.models[name] = model;
    }

    // Obter modelo
    static get(name) {
        return this.models[name];
    }

    // CRUD genérico para qualquer entidade
    static async create(entityName, data) {
        return await this.get(entityName).create(data);
    }

    static async read(entityName, id) {
        return await this.get(entityName).getById(id);
    }

    static async update(entityName, id, data) {
        return await this.get(entityName).update(id, data);
    }

    static async delete(entityName, id) {
        return await this.get(entityName).delete(id);
    }

    // Listar todas as entidades de um tipo
    static async list(entityName) {
        return await this.get(entityName).getAll();
    }
}
```

**Uso:**

```javascript
// Inicializar
EntityManager.register("despesas", new DespesaModel());
EntityManager.register("receitas", new ReceitaModel());

// Usar
const despesa = await EntityManager.create("despesas", {
    descricao: "Almoço",
    valor: 35.0,
    data: "2025-11-17",
});

await EntityManager.update("despesas", despesa.id, {
    valor: 40.0,
});

await EntityManager.delete("despesas", despesa.id);
```

### 3. **FilterSystem.js** - Sistema de Filtros

```javascript
class FilterSystem {
    static filters = {};

    // Adicionar critério de filtro
    static addFilter(name, criteria) {
        this.filters[name] = criteria;
    }

    // Aplicar todos os filtros
    static apply(data) {
        let result = [...data];

        // Percorre cada filtro registrado
        for (const [name, criteria] of Object.entries(this.filters)) {
            result = result.filter(criteria);
        }

        return result;
    }

    // Limpar filtros
    static clear() {
        this.filters = {};
    }

    // Exemplo: Filtro por categoria
    static filterByCategory(data, category) {
        if (!category) return data;
        return data.filter((item) => item.categoria === category);
    }

    // Exemplo: Filtro por intervalo de valor
    static filterByValueRange(data, min, max) {
        return data.filter((item) => item.valor >= min && item.valor <= max);
    }

    // Exemplo: Filtro por data
    static filterByDateRange(data, startDate, endDate) {
        return data.filter((item) => {
            const date = new Date(item.data);
            return date >= startDate && date <= endDate;
        });
    }
}
```

**Uso:**

```javascript
// Aplicar múltiplos filtros
let filtered = despesas;

filtered = FilterSystem.filterByCategory(filtered, "Alimentação");
filtered = FilterSystem.filterByValueRange(filtered, 0, 100);
filtered = FilterSystem.filterByDateRange(
    filtered,
    new Date("2025-11-01"),
    new Date("2025-11-30")
);

console.log(filtered); // Despesas filtradas
```

### 4. **ModalManager.js** - Gerenciador de Modais

```javascript
class ModalManager {
    static modals = {};

    // Registrar modal
    static register(name, element) {
        this.modals[name] = {
            element: element || document.getElementById(name),
            isOpen: false,
        };
    }

    // Abrir modal
    static open(name) {
        const modal = this.modals[name];
        if (!modal) {
            console.error(`Modal "${name}" não registrado`);
            return;
        }

        modal.element.classList.add("active");
        modal.element.style.display = "flex";
        modal.isOpen = true;

        // Travar scroll da página
        document.body.style.overflow = "hidden";
    }

    // Fechar modal
    static close(name) {
        const modal = this.modals[name];
        if (!modal) return;

        modal.element.classList.remove("active");
        modal.element.style.display = "none";
        modal.isOpen = false;

        // Restaurar scroll
        document.body.style.overflow = "auto";
    }

    // Toggle modal
    static toggle(name) {
        const modal = this.modals[name];
        if (modal.isOpen) {
            this.close(name);
        } else {
            this.open(name);
        }
    }

    // Verificar se está aberto
    static isOpen(name) {
        return this.modals[name]?.isOpen || false;
    }

    // Fechar todos os modais
    static closeAll() {
        Object.keys(this.modals).forEach((name) => this.close(name));
    }
}
```

**Uso:**

```javascript
// HTML
<div id="modal-adicionar" class="modal">
    <button onclick="ModalManager.close('modal-adicionar')">Fechar</button>
</div>;

// JavaScript - Inicializar
ModalManager.register("modal-adicionar");

// Usar
ModalManager.open("modal-adicionar");
ModalManager.close("modal-adicionar");
ModalManager.toggle("modal-adicionar");
```

## 🔄 Arquitetura em Camadas

```
┌─────────────────────────────────┐
│    VIEWS (HTML)                 │
│  (Interface do Usuário)         │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│    MODELS (models/)             │
│  (DespesaModel, ReceitaModel)   │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│    CORE (core/)                 │
│  (BaseModel, FilterSystem)      │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│    SUPABASE API                 │
│  (Banco de dados)               │
└─────────────────────────────────┘
```

## 💡 Vantagens da Arquitetura

✅ **Código Seco (DRY)**: Sem repetição
✅ **Modular**: Fácil entender e testar
✅ **Reutilizável**: Core usada por todos
✅ **Extensível**: Heranças e polimorfismo
✅ **Manutenível**: Mudanças em um lugar

## 📝 Exemplo Completo: Criar Despesa

```javascript
// 1. Receber dados do formulário
const despesaData = {
    descricao: "Almoço",
    valor: 35.0,
    data: "2025-11-17",
    categoria: "Alimentação",
};

// 2. Usar BaseModel (herança)
class DespesaModel extends BaseModel {
    constructor() {
        super("despesas");
    }
}

// 3. Usar EntityManager
const model = new DespesaModel();
const despesa = await model.create(despesaData);

// 4. Filtrar se necessário
const filtered = FilterSystem.filterByCategory([despesa], "Alimentação");

// 5. Atualizar UI
ModalManager.close("modal-adicionar");
Toast.success("Despesa criada!");
await app.loadDespesas(); // Atualiza lista
```

## 🎯 Padrão de Design Usado

-   **Herança**: `DespesaModel extends BaseModel`
-   **Composition**: `ModalManager` contém modals
-   **Singleton**: `EntityManager`, `FilterSystem`
-   **Observer**: Eventos de mudança (implementado em modelos)

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
