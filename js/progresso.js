// Situação do aluno em cada simulado, a partir das tentativas guardadas.
import { medalhaDoPercentual } from "./correcao.js?v=57517fb455";

export const tentativasDe = (estado, simId, modo = "simulado") =>
  estado.tentativas.filter((t) => t.simId === simId && t.modo === modo);

export function melhorTentativa(estado, simId) {
  let m = null;
  for (const t of tentativasDe(estado, simId)) if (!m || t.nota > m.nota) m = t;
  return m;
}

const percentualDe = (t) => (typeof t.percentual === "number" ? t.percentual : t.nota * 10);

/**
 * novo: nunca entregou; andamento: começou e não entregou;
 * feito: melhor nota 7 ou mais; melhorar: melhor nota abaixo de 7.
 */
export function situacao(estado, simId, config) {
  const m = melhorTentativa(estado, simId);
  const andamento = !!estado.emAndamento[simId];
  if (!m) return { tipo: andamento ? "andamento" : "novo", andamento };
  const medalha = medalhaDoPercentual(percentualDe(m), config);
  return { tipo: m.nota < 7 ? "melhorar" : "feito", nota: m.nota, medalha, andamento };
}
