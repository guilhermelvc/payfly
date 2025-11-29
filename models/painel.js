// Painel model using Supabase
let totalReceita = 0;
let totalDespesaPainel = 0;
let totalPlano = 0;
let dataItems = [];
let ordemCrescente = true; // Controla a ordem de ordenação

function formatPainelValue(value) {
  const numericValue = Number(value || 0);
  if (window.formatCurrencyBRL) {
    return window.formatCurrencyBRL(numericValue);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

// Função para atualizar os valores dos cards
function updateCardValues() {
  const elReceitas = document.getElementById("totalReceitas");
  if (elReceitas) elReceitas.textContent = formatPainelValue(totalReceita);
  const elDespesas = document.getElementById("totalDespesas");
  if (elDespesas)
    elDespesas.textContent = formatPainelValue(totalDespesaPainel);
  const elPlano = document.getElementById("totalPlanoDisplay");
  if (elPlano) elPlano.textContent = formatPainelValue(totalPlano);
  const saldoTotal = totalReceita - totalDespesaPainel;
  const elSaldo = document.getElementById("saldoTotal");
  if (elSaldo) elSaldo.textContent = formatPainelValue(saldoTotal);
}

// Função para formatar a data
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

// Função para calcular o status de uma receita, despesa ou plano
function calcularStatus(data) {
  const hoje = new Date();
  const dataObj = new Date(data);
  return hoje > dataObj ? "Concluído" : "A vencer";
}

// Função para carregar receitas, despesas e planos do Supabase
async function loadData() {
  try {
    if (!window.supabase) throw new Error("Supabase não inicializado");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;

    dataItems = [];

    // Receitas
    const { data: receitas, error: errR } = await window.supabase
      .from("receitas")
      .select("*")
      .eq("usuario_id", user.id);
    if (errR) throw errR;
    totalReceita = 0;
    (receitas || []).forEach((r) => {
      dataItems.push(r);
      totalReceita += Number(r.valor || 0);
    });

    // Despesas
    const { data: despesas, error: errD } = await window.supabase
      .from("despesas")
      .select("*")
      .eq("usuario_id", user.id);
    if (errD) throw errD;
    totalDespesaPainel = 0;
    (despesas || []).forEach((d) => {
      dataItems.push(d);
      totalDespesaPainel += Number(d.valor || 0);
    });

    // Planos
    const { data: planos, error: errP } = await window.supabase
      .from("planos")
      .select("*")
      .eq("usuario_id", user.id);
    if (errP) throw errP;
    totalPlano = 0;
    (planos || []).forEach((p) => {
      dataItems.push(p);
      totalPlano += Number(p.valor || 0);
    });

    updateCardValues();
    renderTable();
  } catch (err) {
    console.error("Erro carregando dados do painel:", err);
  }
}

// Função para adicionar uma linha na tabela de dados
function addRowToTable(item) {
  const table = document.getElementById("data-table-body");

  // Se não encontrar a tabela, sai da função
  if (!table) {
    return;
  }

  const newRow = table.insertRow();

  const descricaoCell = newRow.insertCell(0);
  descricaoCell.textContent = item.descricao;

  const valorCell = newRow.insertCell(1);
  valorCell.textContent = formatPainelValue(item.valor);

  const dataCell = newRow.insertCell(2);
  dataCell.textContent = formatarData(item.data);

  const categoriaCell = newRow.insertCell(3);
  if (item.categoria && item.categoria !== "Outros") {
    categoriaCell.innerHTML = `<span class="category-badge">${item.categoria}</span>`;
  } else {
    categoriaCell.innerHTML = `<span class="category-badge">Outros</span>`;
  }

  const tipoCell = newRow.insertCell(4);
  const tipoTexto = item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1);
  tipoCell.innerHTML = `<span class="tipo-${item.tipo}">${tipoTexto}</span>`;

  const statusCell = newRow.insertCell(5);
  statusCell.textContent = calcularStatus(item.data);
}

// Função para renderizar a tabela com os dados
function renderTable() {
  const table = document.getElementById("data-table-body");

  // Se não encontrar a tabela, pode ser que esteja no painel principal
  if (!table) {
    return; // Sai da função se não encontrar a tabela
  }

  table.innerHTML = ""; // Limpa a tabela antes de adicionar os dados
  dataItems.forEach((item) => addRowToTable(item));
}

// Função para ordenar os dados por data
function ordenarPorData() {
  dataItems.sort((a, b) => {
    const dateA = new Date(a.data);
    const dateB = new Date(b.data);
    return ordemCrescente ? dateA - dateB : dateB - dateA;
  });
  ordemCrescente = !ordemCrescente; // Alterna a ordem de ordenação
  renderTable(); // Renderiza a tabela com os dados ordenados
}

// Função para obter a cor de fundo com base no tipo
function obterCorFundo(tipo) {
  switch (tipo) {
    case "receita":
      return "#28a745"; // Verde forte
    case "despesa":
      return "#dc3545"; // Vermelho forte
    case "plano":
      return "#007bff"; // Azul forte
    default:
      return "#ffffff"; // Branco padrão
  }
}

// Inicializa o carregamento dos dados ao carregar a página
window.addEventListener("load", async () => {
  try {
    if (!window.supabase) {
      console.warn("Supabase não inicializado.");
      return;
    }
    const { data } = await window.supabase.auth.getUser();
    const user = data?.user || null;
    if (user) await loadData();
    else console.log("Usuário não autenticado.");
  } catch (err) {
    console.error("Erro no onload do painel:", err);
  }

  const btn = document.getElementById("btnOrdenarPorData");
  if (btn) btn.addEventListener("click", ordenarPorData);
});

// Update user info
// Chama a função centralizada do main.js
(function waitForUpdateUserInfo() {
  if (window.updateUserInfo) {
    console.debug("painel.js: Atualizando dados do usuário");
    window.updateUserInfo();

    // Refresh único e inteligente após carregamento completo
    if (!window.painelRefreshExecuted) {
      window.painelRefreshExecuted = true;
      setTimeout(() => {
        if (window.updateUserInfo && document.readyState === "complete") {
          console.debug("painel.js: Refresh final após carregamento completo");
          window.updateUserInfo();
        }
      }, 1500);
    }
  } else {
    console.debug("painel.js: Aguardando função updateUserInfo...");
    setTimeout(waitForUpdateUserInfo, 150);
  }
})();
