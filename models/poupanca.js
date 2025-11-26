// ================ Poupança Controller com Supabase ================
console.log("💰 Poupanca.js carregado");

// Variáveis globais
let transactions = [];
let filteredTransactions = [];
let totalPoupanca = 0;

// Variável global para controlar estado do filtro
let isPoupancaFilterActive = false;
let currentFilterCriteria = null;
let currentEditingPoupanca = null;

// ================ Integração Supabase ================

// Função auxiliar para reaplicar filtros após operações CRUD
async function reloadPoupancaDataRespectingFilter() {
    if (isPoupancaFilterActive && currentFilterCriteria) {
        console.log("🔄 Reaplicando filtro após operação CRUD");
        await applyStoredPoupancaFilter();
    } else {
        await loadPoupancaFromSupabase();
    }
}

// Função para aplicar filtro armazenado
async function applyStoredPoupancaFilter() {
    if (!currentFilterCriteria) return;

    try {
        const { descricao, valor, data, tipo } = currentFilterCriteria;

        let query = window.supabase
            .from("poupanca")
            .select("*")
            .eq("usuario_id", currentFilterCriteria.userId);

        if (descricao) query = query.ilike("descricao", `%${descricao}%`);
        if (valor && !isNaN(parseFloat(valor)))
            query = query.eq("valor", parseFloat(valor));
        if (data) query = query.eq("data", data);
        if (tipo) query = query.ilike("tipo", `%${tipo}%`);

        const { data: rows, error } = await query.order("criado_em", {
            ascending: false,
        });
        if (error) throw error;

        const table = document.getElementById("data-table");
        const tbody = table?.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = "";
        } else if (table) {
            const thead = table.querySelector("thead");
            table.innerHTML = "";
            if (thead) table.appendChild(thead);
        }

        transactions =
            rows?.map((item) => ({
                id: item.id,
                description: item.descricao,
                amount: parseFloat(item.valor),
                date: item.data,
                tipo: item.tipo,
                plano: item.plano_vinculado_nome || "",
                category: item.categoria || "Poupança",
                is_recorrente: item.is_recorrente || false,
                recorrencia_meses: item.recorrencia_meses || 1,
            })) || [];

        totalPoupanca = transactions.reduce(
            (sum, item) => sum + item.amount,
            0
        );
        transactions.forEach((item) => addPoupancaRowToTable(item));
        updatePoupancaDisplay();
    } catch (error) {
        console.error("Erro aplicando filtro de poupança:", error);
        showErrorToast("Erro no filtro", "Não foi possível aplicar o filtro");
    }
}

async function loadPoupancaFromSupabase() {
    try {
        if (isPoupancaFilterActive) {
            console.log("⏸️ Carregamento bloqueado - filtro ativo");
            return;
        }

        console.log("📊 Carregando todas as poupanças (sem filtro)");

        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const { data, error } = await window.supabase
            .from("poupanca")
            .select("*")
            .eq("usuario_id", user.id)
            .order("criado_em", { ascending: false });

        if (error) throw error;

        // Limpeza da tabela
        const table = document.getElementById("data-table");
        if (table) {
            const tbody = table.querySelector("tbody");
            if (tbody) {
                tbody.innerHTML = "";
            } else {
                const thead = table.querySelector("thead");
                table.innerHTML = "";
                if (thead) table.appendChild(thead);
            }
        }

        // Conversão dos dados para formato compatível
        transactions =
            data?.map((item) => ({
                id: item.id,
                description: item.descricao,
                amount: parseFloat(item.valor),
                date: item.data,
                tipo: item.tipo,
                plano: item.plano_vinculado_nome || "",
                category: item.categoria || "Poupança",
                is_recorrente: item.is_recorrente || false,
                recorrencia_meses: item.recorrencia_meses || 1,
            })) || [];

        totalPoupanca = transactions.reduce(
            (sum, item) => sum + item.amount,
            0
        );
        transactions.forEach((item) => addPoupancaRowToTable(item));
        updatePoupancaDisplay();

        console.log("📊 Todas as poupanças carregadas");
    } catch (err) {
        console.error("Erro carregando poupança do Supabase", err);
        loadDemoDataFallback();
    }
}

// Fallback para dados demo se Supabase falhar
function loadDemoDataFallback() {
    const hoje = new Date();
    const mesPassado = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        hoje.getDate()
    );
    const duasSemanas = new Date(hoje.getTime() - 14 * 24 * 60 * 60 * 1000);

    transactions = [
        {
            id: "demo1",
            description: "Depósito mensal automático",
            amount: 500.0,
            date: hoje.toISOString().split("T")[0],
            tipo: "Depósito",
            plano: "Viagem Europa",
            category: "Poupança",
            is_recorrente: false,
            recorrencia_meses: 1,
        },
        {
            id: "demo2",
            description: "Rendimento da poupança",
            amount: 25.5,
            date: mesPassado.toISOString().split("T")[0],
            tipo: "Rendimento",
            plano: "",
            category: "Rendimento",
            is_recorrente: false,
            recorrencia_meses: 1,
        },
        {
            id: "demo3",
            description: "Depósito extra",
            amount: 200.0,
            date: duasSemanas.toISOString().split("T")[0],
            tipo: "Depósito",
            plano: "Casa Própria",
            category: "Poupança",
            is_recorrente: false,
            recorrencia_meses: 1,
        },
        {
            id: "demo4",
            description: "Saque emergencial",
            amount: -150.0,
            date: duasSemanas.toISOString().split("T")[0],
            tipo: "Saque",
            plano: "",
            category: "Saque",
            is_recorrente: false,
            recorrencia_meses: 1,
        },
    ];

    totalPoupanca = transactions.reduce((sum, t) => sum + t.amount, 0);
    filteredTransactions = [...transactions];
    console.log("✅ Dados de poupança carregados:", transactions);
}

// ================ Carregamento de Planos do Banco ================

async function loadPlanosFromSupabase() {
    try {
        if (!window.supabase) return [];

        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return [];

        const { data: planos, error } = await window.supabase
            .from("planos")
            .select(
                "id, descricao, valor, categoria, data, status, valor_poupado, progresso_percentual"
            )
            .eq("usuario_id", user.id)
            .order("criado_em", { ascending: false });

        if (error) throw error;
        return planos || [];
    } catch (err) {
        console.error("Erro ao carregar planos:", err);
        return [];
    }
}

async function populatePlanoSelect() {
    try {
        const planos = await loadPlanosFromSupabase();
        const planoSelect = document.getElementById("plano");

        if (!planoSelect) return;

        // Limpa opções existentes exceto a primeira (vazia)
        const firstOption = planoSelect.querySelector('option[value=""]');
        planoSelect.innerHTML = "";
        if (firstOption) {
            planoSelect.appendChild(firstOption);
        } else {
            planoSelect.innerHTML =
                '<option value="">Nenhum plano específico</option>';
        }

        // Adiciona planos reais do banco
        if (planos.length === 0) {
            // Se não há planos, adiciona opção indicativa
            const option = document.createElement("option");
            option.value = "";
            option.textContent =
                "📋 Nenhum plano cadastrado - Vá para 'Planos' para criar";
            option.disabled = true;
            planoSelect.appendChild(option);
            console.log("ℹ️ Nenhum plano encontrado no banco de dados");
        } else {
            planos.forEach((plano) => {
                const option = document.createElement("option");
                option.value = plano.descricao;
                option.textContent = `${plano.descricao} - ${formatCurrency(
                    plano.valor
                )}`;
                planoSelect.appendChild(option);
            });
            console.log(`📋 ${planos.length} planos carregados no select`);
        }
    } catch (err) {
        console.error("Erro ao popular select de planos:", err);
    }
}

// ================ Funções CRUD Supabase ================

async function savePoupanca(
    descricao,
    valor,
    data,
    tipo = "Depósito",
    plano = ""
) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error("Usuário não autenticado");

        // Verifica se é poupança recorrente
        const isRecorrente =
            document.getElementById("is_recorrente")?.checked || false;
        const recorrenciaMeses = isRecorrente
            ? parseInt(document.getElementById("recorrencia_meses")?.value || 1)
            : 1;

        // Ajusta o sinal baseado no tipo
        const valorFinal = tipo.toLowerCase().includes("saque")
            ? -Math.abs(parseFloat(valor))
            : Math.abs(parseFloat(valor));

        // Se é recorrente, cria múltiplas poupanças
        if (isRecorrente && recorrenciaMeses > 1) {
            const poupancasParaCriar = [];
            const dataInicial = new Date(data);

            // Cria uma poupança para cada mês
            for (let i = 0; i < recorrenciaMeses; i++) {
                const novaData = new Date(dataInicial);
                novaData.setMonth(novaData.getMonth() + i);

                // Formata a data como YYYY-MM-DD
                const dataFormatada = novaData.toISOString().split("T")[0];

                // Se tem plano selecionado, busca o ID do plano
                let planoVinculadoId = null;
                let planoVinculadoNome = null;

                if (plano && plano !== "") {
                    // Busca o plano pelo nome para obter o ID
                    const { data: planoData, error: planoError } =
                        await window.supabase
                            .from("planos")
                            .select("id, descricao")
                            .eq("usuario_id", user.id)
                            .eq("descricao", plano)
                            .single();

                    if (!planoError && planoData) {
                        planoVinculadoId = planoData.id;
                        planoVinculadoNome = planoData.descricao;
                    }
                }

                poupancasParaCriar.push({
                    descricao,
                    valor: valorFinal,
                    data: dataFormatada,
                    tipo,
                    plano_vinculado_id: planoVinculadoId,
                    plano_vinculado_nome: planoVinculadoNome,
                    categoria: "Poupança",
                    usuario_id: user.id,
                    is_recorrente: i === 0 ? true : false, // Marca apenas a primeira como recorrente
                    recorrencia_meses: i === 0 ? recorrenciaMeses : 1,
                });
            }

            // Insere todas as poupanças
            const { error } = await window.supabase
                .from("poupanca")
                .insert(poupancasParaCriar);
            if (error) throw error;

            console.log(
                `✅ ${recorrenciaMeses} poupanças recorrentes criadas com sucesso!`
            );
        } else {
            // Cria poupança única (sem recorrência)
            // Se tem plano selecionado, busca o ID do plano
            let planoVinculadoId = null;
            let planoVinculadoNome = null;

            if (plano && plano !== "") {
                // Busca o plano pelo nome para obter o ID
                const { data: planoData, error: planoError } =
                    await window.supabase
                        .from("planos")
                        .select("id, descricao")
                        .eq("usuario_id", user.id)
                        .eq("descricao", plano)
                        .single();

                if (!planoError && planoData) {
                    planoVinculadoId = planoData.id;
                    planoVinculadoNome = planoData.descricao;
                }
            }

            const poupancaData = {
                descricao,
                valor: valorFinal,
                data,
                tipo,
                plano_vinculado_id: planoVinculadoId,
                plano_vinculado_nome: planoVinculadoNome,
                categoria: "Poupança",
                usuario_id: user.id,
                is_recorrente: false,
                recorrencia_meses: 1,
            };

            const { error } = await window.supabase
                .from("poupanca")
                .insert([poupancaData]);
            if (error) throw error;

            console.log("✅ Poupança única criada com sucesso!");
        }

        await reloadPoupancaDataRespectingFilter();
        showSuccessToast(
            "Poupança salva!",
            "Movimentação adicionada com sucesso!"
        );

        // Fecha o modal após salvar com sucesso
        if (typeof Modal !== "undefined" && Modal.close) {
            Modal.close();
        } else {
            // Fallback para fechar modal
            const modalOverlay = document.querySelector(
                ".standardized-modal-overlay"
            );
            if (modalOverlay) {
                modalOverlay.style.display = "none";
            }
        }

        // Limpa o formulário
        const form = document.querySelector("#form");
        if (form) {
            form.reset();
            const hoje = new Date().toISOString().split("T")[0];
            document.getElementById("data").value = hoje;
        }

        // Reseta o switch de recorrência
        const recorrenceCheckbox = document.getElementById("is_recorrente");
        if (recorrenceCheckbox) {
            recorrenceCheckbox.checked = false;
            document.getElementById("recorrencia_meses_group").style.display =
                "none";
        }
    } catch (err) {
        console.error("Erro ao salvar poupança:", err);
        showErrorToast(
            "Erro ao salvar",
            "Não foi possível salvar a movimentação"
        );
    }
}

async function updatePoupancaInSupabase(poupancaId, updatedData) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");

        // Ajusta o sinal baseado no tipo
        if (updatedData.valor && updatedData.tipo) {
            updatedData.valor = updatedData.tipo.toLowerCase().includes("saque")
                ? -Math.abs(parseFloat(updatedData.valor))
                : Math.abs(parseFloat(updatedData.valor));
        }

        const { error } = await window.supabase
            .from("poupanca")
            .update(updatedData)
            .eq("id", poupancaId);
        if (error) throw error;

        await reloadPoupancaDataRespectingFilter();
        showSuccessToast(
            "Poupança atualizada!",
            "Movimentação atualizada com sucesso!"
        );
    } catch (err) {
        console.error("Erro ao atualizar poupança:", err);
        showErrorToast(
            "Erro ao atualizar",
            "Não foi possível atualizar a movimentação"
        );
    }
}

async function removePoupancaFromSupabase(poupancaId) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { error } = await window.supabase
            .from("poupanca")
            .delete()
            .eq("id", poupancaId);
        if (error) throw error;

        await reloadPoupancaDataRespectingFilter();
        showSuccessToast(
            "Poupança removida!",
            "Movimentação excluída com sucesso!"
        );
    } catch (err) {
        console.error("Erro ao remover poupança:", err);
        showErrorToast(
            "Erro ao excluir",
            "Não foi possível excluir a movimentação"
        );
    }
}

// ================ Inicialização ================
document.addEventListener("DOMContentLoaded", async function () {
    console.log("🚀 Inicializando página de poupança...");

    // Verifica se o usuário está autenticado e carrega dados
    if (window.supabase) {
        try {
            const { data } = await window.supabase.auth.getUser();
            if (data?.user) {
                // Usuário autenticado, cadastra no sistema se necessário
                await window.supabase.from("usuarios").upsert({
                    id: data.user.id,
                    nome: data.user.user_metadata?.name || "Usuário",
                    email: data.user.email,
                });
                await loadPoupancaFromSupabase();
            } else {
                loadDemoDataFallback();
            }
        } catch (error) {
            console.error("Erro na inicialização:", error);
            loadDemoDataFallback();
        }
    } else {
        loadDemoDataFallback();
    }

    filteredTransactions = [...transactions];
    updateTotalDisplay();
    updateTable();

    // Carrega planos para o select
    await populatePlanoSelect();

    // Define data padrão como hoje
    const hoje = new Date().toISOString().split("T")[0];
    document.getElementById("data").value = hoje;

    console.log("✅ Poupança inicializada");
});

// ================ Atualização Automática de Planos ================

// Atualiza planos quando a página ganha foco (usuário volta da página de planos)
window.addEventListener("focus", async function () {
    console.log("👁️ Página ganhou foco - atualizando planos...");
    await populatePlanoSelect();
});

// Atualiza planos quando storage local muda (sincronização entre abas)
window.addEventListener("storage", async function (e) {
    if (e.key === "planos_updated") {
        console.log("🔄 Detectada atualização de planos - sincronizando...");
        await populatePlanoSelect();
    }
});

// ================ Funções de Atualização ================
function addPoupancaRowToTable(item) {
    const table = document.getElementById("data-table");
    const tbody = table?.querySelector("tbody") || table;
    if (!tbody) return;

    const row = document.createElement("tr");
    row.id = `row-${item.id}`;

    const amountClass =
        item.amount >= 0 ? "performance-positive" : "performance-negative";

    row.innerHTML = `
    <td>${item.description}</td>
    <td class="${amountClass}">${formatCurrency(Math.abs(item.amount))}</td>
    <td>${formatDate(item.date)}</td>
    <td>${item.tipo}</td>
    <td>${item.plano || "-"}</td>
    <td><button onclick="editPoupancaTransaction('${
        item.id
    }')" class="edit-button" title="Editar"><ion-icon name="create-outline" style="font-size: 20px;"></ion-icon></button></td>
    <td><button onclick="showDeletePoupancaConfirm('${
        item.id
    }')" class="delete-button" title="Excluir"><ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon></button></td>
  `;

    tbody.appendChild(row);
}

// Funções para confirmação de exclusão de poupança
function showDeletePoupancaConfirm(poupancaId) {
    window.pendingDeletePoupancaId = poupancaId;
    document.getElementById("deleteConfirmModal").classList.add("active");
}

window.showDeletePoupancaConfirm = showDeletePoupancaConfirm;

// Adicionar ao escopo global para confirmar exclusão de poupança
const originalConfirmDelete = window.confirmDelete;
window.confirmDelete = function () {
    if (window.pendingDeletePoupancaId) {
        deletePoupancaTransaction(window.pendingDeletePoupancaId);
        window.pendingDeletePoupancaId = null;
        closeDeleteConfirm();
    } else if (originalConfirmDelete) {
        originalConfirmDelete();
    }
};

function updateTotalDisplay() {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    const filteredTotal = filteredTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
    );

    document.getElementById("totalPoupancaDisplay").textContent =
        formatCurrency(total);
    document.getElementById("filteredPoupancaDisplay").textContent =
        formatCurrency(filteredTotal);

    console.log(
        `💰 Total atualizado: ${formatCurrency(
            total
        )} | Filtrado: ${formatCurrency(filteredTotal)}`
    );
}

function updatePoupancaDisplay() {
    updateTotalDisplay();
}

function updateTable() {
    const tbody = document.querySelector("#data-table tbody");
    tbody.innerHTML = "";

    filteredTransactions.forEach((transaction, index) => {
        const row = document.createElement("tr");

        const amountClass =
            transaction.amount >= 0
                ? "performance-positive"
                : "performance-negative";

        row.innerHTML = `
            <td>${transaction.description}</td>
            <td class="${amountClass}">${formatCurrency(
            Math.abs(transaction.amount)
        )}</td>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.tipo}</td>
            <td>${transaction.plano || "-"}</td>
            <td><button onclick="editTransaction(${index})" class="edit-button" title="Editar"><ion-icon name="create-outline" style="font-size: 20px;"></ion-icon></button></td>
            <td><button onclick="showDeleteTransactionConfirm(${index})" class="delete-button" title="Excluir"><ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon></button></td>
        `;

        tbody.appendChild(row);
    });

    // Função para confirmação de exclusão de transação
    function showDeleteTransactionConfirm(index) {
        window.pendingDeleteTransactionIndex = index;
        document.getElementById("deleteConfirmModal").classList.add("active");
    }

    window.showDeleteTransactionConfirm = showDeleteTransactionConfirm;

    // Atualizar confirmDelete para lidar com transações também
    const previousConfirmDelete = window.confirmDelete;
    window.confirmDelete = function () {
        if (
            window.pendingDeleteTransactionIndex !== undefined &&
            window.pendingDeleteTransactionIndex !== null
        ) {
            deleteTransaction(window.pendingDeleteTransactionIndex);
            window.pendingDeleteTransactionIndex = null;
            closeDeleteConfirm();
        } else if (previousConfirmDelete) {
            previousConfirmDelete();
        }
    };

    console.log(
        `📋 Tabela atualizada com ${filteredTransactions.length} registros`
    );
}

// ================ Modal Management ================
const Modal = {
    open: async function () {
        console.log("📝 Abrindo modal de adicionar poupança...");

        // Recarrega os planos antes de abrir o modal
        await populatePlanoSelect();

        document.querySelector(".standardized-modal-overlay").style.display =
            "flex";
    },
    close: function () {
        console.log("❌ Fechando modal de adicionar poupança...");
        document.querySelector(".standardized-modal-overlay").style.display =
            "none";
        document.getElementById("form").reset();
        const hoje = new Date().toISOString().split("T")[0];
        document.getElementById("data").value = hoje;
    },
};

const FilterModal = {
    open: function () {
        console.log("🔍 Abrindo modal de filtro...");
        document.querySelector(".filter-modal-overlay").style.display = "flex";
    },
    close: function () {
        console.log("❌ Fechando modal de filtro...");
        document.querySelector(".filter-modal-overlay").style.display = "none";
        document.getElementById("filter-form").reset();
    },
};

// ================ Form Handling ================
const Form = {
    submit: async function (event) {
        event.preventDefault();
        console.log("💾 Salvando nova movimentação...");

        const formData = new FormData(event.target);
        const descricao = formData.get("descricao");
        const valor = formData.get("valor");
        const data = formData.get("data");
        const tipo = formData.get("tipo");
        const plano = formData.get("plano") || "";

        // Salva no Supabase se disponível, senão salva localmente
        if (window.supabase) {
            await savePoupanca(descricao, valor, data, tipo, plano);
        } else {
            // Fallback para modo local
            const valorFinal = tipo.toLowerCase().includes("saque")
                ? -Math.abs(parseFloat(valor))
                : Math.abs(parseFloat(valor));

            const newTransaction = {
                id: `local-${Date.now()}`,
                description: descricao,
                amount: valorFinal,
                date: data,
                tipo: tipo,
                plano: plano,
                category: tipo.toLowerCase().includes("saque")
                    ? "Saque"
                    : "Poupança",
                is_recorrente: false,
                recorrencia_meses: 1,
            };

            transactions.push(newTransaction);
            filteredTransactions = [...transactions];

            updateTotalDisplay();
            updateTable();
            Modal.close();

            showSuccessToast(
                "Sucesso!",
                "Movimentação adicionada com sucesso!"
            );
            console.log("✅ Nova movimentação salva localmente");
        }
    },
};

// ================ CRUD Operations ================

// Function to load plans into edit modal select
async function loadPlansIntoEditSelect(selectedPlan = null) {
    try {
        console.log("🔄 Carregando planos no modal de edição...");

        const { data: plans, error } = await supabase
            .from("planos")
            .select("*")
            .order("descricao");

        if (error) {
            console.error("❌ Erro ao carregar planos:", error);
            return;
        }

        const editPlanoSelect = document.getElementById("edit-plano");
        if (editPlanoSelect) {
            editPlanoSelect.innerHTML =
                '<option value="">Nenhum plano específico</option>';

            plans.forEach((plan) => {
                const option = document.createElement("option");
                option.value = plan.descricao;
                option.textContent = `${plan.descricao} - ${formatCurrency(
                    plan.valor
                )}`;
                if (selectedPlan && plan.descricao === selectedPlan) {
                    option.selected = true;
                }
                editPlanoSelect.appendChild(option);
            });

            console.log(
                `✅ ${plans.length} planos carregados no modal de edição`
            );
        }
    } catch (error) {
        console.error("❌ Erro ao carregar planos no modal:", error);
        showErrorToast("Erro!", "Erro ao carregar planos");
    }
}

async function editTransaction(index) {
    console.log(`✏️ Editando transação ${index}`);
    const transaction = filteredTransactions[index];

    // Preenche o modal de edição
    document.getElementById("edit-description").value = transaction.description;
    document.getElementById("edit-amount").value = Math.abs(transaction.amount);
    document.getElementById("edit-date").value = transaction.date;
    document.getElementById("edit-tipo").value = transaction.tipo;

    // Popula campos de recorrência
    const isRecorrente = transaction.is_recorrente || false;
    const recorrenciaMeses = transaction.recorrencia_meses || 1;

    document.getElementById("edit-is-recorrente").checked = isRecorrente;
    document.getElementById("edit-recorrencia-meses").value = recorrenciaMeses;

    // Mostra/esconde o campo de meses
    if (isRecorrente) {
        document.getElementById("edit-recorrencia-meses-group").style.display =
            "block";
    } else {
        document.getElementById("edit-recorrencia-meses-group").style.display =
            "none";
    }

    // Carregar opções de planos e selecionar o atual
    await loadPlansIntoEditSelect(transaction.plano);

    // Armazena o índice para usar no submit
    document.getElementById("edit-form").dataset.editIndex = index;

    // Abre modal de edição
    document.querySelector(".edit-modal-overlay").style.display = "flex";
}

async function submitEditForm(event) {
    event.preventDefault();
    console.log("💾 Salvando edição...");

    const index = parseInt(event.target.dataset.editIndex);
    const formData = new FormData(event.target);
    const valor = parseFloat(formData.get("amount"));
    const tipo = formData.get("tipo");
    const plano = formData.get("plano");

    // Recebe valores de recorrência
    const isRecorrente = document.getElementById("edit-is-recorrente").checked;
    const recorrenciaMeses = isRecorrente
        ? parseInt(document.getElementById("edit-recorrencia-meses").value || 1)
        : 1;

    // Ajusta o sinal baseado no tipo
    const valorFinal = tipo.toLowerCase().includes("saque")
        ? -Math.abs(valor)
        : Math.abs(valor);

    const transactionId = filteredTransactions[index].id;

    try {
        // Buscar dados do plano se selecionado
        let planoVinculadoId = null;
        let planoVinculadoNome = null;

        if (plano && plano.trim() !== "") {
            const { data: planoData, error: planoError } = await window.supabase
                .from("planos")
                .select("id, descricao")
                .eq("descricao", plano)
                .single();

            if (!planoError && planoData) {
                planoVinculadoId = planoData.id;
                planoVinculadoNome = planoData.descricao;
            }
        }

        // Atualizar no Supabase
        const updateData = {
            descricao: formData.get("description"),
            valor: valorFinal,
            data: formData.get("date"),
            tipo: tipo,
            plano_vinculado_id: planoVinculadoId,
            plano_vinculado_nome: planoVinculadoNome,
            categoria: tipo.toLowerCase().includes("saque")
                ? "Saque"
                : "Poupança",
            is_recorrente: isRecorrente,
            recorrencia_meses: recorrenciaMeses,
        };

        const { error } = await window.supabase
            .from("poupanca")
            .update(updateData)
            .eq("id", transactionId);

        if (error) throw error;

        // Recarregar dados respeitando filtros ativos
        await reloadPoupancaDataRespectingFilter();
        closeEditModal();

        showSuccessToast("Sucesso!", "Movimentação atualizada com sucesso!");
        console.log("✅ Movimentação atualizada no Supabase");
    } catch (error) {
        console.error("❌ Erro ao atualizar movimentação:", error);
        showErrorToast("Erro!", "Erro ao atualizar movimentação");
    }
}

async function deletePoupancaTransaction(poupancaId) {
    console.log(`🗑️ Excluindo transação ${poupancaId}`);

    await removePoupancaFromSupabase(poupancaId);
}

// Função de compatibilidade para código existente
function deleteTransaction(index) {
    console.log(`🗑️ Excluindo transação ${index} (modo compatibilidade)`);

    const transaction = filteredTransactions[index];

    if (
        transaction.id &&
        transaction.id !== "demo1" &&
        transaction.id !== "demo2" &&
        transaction.id !== "demo3" &&
        transaction.id !== "demo4"
    ) {
        // É uma transação do Supabase
        deletePoupancaTransaction(transaction.id);
    } else {
        // É uma transação demo, remove localmente
        const originalIndex = transactions.findIndex(
            (t) =>
                t.description === transaction.description &&
                t.date === transaction.date &&
                t.amount === transaction.amount
        );

        if (originalIndex !== -1) {
            transactions.splice(originalIndex, 1);
        }

        filteredTransactions.splice(index, 1);
        updateTotalDisplay();
        updateTable();
        showSuccessToast("Sucesso!", "Movimentação excluída com sucesso!");
        console.log("✅ Movimentação excluída");
    }
}

function closeEditModal() {
    document.querySelector(".edit-modal-overlay").style.display = "none";
    document.getElementById("edit-form").reset();
    // Reseta a visibilidade do campo de recorrência
    document.getElementById("edit-recorrencia-meses-group").style.display =
        "none";
}

function toggleRecorrenciaFields() {
    const isRecorrente = document.getElementById("is_recorrente").checked;
    const mesesGroup = document.getElementById("recorrencia_meses_group");

    if (isRecorrente) {
        mesesGroup.style.display = "block";
        // Define valor padrão se não houver
        const mesesInput = document.getElementById("recorrencia_meses");
        if (!mesesInput.value || mesesInput.value === "1") {
            mesesInput.value = "1";
        }
    } else {
        mesesGroup.style.display = "none";
        document.getElementById("recorrencia_meses").value = "1";
    }
}

function toggleEditRecorrenciaFields() {
    const isRecorrente = document.getElementById("edit-is-recorrente").checked;
    const mesesGroup = document.getElementById("edit-recorrencia-meses-group");

    if (isRecorrente) {
        mesesGroup.style.display = "block";
        const mesesInput = document.getElementById("edit-recorrencia-meses");
        if (!mesesInput.value || mesesInput.value === "1") {
            mesesInput.value = "1";
        }
    } else {
        mesesGroup.style.display = "none";
        document.getElementById("edit-recorrencia-meses").value = "1";
    }
}

// ================ Filter Functions ================
function filterPoupanca(event) {
    event.preventDefault();
    console.log("🔍 Aplicando filtros...");

    const formData = new FormData(event.target);
    const filters = {
        descricao: formData.get("descricao")?.toLowerCase() || "",
        valor: formData.get("valor") ? parseFloat(formData.get("valor")) : null,
        data: formData.get("data") || "",
        tipo: formData.get("tipo") || "",
    };

    filteredTransactions = transactions.filter((transaction) => {
        const matchDescricao =
            !filters.descricao ||
            transaction.description.toLowerCase().includes(filters.descricao);
        const matchValor =
            filters.valor === null ||
            Math.abs(transaction.amount) === Math.abs(filters.valor);
        const matchData = !filters.data || transaction.date === filters.data;
        const matchTipo = !filters.tipo || transaction.tipo === filters.tipo;

        return matchDescricao && matchValor && matchData && matchTipo;
    });

    updateTotalDisplay();
    updateTable();
    FilterModal.close();

    showInfoToast(
        "Filtro aplicado",
        `${filteredTransactions.length} registros encontrados`
    );
    console.log(
        `🔍 Filtros aplicados: ${filteredTransactions.length} resultados`
    );
}

function filterClear() {
    console.log("🧹 Limpando filtros...");
    filteredTransactions = [...transactions];
    updateTotalDisplay();
    updateTable();
    showInfoToast("Filtros removidos", "Todos os filtros foram limpos");
}

// ================ AI Insights ================
function openAIInsights() {
    console.log("🤖 Abrindo AI Insights para poupança...");

    const totalPoupado = transactions.reduce(
        (sum, t) => sum + (t.amount > 0 ? t.amount : 0),
        0
    );
    const totalSacado = Math.abs(
        transactions.reduce((sum, t) => sum + (t.amount < 0 ? t.amount : 0), 0)
    );
    const saldoLiquido = totalPoupado - totalSacado;

    const insights = `
        <div style="padding: 20px;">
            <h3>🤖 Análise da sua Poupança</h3>
            <div style="margin: 15px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <h4>📊 Resumo Financeiro</h4>
                <p>• Total poupado: <strong>${formatCurrency(
                    totalPoupado
                )}</strong></p>
                <p>• Total sacado: <strong>${formatCurrency(
                    totalSacado
                )}</strong></p>
                <p>• Saldo líquido: <strong>${formatCurrency(
                    saldoLiquido
                )}</strong></p>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background: #f0fff0; border-radius: 8px;">
                <h4>💡 Insights Personalizados</h4>
                <p>• Você tem um padrão de poupança ${
                    saldoLiquido > 0 ? "positivo" : "que precisa de atenção"
                }</p>
                <p>• Recomendamos manter uma reserva de emergência de 6 meses</p>
                <p>• Continue com os depósitos regulares para atingir suas metas</p>
            </div>
        </div>
    `;

    // Simula um modal de insights (simplificado)
    alert(insights.replace(/<[^>]*>/g, "").replace(/•/g, "- "));
}

// ================ Utility Functions ================
function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function formatDate(dateString) {
    try {
        // Corrige problema de timezone: força interpretação como data local
        const dateStr = dateString.split("T")[0]; // Pega só a parte da data (YYYY-MM-DD)
        const [year, month, day] = dateStr.split("-");
        const localDate = new Date(year, month - 1, day); // Meses são 0-indexed
        return localDate.toLocaleDateString("pt-BR");
    } catch (e) {
        return dateString;
    }
}

// Toast function removed - now using standardized toast system

// ================ Quick Fill Functions ================
function highlightTipoButtons(inputElement, tipo) {
    if (!inputElement) return;

    const container =
        inputElement.closest(".standardized-input-group") ||
        inputElement.parentElement;
    if (!container) return;

    const tags = container.querySelectorAll(".category-tag");
    if (!tags.length) return;

    tags.forEach((tag) => {
        tag.classList.remove("selected");
        tag.style.backgroundColor = "";
        tag.style.color = "";
    });

    const match = Array.from(tags).find((tag) =>
        tag.textContent?.toLowerCase().includes(tipo ? tipo.toLowerCase() : "")
    );

    if (match) {
        match.classList.add("selected");
        match.style.backgroundColor = "#2a2185";
        match.style.color = "#fff";
    }
}

function setTipo(tipo) {
    const input = document.getElementById("tipo");
    if (!input) return;
    input.value = tipo;
    highlightTipoButtons(input, tipo);
}

function setEditTipo(tipo) {
    const input = document.getElementById("edit-tipo");
    if (!input) return;
    input.value = tipo;
    highlightTipoButtons(input, tipo);
}

// ================ Funções para Insights da IA ================

// Função para obter dados completos de um plano específico para a IA
async function obterInsightsPlanoCompleto(planoId) {
    try {
        if (!window.supabase) throw new Error("Supabase não disponível");

        const { data, error } = await window.supabase.rpc(
            "obter_insights_plano",
            {
                plano_id: planoId,
            }
        );

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Erro ao obter insights do plano:", err);
        return null;
    }
}

// Função para obter resumo de todos os planos e poupanças para a IA
async function obterResumoCompletoPoupancaPlanos() {
    try {
        if (!window.supabase) throw new Error("Supabase não disponível");

        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error("Usuário não autenticado");

        // Busca todos os planos com suas estatísticas
        const { data: planos, error: planosError } = await window.supabase
            .from("planos")
            .select("*")
            .eq("usuario_id", user.id)
            .order("criado_em", { ascending: false });

        if (planosError) throw planosError;

        // Busca todas as movimentações de poupança
        const { data: poupancas, error: poupancasError } = await window.supabase
            .from("poupanca")
            .select("*")
            .eq("usuario_id", user.id)
            .order("data", { ascending: false });

        if (poupancasError) throw poupancasError;

        // Organiza dados para insights
        const resumo = {
            planos: planos.map((plano) => ({
                ...plano,
                dias_restantes: Math.ceil(
                    (new Date(plano.data) - new Date()) / (1000 * 60 * 60 * 24)
                ),
                valor_faltante: plano.valor - plano.valor_poupado,
                status_prazo:
                    new Date(plano.data) < new Date() ? "vencido" : "no_prazo",
                poupancas_vinculadas: poupancas.filter(
                    (p) => p.plano_vinculado_id === plano.id
                ),
            })),
            poupanca_geral: {
                total_depositado: poupancas
                    .filter((p) => p.tipo === "Depósito")
                    .reduce((sum, p) => sum + p.valor, 0),
                total_sacado: poupancas
                    .filter((p) => p.tipo === "Saque")
                    .reduce((sum, p) => sum + Math.abs(p.valor), 0),
                saldo_atual: poupancas.reduce((sum, p) => sum + p.valor, 0),
                movimentacoes_recentes: poupancas.slice(0, 10),
                sem_plano_vinculado: poupancas.filter(
                    (p) => !p.plano_vinculado_id
                ).length,
            },
            estatisticas_gerais: {
                total_planos_ativos: planos.filter((p) => p.status === "ativo")
                    .length,
                total_planos_concluidos: planos.filter(
                    (p) => p.status === "concluido"
                ).length,
                progresso_medio:
                    planos.length > 0
                        ? planos.reduce(
                              (sum, p) => sum + p.progresso_percentual,
                              0
                          ) / planos.length
                        : 0,
                valor_total_objetivos: planos.reduce(
                    (sum, p) => sum + p.valor,
                    0
                ),
                valor_total_poupado: planos.reduce(
                    (sum, p) => sum + p.valor_poupado,
                    0
                ),
            },
        };

        return resumo;
    } catch (err) {
        console.error("Erro ao obter resumo completo:", err);
        return null;
    }
}

// Expor funções para uso da IA
window.obterInsightsPlanoCompleto = obterInsightsPlanoCompleto;
window.obterResumoCompletoPoupancaPlanos = obterResumoCompletoPoupancaPlanos;

// Update user info
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
    if (window.updateUserInfo) {
        console.log("poupanca.js: Chamando window.updateUserInfo()");
        window.updateUserInfo();

        // Força refresh adicional após 2 segundos
        setTimeout(() => {
            console.log("poupanca.js: Refresh adicional após 2 segundos");
            if (window.updateUserInfo) {
                window.updateUserInfo();
            }
        }, 2000);
    } else {
        console.log(
            "poupanca.js: window.updateUserInfo não disponível, tentando novamente..."
        );
        setTimeout(waitForUpdateUserInfo, 100);
    }
})();

console.log("✅ Poupanca.js carregado completamente");
