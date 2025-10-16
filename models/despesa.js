// Despesa model adapted for Supabase
let totalDespesa = 0;

// Variável global para controlar estado do filtro
let isDespesaFilterActive = false;
let currentDespesaFilterCriteria = null;

// Função auxiliar para reaplicar filtros após operações CRUD
async function reloadDespesaDataRespectingFilter() {
  if (isDespesaFilterActive && currentDespesaFilterCriteria) {
    console.log("🔄 Reaplicando filtro de despesas após operação CRUD");
    await applyStoredDespesaFilter();
  } else {
    await loadDespesasFromSupabase();
  }
}

// Função para aplicar filtro de despesas armazenado
async function applyStoredDespesaFilter() {
  if (!currentDespesaFilterCriteria) return;

  try {
    const { descricao, valor, data } = currentDespesaFilterCriteria;

    let query = window.supabase
      .from("despesas")
      .select("*")
      .eq("usuario_id", currentDespesaFilterCriteria.userId);

    if (descricao) query = query.ilike("descricao", `%${descricao}%`);
    if (valor && !isNaN(parseFloat(valor)))
      query = query.eq("valor", parseFloat(valor));
    if (data) query = query.eq("data", data);

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
    (rows || []).forEach((despesa) => {
      addDespesaToTable(despesa, despesa.id);
      totalFiltered += Number(despesa.valor || 0);
    });

    const el = document.getElementById("filteredDespesaDisplay");
    if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

    console.log(
      `🔍 Filtro de despesas reaplicado: ${rows ? rows.length : 0} resultados`
    );
  } catch (err) {
    console.error("Erro ao reaplicar filtro de despesas:", err);
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
    return new Date(date).toLocaleDateString("pt-BR");
  } catch (e) {
    return date;
  }
}

function updateDespesaDisplay() {
  const el = document.getElementById("totalDespesaDisplay");
  if (el) el.textContent = `R$ ${totalDespesa.toFixed(2)}`;
}

async function loadDespesasFromSupabase() {
  try {
    // Se há um filtro ativo, não recarrega os dados para não sobrescrever os resultados filtrados
    if (isDespesaFilterActive) {
      console.log("⚠️ FILTRO ATIVO - Bloqueando recarregamento automático");
      console.trace("📍 Chamada bloqueada de loadDespesasFromSupabase():");
      return;
    }

    console.log("📊 Carregando todas as despesas (sem filtro)");
    console.trace("📍 Origem da chamada loadDespesasFromSupabase():");

    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await window.supabase
      .from("despesas")
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
    totalDespesa = 0;
    (data || []).forEach((despesa) => {
      addDespesaToTable(despesa, despesa.id);
      totalDespesa += Number(despesa.valor || 0);
    });
    updateDespesaDisplay();
    console.log("📊 Todas as despesas carregadas");
  } catch (err) {
    console.error("Erro carregando despesas do Supabase", err);
  }
}

async function removeDespesaFromSupabase(despesaId, despesaValue) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("despesas")
      .delete()
      .eq("id", despesaId);
    if (error) throw error;
    const row = document.getElementById(`row-${despesaId}`);
    if (row) row.remove();
    totalDespesa -= despesaValue;
    updateDespesaDisplay();
    showSuccessToast("Sucesso!", "Despesa excluída com sucesso!");
  } catch (err) {
    console.error("Erro ao remover despesa:", err);
    showErrorToast("Erro", "Não foi possível excluir a despesa.");
  }
}

async function updateDespesaInSupabase(despesaId, updatedDespesa) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("despesas")
      .update(updatedDespesa)
      .eq("id", despesaId);
    if (error) throw error;
    await reloadDespesaDataRespectingFilter();
  } catch (err) {
    console.error("Erro ao atualizar despesa:", err);
  }
}

function addDespesaToTable(despesa, despesaId) {
  const table = document.getElementById("data-table");
  if (!table) return;

  // Verifica se já existe uma linha com este ID para evitar duplicação
  const existingRow = document.getElementById(`row-${despesaId}`);
  if (existingRow) {
    console.log(`⚠️ Linha row-${despesaId} já existe, removendo duplicata`);
    existingRow.remove();
  }

  // Insere na tbody se existir, senão na tabela
  const tbody = table.querySelector("tbody");
  const newRow = tbody ? tbody.insertRow(-1) : table.insertRow(-1);
  newRow.id = `row-${despesaId}`;
  const descricaoCell = newRow.insertCell(0);
  descricaoCell.textContent = despesa.descricao || "";
  const valorCell = newRow.insertCell(1);
  valorCell.textContent = `R$ ${Number(despesa.valor || 0).toFixed(2)}`;
  const dataCell = newRow.insertCell(2);
  dataCell.textContent = formatarData(despesa.data);
  const categoriaCell = newRow.insertCell(3);
  if (despesa.categoria) {
    categoriaCell.innerHTML = `<span class="category-badge">${despesa.categoria}</span>`;
  } else {
    categoriaCell.textContent = "-";
  }
  const editCell = newRow.insertCell(4);
  const editButton = document.createElement("button");
  editButton.classList.add("edit-button");
  editButton.innerHTML =
    '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
  editButton.title = "Editar";
  editButton.onclick = () => editDespesa(despesaId, despesa);
  editCell.appendChild(editButton);
  const deleteCell = newRow.insertCell(5);
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.innerHTML =
    '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
  deleteButton.title = "Excluir";
  deleteButton.onclick = () =>
    removeDespesaFromSupabase(despesaId, Number(despesa.valor || 0));
  deleteCell.appendChild(deleteButton);
}

let editingDespesaId = null;
function editDespesa(despesaId, despesa) {
  document.getElementById("edit-description").value = despesa.descricao || "";
  document.getElementById("edit-amount").value = despesa.valor || "";
  document.getElementById("edit-date").value = despesa.data || "";
  document.getElementById("edit-categoria").value = despesa.categoria || "";
  editingDespesaId = despesaId;
  document.querySelector(".edit-modal-overlay").classList.add("active");
}
function closeEditModal() {
  document.querySelector(".edit-modal-overlay").classList.remove("active");
  editingDespesaId = null;
}

function submitEditForm(event) {
  event.preventDefault();
  const descricao = document.getElementById("edit-description").value;
  const valor = parseFloat(document.getElementById("edit-amount").value);
  const data = document.getElementById("edit-date").value;
  const categoria = document.getElementById("edit-categoria").value;
  if (descricao === "" || isNaN(valor) || data === "") {
    showToast("Por favor, preencha todos os campos corretamente!");
    return;
  }
  const updatedDespesa = { descricao, valor, data, categoria };
  updateDespesaInSupabase(editingDespesaId, updatedDespesa);
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

  saveDespesa(descricao, valor, data, categoria);
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
    await loadDespesasFromSupabase();
  }
});

async function saveDespesa(descricao, valor, data, categoria = null) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    // Processa categoria se fornecida
    let processedCategory = null;
    if (categoria && window.CategorizationUI) {
      processedCategory = await window.CategorizationUI.processCategory(
        { categoria: categoria },
        "despesa"
      );
    }

    const despesaData = {
      descricao,
      valor: parseFloat(valor),
      data,
      usuario_id: user.id,
      tipo: "despesa",
      categoria: processedCategory || categoria,
    };

    const { error } = await window.supabase
      .from("despesas")
      .insert([despesaData]);
    if (error) throw error;

    await loadDespesasFromSupabase();

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

    showSuccessToast("Despesa salva!", "Despesa adicionada com sucesso!");
  } catch (err) {
    console.error("Erro ao salvar despesa:", err);
    showErrorToast(
      "Erro ao salvar",
      "Falha ao salvar despesa. Tente novamente."
    );
  }
}

const formEl = document.querySelector("form");
if (formEl) formEl.addEventListener("submit", submitForm);

// Update user info - otimizado
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
  if (window.updateUserInfo) {
    console.debug("despesa.js: Inicializando dados do usuário");
    window.updateUserInfo();

    // Refresh único após inicialização completa
    if (!window.despesaRefreshExecuted) {
      window.despesaRefreshExecuted = true;
      setTimeout(() => {
        if (window.updateUserInfo && document.readyState === "complete") {
          console.debug("despesa.js: Sincronização final de dados");
          window.updateUserInfo();
        }
      }, 1800);
    }
  } else {
    console.debug("despesa.js: Aguardando inicialização...");
    setTimeout(waitForUpdateUserInfo, 120);
  }
})();

const FilterModal = {
  open() {
    document.querySelector(".filter-modal-overlay").classList.add("active");
  },
  close() {
    document.querySelector(".filter-modal-overlay").classList.remove("active");
  },
};

async function filterDespesas(event) {
  event.preventDefault();
  console.log("🔍 INICIANDO FILTRO DE DESPESAS");

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
      .from("despesas")
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
    (rows || []).forEach((despesa) => {
      addDespesaToTable(despesa, despesa.id);
      totalFiltered += Number(despesa.valor || 0);
    });

    // Atualiza o total filtrado
    const el = document.getElementById("filteredDespesaDisplay");
    if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

    // Mostra mensagem se nenhum resultado for encontrado
    if (!rows || rows.length === 0) {
      const table = document.getElementById("data-table");
      if (table) {
        table.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
              Nenhuma despesa encontrada com os filtros aplicados.
            </td>
          </tr>
        `;
      }
    }

    // Ativa o estado de filtro para prevenir recarregamento automático
    isDespesaFilterActive = true;

    FilterModal.close();

    // Log para debug
    console.log("🔍 Filtro aplicado com sucesso!");
    console.log(
      `📋 Critérios: Descrição="${descricaoInput}", Valor="${valorInput}", Data="${dataInput}"`
    );
    console.log(`📊 Resultados encontrados: ${rows ? rows.length : 0}`);
  } catch (err) {
    console.error("❌ Erro ao filtrar despesas:", err);
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
  isDespesaFilterActive = false;

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
  totalDespesa = 0;

  // Aguarda um momento antes de recarregar para garantir limpeza
  setTimeout(() => {
    loadDespesasFromSupabase();
  }, 50);

  // Reseta o display do total filtrado
  const el = document.getElementById("filteredDespesaDisplay");
  if (el) el.textContent = `R$ 0,00`;

  console.log("🔄 Filtros limpos - tabela completamente resetada");
}

// Funcionalidades de Boleto removidas
