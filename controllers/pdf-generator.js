// ================ PDF Generator ================
console.log("📄 PDF Generator carregado");

// Cache for processed logo assets reused across PDF generations
const payFlyLogoCache = {
    svgDataUrl: null,
    pngDataUrl: null,
};

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
            const errorMsg =
                "jsPDF não carregado. Verifique a conexão com internet.";
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
            {
                key: "week",
                name: "Análise Semanal",
                description: "Movimentações da semana atual",
            },
            {
                key: "month",
                name: "Análise Mensal",
                description: "Consolidado do mês corrente",
            },
            {
                key: "6months",
                name: "Análise Semestral",
                description: "Histórico dos últimos 6 meses",
            },
            {
                key: "futuros",
                name: "Lançamentos Futuros",
                description: "Planejamentos e metas futuras",
            },
        ];

        for (const period of periods) {
            pdf.addPage();
            await generatePeriodPage(
                pdf,
                pageWidth,
                pageHeight,
                margin,
                period,
                userInfo
            );
        }

        // ================ Rodapé de Direitos Autorais ================
        addFooterToAllPages(pdf);

        // Salva o PDF
        const fileName = `PayFly_Relatorio_${userInfo.name.replace(
            /\s+/g,
            "_"
        )}_${new Date().toISOString().split("T")[0]}.pdf`;
        pdf.save(fileName);

        console.log("✅ PDF gerado com sucesso!");
        if (typeof showSuccessToast === "function") {
            showSuccessToast(
                "Sucesso!",
                "Relatório PDF gerado com sucesso!",
                3000
            );
        }
    } catch (error) {
        console.error("❌ Erro ao gerar PDF:", error);
        if (typeof showErrorToast === "function") {
            showErrorToast(
                "Erro",
                `Falha ao gerar PDF: ${error.message}`,
                5000
            );
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
                email: "demo@payfly.com.br",
            };
        }

        const { data: userData } = await window.supabase.auth.getUser();
        const user = userData?.user;

        if (!user) {
            return {
                name: "Usuário Demo",
                email: "demo@payfly.com.br",
            };
        }

        // Tenta buscar nome na tabela de usuários
        try {
            const { data: userProfile, error } = await window.supabase
                .from("usuarios")
                .select("nome")
                .eq("id", user.id)
                .limit(1);

            if (error) {
                console.warn("Erro ao buscar perfil do usuário:", error);
            }

            const nome = userProfile && userProfile[0]?.nome;

            return {
                name:
                    nome && !nome.includes("@")
                        ? nome
                        : user.email.split("@")[0] || "Usuário",
                email: user.email,
            };
        } catch (e) {
            console.warn("⚠️ Exceção ao buscar perfil:", e);
            // Fallback para email
            return {
                name: user.email.split("@")[0] || "Usuário",
                email: user.email,
            };
        }
    } catch (error) {
        console.warn("⚠️ Erro ao obter informações do usuário:", error);
        return {
            name: "Usuário Demo",
            email: "demo@payfly.com.br",
        };
    }
}

// Gera página de capa
async function generateCoverPage(pdf, pageWidth, pageHeight, margin, userInfo) {
    let currentY = 40;

    // ================ Logo PayFly ================
    await drawPayFlyLogo(pdf, pageWidth / 2, currentY);
    currentY += 50;

    // ================ Título PayFly ================
    pdf.setFontSize(32);
    pdf.setTextColor(42, 33, 133); // Cor principal do PayFly
    pdf.text("PayFly", pageWidth / 2, currentY, { align: "center" });

    currentY += 15;
    pdf.setFontSize(16);
    pdf.setTextColor(100, 100, 100);
    pdf.text(
        "Plataforma de Gestao Financeira Pessoal",
        pageWidth / 2,
        currentY,
        {
            align: "center",
        }
    );

    currentY += 35;

    // ================ Título do Relatório ================
    pdf.setFontSize(20);
    pdf.setTextColor(42, 33, 133);
    pdf.text("RELATORIO FINANCEIRO", pageWidth / 2, currentY, {
        align: "center",
    });

    currentY += 15;

    // ================ Informações do Usuário ================
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Usuario: " + userInfo.name, pageWidth / 2, currentY, {
        align: "center",
    });

    currentY += 8;
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Email: " + userInfo.email, pageWidth / 2, currentY, {
        align: "center",
    });

    currentY += 20;

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

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Data de Geracao: " + dateStr, pageWidth / 2, currentY, {
        align: "center",
    });

    currentY += 6;
    pdf.text("Horario: " + timeStr, pageWidth / 2, currentY, {
        align: "center",
    });

    currentY += 25;

    // ================ Resumo Geral ================
    pdf.setDrawColor(42, 33, 133);
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(
        margin,
        currentY - 6,
        pageWidth - margin * 2,
        40,
        5,
        5,
        "FD"
    );

    currentY += 0;
    pdf.setFontSize(12);
    pdf.setTextColor(42, 33, 133);
    pdf.text("Conteudo do Relatorio", margin + 10, currentY);

    currentY += 10;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);

    const content = [
        "• Analise Semanal - Movimentacoes da semana atual",
        "• Analise Mensal - Consolidado do mes corrente",
        "• Analise Semestral - Historico dos ultimos 6 meses",
        "• Lancamentos Futuros - Planejamentos e metas",
    ];

    content.forEach((line) => {
        pdf.text(line, margin + 15, currentY);
        currentY += 6;
    });

    currentY += 15;

    // ================ Aviso Legal ================
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const disclaimer = [
        "Este relatorio contem informacoes financeiras pessoais e confidenciais.",
        "Os dados apresentados sao baseados nas informacoes inseridas pelo usuario.",
        "Mantenha este documento em local seguro e nao compartilhe com terceiros.",
    ];

    disclaimer.forEach((line) => {
        pdf.text(line, pageWidth / 2, currentY, { align: "center" });
        currentY += 5;
    });
}

// Desenha logo do PayFly usando formas geométricas
async function drawPayFlyLogo(pdf, centerX, centerY) {
    try {
        const pngDataUrl = await getPayFlyLogoPngDataUrl();

        if (!pngDataUrl) {
            throw new Error("Logo PNG data URL não disponível");
        }

        pdf.addImage(pngDataUrl, "PNG", centerX - 15, centerY - 15, 30, 30);
        console.log(
            "✅ Logo PayFly adicionada ao PDF a partir do cache/processamento"
        );
    } catch (error) {
        console.warn(
            "❌ Falha ao adicionar logo processada, usando fallback:",
            error
        );
        drawFallbackLogo(pdf, centerX, centerY);
    }
}

async function getPayFlyLogoPngDataUrl() {
    if (payFlyLogoCache.pngDataUrl) {
        return payFlyLogoCache.pngDataUrl;
    }

    const svgDataUrl = await getPayFlyLogoSvgDataUrl();
    if (!svgDataUrl) {
        return null;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: false });
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const canvasSize = 200;

    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    canvas.style.width = canvasSize + "px";
    canvas.style.height = canvasSize + "px";
    ctx.scale(scale, scale);

    const img = await loadImage(svgDataUrl);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const imgSize = canvasSize * 0.9;
    const offset = (canvasSize - imgSize) / 2;
    ctx.drawImage(img, offset, offset, imgSize, imgSize);

    payFlyLogoCache.pngDataUrl = canvas.toDataURL("image/png", 0.95);
    return payFlyLogoCache.pngDataUrl;
}

async function getPayFlyLogoSvgDataUrl() {
    if (payFlyLogoCache.svgDataUrl) {
        return payFlyLogoCache.svgDataUrl;
    }

    const logoUrl = resolvePayFlyLogoPath();
    console.log("📁 Caminho da logo resolvido:", logoUrl);

    try {
        const response = await fetch(logoUrl, { cache: "no-cache" });
        console.log(
            "📡 Status ao buscar logo:",
            response.status,
            response.statusText
        );

        if (!response.ok) {
            throw new Error(`Resposta ${response.status}`);
        }

        const svgContent = await response.text();
        console.log("✅ SVG carregado, tamanho:", svgContent.length, "chars");

        const blackSvg = svgContent
            .replace(/fill="[^"]*"/g, 'fill="#000000"')
            .replace(/stroke="[^"]*"/g, 'stroke="#000000"')
            .replace(/fill:[^;"]*/g, "fill:#000000")
            .replace(/stroke:[^;"]*/g, "stroke:#000000");

        const svgBlob = new Blob([blackSvg], {
            type: "image/svg+xml;charset=utf-8",
        });

        payFlyLogoCache.svgDataUrl = await blobToDataUrl(svgBlob);
    } catch (error) {
        console.warn(
            "⚠️ Falha ao processar logo SVG, usando arquivo original:",
            error
        );
        payFlyLogoCache.svgDataUrl = logoUrl;
    }

    return payFlyLogoCache.svgDataUrl;
}

function resolvePayFlyLogoPath() {
    try {
        const baseUrl = new URL(".", window.location.href);
        return new URL("views/imgs/logo.svg", baseUrl).href;
    } catch (error) {
        console.warn(
            "⚠️ Falha ao resolver caminho da logo, usando relativo",
            error
        );
        return "views/imgs/logo.svg";
    }
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
}

function drawFallbackLogo(pdf, centerX, centerY) {
    console.log("🔄 Usando logo fallback geométrica em preto");

    try {
        // Salvar estado atual
        const currentDrawColor = pdf.getDrawColor();
        const currentFillColor = pdf.getFillColor();
        const currentTextColor = pdf.getTextColor();
        const currentLineWidth = pdf.getLineWidth();

        // Círculo externo (borda) - PRETO
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(1);
        pdf.circle(centerX, centerY, 18, "S");

        // Círculo principal (moeda) - PRETO
        pdf.setFillColor(0, 0, 0);
        pdf.circle(centerX, centerY, 15, "F");

        // Círculo interno (brilho) - BRANCO
        pdf.setFillColor(255, 255, 255);
        pdf.circle(centerX - 4, centerY - 4, 3.5, "F");

        // Símbolo $ estilizado - BRANCO
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text("$", centerX, centerY + 2, { align: "center" });

        console.log("✅ Logo fallback preta desenhada com sucesso");

        // Restaurar estado anterior
        pdf.setDrawColor(currentDrawColor);
        pdf.setFillColor(currentFillColor);
        pdf.setTextColor(currentTextColor);
        pdf.setLineWidth(currentLineWidth);
    } catch (error) {
        console.error("❌ Erro ao desenhar logo fallback:", error);

        // Fallback mínimo: apenas um círculo preto com $
        pdf.setFillColor(0, 0, 0);
        pdf.circle(centerX, centerY, 15, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.text("$", centerX, centerY + 2, { align: "center" });
    }
}

// Gera página para um período específico
async function generatePeriodPage(
    pdf,
    pageWidth,
    pageHeight,
    margin,
    period,
    userInfo
) {
    let currentY = 30;

    // ================ Cabeçalho da Página ================
    pdf.setFontSize(20);
    pdf.setTextColor(42, 33, 133);
    pdf.text(period.name, margin, currentY);

    currentY += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(period.description, margin, currentY);

    currentY += 20;

    // ================ Resumo Financeiro do Período ================
    const periodData = getPeriodData(period.key);

    // Caixa de resumo
    pdf.setDrawColor(42, 33, 133);
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(
        margin,
        currentY - 5,
        pageWidth - margin * 2,
        35,
        3,
        3,
        "FD"
    );

    currentY += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(42, 33, 133);
    pdf.text("Resumo Financeiro", margin + 10, currentY);

    currentY += 10;
    pdf.setFontSize(12);

    pdf.setTextColor(40, 167, 69); // Verde
    pdf.text(
        "Entradas: " + formatCurrency(periodData.receitas),
        margin + 10,
        currentY
    );

    pdf.setTextColor(220, 53, 69); // Vermelho
    pdf.text(
        "Saidas: " + formatCurrency(periodData.despesas),
        margin + 70,
        currentY
    );

    pdf.setTextColor(42, 33, 133); // Azul
    pdf.text(
        "Saldo: " + formatCurrency(periodData.receitas - periodData.despesas),
        margin + 120,
        currentY
    );

    currentY += 25;

    // ================ Detalhamento por Categoria ================
    if (
        periodData.categorias &&
        Object.keys(periodData.categorias).length > 0
    ) {
        pdf.setFontSize(14);
        pdf.setTextColor(42, 33, 133);
        pdf.text("Detalhamento por Categoria", margin, currentY);

        currentY += 15;

        // Cabeçalho da tabela
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(
            margin,
            currentY - 5,
            pageWidth - margin * 2,
            10,
            2,
            2,
            "FD"
        );

        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Categoria", margin + 5, currentY + 2);
        pdf.text("Valor", pageWidth - margin - 30, currentY + 2);

        currentY += 12;

        // Dados da tabela
        Object.entries(periodData.categorias).forEach(
            ([categoria, valor], index) => {
                if (currentY > pageHeight - 30) {
                    pdf.addPage();
                    currentY = 30;
                }

                // Linha alternada
                if (index % 2 === 1) {
                    pdf.setFillColor(248, 249, 250);
                    pdf.roundedRect(
                        margin,
                        currentY - 4,
                        pageWidth - margin * 2,
                        8,
                        1,
                        1,
                        "F"
                    );
                }

                pdf.setTextColor(0, 0, 0);
                pdf.text(categoria, margin + 5, currentY);
                pdf.text(
                    formatCurrency(valor),
                    pageWidth - margin - 30,
                    currentY,
                    {
                        align: "right",
                    }
                );
                currentY += 8;
            }
        );
    } else {
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.text(
            "Nenhuma movimentacao encontrada neste periodo",
            margin,
            currentY
        );
    }

    // ================ Observações do Período ================
    currentY += 20;

    if (currentY < pageHeight - 50) {
        pdf.setFontSize(12);
        pdf.setTextColor(42, 33, 133);
        pdf.text("Observacoes", margin, currentY);

        currentY += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);

        let observations = [];
        if (period.key === "week") {
            observations = [
                "• Periodo analisado: " + getWeekRange(),
                "• Dados refletem movimentacoes dos ultimos 7 dias",
                "• Valores incluem lancamentos realizados e confirmados",
            ];
        } else if (period.key === "month") {
            observations = [
                "• Periodo analisado: " + getMonthRange(),
                "• Dados consolidados do mes atual ate a data presente",
                "• Inclui todas as categorias de receitas e despesas",
            ];
        } else if (period.key === "6months") {
            observations = [
                "• Periodo analisado: " + getSemesterRange(),
                "• Historico completo dos ultimos 6 meses",
                "• Ideal para analise de tendencias e padroes",
            ];
        } else if (period.key === "futuros") {
            observations = [
                "• Projecoes e planejamentos futuros",
                "• Valores estimados baseados em metas definidas",
                "• Sujeito a alteracoes conforme realizacao",
            ];
        }

        observations.forEach((obs) => {
            if (currentY < pageHeight - 20) {
                pdf.text(obs, margin, currentY);
                currentY += 6;
            }
        });
    }
}

// Obtém dados de um período específico
function getPeriodData(periodKey) {
    try {
        if (typeof dashboardData === "undefined" || !dashboardData) {
            return { receitas: 0, despesas: 0, categorias: {} };
        }

        // Filtra dados por período usando a função existente
        let filteredDespesas = [];
        let filteredReceitas = [];

        if (typeof filterDataByPeriod === "function") {
            filteredDespesas = filterDataByPeriod(
                dashboardData.despesas || [],
                periodKey
            );
            filteredReceitas = filterDataByPeriod(
                dashboardData.receitas || [],
                periodKey
            );
        } else {
            // Fallback simples
            filteredDespesas = dashboardData.despesas || [];
            filteredReceitas = dashboardData.receitas || [];
        }

        // Calcula totais
        const totalReceitas = filteredReceitas.reduce(
            (sum, item) => sum + (parseFloat(item.valor) || 0),
            0
        );
        const totalDespesas = filteredDespesas.reduce(
            (sum, item) => sum + (parseFloat(item.valor) || 0),
            0
        );

        // Agrupa por categoria
        const categorias = {};

        filteredDespesas.forEach((item) => {
            const categoria = "SAIDA: " + (item.categoria || "Outros");
            categorias[categoria] =
                (categorias[categoria] || 0) + (parseFloat(item.valor) || 0);
        });

        filteredReceitas.forEach((item) => {
            const categoria = "ENTRADA: " + (item.categoria || "Outros");
            categorias[categoria] =
                (categorias[categoria] || 0) + (parseFloat(item.valor) || 0);
        });

        return {
            receitas: totalReceitas,
            despesas: totalDespesas,
            categorias: categorias,
        };
    } catch (error) {
        console.error("Erro ao obter dados do período:", error);
        return { receitas: 0, despesas: 0, categorias: {} };
    }
}

// Adiciona rodapé com direitos autorais em todas as páginas
function addFooterToAllPages(pdf) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageWidth = pdf.internal.pageSize.getWidth();

    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        // Linha divisória
        pdf.setDrawColor(200, 200, 200);
        pdf.line(20, 280, pageWidth - 20, 280);

        // Texto do rodapé
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);

        // Esquerda - PayFly
        pdf.text("PayFly - Gestao Financeira Pessoal", 20, 285);

        // Centro - Direitos autorais
        pdf.text(
            "(c) " +
                new Date().getFullYear() +
                " PayFly. Todos os direitos reservados.",
            pageWidth / 2,
            285,
            { align: "center" }
        );

        // Direita - Página
        pdf.text("Pagina " + i + " de " + pageCount, pageWidth - 20, 285, {
            align: "right",
        });

        // Informações adicionais
        pdf.setFontSize(7);
        pdf.text("Documento confidencial - Uso pessoal", pageWidth / 2, 290, {
            align: "center",
        });
    }
}

// Formata valor monetário
function formatCurrency(value) {
    if (typeof value !== "number" || isNaN(value)) {
        return "R$ 0,00";
    }

    return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

// Funções auxiliares para ranges de datas
function getWeekRange() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    return `${startOfWeek.toLocaleDateString(
        "pt-BR"
    )} - ${today.toLocaleDateString("pt-BR")}`;
}

function getMonthRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return `${startOfMonth.toLocaleDateString(
        "pt-BR"
    )} - ${today.toLocaleDateString("pt-BR")}`;
}

function getSemesterRange() {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    return `${sixMonthsAgo.toLocaleDateString(
        "pt-BR"
    )} - ${today.toLocaleDateString("pt-BR")}`;
}

// ================ Sistema de Loading do PDF ================

function showPDFLoading(show) {
    const pdfBtn = document.querySelector(".pdf-download-btn");

    if (!pdfBtn) {
        console.warn("⚠️ Botão PDF não encontrado");
        return;
    }

    if (show) {
        pdfBtn.innerHTML =
            '<ion-icon name="hourglass-outline"></ion-icon> Gerando PDF...';
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
            pdfBtn.style.background =
                "linear-gradient(135deg, #dc3545, #fd7e14)";
            pdfBtn.innerHTML =
                '<ion-icon name="download-outline"></ion-icon> Gerar PDF';
        }, 2000);
    }
}

// ================ Exportação ================

// Torna a função global
window.generateDashboardPDF = generateDashboardPDF;

console.log("✅ PDF Generator inicializado com sucesso!");
