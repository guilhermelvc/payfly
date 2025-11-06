// Investimentos model adapted for Supabase (Postgres)
// Expects window.supabase to be initialized in `controllers/supabase-init.env`

let totalInvestimento = 0;
let editingInvestimentoId = null;

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
    console.warn("❌ Erro ao formatar data:", date, e);
    return date;
  }
}

function updateInvestimentoDisplay() {
  const el = document.getElementById("totalInvestimentosDisplay");
  if (el) el.textContent = `R$ ${totalInvestimento.toFixed(2)}`;
}

// Variável global para controlar estado do filtro
let isInvestimentoFilterActive = false;

// Load investimentos for current user
async function loadInvestimentosFromSupabase() {
  try {
    // Se há um filtro ativo, não recarrega os dados para não sobrescrever os resultados filtrados
    if (isInvestimentoFilterActive) {
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
        console.log("🧹 Tbody limpo completamente");
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

    // Se não há filtro ativo, mostra o total também no card filtrado
    if (!isInvestimentoFilterActive) {
      const elFiltrado = document.getElementById(
        "filteredInvestimentosDisplay"
      );
      if (elFiltrado)
        elFiltrado.textContent = `R$ ${totalInvestimento.toFixed(2)}`;
    }

    console.log(`✅ ${data?.length || 0} investimentos carregados`);
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
    console.log(
      `⚠️ Linha row-${investimentoId} já existe, removendo duplicata`
    );
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

  row.innerHTML = `
    <td>${investimento.descricao}</td>
    <td>${investimento.tipo}</td>
    <td>R$ ${valorInvestido.toFixed(2)}</td>
    <td>R$ ${valorAtual.toFixed(2)}</td>
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
      <button onclick="removeInvestimentoFromSupabase('${investimentoId}', ${valorInvestido})" 
              class="delete-button" title="Excluir">
        <ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>
      </button>
    </td>
  `;

  tbody.appendChild(row);
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
}

function submitEditForm(event) {
  event.preventDefault();
  console.log("🚀 submitEditForm chamado!");
  console.log("🔍 editingInvestimentoId:", editingInvestimentoId);

  const descricao = document.getElementById("edit-nome").value;
  const valorInvestido = parseFloat(
    document.getElementById("edit-valor-investido").value
  );
  const valorAtual = parseFloat(
    document.getElementById("edit-valor-atual").value
  );
  const data = document.getElementById("edit-date").value;
  const tipo = document.getElementById("edit-tipo").value;

  console.log("📋 Dados do formulário de edição:", {
    descricao,
    valorInvestido,
    valorAtual,
    data,
    tipo,
  });

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

  const updatedInvestimento = {
    descricao: descricao.trim(),
    valor_investido: valorInvestido,
    valor_atual: valorAtual,
    data_aplicacao: data,
    tipo: tipo.trim(),
    rentabilidade: rentabilidade,
    categoria: "Investimentos",
  };

  console.log("💾 Dados preparados para atualizar:", updatedInvestimento);
  console.log("🆔 ID do investimento:", editingInvestimentoId);

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
    console.log("🚀 Iniciando saveInvestimento com parâmetros:", {
      descricao,
      valorInvestido,
      valorAtual,
      dataAplicacao,
      tipo,
    });

    if (!window.supabase) throw new Error("Supabase não inicializado");

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) throw new Error("Usuário não autenticado");

    console.log("✅ Usuário autenticado:", user.id);

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

    // Se valor atual não for fornecido, usa o valor investido
    const valorAtualFinal =
      valorAtual && valorAtual > 0 ? valorAtual : valorInvestido;

    // Calcula rentabilidade
    const rentabilidade =
      valorInvestido > 0
        ? ((valorAtualFinal - valorInvestido) / valorInvestido) * 100
        : 0;

    const investimentoData = {
      descricao: descricao.trim(),
      valor_investido: parseFloat(valorInvestido),
      valor_atual: parseFloat(valorAtualFinal),
      data_aplicacao: dataAplicacao,
      tipo: tipo.trim(),
      rentabilidade: rentabilidade,
      categoria: "Investimentos",
      usuario_id: user.id,
    };

    console.log("📊 Dados preparados para salvar:", investimentoData);

    const { data, error } = await window.supabase
      .from("investimentos")
      .insert([investimentoData])
      .select();

    if (error) {
      console.error("❌ Erro do Supabase:", error);
      throw error;
    }

    console.log("✅ Investimento salvo no Supabase:", data);

    // Adiciona na tabela
    if (data && data[0]) {
      console.log("📋 Adicionando à tabela:", data[0]);
      addInvestimentoToTable(data[0], data[0].id);
      totalInvestimento += parseFloat(valorInvestido);
      updateInvestimentoDisplay();
    }

    showSuccessToast("Sucesso!", "Investimento adicionado com sucesso!");
    Modal.close();
    console.log("✅ Processo de salvamento concluído");
  } catch (err) {
    console.error("❌ Erro ao salvar investimento:", err);
    console.error("❌ Stack trace:", err.stack);

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

async function loadInvestmentsFromSupabase() {
  try {
    if (isInvestmentFilterActive) {
      console.log("⏸️ Carregamento bloqueado - filtro ativo");
      return;
    }

    console.log("📊 Carregando todos os investimentos (sem filtro)");

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

    console.log("📊 Dados recebidos do Supabase:", data);
    console.log("📊 Total de investimentos encontrados:", data?.length || 0);

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
        console.log("🔍 Convertendo item:", item);
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

    console.log("📊 Investments array final:", investments);

    totalInvestments = investments.reduce((sum, item) => sum + item.amount, 0);
    filteredInvestments = [...investments]; // Inicializa filteredInvestments com todos os investimentos
    updateTable();
    updateInvestmentDisplay();

    console.log("📊 Todos os investimentos carregados");
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
  console.log("✅ Dados de investimentos carregados:", investments);
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
    console.log("🔍 Validando dados do investimento:", {
      descricao,
      valorInvestido,
      valorAtual,
      dataAplicacao,
      tipo,
    });

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

    console.log("📤 Dados sendo enviados para o Supabase:", investmentData);

    console.log("🚀 Inserindo no Supabase...");
    const { data: insertResult, error } = await window.supabase
      .from("investimentos")
      .insert([investmentData])
      .select();

    if (error) {
      console.error("❌ Erro do Supabase:", error);
      throw new Error(`Erro do banco de dados: ${error.message}`);
    }

    console.log("✅ Investimento inserido com sucesso:", insertResult);

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
    console.log("🔄 Atualizando investimento no Supabase...");
    console.log("🔍 ID:", investmentId);
    console.log("🔍 Dados:", updatedData);

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
      console.log("📊 Rentabilidade calculada:", updatedData.rentabilidade);
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

    console.log("✅ Investimento atualizado no Supabase com sucesso");
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
  console.log("🚀 Inicializando página de investimentos...");

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

  console.log("✅ Investimentos inicializados");
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
    <td><button onclick="deleteInvestmentTransaction('${
      item.id
    }')" class="delete-button" title="Excluir"><ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon></button></td>
  `;

  tbody.appendChild(row);
}

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

  console.log(
    `📈 Totais atualizados: Investido: ${formatCurrency(
      totalInvestido
    )} | Atual: ${formatCurrency(valorAtual)} | Lucro: ${formatCurrency(lucro)}`
  );
}

function updateInvestmentDisplay() {
  updateTotalDisplay();
}

// ================ Funções CRUD para UI ================

async function deleteInvestmentTransaction(investmentId) {
  console.log(`🗑️ Excluindo investimento ${investmentId}`);

  await removeInvestmentFromSupabase(investmentId);
}

async function editInvestmentTransaction(investmentId) {
  console.log(`✏️ Editando investimento ${investmentId}`);

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

  console.log(
    `📋 Tabela atualizada com ${filteredInvestments.length} investimentos`
  );
}

// ================ Modal Management ================
// Modal já declarado acima

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
    console.log("💾 Salvando novo investimento...");

    const formData = new FormData(event.target);
    const descricao = formData.get("nome"); // Campo correto do HTML
    const valorInvestido = formData.get("valor_investido"); // Campo correto do HTML
    const valorAtual = formData.get("valor_atual") || valorInvestido;
    const data = formData.get("data");
    const tipo = formData.get("tipo");

    // Debug dos dados do formulário
    console.log("📋 Dados do formulário:", {
      descricao,
      valorInvestido,
      valorAtual,
      data,
      tipo,
    });

    // Salva no Supabase se disponível, senão salva localmente
    if (window.supabase) {
      await saveInvestimento(descricao, valorInvestido, valorAtual, data, tipo);
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
      console.log("✅ Investimento adicionado localmente");
    }
  },
};

// Exporta o Form para o escopo global
window.Form = Form;

// ================ CRUD Operations ================
function editInvestment(index) {
  console.log(`✏️ Editando investimento ${index}`);

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

  console.log(
    `🔍 Investment encontrado no índice filtrado ${index}, índice real ${realIndex}`
  );
  console.log("🔍 Dados do investimento:", investment);
  console.log("🔍 Tipo de investimento (ID):", investment.id);

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
  console.log(`🗑️ Excluindo investimento ${index}`);

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
    console.log("✅ Investimento excluído");
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
    if (el) el.textContent = `R$ ${totalFiltered.toFixed(2)}`;

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
  console.log("🧹 INICIANDO LIMPEZA DE FILTROS");

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
  totalInvestimento = 0;

  // Aguarda um momento antes de recarregar para garantir limpeza
  setTimeout(() => {
    loadInvestimentosFromSupabase();
  }, 50);

  // Reseta o display do total filtrado
  const el = document.getElementById("filteredInvestimentosDisplay");
  if (el) el.textContent = `R$ 0,00`;

  console.log("🔄 Filtros limpos - tabela completamente resetada");
}

// ================ AI Insights ================
function openAIInsights() {
  console.log("🤖 Abrindo AI Insights para investimentos...");

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
function setTipoInvest(tipo) {
  document.getElementById("tipo").value = tipo;
}

function setEditTipoInvest(tipo) {
  document.getElementById("edit-tipo").value = tipo;
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
    console.log("investimentos.js: Chamando window.updateUserInfo()");
    window.updateUserInfo();

    // Força refresh adicional após 2 segundos
    setTimeout(() => {
      console.log("investimentos.js: Refresh adicional após 2 segundos");
      if (window.updateUserInfo) {
        window.updateUserInfo();
      }
    }, 2000);
  } else {
    console.log(
      "investimentos.js: window.updateUserInfo não disponível, tentando novamente..."
    );
    setTimeout(waitForUpdateUserInfo, 100);
  }
})();

console.log("✅ Investimentos.js carregado completamente");
