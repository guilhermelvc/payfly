// Investimentos model adapted for Supabase (Postgres)
// Expects window.supabase to be initialized in `controllers/supabase-init.env`

let totalInvestimento = 0;
let editingInvestimentoId = null;

function formatInvestimentoValue(value) {
  const numericValue = Number(value || 0);
  if (window.formatCurrencyBRL) {
    return window.formatCurrencyBRL(numericValue);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

// Modal helpers (existing UI uses these)
const Modal = {
  open() {
    // Limpa o formulário ao abrir
    const form = document.getElementById("form");
    if (form) {
      form.reset();
      // Define data padrão como hoje
      const hoje = new Date().toISOString().split("T")[0];
      const dataField = document.getElementById("data");
      if (dataField) {
        dataField.value = hoje;
      }
    }

    document
      .querySelector(".standardized-modal-overlay")
      .classList.add("active");
  },
  close() {
    document
      .querySelector(".standardized-modal-overlay")
      .classList.remove("active");

    // Limpa o formulário ao fechar
    const form = document.getElementById("form");
    if (form) {
      form.reset();
    }
  },
};

// Format date helper
function formatarData(date) {
  try {
    const dateObj = new Date(date);
    const formatted = dateObj.toLocaleDateString("pt-BR");
    return formatted;
  } catch (e) {
    return date;
  }
}

function updateInvestimentoDisplay() {
  const el = document.getElementById("totalInvestimentosDisplay");
  if (el) el.textContent = formatInvestimentoValue(totalInvestimento);
}

// Variável global para controlar estado do filtro
let isInvestimentoFilterActive = false;

// Load investimentos for current user
async function loadInvestimentosFromSupabase() {
  try {
    // Se há um filtro ativo, não recarrega os dados para não sobrescrever os resultados filtrados
    if (isInvestimentoFilterActive) {
      return;
    }

    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await window.supabase
      .from("investimentos")
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
      } else {
        // Se não existe tbody, remove todas as linhas exceto thead
        const thead = table.querySelector("thead");
        const allRows = table.querySelectorAll("tr");
        allRows.forEach((row, index) => {
          // Preserva apenas a primeira linha (cabeçalho) se não há thead
          if (index > 0 || (thead && row !== thead.children[0])) {
            row.remove();
          }
        });
      }
    }

    // Adiciona os investimentos na tabela
    totalInvestimento = 0;
    data?.forEach((investimento) => {
      addInvestimentoToTable(investimento, investimento.id);
      totalInvestimento += parseFloat(investimento.valor_investido) || 0;
    });

    updateInvestimentoDisplay();

    // Se não há filtro ativo, mantém o total filtrado zerado
    if (!isInvestimentoFilterActive) {
      const elFiltrado = document.getElementById(
        "filteredInvestimentosDisplay"
      );
      if (elFiltrado) elFiltrado.textContent = formatInvestimentoValue(0);
    }
  } catch (err) {
    console.error("Erro carregando investimentos do Supabase", err);
  }
}

async function removeInvestimentoFromSupabase(
  investimentoId,
  investimentoValue
) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("investimentos")
      .delete()
      .eq("id", investimentoId);
    if (error) throw error;

    const row = document.getElementById(`row-${investimentoId}`);
    if (row) row.remove();

    totalInvestimento -= investimentoValue;
    updateInvestimentoDisplay();

    showSuccessToast("Sucesso!", "Investimento excluído com sucesso!");
  } catch (err) {
    console.error("Erro ao remover investimento:", err);
    showErrorToast("Erro!", "Não foi possível excluir o investimento");
  }
}

async function updateInvestimentoInSupabase(
  investimentoId,
  updatedInvestimento
) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("investimentos")
      .update(updatedInvestimento)
      .eq("id", investimentoId);
    if (error) throw error;

    await loadInvestimentosFromSupabase();
    showSuccessToast("Sucesso!", "Investimento atualizado com sucesso!");
  } catch (err) {
    console.error("Erro ao atualizar investimento:", err);
    showErrorToast("Erro!", "Não foi possível atualizar o investimento");
  }
}

function addInvestimentoToTable(investimento, investimentoId) {
  const table = document.getElementById("data-table");
  if (!table) return;

  // Verifica se já existe uma linha com este ID para evitar duplicação
  const existingRow = document.getElementById(`row-${investimentoId}`);
  if (existingRow) {
    existingRow.remove();
  }

  const tbody = table.querySelector("tbody") || table;
  const row = document.createElement("tr");
  row.id = `row-${investimentoId}`;

  // Calcula rentabilidade
  const valorInvestido = parseFloat(investimento.valor_investido) || 0;
  const valorAtual = parseFloat(investimento.valor_atual) || valorInvestido;
  const rentabilidade =
    valorInvestido > 0
      ? ((valorAtual - valorInvestido) / valorInvestido) * 100
      : 0;
  const performanceClass =
    rentabilidade >= 0 ? "performance-positive" : "performance-negative";

  const formattedValorInvestido = formatInvestimentoValue(valorInvestido);
  const formattedValorAtual = formatInvestimentoValue(valorAtual);

  row.innerHTML = `
    <td>${investimento.descricao}</td>
    <td>${investimento.tipo}</td>
    <td>${formattedValorInvestido}</td>
    <td>${formattedValorAtual}</td>
    <td class="${performanceClass}">${rentabilidade.toFixed(2)}%</td>
    <td>${formatarData(investimento.data_aplicacao)}</td>
    <td>
      <button onclick="editInvestimento('${investimentoId}', ${JSON.stringify(
    investimento
  ).replace(/"/g, "&quot;")})"
              class="edit-button" title="Editar">
        <ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>
      </button>
    </td>
    <td>
      <button onclick="showDeleteConfirm('${investimentoId}', ${valorInvestido})"
              class="delete-button" title="Excluir">
        <ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>
      </button>
    </td>
  `;
  tbody.appendChild(row);
}

// Variáveis globais para controle do modal de exclusão
let pendingDeleteId = null;
let pendingDeleteValue = null;

function showDeleteConfirm(investimentoId, valor) {
  pendingDeleteId = investimentoId;
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
    removeInvestimentoFromSupabase(pendingDeleteId, pendingDeleteValue);
    closeDeleteConfirm();
  }
}

function editInvestimento(investimentoId, investimento) {
  document.getElementById("edit-nome").value = investimento.descricao || "";
  document.getElementById("edit-valor-investido").value =
    investimento.valor_investido || "";
  document.getElementById("edit-valor-atual").value =
    investimento.valor_atual || "";
  document.getElementById("edit-date").value =
    investimento.data_aplicacao || "";
  document.getElementById("edit-tipo").value = investimento.tipo || "";

  // Popula campos de recorrência
  const isRecorrente = investimento.is_recorrente || false;
  const recorrenciaMeses = investimento.recorrencia_meses || 1;
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

  editingInvestimentoId = investimentoId;
  document.querySelector(".edit-modal-overlay").style.display = "flex";
}

function closeEditModal() {
  document.querySelector(".edit-modal-overlay").style.display = "none";
  editingInvestimentoId = null;
  // Limpa o formulário de edição
  const editForm = document.getElementById("edit-form");
  if (editForm) {
    editForm.reset();
  }
  // Reseta o switch de recorrência
  const recorrenceCheckbox = document.getElementById("edit-is-recorrente");
  if (recorrenceCheckbox) {
    recorrenceCheckbox.checked = false;
    document.getElementById("edit-recorrencia-meses-group").style.display =
      "none";
  }
}

function toggleEditRecorrenciaFields() {
  const isRecorrente = document.getElementById("edit-is-recorrente").checked;
  const mesesGroup = document.getElementById("edit-recorrencia-meses-group");

  if (isRecorrente) {
    mesesGroup.style.display = "block";
  } else {
    mesesGroup.style.display = "none";
  }
}

function toggleRecorrenciaFields() {
  const isRecorrente = document.getElementById("is_recorrente")?.checked;
  const mesesGroup = document.getElementById("recorrencia_meses_group");

  if (isRecorrente && mesesGroup) {
    mesesGroup.style.display = "block";
  } else if (mesesGroup) {
    mesesGroup.style.display = "none";
  }
}

window.toggleEditRecorrenciaFields = toggleEditRecorrenciaFields;
window.toggleRecorrenciaFields = toggleRecorrenciaFields;

function submitEditForm(event) {
  event.preventDefault();

  const descricao = document.getElementById("edit-nome").value;
  const valorInvestido = parseFloat(
    document.getElementById("edit-valor-investido").value
  );
  const valorAtual = parseFloat(
    document.getElementById("edit-valor-atual").value
  );
  const data = document.getElementById("edit-date").value;
  const tipo = document.getElementById("edit-tipo").value;

  // Validações básicas
  if (!descricao || descricao.trim() === "") {
    showErrorToast("Erro!", "Descrição é obrigatória");
    return;
  }
  if (!valorInvestido || valorInvestido <= 0) {
    showErrorToast("Erro!", "Valor investido deve ser maior que zero");
    return;
  }
  if (!valorAtual || valorAtual <= 0) {
    showErrorToast("Erro!", "Valor atual deve ser maior que zero");
    return;
  }
  if (!data) {
    showErrorToast("Erro!", "Data é obrigatória");
    return;
  }
  if (!tipo || tipo.trim() === "") {
    showErrorToast("Erro!", "Tipo é obrigatório");
    return;
  }

  // Calcula rentabilidade
  const rentabilidade =
    valorInvestido > 0
      ? ((valorAtual - valorInvestido) / valorInvestido) * 100
      : 0;

  // Captura campos de recorrência da edição
  const isRecorrente =
    document.getElementById("edit-is-recorrente")?.checked || false;
  const recorrenciaMeses = isRecorrente
    ? parseInt(document.getElementById("edit-recorrencia-meses")?.value || 1)
    : 1;

  const updatedInvestimento = {
    descricao: descricao.trim(),
    valor_investido: valorInvestido,
    valor_atual: valorAtual,
    data_aplicacao: data,
    tipo: tipo.trim(),
    rentabilidade: rentabilidade,
    categoria: "Investimentos",
    is_recorrente: isRecorrente,
    recorrencia_meses: recorrenciaMeses,
  };

  updateInvestimentoInSupabase(editingInvestimentoId, updatedInvestimento);
  closeEditModal();
}

async function saveInvestimento(
  descricao,
  valorInvestido,
  valorAtual,
  dataAplicacao,
  tipo
) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    // Validações básicas
    if (!descricao || descricao.trim() === "") {
      throw new Error("Descrição é obrigatória");
    }
    if (!valorInvestido || valorInvestido <= 0) {
      throw new Error("Valor investido deve ser maior que zero");
    }
    if (!dataAplicacao) {
      throw new Error("Data de aplicação é obrigatória");
    }
    if (!tipo || tipo.trim() === "") {
      throw new Error("Tipo é obrigatório");
    }

    // Verifica se é investimento recorrente
    const isRecorrente =
      document.getElementById("is_recorrente")?.checked || false;
    const recorrenciaMeses = isRecorrente
      ? parseInt(document.getElementById("recorrencia_meses")?.value || 1)
      : 1;

    // Se valor atual não for fornecido, usa o valor investido
    const valorAtualFinal =
      valorAtual && valorAtual > 0 ? valorAtual : valorInvestido;

    // Calcula rentabilidade
    let rentabilidade =
      valorInvestido > 0
        ? ((valorAtualFinal - valorInvestido) / valorInvestido) * 100
        : 0;

    // Validação de rentabilidade para evitar valores irreais/estouro no banco (NUMERIC(5,2))
    const rentabilidadeAbsoluta = Math.abs(rentabilidade);
    if (rentabilidadeAbsoluta > 999.99) {
      showErrorToast(
        "Rentabilidade inválida",
        "A rentabilidade calculada está fora da realidade. Verifique os valores de 'Valor investido' e 'Valor atual'."
      );
      return;
    }

    // Se é recorrente, cria múltiplos investimentos
    if (isRecorrente && recorrenciaMeses > 1) {
      const investimentosParaCriar = [];
      const dataInicial = new Date(dataAplicacao);

      // Cria um investimento para cada mês
      for (let i = 0; i < recorrenciaMeses; i++) {
        const novaData = new Date(dataInicial);
        novaData.setMonth(novaData.getMonth() + i);

        // Formata a data como YYYY-MM-DD
        const dataFormatada = novaData.toISOString().split("T")[0];

        investimentosParaCriar.push({
          descricao,
          valor_investido: parseFloat(valorInvestido),
          valor_atual: parseFloat(valorAtualFinal),
          data_aplicacao: dataFormatada,
          tipo: tipo.trim(),
          rentabilidade: rentabilidade,
          categoria: "Investimentos",
          usuario_id: user.id,
          is_recorrente: i === 0 ? true : false,
          recorrencia_meses: i === 0 ? recorrenciaMeses : 1,
        });
      }

      // Insere todos os investimentos
      const { error } = await window.supabase
        .from("investimentos")
        .insert(investimentosParaCriar);
      if (error) throw error;
    } else {
      // Cria investimento único (sem recorrência)
      const investimentoData = {
        descricao: descricao.trim(),
        valor_investido: parseFloat(valorInvestido),
        valor_atual: parseFloat(valorAtualFinal),
        data_aplicacao: dataAplicacao,
        tipo: tipo.trim(),
        rentabilidade: rentabilidade,
        categoria: "Investimentos",
        usuario_id: user.id,
        is_recorrente: false,
        recorrencia_meses: 1,
      };

      const { data, error } = await window.supabase
        .from("investimentos")
        .insert([investimentoData])
        .select();

      if (error) {
        console.error("❌ Erro do Supabase:", error);
        throw error;
      }

      // Adiciona na tabela
      if (data && data[0]) {
        addInvestimentoToTable(data[0], data[0].id);
        totalInvestimento += parseFloat(valorInvestido);
        updateInvestimentoDisplay();
      }
    }

    await reloadInvestmentDataRespectingFilter();
    showSuccessToast("Sucesso!", "Investimento(s) adicionado(s) com sucesso!");
    Modal.close();

    // Reseta o switch de recorrência
    const recorrenceCheckbox = document.getElementById("is_recorrente");
    if (recorrenceCheckbox) {
      recorrenceCheckbox.checked = false;
      document.getElementById("recorrencia_meses_group").style.display = "none";
    }
  } catch (err) {
    // Se o erro for apenas de variáveis de filtro não definidas, não mostrar toast para o usuário
    if (
      err instanceof ReferenceError &&
      (err.message.includes("isInvestmentFilterActive") ||
        err.message.includes("currentInvestmentFilterCriteria"))
    ) {
      console.warn(
        "Aviso: variáveis de filtro de investimentos não definidas no contexto atual.",
        err
      );
      return;
    }

    let errorMessage = err.message || "Erro desconhecido";
    if (err.message.includes("duplicate")) {
      errorMessage = "Investimento já existe";
    } else if (err.message.includes("permission")) {
      errorMessage = "Sem permissão para salvar";
    } else if (err.message.includes("authentication")) {
      errorMessage = "Usuário não autenticado";
    }

    showErrorToast("Erro ao salvar", errorMessage);
  }
}

// Função para aplicar filtro armazenado
async function applyStoredInvestmentFilter() {
  if (!currentInvestmentFilterCriteria) return;

  try {
    const { descricao, valor, data, tipo } = currentInvestmentFilterCriteria;

    let query = window.supabase
      .from("investimentos")
      .select("*")
      .eq("usuario_id", currentInvestmentFilterCriteria.userId);

    if (descricao) query = query.ilike("descricao", `%${descricao}%`);
    if (valor && !isNaN(parseFloat(valor)))
      query = query.eq("valor_investido", parseFloat(valor));
    if (data) query = query.eq("data_aplicacao", data);
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

    investments =
      rows?.map((item) => ({
        id: item.id,
        description: item.descricao,
        amount: parseFloat(item.valor_investido),
        currentValue: parseFloat(item.valor_atual || item.valor_investido),
        date: item.data_aplicacao,
        tipo: item.tipo,
        category: item.categoria || item.tipo,
        rentabilidade: parseFloat(item.rentabilidade || 0),
      })) || [];

    totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
    filteredInvestments = [...investments]; // Inicializa filteredInvestments com todos os investimentos
    updateTable();
    updateInvestmentDisplay();
  } catch (error) {
    console.error("Erro aplicando filtro de investimentos:", error);
    showErrorToast("Erro no filtro", "Não foi possível aplicar o filtro");
  }
}

// Recarrega os dados respeitando se há filtro ativo ou não
async function reloadInvestmentDataRespectingFilter() {
  if (isInvestmentFilterActive && currentInvestmentFilterCriteria) {
    await applyStoredInvestmentFilter();
  } else {
    await loadInvestmentsFromSupabase();
  }
}

async function loadInvestmentsFromSupabase() {
  try {
    if (isInvestmentFilterActive) {
      return;
    }

    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    const { data, error } = await window.supabase
      .from("investimentos")
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
    investments =
      data?.map((item) => {
        return {
          id: item.id,
          description: item.descricao,
          amount: parseFloat(item.valor_investido),
          currentValue: parseFloat(item.valor_atual || item.valor_investido),
          date: item.data_aplicacao,
          tipo: item.tipo,
          category: item.categoria || item.tipo,
          rentabilidade: parseFloat(item.rentabilidade || 0),
        };
      }) || [];

    totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
    filteredInvestments = [...investments]; // Inicializa filteredInvestments com todos os investimentos
    updateTable();
    updateInvestmentDisplay();
  } catch (err) {
    console.error("Erro carregando investimentos do Supabase", err);
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
  const treseMeses = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 3,
    hoje.getDate()
  );

  investments = [
    {
      id: "demo1",
      description: "Tesouro IPCA+ 2035",
      amount: 5000.0,
      currentValue: 5250.0,
      date: treseMeses.toISOString().split("T")[0],
      tipo: "Tesouro Direto",
      category: "Tesouro Direto",
      rentabilidade: 5.0,
    },
    {
      id: "demo2",
      description: "CDB Banco XYZ",
      amount: 3000.0,
      currentValue: 3150.0,
      date: mesPassado.toISOString().split("T")[0],
      tipo: "CDB",
      category: "CDB",
      rentabilidade: 5.0,
    },
    {
      id: "demo3",
      description: "Ações PETR4",
      amount: 2000.0,
      currentValue: 1950.0,
      date: mesPassado.toISOString().split("T")[0],
      tipo: "Ação",
      category: "Ações",
      rentabilidade: -2.5,
    },
    {
      id: "demo4",
      description: "Fundo Imobiliário XPML11",
      amount: 1500.0,
      currentValue: 1620.0,
      date: hoje.toISOString().split("T")[0],
      tipo: "Fundo Imobiliário",
      category: "Fundos",
      rentabilidade: 8.0,
    },
  ];

  totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
  filteredInvestments = [...investments];
}

// ================ Funções CRUD Supabase ================

async function saveInvestment(
  descricao,
  valorInvestido,
  valorAtual,
  dataAplicacao,
  tipo
) {
  try {
    // Validação dos campos obrigatórios
    if (!descricao || descricao.trim() === "") {
      throw new Error("Descrição é obrigatória");
    }
    if (!valorInvestido || isNaN(parseFloat(valorInvestido))) {
      throw new Error(
        "Valor investido é obrigatório e deve ser um número válido"
      );
    }
    if (!dataAplicacao) {
      throw new Error("Data de aplicação é obrigatória");
    }
    if (!tipo || tipo.trim() === "") {
      throw new Error("Tipo de investimento é obrigatório");
    }

    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    const valorInv = parseFloat(valorInvestido);
    const valorAt = parseFloat(valorAtual || valorInvestido);
    const rentabilidade =
      valorInv > 0 ? ((valorAt - valorInv) / valorInv) * 100 : 0;

    const investmentData = {
      descricao,
      valor_investido: valorInv,
      valor_atual: valorAt,
      data_aplicacao: dataAplicacao,
      tipo,
      rentabilidade: rentabilidade,
      categoria: tipo,
      usuario_id: user.id,
    };

    const { data: insertResult, error } = await window.supabase
      .from("investimentos")
      .insert([investmentData])
      .select();

    if (error) {
      console.error("❌ Erro do Supabase:", error);
      throw new Error(`Erro do banco de dados: ${error.message}`);
    }

    await reloadInvestmentDataRespectingFilter();
    showSuccessToast(
      "Investimento salvo!",
      "Investimento adicionado com sucesso!"
    );

    // Fecha o modal após salvar
    if (typeof Modal !== "undefined" && Modal.close) {
      Modal.close();
    } else {
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
  } catch (err) {
    console.error("❌ Erro detalhado ao salvar investimento:", err);
    console.error("❌ Stack trace:", err.stack);
    console.error("❌ Mensagem:", err.message);

    let errorMessage = "Não foi possível salvar o investimento";
    if (err.message.includes("obrigatório")) {
      errorMessage = err.message;
    } else if (err.message.includes("duplicate")) {
      errorMessage = "Investimento já existe";
    } else if (err.message.includes("permission")) {
      errorMessage = "Sem permissão para salvar";
    }

    showErrorToast("Erro ao salvar", errorMessage);
  }
}

async function updateInvestmentInSupabase(investmentId, updatedData) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");

    // Verifica se usuário está autenticado
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    // Validações básicas
    if (!investmentId) {
      throw new Error("ID do investimento é obrigatório");
    }

    // Calcula rentabilidade se valores foram fornecidos
    if (updatedData.valor_investido && updatedData.valor_atual) {
      const valorInv = parseFloat(updatedData.valor_investido);
      const valorAt = parseFloat(updatedData.valor_atual);
      updatedData.rentabilidade =
        valorInv > 0 ? ((valorAt - valorInv) / valorInv) * 100 : 0;
    }

    const { error } = await window.supabase
      .from("investimentos")
      .update(updatedData)
      .eq("id", investmentId)
      .eq("usuario_id", user.id); // Garante que só atualiza investimentos do usuário atual

    if (error) {
      console.error("❌ Erro do Supabase:", error);
      throw error;
    }

    await reloadInvestmentDataRespectingFilter();
  } catch (err) {
    console.error("❌ Erro ao atualizar investimento:", err);
    throw err; // Re-throw para que submitEditForm possa tratar
  }
}

async function removeInvestmentFromSupabase(investmentId) {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { error } = await window.supabase
      .from("investimentos")
      .delete()
      .eq("id", investmentId);
    if (error) throw error;

    await reloadInvestmentDataRespectingFilter();
    showSuccessToast(
      "Investimento removido!",
      "Investimento excluído com sucesso!"
    );
  } catch (err) {
    console.error("Erro ao remover investimento:", err);
    showErrorToast(
      "Erro ao excluir",
      "Não foi possível excluir o investimento"
    );
  }
}

// ================ Inicialização ================
document.addEventListener("DOMContentLoaded", async function () {
  // Carrega investimentos do Supabase
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
        await loadInvestimentosFromSupabase();
      }
    } catch (error) {
      console.error("Erro na inicialização:", error);
    }
  }

  // Define data padrão como hoje
  const hoje = new Date().toISOString().split("T")[0];
  if (document.getElementById("data")) {
    document.getElementById("data").value = hoje;
  }
});

// ================ Exposição de funções globais ================
window.saveInvestimento = saveInvestimento;
window.editInvestimento = editInvestimento;
window.submitEditForm = submitEditForm;
window.closeEditModal = closeEditModal;
window.removeInvestimentoFromSupabase = removeInvestimentoFromSupabase;
window.Modal = Modal;
function addInvestmentRowToTable(item, index) {
  const table = document.getElementById("data-table");
  const tbody = table?.querySelector("tbody") || table;
  if (!tbody) return;

  const row = document.createElement("tr");
  row.id = `row-${item.id}`;

  const performanceClass =
    item.rentabilidade >= 0 ? "performance-positive" : "performance-negative";
  const performanceSymbol = item.rentabilidade >= 0 ? "+" : "";

  row.innerHTML = `
    <td>${item.description}</td>
    <td>${item.tipo}</td>
    <td>${formatCurrency(item.amount)}</td>
    <td>${formatCurrency(item.currentValue)}</td>
    <td class="${performanceClass}">${performanceSymbol}${item.rentabilidade.toFixed(
    2
  )}%</td>
    <td>${formatDate(item.date)}</td>
    <td><button onclick="editInvestment(${index})" class="edit-button" title="Editar"><ion-icon name="create-outline" style="font-size: 20px;"></ion-icon></button></td>
    <td><button onclick="showDeleteInvestmentConfirm('${
      item.id
    }')" class="delete-button" title="Excluir"><ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon></button></td>
  `;

  tbody.appendChild(row);
}

// Funções para confirmação de exclusão de transação de investimento
function showDeleteInvestmentConfirm(investmentId) {
  window.pendingDeleteInvestmentId = investmentId;
  document.getElementById("deleteConfirmModal").classList.add("active");
}

window.showDeleteInvestmentConfirm = showDeleteInvestmentConfirm;

// Adicionar ao escopo global para confirmar exclusão de transação
const originalConfirmDelete = window.confirmDelete;
window.confirmDelete = function () {
  if (window.pendingDeleteInvestmentId) {
    deleteInvestmentTransaction(window.pendingDeleteInvestmentId);
    window.pendingDeleteInvestmentId = null;
    closeDeleteConfirm();
  } else if (originalConfirmDelete) {
    originalConfirmDelete();
  }
};

function updateTotalDisplay() {
  const totalInvestido = investments.reduce((sum, i) => sum + i.amount, 0);
  const valorAtual = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const lucro = valorAtual - totalInvestido;
  const rentabilidadeTotal =
    totalInvestido > 0 ? (lucro / totalInvestido) * 100 : 0;

  const filteredInvestido = filteredInvestments.reduce(
    (sum, i) => sum + i.amount,
    0
  );
  const filteredAtual = filteredInvestments.reduce(
    (sum, i) => sum + i.currentValue,
    0
  );
  const filteredLucro = filteredAtual - filteredInvestido;

  document.getElementById("totalInvestidoDisplay").textContent =
    formatCurrency(totalInvestido);
  document.getElementById("valorAtualDisplay").textContent =
    formatCurrency(valorAtual);
  document.getElementById("lucroDisplay").textContent = formatCurrency(lucro);
  document.getElementById(
    "rentabilidadeDisplay"
  ).textContent = `${rentabilidadeTotal.toFixed(2)}%`;

  // Atualiza classe de cor baseado no lucro
  const lucroElement = document.getElementById("lucroDisplay");
  const rentabilidadeElement = document.getElementById("rentabilidadeDisplay");

  if (lucro >= 0) {
    lucroElement.className = "performance-positive";
    rentabilidadeElement.className = "performance-positive";
  } else {
    lucroElement.className = "performance-negative";
    rentabilidadeElement.className = "performance-negative";
  }
}

function updateInvestmentDisplay() {
  updateTotalDisplay();
}

// ================ Funções CRUD para UI ================

async function deleteInvestmentTransaction(investmentId) {
  await removeInvestmentFromSupabase(investmentId);
}

async function editInvestmentTransaction(investmentId) {
  // Encontra o investimento
  const investment = investments.find((inv) => inv.id === investmentId);
  if (!investment) {
    showErrorToast("Erro", "Investimento não encontrado");
    return;
  }

  // Preenche o formulário de edição
  document.getElementById("edit-nome").value = investment.description;
  document.getElementById("edit-tipo").value = investment.tipo;
  document.getElementById("edit-valor-investido").value = investment.amount;
  document.getElementById("edit-valor-atual").value = investment.currentValue;
  document.getElementById("edit-data").value = investment.date;
  document.getElementById("edit-id").value = investmentId;

  // Abre o modal de edição
  document.querySelector(".edit-modal-overlay").style.display = "flex";
}

function updateTable() {
  const tbody = document.querySelector("#data-table tbody");
  tbody.innerHTML = "";

  filteredInvestments.forEach((investment, index) => {
    const row = document.createElement("tr");

    const lucro = investment.currentValue - investment.amount;
    const rentabilidade =
      investment.amount > 0 ? (lucro / investment.amount) * 100 : 0;
    const performanceClass =
      lucro >= 0 ? "performance-positive" : "performance-negative";

    row.innerHTML = `
            <td>${investment.description}</td>
            <td>${investment.tipo}</td>
            <td>${formatCurrency(investment.amount)}</td>
            <td>${formatCurrency(investment.currentValue)}</td>
            <td class="${performanceClass}">${rentabilidade.toFixed(2)}%</td>
            <td>${formatDate(investment.date)}</td>
            <td><button onclick="editInvestment(${index})" class="btn edit">✏️</button></td>
            <td><button onclick="deleteInvestment(${index})" class="btn delete">🗑️</button></td>
        `;

    tbody.appendChild(row);
  });
}

// ================ Modal Management ================
// Modal já declarado acima

const FilterModal = {
  open: function () {
    document.querySelector(".filter-modal-overlay").style.display = "flex";
  },
  close: function () {
    document.querySelector(".filter-modal-overlay").style.display = "none";
    document.getElementById("filter-form").reset();
  },
};

// ================ Form Handling ================
const Form = {
  submit: async function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const descricao = formData.get("nome"); // Campo correto do HTML
    const valorInvestido = formData.get("valor_investido"); // Campo correto do HTML
    const valorAtual = formData.get("valor_atual") || valorInvestido;
    const data = formData.get("data");
    const tipo = formData.get("tipo");

    // Salva no Supabase se disponível, senão salva localmente
    if (window.supabase) {
      await saveInvestimento(descricao, valorInvestido, valorAtual, data, tipo);
      // Garantir fechamento do modal e reset do formulário após sucesso
      if (typeof Modal !== "undefined" && Modal.close) {
        Modal.close();
      }
      const form = event.target;
      if (form && form.reset) {
        form.reset();
      }
    } else {
      // Fallback para modo local
      const valorInv = parseFloat(valorInvestido);
      const valorAt = parseFloat(valorAtual);

      const newInvestment = {
        id: `local-${Date.now()}`,
        description: descricao,
        amount: valorInv,
        currentValue: valorAt,
        date: data,
        tipo: tipo,
        category: tipo,
        rentabilidade:
          valorInv > 0 ? ((valorAt - valorInv) / valorInv) * 100 : 0,
      };

      investments.push(newInvestment);
      filteredInvestments = [...investments];

      updateTotalDisplay();
      updateTable();
      Modal.close();

      showSuccessToast("Sucesso!", "Investimento adicionado com sucesso!");
    }
  },
};

// Exporta o Form para o escopo global
window.Form = Form;

// ================ CRUD Operations ================
function editInvestment(index) {
  // Pega o investimento do array filtrado (que é o que está sendo mostrado na tabela)
  const investment = filteredInvestments[index];

  if (!investment) {
    showErrorToast("Erro", "Investimento não encontrado");
    return;
  }

  // Encontra o índice real no array principal usando o ID
  const realIndex = investments.findIndex((inv) => inv.id === investment.id);

  if (realIndex === -1) {
    showErrorToast("Erro", "Investimento não encontrado no array principal");
    return;
  }

  // Preenche o modal de edição
  document.getElementById("edit-nome").value = investment.description || "";
  document.getElementById("edit-valor-investido").value =
    investment.amount || "";
  document.getElementById("edit-valor-atual").value =
    investment.currentValue || "";
  document.getElementById("edit-date").value = investment.date || "";
  document.getElementById("edit-tipo").value = investment.tipo || "";

  // Armazena o índice REAL para usar no submit
  document.getElementById("edit-form").dataset.editIndex = realIndex;

  // Abre modal de edição
  document.querySelector(".edit-modal-overlay").style.display = "flex";
}

// Função removida - estava duplicada e conflitando

async function deleteInvestment(index) {
  const investment = filteredInvestments[index];

  if (!investment || !investment.id) {
    showErrorToast("Erro!", "Investimento não encontrado");
    return;
  }

  try {
    // Remove do Supabase
    await removeInvestmentFromSupabase(investment.id);

    // Recarrega os dados
    await reloadInvestmentDataRespectingFilter();

    showSuccessToast("Sucesso!", "Investimento excluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao excluir investimento:", error);
    showErrorToast("Erro!", "Não foi possível excluir o investimento");
  }
}

// Função removida - estava duplicada

// ================ Filter Functions ================
async function filterInvestimentos(event) {
  event.preventDefault();
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");

    // Captura os valores dos filtros
    const descricaoInput = document.getElementById("filter-nome").value.trim();
    const valorInput = document.getElementById("filter-valor").value.trim();
    const dataInput = document.getElementById("filter-data").value.trim();
    const tipoInput = document.getElementById("filter-tipo").value.trim();

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    let query = window.supabase
      .from("investimentos")
      .select("*")
      .eq("usuario_id", user.id);

    // Filtro por descrição: busca parcial (case insensitive)
    if (descricaoInput) {
      query = query.ilike("descricao", `%${descricaoInput}%`);
    }

    // Filtro por valor investido: busca exata
    if (valorInput && !isNaN(parseFloat(valorInput))) {
      query = query.eq("valor_investido", parseFloat(valorInput));
    }

    // Filtro por data: busca exata
    if (dataInput) {
      console.log("🔍 Filtro de data aplicado:", dataInput);
      query = query.eq("data_aplicacao", dataInput);
    }

    // Filtro por tipo: busca parcial (case insensitive)
    if (tipoInput) {
      console.log("🔍 Filtro de tipo aplicado:", tipoInput);
      query = query.ilike("tipo", `%${tipoInput}%`);
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
    (rows || []).forEach((investimento) => {
      addInvestimentoToTable(investimento, investimento.id);
      totalFiltered += Number(investimento.valor_investido || 0);
    });

    // Atualiza o total filtrado
    const el = document.getElementById("filteredInvestimentosDisplay");
    if (el) el.textContent = formatInvestimentoValue(totalFiltered);

    // Mostra mensagem se nenhum resultado for encontrado
    if (!rows || rows.length === 0) {
      const table = document.getElementById("data-table");
      if (table) {
        table.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
              Nenhum investimento encontrado com os filtros aplicados.
            </td>
          </tr>
        `;
      }
    }

    // Ativa o estado de filtro para prevenir recarregamento automático
    isInvestimentoFilterActive = true;

    FilterModal.close();

    // Log para debug
    console.log("🔍 Filtro aplicado com sucesso!");
    console.log(
      `📋 Critérios: Descrição="${descricaoInput}", Valor="${valorInput}", Data="${dataInput}", Tipo="${tipoInput}"`
    );
    console.log(`� Resultados encontrados: ${rows ? rows.length : 0}`);
  } catch (err) {
    console.error("❌ Erro ao filtrar investimentos:", err);
    showErrorToast(
      "Erro nos filtros",
      "Não foi possível aplicar os filtros. Tente novamente."
    );
  }
}

function filterClear() {
  // Limpa os campos do formulário
  const d = document.getElementById("filter-nome");
  if (d) d.value = "";
  const v = document.getElementById("filter-valor");
  if (v) v.value = "";
  const dt = document.getElementById("filter-data");
  if (dt) dt.value = "";
  const t = document.getElementById("filter-tipo");
  if (t) t.value = "";

  // DESATIVA FILTRO ANTES DE LIMPAR para evitar conflitos
  isInvestimentoFilterActive = false;

  // LIMPEZA FORÇADA E AGRESSIVA DA TABELA
  const table = document.getElementById("data-table");
  if (table) {
    const tbody = table.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = "";
    } else {
      // Remove TODAS as linhas exceto a primeira (header)
      const allRows = Array.from(table.rows);
      for (let i = allRows.length - 1; i > 0; i--) {
        allRows[i].remove();
      }
    }
  }

  // Reseta totais
  totalInvestimento = 0;

  // Aguarda um momento antes de recarregar para garantir limpeza
  setTimeout(() => {
    loadInvestimentosFromSupabase();
  }, 50);

  // Reseta o display do total filtrado
  const el = document.getElementById("filteredInvestimentosDisplay");
  if (el) el.textContent = formatInvestimentoValue(0);
}

// ================ AI Insights ================
function openAIInsights() {
  const totalInvestido = investments.reduce((sum, i) => sum + i.amount, 0);
  const valorAtual = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const lucroTotal = valorAtual - totalInvestido;
  const rentabilidadeMedia =
    totalInvestido > 0 ? (lucroTotal / totalInvestido) * 100 : 0;

  // Análise por tipo
  const tiposInvestimento = {};
  investments.forEach((inv) => {
    if (!tiposInvestimento[inv.tipo]) {
      tiposInvestimento[inv.tipo] = { investido: 0, atual: 0, count: 0 };
    }
    tiposInvestimento[inv.tipo].investido += inv.amount;
    tiposInvestimento[inv.tipo].atual += inv.currentValue;
    tiposInvestimento[inv.tipo].count++;
  });

  const insights = `
        <div style="padding: 20px;">
            <h3>🤖 Análise da sua Carteira</h3>
            <div style="margin: 15px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
                <h4>📊 Resumo da Carteira</h4>
                <p>• Total investido: <strong>${formatCurrency(
                  totalInvestido
                )}</strong></p>
                <p>• Valor atual: <strong>${formatCurrency(
                  valorAtual
                )}</strong></p>
                <p>• Lucro/Prejuízo: <strong>${formatCurrency(
                  lucroTotal
                )}</strong></p>
                <p>• Rentabilidade: <strong>${rentabilidadeMedia.toFixed(
                  2
                )}%</strong></p>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background: #f0fff0; border-radius: 8px;">
                <h4>💡 Recomendações</h4>
                <p>• ${
                  lucroTotal >= 0
                    ? "Parabéns! Sua carteira está no positivo"
                    : "Revise seus investimentos em renda variável"
                }</p>
                <p>• Diversifique entre renda fixa e variável</p>
                <p>• Mantenha aportes regulares</p>
                <p>• Revise periodicamente sua carteira</p>
            </div>
        </div>
    `;

  // Simula um modal de insights (simplificado)
  alert(insights.replace(/<[^>]*>/g, "").replace(/•/g, "- "));
}

// ================ Utility Functions ================
function formatCurrency(value) {
  const numericValue = Number(value || 0);
  if (window.formatCurrencyBRL) {
    return window.formatCurrencyBRL(numericValue);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
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
function highlightInvestButtons(inputElement, tipo) {
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

function setTipoInvest(tipo) {
  const input = document.getElementById("tipo");
  if (!input) return;
  input.value = tipo;
  highlightInvestButtons(input, tipo);
}

function setEditTipoInvest(tipo) {
  const input = document.getElementById("edit-tipo");
  if (!input) return;
  input.value = tipo;
  highlightInvestButtons(input, tipo);
}

// ================ Exposição de Funções Globais ================

// Expor funções para serem acessíveis globalmente
window.saveInvestment = saveInvestment;
window.updateInvestmentInSupabase = updateInvestmentInSupabase;
window.removeInvestmentFromSupabase = removeInvestmentFromSupabase;
window.deleteInvestmentTransaction = deleteInvestmentTransaction;
window.editInvestmentTransaction = editInvestmentTransaction;
window.editInvestment = editInvestment;
window.setTipoInvest = setTipoInvest;
window.setEditTipoInvest = setEditTipoInvest;
window.closeEditModal = closeEditModal;
window.filterInvestimentos = filterInvestimentos;
window.Modal = Modal;
window.FilterModal = FilterModal;

// Update user info
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
  if (window.updateUserInfo) {
    window.updateUserInfo();

    // Força refresh adicional após 2 segundos
    setTimeout(() => {
      if (window.updateUserInfo) {
        window.updateUserInfo();
      }
    }, 2000);
  } else {
    setTimeout(waitForUpdateUserInfo, 100);
  }
})();
