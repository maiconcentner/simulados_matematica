// Entrega de um simulado: corrige, guarda a tentativa, monta a missão e abre o resultado.
import { ler, atualizar } from "./armazenamento.js";
import { corrigir } from "./correcao.js";
import { simuladosDoCatalogo } from "./dados.js";

/** Tudo o que a correção precisa saber do catálogo e do histórico do aluno. */
export function contextoCorrecao(base, estado) {
  return {
    config: base.config,
    habilidades: base.habilidades,
    catalogoSims: simuladosDoCatalogo(base.catalogo),
    jaAcertou: (simId, code) =>
      estado.tentativas.some((t) => t.simId === simId && t.porHabilidade?.[code] && t.porHabilidade[code].acertos === t.porHabilidade[code].total),
  };
}

export function entregarSimulado(sim, base) {
  const estado = ler();
  const andamento = estado.emAndamento[sim.id] || { respostas: {}, inicio: new Date().toISOString() };
  const res = corrigir(sim, andamento.respostas, contextoCorrecao(base, estado));
  const tentativa = {
    simId: sim.id,
    modo: "simulado",
    inicio: andamento.inicio,
    fim: new Date().toISOString(),
    respostas: { ...andamento.respostas },
    acertos: res.acertos,
    total: res.total,
    nota: res.nota,
    percentual: res.percentual,
    porHabilidade: res.porHabilidade,
    xp: 0,
  };
  atualizar((e) => {
    e.tentativas.push(tentativa);
    delete e.emAndamento[sim.id];
    e.missao = res.plano.length ? { origem: sim.id, passos: res.plano.map((p) => ({ code: p.code, feito: false })) } : null;
  });
  return { tentativa, res };
}
