// Conversa com a planilha do professor (Apps Script).
// GET: alunos, status e resultado. POST: resposta de uma parte (mode "no-cors", text/plain).
// Envio que falha fica numa fila no localStorage e é tentado de novo ao abrir a página.
import { URL_DA_PLANILHA } from "./config.js?v=57517fb455";

const FILA = "simulados-aula:v1:pendentes";

export class PlanilhaForaDoAr extends Error {
  constructor(msg = "planilha fora do ar") { super(msg); this.name = "PlanilhaForaDoAr"; }
}

export const planilhaConfigurada = () => /^https:\/\/\S+$/.test(URL_DA_PLANILHA);

/** GET ?acao=...; devolve o JSON da planilha ou lança PlanilhaForaDoAr. */
export async function consultar(params, { tempo = 9000 } = {}) {
  if (!planilhaConfigurada()) throw new PlanilhaForaDoAr("URL_DA_PLANILHA não configurada");
  const url = `${URL_DA_PLANILHA}?${new URLSearchParams(params)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), tempo);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", cache: "no-store" });
    if (!r.ok) throw new PlanilhaForaDoAr(`status ${r.status}`);
    return await r.json();
  } catch (e) {
    throw e instanceof PlanilhaForaDoAr ? e : new PlanilhaForaDoAr(e.message);
  } finally {
    clearTimeout(t);
  }
}

/** POST de uma parte. Resolve se a requisição saiu; lança PlanilhaForaDoAr se não saiu. */
async function postar(dados) {
  if (!planilhaConfigurada()) throw new PlanilhaForaDoAr("URL_DA_PLANILHA não configurada");
  try {
    await fetch(URL_DA_PLANILHA, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(dados),
    });
  } catch (e) {
    throw new PlanilhaForaDoAr(e.message);
  }
}

function lerFila() {
  try { return JSON.parse(localStorage.getItem(FILA) || "[]"); } catch { return []; }
}
function gravarFila(f) {
  try { localStorage.setItem(FILA, JSON.stringify(f)); } catch { /* sem armazenamento */ }
}
export const pendentes = () => lerFila();

/** Envia; se não sair, guarda na fila. Devolve true se saiu. */
export async function enviar(dados) {
  try {
    await postar(dados);
    gravarFila(lerFila().filter((p) => p.id_envio !== dados.id_envio));
    return true;
  } catch {
    const f = lerFila().filter((p) => p.id_envio !== dados.id_envio);
    f.push(dados);
    gravarFila(f);
    return false;
  }
}

/** Tenta de novo tudo o que ficou na fila. Devolve os id_envio que saíram. */
export async function reenviarPendentes() {
  const saiu = [];
  for (const p of lerFila()) {
    try {
      await postar(p);
      saiu.push(p.id_envio);
    } catch {
      break; // sem conexão: tenta o resto na próxima vez
    }
  }
  if (saiu.length) gravarFila(lerFila().filter((p) => !saiu.includes(p.id_envio)));
  return saiu;
}
