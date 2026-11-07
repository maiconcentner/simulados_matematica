// Correção: nota, faixa, medalha, quanto falta, pontos fortes e fracos, plano e temas.
// Funções puras: recebem tudo por parâmetro e não leem nem gravam nada.
// As regras numéricas vêm de config.json (escala, medalhas).

const NIVEL = { N1: 1, N2: 2, N3: 3, N4: 4 };
const r1 = (v) => Math.round(v * 10 + 1e-9) / 10;
const r2 = (v) => Math.round(v * 100 + 1e-9) / 100;
export const ehProva = (sim) => sim.pontuacao?.tipo === "valores";

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

/** Questão a questão: o que foi marcado e se acertou. respostas: {"1": "A", ...} */
export function corrigirQuestoes(sim, respostas) {
  return sim.items.map((it) => {
    const marcada = respostas[String(it.n)] || null;
    return {
      n: it.n,
      code: it.code,
      level: it.level,
      valor: it.valor ?? null,
      marcada,
      correta: it.key,
      acertou: marcada === it.key,
    };
  });
}

/** Nota de 0 a 10: acertos ÷ total × 10 (Avalia) ou soma dos valores certos (prova). */
export function notaDe(sim, questoes) {
  const acertos = questoes.filter((q) => q.acertou).length;
  if (ehProva(sim)) return r2(questoes.filter((q) => q.acertou).reduce((s, q) => s + q.valor, 0));
  return r1((acertos / questoes.length) * 10);
}

/**
 * Quanto falta para a próxima faixa.
 * Avalia: o menor número de acertos a mais; prova: os pontos que faltam, pela menor
 * soma de valores de questões erradas que passa do limite da faixa atual.
 * Na faixa mais alta: null.
 */
export function faltaParaProxima(sim, questoes, nota, config) {
  const escala = config.escala;
  const i = escala.indexOf(faixaDaNota(nota, config));
  if (i === escala.length - 1) return null;
  const limite = escala[i].ate;
  const proxima = escala[i + 1];
  const erradas = questoes.filter((q) => !q.acertou);
  if (ehProva(sim)) {
    let melhor = null;
    const vals = erradas.map((q) => q.valor);
    for (let mask = 1; mask < 1 << vals.length; mask++) {
      let soma = 0;
      for (let k = 0; k < vals.length; k++) if (mask & (1 << k)) soma += vals[k];
      if (nota + soma > limite + 1e-9 && (melhor === null || soma < melhor)) melhor = soma;
    }
    if (melhor === null) return null;
    return { tipo: "pontos", quantidade: r2(melhor), faixa: proxima };
  }
  const acertos = questoes.length - erradas.length;
  for (let k = 1; k <= erradas.length; k++) {
    if (r1(((acertos + k) / questoes.length) * 10) > limite + 1e-9) return { tipo: "questoes", quantidade: k, faixa: proxima };
  }
  return null;
}

export function textoFalta(falta, faixa) {
  if (!falta) return faixa.frase;
  if (falta.tipo === "questoes") return `Acerte mais ${falta.quantidade} ${falta.quantidade === 1 ? "questão" : "questões"} para chegar ao ${falta.faixa.nivel}.`;
  const q = String(falta.quantidade).replace(".", ",");
  return `${falta.quantidade === 1 ? "Falta" : "Faltam"} ${q} ${falta.quantidade < 2 ? "ponto" : "pontos"} para o ${falta.faixa.nivel}.`;
}

/** Agrupa por habilidade (code): acertos, total, maior e menor nível, maior valor errado. */
export function porHabilidade(questoes) {
  const g = {};
  for (const q of questoes) {
    const h = (g[q.code] ||= { code: q.code, acertos: 0, total: 0, nivelMax: 0, nivelErroMin: 9, valorErroMax: 0, primeiraErrada: null });
    h.total++;
    h.nivelMax = Math.max(h.nivelMax, NIVEL[q.level] || 0);
    if (q.acertou) h.acertos++;
    else {
      h.nivelErroMin = Math.min(h.nivelErroMin, NIVEL[q.level] || 9);
      h.valorErroMax = Math.max(h.valorErroMax, q.valor || 0);
      if (!h.primeiraErrada) h.primeiraErrada = q.n;
    }
  }
  return g;
}

/** Fortes: tudo certo, nível mais alto primeiro. Fracos: algum erro, nível mais baixo primeiro (prova: desempate pelo maior valor). */
export function fortesEFracos(sim, questoes, max = 3) {
  const grupos = Object.values(porHabilidade(questoes));
  const fortes = grupos.filter((g) => g.acertos === g.total).sort((a, b) => b.nivelMax - a.nivelMax).slice(0, max);
  const fracos = grupos
    .filter((g) => g.acertos < g.total)
    .sort((a, b) => a.nivelErroMin - b.nivelErroMin || (ehProva(sim) ? b.valorErroMax - a.valorErroMax : 0))
    .slice(0, max);
  return { fortes, fracos };
}

const maiuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);

/**
 * Plano em até 3 passos, um por ponto a melhorar.
 * jaAcertou(simId, code): true se o aluno já acertou essa habilidade naquele simulado.
 */
export function montarPlano(sim, questoes, fracos, { habilidades, catalogoSims, jaAcertou }) {
  return fracos.map((f) => {
    const it = sim.items.find((i) => i.n === f.primeiraErrada);
    const q = questoes.find((x) => x.n === f.primeiraErrada);
    const opcao = q.marcada ? it.options.find((o) => o.letter === q.marcada) : null;
    const outro = catalogoSims.find((s) => s.id !== sim.id && (sim.gerado?.base ? s.id !== sim.gerado.base : true) && (s.status || "publicado") === "publicado" && s.habilidades.includes(f.code) && !jaAcertou(s.id, f.code));
    return {
      code: f.code,
      nome: habilidades[f.code]?.nome || it.short,
      questao: it.n,
      erro: opcao ? opcao.why : "Ficou em branco. Tente de novo com a dica abaixo.",
      marcada: q.marcada,
      dica: maiuscula(sim.dicas?.[f.code] || habilidades[f.code]?.dica || ""),
      outro: outro ? { id: outro.id, titulo: outro.semana ? `Semana ${outro.semana}` : outro.titulo } : null,
    };
  });
}

/** Acertos por tema neste simulado: {tema: {acertos, total}}. */
export function porTema(questoes, habilidades) {
  const t = {};
  for (const q of questoes) {
    const tema = habilidades[q.code]?.tema;
    if (!tema) continue;
    const x = (t[tema] ||= { acertos: 0, total: 0 });
    x.total++;
    if (q.acertou) x.acertos++;
  }
  return t;
}

/** Acumulado por tema a partir do resumo por habilidade de várias tentativas. */
export function temasAcumulados(tentativas, habilidades) {
  const t = {};
  for (const tent of tentativas) {
    for (const [code, g] of Object.entries(tent.porHabilidade || {})) {
      const tema = habilidades[code]?.tema;
      if (!tema) continue;
      const x = (t[tema] ||= { acertos: 0, total: 0 });
      x.acertos += g.acertos;
      x.total += g.total;
    }
  }
  return t;
}

/** Correção completa de uma entrega. */
export function corrigir(sim, respostas, { config, habilidades, catalogoSims = [], jaAcertou = () => false }) {
  const questoes = corrigirQuestoes(sim, respostas);
  const acertos = questoes.filter((q) => q.acertou).length;
  const total = questoes.length;
  const nota = notaDe(sim, questoes);
  const percentual = ehProva(sim) ? r2(nota * 10) : r2((acertos / total) * 100);
  const faixa = faixaDaNota(nota, config);
  const medalha = medalhaDoPercentual(percentual, config);
  const falta = faltaParaProxima(sim, questoes, nota, config);
  const { fortes, fracos } = fortesEFracos(sim, questoes);
  const plano = montarPlano(sim, questoes, fracos, { habilidades, catalogoSims, jaAcertou });
  const resumo = {};
  for (const g of Object.values(porHabilidade(questoes))) resumo[g.code] = { acertos: g.acertos, total: g.total };
  return { questoes, acertos, total, nota, percentual, faixa, medalha, falta, textoFalta: textoFalta(falta, faixa), fortes, fracos, plano, porHabilidade: resumo, porTema: porTema(questoes, habilidades) };
}
