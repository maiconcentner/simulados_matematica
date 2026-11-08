// Cronômetro do simulado longo (os que têm tempo_sugerido_min, como o Simulado Completo).
// Conta só o tempo com a questão aberta: fechou a página, o tempo para; a pausa esconde a questão.
// O tempo fica em emAndamento[simId].tempo_ms (e pausado), salvo a cada 5 s, ao pausar e ao sair.
import { h } from "./util.js?v=e27fa3b239";
import { icone } from "./icones.js?v=e27fa3b239";
import { atualizar, ler } from "./armazenamento.js?v=e27fa3b239";

const dois = (n) => String(n).padStart(2, "0");
/** 0:12:05 */
export function relogioHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 3600)}:${dois(Math.floor((s % 3600) / 60))}:${dois(s % 60)}`;
}

let tique = null;
let fechar = null;

/** Barra do cronômetro (vai no topo da questão). */
export function cronometroHTML(sim, andamento) {
  if (!sim.tempo_sugerido_min) return "";
  const pausado = !!andamento?.pausado;
  const limite = sim.tempo_sugerido_min * 60000;
  const usado = andamento?.tempo_ms || 0;
  return h`<div class="cronometro ${usado > limite ? "passou" : ""}" role="timer" aria-label="Tempo de prova">
    ${icone.relogio}<span><b class="crono-usado">${relogioHMS(usado)}</b> <span class="sub">de ${relogioHMS(limite)}</span></span>
    ${pausado ? "" : h`<button type="button" class="botao fantasma pequeno" data-acao="pausar">${icone.pausa}Pausar</button>`}
  </div>`;
}

/** Aviso que aparece no lugar da questão durante a pausa. */
export function pausaHTML(sim, andamento) {
  if (!sim.tempo_sugerido_min || !andamento?.pausado) return "";
  return h`<div class="cartao pausa-aviso" role="status">
    <h2>Prova pausada</h2>
    <p>O cronômetro parou e a questão ficou escondida. Respire, beba uma água e volte quando estiver pronto.</p>
    <button type="button" class="botao" data-acao="continuar-cronometro">${icone.play}Continuar</button>
  </div>`;
}

function guardar(simId, ms, pausado) {
  atualizar((e) => {
    const a = e.emAndamento[simId];
    if (!a) return;
    a.tempo_ms = Math.round(ms);
    if (pausado !== undefined) a.pausado = pausado;
  });
}

/** Para o cronômetro desta tela, guardando o tempo. */
export function pararCronometro() {
  if (fechar) fechar();
}

/** Liga o cronômetro da questão aberta (chamar depois de desenhar). */
export function ligarCronometro(sim) {
  pararCronometro();
  const a = ler().emAndamento[sim.id];
  if (!sim.tempo_sugerido_min || !a || a.pausado) return;
  const base = a.tempo_ms || 0;
  const desde = Date.now();
  const limite = sim.tempo_sugerido_min * 60000;
  let ultimoSalvo = desde;
  const usado = () => base + Math.max(0, Date.now() - desde);
  const sair = () => pararCronometro();
  tique = setInterval(() => {
    const el = document.querySelector(".cronometro .crono-usado");
    if (!el) return pararCronometro();
    const ms = usado();
    el.textContent = relogioHMS(ms);
    el.closest(".cronometro").classList.toggle("passou", ms > limite);
    if (Date.now() - ultimoSalvo >= 5000) { guardar(sim.id, ms); ultimoSalvo = Date.now(); }
  }, 1000);
  window.addEventListener("pagehide", sair);
  fechar = () => {
    clearInterval(tique);
    window.removeEventListener("pagehide", sair);
    tique = fechar = null;
    guardar(sim.id, usado());
  };
}

/** Pausa: guarda o tempo e marca pausado. */
export function pausar(sim) {
  pararCronometro();
  guardar(sim.id, ler().emAndamento[sim.id]?.tempo_ms || 0, true);
}

export function continuar(sim) {
  guardar(sim.id, ler().emAndamento[sim.id]?.tempo_ms || 0, false);
}
