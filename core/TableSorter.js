// =====================================================
// SISTEMA DE ORDENAÇÃO DE TABELAS - PayFly
// Autor: Sistema
// Data: Dezembro 2025
// =====================================================

/**
 * Sistema de ordenação genérico para tabelas do PayFly
 * Funciona com qualquer tabela que tenha cabeçalhos com classe "sortable"
 */

// Estado global de ordenação
let currentSortColumn = null;
let currentSortDirection = "none"; // 'asc', 'desc', 'none'

/**
 * Ordena a tabela pelo nome da coluna
 * @param {string} column - Nome da coluna (data-column do th)
 */
function sortTable(column) {
  const table = document.getElementById("data-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  if (rows.length === 0) return;

  // Determina a direção da ordenação
  if (currentSortColumn === column) {
    // Alterna entre: asc -> desc -> none
    if (currentSortDirection === "asc") {
      currentSortDirection = "desc";
    } else if (currentSortDirection === "desc") {
      currentSortDirection = "none";
    } else {
      currentSortDirection = "asc";
    }
  } else {
    currentSortColumn = column;
    currentSortDirection = "asc";
  }

  // Atualiza os ícones visuais
  updateSortIcons(column, currentSortDirection);

  // Se for 'none', recarrega os dados na ordem original
  if (currentSortDirection === "none") {
    // Tenta chamar a função de reload específica da página
    if (typeof reloadDataRespectingFilter === "function") {
      reloadDataRespectingFilter();
    } else if (typeof reloadDespesaDataRespectingFilter === "function") {
      reloadDespesaDataRespectingFilter();
    } else if (typeof reloadPoupancaDataRespectingFilter === "function") {
      reloadPoupancaDataRespectingFilter();
    } else if (typeof reloadInvestimentoDataRespectingFilter === "function") {
      reloadInvestimentoDataRespectingFilter();
    } else if (typeof reloadPlanoDataRespectingFilter === "function") {
      reloadPlanoDataRespectingFilter();
    } else if (typeof loadReceitasFromSupabase === "function") {
      loadReceitasFromSupabase();
    } else if (typeof loadDespesasFromSupabase === "function") {
      loadDespesasFromSupabase();
    } else if (typeof loadPoupancaFromSupabase === "function") {
      loadPoupancaFromSupabase();
    } else if (typeof loadInvestimentosFromSupabase === "function") {
      loadInvestimentosFromSupabase();
    } else if (typeof loadPlanosFromSupabase === "function") {
      loadPlanosFromSupabase();
    }
    return;
  }

  // Encontra o índice da coluna pelo data-column
  const headers = table.querySelectorAll("thead th");
  let colIdx = -1;
  headers.forEach((th, index) => {
    if (th.dataset.column === column) {
      colIdx = index;
    }
  });

  if (colIdx === -1) return;

  // Determina o tipo de dado da coluna
  const columnType = getColumnType(column);

  // Ordena as linhas
  rows.sort((a, b) => {
    let aValue = a.cells[colIdx]?.textContent?.trim() || "";
    let bValue = b.cells[colIdx]?.textContent?.trim() || "";

    // Tratamento por tipo de coluna
    switch (columnType) {
      case "currency":
        // Remove formatação de moeda e converte para número
        aValue = parseCurrency(aValue);
        bValue = parseCurrency(bValue);
        return currentSortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;

      case "percentage":
        // Remove % e converte para número
        aValue =
          parseFloat(aValue.replace(/[%\s]/g, "").replace(",", ".")) || 0;
        bValue =
          parseFloat(bValue.replace(/[%\s]/g, "").replace(",", ".")) || 0;
        return currentSortDirection === "asc"
          ? aValue - bValue
          : bValue - aValue;

      case "date":
        // Converte data DD/MM/YYYY para comparação
        const aDate = parseDate(aValue);
        const bDate = parseDate(bValue);
        return currentSortDirection === "asc" ? aDate - bDate : bDate - aDate;

      default:
        // Ordenação alfabética para texto
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        if (aValue < bValue) return currentSortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === "asc" ? 1 : -1;
        return 0;
    }
  });

  // Reinsere as linhas ordenadas
  rows.forEach((row) => tbody.appendChild(row));
}

/**
 * Determina o tipo de dado da coluna para ordenação correta
 * @param {string} column - Nome da coluna
 * @returns {string} - Tipo: 'currency', 'date', 'percentage', 'text'
 */
function getColumnType(column) {
  const currencyColumns = ["valor", "valor_investido", "valor_atual"];
  const dateColumns = ["data"];
  const percentageColumns = ["rentabilidade"];

  if (currencyColumns.includes(column)) return "currency";
  if (dateColumns.includes(column)) return "date";
  if (percentageColumns.includes(column)) return "percentage";
  return "text";
}

/**
 * Converte valor de moeda formatado para número
 * @param {string} value - Valor formatado (ex: "R$ 1.234,56")
 * @returns {number} - Valor numérico
 */
function parseCurrency(value) {
  // Remove R$, espaços e pontos de milhar, troca vírgula por ponto
  return (
    parseFloat(
      value
        .replace(/[R$\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
}

/**
 * Converte data DD/MM/YYYY para objeto Date
 * @param {string} dateStr - Data formatada
 * @returns {Date} - Objeto Date
 */
function parseDate(dateStr) {
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }
  return new Date(0);
}

/**
 * Atualiza os ícones visuais de ordenação nos cabeçalhos
 * @param {string} activeColumn - Coluna atualmente ordenada
 * @param {string} direction - Direção: 'asc', 'desc', 'none'
 */
function updateSortIcons(activeColumn, direction) {
  document.querySelectorAll("#data-table thead th.sortable").forEach((th) => {
    const icon = th.querySelector(".sort-icon");
    if (icon) {
      const col = th.dataset.column;
      if (col === activeColumn) {
        if (direction === "asc") {
          icon.textContent = "↑";
          icon.classList.add("active");
        } else if (direction === "desc") {
          icon.textContent = "↓";
          icon.classList.add("active");
        } else {
          icon.textContent = "⇅";
          icon.classList.remove("active");
        }
      } else {
        icon.textContent = "⇅";
        icon.classList.remove("active");
      }
    }
  });
}

/**
 * Reseta o estado de ordenação (usar quando limpar filtros ou recarregar dados)
 */
function resetSortState() {
  currentSortColumn = null;
  currentSortDirection = "none";
  updateSortIcons(null, "none");
}

// Expor funções globalmente
window.sortTable = sortTable;
window.updateSortIcons = updateSortIcons;
window.resetSortState = resetSortState;

console.log("📊 Sistema de ordenação de tabelas carregado");
