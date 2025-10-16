// Plano model adapted for Supabase (Postgres)
// Expects window.supabase to be initialized in `controllers/supabase-init.env`

let totalPlano = 0;

// Modal helpers (existing UI uses these)
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

// Format date helper
function formatarData(date) {
  try {
    const dateObj = new Date(date);
    const formatted = dateObj.toLocaleDateString("pt-BR");

    // Debug: Log da conversão de data
    console.log(`📅 formatarData - Input: "${date}" → Output: "${formatted}"`);

    return formatted;
  } catch (e) {
    console.warn("❌ Erro ao formatar data:", date, e);
    return date;
  }
}

function updatePlanoDisplay() {
  const el = document.getElementById("totalPlanoDisplay");
  if (el) el.textContent = `R$ ${totalPlano.toFixed(2)}`;
}

// Variável global para controlar estado do filtro
let isPlanoFilterActive = false;

// Load planos for current user
async function loadPlanosFromSupabase() {
  try {
    // Se há um filtro ativo, não recarrega os dados para não sobrescrever os resultados filtrados
    if (isPlanoFilterActive) {
      console.log(
        "⚠️ Filtro ativo - impedindo recarregamento automático dos dados"
      );
      return;
    }

    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await window.supabase
      .from("planos")
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
    totalPlano = 0;

    (data || []).forEach((plano) => {
      addPlanoToTable(plano, plano.id);
      totalPlano += Number(plano.valor || 0);
    });

    updatePlanoDisplay();
  } catch (err) {
    console.error("Erro carregando planos do Supabase", err);
  }
}

async function removePlanoFromSupabase(planoId, planoValue) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("planos")
      .delete()
      .eq("id", planoId);
    if (error) throw error;
    const row = document.getElementById(`row-${planoId}`);
    if (row) row.remove();
    totalPlano -= planoValue;
    updatePlanoDisplay();
    showSuccessToast("Sucesso!", "Plano excluído com sucesso!");

    // Notifica outras páginas que os planos foram atualizados
    try {
      localStorage.setItem("planos_updated", Date.now().toString());
      setTimeout(() => localStorage.removeItem("planos_updated"), 1000);
    } catch (e) {
      console.log("ℹ️ LocalStorage não disponível para sincronização");
    }
  } catch (err) {
    console.error("Erro ao remover plano:", err);
    showErrorToast("Erro", "Não foi possível excluir o plano.");
  }
}

async function updatePlanoInSupabase(planoId, updatedPlano) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("planos")
      .update(updatedPlano)
      .eq("id", planoId);
    if (error) throw error;
    await loadPlanosFromSupabase();

    // Notifica outras páginas que os planos foram atualizados
    try {
      localStorage.setItem("planos_updated", Date.now().toString());
      setTimeout(() => localStorage.removeItem("planos_updated"), 1000);
    } catch (e) {
      console.log("ℹ️ LocalStorage não disponível para sincronização");
    }
  } catch (err) {
    console.error("Erro ao atualizar plano:", err);
  }
}

function addPlanoToTable(plano, planoId) {
  const table = document.getElementById("data-table");
  if (!table) return;

  // Verifica se já existe uma linha com este ID para evitar duplicação
  const existingRow = document.getElementById(`row-${planoId}`);
  if (existingRow) {
    console.log(`⚠️ Linha row-${planoId} já existe, removendo duplicata`);
    existingRow.remove();
  }

  // Insere na tbody se existir, senão na tabela
  const tbody = table.querySelector("tbody");
  const newRow = tbody ? tbody.insertRow(-1) : table.insertRow(-1);
  newRow.id = `row-${planoId}`;

  const descricaoCell = newRow.insertCell(0);
  descricaoCell.textContent = plano.descricao || "";

  const valorCell = newRow.insertCell(1);
  valorCell.textContent = `R$ ${Number(plano.valor || 0).toFixed(2)}`;

  const dataCell = newRow.insertCell(2);
  dataCell.textContent = formatarData(plano.data);

  const categoriaCell = newRow.insertCell(3);
  if (plano.categoria) {
    categoriaCell.innerHTML = `<span class="category-badge">${plano.categoria}</span>`;
  } else {
    categoriaCell.textContent = "-";
  }

  // Edit button
  const editCell = newRow.insertCell(4);
  const editButton = document.createElement("button");
  editButton.classList.add("edit-button");
  editButton.innerHTML =
    '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
  editButton.title = "Editar";
  editButton.onclick = function () {
    editPlano(planoId, plano);
  };
  editCell.appendChild(editButton);

  // Delete button
  const deleteCell = newRow.insertCell(5);
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.innerHTML =
    '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
  deleteButton.title = "Excluir";
  deleteButton.onclick = function () {
    removePlanoFromSupabase(planoId, Number(plano.valor || 0));
  };
  deleteCell.appendChild(deleteButton);
}

let editingPlanoId = null;

function editPlano(planoId, plano) {
  document.getElementById("edit-description").value = plano.descricao || "";
  document.getElementById("edit-amount").value = plano.valor || "";
  document.getElementById("edit-date").value = plano.data || "";
  document.getElementById("edit-categoria").value = plano.categoria || "";
  editingPlanoId = planoId;
  document.querySelector(".edit-modal-overlay").classList.add("active");
}

function closeEditModal() {
  document.querySelector(".edit-modal-overlay").classList.remove("active");
  editingPlanoId = null;
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

  const updatedPlano = { descricao, valor, data, categoria };
  updatePlanoInSupabase(editingPlanoId, updatedPlano);
  closeEditModal();
}

function submitForm(event) {
  event.preventDefault();
  const descricao = document.getElementById("descricao").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const data = document.getElementById("data").value;
  const categoria = document.getElementById("categoria").value;

  // Debug: Log dos valores capturados do formulário
  console.log("📝 Dados capturados do formulário:");
  console.log("  - Descrição:", descricao);
  console.log("  - Valor:", valor);
  console.log("  - Data raw:", data, "(tipo:", typeof data, ")");
  console.log("  - Categoria:", categoria);

  // Validações usando sistema toast padronizado
  if (!validateRequired(descricao, "Descrição")) return;
  if (!validateNumber(valor, "Valor", 0.01)) return;
  if (!validateRequired(data, "Data")) return;
  if (!validateDate(data, "Data")) return;

  savePlano(descricao, valor, data, categoria);
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
    await loadPlanosFromSupabase();
  }
});

async function savePlano(descricao, valor, data, categoria = null) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    // Debug: Log da data recebida do formulário
    console.log(
      "💾 Salvando plano - Data recebida:",
      data,
      "(tipo:",
      typeof data,
      ")"
    );

    // Verifica se a data está no formato correto (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      console.warn("⚠️ Formato de data inválido:", data);
    }

    // Processa categoria se fornecida
    let processedCategory = null;
    if (categoria && window.CategorizationUI) {
      processedCategory = await window.CategorizationUI.processCategory(
        { categoria: categoria },
        "plano"
      );
    }

    const planoData = {
      descricao,
      valor: parseFloat(valor),
      data,
      usuario_id: user.id,
      tipo: "plano",
      categoria: processedCategory || categoria,
    };

    console.log("💾 Dados que serão salvos no banco:", planoData);

    const { error } = await window.supabase.from("planos").insert([planoData]);
    if (error) throw error;

    await loadPlanosFromSupabase();
    showSuccessToast("Plano salvo!", "Plano adicionado com sucesso!");

    // Notifica outras páginas que os planos foram atualizados
    try {
      localStorage.setItem("planos_updated", Date.now().toString());
      setTimeout(() => localStorage.removeItem("planos_updated"), 1000);
    } catch (e) {
      console.log("ℹ️ LocalStorage não disponível para sincronização");
    }

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
    console.error("Erro ao salvar plano:", err);
    showErrorToast("Erro ao salvar", "Falha ao salvar plano. Tente novamente.");
  }
}

// Attach form submit listener if form exists
const formEl = document.querySelector("form");
if (formEl) formEl.addEventListener("submit", submitForm);

// Update user info in DOM
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
  if (window.updateUserInfo) {
    console.log("plano.js: Chamando window.updateUserInfo()");
    window.updateUserInfo();

    // Força refresh adicional após 2 segundos
    setTimeout(() => {
      console.log("plano.js: Refresh adicional após 2 segundos");
      if (window.updateUserInfo) {
        window.updateUserInfo();
      }
    }, 2000);
  } else {
    console.log(
      "plano.js: window.updateUserInfo não disponível, tentando novamente..."
    );
    setTimeout(waitForUpdateUserInfo, 100);
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

async function filterPlanos(event) {
  event.preventDefault();
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

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    let query = window.supabase
      .from("planos")
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
      console.log("🔍 Filtro de data aplicado:", dataInput);
      query = query.eq("data", dataInput);
    }

    // Filtro por categoria: busca parcial (case insensitive)
    if (categoriaInput) {
      console.log("🔍 Filtro de categoria aplicado:", categoriaInput);
      query = query.ilike("categoria", `%${categoriaInput}%`);
    }

    // Para debug, vamos buscar TODOS os planos primeiro e ver as datas
    if (dataInput) {
      console.log("🔍 DEBUG: Buscando todos os planos para comparar datas...");
      const { data: allPlanos } = await window.supabase
        .from("planos")
        .select("*")
        .eq("usuario_id", user.id)
        .order("criado_em", { ascending: false });

      console.log("📅 Todas as datas no banco:");
      allPlanos?.forEach((plano, idx) => {
        console.log(
          `  ${idx + 1}. ID: ${plano.id.substring(0, 8)} | Descrição: "${
            plano.descricao
          }" | Data: "${plano.data}" (tipo: ${typeof plano.data})`
        );
      });
      console.log(
        `🎯 Procurando por: "${dataInput}" (tipo: ${typeof dataInput})`
      );
    }

    const { data: rows, error } = await query.order("criado_em", {
      ascending: false,
    });

    // Log das datas encontradas no banco para debug
    if (dataInput) {
      if (rows && rows.length > 0) {
        console.log("✅ Resultados do filtro:");
        rows.forEach((plano, idx) => {
          console.log(
            `  ${idx + 1}. DB: "${
              plano.data
            }" | Filtro: "${dataInput}" | Match: ${plano.data === dataInput}`
          );
        });
      } else {
        console.log("❌ Nenhum resultado encontrado para a data:", dataInput);
        const { data: allPlanos } = await window.supabase
          .from("planos")
          .select("data")
          .eq("usuario_id", user.id);

        const datasDisponiveis = [
          ...new Set(allPlanos?.map((p) => p.data)),
        ].sort();
        console.log("📅 Datas disponíveis no banco:", datasDisponiveis);
      }
    }

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
    (rows || []).forEach((plano) => {
      addPlanoToTable(plano, plano.id);
      totalFiltered += Number(plano.valor || 0);
    });

    // Atualiza o total filtrado
    const el = document.getElementById("filteredPlanoDisplay");
    if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

    // Mostra mensagem se nenhum resultado for encontrado
    if (!rows || rows.length === 0) {
      const table = document.getElementById("data-table");
      if (table) {
        table.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
              Nenhum plano encontrado com os filtros aplicados.
            </td>
          </tr>
        `;
      }
    }

    // Ativa o estado de filtro para prevenir recarregamento automático
    isPlanoFilterActive = true;

    FilterModal.close();

    // Log para debug
    console.log("🔍 Filtro aplicado com sucesso!");
    console.log(
      `📋 Critérios: Descrição="${descricaoInput}", Valor="${valorInput}", Data="${dataInput}"`
    );
    console.log(`📊 Resultados encontrados: ${rows ? rows.length : 0}`);
  } catch (err) {
    console.error("❌ Erro ao filtrar planos:", err);
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
  isPlanoFilterActive = false;

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
  totalPlano = 0;

  // Aguarda um momento antes de recarregar para garantir limpeza
  setTimeout(() => {
    loadPlanosFromSupabase();
  }, 50);

  // Reseta o display do total filtrado
  const el = document.getElementById("filteredPlanoDisplay");
  if (el) el.textContent = `R$ 0,00`;

  console.log("🔄 Filtros limpos - tabela completamente resetada");
}
