// Ícones próprios do site, em SVG (traço de 2 px, herdam a cor do texto).
import { cru } from "./util.js";

const base = (corpo, extra = "") =>
  cru(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"${extra}>${corpo}</svg>`);

export const icone = {
  painel: base('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  avalia: base('<rect x="4" y="4" width="16" height="17" rx="3"/><path d="M8 2.5v3M16 2.5v3M4 9.5h16"/><path d="m8.5 14.5 2.2 2.2 4.8-4.7"/>'),
  prova: base('<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>'),
  treinar: base('<path d="M4 7h3l10 10h3"/><path d="M4 17h3l3-3M14 10l3-3h3"/><path d="m18 4 2.5 3L18 10M18 14l2.5 3-2.5 3"/>'),
  perfil: base('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>'),
  estrela: base('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor" stroke="none"/>'),
  chama: base('<path d="M12 3c1 3.5 5 5.6 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.8 2.5-5 .3 1.6 1 2.6 2 3 0-3 .5-5.6.5-8z" fill="currentColor" stroke="none"/>'),
  trofeu: base('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M8.5 20.5h7M9.5 17.5h5v3h-5z"/>'),
  medalha: base('<path d="M8 2.5 12 9l4-6.5" /><circle cx="12" cy="15" r="6" fill="currentColor" stroke="none"/><path d="m12 12.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#fff" stroke="none"/>'),
  seta: base('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  voltar: base('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  play: base('<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>'),
  lixo: base('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
  raio: base('<path d="M13 2 5 13.5h6L10 22l9-12h-6z" fill="currentColor" stroke="none"/>'),
  alvo: base('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'),
  relogio: base('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  lista: base('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>'),
  dado: base('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"/>'),
  check: base('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
};
