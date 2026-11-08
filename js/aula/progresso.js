// Progresso de cada aluno em cada parte, no localStorage, com chave por turma, nome, id e parte.
// E a ordem embaralhada das questões, com semente fixa (a mesma em qualquer computador).
import { criarSorteio } from "../gerador/base.js";

const PREFIXO = "simulados-aula:v1:";
const ALUNO = "simulados-aula:aluno";

/** Hash FNV-1a de 32 bits (semente da ordem). */
export function hash(texto) {
  let h = 0x811c9dc5;
  for (const ch of String(texto)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Ordem das questões da parte para este aluno (números originais `n`). */
export function ordemDaParte(questoes, { turma, nome, id, parte }) {
  const semente = hash(`${turma}|${nome.trim().toLocaleLowerCase("pt-BR")}|${id}|${parte}`);
  return criarSorteio(semente).embaralhar(questoes);
}

const chave = ({ turma, nome }, id, parte) => `${PREFIXO}${turma}|${nome.trim().toLocaleLowerCase("pt-BR")}|${id}|${parte}`;

export function lerParte(aluno, id, parte) {
  try {
    const v = JSON.parse(localStorage.getItem(chave(aluno, id, parte)) || "null");
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

export function gravarParte(aluno, id, parte, dados) {
  try { localStorage.setItem(chave(aluno, id, parte), JSON.stringify(dados)); } catch { /* sem armazenamento */ }
}

/* aluno identificado nesta aba (sessionStorage: some quando a aba fecha) */
export function alunoAtual() {
  try { return JSON.parse(sessionStorage.getItem(ALUNO) || "null"); } catch { return null; }
}
export function guardarAluno(a) {
  try { sessionStorage.setItem(ALUNO, JSON.stringify(a)); } catch { /* sem armazenamento */ }
}
export function esquecerAluno() {
  try { sessionStorage.removeItem(ALUNO); } catch { /* sem armazenamento */ }
}
