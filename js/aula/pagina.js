// Páginas de aula: simulado.html?id=<ID>[&parte=N] e completo.html (id = E3-COMPLETO).
// Identificação pela planilha do professor, ordem embaralhada por aluno, progresso no
// computador a cada resposta, envio por parte e resultado depois de todas as partes.
// Especificação: planejamento/pagina_simulado_completo.md.
import { h, plural, nota1, maiuscula } from "../util.js?v=42dba01b94";
import { icone } from "../icones.js?v=42dba01b94";
import { enunciadoHTML } from "../questao.js?v=42dba01b94";
import { faixaDaNota } from "../correcao.js?v=42dba01b94";
import { anelNota, reguaFaixas, barrasTema } from "../graficos.js?v=42dba01b94";
import { TURMAS, LIBERAR_REVISAO_EM } from "./config.js?v=42dba01b94";
import { consultar, enviar, reenviarPendentes, pendentes, PlanilhaForaDoAr } from "./planilha.js?v=42dba01b94";
import { ordemDaParte, lerParte, gravarParte, alunoAtual, guardarAluno, esquecerAluno } from "./progresso.js?v=42dba01b94";
import { conferirVersao } from "../atualizacao.js?v=42dba01b94";

const raiz = document.getElementById("app");
const params = new URLSearchParams(location.search);
const ID = (document.body.dataset.sim || params.get("id") || "").trim();
const PAGINA_COMPLETO = !!document.body.dataset.sim;

let sim = null, habilidades = {}, config = null;
let aviso = null; // {tipo: "ok" | "erro", texto}
let statusRemoto = new Set();
let parteAberta = null; // número da parte com as questões abertas

/* ---------- utilidades ---------- */
const agoraISO = () => new Date().toISOString();
const hojeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const dataHoraLocal = () => {
  const d = new Date(), z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
};
const revisaoLiberada = () => hojeLocal() >= LIBERAR_REVISAO_EM;
const ehTreino = () => sim?.modo === "treino";
const novoId = () => {
  try { return crypto.randomUUID(); } catch { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
};
const r1 = (v) => Math.round(v * 10 + 1e-9) / 10;

/** Partes do simulado; sem o campo `partes`, o simulado inteiro é uma parte só. */
const partes = () => sim.partes?.length ? sim.partes : [{ n: 1, titulo: sim.titulo, questoes: sim.items.map((i) => i.n) }];
const temPartes = () => !!sim.partes?.length;
const item = (n) => sim.items.find((i) => i.n === n);

let seqTela = 0;
function desenhar(html, titulo) {
  seqTela++;
  raiz.innerHTML = String(html);
  document.title = `${titulo} · Simulados de Matemática`;
  const h1 = raiz.querySelector("h1");
  if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
  window.scrollTo(0, 0);
  document.body.dataset.tela = titulo; // ajuda os testes a saber que a tela está pronta
}

function urlParte(n) {
  const p = new URLSearchParams(location.search);
  if (n) p.set("parte", n); else p.delete("parte");
  const q = p.toString();
  history.replaceState(null, "", location.pathname + (q ? `?${q}` : ""));
}

function erroHTML(msg) {
  return h`<div class="cartao vazio"><h1>Ops!</h1><p>${msg}</p></div>`;
}

/* ---------- dados ---------- */
async function carregarJSON(caminho) {
  const r = await fetch(caminho, { cache: "no-cache" });
  if (!r.ok) throw new Error(caminho);
  return r.json();
}
async function carregarDados() {
  if (!/^[A-Za-z0-9-]+$/.test(ID)) throw new Error("Simulado não informado no link.");
  [habilidades, config] = await Promise.all([carregarJSON("data/habilidades.json"), carregarJSON("data/config.json")]);
  try {
    sim = await carregarJSON(`data/avalia/${ID}.json`);
  } catch {
    sim = await carregarJSON(`data/prova/${ID}.json`);
  }
}

/* ---------- situação das partes ---------- */
function situacaoDaParte(aluno, n) {
  const local = lerParte(aluno, sim.id, n);
  if (local?.enviada || statusRemoto.has(n)) return "enviada";
  if (local?.pendente) return "pendente";
  if (local && Object.keys(local.respostas || {}).length) return "andamento";
  return "nova";
}
const faltam = (aluno) => partes().filter((p) => situacaoDaParte(aluno, p.n) !== "enviada").length;

/**
 * Pergunta à planilha quais partes ela já recebeu deste aluno. Quando ela responde, ela manda:
 * uma parte que este computador marcou como enviada, mas que não está mais na planilha
 * (o professor apagou a linha), volta a ficar disponível, do zero.
 * Se a planilha não responder, vale o que este computador sabe.
 * Devolve true se alguma coisa mudou na situação das partes.
 */
async function atualizarStatusRemoto(aluno) {
  let r;
  try {
    r = await consultar({ acao: "status", id: sim.id, turma: aluno.turma, nome: aluno.nome, codigo: aluno.codigo });
  } catch {
    return false; // planilha fora do ar
  }
  if (!r?.ok || !Array.isArray(r.partes)) return false;
  const novo = new Set(r.partes.map(Number));
  let mudou = novo.size !== statusRemoto.size || [...novo].some((x) => !statusRemoto.has(x));
  statusRemoto = novo;
  for (const p of partes()) {
    const local = lerParte(aluno, sim.id, p.n);
    if (local?.enviada && !novo.has(p.n)) {
      gravarParte(aluno, sim.id, p.n, { respostas: {}, atual: 0, tempo_ms: 0, inicio: agoraISO(), liberadaDeNovoEm: agoraISO() });
      mudou = true;
    }
  }
  return mudou;
}

/** Marca como enviadas as partes que saíram da fila de pendentes. */
async function tentarPendentes() {
  const fila = pendentes();
  if (!fila.length) return 0;
  const saiu = await reenviarPendentes();
  for (const p of fila.filter((x) => saiu.includes(x.id_envio))) {
    const a = { turma: p.turma, nome: p.nome };
    const local = lerParte(a, p.id, p.parte);
    if (local) gravarParte(a, p.id, p.parte, { ...local, enviada: true, pendente: false });
  }
  return saiu.length;
}

/* ---------- cabeçalho com o aluno ---------- */
function barraAluno(aluno) {
  return h`<div class="barra-aluno">
    <p><span class="sub pequeno">Turma ${aluno.turma}</span><br><strong>${aluno.nome}</strong></p>
    <button type="button" class="botao fantasma pequeno" data-acao="trocar">${icone.perfil}Não sou eu / trocar de aluno</button>
  </div>`;
}

function trocarAluno() {
  esquecerAluno();
  statusRemoto = new Set();
  aviso = null;
  parteAberta = null;
  urlParte(null);
  telaIdentificacao();
}

/* ---------- 1. identificação ---------- */
const ident = { turma: "", codigo: "", alunos: null, digitar: false, erro: "", carregando: false };

function telaIdentificacao() {
  const i = ident;
  desenhar(h`
  <div class="aula-tela">
    <p class="sub pequeno">${sim.titulo}</p>
    <h1>Quem está fazendo?</h1>
    <form class="cartao identificacao" id="form-ident" autocomplete="off" novalidate>
      <fieldset>
        <legend>1. Sua turma</legend>
        <div class="chips">${TURMAS.map((t) => h`<label class="chip"><input type="radio" name="turma" value="${t}" ${i.turma === t ? "checked" : ""}>${t}</label>`)}</div>
      </fieldset>
      <label class="campo"><span>2. Código da aula (está na lousa)</span>
        <input class="select" id="codigo" name="codigo" value="${i.codigo}" autocapitalize="characters" spellcheck="false" maxlength="20">
      </label>
      ${!i.alunos && !i.digitar ? h`<div class="botoes"><button class="botao" type="submit" ${i.carregando ? "disabled" : ""}>${i.carregando ? "Procurando a turma..." : "Continuar"}${icone.seta}</button></div>` : ""}
      ${i.alunos ? h`
        <label class="campo"><span>3. Seu nome</span>
          <select class="select" id="nome-lista"><option value="">Escolha seu nome</option>${i.alunos.map((n) => h`<option value="${n}">${n}</option>`)}</select>
        </label>
        <div class="botoes"><button class="botao" type="button" data-acao="entrar-lista">Entrar${icone.seta}</button><button class="botao fantasma pequeno" type="button" data-acao="voltar-ident">Trocar turma ou código</button></div>` : ""}
      ${i.digitar ? h`
        <p class="aviso-aula erro">Não consegui falar com a planilha do professor. Digite seu nome completo, do jeito que está na chamada.</p>
        <label class="campo"><span>3. Seu nome completo</span>
          <input class="select" id="nome-digitado" maxlength="60" autocomplete="off">
        </label>
        <div class="botoes"><button class="botao" type="button" data-acao="entrar-digitado">Entrar${icone.seta}</button><button class="botao fantasma pequeno" type="button" data-acao="voltar-ident">Tentar de novo</button></div>` : ""}
      <p class="msg erro" id="msg-ident" role="alert">${i.erro}</p>
    </form>
  </div>`, "Identificação");
  document.getElementById("form-ident").addEventListener("submit", (ev) => { ev.preventDefault(); buscarAlunos(); });
}

async function buscarAlunos() {
  const turma = raiz.querySelector('input[name="turma"]:checked')?.value || "";
  const codigo = (document.getElementById("codigo")?.value || "").trim().toUpperCase();
  Object.assign(ident, { turma, codigo, erro: "" });
  if (!TURMAS.includes(turma)) { ident.erro = "Escolha a sua turma."; return telaIdentificacao(); }
  if (!codigo) { ident.erro = "Digite o código da aula que está na lousa."; return telaIdentificacao(); }
  ident.carregando = true;
  telaIdentificacao();
  try {
    const r = await consultar({ acao: "alunos", turma, codigo });
    ident.carregando = false;
    if (r?.ok && Array.isArray(r.alunos) && r.alunos.length) {
      ident.alunos = [...r.alunos].sort((a, b) => a.localeCompare(b, "pt-BR"));
    } else if (r?.erro === "codigo") {
      ident.erro = "Código da aula errado. Confira na lousa e digite de novo.";
    } else if (r?.erro === "turma") {
      ident.erro = "Essa turma não está na planilha. Chame o professor.";
    } else {
      ident.erro = "A lista dessa turma está vazia. Chame o professor.";
    }
  } catch (e) {
    ident.carregando = false;
    if (e instanceof PlanilhaForaDoAr) ident.digitar = true;
    else ident.erro = "Algo deu errado. Tente de novo.";
  }
  telaIdentificacao();
}

function entrar(nome, digitado) {
  nome = nome.replace(/\s+/g, " ").trim();
  if (!nome || (digitado && nome.split(" ").length < 2)) {
    ident.erro = digitado ? "Digite o nome e o sobrenome." : "Escolha o seu nome na lista.";
    return telaIdentificacao();
  }
  guardarAluno({ turma: ident.turma, codigo: ident.codigo, nome, nome_digitado: !!digitado });
  Object.assign(ident, { alunos: null, digitar: false, erro: "", codigo: "" });
  irParaInicio();
}

/* ---------- 2. entrada do simulado (partes) ---------- */
async function irParaInicio() {
  const aluno = alunoAtual();
  if (!aluno) return telaIdentificacao();
  const pedida = Number(new URLSearchParams(location.search).get("parte")) || null;
  if (!temPartes()) {
    // simulado de uma parte só (S08, treinos): vai direto às questões, ou ao resultado
    await atualizarStatusRemoto(aluno);
    return situacaoDaParte(aluno, 1) === "enviada" ? telaResultado() : abrirParte(1);
  }
  const algumaEnviadaAqui = partes().some((p) => lerParte(aluno, sim.id, p.n)?.enviada);
  if (algumaEnviadaAqui) {
    // pode ter sido apagada na planilha: confere antes de mostrar
    desenhar(h`<div class="aula-tela">${barraAluno(aluno)}<h1>${sim.titulo}</h1><p class="carregando">Conferindo na planilha do professor...</p></div>`, "Conferindo");
    await atualizarStatusRemoto(aluno);
  }
  if (pedida && partes().some((p) => p.n === pedida) && situacaoDaParte(aluno, pedida) !== "enviada") return abrirParte(pedida);
  telaEntrada();
  if (!algumaEnviadaAqui && (await atualizarStatusRemoto(aluno))) telaEntrada();
}

function telaEntrada() {
  const aluno = alunoAtual();
  if (!aluno) return telaIdentificacao();
  parteAberta = null;
  urlParte(null);
  if (!faltam(aluno)) return telaResultado();
  const minhaFila = pendentes().filter((p) => p.id === sim.id && p.turma === aluno.turma && p.nome === aluno.nome);
  const rotulo = { nova: "Não começada", andamento: "Em andamento", pendente: "Não foi enviada", enviada: "Enviada" };
  desenhar(h`
  <div class="aula-tela">
    ${barraAluno(aluno)}
    <h1>${sim.titulo}</h1>
    <p class="sub">${partes().length} partes de ${plural(partes()[0].questoes.length, "questão", "questões")}. Faça cada parte de uma vez, em qualquer ordem. Ao terminar uma parte, envie: ela vai para a planilha do professor.</p>
    ${aviso ? h`<p class="aviso-aula ${aviso.tipo}" role="status">${aviso.texto}</p>` : ""}
    ${minhaFila.length ? h`<div class="aviso-aula erro" role="alert"><p><strong>${minhaFila.length === 1 ? `A parte ${minhaFila[0].parte} não foi enviada` : "Algumas partes não foram enviadas"}.</strong> Chame o professor. Suas respostas estão guardadas neste computador.</p><button type="button" class="botao pequeno" data-acao="reenviar">Tentar enviar de novo</button></div>` : ""}
    <ul class="partes">${partes().map((p) => {
      const s = situacaoDaParte(aluno, p.n);
      const local = lerParte(aluno, sim.id, p.n);
      const resp = local ? Object.keys(local.respostas || {}).length : 0;
      return h`<li class="cartao parte ${s}">
        <div><h2>${p.titulo || `Parte ${p.n}`}</h2>
          <span class="estado ${s === "enviada" ? "feito" : s === "pendente" ? "melhorar" : s === "andamento" ? "novo" : "breve"}">${s === "enviada" ? icone.check : ""}${rotulo[s]}</span>
          <p class="sub pequeno">${plural(p.questoes.length, "questão", "questões")}${s === "andamento" ? ` · ${resp} respondida${resp === 1 ? "" : "s"}` : ""}</p></div>
        ${s === "enviada" ? "" : h`<button type="button" class="botao" data-acao="abrir-parte" data-parte="${p.n}">${s === "nova" ? "Começar" : "Continuar"}${icone.seta}</button>`}
      </li>`;
    })}</ul>
    <div class="botoes secao"><button type="button" class="botao fantasma" data-acao="trocar">Sair</button></div>
  </div>`, sim.titulo);
  aviso = null;
}

/* ---------- 3. questões ---------- */
function progressoDaParte(aluno, n) {
  const p = partes().find((x) => x.n === n);
  const local = lerParte(aluno, sim.id, n) || { respostas: {}, atual: 0, tempo_ms: 0, inicio: agoraISO() };
  // a ordem sai sempre da mesma semente; fica guardada só para conferência
  local.ordem = ordemDaParte(p.questoes, { turma: aluno.turma, nome: aluno.nome, id: sim.id, parte: n });
  local.respostas ||= {};
  return local;
}

function abrirParte(n, indice) {
  const aluno = alunoAtual();
  if (!aluno) return telaIdentificacao();
  if (situacaoDaParte(aluno, n) === "enviada") return temPartes() ? telaEntrada() : telaResultado();
  const local = progressoDaParte(aluno, n);
  if (indice !== undefined) local.atual = indice;
  gravarParte(aluno, sim.id, n, local);
  parteAberta = n;
  if (temPartes()) urlParte(n);
  telaQuestao(n, local.atual || 0);
}

function grade(local, atual, n) {
  return h`<nav class="bolinhas" aria-label="Questões da parte">${local.ordem.map((num, k) => {
    const feita = !!local.respostas[String(num)];
    return h`<button type="button" class="bolinha ${feita ? "feita" : ""} ${k === atual ? "atual" : ""}" data-acao="ir" data-k="${k}" data-parte="${n}" aria-label="Questão ${k + 1}, ${feita ? "respondida" : "em branco"}">${k + 1}</button>`;
  })}</nav>`;
}

function feedbackTreino(it, letra) {
  const op = it.options.find((o) => o.letter === letra);
  const certo = letra === it.key;
  return h`<div class="feedback ${certo ? "certo" : "errado"}" role="status">
    <p class="feedback-titulo">${certo ? h`${icone.check}Acertou!` : h`${icone.alvo}Ainda não.`}</p>
    <p>${certo ? op.why : h`<strong>Erro provável:</strong> ${op.why}`}</p>
    <p><strong>Resolução</strong></p>
    <ol class="resolucao">${it.resolution.map((x) => h`<li>${x}</li>`)}</ol>
    ${it.check ? h`<p><strong>Como conferir:</strong> ${it.check}</p>` : ""}
  </div>`;
}

function telaQuestao(n, k) {
  const aluno = alunoAtual();
  const local = progressoDaParte(aluno, n);
  k = Math.max(0, Math.min(k, local.ordem.length - 1));
  local.atual = k;
  gravarParte(aluno, sim.id, n, local);
  const num = local.ordem[k];
  const it = item(num);
  const marcada = local.respostas[String(num)] || null;
  const travada = ehTreino() && !!marcada;
  const total = local.ordem.length;
  desenhar(h`
  <div class="aula-tela tela-questao">
    ${barraAluno(aluno)}
    <h1 class="questao-num">Questão ${k + 1} de ${total}${temPartes() ? h` <span class="sub">· Parte ${n}</span>` : ""}</h1>
    ${grade(local, k, n)}
    <article class="cartao questao" data-n="${num}">
      ${enunciadoHTML(it)}
      <div class="alternativas" role="radiogroup" aria-label="Alternativas">
        ${it.options.map((o) => {
          const cls = travada ? (o.correct ? "correta" : o.letter === marcada ? "errada" : "") : marcada === o.letter ? "marcada" : "";
          return h`<button type="button" role="radio" class="alternativa opcao ${cls}" aria-checked="${String(marcada === o.letter)}" data-acao="responder" data-letra="${o.letter}" ${travada ? "disabled" : ""}><span class="letra">${o.letter}</span><span>${o.text}</span></button>`;
        })}
      </div>
      <div id="feedback">${travada ? feedbackTreino(it, marcada) : ""}</div>
      <p class="salvo sub pequeno" id="salvo" role="status">${marcada && !ehTreino() ? "Resposta salva neste computador." : ""}</p>
    </article>
    <div class="navegacao-questao">
      ${k > 0 ? h`<button type="button" class="botao secundario" data-acao="ir" data-k="${k - 1}" data-parte="${n}">${icone.voltar}Anterior</button>` : h`<span></span>`}
      ${k < total - 1
        ? h`<button type="button" class="botao" data-acao="ir" data-k="${k + 1}" data-parte="${n}" id="proxima">Próxima${icone.seta}</button>`
        : h`<button type="button" class="botao" data-acao="revisar" data-parte="${n}" id="proxima">Revisar e enviar${icone.seta}</button>`}
    </div>
  </div>`, `Questão ${k + 1}`);
}

function responder(letra) {
  const aluno = alunoAtual();
  const n = parteAberta;
  const local = progressoDaParte(aluno, n);
  const num = local.ordem[local.atual];
  if (ehTreino() && local.respostas[String(num)]) return;
  local.respostas[String(num)] = letra;
  local.ultimaMudanca = agoraISO();
  gravarParte(aluno, sim.id, n, local);
  if (ehTreino()) return telaQuestao(n, local.atual);
  raiz.querySelectorAll(".opcao").forEach((b) => {
    const sel = b.dataset.letra === letra;
    b.classList.toggle("marcada", sel);
    b.setAttribute("aria-checked", String(sel));
  });
  const bol = raiz.querySelector(`.bolinha[data-k="${local.atual}"]`);
  if (bol) { bol.classList.add("feita"); bol.setAttribute("aria-label", `Questão ${local.atual + 1}, respondida`); }
  document.getElementById("salvo").textContent = `Resposta ${letra} salva neste computador.`;
}

/* ---------- 4. revisão e envio ---------- */
let confirmarBranco = false;
function telaRevisao(n) {
  const aluno = alunoAtual();
  const local = progressoDaParte(aluno, n);
  const brancas = local.ordem.map((num, k) => ({ num, k })).filter((x) => !local.respostas[String(x.num)]);
  confirmarBranco = false;
  desenhar(h`
  <div class="aula-tela">
    ${barraAluno(aluno)}
    <h1>Revisar e enviar${temPartes() ? ` a Parte ${n}` : ""}</h1>
    ${grade(local, -1, n)}
    <div class="cartao secao">
      ${brancas.length
        ? h`<p class="aviso-aula erro"><strong>${brancas.length === 1 ? "Ficou 1 questão em branco" : `Ficaram ${brancas.length} questões em branco`}:</strong> ${brancas.map((b) => `Questão ${b.k + 1}`).join(", ")}. Questão em branco conta como erro.</p>
           <ul class="chips">${brancas.map((b) => h`<li><button type="button" class="chip" data-acao="ir" data-k="${b.k}" data-parte="${n}">Questão ${b.k + 1}</button></li>`)}</ul>`
        : h`<p><strong>Tudo respondido!</strong> Confira se quer trocar alguma resposta. Depois de enviar, não dá para mudar.</p>`}
    </div>
    <div class="botoes secao">
      <button type="button" class="botao" data-acao="enviar" data-parte="${n}" id="botao-enviar">${icone.check}Enviar${temPartes() ? ` a Parte ${n}` : ""}</button>
      <button type="button" class="botao secundario" data-acao="ir" data-k="${Math.max(0, local.ordem.length - 1)}" data-parte="${n}">${icone.voltar}Voltar às questões</button>
    </div>
    <p class="msg" id="msg-enviar" role="status"></p>
  </div>`, "Revisão");
}

async function enviarParte(n, botao) {
  const aluno = alunoAtual();
  const local = progressoDaParte(aluno, n);
  const brancas = local.ordem.filter((num) => !local.respostas[String(num)]).length;
  if (brancas && !confirmarBranco) {
    confirmarBranco = true;
    botao.textContent = `Enviar mesmo com ${plural(brancas, "questão", "questões")} em branco`;
    document.getElementById("msg-enviar").textContent = "Toque de novo para confirmar.";
    return;
  }
  botao.disabled = true;
  botao.textContent = "Enviando...";
  const respostas = {}, acertos = {};
  for (const num of local.ordem) {
    const r = local.respostas[String(num)] || "";
    respostas[num] = r;
    acertos[num] = r === item(num).key ? 1 : 0;
  }
  local.id_envio ||= novoId();
  const dados = {
    acao: "resposta",
    codigo: aluno.codigo,
    id_envio: local.id_envio,
    id: sim.id,
    parte: n,
    turma: aluno.turma,
    nome: aluno.nome,
    nome_digitado: !!aluno.nome_digitado,
    ordem: local.ordem,
    respostas,
    acertos,
    acertos_parte: Object.values(acertos).reduce((a, b) => a + b, 0),
    total_parte: local.ordem.length,
    tempo_min: Math.max(1, Math.round((local.tempo_ms || 0) / 60000)),
    data_hora: dataHoraLocal(),
    // para a planilha calcular a nota, a etapa (códigos D) e a conexão (códigos C)
    total_questoes: sim.items.length,
    codigos: Object.fromEntries(sim.items.map((i) => [i.n, i.code])),
  };
  const ok = await enviar(dados);
  gravarParte(aluno, sim.id, n, { ...local, enviada: ok, pendente: !ok, enviadaEm: ok ? agoraISO() : null });
  if (ok) statusRemoto.add(n);
  parteAberta = null;
  const resto = faltam(aluno);
  aviso = ok
    ? { tipo: "ok", texto: temPartes() ? `Parte ${n} enviada. ${resto ? `${resto === 1 ? "Falta 1 parte" : `Faltam ${resto} partes`}.` : "Você terminou todas as partes!"}` : "Enviado para o professor." }
    : { tipo: "erro", texto: "Não foi enviada, chame o professor. Suas respostas ficaram guardadas neste computador." };
  if (temPartes()) telaEntrada(); else (ok ? telaResultado() : telaFalhaUnica());
}

function telaFalhaUnica() {
  const aluno = alunoAtual();
  desenhar(h`<div class="aula-tela">${barraAluno(aluno)}<h1>${sim.titulo}</h1>
    <div class="aviso-aula erro" role="alert"><p><strong>Não foi enviada, chame o professor.</strong> Suas respostas ficaram guardadas neste computador.</p>
    <button type="button" class="botao pequeno" data-acao="reenviar">Tentar enviar de novo</button></div>
    <div class="botoes secao"><button type="button" class="botao fantasma" data-acao="trocar">Sair</button></div></div>`, "Não enviada");
}

/* ---------- 5. resultado ---------- */
async function respostasDeTodas(aluno) {
  const todas = {};
  let faltando = [];
  for (const p of partes()) {
    const local = lerParte(aluno, sim.id, p.n);
    if (local?.respostas && (local.enviada || local.pendente)) Object.assign(todas, local.respostas);
    else faltando.push(p.n);
  }
  if (faltando.length) {
    // partes enviadas de outro computador: o resultado vem da planilha
    try {
      const r = await consultar({ acao: "resultado", id: sim.id, turma: aluno.turma, nome: aluno.nome, codigo: aluno.codigo });
      if (r?.ok && r.respostas) {
        for (const [num, letra] of Object.entries(r.respostas)) if (!(num in todas)) todas[num] = letra;
        faltando = faltando.filter((n) => !partes().find((p) => p.n === n).questoes.every((q) => String(q) in r.respostas));
      }
    } catch { /* fica sem */ }
  }
  return { todas, faltando };
}

export function calcularResultado(simulado, respostas, habs) {
  const itens = simulado.items;
  const certo = (it) => respostas[String(it.n)] === it.key;
  const nota = (lista) => (lista.length ? r1((lista.filter(certo).length / lista.length) * 10) : null);
  const acertos = itens.filter(certo).length;
  const eixos = {};
  for (const it of itens) {
    const tema = habs[it.code]?.tema || "Outros";
    const e = (eixos[tema] ||= { tema, acertos: 0, total: 0 });
    e.total++;
    if (certo(it)) e.acertos++;
  }
  const porCodigo = {};
  for (const it of itens) {
    const c = (porCodigo[it.code] ||= { code: it.code, acertos: 0, total: 0, nivel: 9 });
    c.total++;
    if (certo(it)) c.acertos++;
    else c.nivel = Math.min(c.nivel, Number(String(it.level).slice(1)) || 9);
  }
  const fracas = Object.values(porCodigo)
    .filter((c) => c.acertos < c.total)
    .sort((a, b) => a.acertos / a.total - b.acertos / b.total || a.nivel - b.nivel)
    .slice(0, 3)
    .map((c) => ({ code: c.code, nome: habs[c.code]?.nome || c.code, dica: maiuscula(simulado.dicas?.[c.code] || habs[c.code]?.dica || "") }));
  return {
    acertos,
    total: itens.length,
    nota: r1((acertos / itens.length) * 10),
    etapa: nota(itens.filter((i) => i.code.startsWith("D"))),
    conexao: nota(itens.filter((i) => i.code.startsWith("C"))),
    eixos: Object.values(eixos),
    fracas,
  };
}

async function telaResultado() {
  const aluno = alunoAtual();
  if (!aluno) return telaIdentificacao();
  parteAberta = null;
  urlParte(null);
  desenhar(h`<div class="aula-tela">${barraAluno(aluno)}<h1>${sim.titulo}</h1><p class="carregando">Calculando o seu resultado...</p></div>`, "Calculando");
  const minhaTela = seqTela;
  const { todas, faltando } = await respostasDeTodas(aluno);
  if (seqTela !== minhaTela) return; // outra tela entrou enquanto calculava
  if (faltando.length) {
    desenhar(h`<div class="aula-tela">${barraAluno(aluno)}<h1>${sim.titulo}</h1>
      ${aviso ? h`<p class="aviso-aula ${aviso.tipo}" role="status">${aviso.texto}</p>` : ""}
      <div class="cartao"><p><strong>Todas as partes foram enviadas.</strong> O resultado completo aparece quando a planilha do professor responder.</p>
      <button type="button" class="botao" data-acao="ver-resultado">Tentar de novo</button></div>
      <div class="botoes secao"><button type="button" class="botao fantasma" data-acao="trocar">Sair</button></div></div>`, "Resultado");
    aviso = null;
    return;
  }
  const res = calcularResultado(sim, todas, habilidades);
  const faixa = faixaDaNota(res.nota, config);
  const liberada = ehTreino() || revisaoLiberada();
  const [ano, mes, dia] = LIBERAR_REVISAO_EM.split("-");
  desenhar(h`
  <div class="aula-tela resultado">
    ${barraAluno(aluno)}
    ${aviso ? h`<p class="aviso-aula ${aviso.tipo}" role="status">${aviso.texto}</p>` : ""}
    <h1>Seu resultado</h1>
    <p class="sub">${sim.titulo}</p>
    <section class="cartao placar" style="--cor-faixa:${faixa.cor}" aria-label="Nota">
      ${anelNota(res.nota, faixa.cor)}
      <div class="placar-info">
        <p class="placar-acertos"><strong>${res.acertos} de ${res.total}</strong> acertos</p>
        <p><strong>${faixa.nivel}</strong> · ${faixa.apelido}</p>
        <div class="notas-extra">
          ${res.etapa !== null ? h`<p><span class="sub pequeno">Etapa (questões D)</span><br><b class="nota-etapa">${nota1(res.etapa)}</b></p>` : ""}
          ${res.conexao !== null ? h`<p><span class="sub pequeno">Conexão com o 8º ano (questões C)</span><br><b class="nota-conexao">${nota1(res.conexao)}</b></p>` : ""}
        </div>
      </div>
    </section>
    <section class="cartao secao" aria-labelledby="t-faixa">
      <h2 id="t-faixa">Faixa</h2>
      ${reguaFaixas(res.nota, config.escala)}
      <p>${faixa.frase}</p>
    </section>
    <section class="cartao secao" aria-labelledby="t-eixos">
      <h2 id="t-eixos">Por eixo</h2>
      ${barrasTema(res.eixos.map((e) => ({ ...e, acumTotal: 0 })))}
    </section>
    <section class="secao" aria-labelledby="t-dicas">
      <h2 id="t-dicas">${icone.lista}O que estudar primeiro</h2>
      ${res.fracas.length ? h`<ol class="plano">${res.fracas.map((f, i) => h`<li class="cartao passo"><h3><span class="passo-num">${i + 1}</span>${f.nome}</h3>${f.dica ? h`<p><strong>Dica:</strong> ${f.dica}</p>` : ""}</li>`)}</ol>`
        : h`<div class="cartao"><p>Você acertou todas! Ajude um colega a revisar.</p></div>`}
    </section>
    <section class="secao" aria-labelledby="t-rev">
      <h2 id="t-rev">Revisão das questões</h2>
      ${liberada ? h`<div class="revisao">${sim.items.map((it) => {
        const m = todas[String(it.n)] || null;
        const ok = m === it.key;
        const marcada = it.options.find((o) => o.letter === m);
        const correta = it.options.find((o) => o.correct);
        return h`<details class="cartao item-revisao ${ok ? "acertou" : m ? "errou" : "branco"}">
          <summary><span class="sinal" aria-hidden="true">${ok ? icone.check : icone.alvo}</span><span><strong>Questão ${it.n}</strong> · ${it.short}</span><span class="estado ${ok ? "feito" : "melhorar"}">${ok ? "Acertou" : m ? "Errou" : "Em branco"}</span></summary>
          <div class="questao">${enunciadoHTML(it)}
            <ol class="alternativas">${it.options.map((o) => h`<li class="alternativa ${o.correct ? "correta" : ""} ${o.letter === m && !o.correct ? "errada" : ""}"><span class="letra">${o.letter}</span><span>${o.text}${o.letter === m ? h` <em class="sub">(sua resposta)</em>` : ""}</span></li>`)}</ol>
            ${marcada && !ok ? h`<p><strong>Erro provável:</strong> ${marcada.why}</p>` : ""}
            <p><strong>Correta: ${correta.letter}.</strong> ${correta.why}</p>
            <ol class="resolucao">${it.resolution.map((x) => h`<li>${x}</li>`)}</ol>
          </div></details>`;
      })}</div>`
      : h`<div class="cartao revisao-bloqueada"><p>${icone.relogio} A revisão das questões, com as alternativas corretas, abre em <strong>${dia}/${mes}/${ano}</strong>.</p></div>`}
    </section>
    <div class="botoes secao"><button type="button" class="botao fantasma" data-acao="trocar">Sair</button></div>
  </div>`, "Resultado");
  aviso = null;
}

/* ---------- ações ---------- */
raiz.addEventListener("click", async (ev) => {
  const el = ev.target.closest("[data-acao]");
  if (!el || !raiz.contains(el)) return;
  const a = el.dataset.acao;
  if (a === "trocar") return trocarAluno();
  if (a === "voltar-ident") { Object.assign(ident, { alunos: null, digitar: false, erro: "" }); return telaIdentificacao(); }
  if (a === "entrar-lista") return entrar(document.getElementById("nome-lista").value, false);
  if (a === "entrar-digitado") return entrar(document.getElementById("nome-digitado").value, true);
  if (a === "abrir-parte") return abrirParte(Number(el.dataset.parte));
  if (a === "ir") return abrirParte(Number(el.dataset.parte), Number(el.dataset.k));
  if (a === "responder") return responder(el.dataset.letra);
  if (a === "revisar") return telaRevisao(Number(el.dataset.parte));
  if (a === "enviar") return enviarParte(Number(el.dataset.parte), el);
  if (a === "ver-resultado") return telaResultado();
  if (a === "reenviar") {
    el.disabled = true;
    const n = await tentarPendentes();
    aviso = n ? { tipo: "ok", texto: "Enviado! Obrigado." } : { tipo: "erro", texto: "Ainda não foi. Chame o professor." };
    const aluno = alunoAtual();
    if (temPartes()) return telaEntrada();
    return aluno && situacaoDaParte(aluno, 1) === "enviada" ? telaResultado() : telaFalhaUnica();
  }
});

// tempo de prova: soma enquanto a página está à vista com uma parte aberta
setInterval(() => {
  if (!parteAberta || document.visibilityState !== "visible") return;
  const aluno = alunoAtual();
  if (!aluno) return;
  const local = lerParte(aluno, sim.id, parteAberta);
  if (!local || local.enviada) return;
  local.tempo_ms = (local.tempo_ms || 0) + 10000;
  gravarParte(aluno, sim.id, parteAberta, local);
}, 10000);

/* ---------- início ---------- */
async function iniciar() {
  if (await conferirVersao()) return; // recarregando com a versão nova
  try {
    await carregarDados();
  } catch (e) {
    console.warn(e);
    desenhar(erroHTML("Não encontrei esse simulado. Confira o link que o professor mandou."), "Ops");
    return;
  }
  if (sim.disponivel_ate && Date.now() > Date.parse(sim.disponivel_ate)) {
    desenhar(erroHTML("O prazo para fazer este simulado acabou. Ele volta quando o professor liberar."), "Encerrado");
    return;
  }
  await tentarPendentes();
  if (PAGINA_COMPLETO && !temPartes()) console.warn("completo.html espera um simulado com partes");
  if (alunoAtual()) irParaInicio(); else telaIdentificacao();
}

iniciar();
