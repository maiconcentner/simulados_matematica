// Gamificação: XP, nível do jogador, título, conquistas e sequência de dias.
// Funções puras; todos os números vêm de config.json.

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
export const hojeISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Dias seguidos de uso até hoje (ou até ontem, se hoje ainda não teve treino). */
export function sequenciaDeDias(diasDeUso, hoje = hojeISO()) {
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

export function registrarDia(diasDeUso, hoje = hojeISO()) {
  return diasDeUso.includes(hoje) ? diasDeUso : [...diasDeUso, hoje].sort().slice(-400);
}

/** Maior sequência de acertos seguidos, na ordem das questões. */
export function maiorSequencia(questoes) {
  let atual = 0, maior = 0;
  for (const q of questoes) {
    atual = q.acertou ? atual + 1 : 0;
    maior = Math.max(maior, atual);
  }
  return maior;
}

/** XP que uma questão certa vale: pelo nível (Avalia) ou valor × prova_por_ponto (prova). */
export function xpDaQuestao(item, prova, config) {
  return prova ? Math.round(item.valor * config.xp.prova_por_ponto) : config.xp.acerto_por_nivel[item.level] || 0;
}

/**
 * XP cheio de uma entrega: acertos + concluir + nota 8 ou mais + combo
 * (bônus para cada acerto a partir do terceiro seguido).
 */
export function xpDoSimulado(sim, questoes, nota, config) {
  const prova = sim.pontuacao?.tipo === "valores";
  const x = config.xp;
  let acertos = 0, combo = 0, seguidos = 0;
  questoes.forEach((q, i) => {
    if (q.acertou) {
      acertos += xpDaQuestao(sim.items[i], prova, config);
      seguidos++;
      if (seguidos >= x.combo_a_partir_de) combo += x.combo_bonus_por_acerto;
    } else seguidos = 0;
  });
  const concluir = x.concluir_simulado;
  const nota8 = nota >= 8 - 1e-9 ? x.nota_8_ou_mais : 0;
  return { acertos, concluir, nota8, combo, total: acertos + concluir + nota8 + combo };
}

/**
 * XP ganho de fato numa entrega.
 * Primeira vez: o XP cheio. Refazendo: só o que subir em relação à melhor tentativa
 * anterior (se a nota não subir, nada). Treino gerado: refazer_fator do XP cheio.
 */
export function xpGanho(cheio, { anteriores = [], nota, gerado = false }, config) {
  if (gerado) return Math.round(cheio.total * config.xp.refazer_fator);
  if (!anteriores.length) return cheio.total;
  const melhorNota = Math.max(...anteriores.map((t) => t.nota));
  if (nota <= melhorNota + 1e-9) return 0;
  const melhorXp = Math.max(...anteriores.map((t) => t.xpCheio ?? 0));
  return Math.max(0, cheio.total - melhorXp);
}

/** Lista das conquistas possíveis, com a de tema aberta em uma por tema. */
export function listaDeConquistas(config) {
  return config.conquistas.flatMap((c) =>
    c.id === "especialista_tema"
      ? config.temas.map((t) => ({ id: `${c.id}:${t}`, nome: c.nome.replace("{tema}", t), regra: c.regra.replace("um tema (uma conquista por tema)", t) }))
      : [{ id: c.id, nome: c.nome, regra: c.regra }],
  );
}
export function nomeDaConquista(id, config) {
  return listaDeConquistas(config).find((c) => c.id === id)?.nome || id;
}

/**
 * Conquistas que passam a valer depois de uma entrega (ou de um treino).
 * estado: o estado já com a tentativa nova guardada.
 * ctx: { config, habilidades, avaliaPublicados: [ids], ehProva(simId), tentativa, anterior, maiorSeq, hoje }
 */
export function conquistasNovas(estado, ctx) {
  const { config, habilidades, avaliaPublicados = [], ehProva = () => false, tentativa, anterior, maiorSeq = 0, hoje = hojeISO() } = ctx;
  const tem = (id) => !!estado.conquistas[id];
  const novas = [];
  const add = (id, cond) => { if (cond && !tem(id) && !novas.includes(id)) novas.push(id); };
  const simulados = estado.tentativas.filter((t) => t.modo === "simulado");

  add("primeira_missao", simulados.length >= 1);
  if (tentativa && tentativa.modo === "simulado") {
    add("gabaritou", tentativa.acertos === tentativa.total);
    add("sequencia_5", maiorSeq >= 5);
    add("volta_por_cima", anterior && tentativa.nota - anterior.nota >= 2 - 1e-9);
    add("prova_pronta", ehProva(tentativa.simId) && tentativa.nota >= 7 - 1e-9);
  }
  // 3 simulados diferentes concluídos em até 7 dias
  const limite = paraData(hoje) - 6 * DIA;
  const recentes = new Set(simulados.filter((t) => t.fim && paraData(t.fim.slice(0, 10)) >= limite).map((t) => t.simId));
  add("maratona", recentes.size >= 3);
  add("persistente", sequenciaDeDias(estado.diasDeUso, hoje) >= 3);
  const feitos = new Set(simulados.map((t) => t.simId));
  add("todas_as_semanas", avaliaPublicados.length > 0 && avaliaPublicados.every((id) => feitos.has(id)));
  // especialista: 80% ou mais em pelo menos 5 questões do tema
  const porTema = {};
  for (const t of simulados) {
    for (const [code, g] of Object.entries(t.porHabilidade || {})) {
      const tema = habilidades[code]?.tema;
      if (!tema) continue;
      const x = (porTema[tema] ||= { a: 0, n: 0 });
      x.a += g.acertos;
      x.n += g.total;
    }
  }
  for (const tema of config.temas) {
    const x = porTema[tema];
    add(`especialista_tema:${tema}`, x && x.n >= 5 && x.a / x.n >= 0.8 - 1e-9);
  }
  // só ids que existem no config
  const validas = new Set(listaDeConquistas(config).map((c) => c.id));
  return novas.filter((id) => validas.has(id));
}
