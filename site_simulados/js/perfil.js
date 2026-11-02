// Perfil (#/perfil). Na fase 1: apelido e tema. Conquistas, histórico, mapa das
// habilidades e "Apagar meus dados" entram na fase 5.
import { h } from "./util.js";
import { atualizar } from "./armazenamento.js";
import { aplicarTema } from "./tema.js";

const TEMAS = [["auto", "Automático"], ["light", "Claro"], ["dark", "Escuro"]];

export function telaPerfil(ctx) {
  const p = ctx.estado.perfil;
  return {
    titulo: "Perfil",
    html: h`
    <h1>Perfil</h1>
    <p class="sub">Tudo aqui fica só neste aparelho. Nada é enviado para ninguém.</p>
    <section class="cartao">
      <form id="form-apelido" class="campo" autocomplete="off">
        <label for="apelido"><strong>Seu apelido</strong></label>
        <input id="apelido" class="select" maxlength="20" value="${p.apelido || ""}" placeholder="Como quer ser chamado?">
        <div class="botoes"><button class="botao pequeno" type="submit">Salvar apelido</button></div>
        <p class="msg" id="msg-apelido" role="status" aria-live="polite"></p>
      </form>
    </section>
    <section class="cartao secao">
      <fieldset>
        <legend>Tema</legend>
        <div class="chips">${TEMAS.map(([v, rot]) => h`<label class="chip"><input type="radio" name="tema" data-acao="tema-cor" value="${v}" ${(p.tema || "auto") === v ? "checked" : ""}>${rot}</label>`)}</div>
      </fieldset>
    </section>`,
    depois: () => {
      document.getElementById("form-apelido").addEventListener("submit", (ev) => {
        ev.preventDefault();
        const v = document.getElementById("apelido").value.trim().slice(0, 20);
        atualizar((e) => { e.perfil.apelido = v; });
        document.getElementById("msg-apelido").textContent = v ? `Pronto, ${v}!` : "Apelido apagado.";
      });
    },
    eventos: {
      "tema-cor": (el) => {
        atualizar((e) => { e.perfil.tema = el.value; });
        aplicarTema(el.value);
      },
    },
  };
}
