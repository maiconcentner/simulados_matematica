/**
 * Planilha do professor para as páginas de aula (simulado.html e completo.html).
 * Como instalar: ver README, "Páginas de aula: planilha do professor".
 *
 * Abas: "Alunos" (Turma, Numero, Nome), "Respostas" (uma linha por parte enviada),
 * "Resumo" (uma linha por aluno e simulado), "Por questão" (acerto de cada questão por turma)
 * e "Códigos" (código de cada questão de cada simulado, usado nas notas da etapa e da conexão).
 *
 * Propriedade do script: CODIGO_AULA (Projeto > Configurações > Propriedades do script).
 * Nenhum nome de aluno fica no código: a lista está só na aba "Alunos".
 */

var TURMAS = ['9A', '9B', '9C'];
var NQ = 28; // colunas R1..R28 e C1..C28

function colunasRC_() {
  var r = [], c = [];
  for (var i = 1; i <= NQ; i++) { r.push('R' + i); c.push('C' + i); }
  return r.concat(c);
}
var CAB_RESPOSTAS = ['Data/hora', 'Simulado', 'Parte', 'Turma', 'Nome', 'Nome digitado', 'Tempo (min)', 'Acertos da parte'].concat(colunasRC_(), ['Ordem mostrada', 'id_envio']);
var CAB_RESUMO = ['Turma', 'Nome', 'Simulado', 'Partes recebidas', 'Acertos', 'Nota', 'Etapa', 'Conexão'].concat(colunasRC_(), ['Atualizado em']);
var CAB_CODIGOS = ['Simulado', 'Questão', 'Código'];

/* ---------- utilidades ---------- */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function planilha_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function aba_(nome, cabecalho) {
  var ss = planilha_();
  var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
  if (cabecalho && sh.getLastRow() === 0) sh.appendRow(cabecalho);
  return sh;
}
function linhas_(sh) {
  var v = sh.getDataRange().getValues();
  return v.length > 1 ? v.slice(1) : [];
}
function norm_(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').trim().toLowerCase(); }
function codigoCerto_(codigo) {
  var certo = PropertiesService.getScriptProperties().getProperty('CODIGO_AULA');
  return !!certo && String(codigo || '').trim().toUpperCase() === String(certo).trim().toUpperCase();
}
function uma_casa_(v) { return Math.round(v * 10) / 10; }

/** Confere código e turma. Devolve null se estiver tudo certo, ou o erro. */
function conferir_(codigo, turma) {
  if (!codigoCerto_(codigo)) return 'codigo';
  if (TURMAS.indexOf(String(turma)) < 0) return 'turma';
  return null;
}

/* ---------- leitura (GET) ---------- */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var erro = conferir_(p.codigo, p.turma);
  if (erro) return json_({ ok: false, erro: erro });

  if (p.acao === 'alunos') {
    var nomes = linhas_(aba_('Alunos', ['Turma', 'Numero', 'Nome']))
      .filter(function (l) { return String(l[0]).trim() === p.turma && String(l[2]).trim(); })
      .map(function (l) { return String(l[2]).replace(/\s+/g, ' ').trim(); });
    nomes.sort(function (a, b) { return a.localeCompare(b, 'pt-BR'); });
    return json_({ ok: true, alunos: nomes });
  }

  if (p.acao === 'status' || p.acao === 'resultado') {
    var meus = respostasDoAluno_(p.id, p.turma, p.nome);
    var partes = [];
    meus.forEach(function (l) { if (partes.indexOf(Number(l[2])) < 0) partes.push(Number(l[2])); });
    partes.sort(function (a, b) { return a - b; });
    if (p.acao === 'status') return json_({ ok: true, partes: partes });
    return json_({ ok: true, partes: partes, respostas: juntarRespostas_(meus).respostas });
  }

  return json_({ ok: false, erro: 'acao' });
}

function respostasDoAluno_(id, turma, nome) {
  return linhas_(aba_('Respostas', CAB_RESPOSTAS)).filter(function (l) {
    return String(l[1]) === String(id) && String(l[3]) === String(turma) && norm_(l[4]) === norm_(nome);
  });
}

/** Junta as linhas de um aluno: respostas e acertos pelo número da questão. */
function juntarRespostas_(linhas) {
  var respostas = {}, acertos = {};
  linhas.forEach(function (l) {
    for (var i = 1; i <= NQ; i++) {
      var r = l[7 + i], c = l[7 + NQ + i];
      if (c !== '' && c !== null) {
        respostas[i] = String(r || '');
        acertos[i] = Number(c) || 0;
      }
    }
  });
  return { respostas: respostas, acertos: acertos };
}

/* ---------- envio (POST) ---------- */
function doPost(e) {
  var d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, erro: 'json' });
  }
  if (d.acao !== 'resposta') return json_({ ok: false, erro: 'acao' });
  var erro = conferir_(d.codigo, d.turma);
  if (erro) return json_({ ok: false, erro: erro });

  var trava = LockService.getScriptLock();
  trava.waitLock(20000);
  try {
    var sh = aba_('Respostas', CAB_RESPOSTAS);
    var colId = CAB_RESPOSTAS.length - 1;
    var repetido = linhas_(sh).some(function (l) { return String(l[colId]) === String(d.id_envio); });
    if (repetido) return json_({ ok: true, repetido: true });

    var r = [], c = [];
    for (var i = 1; i <= NQ; i++) {
      var tem = d.respostas && Object.prototype.hasOwnProperty.call(d.respostas, String(i));
      r.push(tem ? String(d.respostas[i] || '') : '');
      c.push(tem ? (Number(d.acertos && d.acertos[i]) ? 1 : 0) : '');
    }
    sh.appendRow([d.data_hora || new Date(), d.id, Number(d.parte), d.turma, String(d.nome || '').trim(), d.nome_digitado ? 'sim' : 'não',
      Number(d.tempo_min) || '', Number(d.acertos_parte) || 0].concat(r, c, [(d.ordem || []).join(' '), d.id_envio]));

    guardarCodigos_(d.id, d.codigos);
    atualizarResumo_(d.id, d.turma, d.nome);
    atualizarPorQuestao_();
    return json_({ ok: true });
  } finally {
    trava.releaseLock();
  }
}

/** Guarda o código de cada questão do simulado (uma vez). */
function guardarCodigos_(id, codigos) {
  if (!codigos) return;
  var sh = aba_('Códigos', CAB_CODIGOS);
  var ja = linhas_(sh).some(function (l) { return String(l[0]) === String(id); });
  if (ja) return;
  Object.keys(codigos).map(Number).sort(function (a, b) { return a - b; }).forEach(function (n) {
    sh.appendRow([id, n, codigos[n]]);
  });
}
function codigosDo_(id) {
  var mapa = {};
  linhas_(aba_('Códigos', CAB_CODIGOS)).forEach(function (l) { if (String(l[0]) === String(id)) mapa[Number(l[1])] = String(l[2]); });
  return mapa;
}

/** Resumo: uma linha por aluno e simulado, juntando as partes. */
function atualizarResumo_(id, turma, nome) {
  var meus = respostasDoAluno_(id, turma, nome);
  var j = juntarRespostas_(meus);
  var codigos = codigosDo_(id);
  var nums = Object.keys(codigos).map(Number);
  var total = nums.length || NQ;
  var partes = [];
  meus.forEach(function (l) { if (partes.indexOf(Number(l[2])) < 0) partes.push(Number(l[2])); });
  partes.sort(function (a, b) { return a - b; });
  var acertos = 0, dCerto = 0, dTotal = 0, cCerto = 0, cTotal = 0;
  nums.forEach(function (n) {
    var ok = j.acertos[n] === 1;
    if (ok) acertos++;
    if (/^D/.test(codigos[n])) { dTotal++; if (ok) dCerto++; }
    if (/^C/.test(codigos[n])) { cTotal++; if (ok) cCerto++; }
  });
  var r = [], c = [];
  for (var i = 1; i <= NQ; i++) {
    r.push(j.respostas[i] !== undefined ? j.respostas[i] : '');
    c.push(j.acertos[i] !== undefined ? j.acertos[i] : '');
  }
  var linha = [turma, String(nome).trim(), id, partes.join(', '), acertos, uma_casa_(acertos / total * 10),
    dTotal ? uma_casa_(dCerto / dTotal * 10) : '', cTotal ? uma_casa_(cCerto / cTotal * 10) : ''].concat(r, c, [new Date()]);

  var sh = aba_('Resumo', CAB_RESUMO);
  var todas = linhas_(sh);
  for (var k = 0; k < todas.length; k++) {
    if (String(todas[k][0]) === String(turma) && norm_(todas[k][1]) === norm_(nome) && String(todas[k][2]) === String(id)) {
      sh.getRange(k + 2, 1, 1, linha.length).setValues([linha]);
      return;
    }
  }
  sh.appendRow(linha);
}

/** Por questão: acerto de cada questão por turma e no total, e a alternativa mais marcada. */
function atualizarPorQuestao_() {
  var linhas = linhas_(aba_('Respostas', CAB_RESPOSTAS));
  var sims = [];
  linhas.forEach(function (l) { if (sims.indexOf(String(l[1])) < 0) sims.push(String(l[1])); });
  var saida = [];
  var largura = 4 + TURMAS.length + 2;
  sims.forEach(function (id) {
    var doSim = linhas.filter(function (l) { return String(l[1]) === id; });
    var codigos = codigosDo_(id);
    var nums = Object.keys(codigos).map(Number).sort(function (a, b) { return a - b; });
    if (!nums.length) for (var q = 1; q <= NQ; q++) nums.push(q);
    saida.push(['Simulado ' + id].concat(vazio_(largura - 1)));
    saida.push(['Questão', 'Código'].concat(TURMAS.map(function (t) { return 'Acerto ' + t; }), ['Acerto total', 'Mais marcada', 'Respostas', 'Em branco']));
    nums.forEach(function (n) {
      var porTurma = TURMAS.map(function (t) {
        var da = doSim.filter(function (l) { return String(l[3]) === t && l[7 + NQ + n] !== '' && l[7 + NQ + n] !== null; });
        if (!da.length) return '';
        var ok = da.filter(function (l) { return Number(l[7 + NQ + n]) === 1; }).length;
        return Math.round(ok / da.length * 100) + '%';
      });
      var todos = doSim.filter(function (l) { return l[7 + NQ + n] !== '' && l[7 + NQ + n] !== null; });
      var okTotal = todos.filter(function (l) { return Number(l[7 + NQ + n]) === 1; }).length;
      var cont = {}, branco = 0;
      todos.forEach(function (l) {
        var letra = String(l[7 + n] || '');
        if (!letra) { branco++; return; }
        cont[letra] = (cont[letra] || 0) + 1;
      });
      var mais = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a] || a.localeCompare(b); })[0];
      saida.push([n, codigos[n] || ''].concat(porTurma, [todos.length ? Math.round(okTotal / todos.length * 100) + '%' : '', mais ? mais + ' (' + cont[mais] + ')' : '', todos.length, branco]));
    });
    saida.push(vazio_(largura));
  });
  var sh = aba_('Por questão');
  sh.clearContents();
  if (saida.length) sh.getRange(1, 1, saida.length, largura).setValues(saida);
}
function vazio_(n) { var a = []; for (var i = 0; i < n; i++) a.push(''); return a; }
