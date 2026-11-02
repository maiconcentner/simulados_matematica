// Correção: faixa da nota e medalha (funções puras, lidas de config.json).
// A nota, os pontos fortes e fracos e o plano entram na fase 3.

/** Primeira faixa de config.escala em que nota ≤ ate. */
export function faixaDaNota(nota, config) {
  const escala = config.escala;
  return escala.find((f) => nota <= f.ate + 1e-9) || escala[escala.length - 1];
}

/** Maior medalha com percentual ≥ min_percentual; abaixo da primeira, nenhuma. */
export function medalhaDoPercentual(percentual, config) {
  const ordenadas = [...config.medalhas].sort((a, b) => a.min_percentual - b.min_percentual);
  let m = null;
  for (const med of ordenadas) if (percentual >= med.min_percentual - 1e-9) m = med;
  return m;
}
