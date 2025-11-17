# 📊 Models - Modelos de Dados

## 📋 O que é?

A pasta **models** contém as classes que representam cada entidade de negócio do PayFly (Despesas, Receitas, Poupança, etc). Cada modelo é responsável pela lógica de dados da sua entidade e comunica com o banco de dados Supabase.

## 🎯 Para que serve?

-   **CRUD**: Criar, ler, atualizar, deletar registros
-   **Validação**: Validar dados antes de salvar
-   **Negócio**: Lógica específica de cada entidade
-   **Banco de Dados**: Interface com Supabase
-   **Estado**: Manter dados em cache local
-   **Recorrência**: Gestão de transações recorrentes

## 🏗️ Estrutura de Arquivos

```
models/
├── README.md                      # Este arquivo
├── BaseModel.js                   # [Herda do core/]
├── despesa.js                     # Modelo de Despesas
├── despesa-refactored.js          # Versão otimizada
├── receita.js                     # Modelo de Receitas
├── receita-refactored.js          # Versão otimizada
├── poupanca.js                    # Modelo de Poupança
├── investimentos.js               # Modelo de Investimentos
├── investimentos-refactored.js    # Versão otimizada
├── plano.js                       # Modelo de Planos/Objetivos
├── dashboard.js                   # Agregação de dados para dashboard
├── configuracoes.js               # Configurações do usuário
├── login.js                       # Autenticação
├── painel.js                      # Dados do painel principal
└── cadastro.js                    # Registro de novo usuário
```

## 🔧 Padrão de Modelo

Todos os modelos seguem o mesmo padrão:

```javascript
class DespesaModel extends BaseModel {
    constructor() {
        super("despesas"); // Nome da tabela no Supabase
    }

    // ========== CRUD BÁSICO ==========

    // Criar
    async save(data) {
        if (!this.validate(data)) {
            throw new Error("Dados inválidos");
        }
        return await this.create(data);
    }

    // Ler
    async load(id) {
        return await this.getById(id);
    }

    // Atualizar
    async update(id, data) {
        if (!this.validate(data)) {
            throw new Error("Dados inválidos");
        }
        return await super.update(id, data);
    }

    // Deletar
    async delete(id) {
        return await super.delete(id);
    }

    // ========== LÓGICA DE NEGÓCIO ==========

    // Filtrar por categoria
    async getByCategory(category) {
        const all = await this.getAll();
        return all.filter((item) => item.categoria === category);
    }

    // Filtrar por período
    async getByDateRange(startDate, endDate) {
        const all = await this.getAll();
        return all.filter((item) => {
            const date = new Date(item.data);
            return date >= startDate && date <= endDate;
        });
    }

    // ========== VALIDAÇÃO ==========

    validate(data) {
        if (!data.descricao || data.descricao.trim() === "") {
            throw new Error("Descrição é obrigatória");
        }
        if (!data.valor || data.valor <= 0) {
            throw new Error("Valor deve ser maior que 0");
        }
        if (!data.data) {
            throw new Error("Data é obrigatória");
        }
        return true;
    }

    // ========== CÁLCULOS ==========

    // Total de despesas
    async getTotalByMonth(month, year) {
        const all = await this.getAll();
        return all
            .filter((d) => {
                const date = new Date(d.data);
                return date.getMonth() === month && date.getFullYear() === year;
            })
            .reduce((sum, d) => sum + d.valor, 0);
    }
}
```

## 📖 Detalhes de Cada Modelo

### 1. **despesa.js / despesa-refactored.js** - Despesas

```javascript
class DespesaModel extends BaseModel {
    constructor() {
        super("despesas");
    }

    // Suporte a recorrência
    async saveWithRecurrence(data) {
        if (data.is_recorrente && data.recorrencia_meses > 1) {
            // Criar transação raiz
            const rootDespesa = await this.create({
                ...data,
                is_recorrente: true,
            });

            // Criar cópias para cada mês
            const baseDate = new Date(data.data);
            for (let i = 1; i < data.recorrencia_meses; i++) {
                const newDate = new Date(baseDate);
                newDate.setMonth(newDate.getMonth() + i);

                await this.create({
                    ...data,
                    data: newDate.toISOString().split("T")[0],
                    despesa_pai_id: rootDespesa.id,
                });
            }

            return rootDespesa;
        } else {
            return await this.create(data);
        }
    }

    // Deletar despesa e todas suas recorrências
    async deleteWithRecurrences(id) {
        const despesa = await this.getById(id);

        if (despesa.is_recorrente) {
            // Deletar todas as filhas
            const children = await this.getChildRecurrences(id);
            for (const child of children) {
                await super.delete(child.id);
            }
        }

        return await super.delete(id);
    }

    // Obter todas as recorrências de uma despesa
    async getChildRecurrences(parentId) {
        const all = await this.getAll();
        return all.filter((d) => d.despesa_pai_id === parentId);
    }

    // Filtrar por recorrência
    async getRecurrent() {
        const all = await this.getAll();
        return all.filter((d) => d.is_recorrente);
    }

    async getNonRecurrent() {
        const all = await this.getAll();
        return all.filter((d) => !d.is_recorrente);
    }
}
```

### 2. **receita.js** - Receitas

```javascript
class ReceitaModel extends BaseModel {
    constructor() {
        super("receitas");
    }

    // Similar a DespesaModel, suporta recorrência
    async saveWithRecurrence(data) {
        // Mesma lógica de recorrência
    }

    // Receitas por fonte
    async getBySource(source) {
        const all = await this.getAll();
        return all.filter((r) => r.categoria === source);
    }

    // Total de receitas no período
    async getTotalByPeriod(months = 1) {
        const all = await this.getAll();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        return all
            .filter((r) => new Date(r.data) >= startDate)
            .reduce((sum, r) => sum + r.valor, 0);
    }
}
```

### 3. **poupanca.js** - Poupança

```javascript
class PoupancaModel extends BaseModel {
    constructor() {
        super("poupanca");
    }

    // Saldo total de poupança
    async getSaldoTotal() {
        const all = await this.getAll();

        let saldo = 0;
        for (const item of all) {
            if (item.tipo === "Depósito") {
                saldo += item.valor;
            } else if (item.tipo === "Saque") {
                saldo -= item.valor;
            }
        }

        return saldo;
    }

    // Histórico de movimentação
    async getMovementHistory() {
        return await this.getAll();
    }

    // Poupança vinculada a plano
    async getByPlano(planoId) {
        const all = await this.getAll();
        return all.filter((p) => p.plano_vinculado_id === planoId);
    }

    // Progresso em relação ao plano
    async getPlanoProgress(planoId) {
        const poupancas = await this.getByPlano(planoId);
        return poupancas.reduce((sum, p) => {
            if (p.tipo === "Depósito") return sum + p.valor;
            if (p.tipo === "Saque") return sum - p.valor;
            return sum;
        }, 0);
    }
}
```

### 4. **investimentos.js** - Investimentos

```javascript
class InvestimentosModel extends BaseModel {
    constructor() {
        super("investimentos");
    }

    // Patrimônio total investido
    async getTotalInvested() {
        const all = await this.getAll();
        return all.reduce((sum, inv) => sum + inv.valor_investido, 0);
    }

    // Valor atual do patrimônio (incluindo rentabilidade)
    async getCurrentPatrimony() {
        const all = await this.getAll();
        return all.reduce((sum, inv) => {
            const ganho = (inv.valor_investido * inv.rentabilidade) / 100;
            return sum + inv.valor_investido + ganho;
        }, 0);
    }

    // Lucro total
    async getTotalProfit() {
        const all = await this.getAll();
        return all.reduce((sum, inv) => {
            const ganho = (inv.valor_investido * inv.rentabilidade) / 100;
            return sum + ganho;
        }, 0);
    }

    // Por tipo (Ação, Tesouro, CDB)
    async getByType(type) {
        const all = await this.getAll();
        return all.filter((inv) => inv.tipo === type);
    }
}
```

### 5. **plano.js** - Planos/Objetivos

```javascript
class PlanoModel extends BaseModel {
    constructor() {
        super("planos");
    }

    // Calcular progresso
    async getProgress(planoId) {
        const plano = await this.getById(planoId);
        return (plano.valor_poupado / plano.valor) * 100;
    }

    // Quantos dias faltam?
    async getDaysRemaining(planoId) {
        const plano = await this.getById(planoId);
        const today = new Date();
        const target = new Date(plano.data);
        const diff = target - today;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Quanto poupar por mês?
    async getMonthlyTarget(planoId) {
        const plano = await this.getById(planoId);
        const remaining = plano.valor - plano.valor_poupado;
        const monthsLeft = Math.ceil(this.getDaysRemaining(planoId) / 30);
        return remaining / monthsLeft;
    }

    // Planos ativos
    async getActive() {
        const all = await this.getAll();
        return all.filter((p) => p.status === "ativo");
    }

    // Planos por prioridade
    async getByPriority(priority) {
        const all = await this.getAll();
        return all.filter((p) => p.prioridade === priority);
    }
}
```

### 6. **dashboard.js** - Agregação de Dados

```javascript
class DashboardModel {
    // Agregar dados de TODAS as tabelas
    static async getCompleteSummary() {
        const despesas = new DespesaModel();
        const receitas = new ReceitaModel();
        const poupanca = new PoupancaModel();
        const investimentos = new InvestimentosModel();

        const [totalDespesas, totalReceitas, saldoPoupanca, patrimonio] =
            await Promise.all([
                despesas.getTotalByMonth(
                    new Date().getMonth(),
                    new Date().getFullYear()
                ),
                receitas.getTotalByPeriod(1),
                poupanca.getSaldoTotal(),
                investimentos.getTotalInvested(),
            ]);

        return {
            totalDespesas,
            totalReceitas,
            saldoPoupanca,
            patrimonio,
            liquidoMes: totalReceitas - totalDespesas,
            dataAtualizado: new Date(),
        };
    }

    // Dados para gráficos
    static async getChartData() {
        const despesas = new DespesaModel();
        const all = await despesas.getAll();

        // Agrupar por categoria
        const byCategory = {};
        all.forEach((d) => {
            if (!byCategory[d.categoria]) byCategory[d.categoria] = 0;
            byCategory[d.categoria] += d.valor;
        });

        return byCategory;
    }
}
```

## 🔄 Fluxo de Dados

```
HTML (usuário clica)
    ↓
Model.save(data)
    ↓
validate()
    ↓
BaseModel.create()
    ↓
Supabase.insert()
    ↓
toast("Sucesso!")
    ↓
view.refresh()
```

## 💡 Vantagens do Padrão

✅ **Separação de Responsabilidades**: Model = dados, View = UI
✅ **Reutilização**: Métodos comuns em BaseModel
✅ **Testável**: Fácil mockar Supabase
✅ **Manutenível**: Lógica centralizada por entidade
✅ **Escalável**: Novo modelo = copiar template

## 📝 Criar Novo Modelo

```javascript
// models/novo_modelo.js

class NovoModelo extends BaseModel {
    constructor() {
        super("nome_tabela_supabase");
    }

    // Adicionar métodos específicos aqui
    async metodoCustomizado() {
        return await this.getAll();
    }
}

// Inicializar em main.js
const novoModelo = new NovoModelo();
await novoModelo.init();
```

## 🎯 Recorrência - Implementação

Todos os modelos suportam recorrência (repetição mensal):

```javascript
// Ao salvar com recorrência
const data = {
    descricao: "Aluguel",
    valor: 1200,
    data: "2025-11-17",
    is_recorrente: true, // ← Ativa recorrência
    recorrencia_meses: 6, // ← Repetir 6 meses
};

await despesaModel.saveWithRecurrence(data);

// Cria transação pai + 5 filhas (6 no total)
// Cada filha referencia a pai via "despesa_pai_id"
```

---

**Versão**: 2.0  
**Última atualização**: Nov 2025  
**Status**: ✅ Produção
