// Gerador de simulados de treino: monta simulados novos, no mesmo formato dos JSON,
// sorteando números e contextos a partir dos modelos de cada questão.
import { criarSorteio, novaSemente, Repetir, chave, problemasDoItem } from "./base.js?v=0bc7986d38";
import { modelos as m1 } from "./modelos_avalia_1.js?v=0bc7986d38";
import { modelos as m2 } from "./modelos_avalia_2.js?v=0bc7986d38";
import { modelos as m3 } from "./modelos_prova.js?v=0bc7986d38";

export const MODELOS = [...m1, ...m2, ...m3];
const PORID = new Map(MODELOS.map((m) => [m.id, m]));
const NIVEL = { N1: 1, N2: 2, N3: 3, N4: 4 };

export const modeloPorId = (id) => PORID.get(id);

/** Simulado do catálogo de onde vem um modelo ("E3-AV2-6" → "E3-AV2"). */
export const origemDoModelo = (m) => m.id.replace(/-\d+$/, "");

/** Códigos de habilidade que o gerador sabe treinar (sem os modelos de simulados fechados). */
export const codigosComModelo = (excluirSims = new Set()) =>
  [...new Set(MODELOS.filter((m) => !excluirSims.has(origemDoModelo(m))).map((m) => m.code))];

/** Um simulado do catálogo pode ganhar versão nova se todas as questões têm modelo. */
export function temVersaoNova(simId, nQuestoes) {
  for (let i = 1; i <= nQuestoes; i++) if (!PORID.has(`${simId}-${i}`)) return false;
  return true;
}

/** Gera uma questão a partir de um modelo, tentando de novo quando o sorteio não serve. */
export function gerarQuestao(modelo, r, tentativas = 400) {
  let ultimo;
  for (let t = 0; t < tentativas; t++) {
    try {
      const q = modelo.gerar(r);
      const item = { table: null, ...q };
      if (!item.figure) delete item.figure;
      item.key = chave(item.options);
      item.code = modelo.code;
      item.level = modelo.level;
      const p = problemasDoItem(item);
      if (p.length) throw new Repetir(p.join(", "));
      return item;
    } catch (e) {
      if (!(e instanceof Repetir)) throw e;
      ultimo = e;
    }
  }
  throw new Error(`O modelo ${modelo.id} não conseguiu gerar uma questão (${ultimo?.message}).`);
}

const idDaSemente = (s) => "G-" + s.toString(36).toUpperCase();
const hoje = () => new Date().toISOString().slice(0, 10);

/**
 * Versão nova de um simulado do catálogo: mesmas habilidades, níveis e pesos,
 * na mesma ordem, com números e contextos novos.
 * base: o JSON completo do simulado (para copiar papel, valor e dicas de cada questão).
 */
export function gerarVersao(base, semente = novaSemente()) {
  const r = criarSorteio(semente);
  const prova = base.pontuacao?.tipo === "valores";
  const items = base.items.map((orig) => {
    const modelo = PORID.get(`${base.id}-${orig.n}`);
    if (!modelo) throw new Error(`Sem modelo para ${base.id}-${orig.n}`);
    const q = gerarQuestao(modelo, r);
    return {
      n: orig.n,
      role: orig.role,
      ...(prova ? { valor: orig.valor } : {}),
      descriptor: orig.descriptor,
      modelo: modelo.id,
      ...q,
      code: orig.code,
      level: orig.level,
    };
  });
  const titulo = base.semana ? `Semana ${base.semana} · versão de treino` : `${base.titulo} · versão de treino`;
  return {
    id: idDaSemente(semente),
    area: "gerado",
    titulo,
    subtitulo: "Mesmas habilidades e níveis, com números e situações novas.",
    temas: base.temas,
    etapa: base.etapa,
    semana: base.semana ?? null,
    status: "publicado",
    pontuacao: base.pontuacao,
    dicas: base.dicas || {},
    items,
    gerado: { tipo: "versao", base: base.id, semente, criadoEm: hoje() },
  };
}

/**
 * Simulado montado pelo aluno: escolhe as habilidades (códigos) e o número de questões.
 * As questões ficam do nível mais fácil para o mais difícil.
 */
export function gerarMisto({ codigos, quantidade = 6, habilidades = {}, semente = novaSemente(), excluirSims = new Set() }) {
  const r = criarSorteio(semente);
  const disponiveis = MODELOS.filter((m) => codigos.includes(m.code) && !excluirSims.has(origemDoModelo(m)));
  if (!disponiveis.length) throw new Error("Nenhuma habilidade escolhida tem gerador.");
  const porCodigo = new Map();
  for (const m of disponiveis) {
    if (!porCodigo.has(m.code)) porCodigo.set(m.code, []);
    porCodigo.get(m.code).push(m);
  }
  // reveza os códigos, para cobrir todos antes de repetir; evita repetir o mesmo modelo
  const escolhidos = [];
  const usados = new Map();
  let fila = [];
  while (escolhidos.length < quantidade) {
    if (!fila.length) fila = r.embaralhar([...porCodigo.keys()]);
    const code = fila.shift();
    const opcoes = porCodigo.get(code);
    const vezes = usados.get(code) || 0;
    const livres = r.embaralhar(opcoes);
    escolhidos.push(livres[vezes % livres.length]);
    usados.set(code, vezes + 1);
  }
  escolhidos.sort((a, b) => NIVEL[a.level] - NIVEL[b.level]);
  const items = escolhidos.map((modelo, i) => ({
    n: i + 1,
    code: modelo.code,
    role: "Treino",
    level: modelo.level,
    descriptor: habilidades[modelo.code]?.descricao || "",
    modelo: modelo.id,
    ...gerarQuestao(modelo, r),
  }));
  const nomes = [...porCodigo.keys()].map((c) => habilidades[c]?.nome || c);
  const temas = [...new Set([...porCodigo.keys()].map((c) => habilidades[c]?.tema).filter(Boolean))];
  return {
    id: idDaSemente(semente),
    area: "gerado",
    titulo: "Meu treino",
    subtitulo: nomes.length <= 3 ? nomes.join(", ") : `${nomes.length} habilidades`,
    temas: temas.join(", "),
    etapa: null,
    semana: null,
    status: "publicado",
    pontuacao: { tipo: "acertos" },
    dicas: {},
    items,
    gerado: { tipo: "misto", codigos: [...porCodigo.keys()], semente, criadoEm: hoje() },
  };
}
