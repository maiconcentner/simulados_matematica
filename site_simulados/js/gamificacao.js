// Gamificação: nível do jogador, título e sequência de dias.
// Todos os números vêm de config.json. O ganho de XP e as conquistas entram na fase 4.

/** Nível = 1 + XP ÷ xp_por_nivel_do_jogador (parte inteira), com o título do nível. */
export function nivelDoJogador(xp, config) {
  const porNivel = config.xp.xp_por_nivel_do_jogador;
  const total = Math.max(0, Math.floor(xp || 0));
  const nivel = 1 + Math.floor(total / porNivel);
  const titulos = [...config.titulos_do_jogador].sort((a, b) => a.a_partir_do_nivel - b.a_partir_do_nivel);
  let titulo = titulos[0]?.titulo || "";
  for (const t of titulos) if (nivel >= t.a_partir_do_nivel) titulo = t.titulo;
  const noNivel = total % porNivel;
  return { nivel, titulo, xp: total, noNivel, porNivel, falta: porNivel - noNivel };
}

const DIA = 86400000;
const paraData = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));

/**
 * Dias seguidos de uso até hoje (ou até ontem, se hoje ainda não teve treino).
 * diasDeUso: lista de "AAAA-MM-DD".
 */
export function sequenciaDeDias(diasDeUso, hoje = new Date().toISOString().slice(0, 10)) {
  const dias = new Set(diasDeUso || []);
  let d = paraData(hoje);
  if (!dias.has(hoje)) d -= DIA;
  let n = 0;
  while (dias.has(new Date(d).toISOString().slice(0, 10))) {
    n++;
    d -= DIA;
  }
  return n;
}
