// Simulado (#/simulado/<id>). Na fase 1, a tela de abertura: título, número de questões,
// como é a nota e o que cai. A tela das questões entra na fase 2.
import { h } from "./util.js";
import { icone } from "./icones.js";
import { carregarSimulado } from "./dados.js";
import { gerarMisto } from "./gerador/index.js";
import { guardarGerado } from "./armazenamento.js";
import { plural, nota1 } from "./util.js";

const papelParaAluno = (role) => {
  if (!role) return "";
  if (role.startsWith("Conexão")) return "Conexão com o 8º ano";
  if (role.startsWith("Retomada")) return "Revisão";
  return "";
};

export async function telaSimulado(ctx, id) {
  const { catalogo, habilidades } = ctx.base;
  const sim = await carregarSimulado(catalogo, id);
  const prova = sim.pontuacao?.tipo === "valores";
  const n = sim.items.length;
  const gerado = sim.area === "gerado";
  const valores = prova ? [...new Set(sim.items.map((i) => i.valor))].sort((a, b) => b - a) : [];

  return {
    titulo: sim.titulo,
    html: h`
    <div class="abertura">
      <p class="pequeno"><a href="${gerado ? "#/treinar" : sim.area === "prova" ? "#/prova" : "#/avalia"}">${icone.voltar} Voltar</a></p>
      ${gerado ? h`<span class="estado novo">${icone.dado}Treino gerado</span>` : ""}
      <h1>${sim.titulo}</h1>
      ${sim.subtitulo || sim.temas ? h`<p class="sub">${sim.subtitulo || sim.temas}</p>` : ""}

      <div class="resumo">
        <div><b>${n}</b>${plural(n, "questão", "questões").replace(/^\d+ /, "")}</div>
        <div><b>0 a 10</b>${prova ? "soma do valor das questões certas" : "nota pelos acertos"}</div>
        <div><b>Sem pressa</b>sem limite de tempo</div>
      </div>

      <section class="cartao">
        <h2>Como funciona</h2>
        <ul class="lista-o-que-cai">
          <li>Uma questão por tela. Dá para voltar e trocar a resposta.</li>
          <li>Suas respostas ficam salvas a cada toque: se a página fechar, você continua de onde parou.</li>
          <li>${prova ? `As questões valem ${valores.map((v) => nota1(v)).join(", ")} pontos, de acordo com o nível.` : `Cada acerto vale ${nota1(10 / n)} na nota.`} O resultado aparece só no fim, como no papel.</li>
        </ul>
        <h2 class="secao">O que cai</h2>
        <ol class="lista-o-que-cai">${sim.items.map((it) => h`<li>${habilidades[it.code]?.nome || it.short}${papelParaAluno(it.role) ? h` <span class="etiqueta ${it.role.startsWith("Conexão") ? "conexao" : ""}">${papelParaAluno(it.role)}</span>` : ""}${prova ? h` <span class="etiqueta">vale ${nota1(it.valor)}</span>` : ""}</li>`)}</ol>
      </section>

      <div class="botoes secao">
        <button type="button" class="botao" data-acao="comecar">${icone.play}Começar</button>
        ${gerado && sim.gerado?.tipo === "versao" ? h`<button type="button" class="botao secundario" data-acao="versao-nova" data-id="${sim.gerado.base}">${icone.dado}Gerar outra versão</button>` : ""}
        ${gerado && sim.gerado?.tipo === "misto" ? h`<button type="button" class="botao secundario" data-acao="gerar-de-novo">${icone.dado}Gerar outro igual</button>` : ""}
        ${!gerado && sim.area !== "gerado" ? h`<button type="button" class="botao secundario" data-acao="versao-nova" data-id="${sim.id}">${icone.dado}Versão nova</button>` : ""}
      </div>
      <p class="msg" id="msg-comecar" role="status" aria-live="polite"></p>
    </div>`,
    eventos: {
      comecar: () => {
        document.getElementById("msg-comecar").textContent = "A tela das questões chega na fase 2 do site.";
      },
      "gerar-de-novo": () => {
        const novo = gerarMisto({ codigos: sim.gerado.codigos, quantidade: sim.items.length, habilidades });
        guardarGerado(novo);
        location.hash = `#/simulado/${novo.id}`;
      },
    },
  };
}
