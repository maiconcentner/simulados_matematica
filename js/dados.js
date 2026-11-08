// Leitura dos dados do site: catálogo, configuração, habilidades e cada simulado.
// Caminhos relativos, para funcionar dentro da subpasta do GitHub Pages.
import { buscarGerado } from "./armazenamento.js?v=0bc7986d38";

const cache = new Map();

async function json(caminho) {
  if (!cache.has(caminho)) {
    cache.set(
      caminho,
      fetch(caminho, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`Não consegui abrir ${caminho} (${r.status}).`);
        return r.json();
      }).catch((e) => {
        cache.delete(caminho);
        throw e;
      }),
    );
  }
  return cache.get(caminho);
}

/** Catálogo, configuração e habilidades: o painel só precisa disso. */
export async function carregarBase() {
  const [catalogo, config, habilidades] = await Promise.all([
    json("data/catalogo.json"),
    json("data/config.json"),
    json("data/habilidades.json"),
  ]);
  return { catalogo, config, habilidades };
}

/** Todos os simulados do catálogo que aparecem para o aluno (sem os ocultos). */
export function simuladosDoCatalogo(catalogo, area = null) {
  return catalogo.areas
    .filter((a) => !area || a.id === area)
    .flatMap((a) => a.simulados.map((s) => ({ ...s, area: a.id })))
    .filter((s) => s.status !== "oculto");
}

export function infoDoCatalogo(catalogo, id) {
  return simuladosDoCatalogo(catalogo).find((s) => s.id === id) || null;
}

/** JSON completo de um simulado: do catálogo ou um treino gerado neste aparelho. */
export async function carregarSimulado(catalogo, id) {
  if (id.startsWith("G-")) {
    const g = buscarGerado(id);
    if (!g) throw new Error("Esse treino não está mais guardado neste aparelho.");
    return g;
  }
  const info = infoDoCatalogo(catalogo, id);
  if (!info) throw new Error("Simulado não encontrado.");
  return json(info.arquivo);
}

/* ---------- prazo e disponibilidade ---------- */

/** true quando o simulado tem prazo (disponivel_ate) e ele já passou. */
export function encerrado(s, agora = Date.now()) {
  return !!s?.disponivel_ate && agora > Date.parse(s.disponivel_ate);
}

/** true quando o simulado tem hora de liberação (libera_em) e ela ainda não chegou. */
export function aindaVaiAbrir(s, agora = Date.now()) {
  return !!s?.libera_em && agora < Date.parse(s.libera_em);
}

/** Dá para fazer agora: publicado, já liberado (se tiver libera_em) e dentro do prazo (se tiver). */
export function disponivelAgora(s, agora = Date.now()) {
  return !!s && (s.status || "publicado") === "publicado" && !aindaVaiAbrir(s, agora) && !encerrado(s, agora);
}

/** Ids dos simulados do catálogo que não estão abertos agora (em breve ou encerrados). */
export function idsIndisponiveis(catalogo, agora = Date.now()) {
  return new Set(catalogo.areas.flatMap((a) => a.simulados).filter((s) => !disponivelAgora(s, agora)).map((s) => s.id));
}

/** Simulados do catálogo de onde vem um treino gerado (a base, ou os modelos das questões). */
export function origensDoGerado(g) {
  if (g?.gerado?.base) return [g.gerado.base];
  return [...new Set((g?.items || []).map((it) => String(it.modelo || "").replace(/-\d+$/, "")).filter(Boolean))];
}

/**
 * Se o simulado (ou o treino gerado) está fechado agora, devolve o simulado do catálogo
 * que o fecha; senão, null.
 */
export function bloqueio(catalogo, estado, id, agora = Date.now()) {
  const fechados = idsIndisponiveis(catalogo, agora);
  const todos = catalogo.areas.flatMap((a) => a.simulados);
  if (!id.startsWith("G-")) return fechados.has(id) ? todos.find((s) => s.id === id) : null;
  const g = estado.gerados.find((x) => x.id === id);
  const origem = origensDoGerado(g).find((o) => fechados.has(o));
  return origem ? todos.find((s) => s.id === origem) : null;
}

/** Prazo (disponivel_ate) que vale para um simulado ou treino gerado; o mais cedo, se houver mais de um. */
export function prazoDe(catalogo, estado, id) {
  const todos = catalogo.areas.flatMap((a) => a.simulados);
  const origens = id.startsWith("G-") ? origensDoGerado(estado.gerados.find((g) => g.id === id)) : [id];
  const prazos = origens.map((o) => todos.find((s) => s.id === o)?.disponivel_ate).filter(Boolean);
  if (!prazos.length) return null;
  return prazos.reduce((a, b) => (Date.parse(b) < Date.parse(a) ? b : a));
}

/**
 * Que tipo de simulado é, para organizar o site:
 * "prova" (área de prova), "completo" (destaque: true), "semana" (tem número de semana)
 * ou "treino" (sem semana: os treinos T1, T2... com correção na hora).
 */
export function tipoDoSimulado(s) {
  if (s.area === "prova") return "prova";
  if (s.destaque) return "completo";
  if (s.semana) return "semana";
  return "treino";
}
