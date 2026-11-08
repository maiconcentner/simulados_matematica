// Atualização sozinha: o site confere a versão publicada (versao.json, sempre sem cache).
// Ao abrir com uma versão velha guardada no navegador, recarrega uma vez, sozinho.
// Com a página já aberta, mostra um aviso "Atualizar" (as respostas ficam salvas).
import { VERSAO } from "./versao.js?v=0bc7986d38";

const TENTOU = "simulados:recarregou-para";

async function versaoPublicada() {
  try {
    const r = await fetch(`versao.json?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()).versao || null;
  } catch {
    return null; // sem internet: segue com o que tem
  }
}

function aviso() {
  if (document.getElementById("aviso-versao")) return;
  const div = document.createElement("div");
  div.id = "aviso-versao";
  div.className = "aviso-versao";
  div.setAttribute("role", "status");
  div.innerHTML = '<span>Saiu uma versão nova do site.</span><button type="button" class="botao pequeno">Atualizar</button>';
  div.querySelector("button").addEventListener("click", () => location.reload());
  document.body.appendChild(div);
}

/** Confere ao abrir (recarrega uma vez se precisar) e depois a cada 10 minutos (só avisa). */
export async function conferirVersao() {
  const publicada = await versaoPublicada();
  if (publicada && publicada !== VERSAO) {
    let jaTentou = null;
    try { jaTentou = sessionStorage.getItem(TENTOU); } catch { /* sem armazenamento */ }
    if (jaTentou !== publicada) {
      try { sessionStorage.setItem(TENTOU, publicada); } catch { /* sem armazenamento */ }
      location.reload();
      return true;
    }
    aviso(); // já recarregou e continuou velho: deixa o aluno tentar de novo
  }
  setInterval(async () => {
    const v = await versaoPublicada();
    if (v && v !== VERSAO) aviso();
  }, 10 * 60 * 1000);
  return false;
}
