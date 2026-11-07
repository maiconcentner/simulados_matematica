// Entrega de um simulado: corrige, calcula XP e conquistas, guarda a tentativa,
// monta a missão e registra o dia de uso.
import { ler, atualizar } from "./armazenamento.js";
import { corrigir, faixaDaNota } from "./correcao.js";
import { simuladosDoCatalogo, disponivelAgora } from "./dados.js";
import { xpDoSimulado, xpGanho, nivelDoJogador, registrarDia, conquistasNovas, maiorSequencia, hojeISO } from "./gamificacao.js";

/** Tudo o que a correção precisa saber do catálogo e do histórico do aluno. */
export function contextoCorrecao(base, estado) {
  return {
    config: base.config,
    habilidades: base.habilidades,
    catalogoSims: simuladosDoCatalogo(base.catalogo).filter((s) => disponivelAgora(s)),
    jaAcertou: (simId, code) =>
      estado.tentativas.some((t) => t.simId === simId && t.porHabilidade?.[code] && t.porHabilidade[code].acertos === t.porHabilidade[code].total),
  };
}

/** Contexto das conquistas: quais simulados existem e quais são de prova. */
export function contextoConquistas(base, estado) {
  const sims = simuladosDoCatalogo(base.catalogo);
  const prova = new Set(sims.filter((s) => s.area === "prova").map((s) => s.id));
  return {
    config: base.config,
    habilidades: base.habilidades,
    avaliaPublicados: sims.filter((s) => s.area === "avalia" && s.status === "publicado").map((s) => s.id),
    ehProva: (id) => prova.has(id) || estado.gerados.some((g) => g.id === id && g.pontuacao?.tipo === "valores"),
    hoje: hojeISO(),
  };
}

export function entregarSimulado(sim, base) {
  const { config } = base;
  const estado = ler();
  const andamento = estado.emAndamento[sim.id] || { respostas: {}, inicio: new Date().toISOString() };
  const res = corrigir(sim, andamento.respostas, contextoCorrecao(base, estado));
  const anteriores = estado.tentativas.filter((t) => t.simId === sim.id && t.modo === "simulado");
  const anterior = anteriores[anteriores.length - 1] || null;
  const melhorAntes = anteriores.reduce((m, t) => (!m || t.nota > m.nota ? t : m), null);

  const cheio = xpDoSimulado(sim, res.questoes, res.nota, config);
  const ganho = xpGanho(cheio, { anteriores, nota: res.nota, gerado: sim.area === "gerado" }, config);
  const xpAntes = estado.xp;
  const nivelAntes = nivelDoJogador(xpAntes, config);
  const nivelDepois = nivelDoJogador(xpAntes + ganho, config);
  const ordem = config.escala.map((f) => f.nivel);
  const iFaixa = ordem.indexOf(res.faixa.nivel);
  const iAntes = melhorAntes ? ordem.indexOf(faixaDaNota(melhorAntes.nota, config).nivel) : -1;

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
    xp: ganho,
    xpCheio: cheio.total,
    detalheXp: { ...cheio, motivo: sim.area === "gerado" ? "gerado" : anteriores.length ? "refazer" : "primeira" },
    xpAntes,
    subiuNivel: nivelDepois.nivel > nivelAntes.nivel ? { nivel: nivelDepois.nivel, titulo: nivelDepois.titulo } : null,
    subiuFaixa: iFaixa >= 2 && iFaixa > iAntes,
    conquistasNovas: [],
  };

  atualizar((e) => {
    e.tentativas.push(tentativa);
    delete e.emAndamento[sim.id];
    e.missao = res.plano.length ? { origem: sim.id, passos: res.plano.map((p) => ({ code: p.code, feito: false })) } : null;
    e.xp += ganho;
    e.diasDeUso = registrarDia(e.diasDeUso);
    const novas = conquistasNovas(e, { ...contextoConquistas(base, e), tentativa, anterior, maiorSeq: maiorSequencia(res.questoes) });
    for (const id of novas) e.conquistas[id] = hojeISO();
    tentativa.conquistasNovas = novas;
  });
  return { tentativa, res };
}
