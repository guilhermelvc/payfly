// ================ Dashboard Controller ================

// Variáveis globais do dashboard
let dashboardData = {
  despesas: [],
  receitas: [],
  planos: [],
  poupanca: [],
  investimentos: [],
  currentPeriod: "week",
};

let categoryChart = null;
let timelineChart = null;

function formatDashboardValue(value) {
  const numericValue = Number(value || 0);
  if (window.formatCurrencyBRL) {
    return window.formatCurrencyBRL(numericValue);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

function parseDashboardValue(text) {
  if (typeof text !== "string") return 0;
  const sanitized = text
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(/,/g, ".");
  const parsed = parseFloat(sanitized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ================ Carregamento de Dados ================

async function loadDashboardData() {
  try {
    showDashboardLoading(true);

    if (!window.supabase) throw new Error("Supabase não inicializado");

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.warn("⚠️ Usuário não autenticado");
      return;
    }

    // Carrega todos os dados em paralelo
    const [
      despesasResult,
      receitasResult,
      planosResult,
      poupancaResult,
      investimentosResult,
    ] = await Promise.all([
      window.supabase.from("despesas").select("*").eq("usuario_id", user.id),
      window.supabase.from("receitas").select("*").eq("usuario_id", user.id),
      window.supabase.from("planos").select("*").eq("usuario_id", user.id),
      window.supabase.from("poupanca").select("*").eq("usuario_id", user.id),
      window.supabase
        .from("investimentos")
        .select("*")
        .eq("usuario_id", user.id),
    ]);

    // Verifica erros
    if (despesasResult.error) throw despesasResult.error;
    if (receitasResult.error) throw receitasResult.error;
    if (planosResult.error) throw planosResult.error;
    if (poupancaResult.error) throw poupancaResult.error;
    if (investimentosResult.error) throw investimentosResult.error;

    // Armazena dados
    dashboardData.despesas = despesasResult.data || [];
    dashboardData.receitas = receitasResult.data || [];
    dashboardData.planos = planosResult.data || [];
    dashboardData.poupanca = poupancaResult.data || [];
    dashboardData.investimentos = investimentosResult.data || [];

    // Dados carregados com sucesso; logs de debug removidos

    // Atualiza dashboard
    updateDashboard();
  } catch (error) {
    console.error("❌ Erro ao carregar dados do dashboard:", error);
    alert("Erro ao carregar dados do dashboard. Verifique sua conexão.");
  } finally {
    showDashboardLoading(false);
  }
}

// ================ Processamento de Dados ================

function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate;

  switch (period) {
    case "week":
      // Semana atual completa (segunda a domingo)
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Se domingo, volta 6 dias
      startOfWeek.setDate(today.getDate() + daysToMonday);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo
      endOfWeek.setHours(23, 59, 59, 999);

      startDate = startOfWeek;
      endDate = endOfWeek;
      break;
    case "month":
      // Mês atual completo (do dia 1 até o último dia do mês)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    case "6months":
      // Últimos 6 meses completos
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    case "futuros":
      // Apenas transações futuras (a partir do próximo mês)
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endDate = new Date(2099, 11, 31, 23, 59, 59, 999); // Data muito futura
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate };
}

function filterDataByPeriod(data, period) {
  const { startDate, endDate } = getDateRange(period);

  const filtered = data.filter((item) => {
    const itemDate = new Date(item.data || item.criado_em);
    return itemDate >= startDate && itemDate <= endDate;
  });
  return filtered;
}

function processExpensesByCategory(period) {
  const filteredDespesas = filterDataByPeriod(dashboardData.despesas, period);

  const categoryTotals = {};

  // Processa apenas despesas (sem planos, poupança ou investimentos)
  filteredDespesas.forEach((despesa) => {
    const categoria = despesa.categoria || "Outros";
    const valor = parseFloat(despesa.valor) || 0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  return categoryTotals;
}

function processAllDataByCategory(period) {
  // Se é filtro de futuros, usar função específica
  if (period === "futuros") {
    return processFutureDataOnly();
  }

  const filteredDespesas = filterDataByPeriod(dashboardData.despesas, period);
  const filteredReceitas = filterDataByPeriod(dashboardData.receitas, period);
  const filteredPlanos = filterDataByPeriod(dashboardData.planos, period);

  const now = new Date();
  const categoryData = {
    despesas: {},
    receitas: {},
    planos: {},
    despesasFuturas: {},
    receitasFuturas: {},
  };

  // Processa despesas separando passadas e futuras (apenas para filtro semanal)
  filteredDespesas.forEach((despesa) => {
    const categoria = despesa.categoria || "Outros";
    const valor = parseFloat(despesa.valor) || 0;
    const dataItem = new Date(despesa.data);

    if (dataItem > now && period === "week") {
      // Despesa futura (apenas no filtro semanal)
      categoryData.despesasFuturas[categoria] =
        (categoryData.despesasFuturas[categoria] || 0) + valor;
    } else if (dataItem <= now) {
      // Despesa realizada
      categoryData.despesas[categoria] =
        (categoryData.despesas[categoria] || 0) + valor;
    }
  });

  // Processa receitas separando passadas e futuras (apenas para filtro semanal)
  filteredReceitas.forEach((receita) => {
    const categoria = receita.categoria || "Outros";
    const valor = parseFloat(receita.valor) || 0;
    const dataItem = new Date(receita.data);

    if (dataItem > now && period === "week") {
      // Receita futura (apenas no filtro semanal)
      categoryData.receitasFuturas[categoria] =
        (categoryData.receitasFuturas[categoria] || 0) + valor;
    } else if (dataItem <= now) {
      // Receita realizada
      categoryData.receitas[categoria] =
        (categoryData.receitas[categoria] || 0) + valor;
    }
  });

  // Processa planos (apenas no filtro semanal mostra planos)
  if (period === "week") {
    filteredPlanos.forEach((plano) => {
      const categoria = plano.categoria || "Planejamento";
      const valor = parseFloat(plano.valor) || 0;
      categoryData.planos[categoria] =
        (categoryData.planos[categoria] || 0) + valor;
    });
  }

  return categoryData;
}

// Função específica para processar apenas lançamentos futuros
function processFutureDataOnly() {
  const now = new Date();
  const categoryData = {
    despesas: {},
    receitas: {},
    planos: {},
    despesasFuturas: {},
    receitasFuturas: {},
  };

  // Todas as despesas futuras (qualquer data futura)
  dashboardData.despesas.forEach((despesa) => {
    const dataItem = new Date(despesa.data);
    if (dataItem > now) {
      const categoria = despesa.categoria || "Outros";
      const valor = parseFloat(despesa.valor) || 0;
      categoryData.despesasFuturas[categoria] =
        (categoryData.despesasFuturas[categoria] || 0) + valor;
    }
  });

  // Todas as receitas futuras (qualquer data futura)
  dashboardData.receitas.forEach((receita) => {
    const dataItem = new Date(receita.data);
    if (dataItem > now) {
      const categoria = receita.categoria || "Outros";
      const valor = parseFloat(receita.valor) || 0;
      categoryData.receitasFuturas[categoria] =
        (categoryData.receitasFuturas[categoria] || 0) + valor;
    }
  });

  // Todos os planos (sempre são planejamentos futuros)
  dashboardData.planos.forEach((plano) => {
    const categoria = plano.categoria || "Planejamento";
    const valor = parseFloat(plano.valor) || 0;
    categoryData.planos[categoria] =
      (categoryData.planos[categoria] || 0) + valor;
  });

  return categoryData;
}

function processTimelineData(period) {
  const { startDate, endDate } = getDateRange(period);
  const filteredDespesas = filterDataByPeriod(dashboardData.despesas, period);
  const filteredReceitas = filterDataByPeriod(dashboardData.receitas, period);
  const filteredPlanos = filterDataByPeriod(dashboardData.planos, period);
  const filteredPoupanca = filterDataByPeriod(dashboardData.poupanca, period);
  const filteredInvestimentos = filterDataByPeriod(
    dashboardData.investimentos,
    period
  );

  // Agrupa por data
  const timelineData = {};
  const now = new Date();

  // Processa despesas
  filteredDespesas.forEach((despesa) => {
    const dateObj = new Date(despesa.data || despesa.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const isLancamentoFuturo = new Date(despesa.data) > now;

    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        poupanca: 0,
        investimentos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }

    if (isLancamentoFuturo) {
      timelineData[date].despesasFuturas += parseFloat(despesa.valor) || 0;
    } else {
      timelineData[date].despesas += parseFloat(despesa.valor) || 0;
    }
  });

  // Processa receitas
  filteredReceitas.forEach((receita) => {
    const dateObj = new Date(receita.data || receita.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const isLancamentoFuturo = new Date(receita.data) > now;

    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        poupanca: 0,
        investimentos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }

    if (isLancamentoFuturo) {
      timelineData[date].receitasFuturas += parseFloat(receita.valor) || 0;
    } else {
      timelineData[date].receitas += parseFloat(receita.valor) || 0;
    }
  });

  // Processa planos (sempre considerados como planejamento futuro)
  filteredPlanos.forEach((plano) => {
    const dateObj = new Date(plano.data || plano.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        poupanca: 0,
        investimentos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }
    timelineData[date].planos += parseFloat(plano.valor) || 0;
  });

  // Processa poupança
  filteredPoupanca.forEach((poup) => {
    const dateObj = new Date(poup.data || poup.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        poupanca: 0,
        investimentos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }
    timelineData[date].poupanca += parseFloat(poup.valor) || 0;
  });

  // Processa investimentos
  filteredInvestimentos.forEach((inv) => {
    const dateObj = new Date(inv.data || inv.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        poupanca: 0,
        investimentos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }
    timelineData[date].investimentos +=
      parseFloat(inv.valor_investido) || parseFloat(inv.valor) || 0;
  });

  return timelineData;
}

// Função específica para processar timeline apenas de lançamentos futuros
function processFutureTimelineData() {
  const timelineData = {};
  const now = new Date();

  // Processa apenas despesas futuras
  (dashboardData.despesas || []).forEach((despesa) => {
    const dataItem = new Date(despesa.data);
    if (dataItem > now) {
      const date = dataItem.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      if (!timelineData[date]) {
        timelineData[date] = {
          despesas: 0,
          receitas: 0,
          planos: 0,
          despesasFuturas: 0,
          receitasFuturas: 0,
        };
      }
      timelineData[date].despesasFuturas += parseFloat(despesa.valor) || 0;
    }
  });

  // Processa apenas receitas futuras
  (dashboardData.receitas || []).forEach((receita) => {
    const dataItem = new Date(receita.data);
    if (dataItem > now) {
      const date = dataItem.toISOString().split("T")[0]; // Formato YYYY-MM-DD
      if (!timelineData[date]) {
        timelineData[date] = {
          despesas: 0,
          receitas: 0,
          planos: 0,
          despesasFuturas: 0,
          receitasFuturas: 0,
        };
      }
      timelineData[date].receitasFuturas += parseFloat(receita.valor) || 0;
    }
  });

  // Processa todos os planos (sempre são planejamentos futuros)
  (dashboardData.planos || []).forEach((plano) => {
    const dateObj = new Date(plano.data || plano.criado_em);
    const date = dateObj.toISOString().split("T")[0]; // Formato YYYY-MM-DD
    if (!timelineData[date]) {
      timelineData[date] = {
        despesas: 0,
        receitas: 0,
        planos: 0,
        despesasFuturas: 0,
        receitasFuturas: 0,
      };
    }
    timelineData[date].planos += parseFloat(plano.valor) || 0;
  });

  return timelineData;
}

// ================ Atualização do Dashboard ================

// Função de atualização do dashboard removida (duplicata)

function updateSummaryCards(period) {
  let totalDespesas, totalReceitas, totalPlanos, saldoLiquido;

  if (period === "futuros") {
    // Filtro de lançamentos futuros - usa a mesma lógica dos gráficos para TODOS os tipos
    const despesasFuturas = filterDataByPeriod(
      dashboardData.despesas || [],
      period
    );
    const receitasFuturas = filterDataByPeriod(
      dashboardData.receitas || [],
      period
    );
    const planosFuturos = filterDataByPeriod(
      dashboardData.planos || [],
      period
    );

    totalDespesas = despesasFuturas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalReceitas = receitasFuturas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalPlanos = planosFuturos.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    saldoLiquido = totalReceitas - totalDespesas;
  } else {
    // Filtros normais (semanal, mensal, 6 meses)
    const filteredDespesas = filterDataByPeriod(
      dashboardData.despesas || [],
      period
    );
    const filteredReceitas = filterDataByPeriod(
      dashboardData.receitas || [],
      period
    );
    const filteredPlanos = filterDataByPeriod(
      dashboardData.planos || [],
      period
    );

    // Calcular sempre com base nos dados filtrados
    totalDespesas = filteredDespesas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalReceitas = filteredReceitas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalPlanos = filteredPlanos.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    saldoLiquido = totalReceitas - totalDespesas;
  }

  // Atualiza elementos
  const incomeEl = document.getElementById("summary-income");
  const expenseEl = document.getElementById("summary-expense");
  const balanceEl = document.getElementById("summary-balance");
  const plansEl = document.getElementById("summary-plans");

  if (incomeEl) {
    incomeEl.textContent = formatDashboardValue(totalReceitas);
  } else {
    console.error("❌ Elemento summary-income não encontrado!");
  }

  if (expenseEl) {
    expenseEl.textContent = formatDashboardValue(totalDespesas);
  } else {
    console.error("❌ Elemento summary-expense não encontrado!");
  }

  if (balanceEl) {
    balanceEl.textContent = formatDashboardValue(saldoLiquido);
  } else {
    console.error("❌ Elemento summary-balance não encontrado!");
  }

  if (plansEl) {
    plansEl.textContent = formatDashboardValue(totalPlanos);
  } else {
    console.error("❌ Elemento summary-plans não encontrado!");
  }

  // Calcula totais de poupança e investimentos com filtro correto
  const filteredPoupanca = filterDataByPeriod(
    dashboardData.poupanca || [],
    period
  );
  const filteredInvestimentos = filterDataByPeriod(
    dashboardData.investimentos || [],
    period
  );

  const totalPoupanca = filteredPoupanca.reduce(
    (sum, item) => sum + (parseFloat(item.valor) || 0),
    0
  );
  const totalInvestimentos = filteredInvestimentos.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.valor_investido) ||
        parseFloat(item.valor_atual) ||
        parseFloat(item.valor) ||
        0),
    0
  );

  // Atualiza elementos de poupança e investimentos
  const savingsEl = document.getElementById("summary-savings");
  const investmentsEl = document.getElementById("summary-investments");

  if (savingsEl) {
    savingsEl.textContent = formatDashboardValue(totalPoupanca);
  } else {
    console.error("❌ Elemento summary-savings não encontrado!");
  }

  if (investmentsEl) {
    investmentsEl.textContent = formatDashboardValue(totalInvestimentos);
  } else {
    console.error("❌ Elemento summary-investments não encontrado!");
  }

  // Atualiza períodos
  const periodText = getPeriodText(period);
  const incomePeriodEl = document.getElementById("summary-income-period");
  const expensePeriodEl = document.getElementById("summary-expense-period");
  const balancePeriodEl = document.getElementById("summary-balance-period");
  const plansPeriodEl = document.getElementById("summary-plans-period");
  const savingsPeriodEl = document.getElementById("summary-savings-period");
  const investmentsPeriodEl = document.getElementById(
    "summary-investments-period"
  );

  if (incomePeriodEl) incomePeriodEl.textContent = periodText;
  if (expensePeriodEl) expensePeriodEl.textContent = periodText;
  if (balancePeriodEl) balancePeriodEl.textContent = periodText;
  if (plansPeriodEl) plansPeriodEl.textContent = periodText;
  if (savingsPeriodEl) savingsPeriodEl.textContent = periodText;
  if (investmentsPeriodEl) investmentsPeriodEl.textContent = periodText;
}

function getPeriodText(period) {
  switch (period) {
    case "week":
      return "Esta semana";
    case "month":
      return "Este mês";
    case "6months":
      return "Últimos 6 meses";
    case "futuros":
      return "Lançamentos futuros";
    default:
      return "Esta semana";
  }
}

// ================ Gráficos ================

function updateTimelineChart(period) {
  // Verifica se Chart.js está disponível
  if (typeof Chart === "undefined") {
    console.warn("⚠️ Chart.js não disponível - pulando gráfico temporal");
    const canvas = document.getElementById("timelineChart");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.font = "16px Arial";
      ctx.fillText("Gráfico indisponível", canvas.width / 2, canvas.height / 2);
      ctx.font = "12px Arial";
      ctx.fillText(
        "Chart.js não carregado",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
    return;
  }

  // Para o filtro "futuros", usar função específica
  const timelineData =
    period === "futuros"
      ? processFutureTimelineData()
      : processTimelineData(period);
  const dates = Object.keys(timelineData).sort();

  const despesasData = dates.map((date) => timelineData[date].despesas || 0);
  const receitasData = dates.map((date) => timelineData[date].receitas || 0);
  const planosData = dates.map((date) => timelineData[date].planos || 0);
  const poupancaData = dates.map((date) => timelineData[date].poupanca || 0);
  const investimentosData = dates.map(
    (date) => timelineData[date].investimentos || 0
  );
  const despesasFuturasData = dates.map(
    (date) => timelineData[date].despesasFuturas || 0
  );
  const receitasFuturasData = dates.map(
    (date) => timelineData[date].receitasFuturas || 0
  );

  const labels = dates.map((date) => {
    // Corrige problema de timezone para labels
    const [year, month, day] = date.split("-");
    const localDate = new Date(year, month - 1, day);
    return localDate.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  });

  const ctx = document.getElementById("timelineChart").getContext("2d");

  // Detecta tema para cores
  const isDarkTheme = !document.body.classList.contains("light-theme");
  const axisColor = isDarkTheme ? "#e0e0e0" : "#666";
  const gridColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  if (timelineChart) {
    timelineChart.destroy();
  }

  timelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        // === LINHAS CONTÍNUAS (3 primeiras na legenda) ===
        {
          label: "Receitas",
          data: receitasData,
          borderColor: "#28a745", // Verde
          backgroundColor: "rgba(40, 167, 69, 0.1)",
          tension: 0.4,
          fill: false,
          pointStyle: "circle",
        },
        {
          label: "Despesas",
          data: despesasData,
          borderColor: "#dc3545", // Vermelho
          backgroundColor: "rgba(220, 53, 69, 0.1)",
          tension: 0.4,
          fill: false,
          pointStyle: "circle",
        },
        {
          label: "Investimentos",
          data: investimentosData,
          borderColor: "#6f42c1", // Roxo
          backgroundColor: "rgba(111, 66, 193, 0.1)",
          tension: 0.4,
          fill: false,
          pointStyle: "circle",
        },
        // === LINHAS PONTILHADAS (3 últimas na legenda) ===
        {
          label: "Despesas Futuras",
          data: despesasFuturasData,
          borderColor: "#FF6B35", // Laranja
          backgroundColor: "rgba(255, 107, 53, 0.1)",
          tension: 0.4,
          fill: false,
          borderDash: [8, 4], // Linha pontilhada
          pointStyle: "triangle",
        },
        {
          label: "Receitas Futuras",
          data: receitasFuturasData,
          borderColor: "#20c997", // Verde água
          backgroundColor: "rgba(32, 201, 151, 0.1)",
          tension: 0.4,
          fill: false,
          borderDash: [8, 4], // Linha pontilhada
          pointStyle: "triangle",
        },
        {
          label: "Poupança",
          data: poupancaData,
          borderColor: "#007bff", // Azul
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          tension: 0.4,
          fill: false,
          borderDash: [8, 4], // Linha pontilhada
          pointStyle: "triangle",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      },
      plugins: {
        legend: {
          display: false, // Vamos criar legenda customizada
        },
        // Plugin customizado para legenda em duas linhas
        htmlLegend: {
          containerID: "timelineChartLegend",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: axisColor,
            callback: (value) => formatDashboardValue(value),
          },
          grid: {
            color: gridColor,
          },
        },
        x: {
          ticks: {
            color: axisColor,
          },
          grid: {
            color: gridColor,
          },
        },
      },
    },
  });

  // Cria legenda customizada em duas linhas
  createCustomLegend();
}

function createCustomLegend() {
  const legendContainer = document.getElementById("timelineChartLegend");
  if (!legendContainer || !timelineChart) return;

  const datasets = timelineChart.data.datasets;

  // Detecta se está no tema escuro
  const isDarkTheme = !document.body.classList.contains("light-theme");
  const textColor = isDarkTheme ? "#ffffff" : "#333";

  // Divide datasets em contínuas (0-2) e pontilhadas (3-5)
  const continuousDatasets = datasets.slice(0, 3);
  const dashedDatasets = datasets.slice(3, 6);

  legendContainer.innerHTML = `
    <div class="timeline-legend-container" style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 0; padding: 8px 5px; background: transparent; width: 100%;">
      <!-- Linha 1: Linhas Contínuas -->
      <div class="timeline-legend-row" style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        ${continuousDatasets
          .map(
            (dataset, index) => `
          <div onclick="toggleDataset(${index})" class="timeline-legend-item" style="display: flex; align-items: center; cursor: pointer; font-size: 10px; font-weight: 500; padding: 1px 3px;">
            <div style="width: 16px; height: 2px; background-color: ${dataset.borderColor}; margin-right: 5px; border-radius: 1px;"></div>
            <span class="timeline-legend-label" style="white-space: nowrap; color: ${textColor};">${dataset.label}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <!-- Linha 2: Linhas Pontilhadas -->
      <div class="timeline-legend-row" style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        ${dashedDatasets
          .map((dataset, index) => {
            const actualIndex = index + 3;
            return `
          <div onclick="toggleDataset(${actualIndex})" class="timeline-legend-item" style="display: flex; align-items: center; cursor: pointer; font-size: 10px; font-weight: 500; padding: 1px 3px;">
            <div style="width: 16px; height: 2px; background: linear-gradient(to right, ${dataset.borderColor} 60%, transparent 60%); background-size: 5px 2px; margin-right: 5px; border-radius: 1px;"></div>
            <span class="timeline-legend-label" style="white-space: nowrap; color: ${textColor};">${dataset.label}</span>
          </div>
        `;
          })
          .join("")}
      </div>
    </div>
  `;
}

// Função para toggle de datasets
function toggleDataset(index) {
  if (!timelineChart) return;

  const meta = timelineChart.getDatasetMeta(index);
  meta.hidden =
    meta.hidden === null ? !timelineChart.data.datasets[index].hidden : null;
  timelineChart.update();
}

function applyChartThemeStyles() {
  const isDarkTheme = !document.body.classList.contains("light-theme");

  if (categoryChart) {
    const legendColor = isDarkTheme ? "#ffffff" : "#333";
    const borderColor = isDarkTheme ? "#2a2a2a" : "#ffffff";

    const legendOptions = categoryChart.options?.plugins?.legend?.labels || {};
    legendOptions.color = legendColor;
    if (categoryChart.data?.datasets?.[0]) {
      categoryChart.data.datasets[0].borderColor = borderColor;
    }

    categoryChart.update();
  }

  if (timelineChart) {
    const axisColor = isDarkTheme ? "#e0e0e0" : "#666";
    const gridColor = isDarkTheme
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.05)";

    if (timelineChart.options?.scales) {
      if (timelineChart.options.scales.x) {
        timelineChart.options.scales.x.ticks.color = axisColor;
        timelineChart.options.scales.x.grid.color = gridColor;
      }
      if (timelineChart.options.scales.y) {
        timelineChart.options.scales.y.ticks.color = axisColor;
        timelineChart.options.scales.y.grid.color = gridColor;
      }
    }

    timelineChart.update();
    createCustomLegend();
  }

  const chartTitle = document.getElementById("chartTitle");
  if (chartTitle) {
    chartTitle.style.color = isDarkTheme ? "#ffffff" : "#333333";
  }

  const chartInfo = document.querySelector(".chart-selector-info");
  if (chartInfo) {
    chartInfo.style.color = isDarkTheme ? "#f1f3f5" : "#666666";
  }
}

// ================ Controles de UI ================

function showDashboardLoading(show) {
  const loading = document.getElementById("dashboard-loading");
  if (loading) {
    loading.style.display = show ? "flex" : "none";
  }
}

function changePeriod(period) {
  // Remove classe active de todos os botões
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Adiciona classe active ao botão clicado
  document.querySelector(`[data-period="${period}"]`).classList.add("active");

  // Atualiza período atual
  dashboardData.currentPeriod = period;

  // Atualiza dashboard
  updateDashboard();
}

// ================ Inicialização ================

function initializeDashboard() {
  // Verifica se os elementos existem
  const dashboardContainer = document.querySelector(".dashboard-container");
  if (!dashboardContainer) {
    console.error("❌ Container do dashboard não encontrado!");
    return;
  }

  // Verifica se as dependências estão carregadas
  if (typeof Chart === "undefined") {
    console.warn(
      "⚠️ Chart.js não carregado - dashboard funcionará sem gráficos"
    );
    if (typeof showWarningToast === "function") {
      showWarningToast(
        "Aviso",
        "Gráficos indisponíveis. Apenas dados em tabela."
      );
    }
    // Continua a inicialização sem gráficos
  } else {
  }

  // Event listeners para botões de período
  const periodBtns = document.querySelectorAll(".period-btn");

  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.period;
      changePeriod(period);
    });

    // Adiciona suporte a teclado (acessibilidade)
    btn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const period = btn.dataset.period;
        changePeriod(period);
      }
    });
  });

  // Event listener para botão de refresh manual (se existir)
  const refreshBtn = document.querySelector(".refresh-dashboard-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", refreshDashboard);
  }

  // Configura tooltips nos cards (se necessário)
  setupCardTooltips();

  // Carrega dados iniciais
  loadDashboardDataWithToast();

  if (typeof showInfoToast === "function") {
    showInfoToast("Dashboard", "Dashboard inicializado com sucesso!", 2000);
  }
}

// Configuração de tooltips para melhor UX
function setupCardTooltips() {
  const cards = document.querySelectorAll(".summary-card");
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.zIndex = "10";
    });

    card.addEventListener("mouseleave", () => {
      card.style.zIndex = "1";
    });
  });
}

// Performance: Debounce para funções custosas
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Versão debounced do refresh para evitar chamadas excessivas
const debouncedRefresh = debounce(refreshDashboard, 1000);

// Adiciona suporte a Service Worker para cache (futuro)
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    // Preparado para PWA no futuro
  }
}

// ================ Melhorias de UX ================

// Função para atualizar dados em tempo real
function refreshDashboard() {
  loadDashboardData();
}

// Auto-refresh a cada 5 minutos (opcional)
function setupAutoRefresh() {
  setInterval(() => {
    if (document.visibilityState === "visible") {
      loadDashboardData();
    }
  }, 5 * 60 * 1000); // 5 minutos
}

// Adiciona feedback visual aos cards
function animateCardUpdate(cardId, value) {
  const card = document.getElementById(cardId);
  if (card) {
    card.style.transform = "scale(1.05)";
    card.style.transition = "transform 0.2s ease";

    setTimeout(() => {
      card.style.transform = "scale(1)";
    }, 200);
  }
}

// Melhora a atualização dos cards com animação
function updateSummaryCardsAnimated(period) {
  const filteredDespesas = filterDataByPeriod(dashboardData.despesas, period);
  const filteredReceitas = filterDataByPeriod(dashboardData.receitas, period);

  const totalDespesas = filteredDespesas.reduce(
    (sum, item) => sum + (parseFloat(item.valor) || 0),
    0
  );
  const totalReceitas = filteredReceitas.reduce(
    (sum, item) => sum + (parseFloat(item.valor) || 0),
    0
  );
  const saldoLiquido = totalReceitas - totalDespesas;

  // Atualiza com animação
  const incomeEl = document.getElementById("summary-income");
  const expenseEl = document.getElementById("summary-expense");
  const balanceEl = document.getElementById("summary-balance");

  if (incomeEl) {
    animateValue(
      incomeEl,
      parseDashboardValue(incomeEl.textContent),
      totalReceitas
    );
    animateCardUpdate("summary-income");
  }

  if (expenseEl) {
    animateValue(
      expenseEl,
      parseDashboardValue(expenseEl.textContent),
      totalDespesas
    );
    animateCardUpdate("summary-expense");
  }

  if (balanceEl) {
    animateValue(
      balanceEl,
      parseDashboardValue(balanceEl.textContent),
      saldoLiquido
    );
    animateCardUpdate("summary-balance");
  }

  // Atualiza períodos
  const periodText = getPeriodText(period);
  document.getElementById("summary-income-period").textContent = periodText;
  document.getElementById("summary-expense-period").textContent = periodText;
  document.getElementById("summary-balance-period").textContent = periodText;
}

// Anima a mudança de valores nos cards
function animateValue(element, start, end) {
  const duration = 800;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const current = start + (end - start) * easeOutCubic(progress);
    element.textContent = formatDashboardValue(current);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

// Função de easing para animações suaves
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Adiciona loading states para gráficos
function showChartLoading(chartId, show) {
  const container = document.getElementById(chartId).parentElement;
  let loadingEl = container.querySelector(".chart-loading");

  if (show && !loadingEl) {
    loadingEl = document.createElement("div");
    loadingEl.className = "chart-loading";
    loadingEl.innerHTML = `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #666;
      ">
        <div class="loading-spinner" style="margin: 0 auto 10px auto;"></div>
        <span>Carregando gráfico...</span>
      </div>
    `;
    loadingEl.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    `;
    container.style.position = "relative";
    container.appendChild(loadingEl);
  } else if (!show && loadingEl) {
    loadingEl.remove();
  }
}

// Versão melhorada da atualização do dashboard
function updateDashboard() {
  const period = dashboardData.currentPeriod || "week";

  try {
    // Atualiza cards primeiro (mais rápido)
    updateSummaryCards(period);

    // Loading states para gráficos
    showChartLoading("categoryChart", true);
    showChartLoading("timelineChart", true);

    // Pequeno delay para melhor UX
    setTimeout(() => {
      updateCategoryChart(period);
      showChartLoading("categoryChart", false);
    }, 300);

    setTimeout(() => {
      updateTimelineChart(period);
      showChartLoading("timelineChart", false);
    }, 600);
  } catch (error) {
    console.error("❌ Erro ao atualizar dashboard:", error);
    // Toast removido para melhor UX
  }
}

// Melhoria na mudança de período com feedback visual
function changePeriod(period) {
  // Remove classe active de todos os botões
  document.querySelectorAll(".period-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Adiciona classe active ao botão clicado com animação
  const activeBtn = document.querySelector(`[data-period="${period}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");

    // Feedback tátil (vibração em dispositivos móveis)
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  }

  // Atualiza período atual
  dashboardData.currentPeriod = period;

  // Atualiza dashboard com loading
  showDashboardLoading(true);

  setTimeout(() => {
    updateDashboard();
    showDashboardLoading(false);
  }, 200);
}

// Detecta mudanças na visibilidade da página
document.addEventListener("visibilitychange", function () {
  if (
    document.visibilityState === "visible" &&
    dashboardData.despesas.length > 0
  ) {
    // Refresh suave quando a página volta ao foco
    setTimeout(refreshDashboard, 1000);
  }
});

// Detecta redimensionamento da janela para ajustar gráficos
let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (categoryChart) categoryChart.resize();
    if (timelineChart) timelineChart.resize();
  }, 250);
});

// Função para aguardar Chart.js carregar
function waitForChart(callback, maxAttempts = 20) {
  let attempts = 0;

  function checkChart() {
    attempts++;

    if (typeof Chart !== "undefined") {
      callback();
    } else if (attempts < maxAttempts) {
      setTimeout(checkChart, 500);
    } else {
      console.error("❌ Chart.js não carregou após", maxAttempts, "tentativas");
      callback(); // Tenta inicializar sem gráficos
    }
  }

  checkChart();
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  // Verifica se estamos na página do painel
  if (!document.querySelector(".dashboard-container")) {
    return;
  }

  // Aguarda Chart.js carregar antes de inicializar
  waitForChart(() => {
    try {
      initializeDashboard();
    } catch (error) {
      console.error("❌ Erro ao inicializar dashboard:", error);
    }
    setupAutoRefresh(); // Configura auto-refresh
  });
});

// ================ Sistema de Toast Notifications (Removido - usando sistema global) ================

// ================ Integração do Toast no Dashboard ================

// Modifica a função loadDashboardData para usar toast
async function loadDashboardDataWithToast() {
  try {
    showDashboardLoading(true);

    // Toast de carregamento removido para melhor UX

    if (!window.supabase) {
      console.error("❌ Supabase não encontrado!");
      throw new Error("Supabase não inicializado");
    }

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      console.warn("⚠️ Usuário não autenticado");
      // Toast removido para melhor UX
      // Não carrega dados demo - aguarda autenticação
      showDashboardLoading(false);
      return;
    }

    // Carrega todos os dados em paralelo
    const [
      despesasResult,
      receitasResult,
      planosResult,
      poupancaResult,
      investimentosResult,
    ] = await Promise.all([
      window.supabase.from("despesas").select("*").eq("usuario_id", user.id),
      window.supabase.from("receitas").select("*").eq("usuario_id", user.id),
      window.supabase.from("planos").select("*").eq("usuario_id", user.id),
      window.supabase.from("poupanca").select("*").eq("usuario_id", user.id),
      window.supabase
        .from("investimentos")
        .select("*")
        .eq("usuario_id", user.id),
    ]);

    // Verifica erros
    if (despesasResult.error) throw despesasResult.error;
    if (receitasResult.error) throw receitasResult.error;
    if (planosResult.error) throw planosResult.error;
    if (poupancaResult.error) throw poupancaResult.error;
    if (investimentosResult.error) throw investimentosResult.error;

    // Armazena dados
    dashboardData.despesas = despesasResult.data || [];
    dashboardData.receitas = receitasResult.data || [];
    dashboardData.planos = planosResult.data || [];
    dashboardData.poupanca = poupancaResult.data || [];
    dashboardData.investimentos = investimentosResult.data || [];

    const totalItems =
      dashboardData.despesas.length +
      dashboardData.receitas.length +
      dashboardData.planos.length +
      dashboardData.poupanca.length +
      dashboardData.investimentos.length;

    // Atualiza dashboard
    updateDashboard();

    // Separar dados futuros dos atuais
    const now = new Date();
    const despesasFuturas = dashboardData.despesas.filter(
      (d) => new Date(d.data) > now
    );
    const receitasFuturas = dashboardData.receitas.filter(
      (r) => new Date(r.data) > now
    );

    // Toast de sucesso removido para melhor UX
  } catch (error) {
    console.error("❌ Erro ao carregar dados do dashboard:", error);
    // Toast de erro removido para melhor UX
  } finally {
    showDashboardLoading(false);
  }
}

// ================ Sistema de Gráfico Interativo ================

// Função para processar dados de receitas por categoria
function processIncomeByCategory(period) {
  const filteredReceitas = filterDataByPeriod(dashboardData.receitas, period);

  const categoryTotals = {};

  filteredReceitas.forEach((receita) => {
    const categoria = receita.categoria || "Outros";
    const valor = parseFloat(receita.valor) || 0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  return categoryTotals;
}

// Função para processar dados de poupança por categoria
function processSavingsByCategory(period) {
  const filteredPoupanca = filterDataByPeriod(dashboardData.poupanca, period);

  const categoryTotals = {};

  filteredPoupanca.forEach((poupanca) => {
    // Agrupa pelo nome do plano de poupança
    const categoria = poupanca.nome || poupanca.descricao || "Poupança";
    const valor = parseFloat(poupanca.valor) || 0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  return categoryTotals;
}

// Função para processar dados de investimentos por categoria
function processInvestmentsByCategory(period) {
  const filteredInvestimentos = filterDataByPeriod(
    dashboardData.investimentos,
    period
  );

  const categoryTotals = {};

  filteredInvestimentos.forEach((investimento) => {
    // Agrupa pela descrição/nome do investimento
    const categoria =
      investimento.nome || investimento.descricao || "Investimentos";
    const valor =
      parseFloat(investimento.valor_investido) ||
      parseFloat(investimento.valor_atual) ||
      parseFloat(investimento.valor) ||
      0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  return categoryTotals;
}

// Função para processar dados de planos por categoria
function processPlansByCategory(period) {
  const filteredPlanos = filterDataByPeriod(dashboardData.planos, period);

  const categoryTotals = {};

  filteredPlanos.forEach((plano) => {
    const categoria = plano.categoria || "Planos";
    const valor = parseFloat(plano.valor) || 0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  return categoryTotals;
}

// Função principal para o sistema de gráfico interativo
function updateCategoryChart(chartContext) {
  // Compatibilidade: se receber apenas string (period), usar tipo 'expense' padrão
  if (typeof chartContext === "string") {
    const period = chartContext;
    chartContext = {
      type: "expense",
      period: period,
      config: { description: "Despesas por categoria" },
      colors: [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
      ],
    };
  }

  // Verifica se Chart.js está disponível
  if (typeof Chart === "undefined") {
    console.warn("⚠️ Chart.js não disponível - pulando gráfico interativo");
    return;
  }

  let categoryData = {};
  const { type, period, config, colors } = chartContext;

  // Seleciona função de processamento baseada no tipo
  switch (type) {
    case "income":
      categoryData = processIncomeByCategory(period);
      break;
    case "expense":
      categoryData = processExpensesByCategory(period);
      break;
    case "balance":
      categoryData = processAllDataByCategory(period).despesas;
      // Para saldo, combina todos os tipos com cores diferentes
      const allData = processAllDataByCategory(period);
      categoryData = {
        Despesas: Object.values(allData.despesas || {}).reduce(
          (a, b) => a + b,
          0
        ),
        Receitas: Object.values(processIncomeByCategory(period)).reduce(
          (a, b) => a + b,
          0
        ),
        Planos: Object.values(processPlansByCategory(period)).reduce(
          (a, b) => a + b,
          0
        ),
        Poupança: Object.values(processSavingsByCategory(period)).reduce(
          (a, b) => a + b,
          0
        ),
        Investimentos: Object.values(
          processInvestmentsByCategory(period)
        ).reduce((a, b) => a + b, 0),
      };
      break;
    case "plans":
      categoryData = processPlansByCategory(period);
      break;
    case "savings":
      categoryData = processSavingsByCategory(period);
      break;
    case "investments":
      categoryData = processInvestmentsByCategory(period);
      break;
    default:
      console.warn("⚠️ Tipo de gráfico desconhecido:", type);
      categoryData = processExpensesByCategory(period);
  }

  const categories = Object.keys(categoryData);
  const values = Object.values(categoryData);

  // Se não há dados, mostra mensagem
  if (categories.length === 0 || values.every((v) => v === 0)) {
    const canvas = document.getElementById("categoryChart");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#666";
      ctx.textAlign = "center";
      ctx.font = "16px Arial";
      ctx.fillText(
        "Sem dados para exibir",
        canvas.width / 2,
        canvas.height / 2
      );
      ctx.font = "12px Arial";
      ctx.fillText(
        `${config.description}`,
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }
    return;
  }

  const canvas = document.getElementById("categoryChart");
  if (!canvas) {
    console.error("❌ Canvas categoryChart não encontrado!");
    return;
  }

  const ctx = canvas.getContext("2d");

  // Detecta tema para cores das legendas
  const isDarkTheme = !document.body.classList.contains("light-theme");
  const legendTextColor = isDarkTheme ? "#ffffff" : "#333";

  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: isDarkTheme ? "#2a2a2a" : "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 12,
            },
            color: legendTextColor,
          },
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              const formattedValue = formatDashboardValue(value);
              return `${label}: ${formattedValue} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

// Exporta funções globalmente
window.loadDashboardData = loadDashboardDataWithToast;
window.changePeriod = changePeriod;
window.refreshDashboard = refreshDashboard;
window.updateCategoryChart = updateCategoryChart;
window.toggleDataset = toggleDataset;

document.addEventListener("themeChange", () => {
  setTimeout(applyChartThemeStyles, 50);
});
