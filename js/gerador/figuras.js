// Figuras das questões geradas, desenhadas em SVG.
// As cores vêm das variáveis --fig-* do CSS, então funcionam no tema claro e no escuro.
import { n, M } from "./base.js?v=57517fb455";

const T = "var(--fig-tinta)"; // traço principal
const D = "var(--fig-destaque)"; // destaque (medida pedida, raio de luz)
const P = "var(--fig-preenche)"; // preenchimento suave
const P2 = "var(--fig-preenche-2)"; // segundo preenchimento
const G = "var(--fig-grade)"; // grade do plano cartesiano

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const r1 = (v) => Math.round(v * 10) / 10;

export function svg(w, h, corpo) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="fig-svg" aria-hidden="true" font-family="inherit">${corpo}</svg>`;
}
export function linha(x1, y1, x2, y2, { cor = T, w = 2, tracejada = false } = {}) {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${cor}" stroke-width="${w}" stroke-linecap="round"${tracejada ? ' stroke-dasharray="6 5"' : ""}/>`;
}
export function poli(pts, { cor = T, fundo = "none", w = 2, fechar = true, tracejada = false } = {}) {
  const d = pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(" ");
  const tag = fechar ? "polygon" : "polyline";
  return `<${tag} points="${d}" fill="${fundo}" stroke="${cor}" stroke-width="${w}" stroke-linejoin="round"${tracejada ? ' stroke-dasharray="6 5"' : ""}/>`;
}
export function texto(x, y, t, { cor = T, tam = 15, ancora = "middle", peso = 600, base = "middle", girar = 0, halo = false } = {}) {
  const g = (girar ? ` transform="rotate(${girar} ${r1(x)} ${r1(y)})"` : "") + (halo ? ' paint-order="stroke" stroke="var(--fig-fundo)" stroke-width="4" stroke-linejoin="round"' : "");
  return `<text${g} x="${r1(x)}" y="${r1(y)}" fill="${cor}" font-size="${tam}" font-weight="${peso}" text-anchor="${ancora}" dominant-baseline="${base}">${esc(t)}</text>`;
}
export function ponto(x, y, cor = D, raio = 4.5) {
  return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${raio}" fill="${cor}"/>`;
}
/** marca de ângulo reto no vértice v, com lados na direção de a e b */
export function anguloReto(v, a, b, tam = 12) {
  const u = (p) => {
    const dx = p[0] - v[0], dy = p[1] - v[1], L = Math.hypot(dx, dy);
    return [dx / L, dy / L];
  };
  const [ux, uy] = u(a), [wx, wy] = u(b);
  const p1 = [v[0] + ux * tam, v[1] + uy * tam];
  const p2 = [v[0] + (ux + wx) * tam, v[1] + (uy + wy) * tam];
  const p3 = [v[0] + wx * tam, v[1] + wy * tam];
  return poli([p1, p2, p3], { fechar: false, w: 1.5 });
}
/** cota: segmento com setinhas nas pontas e rótulo no meio, deslocado */
export function cota(x1, y1, x2, y2, rotulo, { dx = 0, dy = 0, cor = T, tam = 15 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const seta = (x, y, ang) => {
    const s = 7;
    return poli([[x, y], [x - s * Math.cos(ang - 0.4), y - s * Math.sin(ang - 0.4)], [x - s * Math.cos(ang + 0.4), y - s * Math.sin(ang + 0.4)]], { cor, fundo: cor, w: 1 });
  };
  return (
    linha(x1, y1, x2, y2, { cor, w: 1.4 }) +
    seta(x2, y2, a) + seta(x1, y1, a + Math.PI) +
    texto((x1 + x2) / 2 + dx, (y1 + y2) / 2 + dy, rotulo, { cor, tam })
  );
}

/* ---------- gráfico de barras ---------- */
export function barras(rotulos, valores, { titulo = "", eixo = "" } = {}) {
  const W = 460, H = 300, x0 = 54, y0 = 250, alt = 200;
  const max = Math.max(...valores);
  const passo = max <= 60 ? 10 : max <= 120 ? 20 : max <= 300 ? 50 : 100;
  const topo = Math.ceil(max / passo) * passo;
  const larg = (W - x0 - 20) / valores.length;
  let s = "";
  for (let v = 0; v <= topo; v += passo) {
    const y = y0 - (v / topo) * alt;
    s += linha(x0, y, W - 10, y, { cor: G, w: 1 }) + texto(x0 - 8, y, n(v), { ancora: "end", tam: 12, peso: 500 });
  }
  valores.forEach((v, i) => {
    const h = (v / topo) * alt, x = x0 + i * larg + larg * 0.18, w = larg * 0.64;
    s += `<rect x="${r1(x)}" y="${r1(y0 - h)}" width="${r1(w)}" height="${r1(h)}" rx="3" fill="${D}" opacity="0.85"/>`;
    s += texto(x + w / 2, y0 - h - 10, n(v), { tam: 14 });
    const linhas = rotulos[i].split("\n");
    linhas.forEach((l, k) => { s += texto(x + w / 2, y0 + 16 + k * 15, l, { tam: 12, peso: 500 }); });
  });
  s += linha(x0, y0, W - 10, y0) + linha(x0, y0, x0, y0 - alt - 8);
  if (eixo) s += texto(14, y0 - alt / 2, eixo, { tam: 12, peso: 500, girar: -90 });
  if (titulo) s += texto(W / 2, 14, titulo, { tam: 13 });
  return svg(W, H, s);
}

/* ---------- plano cartesiano ---------- */
export function plano({ xmin, xmax, ymin, ymax, passoX = 1, passoY = 1, rotX = "x", rotY = "y", escala, desenhar, rotulosX, rotulosY, grade = true }) {
  const larguraUtil = 340;
  const ux = escala?.ux ?? larguraUtil / (xmax - xmin);
  const uy = escala?.uy ?? ux;
  const mx = 46, my = 26;
  const W = mx + (xmax - xmin) * ux + 34, H = my + (ymax - ymin) * uy + 56;
  const X = (x) => mx + (x - xmin) * ux;
  const Y = (y) => my + (ymax - y) * uy;
  let s = "";
  const xs = rotulosX ?? [];
  const ys = rotulosY ?? [];
  if (!rotulosX) for (let v = xmin; v <= xmax + 1e-9; v += passoX) xs.push(v);
  if (!rotulosY) for (let v = ymin; v <= ymax + 1e-9; v += passoY) ys.push(v);
  if (grade) {
    xs.forEach((v) => { s += linha(X(v), Y(ymin), X(v), Y(ymax), { cor: G, w: 1 }); });
    ys.forEach((v) => { s += linha(X(xmin), Y(v), X(xmax), Y(v), { cor: G, w: 1 }); });
  }
  const ex = ymin <= 0 && ymax >= 0 ? 0 : ymin; // eixo x na altura y = 0 se couber
  const ey = xmin <= 0 && xmax >= 0 ? 0 : xmin;
  s += linha(X(xmin) - 6, Y(ex), X(xmax) + 14, Y(ex), { w: 1.6 }) + linha(X(ey), Y(ymin) + 6, X(ey), Y(ymax) - 14, { w: 1.6 });
  s += (rotX.length > 2 ? texto(X(xmax) + 20, Y(ymin) + 38, rotX, { tam: 14, ancora: "end" }) : texto(X(xmax) + 20, Y(ex) - 10, rotX, { tam: 14, ancora: "end" })) + texto(X(ey) + 8, Y(ymax) - 16, rotY, { tam: 14, ancora: "start" });
  xs.forEach((v) => { s += texto(X(v) + (v === 0 && ey === 0 ? -8 : 0), Y(ex) + 15, n(v), { tam: 12, peso: 500 }); });
  ys.forEach((v) => { if (!(v === 0 && ex === 0 && ey === 0)) s += texto(X(ey) - 7, Y(v), n(v), { tam: 12, peso: 500, ancora: "end" }); });
  s += desenhar({ X, Y });
  return svg(W, H, s);
}

/** triângulo retângulo com ângulo reto embaixo à direita (drone, rampa) */
export function trianguloRetangulo({ base, altura, hip, proporcao = 0.75 }) {
  const W = 360, H = 250;
  const L = 250, A = Math.min(190, L * proporcao);
  const a = [50, 215], b = [50 + L, 215], c = [50 + L, 215 - A];
  let s = poli([a, b, c], { fundo: P });
  s += anguloReto(b, a, c);
  s += texto((a[0] + b[0]) / 2, 236, base);
  s += texto(b[0] + 12, (b[1] + c[1]) / 2, altura, { ancora: "start", cor: altura.includes("?") || altura.length <= 2 ? D : T });
  s += texto((a[0] + c[0]) / 2 - 16, (a[1] + c[1]) / 2 - 14, hip, { ancora: "end" });
  return svg(W, H, s);
}

/** quadrado com rótulo no lado e, opcionalmente, texto no meio */
export function quadradoRotulado({ lado = "", meio = "" }) {
  const s =
    `<rect x="70" y="20" width="200" height="200" rx="2" fill="${P}" stroke="${T}" stroke-width="2"/>` +
    (lado ? texto(170, 238, lado) + texto(52, 120, lado, { girar: -90 }) : "") +
    (meio ? texto(170, 120, meio, { tam: 18 }) : "");
  return svg(340, 250, s);
}

/** quadrado grande com quadrado menor no centro ou no canto */
export function quadradoComRecorte({ ladoGrande, ladoPequeno, canto = false }) {
  const g = 200, p = 80, x0 = 60, y0 = 20;
  const px = canto ? x0 + g - p : x0 + (g - p) / 2, py = canto ? y0 : y0 + (g - p) / 2;
  let s = `<rect x="${x0}" y="${y0}" width="${g}" height="${g}" fill="${P}" stroke="${T}" stroke-width="2"/>`;
  s += `<rect x="${px}" y="${py}" width="${p}" height="${p}" fill="${canto ? "var(--fig-fundo)" : P2}" stroke="${canto ? D : T}" stroke-width="2"${canto ? ' stroke-dasharray="6 5"' : ""}/>`;
  s += texto(x0 + g / 2, y0 + g + 18, ladoGrande);
  s += texto(px + p / 2, canto ? py + p + 16 : py + p + 14, ladoPequeno, { cor: canto ? D : T, tam: 14 });
  return svg(330, 250, s);
}

/** triângulo com ângulo reto no topo e a altura dividindo a base (telhado, barraca) */
export function trianguloAlturaBase({ m, nn, rotM, rotN, rotuloTopo = "" }) {
  const W = 400, H = 230, base = 300;
  const tot = m + nn, x0 = 50, y0 = 190;
  const xp = x0 + (m / tot) * base;
  const h = Math.sqrt(m * nn) / tot * base;
  const a = [x0, y0], b = [x0 + base, y0], c = [xp, y0 - h];
  let s = poli([a, b, c], { fundo: P });
  s += linha(c[0], c[1], xp, y0, { tracejada: true, w: 1.6 });
  s += anguloReto(c, a, b, 11) + anguloReto([xp, y0], a, c, 9);
  s += texto((x0 + xp) / 2, y0 + 18, rotM) + texto((xp + b[0]) / 2, y0 + 18, rotN);
  if (rotuloTopo) s += texto(c[0], c[1] - 12, rotuloTopo, { tam: 13 });
  return svg(W, H, s);
}

/** dois triângulos com os mesmos ângulos, tamanhos diferentes */
export function doisTriangulos({ a1, a2, rot1 = "A", rot2 = "B" }) {
  const rad = (g) => (g * Math.PI) / 180;
  const tri = (x0, y0, L) => {
    // base L, ângulo a1 na esquerda e a2 na direita
    const t1 = Math.tan(rad(a1)), t2 = Math.tan(rad(a2));
    const xc = (L * t2) / (t1 + t2), yc = xc * t1;
    return [[x0, y0], [x0 + L, y0], [x0 + xc, y0 - yc]];
  };
  const p = tri(20, 190, 120), g = tri(175, 190, 200);
  const marcas = (t, k) =>
    texto(t[0][0] + 26 * k, t[0][1] - 9, `${a1}°`, { tam: 12 + k }) +
    texto(t[1][0] - 26 * k, t[1][1] - 9, `${a2}°`, { tam: 12 + k });
  let s = poli(p, { fundo: P }) + poli(g, { fundo: P2 });
  s += marcas(p, 1) + marcas(g, 1.15);
  s += texto((p[0][0] + p[1][0]) / 2, 208, rot1) + texto((g[0][0] + g[1][0]) / 2, 208, rot2);
  const H = 220;
  const topo = Math.min(p[2][1], g[2][1]);
  return svg(395, H, s).replace(`viewBox="0 0 395 ${H}"`, `viewBox="0 ${Math.floor(Math.min(0, topo - 14))} 395 ${H - Math.floor(Math.min(0, topo - 14))}"`);
}

/** duas paralelas cortadas por uma transversal, com dois ângulos colaterais internos */
export function paralelasColaterais({ rot1, rot2 }) {
  const W = 380, H = 220;
  let s = linha(20, 60, 360, 60) + linha(20, 160, 360, 160);
  s += linha(120, 210, 260, 10, { cor: D });
  s += texto(352, 46, "r", { tam: 15 }) + texto(352, 146, "s", { tam: 15 }) + texto(268, 18, "t", { tam: 15, cor: D });
  // pontos de corte
  const xr = 120 + (210 - 60) * (140 / 200), xs = 120 + (210 - 160) * (140 / 200);
  s += `<path d="M ${xr + 22} 60 A 22 22 0 0 1 ${xr - 12.6} 78" fill="none" stroke="${T}" stroke-width="1.5"/>`;
  s += `<path d="M ${xs + 22} 160 A 22 22 0 0 0 ${xs + 12.6} 142" fill="none" stroke="${T}" stroke-width="1.5"/>`;
  s += texto(xr + 6, 92, rot1, { tam: 14, ancora: "start" });
  s += texto(xs + 30, 136, rot2, { tam: 14, ancora: "start" });
  return svg(W, H, s);
}

/** jardim em L: retângulo L1 × A1 sem o canto de cima à direita */
export function jardimL({ larg, alt, cima, baixoDir }) {
  const k = Math.min(280 / larg, 190 / alt);
  const x0 = 50, y0 = 20 + alt * k;
  const P1 = [x0, y0], P2_ = [x0 + larg * k, y0], P3 = [x0 + larg * k, y0 - baixoDir * k];
  const P4 = [x0 + cima * k, y0 - baixoDir * k], P5 = [x0 + cima * k, y0 - alt * k], P6 = [x0, y0 - alt * k];
  let s = poli([P1, P2_, P3, P4, P5, P6], { fundo: P });
  s += texto((P1[0] + P2_[0]) / 2, y0 + 18, `${n(larg)} m`);
  s += texto(x0 - 10, y0 - (alt * k) / 2, `${n(alt)} m`, { ancora: "end" });
  s += texto((P5[0] + P6[0]) / 2, P6[1] - 12, `${n(cima)} m`);
  s += texto(P2_[0] + 10, (P2_[1] + P3[1]) / 2, `${n(baixoDir)} m`, { ancora: "start" });
  return svg(x0 + larg * k + 70, y0 + 34, s);
}

/** Tales: três paralelas horizontais e duas transversais */
export function tales({ a1, a2, rotA1, rotA2, rotB }) {
  const W = 400, H = 250;
  const tot = a1 + a2;
  const y1 = 40, y3 = 210, y2 = y1 + ((y3 - y1) * a1) / tot;
  let s = "";
  [["Rua 1", y1], ["Rua 2", y2], ["Rua 3", y3]].forEach(([r, y]) => {
    s += linha(20, y, 380, y) + texto(24, y - 9, r, { ancora: "start", tam: 12, peso: 500 });
  });
  s += linha(110, 18, 110, 232, { cor: D }) + texto(110, 244, "Av. A", { tam: 12, cor: D });
  const bx = (y) => 220 + (y - 18) * 0.55;
  s += linha(bx(18), 18, bx(232), 232, { cor: D }) + texto(bx(232) + 4, 244, "Av. B", { tam: 12, cor: D });
  s += texto(118, (y1 + y2) / 2, rotA1, { ancora: "start", tam: 14 }) + texto(118, (y2 + y3) / 2, rotA2, { ancora: "start", tam: 14 });
  s += texto(bx((y1 + y3) / 2) + 14, (y1 + y3) / 2, rotB, { ancora: "start", tam: 14 });
  return svg(W, H, s);
}

/* ---------- cubos em perspectiva ---------- */
function cuboEm(x, y, z, s, ox, oy) {
  // projeção cavaleira: x para a direita, y para trás (sobe e vai à direita), z para cima
  const k = 0.5;
  const X = (a, b) => ox + a * s + b * s * k;
  const Y = (b, c) => oy - c * s - b * s * k;
  const f = [[X(x, y), Y(y, z)], [X(x + 1, y), Y(y, z)], [X(x + 1, y), Y(y, z + 1)], [X(x, y), Y(y, z + 1)]];
  const t = [[X(x, y), Y(y, z + 1)], [X(x + 1, y), Y(y, z + 1)], [X(x + 1, y + 1), Y(y + 1, z + 1)], [X(x, y + 1), Y(y + 1, z + 1)]];
  const l = [[X(x + 1, y), Y(y, z)], [X(x + 1, y + 1), Y(y + 1, z)], [X(x + 1, y + 1), Y(y + 1, z + 1)], [X(x + 1, y), Y(y, z + 1)]];
  return poli(f, { fundo: "var(--fig-cubo-frente)", w: 1.5 }) + poli(t, { fundo: "var(--fig-cubo-topo)", w: 1.5 }) + poli(l, { fundo: "var(--fig-cubo-lado)", w: 1.5 });
}
/** alturas[y][x]: y = 0 é a fileira da frente */
export function pilhaDeCubos(alturas, { s = 38, seta = false } = {}) {
  const prof = alturas.length, larg = alturas[0].length;
  const hmax = Math.max(...alturas.flat());
  const ox = 30, oy = 30 + hmax * s + prof * s * 0.5;
  let c = "";
  for (let y = prof - 1; y >= 0; y--)
    for (let x = 0; x < larg; x++)
      for (let z = 0; z < alturas[y][x]; z++) c += cuboEm(x, y, z, s, ox, oy);
  let W = ox + larg * s + prof * s * 0.5 + 20, H = oy + 20;
  if (seta) {
    const cx = ox + (larg * s) / 2;
    c += linha(cx, oy + 40, cx, oy + 12, { cor: D, w: 3 }) + poli([[cx, oy + 6], [cx - 7, oy + 18], [cx + 7, oy + 18]], { cor: D, fundo: D, w: 1 });
    c += texto(cx + 12, oy + 34, "frente", { ancora: "start", tam: 12, cor: D });
    H = oy + 48;
  }
  return { corpo: c, W, H };
}
/** grade de quadrados para as vistas: celulas = lista de [coluna, linha de baixo para cima] */
export function grade(celulas, { s = 22, ox = 0, oy = 0 } = {}) {
  const lmax = Math.max(...celulas.map((c) => c[1])) + 1;
  return celulas.map(([c, l]) => `<rect x="${ox + c * s}" y="${oy + (lmax - 1 - l) * s}" width="${s}" height="${s}" fill="${P}" stroke="${T}" stroke-width="1.5"/>`).join("");
}

/* ---------- cenas ---------- */
export function cilindro({ diam, alt }) {
  const cx = 150, rx = 70, ry = 20, y0 = 40, h = 170;
  let s = `<path d="M ${cx - rx} ${y0} L ${cx - rx} ${y0 + h} A ${rx} ${ry} 0 0 0 ${cx + rx} ${y0 + h} L ${cx + rx} ${y0}" fill="${P}" stroke="${T}" stroke-width="2"/>`;
  s += `<ellipse cx="${cx}" cy="${y0}" rx="${rx}" ry="${ry}" fill="${P2}" stroke="${T}" stroke-width="2"/>`;
  s += linha(cx - rx, y0, cx + rx, y0, { cor: D, w: 2 }) + ponto(cx, y0, D, 3);
  s += texto(cx, y0 - 30, diam, { cor: D });
  s += cota(cx + rx + 28, y0 + h, cx + rx + 28, y0, "", {}) + texto(cx + rx + 38, y0 + h / 2, alt, { ancora: "start" });
  return svg(330, 245, s);
}
export function escada({ comp, antes, depois }) {
  // parede à esquerda, chão embaixo; antes (tracejada) e depois (contínua)
  const k = 190 / comp, x0 = 60, y0 = 220;
  const hA = Math.sqrt(comp ** 2 - antes ** 2) * k, hD = Math.sqrt(comp ** 2 - depois ** 2) * k;
  let s = `<rect x="${x0 - 14}" y="20" width="14" height="${y0 - 20}" fill="${P2}" stroke="${T}" stroke-width="1.5"/>`;
  s += linha(x0 - 14, y0, x0 + depois * k + 60, y0);
  s += anguloReto([x0, y0], [x0, 0], [400, y0], 10);
  s += linha(x0 + antes * k, y0, x0, y0 - hA, { tracejada: true, w: 2.5 });
  s += linha(x0 + depois * k, y0, x0, y0 - hD, { cor: D, w: 3 });
  s += texto(x0 + (antes * k) / 2, y0 + 16, antes === 0 ? "" : `${n(antes)} m`, { tam: 13 });
  s += texto(x0 + (depois * k) / 2 + 30, y0 + 32, `${n(depois)} m`, { tam: 13, cor: D });
  s += texto(x0 + (depois * k) / 2 + 22, y0 - hD / 2 - 6, `${n(comp)} m`, { ancora: "start", tam: 13, cor: D });
  s += texto(x0 + antes * k + 4, y0 - 10, "antes", { tam: 11, ancora: "start", peso: 500 });
  s += texto(x0 + depois * k + 4, y0 - 10, "depois", { tam: 11, ancora: "start", peso: 500, cor: D });
  return svg(Math.max(330, x0 + depois * k + 80), y0 + 42, s);
}
export function piscina({ comp, larg, raso, fundo }) {
  const k = 260 / comp, kp = 30, ox = 56, oy = 50;
  const dx = 70, dy = -35; // profundidade da perspectiva (largura da piscina)
  const A = [ox, oy], B = [ox + comp * k, oy], C = [ox + comp * k, oy + fundo * kp * 1.6], Dd = [ox, oy + raso * kp * 1.6];
  const desloca = (p) => [p[0] + dx, p[1] + dy];
  let s = poli([A, B, desloca(B), desloca(A)], { fundo: P2 });
  s += poli([B, C, desloca(C), desloca(B)], { fundo: P2 });
  s += poli([A, B, C, Dd], { fundo: P });
  s += texto((A[0] + B[0]) / 2, oy - 10, `${n(comp)} m`, { tam: 13 });
  s += texto(ox - 6, (A[1] + Dd[1]) / 2, `${n(raso)} m`, { ancora: "end", tam: 13 });
  s += texto(C[0] + 8, (B[1] + C[1]) / 2 + 8, `${n(fundo)} m`, { ancora: "start", tam: 13 });
  s += texto(desloca(B)[0] + 8, desloca(B)[1] + 34, `${n(larg)} m`, { ancora: "start", tam: 13 });
  return svg(ox + comp * k + dx + 80, oy + fundo * kp * 1.6 + 20, s);
}
export function poste({ hPoste, hPessoa, dist }) {
  // calcula a sombra só para desenhar a cena em escala
  const somb = (hPessoa * dist) / (hPoste - hPessoa);
  const tot = dist + somb;
  const k = Math.min(300 / tot, 180 / hPoste);
  const x0 = 50, y0 = 215;
  const xp = x0 + dist * k, xs = x0 + tot * k;
  let s = linha(20, y0, xs + 40, y0);
  s += linha(x0, y0, x0, y0 - hPoste * k, { w: 4 }) + ponto(x0, y0 - hPoste * k, "var(--fig-luz)", 7);
  s += linha(xp, y0, xp, y0 - hPessoa * k, { w: 5, cor: "var(--fig-pessoa)" }) + ponto(xp, y0 - hPessoa * k - 5, "var(--fig-pessoa)", 5);
  s += linha(x0, y0 - hPoste * k, xs, y0, { cor: D, tracejada: true, w: 1.8 });
  s += linha(xp, y0, xs, y0, { cor: "var(--fig-sombra)", w: 6 });
  s += texto(x0 - 8, y0 - (hPoste * k) / 2, `${n(hPoste)} m`, { ancora: "end", tam: 13 });
  s += texto(xp + 10, y0 - (hPessoa * k) / 2, `${n(hPessoa)} m`, { ancora: "start", tam: 13 });
  s += texto((x0 + xp) / 2, y0 + 16, `${n(dist)} m`, { tam: 13 });
  s += texto((xp + xs) / 2, y0 + 16, "sombra", { tam: 12, peso: 500 });
  return svg(Math.max(330, xs + 50), y0 + 30, s);
}
export function lanterna({ dBoneco, hBoneco, dParede }) {
  const tot = dBoneco + dParede, hs = (hBoneco * tot) / dBoneco;
  const k = Math.min(290 / tot, 170 / hs);
  const x0 = 40, y0 = 205, xb = x0 + dBoneco * k, xp = x0 + tot * k;
  let s = linha(20, y0, xp + 20, y0);
  s += `<rect x="${xp}" y="${y0 - hs * k - 25}" width="12" height="${hs * k + 25}" fill="${P2}" stroke="${T}" stroke-width="1.5"/>`;
  s += poli([[x0 - 12, y0], [x0 + 4, y0 - 8], [x0 + 4, y0]], { fundo: "var(--fig-luz)", cor: T, w: 1.2 });
  s += linha(xb, y0, xb, y0 - hBoneco * k, { w: 5, cor: "var(--fig-pessoa)" }) + ponto(xb, y0 - hBoneco * k - 5, "var(--fig-pessoa)", 5);
  s += linha(x0 + 4, y0 - 4, xp, y0 - hs * k, { cor: D, tracejada: true, w: 1.8 });
  s += linha(xp, y0, xp, y0 - hs * k, { cor: "var(--fig-sombra)", w: 6 });
  s += texto((x0 + xb) / 2, y0 + 16, `${n(dBoneco)} cm`, { tam: 13 });
  s += texto((xb + xp) / 2, y0 + 16, `${n(dParede)} cm`, { tam: 13 });
  s += texto(xb + 10, y0 - (hBoneco * k) / 2, `${n(hBoneco)} cm`, { ancora: "start", tam: 13 });
  s += texto(xp + 18, y0 - (hs * k) / 2, "sombra", { ancora: "start", tam: 12, peso: 500 });
  return svg(xp + 80, y0 + 30, s);
}

export { M };
