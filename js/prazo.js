// Reloginho do prazo: "Fecha hoje às 23h59 · faltam 07:52:10".
// O texto é atualizado a cada segundo por iniciarRelogios(); quando o prazo passa, a tela é redesenhada
// (e o simulado aparece como encerrado).
import { h } from "./util.js?v=42dba01b94";
import { icone } from "./icones.js?v=42dba01b94";

const dois = (n) => String(n).padStart(2, "0");

/** "Fecha hoje às 23h59", "Fecha amanhã às 18h00" ou "Fecha em 12/11 às 23h59", no horário do aparelho. */
export function quandoFecha(ate, agora = Date.now()) {
  const d = new Date(ate), hoje = new Date(agora);
  const dia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((dia(d) - dia(hoje)) / 86400000);
  const hora = `${dois(d.getHours())}h${dois(d.getMinutes())}`;
  if (dif === 0) return `Fecha hoje às ${hora}`;
  if (dif === 1) return `Fecha amanhã às ${hora}`;
  return `Fecha em ${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${hora}`;
}

/** Tempo que falta: "07:52:10" ou "2 dias e 05:12:09". */
export function tempoQueFalta(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const dias = Math.floor(s / 86400);
  const hms = `${dois(Math.floor((s % 86400) / 3600))}:${dois(Math.floor((s % 3600) / 60))}:${dois(s % 60)}`;
  return dias ? `${dias} ${dias === 1 ? "dia" : "dias"} e ${hms}` : hms;
}

const urgencia = (ms) => (ms <= 10 * 60000 ? "muito-urgente" : ms <= 60 * 60000 ? "urgente" : "");

/** O reloginho. Só aparece se o prazo ainda não passou. */
export function reloginho(ate, { compacto = false } = {}) {
  if (!ate) return "";
  const falta = Date.parse(ate) - Date.now();
  if (falta <= 0) return "";
  const quando = quandoFecha(ate);
  return h`<div class="reloginho ${compacto ? "compacto" : ""} ${urgencia(falta)}" data-prazo="${ate}" role="timer" aria-label="${quando}">
    ${icone.relogio}<span class="prazo-quando">${quando}</span><span class="prazo-falta" aria-hidden="true">faltam ${tempoQueFalta(falta)}</span>
  </div>`;
}

/** Atualiza os reloginhos da página a cada segundo; quando um prazo passa, chama aoEncerrar(). */
export function iniciarRelogios(aoEncerrar) {
  setInterval(() => {
    const agora = Date.now();
    let passou = false;
    document.querySelectorAll("[data-prazo]").forEach((el) => {
      const falta = Date.parse(el.dataset.prazo) - agora;
      if (falta <= 0) {
        passou = true;
        el.removeAttribute("data-prazo");
        return;
      }
      const t = el.querySelector(".prazo-falta");
      if (t) t.textContent = `faltam ${tempoQueFalta(falta)}`;
      el.classList.toggle("urgente", urgencia(falta) === "urgente");
      el.classList.toggle("muito-urgente", urgencia(falta) === "muito-urgente");
    });
    if (passou) aoEncerrar();
  }, 1000);
}
