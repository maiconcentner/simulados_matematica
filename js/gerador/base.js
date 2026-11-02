// Ferramentas comuns do gerador de simulados: sorteio com semente,
// formatação de números em português e montagem das alternativas.

export const M = "−"; // sinal de menos tipográfico
export const NB = " "; // espaço que não quebra

/** Erro usado para pedir um novo sorteio (alternativas repetidas, números feios...). */
export class Repetir extends Error {
  constructor(msg = "repetir") { super(msg); this.name = "Repetir"; }
}

export function exigir(cond, msg = "condição") {
  if (!cond) throw new Repetir(msg);
}

/** Sorteador com semente (mulberry32): a mesma semente gera o mesmo simulado. */
export function criarSorteio(semente) {
  let a = (semente >>> 0) || 1;
  const prox = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    real: prox,
    /** inteiro de a até b, inclusive */
    int: (min, max) => min + Math.floor(prox() * (max - min + 1)),
    /** inteiro de a até b, de passo em passo */
    passo: (min, max, p) => min + p * Math.floor(prox() * (Math.floor((max - min) / p) + 1)),
    um: (lista) => lista[Math.floor(prox() * lista.length)],
    moeda: () => prox() < 0.5,
    embaralhar: (lista) => {
      const c = lista.slice();
      for (let i = c.length - 1; i > 0; i--) {
        const j = Math.floor(prox() * (i + 1));
        [c[i], c[j]] = [c[j], c[i]];
      }
      return c;
    },
    /** k elementos diferentes da lista */
    alguns: (lista, k) => r.embaralhar(lista).slice(0, k),
  };
  return r;
}

export function novaSemente() {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] || 1;
  } catch {
    return (Date.now() ^ Math.floor(Math.random() * 4294967295)) >>> 0;
  }
}

/** Arredonda sem lixo de ponto flutuante. */
export function arred(v, casas = 6) {
  const f = 10 ** casas;
  return Math.round((v + Number.EPSILON * Math.sign(v)) * f) / f;
}

export function ehInteiro(v) {
  return Math.abs(v - Math.round(v)) < 1e-9;
}

function milhar(inteiro) {
  // "1 152", "5 306": espaço a partir de 1 000, como nos simulados.
  return inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Número em português: vírgula decimal, menos tipográfico e espaço de milhar.
 * casas = undefined: até 2 casas, sem zeros sobrando. casas = n: exatamente n casas.
 */
export function n(v, casas) {
  if (!Number.isFinite(v)) throw new Repetir("número inválido");
  let s;
  if (casas === undefined) {
    s = String(arred(v, 2));
    if (s.includes("e")) s = arred(v, 2).toFixed(2);
  } else {
    s = arred(v, casas).toFixed(casas);
  }
  let neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  let [int, dec] = s.split(".");
  if (casas === undefined && dec) dec = dec.replace(/0+$/, "");
  if (/^0*$/.test(int + (dec || ""))) neg = false;
  return (neg ? M : "") + milhar(int) + (dec ? "," + dec : "");
}

/** Número com até k casas, sem zeros sobrando: nAte(0.9375, 4) = "0,9375". */
export function nAte(v, k) {
  return n(arred(v, k), k).replace(/(,\d*?)0+$/, "$1").replace(/,$/, "");
}

/** Número entre parênteses quando negativo: "(−2)". */
export const par = (v) => (v < 0 ? `(${n(v)})` : n(v));

/** Valor em reais: "R$ 1 234,50". */
export const rs = (v) => `R$${NB}${n(v, 2)}`;

/** Percentual: "35%". */
export const pct = (v) => `${n(v)}%`;

/** Coeficiente na frente de uma letra: 1 → "", −1 → "−", 3 → "3". */
function coef(a, letra) {
  if (a === 1) return letra;
  if (a === -1) return M + letra;
  return n(a) + letra;
}

/**
 * Expressão ax + b escrita do jeito do caderno: "3x − 4", "−2x + 5", "x", "5".
 * termos: lista de [coeficiente, letra]; letra "" é o termo independente.
 */
export function expr(termos) {
  let s = "";
  for (const [c, letra] of termos) {
    if (c === 0) continue;
    const t = letra ? coef(Math.abs(c), letra) : n(Math.abs(c));
    if (!s) s = (c < 0 ? M : "") + t;
    else s += (c < 0 ? ` ${M} ` : " + ") + t;
  }
  return s || "0";
}
export const lin = (a, b, x = "x") => expr([[a, x], [b, ""]]);

/** Fração em texto, simplificada: "3/4". */
export function mdc(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function maiuscula(t) {
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const LETRAS = ["A", "B", "C", "D", "E"];

function conferir(ops) {
  exigir(ops.length === 5, "precisa de 5 alternativas");
  const textos = new Set(ops.map((o) => o.text));
  exigir(textos.size === 5, "alternativas repetidas");
  exigir(ops.filter((o) => o.correct).length === 1, "uma correta");
  for (const o of ops) {
    exigir(o.text && !/NaN|undefined|Infinity/.test(o.text + o.why), "texto inválido");
  }
}

/**
 * Alternativas numéricas: lista de [valor, why], com a correta marcada por valor.
 * Ficam em ordem crescente, como nos simulados.
 * Com mais de 4 erros na lista, o sorteio r escolhe 4, para a correta mudar de letra.
 */
export function numericas(lista, certo, fmt = (v) => n(v), r = null) {
  if (lista.length > 5) {
    if (!r) throw new Error("numericas: lista com mais de 5 itens precisa do sorteio");
    const ok = lista.filter(([v]) => Math.abs(arred(v) - certo) < 1e-9);
    const erros = lista.filter(([v]) => Math.abs(arred(v) - certo) >= 1e-9);
    exigir(ok.length === 1, "correta repetida");
    lista = [ok[0], ...r.alguns(erros, 4)];
  }
  const ops = lista
    .map(([v, why]) => ({ v: arred(v), why }))
    .sort((a, b) => a.v - b.v)
    .map((o, i) => ({
      letter: LETRAS[i],
      text: fmt(o.v),
      value: o.v,
      correct: Math.abs(o.v - certo) < 1e-9,
      why: o.why,
    }));
  conferir(ops);
  return ops;
}

/**
 * Alternativas de texto: lista de {text, ok, why}. Embaralhadas pelo sorteio,
 * a menos que fixa = true (quando a ordem tem sentido).
 */
export function textuais(r, lista, fixa = false) {
  const ordem = fixa ? lista : r.embaralhar(lista);
  const ops = ordem.map((o, i) => ({
    letter: LETRAS[i],
    text: o.text,
    correct: !!o.ok,
    why: o.why,
  }));
  conferir(ops);
  return ops;
}

/** Letra da alternativa correta. */
export function chave(ops) {
  return ops.find((o) => o.correct).letter;
}

/** Confere um item gerado. Devolve a lista de problemas (vazia se está tudo certo). */
export function problemasDoItem(it) {
  const p = [];
  for (const k of ["code", "level", "stem", "ask", "options", "key", "resolution", "short"]) {
    if (it[k] === undefined || it[k] === null) p.push(`falta ${k}`);
  }
  const ops = it.options || [];
  if (ops.map((o) => o.letter).join("") !== "ABCDE") p.push("letras fora de ordem");
  const certas = ops.filter((o) => o.correct);
  if (certas.length !== 1) p.push(`${certas.length} corretas`);
  else if (certas[0].letter !== it.key) p.push("key diferente da correta");
  if (new Set(ops.map((o) => o.text)).size !== ops.length) p.push("alternativas repetidas");
  const tudo = JSON.stringify(it);
  if (/NaN|undefined|Infinity/.test(tudo)) p.push("texto com NaN/undefined");
  if (tudo.includes("\u2014")) p.push("travessão");
  if (ops.some((o) => !o.why)) p.push("alternativa sem why");
  if (it.figure && !it.figure.alt) p.push("figura sem alt");
  return p;
}
