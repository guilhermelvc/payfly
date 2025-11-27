function getBrandColor(key, fallback) {
  var palette = BRAND_COLORS || {};
  var selected = palette[key];
  if (
    !selected ||
    typeof selected.r !== "number" ||
    typeof selected.g !== "number" ||
    typeof selected.b !== "number"
  ) {
    if (fallback) {
      return fallback;
    }
    // Hard fallback to primary defaults to avoid crashing downstream calls
    return { r: 0, g: 89, b: 81 };
  }
  return selected;
}
// ================ PDF Generator ================
console.log("📄 PDF Generator carregado");

// Brand palette aligned with the web experience
var BRAND_COLORS = (function () {
  var fallback = {
    primary: { r: 0, g: 89, b: 81 }, // #005951
    dark: { r: 24, g: 61, b: 61 }, // #183d3d
    accent: { r: 147, g: 177, b: 166 }, // #93B1A6
    muted: { r: 100, g: 100, b: 100 },
  };

  if (!window.PAYFLY_BRAND_COLORS) {
    window.PAYFLY_BRAND_COLORS = fallback;
    return fallback;
  }

  var palette = window.PAYFLY_BRAND_COLORS;
  if (
    !palette ||
    !palette.primary ||
    typeof palette.primary.r !== "number" ||
    typeof palette.primary.g !== "number" ||
    typeof palette.primary.b !== "number"
  ) {
    console.warn(
      "⚠️ PAYFLY_BRAND_COLORS inválido detectado. Revertendo para fallback."
    );
    window.PAYFLY_BRAND_COLORS = fallback;
    return fallback;
  }

  return palette;
})();

// Embedded PayFly logo (usada como fallback e para rodapé)
const PAYFLY_EMBEDDED_LOGO_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAASCSURBVHgB7VkrcxxHEP6iEBt5jSKWMYqYD4plYFj0D3KBQZFZoP6BLBikCzSywsx8ZmY5sQvKhpnlzM7Imfb25+5Z757ubFlTLs1X1TWz8+jH9GPm6oCKioqKioqKioqKio/B1yPjMVFINEl0J9ErfDqaRPuJVr3xyTXxF4RERyor6Fgmb8jg6Db/lmia6PtEf6MzfoXdIUosdK8oc+iUuaN9adfYHUF5Pk/0Czr920RLDDjrqwEGjaOoSrWunWif31chuvXHiX5UJeVbDuGRkzvHdqB+Qb8Xqpd8P0z0ItGFfrdXMQuw0HirdKpzR86I6NZu4tVo/7nj5+m/ntxNaNy6oDowhM8dzyksJTPsDTBtXXumffHMYx1rtGWfkRAGeAWYwZuMYDuWLhMny/eZJlMlwQwWKYs+o7GiJUwknyQsJDwk9J/p3KEaQmZr5Iru6zxzc6nfl+gOpn8AEtIvYfnWOB7C+wB2uBxbOj6ttkF5/a5rBgvhUA57RJg3fe4Cea5TcHDrAQuplfZP8WEkHKseC52bI48e7m9c2zgZ3tv0/hwjuMpgIirDqMxoSIvcIH4Hp0CrrRSTkwHeMv8zzIi3Ti8ecEBefALsACiL+8fS4h32sB1o7ENYdaVCLcz77HsFePr3R3gHt0Za74TGrSH5HF6pTgFbGCsYMzgm+ivRP+iqa1SG/8IqIFR4dEodw07dh1/EZsxh+U2lW/0+gkULeXJe9lw6XbzOP2FA7lDRko1SQO4mepLoT3RFYh/mNRYEFodGW+95vqpIEQPXhM5d6v6ljpEn+1K4XvZkssgFp9MT5fVG21bn3xewvQFjGZqCc6VfdXyGvFh4b/pw8gUGumeOYVAxXwSDm28db8qawAydaSseFQ8/dfuoy3v0PSynJ57hyR1oK1fRXeRFRLzJq4dKyL7vEr1G/mT0iu73ZJ7BImLp2kNVmvpQDqNsDbvCTtClE5++vJrW6DljqEoH5E+2CKvSM1iuLXr7/FiAeW0CO23Ze97b96C3n3uHePQrMddMXX+B3MiskG26lgIsNFvkhYoMG+Re5/e36ELV74+qzFNYmP0Be/MukL+6GuQPHMqZuDHyXPR0azGCsZcWBbxyQvhrRkLombZrpxgLjRSXNzBvyLoD15fU+EHnz3TvUtcAFr4cb5zcb9BFxBLmhJXjT31Hscs9zFM8QlccAuw0L5C/dTnno6BFfoeT74X2W+Q/IWc63rh1EjWPlb9cPxG7/cra+qXVB407Rvdzb47u+qLiXCN9H4Y8DObxA+Tp4nnTcI5FdJX4kfIi753wsQZ7iBHHqtQUpmiEedTnuqw51bH7yB8o5HcP3SOH0TCDRdIcn4DrMNgjuL4vbr6QTGEe9vIjrBKzCPb3fpE4Qf7D/0axbdH6HNg5/64DpQxmqN44ShksefoaBVAypIughMEBhcJZUMJg/7C4cZQw+J62t+ZaalAQJa+lIihhsLyRi3m5hMH0bkQBlLyHi3i5ZNG6NQbzN+4L3BKIZ+WfgRNUVFRUVFRUVFRUVHwx+B+A1muTZbNYywAAAABJRU5ErkJggg==";

// Cache for processed logo assets reutilizado nas chamadas da capa / gráficos
var payFlyLogoCache = payFlyLogoCache || {
  colorDataUrl: null,
  grayDataUrl: null,
  dimensions: null,
  sourceUrl: null,
};

function togglePdfLoading(show) {
  if (typeof showPDFLoading === "function") {
    try {
      showPDFLoading(show);
    } catch (e) {
      // Silencia qualquer erro de UI de loading para não poluir o console
    }
  }
}

function buildWeekRange() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return `${startOfWeek.toLocaleDateString(
    "pt-BR"
  )} - ${today.toLocaleDateString("pt-BR")}`;
}

function buildMonthRange() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return `${startOfMonth.toLocaleDateString(
    "pt-BR"
  )} - ${today.toLocaleDateString("pt-BR")}`;
}

function buildSemesterRange() {
  const today = new Date();
  const sixMonthsAgo = new Date(today);
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  return `${sixMonthsAgo.toLocaleDateString(
    "pt-BR"
  )} - ${today.toLocaleDateString("pt-BR")}`;
}

function resolvePeriodRange(periodKey) {
  const calculators = {
    week: buildWeekRange,
    month: buildMonthRange,
    "6months": buildSemesterRange,
  };

  const calculator = calculators[periodKey];
  if (typeof calculator === "function") {
    try {
      return calculator();
    } catch (error) {
      console.warn("⚠️ Falha ao calcular range do periodo:", error);
    }
  }

  const legacyMap = {
    week: "getWeekRange",
    month: "getMonthRange",
    "6months": "getSemesterRange",
  };

  const legacyMethod = legacyMap[periodKey];
  if (legacyMethod && typeof window[legacyMethod] === "function") {
    try {
      return window[legacyMethod]();
    } catch (error) {
      console.warn(`⚠️ Falha ao calcular range via ${legacyMethod}:`, error);
    }
  }

  return "Periodo em analise";
}

window.getWeekRange = window.getWeekRange || buildWeekRange;
window.getMonthRange = window.getMonthRange || buildMonthRange;
window.getSemesterRange = window.getSemesterRange || buildSemesterRange;

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
    togglePdfLoading(true);

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
    await addFooterToAllPages(pdf);

    // Salva o PDF
    const fileName = `PayFly_Relatorio_${userInfo.name.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
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
    // Garante que tratamentos assíncronos do loading sejam resolvidos
    Promise.resolve().then(() => togglePdfLoading(false));
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
  // Comeca mais proximo do topo para liberar espaco para o rodape
  let currentY = 25;

  // ================ Logo PayFly ================
  const logoHeight = await drawPayFlyLogo(pdf, pageWidth / 2, currentY);
  // Espaçamento controlado abaixo da logo
  currentY += (logoHeight || 20) + 15;

  // ================ Título PayFly ================
  pdf.setFontSize(32);
  const brandPrimary = getBrandColor("primary");
  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
  pdf.text("PayFly", pageWidth / 2, currentY, { align: "center" });

  currentY += 15;
  pdf.setFontSize(16);
  const brandMuted = getBrandColor("muted", { r: 100, g: 100, b: 100 });
  pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);
  pdf.text("Plataforma de Gestao Financeira Pessoal", pageWidth / 2, currentY, {
    align: "center",
  });

  currentY += 28;

  // ================ Título do Relatório ================
  pdf.setFontSize(20);
  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
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
  pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);
  pdf.text("Email: " + userInfo.email, pageWidth / 2, currentY, {
    align: "center",
  });

  currentY += 16;

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

  currentY += 18;

  // ================ Resumo Geral ================
  const brandDark = getBrandColor("dark", { r: 24, g: 61, b: 61 });
  pdf.setDrawColor(brandDark.r, brandDark.g, brandDark.b);
  pdf.setFillColor(248, 249, 250);
  pdf.roundedRect(margin, currentY - 6, pageWidth - margin * 2, 36, 5, 5, "FD");

  currentY += 0;
  pdf.setFontSize(12);
  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
  pdf.text("Conteudo do Relatorio", margin + 10, currentY);

  currentY += 8;
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
  pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);
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

// Desenha a logo do PayFly com o ativo oficial
async function drawPayFlyLogo(pdf, centerX, centerY) {
  try {
    const logoDataUrl = await getPayFlyLogoDataUrl();
    const { width, height } = await getPayFlyLogoDimensions();

    // Mantém a proporcao original; logo maior, mas ainda com margem para o conteudo
    const maxWidth = 100;
    const maxHeight = 36;
    let drawWidth = maxWidth;
    let drawHeight = (height / width) * drawWidth;

    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = (width / height) * drawHeight;
    }

    const x = centerX - drawWidth / 2;
    const y = centerY - drawHeight / 2;

    pdf.addImage(
      logoDataUrl,
      "PNG",
      x,
      y,
      drawWidth,
      drawHeight,
      undefined,
      "FAST"
    );
    console.log("✅ Logo PayFly adicionada ao PDF");
    return drawHeight;
  } catch (error) {
    console.warn(
      "❌ Falha ao adicionar logo processada, usando fallback:",
      error
    );
    return drawFallbackLogo(pdf, centerX, centerY);
  }
}

async function getPayFlyLogoDataUrl({ grayscale = false } = {}) {
  // Garante que o cache exista mesmo se algo externo mexer na variavel
  if (!payFlyLogoCache) {
    payFlyLogoCache = {
      colorDataUrl: null,
      grayDataUrl: null,
      dimensions: null,
      sourceUrl: null,
    };
  }

  if (!grayscale && payFlyLogoCache.colorDataUrl) {
    return payFlyLogoCache.colorDataUrl;
  }

  if (grayscale && payFlyLogoCache.grayDataUrl) {
    return payFlyLogoCache.grayDataUrl;
  }

  if (!payFlyLogoCache.colorDataUrl) {
    const asset = await fetchPayFlyLogoAsset();
    if (!asset || !asset.blob) {
      throw new Error("Logo asset nao disponivel");
    }
    const { blob, sourceUrl } = asset;
    console.log("📁 Caminho da logo resolvido:", sourceUrl);

    // Se for SVG, rasteriza em alta resolucao via canvas antes de gerar o PNG
    const isSvg =
      typeof sourceUrl === "string" && sourceUrl.toLowerCase().endsWith(".svg");
    if (isSvg) {
      const svgText = await blob.text();
      payFlyLogoCache.colorDataUrl = await rasterizeSvgToPngDataUrl(svgText);
    } else {
      payFlyLogoCache.colorDataUrl = await blobToDataUrl(blob);
    }

    payFlyLogoCache.sourceUrl = sourceUrl;
  }

  if (!grayscale) {
    return payFlyLogoCache.colorDataUrl;
  }

  if (!payFlyLogoCache.grayDataUrl) {
    payFlyLogoCache.grayDataUrl = await convertImageToGrayscale(
      payFlyLogoCache.colorDataUrl
    );
  }

  return payFlyLogoCache.grayDataUrl;
}

async function fetchPayFlyLogoAsset() {
  const candidates = resolvePayFlyLogoCandidates();
  let lastError = null;

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Falha ao carregar logo (${response.status})`);
      }

      const blob = await response.blob();
      return { blob, sourceUrl: candidate };
    } catch (error) {
      lastError = error;
      console.warn("⚠️ Tentativa de carregar logo falhou em", candidate, error);
    }
  }

  console.warn(
    "⚠️ Todas as tentativas de carregar a logo falharam; usando versão embutida",
    lastError
  );

  try {
    const fallbackBlob = dataUrlToBlob(PAYFLY_EMBEDDED_LOGO_DATA_URL);
    return { blob: fallbackBlob, sourceUrl: "embedded:payfly-logo" };
  } catch (conversionError) {
    throw lastError || conversionError;
  }
}

async function getPayFlyLogoDimensions() {
  if (payFlyLogoCache.dimensions) {
    return payFlyLogoCache.dimensions;
  }

  const dataUrl = await getPayFlyLogoDataUrl();
  const img = await loadImage(dataUrl);
  payFlyLogoCache.dimensions = { width: img.width, height: img.height };
  return payFlyLogoCache.dimensions;
}

function resolvePayFlyLogoCandidates() {
  // Caminhos RELATIVOS ao app (funcionam em localhost e em /payfly no GitHub Pages)
  const relativePaths = [
    // Logo libélula em SVG (alta qualidade) - caminho corrigido sem duplicar "views/"
    "../views/imgs/pages/libelula.svg",
    // Demais variantes PNG mantidas como fallback
    "../views/imgs/pages/logo.png",
    "../views/imgs/Favicon.png",
    "../imgs/pages/logo.png",
    "../imgs/Favicon.png",
  ];

  return relativePaths;
}

async function convertImageToGrayscale(dataUrl) {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const softenedGray = Math.min(200, gray * 0.7 + 60);
    data[i] = softenedGray;
    data[i + 1] = softenedGray;
    data[i + 2] = softenedGray;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Rasteriza um SVG (texto) para PNG em alta qualidade usando canvas
async function rasterizeSvgToPngDataUrl(svgText) {
  const svgBlob = new Blob([svgText], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);

    // Define uma resolucao base generosa para manter nitidez
    const targetWidth = Math.min(img.width * 2, 800);
    const scale = targetWidth / img.width;
    const targetHeight = img.height * scale;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
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

function dataUrlToBlob(dataUrl) {
  const [header, base64Data] = dataUrl.split(",");
  if (!header || !base64Data) {
    throw new Error("Data URL inválida para conversão em blob");
  }

  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  const binary = atob(base64Data);
  const buffer = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }

  return new Blob([buffer], { type: mimeType });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function drawFallbackLogo(pdf, centerX, centerY) {
  console.log("🔄 Usando logo fallback geométrica em verde");

  try {
    const brandPrimary = getBrandColor("primary");
    const brandDark = getBrandColor("dark", { r: 24, g: 61, b: 61 });

    // Salvar estado atual
    const currentDrawColor = pdf.getDrawColor();
    const currentFillColor = pdf.getFillColor();
    const currentTextColor = pdf.getTextColor();
    const currentLineWidth = pdf.getLineWidth();

    const fallbackRadius = 18;

    // Círculo externo (borda) - Verde escuro
    pdf.setDrawColor(brandDark.r, brandDark.g, brandDark.b);
    pdf.setLineWidth(1);
    pdf.circle(centerX, centerY, fallbackRadius, "S");

    // Círculo principal (moeda) - Verde principal
    pdf.setFillColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
    pdf.circle(centerX, centerY, fallbackRadius - 3, "F");

    // Círculo interno (brilho) - BRANCO
    pdf.setFillColor(255, 255, 255);
    pdf.circle(centerX - 4, centerY - 4, 3.5, "F");

    // Símbolo $ estilizado - BRANCO
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("$", centerX, centerY + 2, { align: "center" });

    console.log("✅ Logo fallback verde desenhada com sucesso");

    // Restaurar estado anterior
    pdf.setDrawColor(currentDrawColor);
    pdf.setFillColor(currentFillColor);
    pdf.setTextColor(currentTextColor);
    pdf.setLineWidth(currentLineWidth);
    return fallbackRadius * 2;
  } catch (error) {
    console.error("❌ Erro ao desenhar logo fallback:", error);

    // Fallback mínimo: apenas um círculo preto com $
    pdf.setFillColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
    pdf.circle(centerX, centerY, 15, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text("$", centerX, centerY + 2, { align: "center" });
    return 30;
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
  const brandPrimary = getBrandColor("primary");
  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
  pdf.text(period.name, margin, currentY);

  currentY += 8;
  pdf.setFontSize(12);
  const brandMuted = getBrandColor("muted", { r: 100, g: 100, b: 100 });
  pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);
  pdf.text(period.description, margin, currentY);

  currentY += 20;

  // ================ Resumo Financeiro do Período ================
  const periodData = getPeriodData(period.key);

  // Caixa de resumo
  const brandDark = getBrandColor("dark", { r: 24, g: 61, b: 61 });
  pdf.setDrawColor(brandDark.r, brandDark.g, brandDark.b);
  pdf.setFillColor(248, 249, 250);
  pdf.roundedRect(margin, currentY - 5, pageWidth - margin * 2, 35, 3, 3, "FD");

  currentY += 5;
  pdf.setFontSize(14);
  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
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

  pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
  pdf.text(
    "Saldo: " + formatCurrency(periodData.receitas - periodData.despesas),
    margin + 120,
    currentY
  );

  currentY += 25;

  // ================ Detalhamento por Categoria ================
  if (periodData.categorias && Object.keys(periodData.categorias).length > 0) {
    pdf.setFontSize(14);
    pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
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
        pdf.text(formatCurrency(valor), pageWidth - margin - 30, currentY, {
          align: "right",
        });
        currentY += 8;
      }
    );
  } else {
    pdf.setFontSize(12);
    pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);
    pdf.text("Nenhuma movimentacao encontrada neste periodo", margin, currentY);
  }

  // ================ Observações do Período ================
  currentY += 20;

  if (currentY < pageHeight - 50) {
    pdf.setFontSize(12);
    pdf.setTextColor(brandPrimary.r, brandPrimary.g, brandPrimary.b);
    pdf.text("Observacoes", margin, currentY);

    currentY += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);

    let observations = [];
    const periodRange = resolvePeriodRange(period.key);
    if (period.key === "week") {
      observations = [
        "• Periodo analisado: " + periodRange,
        "• Dados refletem movimentacoes dos ultimos 7 dias",
        "• Valores incluem lancamentos realizados e confirmados",
      ];
    } else if (period.key === "month") {
      observations = [
        "• Periodo analisado: " + periodRange,
        "• Dados consolidados do mes atual ate a data presente",
        "• Inclui todas as categorias de receitas e despesas",
      ];
    } else if (period.key === "6months") {
      observations = [
        "• Periodo analisado: " + periodRange,
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
async function addFooterToAllPages(pdf) {
  const pageCount = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let logoDataUrl = null;
  let logoWidth = 0;
  let logoHeight = 0;

  try {
    // Rodapé sem logo para evitar qualquer problema de inicialização
    logoDataUrl = null;
    logoWidth = 0;
    logoHeight = 0;
  } catch (error) {
    console.warn("⚠️ Falha ao carregar logo para o rodape:", error);
    logoDataUrl = null;
  }

  const lineY = pageHeight - 25;
  const logoY = lineY + 4;
  const textY = logoDataUrl ? logoY + logoHeight - 1 : lineY + 7;
  const subTextY = textY + 5;
  const currentYear = new Date().getFullYear();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Linha divisória
    pdf.setDrawColor(220, 220, 220);
    pdf.line(20, lineY, pageWidth - 20, lineY);

    // Logo cinza (opcional)
    let leftTextX = 20;
    if (logoDataUrl) {
      pdf.addImage(
        logoDataUrl,
        "PNG",
        20,
        logoY,
        logoWidth,
        logoHeight,
        undefined,
        "FAST"
      );
      leftTextX = 20 + logoWidth + 4;
    }

    // Texto do rodapé
    const brandMuted = getBrandColor("muted", { r: 100, g: 100, b: 100 });
    pdf.setFontSize(8);
    pdf.setTextColor(brandMuted.r, brandMuted.g, brandMuted.b);

    // Esquerda - PayFly
    pdf.text("PayFly - Gestao Financeira Pessoal", leftTextX, textY);

    // Centro - Direitos autorais
    pdf.text(
      "(c) " + currentYear + " PayFly. Todos os direitos reservados.",
      pageWidth / 2,
      textY,
      { align: "center" }
    );

    // Direita - Página
    pdf.text("Pagina " + i + " de " + pageCount, pageWidth - 20, textY, {
      align: "right",
    });

    // Informações adicionais
    pdf.setFontSize(7);
    pdf.text("Documento confidencial - Uso pessoal", pageWidth / 2, subTextY, {
      align: "center",
    });
  }
}

// Formata valor monetário
function formatCurrency(value) {
  const numericValue = Number(value || 0);
  if (window?.formatCurrencyBRL) {
    return window.formatCurrencyBRL(numericValue);
  }

  if (!Number.isFinite(numericValue)) {
    return window?.formatCurrencyBRL
      ? window.formatCurrencyBRL(0)
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(0);
  }

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
      pdfBtn.style.background = "linear-gradient(135deg, #dc3545, #fd7e14)";
      pdfBtn.innerHTML =
        '<ion-icon name="download-outline"></ion-icon> Gerar PDF';
    }, 2000);
  }
}

// ================ Exportação ================

// Torna a função global
window.generateDashboardPDF = generateDashboardPDF;

console.log("✅ PDF Generator inicializado com sucesso!");
