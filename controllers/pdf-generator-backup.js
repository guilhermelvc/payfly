// ================ PDF Generator ================
console.log("📄 PDF Generator carregado");

// ================ Geração de PDF do Dashboard ================

async function generateDashboardPDF() {
  try {
    console.log("📄 Iniciando geração de PDF do dashboard...");
    console.log("🔍 Verificando bibliotecas:");
    console.log("- window.jspdf:", typeof window.jspdf);
    console.log("- html2canvas:", typeof html2canvas);
    console.log("- dashboardData:", typeof dashboardData);

    // Verifica se as bibliotecas estão carregadas
    if (typeof window.jspdf === "undefined") {
      const errorMsg = "jsPDF não carregado. Verifique a conexão com internet.";
      console.error("❌", errorMsg);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", errorMsg, 5000);
      } else {
        alert("⚠️ " + errorMsg);
      }
      return;
    }

    if (typeof html2canvas === "undefined") {
      const errorMsg =
        "html2canvas não carregado. Verifique a conexão com internet.";
      console.error("❌", errorMsg);
      if (typeof showErrorToast === "function") {
        showErrorToast("Erro", errorMsg, 5000);
      } else {
        alert("⚠️ " + errorMsg);
      }
      return;
    }

    // Mostra loading
    showPDFLoading(true);

    // Obtém informações do usuário
    const userInfo = await getCurrentUserInfo();
    console.log("👤 Informações do usuário:", userInfo);

    // Cria nova instância do jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    // Configurações
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // ================ Página de Capa ================
    await generateCoverPage(pdf, pageWidth, pageHeight, margin, userInfo);

    // ================ Páginas dos Períodos ================
    const periods = [
      { key: 'week', name: 'Semanal', description: 'Análise da semana atual' },
      { key: 'month', name: 'Mensal', description: 'Análise do mês atual' },
      { key: '6months', name: '6 Meses', description: 'Análise dos últimos 6 meses' },
      { key: 'futuros', name: 'Futuros', description: 'Lançamentos e planejamentos futuros' }
    ];

    for (const period of periods) {
      pdf.addPage();
      await generatePeriodPage(pdf, pageWidth, pageHeight, margin, period, userInfo);
    }

    // ================ Rodapé de Direitos Autorais ================
    addFooterToAllPages(pdf);

    // Salva o PDF
    const fileName = `PayFly_Relatorio_${userInfo.name}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    console.log("✅ PDF gerado com sucesso!");
    if (typeof showSuccessToast === "function") {
      showSuccessToast("Sucesso!", "Relatório PDF gerado com sucesso!", 3000);
    }

  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
    if (typeof showErrorToast === "function") {
      showErrorToast("Erro", `Falha ao gerar PDF: ${error.message}`, 5000);
    } else {
      alert("❌ Erro ao gerar PDF: " + error.message);
    }
  } finally {
    showPDFLoading(false);
  }
}

// ================ Funções Auxiliares ================

// Obtém informações do usuário atual
async function getCurrentUserInfo() {
  try {
    if (!window.supabase) {
      return {
        name: "Usuário Demo",
        email: "demo@payfly.com.br"
      };
    }

    const { data: userData } = await window.supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return {
        name: "Usuário Demo",
        email: "demo@payfly.com.br"
      };
    }

    // Tenta buscar nome na tabela de usuários
    try {
      const { data: userProfile } = await window.supabase
        .from("usuarios")
        .select("nome")
        .eq("id", user.id)
        .single();

      return {
        name: userProfile?.nome || user.email.split("@")[0] || "Usuário",
        email: user.email
      };
    } catch {
      // Fallback para email
      return {
        name: user.email.split("@")[0] || "Usuário",
        email: user.email
      };
    }
  } catch (error) {
    console.warn("⚠️ Erro ao obter informações do usuário:", error);
    return {
      name: "Usuário Demo",
      email: "demo@payfly.com.br"
    };
  }
}

// Gera página de capa
async function generateCoverPage(pdf, pageWidth, pageHeight, margin, userInfo) {
  let currentY = 60;

  // ================ Logo e Título PayFly ================
  pdf.setFontSize(32);
  pdf.setTextColor(42, 33, 133); // Cor principal do PayFly
  pdf.text("💰 PayFly", pageWidth / 2, currentY, { align: "center" });
  
  currentY += 15;
  pdf.setFontSize(16);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Plataforma de Gestão Financeira Pessoal", pageWidth / 2, currentY, { align: "center" });

  currentY += 40;

  // ================ Título do Relatório ================
  pdf.setFontSize(24);
  pdf.setTextColor(42, 33, 133);
  pdf.text("📊 RELATÓRIO FINANCEIRO", pageWidth / 2, currentY, { align: "center" });

  currentY += 20;

  // ================ Informações do Usuário ================
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`👤 Usuário: ${userInfo.name}`, pageWidth / 2, currentY, { align: "center" });
  
  currentY += 10;
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`📧 ${userInfo.email}`, pageWidth / 2, currentY, { align: "center" });

  currentY += 30;

  // ================ Data e Hora de Geração ================
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = currentDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`📅 Data de Geração: ${dateStr}`, pageWidth / 2, currentY, { align: "center" });
  
  currentY += 8;
  pdf.text(`🕐 Horário: ${timeStr}`, pageWidth / 2, currentY, { align: "center" });

  currentY += 40;

  // ================ Resumo Geral ================
  pdf.setDrawColor(42, 33, 133);
  pdf.setFillColor(248, 249, 250);
  pdf.roundedRect(margin, currentY - 10, pageWidth - (margin * 2), 60, 5, 5, "FD");

  currentY += 5;
  pdf.setFontSize(16);
  pdf.setTextColor(42, 33, 133);
  pdf.text("📋 Conteúdo do Relatório", margin + 10, currentY);

  currentY += 15;
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);

  const content = [
    "• Análise Semanal - Movimentações da semana atual",
    "• Análise Mensal - Consolidado do mês corrente", 
    "• Análise 6 Meses - Histórico semestral",
    "• Lançamentos Futuros - Planejamentos e metas"
  ];

  content.forEach(line => {
    pdf.text(line, margin + 15, currentY);
    currentY += 8;
  });

  currentY += 40;

  // ================ Aviso Legal ================
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  const disclaimer = [
    "Este relatório contém informações financeiras pessoais e confidenciais.",
    "Os dados apresentados são baseados nas informações inseridas pelo usuário.",
    "Mantenha este documento em local seguro e não compartilhe com terceiros."
  ];

  disclaimer.forEach(line => {
    pdf.text(line, pageWidth / 2, currentY, { align: "center" });
    currentY += 6;
  });
}

    // Logo/Título
    pdf.setFontSize(24);
    pdf.setTextColor(42, 33, 133); // Cor do PayFly
    pdf.text("💰 PayFly - Relatório Financeiro", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 15;

    // Data do relatório
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    pdf.text(`Gerado em: ${currentDate}`, pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 10;

    // Período
    let period = "week";
    let periodText = "Esta semana";

    if (typeof dashboardData !== "undefined" && dashboardData.currentPeriod) {
      period = dashboardData.currentPeriod;
    }

    // Função local para texto do período
    switch (period) {
      case "week":
        periodText = "Esta semana";
        break;
      case "month":
        periodText = "Este mês";
        break;
      case "6months":
        periodText = "Últimos 6 meses";
        break;
      case "futuros":
        periodText = "Lançamentos futuros";
        break;
      default:
        periodText = "Esta semana";
    }

    pdf.text(`Período: ${periodText}`, pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 20;

    // ================ Resumo Financeiro ================

    pdf.setFontSize(16);
    pdf.setTextColor(42, 33, 133);
    pdf.text("📊 Resumo Financeiro", 20, currentY);

    currentY += 15;

    // Busca valores dos cards com verificação de existência
    const incomeEl = document.getElementById("summary-income");
    const expenseEl = document.getElementById("summary-expense");
    const balanceEl = document.getElementById("summary-balance");

    const totalReceitas = incomeEl ? incomeEl.textContent : "R$ 0,00";
    const totalDespesas = expenseEl ? expenseEl.textContent : "R$ 0,00";
    const saldoLiquido = balanceEl ? balanceEl.textContent : "R$ 0,00";

    console.log("📊 Valores capturados:", {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
    });

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    // Caixa de resumo
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(20, currentY - 5, pageWidth - 40, 30, 3, 3, "FD");

    pdf.setTextColor(40, 167, 69); // Verde
    pdf.text(`💰 Total de Entradas: ${totalReceitas}`, 25, currentY + 5);

    pdf.setTextColor(220, 53, 69); // Vermelho
    pdf.text(`💸 Total de Saídas: ${totalDespesas}`, 25, currentY + 12);

    pdf.setTextColor(42, 33, 133); // Azul
    pdf.text(`💵 Saldo Líquido: ${saldoLiquido}`, 25, currentY + 19);

    currentY += 40;

    // ================ Captura dos Gráficos ================

    // Gráfico de Pizza (Categorias)
    try {
      const categoryChartElement = document.getElementById("categoryChart");
      if (categoryChartElement) {
        pdf.setFontSize(14);
        pdf.setTextColor(42, 33, 133);
        pdf.text("💰 Gastos por Categoria", 20, currentY);
        currentY += 10;

        const categoryCanvas = await html2canvas(
          categoryChartElement.parentElement,
          {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          }
        );

        const categoryImgData = categoryCanvas.toDataURL("image/png");
        const chartWidth = 80;
        const chartHeight = 60;

        pdf.addImage(
          categoryImgData,
          "PNG",
          20,
          currentY,
          chartWidth,
          chartHeight
        );
        currentY += chartHeight + 20;
      }
    } catch (error) {
      console.error("❌ Erro ao capturar gráfico de categorias:", error);
      pdf.setTextColor(220, 53, 69);
      pdf.text("⚠️ Erro ao gerar gráfico de categorias", 20, currentY);
      currentY += 15;
    }

    // Verifica se precisa de nova página
    if (currentY > pageHeight - 80) {
      pdf.addPage();
      currentY = 20;
    }

    // Gráfico de Linha (Timeline)
    try {
      const timelineChartElement = document.getElementById("timelineChart");
      if (timelineChartElement) {
        pdf.setFontSize(14);
        pdf.setTextColor(42, 33, 133);
        pdf.text("📈 Evolução Temporal", 20, currentY);
        currentY += 10;

        const timelineCanvas = await html2canvas(
          timelineChartElement.parentElement,
          {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
          }
        );

        const timelineImgData = timelineCanvas.toDataURL("image/png");
        const chartWidth = 160;
        const chartHeight = 60;

        pdf.addImage(
          timelineImgData,
          "PNG",
          20,
          currentY,
          chartWidth,
          chartHeight
        );
        currentY += chartHeight + 20;
      }
    } catch (error) {
      console.error("❌ Erro ao capturar gráfico temporal:", error);
      pdf.setTextColor(220, 53, 69);
      pdf.text("⚠️ Erro ao gerar gráfico temporal", 20, currentY);
      currentY += 15;
    }

    // ================ Tabela Top Categorias ================

    // Verifica se precisa de nova página
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = 20;
    }

    pdf.setFontSize(14);
    pdf.setTextColor(42, 33, 133);
    pdf.text("🏆 Top Categorias", 20, currentY);
    currentY += 15;

    // Cabeçalho da tabela
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    pdf.setFillColor(248, 249, 250);
    pdf.rect(20, currentY - 5, pageWidth - 40, 8, "F");

    pdf.text("Categoria", 25, currentY);
    pdf.text("Valor Total", 80, currentY);
    pdf.text("Porcentagem", 120, currentY);
    pdf.text("Transações", 155, currentY);

    currentY += 10;

    // Dados da tabela
    const tableRows = document.querySelectorAll(
      "#top-categories-table tbody tr"
    );
    tableRows.forEach((row, index) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 4) {
        // Linha zebrada
        if (index % 2 === 1) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(20, currentY - 5, pageWidth - 40, 8, "F");
        }

        pdf.text(cells[0].textContent, 25, currentY);
        pdf.text(cells[1].textContent, 80, currentY);
        pdf.text(cells[2].textContent, 120, currentY);
        pdf.text(cells[3].textContent, 155, currentY);

        currentY += 8;
      }
    });

    // ================ Rodapé ================

    currentY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "Relatório gerado automaticamente pelo PayFly",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    pdf.text(
      `Página 1 de ${pdf.internal.getNumberOfPages()}`,
      pageWidth - 20,
      currentY,
      { align: "right" }
    );

    // ================ Salvamento ================

    const fileName = `PayFly_Relatorio_${period}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;
    pdf.save(fileName);

    console.log("✅ PDF gerado com sucesso:", fileName);

    // Usa toast se disponível, senão usa alert
    if (typeof window.showSuccessToast === "function") {
      window.showSuccessToast(
        "PDF Gerado",
        `Relatório ${fileName} baixado com sucesso!`,
        5000
      );
    } else {
      alert("📄 Relatório PDF gerado com sucesso!");
    }
  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);

    // Usa toast se disponível, senão usa alert
    if (typeof window.showErrorToast === "function") {
      window.showErrorToast(
        "Erro PDF",
        "Falha ao gerar relatório. Tente novamente."
      );
    } else {
      alert("❌ Erro ao gerar PDF. Tente novamente.");
    }
  } finally {
    showPDFLoading(false);
  }
}

// ================ Funções Auxiliares ================

function showPDFLoading(show) {
  const pdfBtn = document.querySelector(".pdf-btn");
  if (pdfBtn) {
    if (show) {
      pdfBtn.innerHTML =
        '<ion-icon name="hourglass-outline"></ion-icon> Gerando...';
      pdfBtn.disabled = true;
      pdfBtn.style.opacity = "0.7";
      pdfBtn.style.cursor = "not-allowed";

      // Adiciona uma barra de progresso visual
      const progressBar = document.createElement("div");
      progressBar.id = "pdf-progress";
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #dc3545, #fd7e14);
        z-index: 9999;
        transition: width 0.3s ease;
      `;
      document.body.appendChild(progressBar);

      // Anima a barra de progresso
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + "%";
      }, 200);

      pdfBtn.dataset.progressInterval = interval;
    } else {
      pdfBtn.innerHTML =
        '<ion-icon name="download-outline"></ion-icon> Gerar PDF';
      pdfBtn.disabled = false;
      pdfBtn.style.opacity = "1";
      pdfBtn.style.cursor = "pointer";

      // Remove barra de progresso
      const progressBar = document.getElementById("pdf-progress");
      if (progressBar) {
        progressBar.style.width = "100%";
        setTimeout(() => {
          progressBar.remove();
        }, 300);
      }

      // Limpa intervalo
      const interval = pdfBtn.dataset.progressInterval;
      if (interval) {
        clearInterval(interval);
        delete pdfBtn.dataset.progressInterval;
      }

      // Feedback visual de sucesso
      pdfBtn.style.background = "linear-gradient(135deg, #28a745, #20c997)";
      pdfBtn.innerHTML =
        '<ion-icon name="checkmark-outline"></ion-icon> PDF Gerado!';

      setTimeout(() => {
        pdfBtn.style.background = "linear-gradient(135deg, #dc3545, #fd7e14)";
        pdfBtn.innerHTML =
          '<ion-icon name="download-outline"></ion-icon> Gerar PDF';
      }, 2000);
    }
  }
}

function getPeriodText(period) {
  switch (period) {
    case "week":
      return "Esta semana";
    case "month":
      return "Este mês";
    case "6months":
      return "Últimos 6 meses";
    default:
      return "Esta semana";
  }
}

// ================ Exportação ================

// Torna a função global
window.generateDashboardPDF = generateDashboardPDF;
