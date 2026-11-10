// Modelos das questões da Semana 8 do Avalia, com números e contextos sorteados.
import { n, nAte, rs, M, NB, exigir, numericas, textuais, ehInteiro, arred, mdc, expr, lin } from "./base.js?v=f5446e8815";

const tab = (header, rows) => ({ header, rows, caption: "Tabela gerada para treino." });
const NOMES = ["Ana", "Bruno", "Carla", "Davi", "Elisa", "Felipe", "Gabi", "Heitor", "Isa", "João", "Lara", "Marcos", "Nina", "Otávio", "Paula", "Rafa", "Sofia", "Téo", "Vitória", "Yuri"];

export const modelos = [];
const def = (id, code, level, gerar) => modelos.push({ id, code, level, gerar });

/* ---------- S08-1 · C12 · expressão de uma sequência ---------- */
def("S08-1", "C12", "N3", (r) => {
  const ctx = r.um([
    { a: 2, b: 2, txt: "Num restaurante, mesas quadradas são juntadas em fila para grupos grandes. A tabela mostra quantas cadeiras cabem em volta das mesas, de acordo com o número de mesas juntadas.", col: "Mesas (n)", lin: "Cadeiras", per: "o número de cadeiras para n mesas juntadas", coisa: "cadeiras", passo: "mesa" },
    { a: 3, b: 1, txt: "Com palitos de fósforo, uma pessoa monta quadrados lado a lado, em fila. A tabela mostra quantos palitos são usados, de acordo com o número de quadrados.", col: "Quadrados (n)", lin: "Palitos", per: "o número de palitos para n quadrados", coisa: "palitos", passo: "quadrado" },
    { a: 2, b: 1, txt: "Com palitos, uma pessoa monta triângulos lado a lado, em fila, um de ponta para cima e o outro de ponta para baixo. A tabela mostra quantos palitos são usados, de acordo com o número de triângulos.", col: "Triângulos (n)", lin: "Palitos", per: "o número de palitos para n triângulos", coisa: "palitos", passo: "triângulo" },
    { a: 5, b: 1, txt: "Com palitos, uma pessoa monta hexágonos lado a lado, em fila, cada um encostado no anterior. A tabela mostra quantos palitos são usados, de acordo com o número de hexágonos.", col: "Hexágonos (n)", lin: "Palitos", per: "o número de palitos para n hexágonos", coisa: "palitos", passo: "hexágono" },
    { a: null, b: null, txt: "Uma sequência de figuras é montada com bolinhas, sempre seguindo o mesmo padrão. A tabela mostra quantas bolinhas tem cada figura.", col: "Figura (n)", lin: "Bolinhas", per: "o número de bolinhas da figura n", coisa: "bolinhas", passo: "figura" },
  ]);
  const a = ctx.a ?? r.int(2, 6), b = ctx.b ?? r.int(1, 5);
  exigir(b !== a);
  const v = (k) => a * k + b;
  const e = (x, y) => lin(x, y, "n");
  return {
    short: "Expressão de uma sequência",
    stem: [ctx.txt],
    table: tab([ctx.col, "1", "2", "3", "4"], [[ctx.lin, ...[1, 2, 3, 4].map((k) => String(v(k)))]]),
    ask: `Qual expressão dá ${ctx.per}?`,
    options: textuais(r, [
      { text: e(a, b), ok: true, why: `Acerto. A cada ${ctx.passo} a mais entram ${a} ${ctx.coisa} (${a}n), e o começo se ajusta com mais ${b}: ${a} · 1 + ${b} = ${v(1)}, ${a} · 2 + ${b} = ${v(2)}.` },
      { text: e(a, 0), why: `Usou só o aumento de ${a} e esqueceu de ajustar o começo: com n = 1 daria ${a}, e não ${v(1)}.` },
      { text: e(a + b, 0), why: `Pensou em proporção a partir da primeira coluna: ${v(1)} por ${ctx.passo}. Com n = 2 daria ${2 * v(1)}, mas a tabela mostra ${v(2)}.` },
      { text: e(1, a + b - 1), why: `Conferiu só a primeira coluna (1 + ${a + b - 1} = ${v(1)}). Com n = 2 daria ${a + b + 1}, mas são ${v(2)}.` },
      { text: e(a, a + b), why: `Usou o primeiro valor da tabela (${v(1)}) como número fixo. Com n = 1 daria ${v(1) + a}, mas são ${v(1)}.` },
    ]),
    resolution: [`De uma coluna para a outra, o número aumenta ${a}: a expressão tem ${a}n.`, `Com n = 1, ${a}n = ${a}, mas são ${v(1)}: faltam ${b}.`, `Expressão: ${e(a, b)}.`],
    check: `Teste com n = 4: ${a} · 4 + ${b} = ${v(4)}, como na tabela.`,
  };
});

/* ---------- S08-2 · D21 · produto em notação científica ---------- */
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const pot10 = (e) => `10${String(e).split("").map((c) => SUP[c]).join("")}`;
/** Normaliza m × 10^e (1 ≤ m < 10). Devolve [m, e]. */
function normal(m, e) {
  m = arred(m, 4);
  while (m >= 10) { m = arred(m / 10, 4); e++; }
  while (m < 1) { m = arred(m * 10, 4); e--; }
  return [m, e];
}
const sci = (m, e) => `${nAte(m, 3)} × ${pot10(e)}`;
// chave para ordenar e comparar sem erro de ponto flutuante: e · 10 + m
const chaveSci = (m, e) => { const [mm, ee] = normal(m, e); return ee * 10 + mm; };
const deChave = (k) => { const e = Math.floor(arred(k, 4) / 10); return sci(arred(k - e * 10, 4), e); };

def("S08-2", "D21", "N3", (r) => {
  const ctx = r.um([
    { a: [1.5, 2, 2.5, 3], p: [8, 9, 10], b: 3.6, q: 3, txt: "Um computador faz cerca de {A} operações por segundo. Uma hora tem {B} segundos.", per: "Quantas operações esse computador faz em uma hora?", hora: true, un: "operações" },
    { a: [1.2, 1.5, 2, 2.5, 3, 4], p: [5, 6], b: [2, 3, 4, 5], q: [4], txt: "Uma cidade tem cerca de {A} habitantes, e cada habitante usa, em média, {B} litros de água por ano.", per: "Quantos litros de água a cidade usa, ao todo, em um ano?", un: "litros" },
    { a: [1.5, 2, 2.5, 3, 4], p: [4, 5], b: [2, 2.5, 3], q: [2], txt: "Uma fábrica produz cerca de {A} parafusos por dia. Ela funcionou {B} dias no ano.", per: "Quantos parafusos a fábrica produziu nesses dias?", un: "parafusos" },
    { a: [1.5, 2, 3, 4], p: [3, 4], b: [1.2, 1.5, 2, 2.5], q: [3], txt: "Um aplicativo recebe cerca de {A} mensagens por minuto. Um dia tem 1 440 minutos, ou seja, {B} minutos.", per: "Quantas mensagens o aplicativo recebe em um dia?", un: "mensagens", minutos: true },
  ]);
  const a = r.um(ctx.a), p = r.um(ctx.p);
  const b = ctx.minutos ? 1.44 : Array.isArray(ctx.b) ? r.um(ctx.b) : ctx.b, q = Array.isArray(ctx.q) ? r.um(ctx.q) : ctx.q;
  const [m, e] = normal(a * b, p + q);
  exigir(ehInteiro(m * 100) && p !== q);
  const certo = chaveSci(a * b, p + q);
  const A = sci(a, p), B = sci(b, q);
  const lista = [
    [certo, `Acerto. (${nAte(a, 3)} · ${nAte(b, 3)}) × ${pot10(p)}⁺${String(q).split("").map((c) => SUP[c]).join("")} = ${nAte(arred(a * b, 4), 4)} × ${pot10(p + q)}${a * b >= 10 ? ` = ${sci(m, e)}` : ""}.`],
    [chaveSci(a * b, p - q), `Subtraiu os expoentes (${p} ${M} ${q} = ${p - q}). Na multiplicação, os expoentes se somam: ${p} + ${q} = ${p + q}.`],
    [chaveSci(a + b, p + q), `Somou as partes da frente (${nAte(a, 3)} + ${nAte(b, 3)}). Numa multiplicação, elas se multiplicam: ${nAte(a, 3)} · ${nAte(b, 3)} = ${nAte(arred(a * b, 4), 4)}.`],
    [chaveSci(a * b, p * q), `Multiplicou os expoentes (${p} · ${q} = ${p * q}). Na multiplicação de potências de mesma base, os expoentes se somam.`],
    [chaveSci(a, p + q), `Multiplicou só as potências de 10 e esqueceu de multiplicar ${nAte(a, 3)} por ${nAte(b, 3)}.`],
  ];
  if (ctx.hora) lista.push([chaveSci(a * 6, p + 1), `Usou 60 segundos para uma hora: ${A} · 60 = ${sci(...normal(a * 6, p + 1))}. Uma hora tem 60 · 60 = 3${NB}600 segundos.`]);
  if (a * b >= 10) lista.push([chaveSci(a * b, p + q - 1), `Ao arrumar a notação científica, andou com a vírgula para o lado errado: ${nAte(arred(a * b, 4), 4)} × ${pot10(p + q)} = ${sci(m, e)}, o expoente aumenta 1.`]);
  return {
    short: "Produto em notação científica",
    stem: [ctx.txt.replace("{A}", A).replace("{B}", B)],
    ask: ctx.per,
    options: numericas(lista, certo, deChave, r),
    resolution: [`Total = (${A}) · (${B}).`, `Multiplique as partes da frente: ${nAte(a, 3)} · ${nAte(b, 3)} = ${nAte(arred(a * b, 4), 4)}. Some os expoentes: ${pot10(p)} · ${pot10(q)} = ${pot10(p + q)}.`, a * b >= 10 ? `Arrume a notação: ${nAte(arred(a * b, 4), 4)} × ${pot10(p + q)} = ${sci(m, e)} ${ctx.un}.` : `Resultado: ${sci(m, e)} ${ctx.un}.`],
    check: `Estimativa: ${pot10(p)} vezes ${pot10(q)} dá ${pot10(p + q)}; com ${nAte(a, 3)} · ${nAte(b, 3)} ${a * b >= 10 ? "passando de 10, o expoente sobe um" : "menor que 10, o expoente fica"}: ${sci(m, e)}.`,
  };
});

/* ---------- S08-3 · D29 · volume de um bloco em litros ---------- */
def("S08-3", "D29", "N4", (r) => {
  const C = r.um([40, 50, 60, 80, 100]), L = r.um([20, 25, 30, 40]), H = r.um([30, 35, 40, 50]), k = r.um([5, 10]);
  exigir(L < C && k < H);
  const h = H - k, cm3 = C * L * h, litros = cm3 / 1000, cheio = (C * L * H) / 1000;
  exigir(ehInteiro(litros * 10));
  const [obj, onde] = r.um([["Um aquário", "até"], ["Um tanque de vidro para peixes", "até"], ["Uma caixa plástica para guardar água", "até"]]);
  return {
    short: "Volume de um bloco retangular em litros",
    stem: [`${obj} tem a forma de um bloco retangular com ${C}${NB}cm de comprimento, ${L}${NB}cm de largura e ${H}${NB}cm de altura. Ele vai ser enchido ${onde} ${k}${NB}cm abaixo da borda. Lembre que 1 litro = 1${NB}000${NB}cm³.`],
    ask: "Quantos litros de água vão caber nele?",
    options: numericas([
      [cm3 / 10000, `Dividiu por 10 000. Para passar de cm³ para litros, divida por 1 000: ${n(cm3)} ÷ 1 000 = ${n(litros)}.`],
      [litros, `Acerto. A água tem ${H} ${M} ${k} = ${h} cm de altura: ${C} · ${L} · ${h} = ${n(cm3)} cm³ = ${n(litros)} litros.`],
      [cheio, `Usou a altura toda (${H} cm). A água fica ${k} cm abaixo da borda: a altura da água é ${h} cm.`],
      [cm3 / 100, "Dividiu por 100. Um litro tem 1 000 cm³, então divida por 1 000."],
      [cm3, `Calculou o volume em cm³ (${n(cm3)}) e não passou para litros.`],
      [(C * L * k) / 1000, `Usou os ${k} cm como altura da água. Os ${k} cm são o que fica vazio; a água tem ${h} cm de altura.`],
    ], litros, (v) => n(v), r),
    resolution: [`Altura da água: ${H} ${M} ${k} = ${h} cm.`, `Volume da água: ${C} · ${L} · ${h} = ${n(cm3)} cm³.`, `Em litros: ${n(cm3)} ÷ 1${NB}000 = ${n(litros)} L.`],
    check: `Cheio até a borda seriam ${C} · ${L} · ${H} = ${n(C * L * H)} cm³ = ${n(cheio)} L. Com ${k} cm a menos, tem de dar um pouco menos: ${n(litros)} L.`,
  };
});

/* ---------- S08-4 · D34 · divisão em partes proporcionais ---------- */
def("S08-4", "D34", "N4", (r) => {
  const ctx = r.um([
    { txt: "Três irmãos, de {a}, {b} e {c} anos, ganharam {T} da avó. Ela pediu que o dinheiro fosse dividido em partes proporcionais às idades.", partes: [[2, 15]], nomes: ["o irmão mais novo", "o irmão do meio", "o irmão mais velho"], de: ["do irmão mais novo", "do irmão do meio", "do irmão mais velho"], un: "ano de idade", unp: "anos", soma: "Some as idades" },
    { txt: "Três amigos abriram uma lanchonete: um investiu R$ {a} mil, outro R$ {b} mil e o terceiro R$ {c} mil. O lucro do mês, de {T}, vai ser dividido em partes proporcionais ao que cada um investiu.", partes: [[2, 12]], nomes: ["quem investiu menos", "quem investiu o valor do meio", "quem investiu mais"], de: ["de quem investiu menos", "de quem investiu o valor do meio", "de quem investiu mais"], un: "mil reais investidos", unp: "mil", u: [100, 120, 150, 200, 250, 300, 400], soma: "Some os investimentos" },
    { txt: "Três colegas trabalharam {a}, {b} e {c} horas num mutirão e receberam juntos {T}. O valor vai ser dividido em partes proporcionais às horas trabalhadas.", partes: [[2, 12]], nomes: ["quem trabalhou menos horas", "quem trabalhou o número de horas do meio", "quem trabalhou mais horas"], de: ["de quem trabalhou menos horas", "de quem trabalhou o número de horas do meio", "de quem trabalhou mais horas"], un: "hora trabalhada", unp: "horas", soma: "Some as horas" },
  ]);
  const [lo, hi] = ctx.partes[0];
  const [a, b, c] = r.alguns(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), 3).sort((x, y) => x - y);
  const S = a + b + c, u = r.um(ctx.u || [5, 10, 15, 20, 25, 30, 40, 50]), T = S * u;
  const quem = r.int(0, 2), parte = [a, b, c][quem];
  const certo = parte * u;
  const nomes = ctx.nomes;
  const outras = [0, 1, 2].filter((i) => i !== quem);
  return {
    short: "Divisão em partes proporcionais",
    stem: [ctx.txt.replace("{a}", a).replace("{b}", b).replace("{c}", c).replace("{T}", rs(T))],
    ask: `Quanto recebe ${nomes[quem]}?`,
    options: numericas([
      [u, `Achou o valor de cada ${ctx.un} (${n(T)} ÷ ${S} = ${u}) e parou. Falta multiplicar pela parte pedida: ${parte} · ${u} = ${certo}.`],
      [[a, b, c][outras[0]] * u, `Calculou a parte ${ctx.de[outras[0]]} (${[a, b, c][outras[0]]} · ${u}). A pergunta é a parte ${ctx.de[quem]}.`],
      [[a, b, c][outras[1]] * u, `Calculou a parte ${ctx.de[outras[1]]} (${[a, b, c][outras[1]]} · ${u}). A pergunta é a parte ${ctx.de[quem]}.`],
      [T / 3, `Dividiu em partes iguais (${n(T)} ÷ 3). Em partes proporcionais, quem tem a parte maior recebe mais.`],
      [certo, `Acerto. A soma é ${a} + ${b} + ${c} = ${S}; cada ${ctx.un} vale ${n(T)} ÷ ${S} = ${u} reais; ${nomes[quem]} recebe ${parte} · ${u} = ${certo}.`],
    ], certo, rs),
    resolution: [`${ctx.soma}: ${a} + ${b} + ${c} = ${S} partes.`, `Cada parte vale ${n(T)} ÷ ${S} = ${u} reais.`, `${nomes[quem][0].toUpperCase()}${nomes[quem].slice(1)} tem ${parte} partes: ${parte} · ${u} = ${rs(certo)}.`],
    check: `As três partes são ${rs(a * u)}, ${rs(b * u)} e ${rs(c * u)}, que somam ${rs(T)}.`,
  };
});

/* ---------- S08-5 · D36 · metro cúbico, litro e mililitro ---------- */
def("S08-5", "D36", "N4", (r) => {
  const V = r.um([0.5, 1, 1.2, 1.5, 2, 2.5, 3]), ml = r.um([200, 250, 500]);
  const [obj, cheia] = r.um([["Uma caixa-d'água", "da caixa cheia"], ["O tanque de uma fábrica de sucos", "do tanque cheio"], ["Um reservatório de água mineral", "do reservatório cheio"]]);
  const L = V * 1000, porLitro = 1000 / ml, certo = L * porLitro;
  return {
    short: "Metro cúbico, litro e mililitro",
    stem: [`${obj} tem ${n(V)}${NB}m³ de capacidade. Lembre que 1${NB}m³ = 1${NB}000 litros e que 1 litro = 1${NB}000${NB}mL.`],
    ask: `Quantas garrafas de ${ml} mL dá para encher com o líquido ${cheia}?`,
    options: numericas([
      [V * 10 * porLitro, `Usou 1 m³ = 10 litros: ${n(V)} m³ = ${n(V * 10)} L. O fator certo é 1 000.`],
      [V * 100 * porLitro, `Usou 1 m³ = 100 litros: ${n(V)} m³ = ${n(V * 100)} L. O fator certo é 1 000.`],
      [L * (ml / 1000), `Multiplicou pelo tamanho da garrafa em vez de dividir: ${n(L)} · ${nAte(ml / 1000, 2)} = ${n(L * (ml / 1000))}. Cabem ${n(porLitro)} garrafas em cada litro.`],
      [certo, `Acerto. ${n(V)} m³ = ${n(L)} L. Cada garrafa tem ${ml} mL = ${nAte(ml / 1000, 2)} L: ${n(L)} ÷ ${nAte(ml / 1000, 2)} = ${n(certo)} garrafas.`],
      [V * 10000 * porLitro, `Converteu demais: ${n(V)} m³ = ${n(V * 10000)} L. Com 1 m³ = 1 000 L, ${n(V)} m³ = ${n(L)} L.`],
      [L, `Achou os litros (${n(L)}) e parou. Cada garrafa tem ${ml} mL, menos de 1 litro: são ${n(porLitro)} garrafas por litro.`],
    ], certo, (v) => n(v), r),
    resolution: [`${n(V)} m³ = ${n(V)} · 1${NB}000 = ${n(L)} litros.`, `${ml} mL = ${nAte(ml / 1000, 2)} litro, então cabem ${n(porLitro)} garrafas em cada litro.`, `${n(L)} · ${n(porLitro)} = ${n(certo)} garrafas.`],
    check: `${n(certo)} garrafas de ${ml} mL dão ${n(certo * ml)} mL = ${n(L)} litros, que é ${n(V)} m³.`,
  };
});

/* ---------- S08-6 · C08 · inequação do 1º grau ---------- */
def("S08-6", "C08", "N3", (r) => {
  const ctx = r.um([
    { txt: "Para alugar um salão de festas, paga-se {F} de taxa fixa e mais {c} por convidado. {N} pode gastar, no máximo, {Mx}.", per: "Qual é o maior número de convidados que {N} pode ter?", uni: "convidados", um: "convidado", F: [100, 150, 200, 250], c: [10, 12, 15, 20, 25] },
    { txt: "Num parque de diversões, a entrada custa {F} e cada brinquedo custa mais {c}. {N} tem, no máximo, {Mx} para gastar no parque.", per: "Qual é o maior número de brinquedos em que {N} pode ir?", uni: "brinquedos", um: "brinquedo", F: [20, 25, 30, 40], c: [4, 5, 6, 8] },
    { txt: "Uma corrida de táxi custa {F} de bandeirada e mais {c} por quilômetro rodado. {N} quer gastar, no máximo, {Mx} numa corrida.", per: "Qual é o maior número de quilômetros inteiros que {N} pode percorrer?", uni: "quilômetros", um: "quilômetro", F: [5, 6, 8, 10], c: [2, 3, 4] },
  ]);
  const F = r.um(ctx.F), c = r.um(ctx.c), x = r.int(8, 40), Mx = F + c * x;
  const nome = r.um(NOMES);
  const semTaxa = Math.floor(Mx / c), sinal = Math.floor((Mx + F) / c), porCada = Math.floor(Mx / (F + c));
  exigir(porCada >= 1);
  exigir(semTaxa !== x && sinal !== x && Mx - F !== x);
  const t = (s) => s.replace("{F}", rs(F)).replace("{c}", rs(c)).replace("{Mx}", rs(Mx)).replaceAll("{N}", nome);
  return {
    short: "Inequação do 1º grau",
    stem: [t(ctx.txt)],
    ask: t(ctx.per),
    options: numericas([
      [x - 1, `Usou "menor que" em vez de "menor ou igual". Com ${x} ${ctx.uni} o gasto é ${n(F)} + ${n(c)} · ${x} = ${rs(Mx)}, que ainda cabe no limite.`],
      [x, `Acerto. ${n(F)} + ${n(c)}x ≤ ${n(Mx)}, então ${n(c)}x ≤ ${n(Mx - F)} e x ≤ ${x}.`],
      [semTaxa, `Esqueceu a taxa fixa: ${n(Mx)} ÷ ${n(c)} ≈ ${n(Mx / c)}. Primeiro desconte os ${rs(F)}.`],
      [sinal, `Errou o sinal ao passar a taxa: ${n(c)}x ≤ ${n(Mx)} + ${n(F)}. Ao mudar de lado, +${n(F)} vira ${M}${n(F)}.`],
      [Mx - F, `Parou em ${n(c)}x ≤ ${n(Mx - F)} e não dividiu por ${n(c)}. O ${n(Mx - F)} é o valor que sobra, em reais.`],
      [porCada, `Somou a taxa ao preço de cada ${ctx.um} (${n(F)} + ${n(c)} = ${n(F + c)}), como se a taxa fosse cobrada de novo a cada ${ctx.um}. Ela é paga uma vez só.`],
    ], x, (v) => n(v), r),
    resolution: [`Gasto com x ${ctx.uni}: ${n(F)} + ${n(c)}x.`, `${n(F)} + ${n(c)}x ≤ ${n(Mx)}, então ${n(c)}x ≤ ${n(Mx - F)}.`, `x ≤ ${x}: no máximo ${x} ${ctx.uni}.`],
    check: `Com ${x}: ${n(F)} + ${n(c * x)} = ${rs(Mx)}. Com ${x + 1}: ${n(F)} + ${n(c * (x + 1))} = ${rs(Mx + c)}, que passa do limite.`,
  };
});

/* ---------- S08-7 · C15 · sistema que representa a situação ---------- */
def("S08-7", "C15", "N3", (r) => {
  const ctx = r.um([
    { lugar: "Numa lanchonete", i1: ["suco", "sucos"], i2: ["pastel", "pastéis"], l: ["s", "p"], p1: [4, 5, 6, 7, 8], p2: [3, 4, 5, 6, 7] },
    { lugar: "Numa papelaria", i1: ["caderno", "cadernos"], i2: ["caneta", "canetas"], l: ["c", "k"], p1: [12, 15, 18, 20], p2: [2, 3, 4, 5] },
    { lugar: "Numa sorveteria", i1: ["picolé", "picolés"], i2: ["casquinha", "casquinhas"], l: ["p", "c"], p1: [3, 4, 5, 6], p2: [6, 7, 8, 9] },
    { lugar: "No cinema", i1: ["ingresso", "ingressos"], i2: ["pipoca", "pipocas"], l: ["i", "p"], p1: [18, 20, 24, 30], p2: [10, 12, 15] },
  ]);
  const [x, y] = ctx.l;
  const p1 = r.um(ctx.p1), p2 = r.um(ctx.p2);
  const a1 = r.int(1, 4), b1 = r.int(1, 4), a2 = r.int(1, 4), b2 = r.int(1, 4);
  exigir(a1 * b2 !== a2 * b1 && (a1 !== b1 || a2 !== b2));
  const T1 = a1 * p1 + b1 * p2, T2 = a2 * p1 + b2 * p2;
  exigir(T1 !== T2);
  const qtd = (k, it) => `${k} ${k === 1 ? it[0] : it[1]}`;
  const E = (a, b) => expr([[a, x], [b, y]]);
  const sis = (e1, e2) => `${e1} e ${e2}`;
  return {
    short: "Sistema que representa a situação",
    stem: [`${ctx.lugar}, ${qtd(a1, ctx.i1)} e ${qtd(b1, ctx.i2)} custam ${rs(T1)}. Já ${qtd(a2, ctx.i1)} e ${qtd(b2, ctx.i2)} custam ${rs(T2)}. Considere ${x} o preço de um ${ctx.i1[0]} e ${y} o preço de ${["pastel"].includes(ctx.i2[0]) ? "um" : "uma"} ${ctx.i2[0]}, em reais.`],
    ask: "Qual sistema representa essa situação?",
    options: textuais(r, [
      { text: sis(`${E(a1, b1)} = ${T1}`, `${E(a2, b2)} = ${T2}`), ok: true, why: "Acerto. Cada compra vira uma equação: quantidade vezes preço, somados, igual ao total." },
      { text: sis(`${E(b1, a1)} = ${T1}`, `${E(b2, a2)} = ${T2}`), why: `Trocou as quantidades. Na primeira compra são ${qtd(a1, ctx.i1)} e ${qtd(b1, ctx.i2)}: ${E(a1, b1)}.` },
      { text: sis(`${E(a1, b1)} = ${T2}`, `${E(a2, b2)} = ${T1}`), why: `Trocou os totais: ${qtd(a1, ctx.i1)} e ${qtd(b1, ctx.i2)} custam ${T1}, e não ${T2}.` },
      { text: sis(`${x} + ${y} = ${T1}`, `${x} + ${y} = ${T2}`), why: "Esqueceu as quantidades. Cada preço deve ser multiplicado pelo número de itens comprados." },
      { text: sis(`${a1 + b1}(${x} + ${y}) = ${T1}`, `${a2 + b2}(${x} + ${y}) = ${T2}`), why: `Somou as quantidades (${a1} + ${b1} = ${a1 + b1}) como se os dois itens tivessem o mesmo preço.` },
    ]),
    resolution: [`1ª compra: ${qtd(a1, ctx.i1)} (${E(a1, 0)}) e ${qtd(b1, ctx.i2)} (${E(0, b1)}) custam ${T1}: ${E(a1, b1)} = ${T1}.`, `2ª compra: ${qtd(a2, ctx.i1)} (${E(a2, 0)}) e ${qtd(b2, ctx.i2)} (${E(0, b2)}) custam ${T2}: ${E(a2, b2)} = ${T2}.`, "O sistema é formado pelas duas equações."],
    check: `Resolvendo, ${x} = ${p1} e ${y} = ${p2}: ${a1} · ${p1} + ${b1} · ${p2} = ${T1} e ${a2} · ${p1} + ${b2} · ${p2} = ${T2}.`,
  };
});

/* ---------- S08-8 · D24 · densidade demográfica ---------- */
def("S08-8", "D24", "N3", (r) => {
  const d = r.um([40, 50, 80, 125, 200, 250, 400, 500, 625, 800]);
  const A = r.um([60, 80, 120, 150, 160, 200, 240, 300, 360, 450]);
  const H = d * A;
  exigir(H >= 4000 && H <= 400000);
  const lugar = r.um(["Uma cidade", "Um município", "Uma ilha", "Uma região do interior"]);
  const fmt = (v) => (v < 1 ? nAte(v, 5) : n(v));
  return {
    short: "Densidade demográfica",
    stem: [`${lugar} tem ${n(H)} habitantes e área de ${n(A)}${NB}km².`],
    ask: "Qual é a densidade demográfica desse lugar, em habitantes por km²?",
    options: numericas([
      [A / H, `Inverteu a razão: ${n(A)} ÷ ${n(H)}. Densidade é habitantes divididos pela área.`],
      [d / 10, `Errou os zeros na divisão: ${n(H)} ÷ ${n(A)} = ${n(d)}, e não ${n(d / 10)}.`],
      [d, `Acerto. ${n(H)} ÷ ${n(A)} = ${n(d)} habitantes por km².`],
      [d * 10, `Errou os zeros na divisão: ${n(H)} ÷ ${n(A)} = ${n(d)}, e não ${n(d * 10)}.`],
      [H * A, "Multiplicou habitantes por área. Densidade é uma divisão: quantos habitantes há em cada km²."],
      [d / 100, `Errou os zeros na divisão: ${n(H)} ÷ ${n(A)} = ${n(d)}, e não ${fmt(d / 100)}.`],
      [d * 100, `Errou os zeros na divisão: ${n(H)} ÷ ${n(A)} = ${n(d)}, e não ${n(d * 100)}.`],
    ], d, fmt, r),
    resolution: ["Densidade demográfica = habitantes ÷ área.", `${n(H)} ÷ ${n(A)} = ${n(d)}.`, `${n(d)} habitantes por km².`],
    check: `Se cada km² tem ${n(d)} habitantes, ${n(A)} km² têm ${n(d)} · ${n(A)} = ${n(H)} habitantes.`,
  };
});

/* ---------- S08-9 · D33 · probabilidade com dois dados ---------- */
def("S08-9", "D33", "N4", (r) => {
  const S = r.um([5, 6, 7, 8, 9]);
  const pares = [];
  for (let i = 1; i <= 6; i++) { const j = S - i; if (j >= 1 && j <= 6) pares.push([i, j]); }
  const f = pares.length, sem = pares.filter(([i, j]) => i <= j).length;
  const fr = (a, b) => { const g = mdc(a, b); return `${a / g}/${b / g}`; };
  const [txt, acao] = r.um([
    ["Num jogo de tabuleiro, o jogador lança dois dados comuns, de 6 faces, e só sai da prisão se a soma dos dois for {S}.", "o jogador sair da prisão"],
    ["Numa brincadeira, cada participante lança dois dados comuns, de 6 faces, e ganha um prêmio se a soma dos dois for {S}.", "um participante ganhar o prêmio"],
    ["Num jogo, a peça só avança para a casa especial se, ao lançar dois dados comuns, de 6 faces, a soma dos dois for {S}.", "a peça avançar para a casa especial"],
  ]);
  return {
    short: "Probabilidade com dois dados",
    stem: [txt.replace("{S}", S)],
    ask: `Qual é a probabilidade de ${acao} numa jogada?`,
    options: textuais(r, [
      { text: fr(f, 36), ok: true, why: `Acerto. São 36 resultados possíveis (6 · 6). Somam ${S}: ${pares.map(([i, j]) => `(${i}, ${j})`).join(", ")}. Probabilidade: ${f}/36 = ${fr(f, 36)}.` },
      { text: fr(sem, 36), why: `Contou só ${sem} pares, sem a ordem. Com dois dados, (${pares[0][0]}, ${pares[0][1]}) e (${pares[0][1]}, ${pares[0][0]}) são resultados diferentes: são ${f} casos.` },
      { text: "1/11", why: `Tratou as somas de 2 a 12 como se tivessem a mesma chance (11 somas). Elas não têm: a soma ${S} aparece em ${f} dos 36 resultados.` },
      { text: fr(S, 36), why: `Usou o próprio ${S} como número de casos favoráveis. São ${f} pares que somam ${S}.` },
      { text: fr(f, 36 - f), why: `Dividiu os casos favoráveis (${f}) pelos desfavoráveis (${36 - f}). Divida pelo total de resultados: 36.` },
    ]),
    resolution: ["Total de resultados com dois dados: 6 · 6 = 36.", `Pares com soma ${S}: ${pares.map(([i, j]) => `(${i}, ${j})`).join(", ")}, que são ${f}.`, `Probabilidade: ${f}/36 = ${fr(f, 36)}.`],
    check: S === 7 ? "Para cada valor do primeiro dado, só um valor do segundo completa 7. Então a chance é 1 em 6." : `A soma 7 é a mais provável (6 casos); a soma ${S} tem ${f} casos, então a chance tem de ser menor que 1/6.`,
  };
});

/* ---------- S08-10 · D16 · semelhança pelos lados proporcionais ---------- */
def("S08-10", "D16", "N4", (r) => {
  const a = r.int(3, 8), b = r.int(a + 1, a + 4), c = r.int(b + 1, a + b - 1);
  exigir(c > b);
  const k = r.um([1.5, 2, 2.5, 3]);
  const k2 = r.um([2, 3, 4].filter((x) => x !== k));
  const d = r.um([1, 2, 3]);
  const tri = (x, y, z) => `Lados de ${n(x)} cm, ${n(y)} cm e ${n(z)} cm`;
  const ok = (x, y, z) => x + y > z && x > 0;
  const quase = r.moeda() ? k2 * c - 2 : k2 * c + 2;
  const t2 = [a * k2, b * k2, quase];
  const t3 = [a + d, b + d, c + d], t4 = [a + d + 1, b + d + 1, c + d + 1];
  const tk = [a * k, b * k, c * k];
  exigir(ok(...t2) && quase > b * k2);
  exigir([tk, t2, t3, t4].every((t) => t.every((v) => ehInteiro(v * 10))));
  return {
    short: "Semelhança pelos lados proporcionais",
    stem: [`Um triângulo tem lados de ${a}${NB}cm, ${b}${NB}cm e ${c}${NB}cm.`],
    ask: "Qual destes triângulos é semelhante a ele?",
    options: textuais(r, [
      { text: tri(...tk), ok: true, why: `Acerto. Todos os lados foram multiplicados por ${n(k)}: ${n(tk[0])} ÷ ${a} = ${n(tk[1])} ÷ ${b} = ${n(tk[2])} ÷ ${c} = ${n(k)}. Lados proporcionais: os triângulos são semelhantes.` },
      { text: tri(...t3), why: `Somou ${d} a cada lado. Na semelhança os lados são multiplicados pelo mesmo número, não somados: ${n(t3[0])} ÷ ${a} e ${n(t3[2])} ÷ ${c} dão razões diferentes.` },
      { text: tri(...t4), why: `Somou ${d + 1} a cada lado. A diferença igual não garante semelhança: ${n(t4[0])} ÷ ${a} = ${nAte(t4[0] / a, 2)}, mas ${n(t4[2])} ÷ ${c} = ${nAte(t4[2] / c, 2)}.` },
      { text: tri(...t2), why: `Conferiu só dois lados (${a} → ${n(t2[0])} e ${b} → ${n(t2[1])}, vezes ${k2}). O terceiro teria de ser ${n(k2 * c)} cm.` },
      { text: tri(b, c, a + c), why: `Os lados não seguem a mesma razão: ${b} ÷ ${a}, ${c} ÷ ${b} e ${a + c} ÷ ${c} são diferentes.` },
    ]),
    resolution: ["Em triângulos semelhantes, os lados correspondentes são proporcionais: a razão é a mesma para os três pares.", `Compare do menor para o maior: ${n(tk[0])} ÷ ${a} = ${n(k)}; ${n(tk[1])} ÷ ${b} = ${n(k)}; ${n(tk[2])} ÷ ${c} = ${n(k)}.`, `A razão é igual nos três pares, então o triângulo de ${n(tk[0])}, ${n(tk[1])} e ${n(tk[2])} cm é semelhante.`],
    check: `Com lados proporcionais, os ângulos também são iguais. Teste outro: no de ${n(t3[0])}, ${n(t3[1])} e ${n(t3[2])} cm, ${n(t3[0])} ÷ ${a} = ${nAte(t3[0] / a, 2)} e ${n(t3[2])} ÷ ${c} = ${nAte(t3[2] / c, 2)}, razões diferentes.`,
  };
});
