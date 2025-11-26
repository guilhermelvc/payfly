// Receita model adapted for Supabase
let totalReceitaGlobal = 0;

// Variável global para controlar estado do filtro
let isReceitaFilterActive = false;
let currentFilterCriteria = null;

// Função auxiliar para reaplicar filtros após operações CRUD
async function reloadDataRespectingFilter() {
    if (isReceitaFilterActive && currentFilterCriteria) {
        // Se há filtro ativo, reaplicar o filtro ao invés de carregar todos os dados
        console.log("🔄 Reaplicando filtro após operação CRUD");
        await applyStoredFilter();
    } else {
        // Se não há filtro, carregar todos os dados normalmente
        await loadReceitasFromSupabase();
    }
}

// Função para aplicar filtro armazenado
async function applyStoredFilter() {
    if (!currentFilterCriteria) return;

    try {
        const { descricao, valor, data, categoria } = currentFilterCriteria;

        let query = window.supabase
            .from("receitas")
            .select("*")
            .eq("usuario_id", currentFilterCriteria.userId);

        if (descricao) query = query.ilike("descricao", `%${descricao}%`);
        if (valor && !isNaN(parseFloat(valor)))
            query = query.eq("valor", parseFloat(valor));
        if (data) query = query.eq("data", data);
        if (categoria) query = query.ilike("categoria", `%${categoria}%`);

        const { data: rows, error } = await query.order("criado_em", {
            ascending: false,
        });
        if (error) throw error;

        const table = document.getElementById("data-table");
        const tbody = table?.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = "";
        } else if (table) {
            // Se não há tbody, limpar apenas as linhas de dados, preservando thead
            const thead = table.querySelector("thead");
            table.innerHTML = "";
            if (thead) table.appendChild(thead);
        }

        let totalFiltered = 0;
        (rows || []).forEach((r) => {
            addReceitaToTable(r, r.id);
            totalFiltered += Number(r.valor || 0);
        });

        const el = document.getElementById("filteredReceitaDisplay");
        if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

        console.log(
            `🔍 Filtro reaplicado: ${rows ? rows.length : 0} resultados`
        );
    } catch (err) {
        console.error("Erro ao reaplicar filtro:", err);
    }
}

const Modal = {
    open() {
        document
            .querySelector(".standardized-modal-overlay")
            .classList.add("active");
    },
    close() {
        document
            .querySelector(".standardized-modal-overlay")
            .classList.remove("active");
    },
};

function formatarData(date) {
    try {
        // Corrige problema de timezone: força interpretação como data local
        const dateStr = date.split("T")[0]; // Pega só a parte da data (YYYY-MM-DD)
        const [year, month, day] = dateStr.split("-");
        const localDate = new Date(year, month - 1, day); // Meses são 0-indexed
        return localDate.toLocaleDateString("pt-BR");
    } catch (e) {
        return date;
    }
}

function updateReceitaDisplay() {
    const el = document.getElementById("totalReceitaDisplay");
    if (el) el.textContent = `R$ ${totalReceitaGlobal.toFixed(2)}`;
}

async function loadReceitasFromSupabase() {
    try {
        // Se há um filtro ativo, não recarrega os dados para não sobrescrever os resultados filtrados
        if (isReceitaFilterActive) {
            console.log(
                "⚠️ FILTRO ATIVO - Bloqueando recarregamento automático"
            );
            console.trace(
                "📍 Chamada bloqueada de loadReceitasFromSupabase():"
            );
            return;
        }

        console.log("📊 Carregando todas as receitas (sem filtro)");
        console.trace("📍 Origem da chamada loadReceitasFromSupabase():");

        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const { data, error } = await window.supabase
            .from("receitas")
            .select("*")
            .eq("usuario_id", user.id)
            .order("criado_em", { ascending: false });

        if (error) throw error;

        // LIMPEZA FORÇADA E ROBUSTA DA TABELA
        const table = document.getElementById("data-table");
        if (table) {
            const tbody = table.querySelector("tbody");
            if (tbody) {
                // Remove todas as linhas do tbody
                tbody.innerHTML = "";
                console.log("🧹 Tbody limpo completamente");
            } else {
                // Se não existe tbody, remove todas as linhas exceto thead
                const thead = table.querySelector("thead");
                const allRows = table.querySelectorAll("tr");
                allRows.forEach((row, index) => {
                    if (index > 0) {
                        // Preserva apenas a primeira linha (thead)
                        row.remove();
                    }
                });
                console.log("🧹 Linhas da tabela limpas (preservando thead)");
            }
        }

        // Reset total
        totalReceitaGlobal = 0;
        (data || []).forEach((r) => {
            addReceitaToTable(r, r.id);
            totalReceitaGlobal += Number(r.valor || 0);
        });

        updateReceitaDisplay();
        console.log("📊 Todas as receitas carregadas");
    } catch (err) {
        console.error("Erro carregando receitas do Supabase", err);
    }
}

async function removeReceitaFromSupabase(receitaId, receitaValue) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { error } = await window.supabase
            .from("receitas")
            .delete()
            .eq("id", receitaId);
        if (error) throw error;
        const row = document.getElementById(`row-${receitaId}`);
        if (row) row.remove();
        totalReceitaGlobal -= receitaValue;
        updateReceitaDisplay();
        showSuccessToast("Sucesso!", "Receita excluída com sucesso!");
    } catch (err) {
        console.error("Erro ao remover receita:", err);
        showErrorToast("Erro", "Não foi possível excluir a receita.");
    }
}

async function updateReceitaInSupabase(receitaId, updatedReceita) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { error } = await window.supabase
            .from("receitas")
            .update(updatedReceita)
            .eq("id", receitaId);
        if (error) throw error;
        await reloadDataRespectingFilter();
    } catch (err) {
        console.error("Erro ao atualizar receita:", err);
    }
}

function addReceitaToTable(receita, receitaId) {
    const table = document.getElementById("data-table");
    if (!table) return;

    // Verifica se já existe uma linha com este ID para evitar duplicação
    const existingRow = document.getElementById(`row-${receitaId}`);
    if (existingRow) {
        console.log(`⚠️ Linha row-${receitaId} já existe, removendo duplicata`);
        existingRow.remove();
    }

    // Insere na tbody se existir, senão na tabela
    const tbody = table.querySelector("tbody");
    const newRow = tbody ? tbody.insertRow(-1) : table.insertRow(-1);
    newRow.id = `row-${receitaId}`;
    const descricaoCell = newRow.insertCell(0);
    descricaoCell.textContent = receita.descricao || "";
    const valorCell = newRow.insertCell(1);
    valorCell.textContent = `R$ ${Number(receita.valor || 0).toFixed(2)}`;
    const dataCell = newRow.insertCell(2);
    dataCell.textContent = formatarData(receita.data);
    const categoriaCell = newRow.insertCell(3);
    if (receita.categoria) {
        categoriaCell.innerHTML = `<span class="category-badge">${receita.categoria}</span>`;
    } else {
        categoriaCell.textContent = "-";
    }
    const recorrenciaCell = newRow.insertCell(4);
    if (receita.is_recorrente) {
        recorrenciaCell.innerHTML = `<span class="recorrencia-badge">✓ ${receita.recorrencia_meses}x</span>`;
    } else {
        recorrenciaCell.textContent = "-";
    }
    const editCell = newRow.insertCell(5);
    const editButton = document.createElement("button");
    editButton.classList.add("edit-button");
    editButton.innerHTML =
        '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
    editButton.title = "Editar";
    editButton.onclick = () => editReceita(receitaId, receita);
    editCell.appendChild(editButton);
    const deleteCell = newRow.insertCell(6);
    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.innerHTML =
        '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
    deleteButton.title = "Excluir";
    deleteButton.onclick = () =>
        showDeleteConfirm(receitaId, Number(receita.valor || 0));
    deleteCell.appendChild(deleteButton);
}

// Variáveis globais para controle do modal de exclusão
let pendingDeleteId = null;
let pendingDeleteValue = null;

function showDeleteConfirm(receitaId, valor) {
    pendingDeleteId = receitaId;
    pendingDeleteValue = valor;
    document.getElementById("deleteConfirmModal").classList.add("active");
}

function closeDeleteConfirm() {
    document.getElementById("deleteConfirmModal").classList.remove("active");
    pendingDeleteId = null;
    pendingDeleteValue = null;
}

function confirmDelete() {
    if (pendingDeleteId !== null) {
        removeReceitaFromSupabase(pendingDeleteId, pendingDeleteValue);
        closeDeleteConfirm();
    }
}

let editingReceitaId = null;
function editReceita(receitaId, receita) {
    document.getElementById("edit-description").value = receita.descricao || "";
    document.getElementById("edit-amount").value = receita.valor || "";
    document.getElementById("edit-date").value = receita.data || "";
    document.getElementById("edit-categoria").value = receita.categoria || "";

    // Popula campos de recorrência
    const isRecorrente = receita.is_recorrente || false;
    const recorrenciaMeses = receita.recorrencia_meses || 1;

    document.getElementById("edit-is-recorrente").checked = isRecorrente;
    document.getElementById("edit-recorrencia-meses").value = recorrenciaMeses;

    // Mostrar/ocultar campo de meses
    if (isRecorrente) {
        document.getElementById("edit-recorrencia-meses-group").style.display =
            "block";
    } else {
        document.getElementById("edit-recorrencia-meses-group").style.display =
            "none";
    }

    editingReceitaId = receitaId;
    document.querySelector(".edit-modal-overlay").classList.add("active");
}
function closeEditModal() {
    document.querySelector(".edit-modal-overlay").classList.remove("active");
    editingReceitaId = null;
}
function toggleRecorrenciaFields() {
    const isRecorrente = document.getElementById("is_recorrente").checked;
    const recorrenciaGroup = document.getElementById("recorrencia_meses_group");
    if (recorrenciaGroup) {
        recorrenciaGroup.style.display = isRecorrente ? "block" : "none";
    }
}

function toggleEditRecorrenciaFields() {
    const isRecorrente = document.getElementById("edit-is-recorrente").checked;
    const recorrenciaGroup = document.getElementById(
        "edit-recorrencia-meses-group"
    );
    if (recorrenciaGroup) {
        recorrenciaGroup.style.display = isRecorrente ? "block" : "none";
    }
}
function submitEditForm(event) {
    event.preventDefault();
    const descricao = document.getElementById("edit-description").value;
    const valor = parseFloat(document.getElementById("edit-amount").value);
    const data = document.getElementById("edit-date").value;
    const categoria = document.getElementById("edit-categoria").value;
    // Validações usando sistema toast padronizado
    if (!validateRequired(descricao, "Descrição")) return;
    if (!validateNumber(valor, "Valor", 0.01)) return;
    if (!validateRequired(data, "Data")) return;
    if (!validateDate(data, "Data")) return;

    const isRecorrente = document.getElementById("edit-is-recorrente").checked;
    const recorrenciaMeses = isRecorrente
        ? parseInt(document.getElementById("edit-recorrencia-meses").value || 1)
        : 1;

    const updatedReceita = {
        descricao,
        valor,
        data,
        categoria,
        is_recorrente: isRecorrente,
        recorrencia_meses: recorrenciaMeses,
    };
    updateReceitaInSupabase(editingReceitaId, updatedReceita);
    closeEditModal();
}

function submitForm(event) {
    event.preventDefault();
    const descricao = document.getElementById("descricao").value;
    const valor = parseFloat(document.getElementById("valor").value);
    const data = document.getElementById("data").value;
    const categoria = document.getElementById("categoria").value;

    // Validações usando sistema toast padronizado
    if (!validateRequired(descricao, "Descrição")) return;
    if (!validateNumber(valor, "Valor", 0.01)) return;
    if (!validateRequired(data, "Data")) return;
    if (!validateDate(data, "Data")) return;

    saveReceita(descricao, valor, data, categoria);
}

// Função showToast removida - agora usamos o sistema toast global

window.addEventListener("load", async () => {
    if (!window.supabase) {
        console.warn("Supabase não inicializado.");
        return;
    }
    const { data } = await window.supabase.auth.getUser();
    const user = data?.user || null;
    if (user) {
        // Garante que o usuário existe na tabela 'usuarios'
        await window.supabase.from("usuarios").upsert({
            id: user.id,
            nome: user.user_metadata?.full_name || user.email,
            email: user.email,
        });
        await reloadDataRespectingFilter();
    }
});

async function saveReceita(descricao, valor, data, categoria = null) {
    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");
        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error("Usuário não autenticado");

        // Verifica se é receita recorrente
        const isRecorrente =
            document.getElementById("is_recorrente")?.checked || false;
        const recorrenciaMeses = isRecorrente
            ? parseInt(document.getElementById("recorrencia_meses")?.value || 1)
            : 1;

        // Processa categoria se fornecida
        let processedCategory = null;
        if (categoria && window.CategorizationUI) {
            processedCategory = await window.CategorizationUI.processCategory(
                { categoria: categoria },
                "receita"
            );
        }

        // Se é recorrente, cria múltiplas receitas
        if (isRecorrente && recorrenciaMeses > 1) {
            const receitasParaCriar = [];
            const dataInicial = new Date(data);

            // Cria uma receita para cada mês
            for (let i = 0; i < recorrenciaMeses; i++) {
                const novaData = new Date(dataInicial);
                novaData.setMonth(novaData.getMonth() + i);

                // Formata a data como YYYY-MM-DD
                const dataFormatada = novaData.toISOString().split("T")[0];

                receitasParaCriar.push({
                    descricao,
                    valor: parseFloat(valor),
                    data: dataFormatada,
                    usuario_id: user.id,
                    tipo: "receita",
                    categoria: processedCategory || categoria,
                    is_recorrente: i === 0 ? true : false, // Marca apenas a primeira como recorrente
                    recorrencia_meses: i === 0 ? recorrenciaMeses : 1,
                });
            }

            // Insere todas as receitas
            const { error } = await window.supabase
                .from("receitas")
                .insert(receitasParaCriar);
            if (error) throw error;

            console.log(
                `✅ ${recorrenciaMeses} receitas recorrentes criadas com sucesso!`
            );
        } else {
            // Cria receita única (sem recorrência)
            const receitaData = {
                descricao,
                valor: parseFloat(valor),
                data,
                usuario_id: user.id,
                tipo: "receita",
                categoria: processedCategory || categoria,
                is_recorrente: false,
                recorrencia_meses: 1,
            };

            const { error } = await window.supabase
                .from("receitas")
                .insert([receitaData]);
            if (error) throw error;

            console.log("✅ Receita única criada com sucesso!");
        }

        await reloadDataRespectingFilter();
        showSuccessToast("Receita salva!", "Receita adicionada com sucesso!");

        // Fecha o modal após salvar com sucesso
        if (typeof Modal !== "undefined" && Modal.close) {
            Modal.close();
        } else {
            // Fallback para fechar modal
            const modalOverlay = document.querySelector(
                ".standardized-modal-overlay"
            );
            if (modalOverlay) {
                modalOverlay.classList.remove("active");
            }
        }

        // Limpa o formulário
        const form = document.querySelector("#form");
        if (form) {
            form.reset();
        }
    } catch (err) {
        console.error("Erro ao salvar receita:", err);
        showErrorToast(
            "Erro ao salvar",
            "Falha ao salvar receita. Tente novamente."
        );
    }
}

const formEl = document.querySelector("form");
if (formEl) formEl.addEventListener("submit", submitForm);

// Update user info
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
    if (window.updateUserInfo) {
        console.log("receita.js: Chamando window.updateUserInfo()");
        window.updateUserInfo();

        // Força refresh adicional após 2 segundos
        setTimeout(() => {
            console.log("receita.js: Refresh adicional após 2 segundos");
            if (window.updateUserInfo) {
                window.updateUserInfo();
            }
        }, 2000);
    } else {
        console.log(
            "receita.js: window.updateUserInfo não disponível, tentando novamente..."
        );
        setTimeout(waitForUpdateUserInfo, 100);
    }
})();

const FilterModal = {
    open() {
        document.querySelector(".filter-modal-overlay").classList.add("active");
    },
    close() {
        document
            .querySelector(".filter-modal-overlay")
            .classList.remove("active");
    },
};

async function filterReceitas(event) {
    event.preventDefault();
    console.log("🔍 INICIANDO FILTRO DE RECEITAS");

    try {
        if (!window.supabase) throw new Error("Supabase não inicializado");

        // Captura os valores dos filtros
        const descricaoInput = document
            .getElementById("filter-descricao")
            .value.trim();
        const valorInput = document.getElementById("filter-valor").value.trim();
        const dataInput = document.getElementById("filter-data").value.trim();
        const categoriaInput = document
            .getElementById("filter-categoria")
            .value.trim();

        console.log("📋 Valores capturados:", {
            descricaoInput,
            valorInput,
            dataInput,
            categoriaInput,
        });

        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;
        if (!user) throw new Error("Usuário não autenticado");

        let query = window.supabase
            .from("receitas")
            .select("*")
            .eq("usuario_id", user.id);

        // Filtro por descrição: busca parcial (começo da palavra ou contém o texto)
        if (descricaoInput) {
            // Busca por texto que contenha a string digitada (case insensitive)
            query = query.ilike("descricao", `%${descricaoInput}%`);
        }

        // Filtro por valor: busca exata
        if (valorInput && !isNaN(parseFloat(valorInput))) {
            query = query.eq("valor", parseFloat(valorInput));
        }

        // Filtro por data: busca exata
        if (dataInput) {
            query = query.eq("data", dataInput);
        }

        // Filtro por categoria: busca parcial (case insensitive)
        if (categoriaInput) {
            query = query.ilike("categoria", `%${categoriaInput}%`);
        }

        const { data: rows, error } = await query.order("criado_em", {
            ascending: false,
        });

        if (error) throw error;

        // Limpa a tabela e adiciona os resultados filtrados
        const table = document.getElementById("data-table");
        const tbody = table?.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = "";
        } else if (table) {
            // Se não há tbody, limpar apenas as linhas de dados, preservando thead
            const thead = table.querySelector("thead");
            table.innerHTML = "";
            if (thead) table.appendChild(thead);
        }

        let totalFiltered = 0;
        (rows || []).forEach((r) => {
            addReceitaToTable(r, r.id);
            totalFiltered += Number(r.valor || 0);
        });

        // Atualiza o total filtrado
        const el = document.getElementById("filteredReceitaDisplay");
        if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

        // Mostra mensagem se nenhum resultado for encontrado
        if (!rows || rows.length === 0) {
            const table = document.getElementById("data-table");
            if (table) {
                table.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
              Nenhuma receita encontrada com os filtros aplicados.
            </td>
          </tr>
        `;
            }
        }

        // Ativa o estado de filtro e armazena os critérios
        isReceitaFilterActive = true;
        currentFilterCriteria = {
            descricao: descricaoInput,
            valor: valorInput,
            data: dataInput,
            categoria: categoriaInput,
            userId: user.id,
        };

        FilterModal.close();

        // Log para debug
        console.log("🔍 Filtro aplicado com sucesso!");
        console.log(
            `📋 Critérios: Descrição="${descricaoInput}", Valor="${valorInput}", Data="${dataInput}"`
        );
        console.log(`📊 Resultados encontrados: ${rows ? rows.length : 0}`);
    } catch (err) {
        console.error("❌ Erro ao filtrar receitas:", err);
        showErrorToast(
            "Erro nos filtros",
            "Falha ao aplicar filtros. Tente novamente."
        );
    }
}

function filterClear() {
    console.log("🧹 INICIANDO LIMPEZA DE FILTROS");

    // Limpa os campos do formulário
    const d = document.getElementById("filter-descricao");
    if (d) d.value = "";
    const v = document.getElementById("filter-valor");
    if (v) v.value = "";
    const dt = document.getElementById("filter-data");
    if (dt) dt.value = "";
    const cat = document.getElementById("filter-categoria");
    if (cat) cat.value = "";

    // DESATIVA FILTRO ANTES DE LIMPAR para evitar conflitos
    isReceitaFilterActive = false;
    currentFilterCriteria = null;

    // LIMPEZA FORÇADA E AGRESSIVA DA TABELA
    const table = document.getElementById("data-table");
    if (table) {
        const tbody = table.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = "";
            console.log("🧹 Tbody limpo via innerHTML");
        } else {
            // Remove TODAS as linhas exceto a primeira (header)
            const allRows = Array.from(table.rows);
            for (let i = allRows.length - 1; i > 0; i--) {
                allRows[i].remove();
            }
            console.log("🧹 Todas as linhas de dados removidas");
        }
    }

    // Reseta totais
    totalReceitaGlobal = 0;

    // Aguarda um momento antes de recarregar para garantir limpeza
    setTimeout(() => {
        loadReceitasFromSupabase();
    }, 50);

    // Reseta o display do total filtrado
    const el = document.getElementById("filteredReceitaDisplay");
    if (el) el.textContent = `R$ 0,00`;

    console.log("🔄 Filtros limpos - tabela completamente resetada");
}

// Funcionalidades PIX QR Code removidas
