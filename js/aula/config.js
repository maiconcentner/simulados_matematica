// Configuração das páginas de aula (simulado.html e completo.html).
// O professor cola aqui a URL do App da Web do Apps Script (termina em /exec).
// Ver README, "Páginas de aula: planilha do professor".
export const URL_DA_PLANILHA = "https://script.google.com/macros/s/AKfycbwXnZfCqA_VD_7EmXkC0iEllMRkBAsKy1sxxMWwJuO0Gsh9e-QMcXsFf0upmY10MwMepw/exec";

// Antes desta data (no relógio do computador), o resultado não mostra a alternativa
// correta nem a revisão por questão. No modo treino, a correção na hora vale sempre.
export const LIBERAR_REVISAO_EM = "2026-11-11";

// Turmas aceitas (a planilha confere de novo).
export const TURMAS = ["9A", "9B", "9C"];
