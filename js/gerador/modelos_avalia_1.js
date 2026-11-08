// Modelos das questões das Semanas 1 a 4 do Avalia, com números e contextos sorteados.
// Cada modelo devolve a questão no mesmo formato dos JSON (stem, ask, options, resolution, check).
import { n, nAte, rs, pct, par, M, NB, exigir, numericas, textuais, ehInteiro, arred, mdc, expr } from "./base.js?v=e27fa3b239";
import * as F from "./figuras.js?v=e27fa3b239";

const CAP = "Figura gerada para treino.";
const fig = (svg, alt) => ({ svg, alt, caption: CAP });
const tab = (header, rows) => ({ header, rows, caption: "Tabela gerada para treino." });
const NOMES = ["Ana", "Bruno", "Carla", "Davi", "Elisa", "Felipe", "Gabi", "Heitor", "Isa", "João", "Lara", "Marcos", "Nina", "Otávio", "Paula", "Rafa", "Sofia", "Téo", "Vitória", "Yuri"];

export const modelos = [];
const def = (id, code, level, gerar) => modelos.push({ id, code, level, gerar });

/* ---------- S01-1 · C27 · média ponderada ---------- */
def("S01-1", "C27", "N2", (r) => {
  const nome = r.um(NOMES);
  const materia = r.um(["Matemática", "Ciências", "Geografia", "História"]);
  const aval = r.um([["Atividades em sala", "Projeto", "Prova"], ["Lista de exercícios", "Trabalho em grupo", "Prova"], ["Caderno", "Seminário", "Prova"]]);
  const pesos = r.um([[2, 3, 5], [1, 4, 5], [1, 3, 6], [2, 2, 6], [1, 2, 7], [3, 3, 4]]);
  exigir(pesos[0] !== pesos[2]);
  const notas = [r.int(4, 10), r.int(3, 10), r.int(3, 10)];
  const W = pesos.reduce((a, b) => a + b, 0);
  const prod = notas.map((x, i) => x * pesos[i]);
  const S = prod.reduce((a, b) => a + b, 0);
  const certo = S / W, simples = (notas[0] + notas[1] + notas[2]) / 3;
  const inv = (notas[0] * pesos[2] + notas[1] * pesos[1] + notas[2] * pesos[0]) / W;
  exigir(ehInteiro(simples * 10) && ehInteiro(inv * 10) && ehInteiro(certo * 10));
  exigir(Math.min(...notas) < Math.max(...notas) - 2);
  const fmt = (v) => (v > 10 && ehInteiro(v) ? n(v) : n(v, 1));
  const somaP = prod.map((v) => n(v)).join(" + "), somaW = pesos.join(" + ");
  return {
    short: "Média ponderada",
    stem: [`Em uma escola, a nota final de ${materia} de cada estudante é a média ponderada das notas de três avaliações, com os pesos indicados na tabela a seguir. A tabela mostra as notas de ${nome}.`],
    table: tab(["Avaliação", `Nota de ${nome}`, "Peso"], aval.map((a, i) => [a, n(notas[i], 1), String(pesos[i])])),
    ask: `Qual foi a nota final de ${nome} em ${materia}?`,
    options: numericas([
      [certo, `Acerto. Soma dos produtos nota × peso (${somaP} = ${n(S)}) dividida pela soma dos pesos (${somaW} = ${W}): ${n(S)} ÷ ${W} = ${n(certo, 1)}.`],
      [simples, `Média aritmética simples: (${notas.join(" + ")}) ÷ 3 = ${n(simples, 1)}. Ignora os pesos.`],
      [inv, `Pesos aplicados na ordem invertida (${[...pesos].reverse().join(", ")}). Erro de leitura da coluna dos pesos.`],
      [arred(S / 3, 1), `Soma dos produtos (${n(S)}) dividida por 3, o número de avaliações, e não pela soma dos pesos. Uma nota acima de 10 passa do máximo possível.`],
      [S, "Soma dos produtos nota × peso sem dividir por nada. Falta o passo final da média ponderada."],
    ], certo, fmt),
    resolution: [
      `Multiplique cada nota pelo peso: ${notas.map((x, i) => `${n(x, 1)} × ${pesos[i]} = ${n(prod[i])}`).join("; ")}.`,
      `Some os produtos: ${somaP} = ${n(S)}.`,
      `Divida pela soma dos pesos: ${somaW} = ${W}. Então ${n(S)} ÷ ${W} = ${n(certo, 1)}.`,
    ],
    check: `Toda média fica entre a menor e a maior nota (${n(Math.min(...notas), 1)} e ${n(Math.max(...notas), 1)}).`,
  };
});

/* ---------- aumento seguido de desconto (S01-2 e S05-2) ---------- */
function percentuais(r, comValorDoDesconto) {
  const ctx = r.um([
    ["Uma plataforma de streaming aumentou em {p}% o valor da assinatura mensal, que era de {P}. Depois de reclamações dos clientes, a empresa deu um desconto de {p}% sobre o novo valor.", "Qual é o valor da assinatura depois do desconto?"],
    ["Em novembro, uma loja aumentou em {p}% o preço de um par de tênis que custava {P}. Em janeiro, na liquidação, a loja deu {p}% de desconto sobre o preço de novembro.", "Qual é o preço desse par de tênis em janeiro?"],
    ["Uma academia reajustou em {p}% a mensalidade, que era de {P}. Para não perder alunos, ofereceu depois {p}% de desconto sobre a nova mensalidade.", "Quanto passou a custar a mensalidade com o desconto?"],
    ["Um fone de ouvido custava {P}. Na semana da promoção, a loja aumentou o preço em {p}% e, no dia da promoção, anunciou {p}% de desconto sobre o preço aumentado.", "Qual é o preço do fone no dia da promoção?"],
  ]);
  const p = r.um([10, 20, 25, 30, 40, 50]);
  const P = r.passo(comValorDoDesconto ? 100 : 30, comValorDoDesconto ? 400 : 120, comValorDoDesconto ? 10 : 5);
  const up = P * (1 + p / 100), fim = up * (1 - p / 100), desc = up * (p / 100);
  const f1 = n(1 + p / 100, 2), f2 = n(1 - p / 100, 2);
  // erros abaixo e acima da resposta: o sorteio escolhe quantos de cada lado,
  // para a correta não ficar sempre na mesma letra
  const baixos = [
    [P * (1 - p / 100), `Aplicou o desconto de ${p}% direto sobre o valor original e ignorou o aumento.`],
    comValorDoDesconto
      ? [desc, `Calculou o valor do desconto (${p}% de ${rs(up)} = ${rs(desc)}) e respondeu com ele. A pergunta pede o preço depois do desconto.`]
      : [P - desc, `Calculou o desconto sobre o valor aumentado (${rs(desc)}), mas subtraiu do valor original: ${n(P, 2)} ${M} ${n(desc, 2)} = ${n(P - desc, 2)}.`],
    [P * (p / 100), `Respondeu só o valor do aumento (${p}% de ${rs(P)}), e não o preço final.`],
  ];
  const altos = [
    [P, `Somou os percentuais (+${p}% ${M} ${p}% = 0%) e concluiu que o valor voltou ao original. O desconto incide sobre o valor já aumentado, que é maior.`],
    [up, `Aplicou só o aumento (${n(P)} × ${f1} = ${n(up, 2)}) e esqueceu o desconto.`],
    [up * (1 + p / 100), `Aplicou o desconto como se fosse um segundo aumento: ${n(up, 2)} × ${f1}.`],
  ];
  const nb = r.int(1, 3);
  const lista = [
    [fim, `Acerto. Depois do aumento: ${n(P)} × ${f1} = ${n(up, 2)}. Depois do desconto: ${n(up, 2)} × ${f2} = ${n(fim, 2)}.`],
    ...r.alguns(baixos, nb),
    ...r.alguns(altos, 4 - nb),
  ];
  const [frase, ask] = ctx;
  return {
    short: "Porcentagens sucessivas",
    stem: [frase.replaceAll("{p}", p).replace("{P}", rs(P))],
    ask,
    options: numericas(lista, fim, rs),
    resolution: [
      `Aumento de ${p}%: o valor é multiplicado por ${f1}. ${n(P)} × ${f1} = ${rs(up)}.`,
      `Desconto de ${p}% sobre ${rs(up)}: multiplique por ${f2}. ${n(up, 2)} × ${f2} = ${rs(fim)}.`,
      `Os percentuais não se somam, porque cada um incide sobre um valor diferente.`,
    ],
    check: `O fator total é ${f1} × ${f2} = ${nAte((1 + p / 100) * (1 - p / 100), 4)}: ${n(P)} × ${nAte((1 + p / 100) * (1 - p / 100), 4)} = ${n(fim, 2)}, menos que o valor original.`,
  };
}
def("S01-2", "D31", "N2", (r) => percentuais(r, false));
export const percentuaisComDesconto = (r) => percentuais(r, true);

/* ---------- S01-3 · D13 · leitura de gráfico de barras ---------- */
def("S01-3", "D13", "N2", (r) => {
  const ctx = r.um([
    { tema: "quanto tempo eles passam por dia em frente a telas (celular, computador, televisão ou videogame)", publico: "adolescentes", faixas: ["Até 2 h", "Mais de 2 h\naté 4 h", "Mais de 4 h\naté 6 h", "Mais de 6 h"], baixo: "passam até 4 horas por dia em frente a telas", alto: "passam mais de 4 horas por dia em frente a telas", eixo: "adolescentes" },
    { tema: "quanto tempo eles levam de casa até a escola", publico: "estudantes", faixas: ["Até 10 min", "Mais de 10\naté 20 min", "Mais de 20\naté 30 min", "Mais de 30 min"], baixo: "levam até 20 minutos de casa até a escola", alto: "levam mais de 20 minutos de casa até a escola", eixo: "estudantes" },
    { tema: "quantos livros eles leram no último ano", publico: "jovens", faixas: ["Nenhum", "1 ou 2", "3 ou 4", "5 ou mais"], baixo: "leram menos de 3 livros no último ano", alto: "leram 3 livros ou mais no último ano", eixo: "jovens" },
  ]);
  const passo = r.um([5, 10]);
  const v = [r.int(4, 22), r.int(6, 24), r.int(4, 22), r.int(3, 16)].map((x) => x * passo);
  const T = v.reduce((a, b) => a + b, 0);
  const altoPede = r.moeda();
  const [i, j, k, l] = altoPede ? [2, 3, 0, 1] : [0, 1, 2, 3];
  const certo = v[i] + v[j], outro = v[k] + v[l];
  const desc = altoPede ? ctx.alto : ctx.baixo;
  const rot = ctx.faixas.map((f) => f.replace("\n", " ").toLowerCase());
  return {
    short: "Interpretação de gráficos",
    stem: [`Uma pesquisa com ${T} ${ctx.publico} investigou ${ctx.tema}. O resultado foi organizado no gráfico a seguir.`],
    figure: fig(F.barras(ctx.faixas, v, { eixo: `Número de ${ctx.eixo}` }), `Gráfico de barras com o número de ${ctx.publico} em cada faixa: ${ctx.faixas.map((f, q) => `${f.replace("\n", " ").toLowerCase()}, ${v[q]}`).join("; ")}.`),
    ask: `Quantos desses ${ctx.publico} ${desc}?`,
    options: numericas([
      [v[i], `Só a barra "${rot[i]}". Faltou somar a outra barra que também entra na pergunta.`],
      [v[j], `Só a barra "${rot[j]}". Faltou somar a outra barra que também entra na pergunta.`],
      [outro, `Leu a condição contrária: ${v[k]} + ${v[l]} = ${outro} são os do outro lado da pergunta.`],
      [certo, `Acerto. A pergunta reúne duas barras: ${v[i]} + ${v[j]} = ${certo}.`],
      [T, "Total de pessoas da pesquisa. Ignorou a condição da pergunta."],
      [certo + v[altoPede ? 1 : 2], "Somou também a faixa vizinha, que não entra na pergunta."],
    ], certo, undefined, r),
    resolution: [`A pergunta inclui as faixas "${rot[i]}" e "${rot[j]}".`, `Some as duas barras: ${v[i]} + ${v[j]} = ${certo}.`],
    check: `As quatro barras somam ${v.join(" + ")} = ${T}, o total da pesquisa. ${T} ${M} ${outro} = ${certo}.`,
  };
});

/* ---------- Pitágoras: cateto desconhecido (S01-4) ---------- */
const TERNAS = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 12, 15], [12, 16, 20], [6, 8, 10]];
def("S01-4", "D30", "N3", (r) => {
  const [p, q, c0] = r.um(TERNAS);
  const k = r.um([1, 2, 3, 4, 5]);
  exigir(c0 * k <= 60);
  const troca = r.moeda();
  const b = (troca ? q : p) * k, h = (troca ? p : q) * k, c = c0 * k;
  const ctx = r.um([
    { stem: `Um técnico, em pé no solo, usa um sensor a laser para acompanhar um drone que sobe na vertical. O sensor indica que a distância em linha reta entre o técnico e o drone é de ${c} m. Nesse instante, a distância horizontal entre o técnico e o ponto do solo abaixo do drone é de ${b} m, como mostra a figura.`, ask: "Qual é a altura h em que o drone se encontra?", alt: "drone" },
    { stem: `Uma pipa está presa por uma linha bem esticada de ${c} m. A pessoa que segura a linha está a ${b} m, na horizontal, do ponto do chão que fica bem abaixo da pipa, como mostra a figura.`, ask: "Qual é a altura h da pipa em relação à mão da pessoa?", alt: "pipa" },
    { stem: `Um cabo de aço de ${c} m vai do alto de uma torre até um gancho no chão. O gancho está a ${b} m da base da torre, como mostra a figura.`, ask: "Qual é a altura h da torre?", alt: "cabo" },
  ]);
  const raiz = Math.sqrt(c * c + b * b);
  return {
    short: "Teorema de Pitágoras",
    stem: [ctx.stem],
    figure: fig(F.trianguloRetangulo({ base: `${b} m`, altura: "h", hip: `${c} m`, proporcao: h / b }), `Triângulo retângulo com o ângulo reto embaixo, à direita. Base de ${b} m, lado inclinado (hipotenusa) de ${c} m e altura h desconhecida.`),
    ask: ctx.ask,
    options: numericas([
      [c - b, `Diferença das medidas dadas (${c} ${M} ${b}). O Teorema de Pitágoras relaciona os quadrados dos lados, não os lados.`],
      [h, `Acerto. h² + ${b}² = ${c}², logo h² = ${c * c} ${M} ${b * b} = ${h * h} e h = ${h}.`],
      [arred(raiz, 1), `√(${c}² + ${b}²) ≈ ${n(raiz, 1)}. Tratou ${c} m e ${b} m como catetos, mas ${c} m já é a hipotenusa, o lado oposto ao ângulo reto.`],
      [c + b, `Soma das medidas dadas (${c} + ${b}). Não há relação de soma entre os lados de um triângulo retângulo.`],
      [h * h, `Parou em h² = ${h * h} e não tirou a raiz quadrada.`],
      [c, `Respondeu ${c} m, que é a hipotenusa (o lado inclinado), e não a altura.`], [(h * h) / 2, `Dividiu h² = ${h * h} por 2 em vez de tirar a raiz quadrada.`],
    ], h, (v) => `${n(v)} m`, r),
    resolution: [`O ângulo reto está embaixo, então ${c} m é a hipotenusa, e ${b} m e h são os catetos.`, `Pitágoras: ${c}² = ${b}² + h², isto é, ${c * c} = ${b * b} + h².`, `h² = ${c * c} ${M} ${b * b} = ${h * h}. Portanto h = √${h * h} = ${h} m.`],
    check: `${b}² + ${h}² = ${b * b} + ${h * h} = ${c * c} = ${c}². E a hipotenusa (${c} m) é o maior lado, como tem de ser.`,
  };
});

/* ---------- S01-5 · D20 · tabela de dupla entrada ---------- */
def("S01-5", "D20", "N3", (r) => {
  const ctx = r.um([
    { linhas: ["Futsal", "Vôlei", "Basquete", "Handebol"], cab: "Modalidade", o_que: "a modalidade esportiva que vão disputar na gincana", cada: "uma única modalidade" },
    { linhas: ["Museu", "Zoológico", "Parque", "Teatro"], cab: "Passeio", o_que: "o passeio da excursão de fim de ano", cada: "um único passeio" },
    { linhas: ["Pizza", "Cachorro-quente", "Pastel", "Sanduíche"], cab: "Lanche", o_que: "o lanche da festa da turma", cada: "um único lanche" },
  ]);
  const T = r.um([30, 32, 35, 36, 40]);
  const cols = [0, 1, 2].map(() => {
    const a = r.int(4, 14), b = r.int(4, 14), c = r.int(4, 14);
    return [a, b, c, T - a - b - c];
  });
  exigir(cols.every((c) => c[3] >= 3 && c[3] <= 16));
  const [x, z] = r.alguns([0, 1, 2], 2).sort();
  const [l1, l2] = r.alguns([0, 1, 2, 3], 2).sort();
  const outras = [0, 1, 2, 3].filter((q) => q !== l1 && q !== l2);
  const nomeT = ["9º A", "9º B", "9º C"];
  const sx = cols[x][l1] + cols[x][l2], sz = cols[z][l1] + cols[z][l2];
  const certo = sx + sz;
  const todas = [0, 1, 2].reduce((s, t) => s + cols[t][l1] + cols[t][l2], 0);
  const trocado = cols[x][outras[0]] + cols[x][outras[1]] + cols[z][outras[0]] + cols[z][outras[1]];
  const L = ctx.linhas, y = 3 - x - z;
  return {
    short: "Dados em tabelas",
    stem: [`Três turmas do 9º ano de uma escola, com ${T} estudantes cada uma, escolheram ${ctx.o_que}. Cada estudante escolheu ${ctx.cada}. O resultado está na tabela a seguir.`],
    table: tab([ctx.cab, ...nomeT], L.map((nome, q) => [nome, ...cols.map((c) => String(c[q]))])),
    ask: `Quantos estudantes do ${nomeT[x]} e do ${nomeT[z]}, juntos, escolheram ${L[l1].toLowerCase()} ou ${L[l2].toLowerCase()}?`,
    options: numericas([
      [sx, `Só o ${nomeT[x]} (${cols[x][l1]} + ${cols[x][l2]} = ${sx}). Faltou o ${nomeT[z]}.`],
      [sz, `Só o ${nomeT[z]} (${cols[z][l1]} + ${cols[z][l2]} = ${sz}). Faltou o ${nomeT[x]}.`],
      [certo, `Acerto. ${nomeT[x]}: ${sx}. ${nomeT[z]}: ${sz}. Juntos: ${sx} + ${sz} = ${certo}.`],
      [trocado, `Somou as outras duas linhas (${L[outras[0]].toLowerCase()} e ${L[outras[1]].toLowerCase()}). Leu as linhas erradas da tabela.`],
      [todas, `Somou as três turmas. Incluiu o ${nomeT[y]}, que não foi pedido.`],
      [cols[x][l1] + cols[z][l1], `Somou só ${L[l1].toLowerCase()} nas duas turmas e esqueceu ${L[l2].toLowerCase()}.`],
    ], certo, undefined, r),
    resolution: [`Selecione as colunas pedidas (${nomeT[x]} e ${nomeT[z]}) e as linhas pedidas (${L[l1]} e ${L[l2]}).`, `${nomeT[x]}: ${cols[x][l1]} + ${cols[x][l2]} = ${sx}. ${nomeT[z]}: ${cols[z][l1]} + ${cols[z][l2]} = ${sz}.`, `Juntos: ${sx} + ${sz} = ${certo}.`],
    check: `As duas turmas têm ${2 * T} estudantes: ${certo} nas linhas pedidas e ${trocado} nas outras duas, e ${certo} + ${trocado} = ${2 * T}.`,
  };
});

/* ---------- S02-1 · C31 · princípio multiplicativo ---------- */
def("S02-1", "C31", "N2", (r) => {
  const ctx = r.um([
    { f: false, quem: "Uma lanchonete monta sanduíches combinando", g1: ["pão", "pães", false, ["branco", "integral", "australiano", "brioche", "de forma", "sírio"]], g2: ["recheio", "recheios", false, ["frango", "atum", "vegetariano", "queijo", "presunto", "ovo"]], coisa: "sanduíches", cada: "Cada sanduíche tem exatamente um pão e um recheio." },
    { f: false, quem: "Para o uniforme do time, cada jogador pode combinar", g1: ["camiseta", "camisetas", true, ["azul", "branca", "verde", "amarela", "preta", "vermelha"]], g2: ["bermuda", "bermudas", true, ["preta", "branca", "cinza", "azul", "verde", "vinho"]], coisa: "uniformes", cada: "Cada uniforme tem exatamente uma camiseta e uma bermuda." },
    { f: true, quem: "Uma sorveteria monta taças combinando", g1: ["sabor de sorvete", "sabores de sorvete", false, ["chocolate", "morango", "creme", "limão", "flocos", "coco"]], g2: ["cobertura", "coberturas", true, ["caramelo", "chocolate", "morango", "leite condensado", "mel", "menta"]], coisa: "taças", cada: "Cada taça tem exatamente um sabor e uma cobertura." },
  ]);
  const a = r.int(3, 6), b = r.int(2, 6);
  exigir(a !== b);
  const l1 = ctx.g1[3].slice(0, a), l2 = ctx.g2[3].slice(0, b);
  const esc = (g) => (g[2] ? "escolhida" : "escolhido");
  const lista = (l) => l.slice(0, -1).join(", ") + " e " + l[l.length - 1];
  return {
    short: "Princípio multiplicativo",
    stem: [`${ctx.quem} ${ctx.g1[2] ? "1" : "1"} ${ctx.g1[0]}, ${esc(ctx.g1)} entre ${a} opções (${lista(l1)}), com 1 ${ctx.g2[0]}, ${esc(ctx.g2)} entre ${b} opções (${lista(l2)}). ${ctx.cada}`],
    ask: `${ctx.f ? "Quantas" : "Quantos"} ${ctx.coisa} diferentes é possível montar dessa forma?`,
    options: numericas([
      [b, `Contou só as opções de ${ctx.g2[1]} (${b}), sem multiplicar pelas de ${ctx.g1[1]}.`],
      [a, `Contou só as opções de ${ctx.g1[1]} (${a}), sem multiplicar pelas de ${ctx.g2[1]}.`],
      [a + b, `Somou as quantidades (${a} + ${b} = ${a + b}) em vez de multiplicar. A soma não conta todas as combinações.`],
      [a * b, `Acerto. Para cada uma das ${a} opções de ${ctx.g1[0]} há ${b} de ${ctx.g2[0]}: ${a} × ${b} = ${a * b}.`],
      [2 * a * b, `Contou cada combinação duas vezes, como se a ordem importasse. São ${a} × ${b} = ${a * b}, não ${a} × ${b} × 2.`],
      ...((a * b) % 2 === 0 ? [[(a * b) / 2, `Dividiu ${a} × ${b} por 2, achando que cada combinação foi contada duas vezes. Cada combinação aparece uma vez só.`]] : []), [a * b + a + b, `Somou as opções às combinações: ${a * b} + ${a} + ${b}. Só as combinações contam.`],
    ], a * b, undefined, r),
    resolution: [`É preciso escolher 1 ${ctx.g1[0]} entre ${a} opções e 1 ${ctx.g2[0]} entre ${b} opções.`, "Pelo princípio multiplicativo, o total é o produto do número de opções de cada escolha.", `${a} × ${b} = ${a * b}.`],
    check: `Fazendo uma árvore: cada ${ctx.g1[0]} abre ${b} galhos, e ${a} grupos de ${b} dão ${a * b}.`,
  };
});

/* ---------- S02-2 · D14 · quadrado da soma ---------- */
const mono = (c, l) => (c === 1 ? l : `${c}${l}`);
def("S02-2", "D14", "N3", (r) => {
  const [p, q] = r.um([["p", "q"], ["x", "y"], ["m", "n"]]);
  const a = r.int(2, 6), b = r.int(2, 7);
  exigir(a !== b);
  const ctx = r.um([
    ["Uma praça terá um canteiro quadrado de lado ({L}) metros", "a área desse canteiro", "Qual expressão representa corretamente a área do canteiro?"],
    ["Uma artista vai pintar um painel quadrado de lado ({L}) metros", "a área do painel", "Qual expressão representa corretamente a área do painel?"],
    ["Um piso quadrado de uma sala tem lado ({L}) metros", "a área do piso", "Qual expressão representa corretamente a área do piso?"],
  ]);
  const L = `${mono(a, p)} + ${mono(b, q)}`;
  const t = (A, B, C, sinal = "+") => `${mono(A, p + "²")} ${sinal} ${mono(B, p + q)} + ${mono(C, q + "²")}`;
  const certo = t(a * a, 2 * a * b, b * b);
  const pv = 2, qv = 3, lado = a * pv + b * qv;
  return {
    short: "Produto notável (quadrado da soma)",
    stem: [`${ctx[0].replace("{L}", L)}, sendo ${p} e ${q} medidas em metros. É preciso escrever ${ctx[1]} como uma expressão algébrica em ${p} e ${q}.`],
    figure: fig(F.quadradoRotulado({ lado: `(${L}) m` }), `Quadrado com os quatro lados medindo (${L}) metros.`),
    ask: ctx[2],
    options: textuais(r, [
      { text: certo, ok: true, why: `Acerto. (a + b)² = a² + 2ab + b², com a = ${mono(a, p)} e b = ${mono(b, q)}: ${a * a}${p}² + 2 · ${a}${p} · ${b}${q} + ${b * b}${q}².` },
      { text: `${mono(a * a, p + "²")} + ${mono(b * b, q + "²")}`, why: "Elevou cada termo ao quadrado e esqueceu o dobro do produto (2ab). O quadrado da soma tem três termos." },
      { text: t(a * a, a * b, b * b), why: `Usou o produto dos termos, ${a}${p} · ${b}${q} = ${a * b}${p}${q}, sem multiplicar por 2. O termo do meio é 2ab.` },
      { text: t(a, 2 * a * b, b * b), why: `Esqueceu de elevar o coeficiente ao quadrado: (${a}${p})² é ${a * a}${p}², não ${a}${p}².` },
      { text: t(a * a, 2 * a * b, b * b, M), why: "Usou o quadrado da diferença, (a − b)² = a² − 2ab + b². O lado é uma soma." },
    ]),
    resolution: [`A área é o quadrado do lado: (${L})², o quadrado de uma soma com a = ${mono(a, p)} e b = ${mono(b, q)}.`, `a² = ${a * a}${p}²; 2ab = 2 · ${a}${p} · ${b}${q} = ${2 * a * b}${p}${q}; b² = ${b * b}${q}².`, `Somando: ${certo}.`],
    check: `Com ${p} = ${pv} e ${q} = ${qv}: o lado vale ${lado} e a área ${lado}² = ${lado * lado}. Na expressão: ${a * a * pv * pv} + ${2 * a * b * pv * qv} + ${b * b * qv * qv} = ${lado * lado}. Confere.`,
  };
});

/* ---------- S02-3 · D33 · probabilidade de "ou" ---------- */
def("S02-3", "D33", "N2", (r) => {
  const T = r.um([10, 20, 25]);
  const c1 = r.int(2, T - 4), c2 = r.int(2, T - c1 - 2), c3 = T - c1 - c2;
  exigir(c3 >= 2);
  const cores = r.alguns(["vermelhas", "azuis", "verdes", "amarelas", "brancas", "pretas"], 3);
  const SING = { vermelhas: "vermelha", azuis: "azul", verdes: "verde", amarelas: "amarela", brancas: "branca", pretas: "preta" };
  const sing = (c) => SING[c];
  const pc = (k) => (k / T) * 100;
  const certo = pc(c1 + c3);
  const objeto = r.um([["bolas", "urna", "bola", "Uma bola é retirada dessa urna ao acaso"], ["fichas", "caixa", "ficha", "Uma ficha é retirada dessa caixa ao acaso"]]);
  return {
    short: "Probabilidade (evento 'ou')",
    stem: [`Uma ${objeto[1]} contém ${c1} ${objeto[0]} ${cores[0]}, ${c2} ${objeto[0]} ${cores[1]} e ${c3} ${objeto[0]} ${cores[2]}, todas iguais, a não ser pela cor. ${objeto[3]}.`],
    ask: `Qual é a probabilidade de a ${objeto[2]} retirada ser ${sing(cores[0])} ou ${sing(cores[2])}?`,
    options: numericas([
      [pc(c1) * (c3 / T), `Multiplicou as probabilidades das cores em vez de somar. No evento "ou", os casos favoráveis se somam.`],
      [pc(c3), `Considerou só as ${cores[2]} (${c3} em ${T}), esquecendo as ${cores[0]}.`],
      [pc(c2), `Considerou só as ${cores[1]} (${c2} em ${T}), que não fazem parte do evento.`],
      [pc(c1), `Considerou só as ${cores[0]} (${c1} em ${T}), esquecendo as ${cores[2]}.`],
      [certo, `Acerto. ${c1} + ${c3} = ${c1 + c3} casos favoráveis em ${T}: ${c1 + c3}/${T} = ${pct(certo)}.`],
      [c1 + c3, `Usou o número de casos favoráveis (${c1 + c3}) como se fosse a porcentagem, sem dividir pelo total.`], [100, `Contou todas as ${objeto[0]} como favoráveis. Só entram as duas cores pedidas.`],
    ], certo, pct, r),
    resolution: [`Total: ${c1} + ${c2} + ${c3} = ${T}.`, `Casos favoráveis (${cores[0]} ou ${cores[2]}): ${c1} + ${c3} = ${c1 + c3}.`, `P = ${c1 + c3}/${T} = ${pct(certo)}.`],
    check: `As três cores somam 100%: ${pct(pc(c1))} + ${pct(pc(c2))} + ${pct(pc(c3))} = 100%.`,
  };
});

/* ---------- relações métricas (S02-4 e S05-6) ---------- */
function relacoesMetricas(r, maior) {
  const k = r.um(maior ? [0.5, 1, 1.5, 2] : [1.5, 2, 2.5, 3, 4, 5]);
  const m = 1.8 * k, nn = 3.2 * k, c = 5 * k, h = 2.4 * k, menor = 3 * k, maiorL = 4 * k;
  const ctx = maior
    ? r.um([
        ["A frente de uma barraca de acampamento tem a forma de um triângulo retângulo, com o ângulo reto no topo. Um mastro vertical liga o topo ao chão e divide a base da barraca em dois trechos, de {m} m e {n} m, como mostra a figura.", "Qual é o comprimento, em metros, do lado inclinado maior dessa barraca?", "mastro"],
        ["Um suporte de prateleira tem a forma de um triângulo retângulo, com o ângulo reto no vértice de cima. Uma haste vertical vai desse vértice até a base e a divide em dois trechos, de {m} m e {n} m, como mostra a figura.", "Qual é o comprimento, em metros, do lado inclinado maior desse suporte?", "haste"],
      ])
    : r.um([
        ["A imagem mostra o desenho da frente de uma casa, com o telhado em destaque. O encontro dos dois lados inclinados do telhado forma um ângulo de 90°. A altura do telhado divide a base em dois trechos: {m} m do lado esquerdo e {n} m do lado direito.", "Qual é o comprimento do menor lado inclinado desse telhado?", "altura"],
        ["Uma rampa de skate, vista de lado, tem a forma de um triângulo com ângulo de 90° no topo. Uma coluna vertical sai do topo e divide a base em dois trechos: {m} m à esquerda e {n} m à direita.", "Qual é o comprimento do menor lado inclinado dessa rampa?", "coluna"],
      ]);
  const um = (v) => `${n(v)} m`;
  const certo = maior ? maiorL : menor;
  const lista = maior
    ? [
        [m, `Respondeu o trecho menor da base (${n(m)} m), que é a projeção do lado menor, e não um lado.`],
        [h, `Calculou a altura (${ctx[2]}): h² = ${n(m)} × ${n(nn)}, h = ${n(h)} m, e parou. A altura não é um lado inclinado.`],
        [menor, `Calculou o lado inclinado menor (√(${n(c)} × ${n(m)}) = ${n(menor)}). A pergunta pede o maior.`],
        [nn, `Respondeu a projeção do lado maior (${n(nn)} m), que é só um trecho da base.`],
        [maiorL, `Acerto. A base toda mede ${n(m)} + ${n(nn)} = ${n(c)} m e é a hipotenusa. O lado maior é o cateto com projeção ${n(nn)} m: c² = ${n(c)} × ${n(nn)} = ${n(c * nn)}, logo c = ${n(maiorL)} m.`],
        [c, `Respondeu a base toda (${n(c)} m), que é a hipotenusa, e não o lado inclinado.`],
        [c * nn, `Fez ${n(c)} × ${n(nn)} = ${n(c * nn)} e não tirou a raiz quadrada.`],
      ]
    : [
        [nn - m, `Diferença entre os dois trechos da base (${n(nn)} ${M} ${n(m)}). Essa diferença não é nenhum lado.`],
        [m, "Usou o menor trecho da base (a projeção do lado), sem calcular o lado inclinado."],
        [h, `Calculou a altura, √(${n(m)} × ${n(nn)}) = ${n(h)}, no lugar do lado inclinado pedido.`],
        [menor, `Acerto. Lado² = base × projeção = ${n(c)} × ${n(m)} = ${n(c * m)}, logo lado = ${n(menor)} m.`],
        [c, "Usou a base toda, sem calcular o lado inclinado."],
        [maiorL, `Calculou o lado inclinado maior (√(${n(c)} × ${n(nn)}) = ${n(maiorL)}). A pergunta pede o menor.`],
        [c * m, `Fez ${n(c)} × ${n(m)} = ${n(c * m)} e não tirou a raiz quadrada.`],
      ];
  const proj = maior ? nn : m;
  return {
    short: maior ? "Relações métricas no triângulo retângulo (lado maior)" : "Relações métricas no triângulo retângulo",
    stem: [ctx[0].replace("{m}", n(m)).replace("{n}", n(nn))],
    figure: fig(F.trianguloAlturaBase({ m, nn, rotM: `${n(m)} m`, rotN: `${n(nn)} m` }), `Triângulo com a base embaixo e o ângulo reto no vértice de cima. Um segmento tracejado vertical vai desse vértice até a base e a divide em ${n(m)} m, à esquerda, e ${n(nn)} m, à direita.`),
    ask: ctx[1],
    options: numericas(lista, certo, maior ? (v) => n(v) : um, r),
    resolution: [
      `O ângulo reto está no topo, então a base (${n(m)} + ${n(nn)} = ${n(c)} m) é a hipotenusa e os lados inclinados são os catetos.`,
      `Cada cateto ao quadrado é igual à hipotenusa vezes a projeção dele. O lado ${maior ? "maior fica do lado do trecho maior" : "menor fica do lado do trecho menor"}, ${n(proj)} m: lado² = ${n(c)} × ${n(proj)} = ${n(c * proj)}.`,
      `Lado = √${n(c * proj)} = ${n(certo)} m.`,
    ],
    check: `O outro lado mede ${n(maior ? menor : maiorL)} m, e ${n(menor)}² + ${n(maiorL)}² = ${n(menor * menor)} + ${n(maiorL * maiorL)} = ${n(c * c)} = ${n(c)}², como manda Pitágoras.`,
  };
}
def("S02-4", "D27", "N3", (r) => relacoesMetricas(r, false));
export const relacoesMetricasMaior = (r) => relacoesMetricas(r, true);

/* ---------- S02-5 · D33 · evento complementar ---------- */
def("S02-5", "D33", "N2", (r) => {
  const [N, k] = r.um([[20, 4], [20, 5], [40, 5], [40, 4], [30, 5], [50, 10], [24, 4], [30, 10], [50, 5], [40, 8]]);
  const mult = N / k, nao = N - mult;
  const pc = (x) => (x / N) * 100;
  const lista = [];
  for (let i = 1; i <= mult; i++) lista.push(k * i);
  return {
    short: "Probabilidade (evento complementar)",
    stem: [`Em uma caixa há ${N} cartões numerados de 1 a ${N}, sem repetição. Um cartão é retirado ao acaso.`],
    ask: `Qual é a probabilidade de o número desse cartão não ser múltiplo de ${k}?`,
    options: numericas([
      [pc(mult), `Calculou a probabilidade de o número SER múltiplo de ${k} (${mult}/${N}), o contrário do que foi pedido.`],
      [pc(mult + 1), `Contou ${mult + 1} múltiplos de ${k}, incluindo o 0, que não está entre os cartões.`],
      [pc(nao), `Acerto. Há ${mult} múltiplos de ${k} entre 1 e ${N}; não múltiplos: ${N} ${M} ${mult} = ${nao}. P = ${nao}/${N} = ${pct(pc(nao))}.`],
      [pc(nao + 1), `Esqueceu um dos múltiplos de ${k} (como o ${k} ou o ${N}) e contou ${nao + 1} não múltiplos.`],
      [(N / mult) * 100, `Inverteu a fração: ${N}/${mult}. Uma probabilidade nunca passa de 100%.`],
      [pc(nao - 1), `Contou ${mult + 1} múltiplos de ${k}, incluindo o 0, e fez ${N} ${M} ${mult + 1} = ${nao - 1}. O 0 não está entre os cartões.`], [100 - k, `Fez 100% ${M} ${k}%, misturando o ${k} do múltiplo com a porcentagem.`],
    ], pc(nao), pct, r),
    resolution: [`Múltiplos de ${k} entre 1 e ${N}: ${lista.join(", ")}. São ${mult}.`, `Não múltiplos: ${N} ${M} ${mult} = ${nao}.`, `P = ${nao}/${N} = ${pct(pc(nao))}.`],
    check: `P(múltiplo) + P(não múltiplo) = ${pct(pc(mult))} + ${pct(pc(nao))} = 100%.`,
  };
});

/* ---------- S03-1 · C13 · frequência relativa ---------- */
def("S03-1", "C13", "N2", (r) => {
  const ctx = r.um([
    ["qual é o seu gênero de filme favorito", "Gênero de filme", ["Comédia", "Ação", "Terror", "Drama"], "como gênero favorito"],
    ["qual é o seu esporte favorito", "Esporte", ["Futebol", "Vôlei", "Basquete", "Natação"], "como esporte favorito"],
    ["qual é o seu estilo musical favorito", "Estilo musical", ["Pop", "Funk", "Sertanejo", "Rock"], "como estilo favorito"],
    ["qual é a sua fruta favorita", "Fruta", ["Manga", "Morango", "Banana", "Uva"], "como fruta favorita"],
  ]);
  const T = r.um([20, 25, 40, 50]);
  const v = [r.int(2, T / 2), r.int(2, T / 3), r.int(1, T / 4)];
  v.push(T - v[0] - v[1] - v[2]);
  exigir(v[3] >= 1 && new Set(v).size === 4);
  const i = r.int(1, 3), viz = i === 3 ? 2 : i + 1;
  const pc = (x) => (x / T) * 100;
  const acum = v.slice(0, i + 1).reduce((a, b) => a + b, 0);
  exigir(i > 0 && pc(v[i]) !== v[i]);
  return {
    short: "Frequência relativa em tabela",
    stem: [`Uma escola perguntou a ${T} alunos do 9º ano ${ctx[0]}. O resultado está na tabela a seguir.`],
    table: tab([ctx[1], "Número de alunos"], ctx[2].map((g, q) => [g, String(v[q])])),
    ask: `Qual é a frequência relativa dos alunos que escolheram ${ctx[2][i].toLowerCase()} ${ctx[3]}?`,
    options: numericas([
      [v[i], `Usou o número de alunos (${v[i]}) como se já fosse a porcentagem, sem dividir pelo total.`],
      [pc(v[i]), `Acerto. Frequência relativa = ${v[i]} ÷ ${T} = ${n(v[i] / T)} = ${pct(pc(v[i]))}.`],
      [pc(v[viz]), `Calculou a frequência de ${ctx[2][viz].toLowerCase()} (${v[viz]} ÷ ${T}), trocando a linha da tabela.`],
      [pc(acum), `Somou as linhas até ${ctx[2][i].toLowerCase()} (${acum} ÷ ${T}): confundiu frequência relativa com acumulada.`],
      [100 - pc(v[i]), `Calculou o complementar: quem NÃO escolheu ${ctx[2][i].toLowerCase()}.`],
    ], pc(v[i]), pct),
    resolution: [`O total de alunos é ${T}.`, `Escolheram ${ctx[2][i].toLowerCase()}: ${v[i]}.`, `Frequência relativa = ${v[i]} ÷ ${T} = ${n(v[i] / T)} = ${pct(pc(v[i]))}.`],
    check: `As frequências relativas somam 100%: ${v.map((x) => pct(pc(x))).join(" + ")} = 100%.`,
  };
});

/* ---------- diferença de quadrados (S03-2 e S04-6) ---------- */
def("S03-2", "D09", "N4", (r) => {
  const L = r.int(6, 20);
  const ctx = r.um([
    [`Um pátio quadrado de uma fábrica tem lado medindo ${L} metros e é todo pavimentado com concreto. No centro desse pátio, foi construído um canteiro quadrado de flores, de lado x metros (x menor que ${L}).`, "a área do pátio que continua pavimentada (sem o canteiro)", "canteiro", "pátio"],
    [`Uma praça quadrada tem lado de ${L} metros e é toda gramada. No centro, será construído um chafariz de base quadrada, de lado x metros (x menor que ${L}).`, "a área da praça que continua gramada (sem o chafariz)", "chafariz", "praça"],
    [`O piso de uma quadra quadrada, de lado ${L} metros, vai ser pintado. No centro, há um tablado quadrado de lado x metros (x menor que ${L}) que não será pintado.`, "a área do piso que será pintada", "tablado", "quadra"],
  ]);
  const t = r.int(2, L - 2);
  return {
    short: "Diferença de quadrados (fatoração)",
    stem: [ctx[0]],
    figure: fig(F.quadradoComRecorte({ ladoGrande: `${L} m`, ladoPequeno: "x" }), `Quadrado maior de lado ${L} m com um quadrado menor de lado x no centro.`),
    ask: `Qual expressão fatorada representa, em metros quadrados, ${ctx[1]}?`,
    options: textuais(r, [
      { text: `(${L} ${M} x)(${L} + x)`, ok: true, why: `Acerto. A área restante é ${L}² ${M} x² = (${L} ${M} x)(${L} + x).` },
      { text: `(${L} + x)²`, why: `Usou o quadrado da soma. O ${ctx[2]} é subtraído, não somado.` },
      { text: `(${L} ${M} x)²`, why: "Confundiu a² − b² com (a − b)². A diferença de quadrados não é o quadrado da diferença." },
      { text: `${L * L} ${M} x`, why: `Subtraiu x sem elevar ao quadrado. A área do ${ctx[2]} é x², não x.` },
      { text: `(x ${M} ${L})(x + ${L})`, why: `Trocou a ordem dos termos. Como x é menor que ${L}, essa expressão dá um valor negativo, o que não pode ser uma área.` },
    ]),
    resolution: [`Área do quadrado grande: ${L}² = ${L * L} m². Área do ${ctx[2]}: x².`, `Área restante: ${L * L} ${M} x², uma diferença de quadrados.`, `${L * L} ${M} x² = ${L}² ${M} x² = (${L} ${M} x)(${L} + x).`],
    check: `Testando x = ${t}: ${L * L} ${M} ${t * t} = ${L * L - t * t}. Pela forma fatorada: (${L} ${M} ${t})(${L} + ${t}) = ${L - t} × ${L + t} = ${(L - t) * (L + t)}. Confere.`,
  };
});

/* ---------- S03-3 · D17 · semelhança pelo caso AA ---------- */
def("S03-3", "D17", "N4", (r) => {
  const a1 = r.passo(35, 75, 5), a2 = r.passo(40, 80, 5), a3 = 180 - a1 - a2;
  exigir(a3 >= 30 && a1 !== a2 && a3 !== a1 && a3 !== a2);
  const ctx = r.um([
    ["Uma gráfica vai recortar em tecido duas bandeirolas triangulares para uma festa. A bandeirola A tem ângulos internos de {a}° e {b}°. A bandeirola B, maior, também tem ângulos de {a}° e {b}°, mas lados com medidas diferentes das de A.", "bandeirolas"],
    ["Um marceneiro cortou duas peças triangulares de madeira. A peça A tem ângulos internos de {a}° e {b}°. A peça B, maior, também tem ângulos de {a}° e {b}°, mas lados com medidas diferentes das de A.", "peças"],
    ["Duas placas de trânsito triangulares foram desenhadas em escalas diferentes. A placa A tem ângulos internos de {a}° e {b}°. A placa B, maior, também tem ângulos de {a}° e {b}°, mas lados com medidas diferentes das de A.", "placas"],
  ]);
  return {
    short: "Condições de semelhança de triângulos",
    stem: [ctx[0].replaceAll("{a}", a1).replaceAll("{b}", a2)],
    figure: fig(F.doisTriangulos({ a1, a2 }), `Dois triângulos, A menor e B maior, cada um com ângulos internos de ${a1}° e ${a2}° marcados.`),
    ask: "Com base nos ângulos indicados, o que se pode concluir sobre os triângulos A e B?",
    options: textuais(r, [
      { text: "São congruentes, pois têm os mesmos ângulos e, por isso, o mesmo tamanho.", why: "Ângulos iguais garantem a mesma forma, não o mesmo tamanho. Com lados diferentes, são semelhantes, não congruentes." },
      { text: "Não são semelhantes, pois não se sabe a medida dos lados correspondentes.", why: "Pede mais do que o necessário: o caso Ângulo-Ângulo (AA) garante a semelhança sem conhecer os lados." },
      { text: "São semelhantes pelo caso Lado-Lado-Lado (LLL), já que os três ângulos garantem lados proporcionais.", why: "O caso LLL compara os lados, não os ângulos. Com só os ângulos, o caso é o AA." },
      { text: "São semelhantes pelo caso Ângulo-Ângulo (AA), pois dois pares de ângulos correspondentes são congruentes.", ok: true, why: `Acerto. Dois pares de ângulos iguais (${a1}° e ${a2}°, o que garante também o terceiro, ${a3}°) bastam para a semelhança pelo caso AA.` },
      { text: `Não são semelhantes, pois ${ctx[1]} de tamanhos diferentes nunca podem ser semelhantes.`, why: "É o contrário: mesmos ângulos e tamanhos diferentes é exatamente o caso de figuras semelhantes." },
    ]),
    resolution: [`Os dois triângulos têm dois ângulos correspondentes iguais: ${a1}° e ${a2}°.`, `O terceiro ângulo também é igual: 180° ${M} ${a1}° ${M} ${a2}° = ${a3}°.`, "Dois pares de ângulos correspondentes congruentes bastam: caso Ângulo-Ângulo (AA)."],
    check: "O caso AA não precisa de nenhuma medida de lado. Por isso é o critério mais direto quando o problema só informa ângulos.",
  };
});

/* ---------- S03-4 · D02 · lei a partir de uma tabela ---------- */
def("S03-4", "D02", "N3", (r) => {
  const a = r.int(2, 9), b = r.int(1, 12);
  exigir(a !== b);
  const ctx = r.um([
    ["Uma locadora de bicicletas cobra um valor que depende do tempo de uso. A tabela mostra o valor total pago, de acordo com o número de horas de uso.", "Tempo de uso (horas)", "Valor pago (R$)", "hora"],
    ["Um estacionamento cobra um valor que depende do tempo em que o carro fica parado. A tabela mostra o valor total pago, de acordo com o número de horas.", "Tempo (horas)", "Valor pago (R$)", "hora"],
    ["Uma quadra de futebol society é alugada por um valor que depende do tempo de jogo. A tabela mostra o valor total pago, de acordo com o número de horas.", "Tempo de jogo (horas)", "Valor pago (R$)", "hora"],
  ]);
  const y = (x) => a * x + b;
  const L = (A, B) => `y = ${expr([[A, "x"], [B, ""]])}`;
  return {
    short: "Associar função a tabela",
    stem: [ctx[0]],
    table: tab([ctx[1], ctx[2]], [1, 2, 3, 4].map((x) => [String(x), n(y(x), 2)])),
    ask: "Qual lei de formação relaciona o valor y, em reais, ao tempo x, em horas, de acordo com a tabela?",
    options: textuais(r, [
      { text: L(a + b, 0), why: `Usou só o primeiro par (1 hora, R$ ${n(y(1), 2)}) como se fosse proporcional, sem valor fixo.` },
      { text: L(a, b), ok: true, why: `Acerto. A cada hora o valor sobe ${a}. Em x = 1, y = ${y(1)}: ${a} · 1 + b = ${y(1)}, logo b = ${b}.` },
      { text: L(a, a + b), why: `Usou a taxa certa (${a}), mas pôs o primeiro valor da tabela (${a + b}) como valor fixo, sem descontar a parte da primeira hora.` },
      { text: L(-a, 5 * a + b), why: `Leu a tabela de trás para frente, como se o valor diminuísse ${a} por hora.` },
      { text: L(a, 0), why: `Usou a taxa certa (${a}), mas esqueceu o valor fixo.` },
    ]),
    resolution: [`De uma linha para a seguinte, x aumenta 1 e y aumenta sempre ${a}: essa é a taxa de variação, a = ${a}.`, `Para achar b, use um ponto: em x = 1, y = ${y(1)}. ${a} · 1 + b = ${y(1)}, logo b = ${b}.`, `A lei é y = ${expr([[a, "x"], [b, ""]])}.`],
    check: `Testando x = 4: y = ${a} · 4 + ${b} = ${y(4)}, que é o valor da tabela.`,
  };
});

/* ---------- S03-5 · D12 · lei pela tabela com passo 2 ---------- */
def("S03-5", "D12", "N3", (r) => {
  const a = r.passo(15, 70, 5), b = r.passo(10, 80, 5);
  exigir(a !== b && b !== a + b);
  const ctx = r.um([
    ["Uma oficina mecânica cobra uma taxa fixa pela visita, mais um valor por hora de serviço.", "Horas trabalhadas (x)"],
    ["Um eletricista cobra uma taxa fixa para ir até a casa do cliente, mais um valor por hora de trabalho.", "Horas de trabalho (x)"],
    ["Um técnico de informática cobra uma taxa fixa pelo atendimento, mais um valor por hora de conserto.", "Horas de conserto (x)"],
  ]);
  const f = (x) => a * x + b;
  const L = (A, B) => `f(x) = ${expr([[A, "x"], [B, ""]])}`;
  return {
    short: "Lei da função do 1º grau",
    stem: [`${ctx[0]} A tabela mostra o valor total cobrado, f(x), em reais, de acordo com o número de horas, x.`],
    table: tab([ctx[1], "Valor total (R$) f(x)"], [1, 3, 5].map((x) => [String(x), n(f(x), 2)])),
    ask: "Qual é a lei da função representada pela tabela?",
    options: textuais(r, [
      { text: L(b, a), why: "Trocou os coeficientes: usou a taxa fixa como valor por hora e o valor por hora como taxa fixa." },
      { text: L(a, f(1)), why: `Usou a taxa certa (${a} por hora), mas pôs o primeiro valor da tabela (${f(1)}) como taxa fixa.` },
      { text: L(f(1), 0), why: `Supôs que o valor é proporcional ao tempo a partir do primeiro par (1 hora, R$ ${n(f(1), 2)}), como se não houvesse taxa fixa.` },
      { text: L(a, b), ok: true, why: `Acerto. De x = 1 para x = 3, o valor sobe ${f(3) - f(1)} em 2 horas: ${a} por hora. Em x = 1: ${a} + b = ${f(1)}, logo b = ${b}.` },
      { text: L(2 * a, b), why: `Usou a diferença entre dois valores (${f(3) - f(1)}) como taxa por hora, sem dividir pela diferença de horas (3 ${M} 1 = 2).` },
    ]),
    resolution: [`Entre x = 1 e x = 3, o valor sobe de ${f(1)} para ${f(3)}: ${f(3) - f(1)} reais em 2 horas. A taxa por hora é ${f(3) - f(1)} ÷ 2 = ${a}.`, `Em x = 1: ${a} · 1 + b = ${f(1)}, logo b = ${b}.`, `A lei é f(x) = ${expr([[a, "x"], [b, ""]])}.`],
    check: `Testando x = 5: f(5) = ${a} · 5 + ${b} = ${f(5)}, o valor da tabela.`,
  };
});

/* ---------- trinômio quadrado perfeito: o lado (S03-6 e S06-6) ---------- */
function ladoDoQuadrado(r, negativo) {
  const a = r.int(2, 6), b = r.int(1, 9);
  exigir(mdc(a, b) === 1 && a !== b && (!negativo || b > 1));
  const s = negativo ? M : "+";
  const area = `${a * a}x² ${s} ${2 * a * b}x + ${b * b}`;
  const lado = `${a}x ${s} ${b}`;
  const ctx = r.um(negativo
    ? [["Um tapete quadrado tem área, em metros quadrados, dada pela expressão {A}, em que x é um número maior que {m}.", "Qual expressão representa a medida do lado desse tapete, em metros?", "m"],
       ["Um terreno quadrado tem área, em metros quadrados, dada por {A}, em que x é um número maior que {m}.", "Qual expressão representa a medida do lado desse terreno, em metros?", "m"]]
    : [["Uma fábrica produz adesivos quadrados para revestir pisos. A área de cada adesivo, em centímetros quadrados, é dada pela expressão {A}.", "Qual expressão representa a medida do lado desse adesivo, em centímetros?", "cm"],
       ["Um azulejo quadrado tem área, em centímetros quadrados, dada pela expressão {A}.", "Qual expressão representa a medida do lado desse azulejo, em centímetros?", "cm"]]);
  const minimo = Math.ceil(b / a + 0.01);
  const xv = negativo ? Math.max(minimo + 1, 3) : 2;
  const L = a * xv + (negativo ? -b : b);
  const lista = negativo
    ? [
        { text: `${a}x ${M} ${a * b}`, why: `Usou a metade do termo do meio (${2 * a * b} ÷ 2 = ${a * b}) como segundo termo. O segundo termo é a raiz de ${b * b}, que é ${b}.` },
        { text: `(${lado})²`, why: `Escreveu a área fatorada, e não o lado. O lado é o que está elevado ao quadrado: ${lado}.` },
        { text: `${a * a}x ${M} ${b}`, why: `Tirou a raiz só de ${b * b} e copiou o ${a * a}x. A raiz de ${a * a}x² é ${a}x.` },
        { text: `${a}x + ${b}`, why: `Acertou os termos e errou o sinal. Como o termo do meio é negativo, o lado é ${lado}.` },
        { text: lado, ok: true, why: `Acerto. ${a * a}x² = (${a}x)², ${b * b} = ${b}² e 2 · ${a}x · ${b} = ${2 * a * b}x, com sinal de menos. Logo, a área é (${lado})².` },
      ]
    : [
        { text: `${a}x ${M} ${b}`, why: "Tirou a raiz dos termos das pontas, mas errou o sinal. O termo do meio é positivo, então é (a + b)²." },
        { text: `${a * a}x + ${b * b}`, why: "Não tirou a raiz quadrada de nada: só juntou os termos da área." },
        { text: lado, ok: true, why: `Acerto. ${a * a}x² = (${a}x)², ${b * b} = ${b}² e ${2 * a * b}x = 2 · ${a}x · ${b}. Logo, a área é (${lado})².` },
        { text: "Não é possível indicar sem saber o valor de x", why: "Os três termos conferem com (a + b)², então dá para fatorar sem saber o valor de x." },
        { text: `${a}x² + ${b}`, why: `Errou o expoente: a raiz de ${a * a}x² é ${a}x, não ${a}x².` },
      ];
  return {
    short: negativo ? "Trinômio quadrado perfeito: lado do quadrado a partir da área" : "Produto notável (fatoração do quadrado perfeito)",
    stem: [ctx[0].replace("{A}", area).replace("{m}", String(minimo))],
    figure: negativo ? undefined : fig(F.quadradoRotulado({ meio: area }), `Quadrado com a área ${area} escrita no meio.`),
    ask: ctx[1],
    options: textuais(r, lista),
    resolution: [`A área é o lado ao quadrado; então é preciso escrever ${area} como o quadrado de um binômio.`, `Raízes das pontas: √(${a * a}x²) = ${a}x e √${b * b} = ${b}. Termo do meio: 2 · ${a}x · ${b} = ${2 * a * b}x${negativo ? ", com sinal de menos" : ""}.`, `Logo, ${area} = (${lado})², e o lado mede ${lado}.`],
    check: `Para x = ${xv}: a área é ${a * a * xv * xv} ${s} ${2 * a * b * xv} + ${b * b} = ${L * L} e o lado é ${a} · ${xv} ${s} ${b} = ${L}; ${L}² = ${L * L}. Confere.`,
  };
}
def("S03-6", "D14", "N4", (r) => ladoDoQuadrado(r, false));
export const ladoDoQuadradoNegativo = (r) => ladoDoQuadrado(r, true);

/* ---------- S04-1 · C05 · decomposição em fatores primos ---------- */
const SUP = { 2: "²", 3: "³", 4: "⁴" };
def("S04-1", "C05", "N2", (r) => {
  const a = r.int(1, 3), p = r.um([5, 7]);
  const N = 2 ** a * 9 * p;
  exigir(N <= 600);
  const pot = (b, e) => (e === 1 ? `${b}` : `${b}${SUP[e]}`);
  const certo = [pot(2, a), pot(3, 2), String(p)].join(" × ");
  const lista2 = Array(a).fill(2);
  const comNove = [...lista2, p, 9].sort((x, y) => x - y).join(" × ");
  const comSeis = [...lista2.slice(1), 3, p, 6].sort((x, y) => x - y).join(" × ");
  const perdeu = [pot(2, a), "3", String(p)].join(" × ");
  const comUm = "1 × " + certo;
  const ctx = r.um([["Uma professora organizou {N} cartas de um jogo", "cartas"], ["Um colecionador tem {N} figurinhas repetidas", "figurinhas"], ["Uma loja recebeu {N} canetas", "canetas"]]);
  const divs = [];
  let q = N;
  for (const d of [2, 3, 5, 7]) while (q % d === 0) { divs.push(`${q} ÷ ${d} = ${q / d}`); q /= d; }
  return {
    short: "Decomposição em fatores primos",
    stem: [`${ctx[0].replace("{N}", N)} e decidiu decompor o número ${N} em fatores primos para planejar a divisão das ${ctx[1]} em grupos iguais.`],
    ask: `Qual das alternativas apresenta a decomposição de ${N} em fatores primos?`,
    options: textuais(r, [
      { text: comNove, why: "Parou no 9, que ainda é composto (9 = 3 × 3). Todos os fatores precisam ser primos." },
      { text: certo, ok: true, why: `Acerto. Dividindo ${N} sempre pelo menor primo possível, sobram só fatores primos: ${N} = ${certo}.` },
      { text: comSeis, why: "Usou o 6 como fator, mas 6 é composto (2 × 3)." },
      { text: perdeu, why: `Perdeu um fator 3: esse produto dá ${N / 3}, não ${N}. Conferir o produto mostra o erro.` },
      { text: comUm, why: "Incluiu o 1 como fator. O 1 não é primo, então não entra na decomposição." },
    ]),
    resolution: [`Divida ${N} sempre pelo menor primo possível: ${divs.join("; ")}.`, "Os divisores usados são todos primos, e a divisão termina quando o quociente chega a 1.", `Logo, ${N} = ${certo}.`],
    check: `Multiplicando: ${2 ** a} × 9 × ${p} = ${N}. E nenhum dos fatores tem outro divisor além de 1 e dele mesmo.`,
  };
});

/* ---------- S04-2 · D10 · termo que completa o trinômio ---------- */
def("S04-2", "D10", "N3", (r) => {
  const a = r.int(3, 12);
  exigir(a !== 4);
  const ctx = r.um(["Um engenheiro projetou um deck quadrado para uma praça.", "Uma arquiteta desenhou um piso quadrado para uma varanda.", "Um artista vai fazer um mosaico quadrado num muro."]);
  return {
    short: "Termo que completa o trinômio quadrado perfeito",
    stem: [`${ctx} A área, em metros quadrados, é dada pela expressão x² + ${2 * a}x + k, em que k é um número positivo. O lado mede (x + a) metros, para algum número a.`],
    ask: "Qual é o valor de k, em metros quadrados?",
    options: numericas([
      [a, `Achou a (a metade de ${2 * a}), mas não elevou ao quadrado. O termo que falta é a².`],
      [2 * a, `Repetiu o coeficiente do termo do meio (${2 * a}) como se fosse o termo independente.`],
      [4 * a, `Multiplicou ${2 * a} por 2 em vez de dividir. O termo do meio é 2ax, então a = ${2 * a} ÷ 2.`],
      [a * a, `Acerto. ${2 * a}x = 2 · x · a, logo a = ${a} e k = a² = ${a * a}.`],
      [4 * a * a, `Elevou o ${2 * a} ao quadrado em vez de elevar a metade dele.`],
      [2 * a * a, `Fez 2 · ${a}² = ${2 * a * a}. O termo independente é só a² = ${a * a}.`],
    ], a * a, undefined, r),
    resolution: ["Um quadrado de lado (x + a) tem área (x + a)² = x² + 2ax + a².", `Comparando com x² + ${2 * a}x + k: 2a = ${2 * a}, logo a = ${a}.`, `k = a² = ${a}² = ${a * a}. A expressão é (x + ${a})².`],
    check: `Testando x = 1: o lado seria 1 + ${a} = ${a + 1} e a área ${(a + 1) ** 2}. Pela expressão: 1 + ${2 * a} + ${a * a} = ${(a + 1) ** 2}. Confere.`,
  };
});

/* ---------- S04-3 · D22 · dependência entre variáveis ---------- */
def("S04-3", "D22", "N3", (r) => {
  const ctx = r.um([
    ["Em uma cidade, o aluguel de patinetes elétricos funciona assim: o usuário paga {F} para destravar o patinete e mais {p} por minuto de uso.", "Uma usuária pagou {V} no total por uma corrida.", "Por quantos minutos ela usou o patinete?", "minutos"],
    ["Uma bicicleta compartilhada custa {F} para ser liberada e mais {p} por minuto de uso.", "Um ciclista pagou {V} no total por um passeio.", "Por quantos minutos ele usou a bicicleta?", "minutos"],
    ["Um estacionamento cobra {F} na entrada e mais {p} por hora em que o carro fica parado.", "Um motorista pagou {V} no total.", "Por quantas horas o carro ficou no estacionamento?", "horas"],
  ]);
  const F0 = r.int(2, 6), p = r.um([0.5, 1.5, 2, 2.5, 3]), t = r.int(5, 16);
  const V = F0 + p * t;
  exigir(ehInteiro(V * 2) && ehInteiro((V / p) * 10) && ehInteiro((V - F0) * 10));
  return {
    short: "Dependência entre duas variáveis",
    stem: [ctx[0].replace("{F}", rs(F0)).replace("{p}", rs(p)) + " O valor total pago depende do tempo de uso.", ctx[1].replace("{V}", rs(V))],
    ask: ctx[2],
    options: numericas([
      [t, `Acerto. V = ${n(F0)} + ${n(p, 2)} · t. Com V = ${n(V, 2)}: ${n(p, 2)} · t = ${n(V - F0, 2)}, logo t = ${t}.`],
      [V / p, `Dividiu ${rs(V)} por ${rs(p)} sem descontar os ${rs(F0)} da entrada, que são pagos uma vez só.`],
      [V - F0, `Descontou os ${rs(F0)} e parou em ${n(V - F0, 2)}, que ainda é um valor em reais, e não um tempo.`],
      [V, "Tratou o valor pago como se fosse o tempo, trocando a variável que depende pela que a determina."],
      [(V - F0) * p, `Multiplicou ${n(V - F0, 2)} por ${n(p, 2)} em vez de dividir.`],
    ], t),
    resolution: [`O valor V depende do tempo t: V = ${n(F0)} + ${n(p, 2)} · t.`, `Como V = ${n(V, 2)}: ${n(F0)} + ${n(p, 2)} · t = ${n(V, 2)}, então ${n(p, 2)} · t = ${n(V - F0, 2)}.`, `t = ${n(V - F0, 2)} ÷ ${n(p, 2)} = ${t} ${ctx[3]}.`],
    check: `Substituindo t = ${t}: ${n(F0)} + ${n(p, 2)} · ${t} = ${n(F0)} + ${n(p * t, 2)} = ${n(V, 2)}, o valor pago.`,
  };
});

/* ---------- S04-4 · D07 · colaterais internos ---------- */
def("S04-4", "D07", "N3", (r) => {
  const [p, q] = r.um([[3, 2], [2, 3], [4, 2], [3, 1], [4, 1], [5, 1], [2, 1], [3, 3], [4, 5], [5, 4], [7, 5], [5, 7], [3, 6]]);
  const s = p + q;
  exigir(180 % s === 0 && p !== q);
  const c1 = r.int(1, 30);
  const possiveis = [];
  for (let c = 1; c <= 45; c++) if ((c1 + c) % s === 0 && (c - c1) % (p - q) === 0 && c !== c1) possiveis.push(c);
  exigir(possiveis.length > 0);
  const c2 = r.um(possiveis);
  const x = (180 - c1 - c2) / s, ang = (k) => p * k + c1;
  const xIg = (c2 - c1) / (p - q), xSem = 180 / s, xSin = (180 + c1 + c2) / s;
  exigir(x > 0 && xIg > 0 && ang(xIg) > 0 && ang(x) > 95 && ang(x) < 160);
  const r1 = `(${expr([[p, "x"], [c1, ""]])})°`, r2 = `(${expr([[q, "x"], [c2, ""]])})°`;
  const outro = q * x + c2;
  const ctx = r.um([["Duas ripas horizontais, r e s, de um portão de madeira são paralelas. Uma terceira ripa, t, cruza as duas", "ripa"], ["Duas linhas de uma quadra, r e s, são paralelas. Uma terceira linha, t, cruza as duas", "linha"], ["Os trilhos r e s de uma linha de trem são paralelos. Uma viga reta, t, cruza os dois", "viga"]]);
  return {
    short: "Ângulos colaterais internos entre paralelas",
    stem: [`${ctx[0]} e forma os ângulos indicados na figura, medidos em graus.`],
    figure: fig(F.paralelasColaterais({ rot1: r1, rot2: r2 }), `Duas retas horizontais paralelas, r em cima e s embaixo, cortadas por uma transversal t. Entre as paralelas, do mesmo lado da transversal, estão os ângulos ${r1}, junto à reta r, e ${r2}, junto à reta s.`),
    ask: `Qual é a medida, em graus, do ângulo indicado por ${r1}?`,
    options: numericas([
      [ang(xIg), `Supôs os ângulos iguais (x = ${n(xIg)}), como se fossem alternos ou correspondentes. Colaterais internos somam 180°.`],
      [outro, `Resolveu certo (x = ${x}), mas respondeu a medida do outro ângulo, ${r2}.`],
      [ang(x), `Acerto. Colaterais internos somam 180°: ${p + q}x + ${c1 + c2} = 180, x = ${x} e ${p} · ${x} + ${c1} = ${ang(x)}°.`],
      [ang(xSem), `Ignorou os números ${c1} e ${c2}: fez ${s}x = 180 (x = ${n(xSem)}).`],
      [ang(xSin), `Passou o ${c1 + c2} para o outro lado sem trocar o sinal: ${s}x = 180 + ${c1 + c2}.`],
      [x, `Achou x = ${x} e parou. A pergunta pede a medida do ângulo: ${p} · ${x} + ${c1}.`],
    ], ang(x), undefined, r),
    resolution: [`Os dois ângulos estão entre as paralelas e do mesmo lado da transversal: são colaterais internos e somam 180°.`, `${r1.slice(1, -2)} + ${r2.slice(1, -2)} = 180, então ${s}x + ${c1 + c2} = 180, ${s}x = ${180 - c1 - c2} e x = ${x}.`, `O ângulo pedido mede ${p} · ${x} + ${c1} = ${ang(x)}°.`],
    check: `O outro ângulo mede ${q === 1 ? "" : `${q} · `}${x} + ${c2} = ${outro}°, e ${ang(x)}° + ${outro}° = 180°.`,
  };
});

/* ---------- S04-5 · D11 · imagem de uma função num gráfico ---------- */
def("S04-5", "D11", "N3", (r) => {
  const ctx = r.um([
    { txt: "Um reservatório com {V} litros de água começou a ser esvaziado por um ralo, com vazão constante. O gráfico mostra o volume V de água, em litros, em função do tempo t, em minutos, desde a abertura do ralo até o reservatório ficar vazio.", y: "V", x: "t", V: [300, 400, 500, 600, 800, 900, 1000, 1200], T: [20, 25, 30, 40, 50, 60], uy: "litros", ux: "minutos" },
    { txt: "A bateria de um celular estava com {V}% de carga e foi descarregando de forma constante. O gráfico mostra a carga C, em porcentagem, em função do tempo h, em horas, até a bateria acabar.", y: "C", x: "h", V: [80, 90, 100], T: [8, 10, 12, 16, 20], uy: "%", ux: "horas" },
  ]);
  const V = r.um(ctx.V), T = r.um(ctx.T);
  exigir(V !== T);
  const { x, y } = ctx;
  const pedeImagem = r.um([true, true, false]);
  const fx = (a) => `0 ≤ ${x} ≤ ${a}`, fy = (a) => `0 ≤ ${y} ≤ ${a}`;
  const figura = F.plano({
    xmin: 0, xmax: T, ymin: 0, ymax: V, escala: { ux: 300 / T, uy: 200 / V }, rotX: `${x} (${ctx.ux})`, rotY: `${y} (${ctx.uy})`,
    rotulosX: [0, T / 2, T], rotulosY: [0, V / 2, V], grade: true,
    desenhar: ({ X, Y }) => F.linha(X(0), Y(V), X(T), Y(0), { cor: "var(--fig-destaque)", w: 3 }) + F.ponto(X(0), Y(V)) + F.ponto(X(T), Y(0)),
  });
  const lista = pedeImagem
    ? [
        { text: fx(T), why: `Indicou o domínio (valores de ${x}, no eixo horizontal) no lugar da imagem.` },
        { text: `0 ≤ ${x} ≤ ${V}`, why: `Misturou os eixos: usou a letra ${x} com o maior valor de ${y}.` },
        { text: `0 ≤ ${y} ≤ ${T}`, why: `Misturou os eixos: usou a letra ${y} com o maior valor de ${x}.` },
        { text: `0 < ${y} < ${V}`, why: "Excluiu os extremos. Os pontos das pontas são bolinhas cheias, então fazem parte do gráfico." },
        { text: fy(V), ok: true, why: `Acerto. A imagem é o conjunto dos valores de ${y} (eixo vertical): de 0 até ${V}, com os extremos.` },
      ]
    : [
        { text: fy(V), why: `Indicou a imagem (valores de ${y}, no eixo vertical) no lugar do domínio.` },
        { text: `0 ≤ ${x} ≤ ${V}`, why: `Misturou os eixos: usou a letra ${x} com o maior valor de ${y}.` },
        { text: `0 ≤ ${y} ≤ ${T}`, why: `Misturou os eixos: usou a letra ${y} com o maior valor de ${x}.` },
        { text: `0 < ${x} < ${T}`, why: "Excluiu os extremos. Os pontos das pontas são bolinhas cheias, então fazem parte do gráfico." },
        { text: fx(T), ok: true, why: `Acerto. O domínio é o conjunto dos valores de ${x} (eixo horizontal): de 0 até ${T}, com os extremos.` },
      ];
  return {
    short: pedeImagem ? "Imagem de uma função em um gráfico" : "Domínio de uma função em um gráfico",
    stem: [ctx.txt.replace("{V}", V)],
    figure: fig(figura, `Gráfico de uma reta decrescente que liga o ponto (0; ${V}) ao ponto (${T}; 0), ambos com bolinha cheia. Eixo horizontal: ${x}, de 0 a ${T}. Eixo vertical: ${y}, de 0 a ${V}.`),
    ask: `Qual é o ${pedeImagem ? "conjunto imagem" : "domínio"} dessa função?`,
    options: textuais(r, lista),
    resolution: [`O domínio reúne os valores do eixo horizontal (${x}), e a imagem, os do eixo vertical (${y}).`, `O gráfico vai de ${x} = 0 a ${x} = ${T} e, no eixo vertical, de ${y} = ${V} até ${y} = 0, passando por todos os valores entre eles.`, pedeImagem ? `Imagem: ${fy(V)}.` : `Domínio: ${fx(T)}.`],
    check: pedeImagem ? `No mesmo gráfico, o domínio seria ${fx(T)}. Quem responde isso leu o eixo errado.` : `No mesmo gráfico, a imagem seria ${fy(V)}. Quem responde isso leu o eixo errado.`,
  };
});

/* ---------- S04-6 · D09 · área que sobrou da chapa ---------- */
def("S04-6", "D09", "N4", (r) => {
  const k = r.int(2, 9), j = r.int(2, 9);
  exigir(k !== j);
  const ctx = r.um([["Uma chapa metálica quadrada", "chapa"], ["Uma folha de papelão quadrada", "folha"], ["Uma placa de madeira quadrada", "placa"]]);
  const A = `${k}a`, B = `${j}b`;
  const av = 2, bv = 1;
  const resto = (k * av) ** 2 - (j * bv) ** 2;
  exigir(resto > 0);
  return {
    short: "Diferença de quadrados (área restante)",
    stem: [`${ctx[0]} tem lados de ${A} centímetros. De um dos cantos foi cortado um pedaço quadrado de lado ${B} centímetros, como mostra a figura (com ${B} menor que ${A}).`],
    figure: fig(F.quadradoComRecorte({ ladoGrande: A, ladoPequeno: B, canto: true }), `Quadrado de lado ${A} com um quadrado menor, de lado ${B}, recortado do canto de cima à direita, desenhado com linha tracejada.`),
    ask: `Qual expressão fatorada representa a área, em centímetros quadrados, da parte que sobrou da ${ctx[1]}?`,
    options: textuais(r, [
      { text: `(${A} ${M} ${B})²`, why: "Confundiu a² − b² com (a − b)². A diferença de quadrados não é o quadrado da diferença." },
      { text: `(${A} ${M} ${B})(${A} + ${B})`, ok: true, why: `Acerto. (${A})² ${M} (${B})² = ${k * k}a² ${M} ${j * j}b² = (${A} ${M} ${B})(${A} + ${B}).` },
      { text: `(${A} + ${B})²`, why: "Usou o quadrado da soma. O pedaço cortado é subtraído, não somado." },
      { text: `(${k * k}a ${M} ${j * j}b)(${k * k}a + ${j * j}b)`, why: `Usou ${k * k}a e ${j * j}b, que vêm das áreas, em vez das raízes ${A} e ${B}.` },
      { text: `${A} ${M} ${B}`, why: "Subtraiu os lados. Isso é um comprimento, e a pergunta pede uma área." },
    ]),
    resolution: [`Área da ${ctx[1]} inteira: (${A})² = ${k * k}a². Área do pedaço cortado: (${B})² = ${j * j}b².`, `Sobrou ${k * k}a² ${M} ${j * j}b², uma diferença de quadrados.`, `Fatorando: (${A} ${M} ${B})(${A} + ${B}).`],
    check: `Testando a = ${av} e b = ${bv}: ${(k * av) ** 2} ${M} ${(j * bv) ** 2} = ${resto}. Pela forma fatorada: (${k * av} ${M} ${j * bv})(${k * av} + ${j * bv}) = ${k * av - j * bv} × ${k * av + j * bv} = ${resto}. Confere.`,
  };
});
