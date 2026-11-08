// Plano até a prova (Simulado Completo, planejamento/simulado_completo_etapa3.md, item 4).
// Conta os dias de hoje até a data da prova, sem passar de 5, e distribui as habilidades
// a melhorar, a mais fraca primeiro. Funções puras.

const DIA = 86400000;
const paraDia = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

/** Dias de estudo até a prova: de hoje até a véspera (data da prova 18/11, hoje 15/11: 3 dias). Máximo 5. */
export function diasAteAProva(dataProva, hoje) {
  if (!dataProva) return 0;
  const n = Math.round((paraDia(dataProva) - paraDia(hoje)) / DIA);
  return Math.max(0, Math.min(5, n));
}

const NOMES_DIA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * Plano dia a dia. fracos: habilidades a melhorar já em ordem (a mais fraca primeiro),
 * cada uma { code, nome, dica, treinar }. Devolve [] se a prova já passou ou não há o que treinar.
 */
export function planoAteAProva({ dataProva, hoje, fracos }) {
  const dias = diasAteAProva(dataProva, hoje);
  if (!dias || !fracos.length) return [];
  const plano = [];
  const porDia = Math.ceil(fracos.length / dias);
  for (let d = 0; d < dias; d++) {
    const habs = fracos.slice(d * porDia, (d + 1) * porDia);
    const data = new Date(paraDia(hoje) + d * DIA);
    const rotulo = d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `${NOMES_DIA[data.getUTCDay()][0].toUpperCase()}${NOMES_DIA[data.getUTCDay()].slice(1)}`;
    plano.push({
      dia: d + 1,
      rotulo,
      data: `${String(data.getUTCDate()).padStart(2, "0")}/${String(data.getUTCMonth() + 1).padStart(2, "0")}`,
      habilidades: habs,
      revisao: !habs.length, // sobrou dia: revisão geral
    });
  }
  return plano;
}
