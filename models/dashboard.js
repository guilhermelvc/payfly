// ================ Dashboard Controller ================
console.log("📊 Dashboard.js carregado");

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

// ================ Carregamento de Dados ================

// Função para carregar dados de demonstração
function loadDemoData() {
  console.log("🧪 Carregando dados de demonstração...");

  // Dados fictícios para demonstração
  const hoje = new Date();
  const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);

  dashboardData.despesas = [
    {
      id: 1,
      descricao: "Gasolina",
      valor: 150.0,
      categoria: "Transporte",
      data: hoje.toISOString().split("T")[0],
    },
    {
      id: 2,
      descricao: "Supermercado",
      valor: 280.5,
      categoria: "Alimentação",
      data: semanaPassada.toISOString().split("T")[0],
    },
    {
      id: 3,
      descricao: "Academia",
      valor: 80.0,
      categoria: "Saúde",
      data: hoje.toISOString().split("T")[0],
    },
    {
      id: 4,
      descricao: "Restaurante",
      valor: 45.0,
      categoria: "Alimentação",
      data: semanaPassada.toISOString().split("T")[0],
    },
  ];

  dashboardData.receitas = [
    {
      id: 1,
      descricao: "Salário",
      valor: 3500.0,
      categoria: "Trabalho",
      data: hoje.toISOString().split("T")[0],
    },
    {
      id: 2,
      descricao: "Freelance",
      valor: 800.0,
      categoria: "Extra",
      data: semanaPassada.toISOString().split("T")[0],
    },
  ];

  dashboardData.planos = [
    {
      id: 1,
      descricao: "Viagem para Europa",
      valor: 15000.0,
      categoria: "Viagem",
      data: new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // +1 ano
    },
    {
      id: 2,
      descricao: "Carro Novo",
      valor: 45000.0,
      categoria: "Veículo",
      data: new Date(hoje.getTime() + 730 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // +2 anos
    },
  ];

  dashboardData.poupanca = [
    {
      id: 1,
      nome: "Viagem para Europa",
      valor: 1200.0,
      tipo: "Meta de Viagem",
      data: hoje.toISOString().split("T")[0],
    },
    {
      id: 2,
      nome: "Reserva de Emergência",
      valor: 2500.0,
      tipo: "Emergência",
      data: semanaPassada.toISOString().split("T")[0],
    },
  ];

  dashboardData.investimentos = [
    {
      id: 1,
      nome: "Tesouro IPCA+",
      valor_investido: 5000.0,
      valor_atual: 5250.0,
      tipo: "Tesouro Direto",
      data: hoje.toISOString().split("T")[0],
    },
    {
      id: 2,
      nome: "CDB Banco XYZ",
      valor_investido: 3000.0,
      valor_atual: 3120.0,
      tipo: "CDB",
      data: semanaPassada.toISOString().split("T")[0],
    },
  ];

  console.log("🧪 Dados demo carregados:", {
    despesas: dashboardData.despesas.length,
    receitas: dashboardData.receitas.length,
    planos: dashboardData.planos.length,
    poupanca: dashboardData.poupanca.length,
    investimentos: dashboardData.investimentos.length,
  });

  // Atualiza dashboard
  updateDashboard();

  showDashboardLoading(false);
}

async function loadDashboardData() {
  try {
    showDashboardLoading(true);
    console.log("📊 Carregando dados do dashboard...");

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

    console.log("📊 Dados carregados:", {
      despesas: dashboardData.despesas.length,
      receitas: dashboardData.receitas.length,
      planos: dashboardData.planos.length,
      poupanca: dashboardData.poupanca.length,
      investimentos: dashboardData.investimentos.length,
    });

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
      // Semana atual incluindo futuro da semana (apenas esta semana)
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
      // Mês atual até hoje (sem futuro)
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "6months":
      // Últimos 6 meses até hoje (sem futuro)
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "futuros":
      // Apenas transações futuras (a partir de amanhã)
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
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

  return data.filter((item) => {
    const itemDate = new Date(item.data || item.criado_em);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

function processExpensesByCategory(period) {
  const filteredDespesas = filterDataByPeriod(dashboardData.despesas, period);
  const filteredPlanos = filterDataByPeriod(dashboardData.planos, period);
  const categoryTotals = {};

  // Processa despesas (incluindo futuras)
  filteredDespesas.forEach((despesa) => {
    const categoria = despesa.categoria || "Outros";
    const valor = parseFloat(despesa.valor) || 0;
    categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
  });

  // Processa planos (planejamentos futuros)
  filteredPlanos.forEach((plano) => {
    const categoria = plano.categoria || "Planos";
    const valor = parseFloat(plano.valor) || 0;
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
    const date = new Date(despesa.data || despesa.criado_em).toDateString();
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
    const date = new Date(receita.data || receita.criado_em).toDateString();
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
    const date = new Date(plano.data || plano.criado_em).toDateString();
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
    const date = new Date(poup.data || poup.criado_em).toDateString();
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
    const date = new Date(inv.data || inv.criado_em).toDateString();
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
      const date = dataItem.toDateString();
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
      const date = dataItem.toDateString();
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
    const date = new Date(plano.data || plano.criado_em).toDateString();
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
  console.log("💰 Atualizando cards de resumo para período:", period);

  let totalDespesas, totalReceitas, totalPlanos, saldoLiquido;
  const now = new Date();

  if (period === "futuros") {
    // Filtro de lançamentos futuros - apenas transações e planos futuros
    const despesasFuturas = (dashboardData.despesas || []).filter(
      (item) => new Date(item.data) > now
    );
    const receitasFuturas = (dashboardData.receitas || []).filter(
      (item) => new Date(item.data) > now
    );
    const todosPlanos = dashboardData.planos || [];

    totalDespesas = despesasFuturas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalReceitas = receitasFuturas.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalPlanos = todosPlanos.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    saldoLiquido = totalReceitas - totalDespesas;

    console.log("🔮 Lançamentos futuros calculados:", {
      despesasFuturas: despesasFuturas.length,
      receitasFuturas: receitasFuturas.length,
      planos: todosPlanos.length,
      totalDespesas,
      totalReceitas,
      totalPlanos,
    });
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

    // Para mensal e 6 meses: apenas realizados (não incluir futuro)
    let despesasParaCalcular, receitasParaCalcular;

    if (period === "month" || period === "6months") {
      despesasParaCalcular = filteredDespesas.filter(
        (item) => new Date(item.data) <= now
      );
      receitasParaCalcular = filteredReceitas.filter(
        (item) => new Date(item.data) <= now
      );
    } else {
      // Semanal inclui futuro da semana
      despesasParaCalcular = filteredDespesas;
      receitasParaCalcular = filteredReceitas;
    }

    totalDespesas = despesasParaCalcular.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalReceitas = receitasParaCalcular.reduce(
      (sum, item) => sum + (parseFloat(item.valor) || 0),
      0
    );
    totalPlanos =
      period === "week"
        ? filteredPlanos.reduce(
            (sum, item) => sum + (parseFloat(item.valor) || 0),
            0
          )
        : 0;
    saldoLiquido = totalReceitas - totalDespesas;
  }

  console.log("💰 Totais calculados:", {
    totalDespesas,
    totalReceitas,
    saldoLiquido,
    totalPlanos,
    period,
  });

  // Atualiza elementos
  const incomeEl = document.getElementById("summary-income");
  const expenseEl = document.getElementById("summary-expense");
  const balanceEl = document.getElementById("summary-balance");
  const plansEl = document.getElementById("summary-plans");

  if (incomeEl) {
    incomeEl.textContent = `R$ ${totalReceitas.toFixed(2)}`;
    console.log("💰 Receitas atualizadas:", totalReceitas);
  } else {
    console.error("❌ Elemento summary-income não encontrado!");
  }

  if (expenseEl) {
    expenseEl.textContent = `R$ ${totalDespesas.toFixed(2)}`;
    console.log("💰 Despesas atualizadas:", totalDespesas);
  } else {
    console.error("❌ Elemento summary-expense não encontrado!");
  }

  if (balanceEl) {
    balanceEl.textContent = `R$ ${saldoLiquido.toFixed(2)}`;
    console.log("💰 Saldo atualizado:", saldoLiquido);
  } else {
    console.error("❌ Elemento summary-balance não encontrado!");
  }

  if (plansEl) {
    plansEl.textContent = `R$ ${totalPlanos.toFixed(2)}`;
    console.log("📅 Planos atualizados:", totalPlanos);
  } else {
    console.error("❌ Elemento summary-plans não encontrado!");
  }

  // Calcula totais de poupança e investimentos
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
      sum + (parseFloat(item.valor_investido) || parseFloat(item.valor) || 0),
    0
  );

  // Atualiza elementos de poupança e investimentos
  const savingsEl = document.getElementById("summary-savings");
  const investmentsEl = document.getElementById("summary-investments");

  if (savingsEl) {
    savingsEl.textContent = `R$ ${totalPoupanca.toFixed(2)}`;
    console.log("💰 Poupança atualizada:", totalPoupanca);
  } else {
    console.error("❌ Elemento summary-savings não encontrado!");
  }

  if (investmentsEl) {
    investmentsEl.textContent = `R$ ${totalInvestimentos.toFixed(2)}`;
    console.log("📈 Investimentos atualizados:", totalInvestimentos);
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

function updateCategoryChart(period) {
  // Verifica se Chart.js está disponível
  if (typeof Chart === "undefined") {
    console.warn("⚠️ Chart.js não disponível - pulando gráfico de categorias");
    const canvas = document.getElementById("categoryChart");
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

  const categoryData = processExpensesByCategory(period);
  const categories = Object.keys(categoryData);
  const values = Object.values(categoryData);

  const canvas = document.getElementById("categoryChart");
  if (!canvas) {
    console.error("❌ Canvas categoryChart não encontrado!");
    return;
  }

  const ctx = canvas.getContext("2d");

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
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#FF6384",
            "#C9CBCF",
          ],
          borderWidth: 2,
          borderColor: "#fff",
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
          position: "bottom",
          align: "center",
          labels: {
            padding: 20,
            usePointStyle: true,
            textAlign: "center",
            boxWidth: 12,
            boxHeight: 12,
            font: {
              size: 12,
              weight: "500",
            },
          },
        },
      },
    },
  });
}

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

  const labels = dates.map((date) =>
    new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    })
  );

  const ctx = document.getElementById("timelineChart").getContext("2d");

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
            callback: function (value) {
              return "R$ " + value.toFixed(2);
            },
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

  // Divide datasets em contínuas (0-2) e pontilhadas (3-5)
  const continuousDatasets = datasets.slice(0, 3);
  const dashedDatasets = datasets.slice(3, 6);

  legendContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; margin: 0; padding: 8px 5px; background: transparent; width: 100%;">
      <!-- Linha 1: Linhas Contínuas -->
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        ${continuousDatasets
          .map(
            (dataset, index) => `
          <div onclick="toggleDataset(${index})" style="display: flex; align-items: center; cursor: pointer; font-size: 10px; font-weight: 500; padding: 1px 3px;">
            <div style="width: 16px; height: 2px; background-color: ${dataset.borderColor}; margin-right: 5px; border-radius: 1px;"></div>
            <span style="white-space: nowrap; color: #333;">${dataset.label}</span>
          </div>
        `
          )
          .join("")}
      </div>
      <!-- Linha 2: Linhas Pontilhadas -->
      <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; max-width: 100%;">
        ${dashedDatasets
          .map((dataset, index) => {
            const actualIndex = index + 3;
            return `
          <div onclick="toggleDataset(${actualIndex})" style="display: flex; align-items: center; cursor: pointer; font-size: 10px; font-weight: 500; padding: 1px 3px;">
            <div style="width: 16px; height: 2px; background: linear-gradient(to right, ${dataset.borderColor} 60%, transparent 60%); background-size: 5px 2px; margin-right: 5px; border-radius: 1px;"></div>
            <span style="white-space: nowrap; color: #333;">${dataset.label}</span>
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

function updateTopCategoriesTable(period) {
  const allCategoryData = processAllDataByCategory(period);

  // Combina todas as categorias (despesas + planos + receitas)
  const categoryData = {};

  // Adiciona despesas realizadas
  Object.entries(allCategoryData.despesas).forEach(([cat, val]) => {
    categoryData[cat] = (categoryData[cat] || 0) + val;
  });

  // Adiciona despesas futuras
  Object.entries(allCategoryData.despesasFuturas).forEach(([cat, val]) => {
    const catName = `${cat} (Futuro)`;
    categoryData[catName] = (categoryData[catName] || 0) + val;
  });

  // Adiciona planos
  Object.entries(allCategoryData.planos).forEach(([cat, val]) => {
    const catName = `${cat} (Planejado)`;
    categoryData[catName] = (categoryData[catName] || 0) + val;
  });
  const total = Object.values(categoryData).reduce((sum, val) => sum + val, 0);

  // Ordena por valor
  const sortedCategories = Object.entries(categoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  const tbody = document.getElementById("top-categories-body");
  tbody.innerHTML = "";

  sortedCategories.forEach(([categoria, valor]) => {
    const percentage = total > 0 ? ((valor / total) * 100).toFixed(1) : "0.0";

    // Conta transações baseando-se no tipo da categoria
    let transactions = 0;

    if (categoria.includes("(Futuro)")) {
      // Despesas futuras
      const baseCat = categoria.replace(" (Futuro)", "");
      const now = new Date();
      transactions = dashboardData.despesas.filter(
        (d) =>
          (d.categoria || "Outros") === baseCat &&
          new Date(d.data) > now &&
          filterDataByPeriod([d], period).length > 0
      ).length;
    } else if (categoria.includes("(Planejado)")) {
      // Planos
      const baseCat = categoria.replace(" (Planejado)", "");
      transactions = dashboardData.planos.filter(
        (p) =>
          (p.categoria || "Planejamento") === baseCat &&
          filterDataByPeriod([p], period).length > 0
      ).length;
    } else {
      // Despesas normais
      const now = new Date();
      transactions = dashboardData.despesas.filter(
        (d) =>
          (d.categoria || "Outros") === categoria &&
          new Date(d.data) <= now &&
          filterDataByPeriod([d], period).length > 0
      ).length;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${categoria}</td>
      <td>R$ ${valor.toFixed(2)}</td>
      <td>${percentage}%</td>
      <td>${transactions}</td>
    `;
    tbody.appendChild(row);
  });
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

  console.log("📊 Período alterado para:", period);
}

// ================ Inicialização ================

function initializeDashboard() {
  console.log("🚀 Inicializando dashboard...");

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
    console.log("✅ Chart.js carregado com sucesso");
  }

  // Event listeners para botões de período
  const periodBtns = document.querySelectorAll(".period-btn");
  console.log("🔘 Encontrados", periodBtns.length, "botões de período");

  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const period = btn.dataset.period;
      console.log("🔘 Período selecionado:", period);
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
  console.log("📊 Iniciando carregamento de dados...");
  loadDashboardDataWithToast();

  if (typeof showInfoToast === "function") {
    showInfoToast("Dashboard", "Dashboard inicializado com sucesso!", 2000);
  }

  console.log("✅ Dashboard inicializado com sucesso!");
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
    console.log("Service Worker support detected");
  }
}

// ================ Melhorias de UX ================

// Função para atualizar dados em tempo real
function refreshDashboard() {
  console.log("🔄 Atualizando dashboard...");
  loadDashboardData();
}

// Auto-refresh a cada 5 minutos (opcional)
function setupAutoRefresh() {
  setInterval(() => {
    if (document.visibilityState === "visible") {
      console.log("🔄 Auto-refresh do dashboard");
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
      parseFloat(
        incomeEl.textContent.replace(/[R$\s,]/g, "").replace(".", "")
      ) || 0,
      totalReceitas
    );
    animateCardUpdate("summary-income");
  }

  if (expenseEl) {
    animateValue(
      expenseEl,
      parseFloat(
        expenseEl.textContent.replace(/[R$\s,]/g, "").replace(".", "")
      ) || 0,
      totalDespesas
    );
    animateCardUpdate("summary-expense");
  }

  if (balanceEl) {
    animateValue(
      balanceEl,
      parseFloat(
        balanceEl.textContent.replace(/[R$\s,]/g, "").replace(".", "")
      ) || 0,
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
    element.textContent = `R$ ${current.toFixed(2)}`;

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
  console.log("🔄 Iniciando atualização do dashboard...");
  const period = dashboardData.currentPeriod || "week";

  try {
    // Atualiza cards primeiro (mais rápido)
    console.log("💰 Atualizando cards...");
    updateSummaryCards(period);

    // Loading states para gráficos
    showChartLoading("categoryChart", true);
    showChartLoading("timelineChart", true);

    // Pequeno delay para melhor UX
    setTimeout(() => {
      console.log("📊 Atualizando gráfico de categorias...");
      updateCategoryChart(period);
      showChartLoading("categoryChart", false);
    }, 300);

    setTimeout(() => {
      console.log("📈 Atualizando gráfico temporal...");
      updateTimelineChart(period);
      showChartLoading("timelineChart", false);
    }, 600);

    setTimeout(() => {
      console.log("📋 Atualizando tabela...");
      updateTopCategoriesTable(period);
    }, 900);

    console.log("✅ Dashboard atualizado para período:", period);
  } catch (error) {
    console.error("❌ Erro ao atualizar dashboard:", error);
    if (typeof showErrorToast === "function") {
      showErrorToast("Erro", "Falha ao atualizar dashboard");
    }
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

  console.log("📊 Período alterado para:", period);
}

// Detecta mudanças na visibilidade da página
document.addEventListener("visibilitychange", function () {
  if (
    document.visibilityState === "visible" &&
    dashboardData.despesas.length > 0
  ) {
    console.log("👁️ Página visível - verificando atualizações");
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
    console.log("📏 Gráficos redimensionados");
  }, 250);
});

// Função para aguardar Chart.js carregar
function waitForChart(callback, maxAttempts = 20) {
  let attempts = 0;

  function checkChart() {
    attempts++;
    console.log(`🔍 Tentativa ${attempts}: Verificando Chart.js...`);

    if (typeof Chart !== "undefined") {
      console.log("✅ Chart.js encontrado!");
      callback();
    } else if (attempts < maxAttempts) {
      console.log("⏳ Chart.js não encontrado, aguardando...");
      setTimeout(checkChart, 500);
    } else {
      console.error("❌ Chart.js não carregou após", maxAttempts, "tentativas");
      console.log("🔄 Tentando inicializar sem gráficos...");
      callback(); // Tenta inicializar sem gráficos
    }
  }

  checkChart();
}

// Inicializa quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 DOM carregado, iniciando dashboard...");

  // Verifica se estamos na página do painel
  if (!document.querySelector(".dashboard-container")) {
    console.log(
      "⚠️ Dashboard container não encontrado - não é a página do painel"
    );
    return;
  }

  console.log("✅ Dashboard container encontrado!");

  // Carrega dados de demonstração imediatamente para debug
  try {
    loadDemoData();
    console.log("✅ Dados de demonstração carregados com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao carregar dados demo:", error);
  }

  // Aguarda Chart.js carregar antes de inicializar
  waitForChart(() => {
    console.log("📊 Iniciando dashboard após Chart.js...");
    try {
      initializeDashboard();
      console.log("✅ Dashboard inicializado com sucesso!");
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
    console.log("📊 INICIANDO carregamento do dashboard...");
    showDashboardLoading(true);

    // Só mostra toast se a função existir
    if (typeof showInfoToast === "function") {
      showInfoToast("Dashboard", "Carregando dados financeiros...", 2000);
    }

    console.log("📊 Verificando Supabase...");
    if (!window.supabase) {
      console.error("❌ Supabase não encontrado!");
      throw new Error("Supabase não inicializado");
    }

    console.log("👤 Verificando usuário...");
    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;
    console.log("👤 Usuário:", user ? "Autenticado" : "Não autenticado");

    if (!user) {
      console.warn("⚠️ Usuário não autenticado");
      if (typeof showWarningToast === "function") {
        showWarningToast("Atenção", "Usuário não autenticado");
      }

      // Mesmo sem usuário, vamos mostrar dados fictícios para teste
      console.log("🧪 Carregando dados de demonstração...");
      loadDemoData();
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

    console.log("📊 Dados carregados:", {
      despesas: dashboardData.despesas.length,
      receitas: dashboardData.receitas.length,
      planos: dashboardData.planos.length,
      poupanca: dashboardData.poupanca.length,
      investimentos: dashboardData.investimentos.length,
    });

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

    let message = `${totalItems} registros carregados`;

    if (dashboardData.planos.length > 0) {
      message += ` • ${dashboardData.planos.length} planejamentos`;
    }

    if (despesasFuturas.length > 0 || receitasFuturas.length > 0) {
      const totalFuturo = despesasFuturas.length + receitasFuturas.length;
      message += ` • ${totalFuturo} lançamentos futuros`;
    }

    showSuccessToast("Dashboard Atualizado!", message, 4000);
  } catch (error) {
    console.error("❌ Erro ao carregar dados do dashboard:", error);
    showErrorToast("Erro", "Falha ao carregar dados. Verifique sua conexão.");
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
    const categoria = poupanca.categoria || poupanca.nome || "Poupança";
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
    const categoria =
      investimento.categoria || investimento.tipo || "Investimentos";
    const valor = parseFloat(investimento.valor) || 0;
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
  console.log(`🎯 Atualizando gráfico interativo:`, chartContext);

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
          borderColor: "#fff",
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
            color: "#333",
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
              return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  console.log(
    `✅ Gráfico ${type} atualizado com ${categories.length} categorias`
  );
}

// Exporta funções globalmente
window.loadDashboardData = loadDashboardDataWithToast;
window.changePeriod = changePeriod;
window.refreshDashboard = refreshDashboard;
window.updateCategoryChart = updateCategoryChart;
