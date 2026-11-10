// Modelos das questões das Semanas 5 a 7 do Avalia.
import { n, rs, M, exigir, numericas, textuais, ehInteiro, arred, expr } from "./base.js?v=f5446e8815";
import * as F from "./figuras.js?v=f5446e8815";
import { percentuaisComDesconto, relacoesMetricasMaior, ladoDoQuadradoNegativo } from "./modelos_avalia_1.js?v=f5446e8815";

const CAP = "Figura gerada para treino.";
const fig = (svg, alt) => ({ svg, alt, caption: CAP });

export const modelos = [];
const def = (id, code, level, gerar) => modelos.push({ id, code, level, gerar });

/* ---------- S05-1 · C01 · juros compostos ---------- */
def("S05-1", "C01", "N3", (r) => {
  const C = r.passo(1000, 8000, 500), i = r.int(1, 5), t = r.um([2, 3]);
  const f = 1 + i / 100;
  const mont = arred(C * f ** t, 2);
  const passos = [];
  let v = C;
  for (let k = 1; k <= t; k++) { const novo = arred(v * f, 2); passos.push(`${k}º mês: ${n(v, 2)} × ${n(f, 2)} = ${n(novo, 2)}`); v = novo; }
  exigir(Math.abs(v - mont) < 0.011);
  const ctx = r.um(["Para comprar um notebook, uma estudante", "Para fazer uma viagem, um jovem", "Para comprar uma bicicleta, uma família", "Para trocar de celular, um estudante"]);
  return {
    short: "Juros compostos",
    stem: [`${ctx} aplicou ${rs(C)} em um investimento que rende juros compostos de ${i}% ao mês, sem fazer novos depósitos nem retiradas.`],
    ask: `Qual será o valor acumulado nesse investimento ao final de ${t} meses?`,
    options: numericas([
      [mont - C, `Calculou só os juros (${rs(mont - C)}). A pergunta pede o valor acumulado, que inclui os ${rs(C)} aplicados.`],
      [C * f, `Aplicou a taxa de ${i}% uma vez só, como se tivesse passado 1 mês.`],
      [C * (1 + (i * t) / 100), `Usou juros simples: ${i}% de ${rs(C)} por mês, sempre sobre o valor inicial. Em juros compostos, a taxa incide sobre o valor já atualizado.`],
      [mont, `Acerto. Mês a mês, multiplicando por ${n(f, 2)}: ${rs(mont)}. Ou, direto, ${n(C)} × ${n(f, 2)}${t === 2 ? "²" : "³"}.`],
      [arred(C * (1 + i / 10) ** t, 2), `Escreveu ${i}% como 0,${i} (que é ${i * 10}%). Como ${i}% = ${n(i / 100, 2)}, o fator de cada mês é ${n(f, 2)}.`],
      [arred(C * f ** (t - 1), 2), `Multiplicou por ${n(f, 2)} uma vez a menos (${t - 1} em vez de ${t}).`], [arred(C * f ** (t + 1), 2), `Multiplicou por ${n(f, 2)} uma vez a mais (${t + 1} em vez de ${t}).`],
    ], mont, rs, r),
    resolution: [`Em juros compostos, a cada mês o valor é multiplicado por 1 + ${n(i / 100, 2)} = ${n(f, 2)}.`, passos.join(". ") + ".", `O valor acumulado é ${rs(mont)}.`],
    check: `Em juros simples o valor seria ${rs(C * (1 + (i * t) / 100))}. Em juros compostos tem de ser um pouco maior, por causa dos juros sobre os juros.`,
  };
});

def("S05-2", "D03", "N3", (r) => ({ ...percentuaisComDesconto(r), short: "Percentuais sucessivos (aumento e desconto)" }));

/* ---------- S05-3 · D25 · gráfico de uma função afim ---------- */
def("S05-3", "D25", "N3", (r) => {
  const ctx = r.um([
    ["Uma empresa de entregas cobra uma taxa fixa por entrega mais um valor por quilômetro percorrido. O gráfico mostra o valor cobrado, em reais, em função da distância, de 0 a {X} quilômetros.", "uma entrega de {Z} quilômetros", "km", "quilômetro", "distância (km)"],
    ["Um aplicativo de corridas cobra uma taxa fixa por corrida mais um valor por quilômetro. O gráfico mostra o valor cobrado, em reais, em função da distância, de 0 a {X} quilômetros.", "uma corrida de {Z} quilômetros", "km", "quilômetro", "distância (km)"],
    ["Uma conta de água tem uma taxa fixa mais um valor por metro cúbico consumido. O gráfico mostra o valor da conta, em reais, em função do consumo, de 0 a {X} metros cúbicos.", "um consumo de {Z} metros cúbicos", "m³", "metro cúbico", "consumo (m³)"],
  ]);
  const b = r.int(3, 15), a = r.um([1.5, 2, 2.5, 3, 3.5, 4, 5]), X = r.um([10, 20]), Z = X === 10 ? r.um([12, 15, 18]) : r.um([25, 30]);
  const yX = b + a * X, certo = b + a * Z;
  const sem = a * Z, prop = (yX * Z) / X, duas = yX + (b + a * (Z - X)), naoDesc = b + (yX / X) * Z;
  const topo = Math.ceil(yX / 10) * 10;
  const figura = F.plano({
    xmin: 0, xmax: X, ymin: 0, ymax: topo, escala: { ux: 300 / X, uy: 200 / topo }, rotX: ctx[4], rotY: "R$",
    rotulosX: [0, X / 2, X], rotulosY: [0, topo / 2, topo],
    desenhar: ({ X: PX, Y }) => F.linha(PX(0), Y(b), PX(X), Y(yX), { cor: "var(--fig-destaque)", w: 3 }) + F.ponto(PX(0), Y(b)) + F.ponto(PX(X), Y(yX)) +
      F.texto(PX(0) + 12, Y(b) + 16, `(0; ${n(b)})`, { ancora: "start", tam: 12, halo: true }) + F.texto(PX(X) - 6, Y(yX) - 14, `(${X}; ${n(yX)})`, { ancora: "end", tam: 12, halo: true }),
  });
  return {
    short: "Gráfico de uma função afim",
    stem: [ctx[0].replace("{X}", X)],
    figure: fig(figura, `Gráfico de uma reta crescente que começa no ponto (0; ${n(b)}) e termina no ponto (${X}; ${n(yX)}), ambos marcados.`),
    ask: `Mantida a mesma forma de cobrança, qual é o valor, em reais, de ${ctx[1].replace("{Z}", Z)}?`,
    options: numericas([
      [sem, `Multiplicou ${Z} por ${n(a, 2)} e esqueceu a taxa fixa de ${n(b)} reais, que o gráfico mostra onde a reta corta o eixo vertical.`],
      [certo, `Acerto. Taxa fixa ${n(b)} e ${n(yX - b)} ÷ ${X} = ${n(a, 2)} por ${ctx[3]}: f(x) = ${n(b)} + ${n(a, 2)}x. f(${Z}) = ${n(b)} + ${n(a * Z, 2)} = ${n(certo, 2)}.`],
      [prop, `Tratou como proporcional: ${n(yX)} × ${Z} ÷ ${X}. Isso só vale quando a reta passa pela origem.`],
      [duas, `Somou o valor de ${X} com o de ${Z - X}, como se fossem duas cobranças. Assim a taxa fixa entra duas vezes.`],
      [naoDesc, `Achou o valor por ${ctx[3]} como ${n(yX)} ÷ ${X}, sem descontar a taxa fixa.`],
      [yX, `Respondeu o valor para ${X} ${ctx[2]}, que está no gráfico, e não o valor para ${Z}.`],
    ], certo, (v) => n(v, 2), r),
    resolution: [`A reta corta o eixo vertical em ${n(b)}: essa é a taxa fixa.`, `De 0 a ${X}, o valor sobe de ${n(b)} para ${n(yX)}: ${n(yX - b)} reais em ${X} ${ctx[2]}, ou ${n(a, 2)} por ${ctx[3]}. A lei é f(x) = ${n(b)} + ${n(a, 2)}x.`, `f(${Z}) = ${n(b)} + ${n(a, 2)} · ${Z} = ${n(certo, 2)} reais.`],
    check: `Conferindo com o gráfico: f(${X}) = ${n(b)} + ${n(a * X, 2)} = ${n(yX)}, o ponto marcado.`,
  };
});

/* ---------- S05-4 · D35 · poste e sombra ---------- */
def("S05-4", "D35", "N4", (r) => {
  const h = r.um([1.5, 1.6, 1.8, 2]), k = r.um([2, 3, 4]), H = arred(h * k, 2);
  const d = r.um([1.5, 2, 3, 4, 4.5, 6]);
  const s = arred(d / (k - 1), 2);
  exigir(ehInteiro(s * 10));
  const certo = d + s, curto = d + (d * h) / H;
  exigir(ehInteiro(curto * 10));
  const [ctx, apoio] = r.um([["Um poste de {H} m de altura ilumina uma calçada plana. Uma pessoa de {h} m de altura está em pé a {d} m da base do poste.", "poste"], ["Uma lâmpada está no alto de um mastro de {H} m numa praça plana. Uma criança de {h} m está em pé a {d} m da base do mastro.", "mastro"]]);
  return {
    short: "Semelhança de triângulos com fonte de luz",
    stem: [`${ctx.replace("{H}", n(H)).replace("{h}", n(h)).replace("{d}", n(d))} A luz da lâmpada projeta a sombra no chão, do lado oposto ao ${apoio}, como mostra a figura.`],
    figure: fig(F.poste({ hPoste: H, hPessoa: h, dist: d }), `À esquerda, um ${apoio} vertical de ${n(H)} m com a lâmpada no topo; a ${n(d)} m dele, uma ${apoio === "poste" ? "pessoa" : "criança"} de ${n(h)} m. Um raio de luz tracejado sai da lâmpada, passa pela cabeça da pessoa e chega ao chão na ponta da sombra.`),
    ask: `Qual é a distância, em metros, da base do ${apoio} até a ponta da sombra?`,
    options: numericas([
      [s, `Calculou o comprimento da sombra (${n(s)} m), mas a pergunta pede a distância desde a base do poste, que soma também os ${n(d)} m.`],
      [H - h, `Fez a diferença entre as alturas (${n(H)} ${M} ${n(h)}) e parou. Isso não é uma distância no chão.`],
      [curto, `Usou os ${n(d)} m como base do triângulo do poste. Esse triângulo vai da base do poste até a ponta da sombra: ${n(d)} m mais a sombra.`],
      [certo, `Acerto. Triângulos semelhantes: (${n(d)} + s) ÷ ${n(H)} = s ÷ ${n(h)}. Daí s = ${n(s)} m e a distância é ${n(d)} + ${n(s)} = ${n(certo)} m.`],
      [H, "Supôs que a distância é igual à altura do poste, como se o raio fizesse 45° com o chão."],
      [d, `Respondeu a distância até a pessoa (${n(d)} m), sem somar a sombra.`], [(d * H) / h, `Montou a proporção invertida: ${n(d)} · ${n(H)} ÷ ${n(h)}.`],
    ], certo, (v) => n(v, 1), r),
    resolution: [`O raio de luz forma dois triângulos retângulos semelhantes: o do ${apoio} (altura ${n(H)} m, base ${n(d)} + s) e o da pessoa (altura ${n(h)} m, base s, a sombra).`, `(${n(d)} + s) ÷ ${n(H)} = s ÷ ${n(h)}. Multiplicando em cruz: ${n(h)} · (${n(d)} + s) = ${n(H)} · s, então ${n(h * d, 2)} = ${n(H - h, 2)} · s e s = ${n(s)} m.`, `Distância da base do ${apoio} até a ponta da sombra: ${n(d)} + ${n(s)} = ${n(certo)} m.`],
    check: `A ${apoio === "poste" ? "pessoa" : "criança"} tem 1/${k} da altura do ${apoio}, então a sombra é 1/${k} da distância total: ${n(certo)} ÷ ${k} = ${n(s)} m.`,
  };
});

/* ---------- S05-5 · D12 · lei a partir de um texto ---------- */
def("S05-5", "D12", "N3", (r) => {
  const ctx = r.um([
    { txt: "Um ciclista está a {D} km do fim de uma trilha e pedala sempre em direção ao fim, a uma velocidade constante de {v} km por hora.", per: "Qual lei representa a distância d, em quilômetros, que falta para ele chegar ao fim da trilha, depois de t horas de pedalada?", y: "d", D: [40, 45, 60, 72, 80, 90], v: [10, 12, 15, 18, 20], u: "km", ut: "hora" },
    { txt: "Uma caixa-d'água com {D} litros está sendo esvaziada e perde {v} litros por minuto, sempre no mesmo ritmo.", per: "Qual lei representa o volume V, em litros, que ainda resta na caixa depois de t minutos?", y: "V", D: [300, 400, 500, 600, 800], v: [20, 25, 40, 50], u: "litros", ut: "minuto" },
  ]);
  const D = r.um(ctx.D), v = r.um(ctx.v);
  exigir(D % v === 0 && D !== v);
  const y = ctx.y, L = (t) => `${y}(t) = ${t}`;
  const fim = D / v;
  return {
    short: "Lei de uma função do 1º grau a partir de um texto",
    stem: [ctx.txt.replace("{D}", D).replace("{v}", v)],
    ask: ctx.per,
    options: textuais(r, [
      { text: L(`${D} ${M} ${v}t`), ok: true, why: `Acerto. No início (t = 0) são ${D} ${ctx.u}, e a cada ${ctx.ut} diminui ${v}: ${y}(t) = ${D} ${M} ${v}t. Chega a zero em t = ${fim}.` },
      { text: L(`${D}t ${M} ${v}`), why: `Trocou os papéis: o valor inicial (${D}) é o termo independente, e a variação (${v}) é que multiplica t.` },
      { text: L(`${v}t`), why: `Escreveu quanto já mudou (${v}t), e não quanto falta.` },
      { text: L(`${v}t + ${D}`), why: "Somou em vez de subtrair. Assim o valor aumentaria com o tempo, mas ele diminui." },
      { text: L(`${v}t ${M} ${D}`), why: `Trocou a ordem da subtração. Em t = 0 daria ${M}${D}, um valor negativo.` },
    ]),
    resolution: [`No início (t = 0), o valor é ${D}: esse é o termo independente.`, `A cada ${ctx.ut}, diminui ${v}: o coeficiente de t é ${M}${v}.`, `Logo, ${y}(t) = ${D} ${M} ${v}t.`],
    check: `Com t = ${fim / 2}: ${D} ${M} ${n((v * fim) / 2)} = ${n(D / 2)}, metade do valor inicial. Com t = ${fim}: ${y} = 0.`,
  };
});

def("S05-6", "D27", "N4", (r) => relacoesMetricasMaior(r));

/* ---------- S06-1 · C28 · perímetro do jardim em L ---------- */
def("S06-1", "C28", "N3", (r) => {
  const L = r.int(8, 16), A = r.int(6, 12), c = r.int(3, L - 3), b = r.int(2, A - 2);
  const per = 2 * (L + A), soMedidas = L + A + c + b;
  const doisRet = 2 * (c + A) + 2 * (L - c + b);
  const area = L * A - (L - c) * (A - b);
  const ctx = r.um(["O jardim de uma escola", "O terreno de uma horta comunitária", "O piso de um quintal"]);
  return {
    short: "Perímetro de figura composta (em L)",
    stem: [`${ctx} tem a forma da figura abaixo, em que todos os cantos são ângulos retos. É preciso cercar todo o contorno com uma tela.`],
    figure: fig(F.jardimL({ larg: L, alt: A, cima: c, baixoDir: b }), `Figura em forma de L, com cantos retos. Lado de baixo: ${L} m. Lado esquerdo: ${A} m. Lado de cima: ${c} m. Lado direito, na parte de baixo: ${b} m. Os dois lados do degrau, no canto de cima à direita, não têm medida escrita.`),
    ask: "Quantos metros de tela serão necessários para cercar todo o contorno?",
    options: numericas([
      [soMedidas, `Somou só os quatro lados com medida (${L} + ${A} + ${c} + ${b}) e esqueceu os dois lados do degrau.`],
      [per, `Acerto. Os lados sem medida valem ${L} ${M} ${c} = ${L - c} m e ${A} ${M} ${b} = ${A - b} m. Contorno: ${L} + ${b} + ${L - c} + ${A - b} + ${c} + ${A} = ${per} m.`],
      [doisRet, "Dividiu em dois retângulos e somou os dois perímetros, contando duas vezes o lado que fica dentro da figura."],
      [area, `Calculou a área (${area} m²), e não o contorno.`],
      [L * A, `Calculou a área do retângulo ${L} m por ${A} m, sem descontar o canto e confundindo área com contorno.`],
      [per - (L - c), `Esqueceu um dos lados do degrau (o de ${L - c} m, que não tem medida escrita).`], [L + A, `Somou só dois lados (${L} + ${A}), que é a metade do contorno.`],
    ], per, undefined, r),
    resolution: [`Os lados do degrau não têm medida, mas dá para descobrir: ${L} ${M} ${c} = ${L - c} m e ${A} ${M} ${b} = ${A - b} m.`, `O contorno é a soma de todos os lados de fora: ${L} + ${b} + ${L - c} + ${A - b} + ${c} + ${A}.`, `Logo, são necessários ${per} m de tela.`],
    check: `O contorno do L é igual ao do retângulo ${L} m por ${A} m: 2 × (${L} + ${A}) = ${per} m, porque o degrau só muda a posição de dois lados.`,
  };
});

/* ---------- S06-2 · D01 · expressão com radicais ---------- */
function raizSimples(R) {
  let c = 1, d = R;
  for (let k = Math.floor(Math.sqrt(R)); k >= 2; k--) if (R % (k * k) === 0) { c = k; d = R / (k * k); break; }
  return [c, d];
}
const rad = (c, d) => (d === 1 ? String(c) : `${c === 1 ? "" : c}√${d}`);
def("S06-2", "D01", "N3", (r) => {
  const k = r.um([2, 3, 5]), a = r.int(3, 6), b = r.int(2, a - 1), t = r.int(2, 3), m2 = r.um([2, 3, 5].filter((x) => x !== k));
  const m = m2 * t * t, q = m2 * t; // √m · √m2 = √(m2² t²) = m2 · t
  const A = a * a * k, B = b * b * k;
  const coef = a - b;
  const certo = `${q} + ${rad(coef, k)}`;
  const [c1, d1] = raizSimples(A + q * q - B);
  const [c2, d2] = raizSimples(A - B);
  const ctx = r.um(["O comprimento, em metros, de uma barra de ferro usada em uma obra", "O comprimento, em metros, de um cano usado numa instalação", "A altura, em metros, de um painel"]);
  return {
    short: "Expressão numérica com radicais",
    stem: [`${ctx} é dado pela expressão numérica:`, `√${A} + √${m} · √${m2} ${M} √${B}`],
    ask: "Qual é o valor dessa expressão, em metros?",
    options: textuais(r, [
      { text: certo, ok: true, why: `Acerto. √${A} = ${a}√${k}, √${m} · √${m2} = √${m * m2} = ${q} e √${B} = ${b}√${k}. Então ${a}√${k} + ${q} ${M} ${b}√${k} = ${certo}.` },
      { text: rad(c1, d1), why: `Juntou tudo numa raiz só: √(${A} + ${q * q} ${M} ${B}). Somar raízes não é somar os radicandos.` },
      { text: rad(q + coef, k), why: `Chegou em ${certo} e depois juntou o ${q} com o ${rad(coef, k)}. Um número inteiro e uma raiz não se juntam.` },
      { text: `${q} + ${rad(c2, d2)}`, why: `Subtraiu os radicandos: √${A} ${M} √${B} = √${A - B}. Raízes só se subtraem depois de simplificadas e com o mesmo radicando.` },
      { text: `${m * m2} + ${rad(coef, k)}`, why: `Fez √${m} · √${m2} = ${m} · ${m2} = ${m * m2} e esqueceu de tirar a raiz: o certo é √${m * m2} = ${q}.` },
    ]),
    resolution: [`Simplifique: √${A} = √(${a * a} · ${k}) = ${a}√${k} e √${B} = √(${b * b} · ${k}) = ${b}√${k}.`, `Produto: √${m} · √${m2} = √${m * m2} = ${q}.`, `Junte só as raízes semelhantes: ${a}√${k} + ${q} ${M} ${b}√${k} = ${certo}.`],
    check: `Com valores aproximados: √${A} ≈ ${n(Math.sqrt(A))}, √${B} ≈ ${n(Math.sqrt(B))}; ${n(Math.sqrt(A))} + ${q} ${M} ${n(Math.sqrt(B))} ≈ ${n(Math.sqrt(A) + q - Math.sqrt(B))}. E ${certo} ≈ ${n(q + coef * Math.sqrt(k))}.`,
  };
});

/* ---------- S06-3 · D18 · vistas de um sólido de cubos ---------- */
def("S06-3", "D18", "N3", (r) => {
  // alturas[y][x], y = 0 é a fileira da frente; 3 de largura, 2 de profundidade
  const alt = [[r.int(0, 2), r.int(0, 2), r.int(0, 2)], [r.int(0, 3), r.int(0, 3), r.int(0, 3)]];
  const frontal = [0, 1, 2].map((x) => Math.max(alt[0][x], alt[1][x]));
  const lateral = [0, 1].map((y) => Math.max(...alt[y])); // vista da direita: frente à esquerda
  const ocupadas = [];
  alt.forEach((linha, y) => linha.forEach((h, x) => { if (h > 0) ocupadas.push([x, y]); }));
  exigir(Math.max(...frontal) === 3 && frontal.every((h) => h > 0) && lateral.every((h) => h > 0));
  exigir(ocupadas.length >= 4 && ocupadas.length <= 5);
  exigir(new Set(frontal).size > 1 && lateral[0] !== lateral[1]);
  // cada vista: lista de células [coluna, linha de baixo para cima]
  const vFrontal = frontal.flatMap((h, x) => Array.from({ length: h }, (_, z) => [x, z]));
  const vLateral = lateral.flatMap((h, y) => Array.from({ length: h }, (_, z) => [y, z]));
  const vSuperior = ocupadas;
  const nomes = { superior: vSuperior, frontal: vFrontal, lateral: vLateral };
  const ordem = r.embaralhar(["superior", "frontal", "lateral"]);
  const pilha = F.pilhaDeCubos(alt, { s: 34, seta: true });
  let corpo = pilha.corpo, x0 = pilha.W + 16;
  const romanos = ["I", "II", "III"];
  ordem.forEach((nome, i) => {
    const cel = nomes[nome];
    const lmax = Math.max(...cel.map((c) => c[1])) + 1;
    const oy = pilha.H - 40 - lmax * 20;
    corpo += F.grade(cel, { s: 20, ox: x0, oy }) + F.texto(x0 + 30, pilha.H - 18, romanos[i], { tam: 14 });
    corpo += "";
    x0 += Math.max(...cel.map((c) => c[0])) * 20 + 20 + 22;
  });
  const svg = F.svg(x0 + 4, pilha.H, corpo);
  const perm = (o) => o.join(", ").replace(/, ([^,]*)$/, " e $1");
  const todas = [["frontal", "lateral", "superior"], ["frontal", "superior", "lateral"], ["superior", "frontal", "lateral"], ["superior", "lateral", "frontal"], ["lateral", "frontal", "superior"], ["lateral", "superior", "frontal"]];
  const erradas = r.alguns(todas.filter((o) => o.join() !== ordem.join()), 4);
  const porque = (o) => {
    const trocas = o.map((v, i) => (v !== ordem[i] ? `a figura ${romanos[i]} é a vista ${ordem[i]}, não a ${v}` : null)).filter(Boolean);
    return `Trocou as vistas: ${trocas.join("; ")}. A frontal tem 3 colunas (a largura), a lateral tem 2 (a profundidade) e a superior não mostra alturas, só as posições ocupadas no chão.`;
  };
  return {
    short: "Vistas de um sólido formado por cubos",
    stem: ["À esquerda, a figura mostra um sólido montado com cubos iguais. A seta indica a frente do sólido. À direita, as figuras I, II e III são vistas desse sólido (a vista lateral é a do lado direito)."],
    figure: fig(svg, `Sólido de cubos em perspectiva, com 3 cubos de largura e 2 de profundidade. Fileira da frente: colunas de ${alt[0].join(", ")} cubos; fileira de trás: colunas de ${alt[1].join(", ")} cubos, da esquerda para a direita. À direita, três vistas numeradas I, II e III.`),
    ask: "As figuras I, II e III são, nessa ordem, as vistas:",
    options: textuais(r, [
      { text: perm(ordem), ok: true, why: `Acerto. De frente se veem 3 colunas com ${frontal.join(", ")} cubos de altura; do lado direito, 2 colunas com ${lateral.join(" e ")}; de cima, as ${ocupadas.length} posições ocupadas no chão.` },
      ...erradas.map((o) => ({ text: perm(o), why: porque(o) })),
    ]),
    resolution: [`De cima, vemos só as posições ocupadas no chão: ${ocupadas.length} quadrados em duas fileiras.`, `De frente, vemos 3 colunas (a largura do sólido), com alturas ${frontal.join(", ")}.`, `Do lado direito, vemos 2 colunas (a profundidade), com alturas ${lateral.join(" e ")}. Resposta: ${perm(ordem)}.`],
    check: "A vista frontal tem a largura do sólido (3 cubos) e a lateral tem a profundidade (2 cubos). A superior não mostra alturas.",
  };
});

/* ---------- S06-4 · D37 · Teorema de Tales ---------- */
def("S06-4", "D37", "N4", (r) => {
  const a1 = r.passo(10, 40, 5), a2 = r.passo(15, 50, 5), fator = r.um([1.2, 1.5, 0.8, 1.4, 1.6, 2]);
  exigir(a1 !== a2);
  const tot = a1 + a2, B = arred(tot * fator, 2);
  const x = arred((B * a2) / tot, 2), outro = B - x;
  exigir(ehInteiro(B) && ehInteiro(x * 10) && ehInteiro(((B * a1) / a2) * 10));
  return {
    short: "Teorema de Tales (ruas paralelas)",
    stem: [`Na planta de um bairro, as ruas 1, 2 e 3 são paralelas e cortam as avenidas A e B, como mostra a figura. Pela Avenida A, a distância da Rua 1 à Rua 2 é de ${a1} m, e da Rua 2 à Rua 3 é de ${a2} m. Pela Avenida B, a distância da Rua 1 à Rua 3 é de ${n(B)} m.`],
    figure: fig(F.tales({ a1, a2, rotA1: `${a1} m`, rotA2: `${a2} m`, rotB: `${n(B)} m (total)` }), `Três ruas paralelas horizontais cortadas por duas avenidas. Na Avenida A, os trechos medem ${a1} m e ${a2} m. Na Avenida B, o total da Rua 1 à Rua 3 é ${n(B)} m.`),
    ask: "Qual é a distância, em metros, da Rua 2 à Rua 3 pela Avenida B?",
    options: numericas([
      [outro, `Calculou o trecho da Rua 1 à Rua 2 pela Avenida B (${a1}/${tot} = x/${n(B)}), e não o pedido.`],
      [a2, `Copiou o trecho correspondente da Avenida A, como se fossem iguais. Pelo Teorema de Tales, os trechos são proporcionais.`],
      [a2 + (B - tot) / 2, `Dividiu a diferença entre as avenidas (${n(B - tot)} m) igualmente entre os dois trechos. Ela se reparte na proporção dos trechos.`],
      [x, `Acerto. ${a2}/${tot} = x/${n(B)}, então x = ${n(B)} · ${a2} ÷ ${tot} = ${n(x)}.`],
      [(B * a1) / a2, `Montou a proporção com trechos que não se correspondem (${a1}/${a2} = x/${n(B)}).`],
    ], x),
    resolution: [`Pelo Teorema de Tales, os trechos entre as mesmas ruas são proporcionais. Na Avenida A, da Rua 2 à Rua 3 há ${a2} m de um total de ${a1} + ${a2} = ${tot} m.`, `Na Avenida B, o trecho x é a mesma fração do total de ${n(B)} m: ${a2}/${tot} = x/${n(B)}.`, `x = ${n(B)} · ${a2} ÷ ${tot} = ${n(x)} m.`],
    check: `O outro trecho da Avenida B mede ${n(B)} ${M} ${n(x)} = ${n(outro)} m, e a razão é a mesma nos dois: ${n(outro)}/${a1} = ${n(x)}/${a2} = ${n(fator)}.`,
  };
});

/* ---------- S06-5 · D19 · cubos que faltam ---------- */
def("S06-5", "D19", "N4", (r) => {
  // alturas[y][x]: y = 0 frente; mais altas atrás e à esquerda
  const alt = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let y = 2; y >= 0; y--)
    for (let x = 0; x < 3; x++) {
      const tras = y < 2 ? alt[y + 1][x] : 3, esq = x > 0 ? alt[y][x - 1] : 3;
      alt[y][x] = r.int(1, Math.min(tras, esq));
    }
  const total = alt.flat().reduce((a, b) => a + b, 0);
  const falta = 27 - total;
  const vaziosCima = alt.flat().filter((h) => h < 3).length;
  const frente = alt[0].reduce((s, h) => s + 3 - h, 0);
  exigir(falta >= 5 && falta <= 16 && alt[2][0] === 3);
  const nome = r.um(["Lucas", "Marina", "Pedro", "Júlia", "Caio", "Bia"]);
  const p = F.pilhaDeCubos([...alt], { s: 36 });
  const camadas = [1, 2, 3].map((z) => alt.flat().filter((h) => h < z).length);
  return {
    short: "Cubos que faltam numa pilha (cubos escondidos)",
    stem: [`${nome} montou a pilha de cubos iguais da figura sobre uma base quadrada de 3 por 3 cubos. Nenhum cubo está solto: cada um está no chão ou em cima de outro cubo. As colunas mais altas ficam atrás e à esquerda.`],
    figure: fig(F.svg(p.W, p.H, p.corpo), `Pilha de cubos iguais em perspectiva, sobre uma base de 3 por 3. Da fileira de trás para a da frente, as colunas têm alturas ${alt[2].join(", ")}; ${alt[1].join(", ")}; e ${alt[0].join(", ")}, da esquerda para a direita.`),
    ask: "Quantos cubos ainda faltam para transformar essa pilha em um cubo maior, com 3 cubos de comprimento, 3 de largura e 3 de altura?",
    options: numericas([
      [vaziosCima, `Contou só os lugares vazios da camada de cima (${vaziosCima}) e esqueceu os das camadas de baixo.`],
      [falta, `Acerto. A pilha tem ${total} cubos e o cubo maior tem 3 × 3 × 3 = 27. Faltam 27 ${M} ${total} = ${falta}.`],
      [total, `Contou certo os cubos da pilha (${total}), mas respondeu esse número em vez de calcular quantos faltam.`],
      [frente, `Contou só o que falta na fileira da frente (${frente}).`],
      [27 - 9, "Contou só a camada de baixo (9 cubos) e fez 27 − 9. Os cubos escondidos de cima também fazem parte da pilha."],
    ], falta),
    resolution: [`Conte os cubos coluna por coluna, inclusive os escondidos: fileira de trás ${alt[2].join(" + ")}; do meio ${alt[1].join(" + ")}; da frente ${alt[0].join(" + ")}. A pilha tem ${total} cubos.`, "O cubo maior tem 3 × 3 × 3 = 27 cubos.", `Faltam 27 ${M} ${total} = ${falta} cubos.`],
    check: `Por camadas: na de baixo faltam ${camadas[0]}, na do meio ${camadas[1]} e na de cima ${camadas[2]}, total ${camadas[0] + camadas[1] + camadas[2]}.`,
  };
});

def("S06-6", "D10", "N4", (r) => ladoDoQuadradoNegativo(r));

/* ---------- S07-1 · C24 · equação do 2º grau ---------- */
def("S07-1", "C24", "N3", (r) => {
  const w = r.int(3, 12), d = r.int(1, 6);
  const A = w * (w + d), sq = 2 * w + d;
  const ctx = r.um([["Um tapete retangular", "tapete"], ["Um terreno retangular", "terreno"], ["Uma horta retangular", "horta"], ["Um quadro retangular", "quadro"]]);
  const perim = (A - 2 * d) / 4, soma = (A - d) / 2;
  return {
    short: "Problema que leva a uma equação do 2º grau",
    stem: [`${ctx[0]} tem ${A} m² de área. O comprimento é ${d} m maior que a largura.`],
    ask: `Qual é a largura, em metros?`,
    options: numericas([
      [w, `Acerto. Largura x e comprimento x + ${d}: x(x + ${d}) = ${A}, x² + ${d}x ${M} ${A} = 0. Δ = ${d * d + 4 * A}, √Δ = ${sq}, x = (${M}${d} + ${sq}) ÷ 2 = ${w}.`],
      [perim, `Usou ${A} como perímetro: 2x + 2(x + ${d}) = ${A}. A área é o produto dos lados.`],
      [w + d, `Errou o sinal na fórmula: fez (${d} + ${sq}) ÷ 2. Esse é o comprimento, não a largura.`],
      [2 * w, `Esqueceu de dividir por 2a: fez ${M}${d} + ${sq} = ${2 * w}.`],
      [soma, `Somou os lados em vez de multiplicar: x + (x + ${d}) = ${A}.`],
      [w - d / 2, `Dividiu só o √Δ por 2: ${M}${d} + ${sq} ÷ 2. O 2a divide tudo: (${M}${d} + ${sq}) ÷ 2.`], [d, `Respondeu a diferença entre o comprimento e a largura (${d} m), que já estava no enunciado.`],
    ], w, undefined, r),
    resolution: [`Chame a largura de x. O comprimento é x + ${d}, e a área é x · (x + ${d}) = ${A}.`, `x² + ${d}x ${M} ${A} = 0. Δ = ${d}² + 4 · ${A} = ${d * d + 4 * A}, e √${d * d + 4 * A} = ${sq}.`, `x = (${M}${d} ± ${sq}) ÷ 2, então x = ${w} ou x = ${M}${w + d}. Uma medida não é negativa: a largura é ${w} m.`],
    check: `Largura ${w} m e comprimento ${w + d} m: ${w} · ${w + d} = ${A} m². Confere.`,
  };
});

/* ---------- S07-2 · D08 · trinômio e raiz dupla ---------- */
def("S07-2", "D08", "N3", (r) => {
  const a = r.int(2, 9), neg = r.um([true, true, false]);
  const s = neg ? M : "+", raiz = neg ? a : -a;
  const eq = `x² ${s} ${2 * a}x + ${a * a} = 0`;
  const certoF = `(x ${s} ${a})²`;
  const oposF = `(x ${neg ? "+" : M} ${a})²`;
  const R = n(raiz), Ro = n(-raiz);
  return {
    short: "Fatorar o trinômio e achar as raízes da equação",
    stem: [`Para resolver a equação ${eq}, uma estudante fatorou o primeiro membro usando um produto notável.`],
    ask: "Qual alternativa mostra a fatoração correta e a solução da equação?",
    options: textuais(r, [
      { text: `${oposF} = 0, então x = ${Ro}.`, why: `Errou o sinal do binômio. Como o termo do meio é ${s}${2 * a}x, o trinômio é ${certoF}.` },
      { text: `(x ${M} ${a})(x + ${a}) = 0, então x = ${a} ou x = ${M}${a}.`, why: `Confundiu com a diferença de quadrados: (x ${M} ${a})(x + ${a}) dá x² ${M} ${a * a}, sem o termo do meio.` },
      { text: `x(x ${s} ${2 * a}) + ${a * a} = 0, então x = 0 ou x = ${n(neg ? 2 * a : -2 * a)}.`, why: `Pôs x em evidência só em dois termos e ignorou o ${a * a}. Essa forma não é um produto igual a zero.` },
      { text: `${certoF} = 0, então x = ${R}.`, ok: true, why: `Acerto. x² = (x)², ${a * a} = ${a}² e 2 · x · ${a} = ${2 * a}x. ${certoF} = 0 só quando x ${s} ${a} = 0, então x = ${R}.` },
      { text: `${certoF} = 0, então x = ${a} ou x = ${M}${a}.`, why: `Fatorou certo, mas achou duas raízes. ${certoF} = 0 só acontece quando x ${s} ${a} = 0.` },
    ]),
    resolution: [`x² ${s} ${2 * a}x + ${a * a} tem dois quadrados, x² e ${a * a} = ${a}², e o termo do meio é 2 · x · ${a} = ${2 * a}x.`, `Então é um trinômio quadrado perfeito: ${certoF}.`, `${certoF} = 0 só quando x ${s} ${a} = 0. A solução é x = ${R}.`],
    check: `Para x = ${R}: ${a * a} ${M} ${2 * a * a} + ${a * a} = 0, confere. Para x = ${Ro}: ${a * a} + ${2 * a * a} + ${a * a} = ${4 * a * a}, não serve.`,
  };
});

/* ---------- S07-3 · D05 · volume do cilindro ---------- */
def("S07-3", "D05", "N3", (r) => {
  const ctx = r.um([
    ["Uma fábrica embala molho de tomate em latas cilíndricas com {D} cm de diâmetro e {h} cm de altura, como mostra a figura.", "Qual é o volume de uma lata, em cm³? Use π = 3.", "cm", "cm³", [6, 8, 10], [10, 12, 14, 15]],
    ["Um copo cilíndrico tem {D} cm de diâmetro e {h} cm de altura, como mostra a figura.", "Quantos cm³ cabem no copo cheio? Use π = 3.", "cm", "cm³", [6, 8], [9, 10, 12]],
    ["Uma caixa-d'água cilíndrica tem {D} m de diâmetro e {h} m de altura, como mostra a figura.", "Qual é o volume da caixa-d'água, em m³? Use π = 3.", "m", "m³", [2, 4, 6], [2, 3, 5]],
  ]);
  const D = r.um(ctx[4]), h = r.um(ctx[5]), rr = D / 2;
  const certo = 3 * rr * rr * h;
  return {
    short: "Volume de um cilindro (diâmetro dado)",
    stem: [ctx[0].replace("{D}", D).replace("{h}", h)],
    figure: fig(F.cilindro({ diam: `${D} ${ctx[2]}`, alt: `${h} ${ctx[2]}` }), `Cilindro em pé. Na tampa, um segmento passa pelo centro com a medida ${D} ${ctx[2]} (o diâmetro). Ao lado, uma seta vertical marca a altura de ${h} ${ctx[2]}.`),
    ask: ctx[1],
    options: numericas([
      [3 * rr * h, `Não elevou o raio ao quadrado: fez 3 · ${rr} · ${h}. A área da base é π · r².`],
      [certo, `Acerto. Raio: ${D} ÷ 2 = ${rr}. Base: 3 · ${rr}² = ${3 * rr * rr}. Volume: ${3 * rr * rr} · ${h} = ${n(certo)} ${ctx[3]}.`],
      [D * D * h, `Usou o diâmetro ao quadrado e esqueceu o π: ${D}² · ${h}.`],
      [3 * ((D * D) / 2) * h, `Elevou o diâmetro ao quadrado e só depois dividiu por 2 (${D * D} ÷ 2 = ${(D * D) / 2}, em vez de ${rr}² = ${rr * rr}).`],
      [3 * D * D * h, `Usou o diâmetro como se fosse o raio: 3 · ${D}² · ${h}.`],
      [rr * rr * h, `Esqueceu o π: ${rr}² · ${h}.`], [3 * rr * rr, `Calculou só a área da base (3 · ${rr}² = ${3 * rr * rr}) e não multiplicou pela altura.`],
    ], certo, undefined, r),
    resolution: [`O raio é a metade do diâmetro: r = ${D} ÷ 2 = ${rr} ${ctx[2]}.`, `Área da base: π · r² = 3 · ${rr}² = ${3 * rr * rr}.`, `Volume: área da base · altura = ${3 * rr * rr} · ${h} = ${n(certo)} ${ctx[3]}.`],
    check: `Uma caixa de ${D} por ${D} por ${h}, que envolve o cilindro, tem ${n(D * D * h)}; o cilindro tem de ter menos, cerca de 3/4 disso.`,
  };
});

/* ---------- S07-4 · D30 · escada que escorrega ---------- */
const ESCADAS = [[2.5, [[0.7, 2.4], [1.5, 2]]], [5, [[1.4, 4.8], [3, 4]]], [6.5, [[1.6, 6.3], [2.5, 6], [3.3, 5.6], [3.9, 5.2]]], [7.5, [[2.1, 7.2], [4.5, 6]]], [10, [[2.8, 9.6], [6, 8]]], [1.3, [[0.5, 1.2]]], [8.5, [[1.3, 8.4], [3.6, 7.7], [4, 7.5], [5.1, 6.8]]]];
def("S07-4", "D30", "N4", (r) => {
  const [L, pares] = r.um(ESCADAS.filter((e) => e[1].length >= 2));
  const [p1, p2] = r.alguns(pares, 2).sort((a, b) => a[0] - b[0]);
  const [d1, h1] = p1, [d2, h2] = p2;
  const desceu = arred(h1 - h2, 2);
  return {
    short: "Pitágoras em dois passos (escada que escorrega)",
    stem: [`Uma escada de ${n(L)} m de comprimento está apoiada em uma parede vertical, com o pé a ${n(d1)} m da parede. O pé da escada escorregou e ficou a ${n(d2)} m da parede, com o topo ainda encostado nela, como mostra a figura.`],
    figure: fig(F.escada({ comp: L, antes: d1, depois: d2 }), `Parede vertical e chão horizontal. Uma escada tracejada (antes) vai do chão, a ${n(d1)} m da parede, até um ponto alto da parede. Uma escada contínua (depois) vai do chão, a ${n(d2)} m da parede, até um ponto mais baixo. A escada tem ${n(L)} m.`),
    ask: "Quantos metros o topo da escada desceu?",
    options: numericas([
      [desceu, `Acerto. Antes: altura² = ${n(L * L)} ${M} ${n(d1 * d1)} = ${n(h1 * h1)}, altura ${n(h1)} m. Depois: ${n(L * L)} ${M} ${n(d2 * d2)} = ${n(h2 * h2)}, altura ${n(h2)} m. Desceu ${n(h1)} ${M} ${n(h2)} = ${n(desceu)} m.`],
      [d2 - d1, `Achou que o topo desce o mesmo tanto que o pé se afasta (${n(d2)} ${M} ${n(d1)}). Cada posição forma um triângulo diferente.`],
      [h1 * h1 - h2 * h2, `Fez a conta sem tirar as raízes: ${n(h1 * h1)} ${M} ${n(h2 * h2)}. Esses são os quadrados das alturas.`],
      [h2, `Calculou a altura depois do escorregão (${n(h2)} m), mas não fez a diferença.`],
      [h1, `Calculou só a altura de antes (${n(h1)} m) e parou.`],
      [0, "Achou que o topo não desce, porque a escada continua com o mesmo comprimento. O comprimento não muda, mas o triângulo muda."],
    ], desceu, undefined, r),
    resolution: [`Antes: altura² + ${n(d1)}² = ${n(L)}², então altura² = ${n(L * L)} ${M} ${n(d1 * d1)} = ${n(h1 * h1)} e a altura é ${n(h1)} m.`, `Depois: altura² = ${n(L * L)} ${M} ${n(d2 * d2)} = ${n(h2 * h2)}, e a altura é ${n(h2)} m.`, `O topo desceu ${n(h1)} ${M} ${n(h2)} = ${n(desceu)} m.`],
    check: `${n(d1)}² + ${n(h1)}² = ${n(L * L)} e ${n(d2)}² + ${n(h2)}² = ${n(L * L)}: nas duas posições a escada tem ${n(L)} m.`,
  };
});

/* ---------- S07-5 · D06 · prisma de base trapezoidal ---------- */
def("S07-5", "D06", "N4", (r) => {
  const C = r.passo(8, 25, 1), W = r.int(3, 10), raso = r.um([0.5, 1, 1.2]), fundo = r.um([1.5, 2, 2.5, 3]);
  const trap = ((raso + fundo) * C) / 2, V = trap * W;
  exigir(ehInteiro(V * 10) && ehInteiro(trap * 10));
  return {
    short: "Volume de prisma de base trapezoidal (piscina)",
    stem: [`Uma piscina tem ${C} m de comprimento e ${W} m de largura. O fundo é inclinado: a profundidade vai de ${n(raso)} m, na parte rasa, até ${n(fundo)} m, na parte funda, como mostra a figura.`],
    figure: fig(F.piscina({ comp: C, larg: W, raso, fundo }), `Piscina em forma de prisma, em perspectiva. A face da frente é um trapézio: borda de cima ${C} m, lado esquerdo ${n(raso)} m de profundidade e direito ${n(fundo)} m. A largura, para trás, é ${W} m.`),
    ask: "Quantos metros cúbicos de água cabem na piscina cheia?",
    options: numericas([
      [trap, `Calculou só a área do trapézio (${n(trap)} m²) e não multiplicou pela largura.`],
      [raso * C * W, `Usou só a profundidade da parte rasa, como se a piscina toda tivesse ${n(raso)} m.`],
      [V, `Acerto. Base (trapézio): (${n(raso)} + ${n(fundo)}) · ${C} ÷ 2 = ${n(trap)} m². Volume: ${n(trap)} · ${W} = ${n(V)} m³.`],
      [fundo * C * W, `Usou só a profundidade da parte funda, como se a piscina toda tivesse ${n(fundo)} m.`],
      [(raso + fundo) * C * W, "Somou as profundidades e esqueceu de dividir por 2 na área do trapézio."],
      [C * W, `Calculou só a área da superfície da água (${C} · ${W}) e esqueceu a profundidade.`], [((fundo - raso) * C * W) / 2, `Usou a diferença entre as profundidades (${n(fundo)} ${M} ${n(raso)}) em vez da soma.`],
    ], V, undefined, r),
    resolution: ["A piscina é um prisma. As faces iguais e paralelas são os trapézios das laterais; elas são a base.", `Área do trapézio: (${n(raso)} + ${n(fundo)}) · ${C} ÷ 2 = ${n(trap)} m².`, `Volume: área da base · distância entre as bases = ${n(trap)} · ${W} = ${n(V)} m³.`],
    check: `O volume fica entre o de uma piscina toda com ${n(raso)} m (${n(raso * C * W)} m³) e o de uma toda com ${n(fundo)} m (${n(fundo * C * W)} m³). A profundidade média é ${n((raso + fundo) / 2)} m.`,
  };
});

/* ---------- S07-6 · D35 · sombra na parede ---------- */
def("S07-6", "D35", "N4", (r) => {
  const dB = r.um([20, 25, 30, 40, 50, 60]), m = r.um([1, 1.5, 2, 3]), dP = dB * m, hB = r.um([12, 15, 18, 20, 24, 30]);
  const tot = dB + dP, certo = (hB * tot) / dB;
  const vals = [(hB * dB) / tot, (hB * dB) / dP, (hB * tot) / dP, (hB * dP) / dB, certo];
  exigir(vals.every((v) => ehInteiro(v * 10)));
  const obj = r.um(["boneco", "bonequinho de papelão", "vaso"]);
  return {
    short: "Semelhança de triângulos: sombra na parede",
    stem: [`Em uma brincadeira de sombras, uma lanterna foi colocada no chão, a ${dB} cm de um ${obj} de ${hB} cm de altura. A parede fica ${n(dP)} cm atrás do ${obj}. A luz da lanterna projeta na parede a sombra do ${obj}, como mostra a figura.`],
    figure: fig(F.lanterna({ dBoneco: dB, hBoneco: hB, dParede: dP }), `Vista de lado. No chão, à esquerda, uma lanterna. A ${dB} cm dela, um ${obj} de ${hB} cm. ${n(dP)} cm depois, uma parede. Uma linha tracejada sai da lanterna, passa pelo topo do ${obj} e chega à parede, marcando a sombra.`),
    ask: `Qual é a altura da sombra do ${obj} na parede, em centímetros?`,
    options: numericas([
      [vals[0], `Inverteu a razão: fez ${hB} · ${dB} ÷ ${n(tot)}. A sombra fica mais longe da lanterna, então é maior que ${hB} cm.`],
      [vals[1], `Inverteu a razão e não somou as distâncias: ${hB} · ${dB} ÷ ${n(dP)}.`],
      [vals[2], `Pôs a distância do ${obj} até a parede (${n(dP)} cm) no triângulo pequeno. O triângulo pequeno vai da lanterna até o ${obj} (${dB} cm).`],
      [vals[3], `Usou só a distância do ${obj} até a parede como base do triângulo grande. Ela vai da lanterna até a parede: ${dB} + ${n(dP)} = ${n(tot)} cm.`],
      [certo, `Acerto. Pequeno: base ${dB} e altura ${hB}. Grande: base ${n(tot)} e altura x. x ÷ ${hB} = ${n(tot)} ÷ ${dB} = ${n(tot / dB)}, então x = ${n(certo)} cm.`],
      [hB + dP, `Somou a altura do ${obj} com a distância até a parede. Altura e distância não se somam.`], [tot, `Respondeu a distância da lanterna até a parede (${n(tot)} cm), e não a altura da sombra.`],
    ], certo, undefined, r),
    resolution: [`Os dois triângulos têm um vértice na lanterna. O pequeno vai até o ${obj}: base ${dB} cm e altura ${hB} cm.`, `O grande vai até a parede: base ${dB} + ${n(dP)} = ${n(tot)} cm e altura igual à da sombra.`, `Semelhança: sombra ÷ ${hB} = ${n(tot)} ÷ ${dB} = ${n(tot / dB)}. A sombra tem ${hB} · ${n(tot / dB)} = ${n(certo)} cm.`],
    check: `A parede está ${n(tot / dB)} vezes mais longe da lanterna que o ${obj}, então a sombra é ${n(tot / dB)} vezes mais alta: ${n(certo)} ÷ ${n(tot)} = ${hB} ÷ ${dB} = ${n(hB / dB)}.`,
  };
});
