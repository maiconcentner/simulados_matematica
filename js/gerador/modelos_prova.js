// Modelos das 10 questões do simulado de prova da Etapa 3 (funções).
import { n, rs, par, lin, M, exigir, numericas, textuais, ehInteiro, arred, mdc } from "./base.js?v=57517fb455";
import * as F from "./figuras.js?v=57517fb455";

const H7 = "EF.09.MAT.2.87", H8 = "EF.09.MAT.2.88", H9 = "EF.09.MAT.2.89";
const CAP = "Figura gerada para treino.";
const fig = (svg, alt) => ({ svg, alt, caption: CAP });
const tab = (header, rows) => ({ header, rows, caption: "Tabela gerada para treino." });

export const modelos = [];
const def = (id, code, level, valor, gerar) => modelos.push({ id, code, level, valor, gerar });
const naoZero = (r, a, b) => { let v = 0; while (v === 0) v = r.int(a, b); return v; };

/* Q1 · valor numérico com x negativo */
def("E3-AV2-1", H7, "N1", 1.5, (r) => {
  const a = r.int(2, 6), b = naoZero(r, -9, 9), x = r.int(-5, -1);
  const f = (v) => a * v + b;
  const certo = f(x);
  return {
    short: "Valor de f(x) para um x negativo",
    stem: [`Considere a função f(x) = ${lin(a, b)}.`],
    ask: `Qual é o valor de f(${n(x)})?`,
    options: numericas([
      [a * (x + b), `Multiplicou o ${a} por tudo: ${a} · (${n(x)} ${b < 0 ? M : "+"} ${Math.abs(b)}). Primeiro troque o x e multiplique; depois ${b < 0 ? "subtraia" : "some"} ${Math.abs(b)}.`],
      [certo, `Acerto. f(${n(x)}) = ${a} · ${par(x)} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${n(a * x)} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${n(certo)}.`],
      [a * x, `Esqueceu o ${n(b)}: parou em ${a} · ${par(x)} = ${n(a * x)}.`],
      [a * x - b, `Errou o sinal do ${Math.abs(b)} no fim: fez ${n(a * x)} ${b < 0 ? "+" : M} ${Math.abs(b)}.`],
      [f(-x), `Ignorou o sinal do ${n(x)}: fez ${a} · ${-x} ${b < 0 ? M : "+"} ${Math.abs(b)}. O número negativo entra entre parênteses.`],
    ], certo),
    resolution: [`Troque o x por ${n(x)}, entre parênteses: f(${n(x)}) = ${a} · ${par(x)} ${b < 0 ? M : "+"} ${Math.abs(b)}.`, `Multiplique primeiro: ${a} · ${par(x)} = ${n(a * x)}.`, `${b < 0 ? "Subtraia" : "Some"}: ${n(a * x)} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${n(certo)}.`],
    check: `Com x negativo e a = ${a} positivo, ${a}x é negativo: ${n(a * x)}. ${b < 0 ? "Tirando" : "Somando"} ${Math.abs(b)}, dá ${n(certo)}.`,
  };
});

/* Q2 · lei com valor fixo e valor por unidade */
def("E3-AV2-2", H8, "N1", 1.5, (r) => {
  const ctx = r.um([
    ["Uma academia cobra {F} de matrícula, paga uma vez só, e {p} por mês.", "Qual lei dá o valor V, em reais, pago por quem fica m meses?", "V", "m", "mês", "matrícula"],
    ["Um curso de inglês cobra {F} de taxa de inscrição, paga uma vez só, e {p} por mês de aula.", "Qual lei dá o valor V, em reais, pago por quem estuda m meses?", "V", "m", "mês", "inscrição"],
    ["Um clube de natação cobra {F} pela carteirinha, paga uma vez só, e {p} por aula.", "Qual lei dá o valor C, em reais, pago por quem faz a aulas?", "C", "a", "aula", "carteirinha"],
  ]);
  const F0 = r.passo(30, 150, 10), p = r.passo(40, 120, 5);
  exigir(F0 !== p);
  const [txt, ask, y, x, un, fixo] = ctx;
  const L = (s) => `${y}(${x}) = ${s}`;
  return {
    short: "Lei de uma situação com valor fixo",
    stem: [txt.replace("{F}", rs(F0)).replace("{p}", rs(p))],
    ask,
    options: textuais(r, [
      { text: L(`${F0}${x} + ${p}`), why: `Trocou o valor fixo com o valor por ${un}. Quem multiplica o ${x} é o que se paga a cada ${un} (${p}).` },
      { text: L(`${F0 + p}${x}`), why: `Somou ${fixo} e valor por ${un} e multiplicou tudo por ${x}, como se a ${fixo} fosse paga sempre.` },
      { text: L(`${p}${x}`), why: `Esqueceu a ${fixo}, que é o valor fixo.` },
      { text: L(`${p}${x} + ${F0}`), ok: true, why: `Acerto. O que muda é ${p}${x}; a ${fixo} de ${F0} entra uma vez só.` },
      { text: L(`${p} + ${F0} + ${x}`), why: `Somou o ${x} em vez de multiplicar: cada ${un} acrescenta ${p} reais, não 1.` },
    ]),
    resolution: [`O valor por ${un} (${p}) multiplica a quantidade: ${p}${x}.`, `A ${fixo} (${F0}) é paga uma vez: é o valor fixo.`, `${y}(${x}) = ${p}${x} + ${F0}.`],
    check: `Para 1 ${un}: ${y}(1) = ${p} + ${F0} = ${p + F0} reais, o que se paga no começo.`,
  };
});

/* Q3 · a reta sobe ou desce e onde corta o eixo y */
def("E3-AV2-3", H9, "N1", 1.5, (r) => {
  const a = naoZero(r, -5, 5), b = naoZero(r, -8, 8);
  exigir(a !== b && Math.abs(a) !== 1);
  const sobe = a > 0;
  const S = (s) => (s ? "Sobe" : "Desce");
  const pt = (x, y) => `(${n(x)}; ${n(y)})`;
  return {
    short: "A reta sobe ou desce? Onde corta o eixo y?",
    stem: [`O gráfico da função f(x) = ${lin(a, b)} é uma reta.`],
    ask: "Como é essa reta?",
    options: textuais(r, [
      { text: `${S(sobe)} e corta o eixo y no ponto ${pt(0, b)}.`, ok: true, why: `Acerto. O a = ${n(a)} é ${sobe ? "positivo" : "negativo"}, então a reta ${sobe ? "sobe" : "desce"}; o b = ${n(b)} é onde ela corta o eixo y.` },
      { text: `${S(!sobe)} e corta o eixo y no ponto ${pt(0, b)}.`, why: `Não olhou o sinal do a. Com a = ${n(a)}, ${sobe ? "positivo, a reta sobe" : "negativo, a reta desce"}.` },
      { text: `${S(sobe)} e corta o eixo y no ponto ${pt(0, a)}.`, why: `Trocou o a com o b. O ${n(a)} é a inclinação; o corte no eixo y é o b = ${n(b)}.` },
      { text: `${S(!sobe)} e corta o eixo y no ponto ${pt(0, a)}.`, why: "Trocou o a com o b e também o sentido da reta." },
      { text: `${S(sobe)} e corta o eixo y no ponto ${pt(b, 0)}.`, why: `Trocou as coordenadas. No eixo y, o x vale 0: o ponto é ${pt(0, b)}.` },
    ]),
    resolution: [`Em f(x) = ax + b, aqui a = ${n(a)} e b = ${n(b)}.`, `a ${sobe ? "positivo: a reta sobe (crescente)" : "negativo: a reta desce (decrescente)"}.`, `A reta corta o eixo y quando x = 0: f(0) = ${n(b)}, ponto ${pt(0, b)}.`],
    check: `f(0) = ${n(b)} e f(1) = ${n(a + b)}: quando x aumenta, y ${sobe ? "aumenta" : "diminui"}.`,
  };
});

/* Q4 · completar a tabela de f(x) = c − kx */
def("E3-AV2-4", H7, "N2", 1.0, (r) => {
  const c = r.int(3, 9), k = r.int(2, 4);
  const xs = [r.int(-3, -1), 0, r.int(1, 2), 3];
  const f = (x) => c - k * x;
  const ys = xs.map(f);
  exigir(ys[3] < 0);
  const fmt = (l) => l.map((v) => n(v)).join("; ");
  const errA = [c - k, ...ys.slice(1)];
  const errB = [ys[0], c - k, ys[2], ys[3]];
  const errC = ys.map((y) => -y);
  const errD = [...ys.slice(0, 3), -ys[3]];
  return {
    short: "Completar a tabela de uma função",
    stem: [`A tabela mostra alguns valores de x para a função f(x) = ${c} ${M} ${k}x.`],
    table: tab(["x", ...xs.map((v) => n(v))], [["f(x)", "?", "?", "?", "?"]]),
    ask: "Quais são os valores de f(x), na ordem da tabela?",
    options: textuais(r, [
      { text: fmt(errA), why: `Em x = ${n(xs[0])} fez ${c} ${M} ${k} = ${c - k}. Com o parêntese: ${c} ${M} ${k} · ${par(xs[0])} = ${c} + ${-k * xs[0]} = ${ys[0]}.` },
      { text: fmt(errB), why: `Em x = 0 fez ${c} ${M} ${k} = ${c - k}, como se ${k} · 0 fosse ${k}. Mas ${k} · 0 = 0, então f(0) = ${c}.` },
      { text: fmt(errC), why: `Usou ${k}x ${M} ${c} no lugar de ${c} ${M} ${k}x: todos os sinais ficaram trocados.` },
      { text: fmt(errD), why: `Em x = 3 fez ${3 * k} ${M} ${c}, invertendo a subtração. O certo é ${c} ${M} ${3 * k} = ${n(ys[3])}.` },
      { text: fmt(ys), ok: true, why: `Acerto. ${xs.map((x, i) => `f(${n(x)}) = ${n(ys[i])}`).join(", ")}.` },
    ]),
    resolution: xs.map((x, i) => `f(${n(x)}) = ${c} ${M} ${k} · ${par(x)} = ${n(ys[i])}.`),
    check: `A cada 1 que o x aumenta, f(x) diminui ${k}: de x = 0 para x = 3, f(x) vai de ${c} para ${n(ys[3])}, ou seja, 3 · ${k} = ${3 * k} a menos.`,
  };
});

/* Q5 · zero da função */
def("E3-AV2-5", H9, "N2", 1.0, (r) => {
  const a = r.int(2, 9), z = r.int(2, 9), b = a * z;
  exigir(b - a !== z);
  return {
    short: "Zero da função",
    stem: [`Considere a função f(x) = ${a}x ${M} ${b}.`],
    ask: "Qual é o zero dessa função?",
    options: numericas([
      [-b, `Respondeu o b. O ${M}${b} é onde a reta corta o eixo y; o zero é o x que faz f(x) = 0.`],
      [-z, `Errou o sinal ao passar o ${b}: ${a}x = ${b}, então x = ${z}, positivo.`],
      [z, `Acerto. ${a}x ${M} ${b} = 0 → ${a}x = ${b} → x = ${z}.`],
      [b - a, `Fez ${b} ${M} ${a}. O ${a} multiplica o x; para isolar o x, divida ${b} por ${a}.`],
      [a * b, `Multiplicou ${a} · ${b} em vez de dividir.`],
      [a, `Respondeu o coeficiente a (${a}), que multiplica o x.`], [b + a, `Fez ${b} + ${a}. O ${a} multiplica o x; para isolar o x, divida.`],
    ], z, undefined, r),
    resolution: ["O zero é o x que faz f(x) = 0.", `${a}x ${M} ${b} = 0 → ${a}x = ${b}.`, `x = ${b} ÷ ${a} = ${z}.`],
    check: `f(${z}) = ${a} · ${z} ${M} ${b} = 0.`,
  };
});

/* Q6 · lei a partir do gráfico */
def("E3-AV2-6", H9, "N3", 1.0, (r) => {
  const b = naoZero(r, -3, 3), p = r.int(2, 4), a = naoZero(r, -2, 3);
  const q = a * p + b;
  exigir(Math.abs(q) <= 6 && q !== 0 && a !== b && p !== b && a !== p && a > 0);
  const frac = (num, den) => {
    const g = mdc(num, den);
    const [u, v] = [num / g, den / g];
    return v === 1 ? lin(u, b) : `(${u < 0 ? M : ""}${Math.abs(u)}/${v})x ${b < 0 ? M : "+"} ${Math.abs(b)}`;
  };
  const L = (s) => `f(x) = ${s}`;
  const ymin = Math.min(b, q, 0) - 1, ymax = Math.max(b, q, 0) + 1;
  const figura = F.plano({
    xmin: -1, xmax: p + 1, ymin, ymax, escala: { ux: 44, uy: 30 },
    desenhar: ({ X, Y }) => {
      // a reta fica dentro da grade (a > 0)
      const x1 = Math.max(-1, (ymin - b) / a), x2 = Math.min(p + 1, (ymax - b) / a);
      let s = F.linha(X(x1), Y(a * x1 + b), X(x2), Y(a * x2 + b), { cor: "var(--fig-destaque)", w: 2.6 });
      s += F.ponto(X(0), Y(b), "var(--fig-ponto)", 5) + F.ponto(X(p), Y(q), "var(--fig-ponto)", 5);
      s += F.texto(X(0) + 8, Y(b) + 14, `(0; ${n(b)})`, { ancora: "start", tam: 12, cor: "var(--fig-ponto)", halo: true });
      s += F.texto(X(p) + 8, Y(q) - 2, `(${p}; ${n(q)})`, { ancora: "start", tam: 12, cor: "var(--fig-ponto)", halo: true });
      return s;
    },
  });
  return {
    short: "Lei a partir do gráfico",
    stem: ["O gráfico mostra uma função do 1º grau, f(x) = ax + b, que passa pelos pontos marcados."],
    figure: fig(figura, `Plano cartesiano com uma reta que passa pelos pontos (0; ${n(b)}), no eixo y, e (${p}; ${n(q)}).`),
    ask: "Qual é a lei dessa função?",
    options: textuais(r, [
      { text: L(lin(b, a)), why: `Trocou o a com o b. O b é onde a reta corta o eixo y (${n(b)}); o a é quanto o y muda para cada 1 de x.` },
      { text: L(frac(q, p)), why: `Dividiu o y do ponto (${n(q)}) pelo x (${p}) sem descontar o ponto de partida. Quanto o y mudou: ${n(q)} ${M} ${par(b)} = ${q - b}.` },
      { text: L(lin(p, b)), why: `Usou o ${p}, que é quanto o x mudou, como se fosse o a.` },
      { text: L(lin(a, p)), why: `Pôs o ${p} no lugar do b. O b é onde a reta corta o eixo y: ${n(b)}.` },
      { text: L(lin(a, b)), ok: true, why: `Acerto. b = ${n(b)} (corte no eixo y) e a = ${q - b} ÷ ${p} = ${a}.` },
    ]),
    resolution: [`A reta corta o eixo y em (0; ${n(b)}), então b = ${n(b)}.`, `De x = 0 a x = ${p}, o y vai de ${n(b)} a ${n(q)}: mudou ${q - b}.`, `a = ${q - b} ÷ ${p} = ${a}. Lei: f(x) = ${lin(a, b)}.`],
    check: `f(${p}) = ${a === 1 ? "" : `${a} · `}${p} ${b < 0 ? M : "+"} ${Math.abs(b)} = ${n(q)}, que é o ponto (${p}; ${n(q)}) do gráfico.`,
  };
});

/* Q7 · o valor fixo não dobra */
def("E3-AV2-7", H8, "N3", 1.0, (r) => {
  const ctx = r.um([
    ["Uma corrida de táxi custa {F} de bandeirada mais {p} por quilômetro. Uma corrida de {d} km custa {C}.", "Quanto custa, em reais, uma corrida de {d2} km?", "bandeirada", "quilômetro", "km"],
    ["Um aplicativo de entregas cobra {F} de taxa mais {p} por quilômetro. Uma entrega de {d} km custa {C}.", "Quanto custa, em reais, uma entrega de {d2} km?", "taxa", "quilômetro", "km"],
    ["Uma lavanderia cobra {F} por pedido mais {p} por quilo de roupa. Um pedido de {d} kg custa {C}.", "Quanto custa, em reais, um pedido de {d2} kg?", "taxa do pedido", "quilo", "kg"],
  ]);
  const F0 = r.int(4, 9), p = r.int(2, 5), d = r.int(3, 8), d2 = 2 * d;
  const C1 = F0 + p * d, certo = F0 + p * d2;
  const [txt, ask, fixo, un, u] = ctx;
  return {
    short: "Valor fixo não dobra",
    stem: [txt.replace("{F}", rs(F0)).replace("{p}", rs(p)).replace("{d}", d).replace("{C}", rs(C1))],
    ask: ask.replace("{d2}", d2),
    options: numericas([
      [p * d2, `Esqueceu a ${fixo}: fez só ${p} · ${d2}.`],
      [certo, `Acerto. ${F0} + ${p} · ${d2} = ${F0} + ${p * d2} = ${certo}. A ${fixo} é paga uma vez só.`],
      [2 * C1, `Dobrou os ${rs(C1)} de ${d} ${u}, como se fosse proporcional. A ${fixo} não dobra.`],
      [C1 + p * d2, `Somou o preço de ${d} ${u} com ${p} · ${d2}: contou a ${fixo} e os primeiros ${d} ${u} duas vezes.`],
      [F0 * d2, `Multiplicou a ${fixo} pela quantidade: ${F0} · ${d2}. A ${fixo} é fixa.`],
      [C1, `Respondeu o preço de ${d} ${u}, que já estava no enunciado.`],
    ], certo, undefined, r),
    resolution: [`Lei: V = ${p} · (${u}) + ${F0}.`, `V(${d2}) = ${p} · ${d2} + ${F0} = ${certo}.`, `Não é o dobro de ${C1}: só a parte por ${un} dobra (${p * d} → ${p * d2}); os ${F0} fixos continuam ${F0}.`],
    check: `De ${d} para ${d2} ${u} são ${d} ${u} a mais, a ${rs(p)} cada: ${C1} + ${p * d} = ${certo}.`,
  };
});

/* Q8 · da tabela para a lei e de volta para o x */
def("E3-AV2-8", H7, "N4", 0.5, (r) => {
  const a = r.passo(15, 40, 5), b = r.passo(20, 120, 10), d0 = r.int(2, 3);
  const dias = [d0, d0 + 1, d0 + 2, d0 + 3], L = (d) => a * d + b;
  const alvo = r.int(dias[3] + 4, dias[3] + 9);
  const T = L(alvo);
  exigir(!ehInteiro(T / a) || T / a !== alvo);
  return {
    short: "Da tabela para a lei e de volta para o x",
    stem: ["Uma caixa-d'água recebe sempre a mesma quantidade de água por dia. A tabela mostra quantos litros ela tinha em alguns dias."],
    table: tab(["Dia", ...dias.map(String)], [["Litros", ...dias.map((d) => String(L(d)))]]),
    ask: `Mantendo esse ritmo, em que dia a caixa chega a ${T} litros?`,
    options: numericas([
      [alvo - dias[3], `Achou quantos dias faltam depois do dia ${dias[3]}: (${T} ${M} ${L(dias[3])}) ÷ ${a} = ${alvo - dias[3]}. A resposta pede o dia: ${dias[3]} + ${alvo - dias[3]} = ${alvo}.`],
      [alvo - dias[1], `Partiu do dia ${dias[1]}: (${T} ${M} ${L(dias[1])}) ÷ ${a} = ${alvo - dias[1]}, mas não somou os ${dias[1]} dias que já tinham passado.`],
      [alvo - dias[0], `Usou ${L(dias[0])} como valor inicial: (${T} ${M} ${L(dias[0])}) ÷ ${a} = ${alvo - dias[0]}. O ${L(dias[0])} é do dia ${dias[0]}, não do dia 0.`],
      [alvo, `Acerto. A cada dia entram ${a} L; no dia 0 havia ${L(dias[0])} ${M} ${dias[0]} · ${a} = ${b} L. Lei: L = ${a}d + ${b}. ${a}d + ${b} = ${T} → d = ${alvo}.`],
      [arred(T / a, 1), `Dividiu ${T} por ${a} sem descontar os ${b} litros iniciais.`],
      [alvo + dias[0], `Somou mais ${dias[0]} dias no fim, mas a lei já conta os dias a partir do dia 0.`],
    ], alvo, (v) => (ehInteiro(v) ? n(v) : n(v, 1)), r),
    resolution: [`Por dia entram ${L(dias[1])} ${M} ${L(dias[0])} = ${a} litros: a = ${a}.`, `Voltando do dia ${dias[0]} até o dia 0: ${L(dias[0])} ${M} ${dias[0]} · ${a} = ${b}, então b = ${b}.`, `Lei: L(d) = ${a}d + ${b}. Para ${T} L: ${a}d + ${b} = ${T} → ${a}d = ${T - b} → d = ${alvo}.`],
    check: `L(${alvo}) = ${a} · ${alvo} + ${b} = ${T}.`,
  };
});

/* Q9 · quando duas situações custam o mesmo */
def("E3-AV2-9", H8, "N4", 0.5, (r) => {
  const ctx = r.um([
    ["Para imprimir fotos, a loja A cobra {F} de taxa de cadastro mais {pa} por foto. A loja B cobra {pb} por foto, sem taxa.", "Para quantas fotos as duas lojas cobram o mesmo valor?", "foto", "fotos"],
    ["Para alugar bicicletas, a empresa A cobra {F} de cadastro mais {pa} por hora. A empresa B cobra {pb} por hora, sem cadastro.", "Para quantas horas as duas empresas cobram o mesmo valor?", "hora", "horas"],
    ["Para fazer cópias, a papelaria A cobra {F} de taxa mais {pa} por cópia. A papelaria B cobra {pb} por cópia, sem taxa.", "Para quantas cópias as duas papelarias cobram o mesmo valor?", "cópia", "cópias"],
  ]);
  const pa = r.um([0.2, 0.25, 0.3, 0.4, 0.5, 1, 1.5, 2]), dif = r.um([0.2, 0.4, 0.5, 0.75, 0.8, 1, 1.5]), pb = arred(pa + dif, 2);
  const x = r.passo(10, 60, 5), F0 = arred(x * dif, 2);
  const vals = [F0 / (pa + pb), F0 / pb, F0 / pa, pb * x];
  exigir(ehInteiro(F0 * 4) && vals.every((v) => ehInteiro(arred(v * 10, 4))));
  const [txt, ask, un, uns] = ctx;
  return {
    short: "Quando duas situações custam o mesmo",
    stem: [txt.replace("{F}", rs(F0)).replace("{pa}", rs(pa)).replace("{pb}", rs(pb))],
    ask,
    options: numericas([
      [vals[0], `Somou os preços por ${un}: ${n(F0, 2)} ÷ (${n(pb, 2)} + ${n(pa, 2)}). Quem paga a taxa é a diferença: ${n(pb, 2)} ${M} ${n(pa, 2)} = ${n(dif, 2)}.`],
      [vals[1], `Fez ${n(F0, 2)} ÷ ${n(pb, 2)}, esquecendo os ${rs(pa)} por ${un} de A.`],
      [x, `Acerto. ${n(F0, 2)} + ${n(pa, 2)}x = ${n(pb, 2)}x → ${n(F0, 2)} = ${n(dif, 2)}x → x = ${x} (as duas cobram ${rs(pb * x)}).`],
      [vals[3], `Esse é o valor em reais (${rs(pb * x)}), não o número de ${uns}.`],
      [vals[2], `Fez ${n(F0, 2)} ÷ ${n(pa, 2)}, esquecendo o preço de B.`],
    ], x),
    resolution: [`A: A(x) = ${n(pa, 2)}x + ${n(F0, 2)}. B: B(x) = ${n(pb, 2)}x.`, `Iguale: ${n(pa, 2)}x + ${n(F0, 2)} = ${n(pb, 2)}x → ${n(F0, 2)} = ${n(dif, 2)}x.`, `x = ${n(F0, 2)} ÷ ${n(dif, 2)} = ${x} ${uns}.`],
    check: `A(${x}) = ${n(pa * x, 2)} + ${n(F0, 2)} = ${n(pa * x + F0, 2)} e B(${x}) = ${n(pb * x, 2)}. Com menos de ${x}, B sai mais barata; com mais, A.`,
  };
});

/* Q10 · domínio e imagem no gráfico */
def("E3-AV2-10", H9, "N4", 0.5, (r) => {
  const x0 = r.int(-3, -1), x3 = r.int(3, 5), x1 = r.int(x0 + 1, 1), x2 = r.int(Math.max(x1 + 1, 2), x3 - 1);
  const y0 = r.int(0, 2), y3 = r.int(0, 2), y1 = r.int(Math.max(y0, y3) + 1, 4), y2 = r.int(-3, Math.min(y0, y3) - 1);
  exigir(x1 < x2 && x2 < x3);
  const pts = [[x0, y0], [x1, y1], [x2, y2], [x3, y3]];
  const D = (a, b, c, d) => `Domínio: ${n(a)} ≤ x ≤ ${n(b)}; imagem: ${n(c)} ≤ y ≤ ${n(d)}`;
  const figura = F.plano({
    xmin: Math.min(x0, -1) - 1, xmax: x3 + 1, ymin: Math.min(y2, 0) - 1, ymax: y1 + 1, escala: { ux: 34, uy: 30 },
    desenhar: ({ X, Y }) => F.poli(pts.map(([a, b]) => [X(a), Y(b)]), { fechar: false, cor: "var(--fig-destaque)", w: 2.6 }) + pts.map(([a, b]) => F.ponto(X(a), Y(b), "var(--fig-ponto)", 4.5)).join(""),
  });
  return {
    short: "Domínio e imagem no gráfico",
    stem: ["O gráfico mostra uma função completa, do primeiro ao último ponto marcado."],
    figure: fig(figura, `Plano cartesiano com uma linha em zigue-zague que começa no ponto (${n(x0)}; ${n(y0)}), sobe até (${n(x1)}; ${n(y1)}), desce até (${n(x2)}; ${n(y2)}) e sobe até terminar em (${n(x3)}; ${n(y3)}).`),
    ask: "Quais são o domínio e o conjunto imagem dessa função?",
    options: textuais(r, [
      { text: D(x0, x3, y2, y1), ok: true, why: `Acerto. No eixo x o gráfico vai de ${n(x0)} a ${n(x3)}; no eixo y, do ponto mais baixo (${n(y2)}) ao mais alto (${n(y1)}).` },
      { text: D(y2, y1, x0, x3), why: "Trocou os eixos: o domínio se lê no eixo x e a imagem no eixo y." },
      { text: D(x0, x3, x0, x3), why: "Leu a imagem também no eixo x. A imagem vai do y mais baixo ao mais alto." },
      { text: D(0, x3, y2, y1), why: `Começou o domínio no 0, mas o gráfico começa em x = ${n(x0)}.` },
      { text: D(x0, x3, Math.min(y0, y3), y1), why: `Começou a imagem no y de uma ponta (${n(Math.min(y0, y3))}) e esqueceu o ponto mais baixo, em y = ${n(y2)}.` },
    ]),
    resolution: [`Domínio: olhe o eixo x, do primeiro ao último ponto: de ${n(x0)} a ${n(x3)}.`, `Imagem: olhe o eixo y, do ponto mais baixo ao mais alto: de ${n(y2)} a ${n(y1)}.`, "As pontas do gráfico não são, necessariamente, o ponto mais alto e o mais baixo."],
    check: `O ponto (${n(x2)}; ${n(y2)}) está abaixo das duas pontas, por isso a imagem começa em ${n(y2)}.`,
  };
});
