// Progresso do aluno, guardado só no navegador (localStorage), numa chave só.
// Toda leitura e escrita fica dentro de try/catch: sem armazenamento (janela anônima,
// bloqueio), o site funciona com os dados em memória e avisa que nada será guardado.

export const CHAVE = "simulados-mat:v1";
export const VERSAO = 1;
const MAX_GERADOS = 12;

const hoje = () => new Date().toISOString().slice(0, 10);

export function estadoInicial() {
  return {
    versao: VERSAO,
    perfil: { apelido: "", criadoEm: hoje() },
    tentativas: [],
    emAndamento: {},
    xp: 0,
    conquistas: {},
    missao: null,
    diasDeUso: [],
    treino: {},
    gerados: [],
  };
}

/** Completa campos que faltam e migra versões antigas, sem apagar o que existe. */
export function migrar(dados) {
  const base = estadoInicial();
  if (!dados || typeof dados !== "object") return base;
  const e = { ...base, ...dados };
  e.perfil = { ...base.perfil, ...(dados.perfil || {}) };
  for (const k of ["tentativas", "diasDeUso", "gerados"]) if (!Array.isArray(e[k])) e[k] = [];
  for (const k of ["emAndamento", "conquistas", "treino"]) if (!e[k] || typeof e[k] !== "object") e[k] = {};
  if (typeof e.xp !== "number" || !Number.isFinite(e.xp)) e.xp = 0;
  e.versao = VERSAO;
  return e;
}

let memoria = null;
let disponivel = null;

/** true se o navegador deixa guardar dados. */
export function armazenamentoDisponivel() {
  if (disponivel !== null) return disponivel;
  try {
    const t = "__teste_simulados__";
    localStorage.setItem(t, "1");
    localStorage.removeItem(t);
    disponivel = true;
  } catch {
    disponivel = false;
  }
  return disponivel;
}

export function ler() {
  if (memoria) return memoria;
  let dados = null;
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (bruto) dados = JSON.parse(bruto);
  } catch {
    dados = null;
  }
  memoria = migrar(dados);
  return memoria;
}

export function salvar(estado) {
  memoria = estado;
  try {
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}

/** Aplica uma mudança e salva: atualizar((e) => { e.xp += 10; }). */
export function atualizar(mudanca) {
  const e = ler();
  mudanca(e);
  salvar(e);
  return e;
}

export function apagarTudo() {
  memoria = estadoInicial();
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: só a memória é zerada */
  }
  return memoria;
}

/* ---------- simulados gerados pelo aluno ---------- */
export function guardarGerado(sim) {
  return atualizar((e) => {
    e.gerados = [sim, ...e.gerados.filter((g) => g.id !== sim.id)].slice(0, MAX_GERADOS);
  });
}
export function removerGerado(id) {
  return atualizar((e) => {
    e.gerados = e.gerados.filter((g) => g.id !== id);
    delete e.emAndamento[id];
  });
}
export const buscarGerado = (id) => ler().gerados.find((g) => g.id === id) || null;

/** só para os testes: esquece a cópia em memória */
export function _recarregar() {
  memoria = null;
  disponivel = null;
}
