# -*- coding: utf-8 -*-
"""Gera data/prova/E3-AV2.json (simulado da avaliação somativa da Etapa 3, funções) e as figuras das questões 6 e 10.
Itens paralelos aos da avaliação: mesmas habilidades, níveis e pesos, com contextos e números novos."""
import json, os
from fractions import Fraction as Fr
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# grava direto na raiz do repositório (rode: python3 planejamento/fonte/e3_av2.py)
OUT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIG = os.path.join(OUT, "assets", "figuras", "prova", "e3-av2")
os.makedirs(FIG, exist_ok=True); os.makedirs(os.path.join(OUT, "data", "prova"), exist_ok=True)
plt.rcParams["font.family"] = "DejaVu Sans"
NAVY, AZUL, LARANJA = "#12294A", "#2F6DB5", "#C55A11"
H7, H8, H9 = "EF.09.MAT.2.87", "EF.09.MAT.2.88", "EF.09.MAT.2.89"
M = "−"  # sinal de menos tipográfico
def n(v):  # número com vírgula e menos tipográfico
    s = f"{v:g}".replace(".", ",").replace("-", M)
    return s
def op(letter, text, ok, why, value=None):
    return {"letter": letter, "text": text, "value": value, "correct": ok, "why": why}
def numericas(lista, certo):
    """lista de (valor, why); ordena crescente e devolve opções A..E"""
    lista = sorted(lista, key=lambda t: t[0])
    return [op("ABCDE"[i], n(v), v == certo, w, v) for i, (v, w) in enumerate(lista)]

def grade(ax, x0, x1, y0, y1):
    ax.set_xlim(x0 - .5, x1 + .5); ax.set_ylim(y0 - .5, y1 + .5)
    ax.set_xticks(range(x0, x1 + 1)); ax.set_yticks(range(y0, y1 + 1))
    ax.grid(True, color="#D5DCE6", lw=.8); ax.set_aspect("equal")
    for s in ax.spines.values(): s.set_visible(False)
    ax.axhline(0, color=NAVY, lw=1.3, zorder=2); ax.axvline(0, color=NAVY, lw=1.3, zorder=2)
    ax.tick_params(labelsize=11, colors=NAVY, length=0)
    ax.set_xticklabels([n(v) for v in range(x0, x1 + 1)]); ax.set_yticklabels([n(v) for v in range(y0, y1 + 1)])
    ax.annotate("x", (x1 + .5, 0), xytext=(3, 3), textcoords="offset points", fontsize=12, color=NAVY, annotation_clip=False)
    ax.annotate("y", (0, y1 + .5), xytext=(4, 0), textcoords="offset points", fontsize=12, color=NAVY, annotation_clip=False)

itens = []
# ---------- Q1 (N1, 1,5) valor numérico com x negativo ----------
f = lambda x: 3 * x - 4
assert f(-2) == -10
itens.append(dict(n=1, code=H7, role="Avaliação", level="N1", valor=1.5, short="Valor de f(x) para um x negativo",
  descriptor="Calcular o valor de uma função para um x dado.", stem=[f"Considere a função f(x) = 3x {M} 4."], table=None,
  ask=f"Qual é o valor de f({M}2)?",
  options=numericas([(-18, f"Multiplicou o 3 por tudo: 3 · ({M}2 {M} 4) = {M}18. Primeiro troque o x e multiplique: 3 · ({M}2) = {M}6; depois subtraia 4."),
                     (-10, f"Acerto. f({M}2) = 3 · ({M}2) {M} 4 = {M}6 {M} 4 = {M}10."),
                     (-6, f"Esqueceu o {M}4: parou em 3 · ({M}2) = {M}6."),
                     (-2, f"Errou o sinal no fim: {M}6 {M} 4 dá {M}10, não {M}2. Os dois números são negativos, então se somam e o resultado fica negativo."),
                     (2, f"Ignorou o sinal do {M}2: fez 3 · 2 {M} 4 = 2. O número negativo entra entre parênteses.")], -10),
  resolution=[f"Troque o x por {M}2, entre parênteses: f({M}2) = 3 · ({M}2) {M} 4.", f"Multiplique primeiro: 3 · ({M}2) = {M}6.", f"Subtraia: {M}6 {M} 4 = {M}10."],
  check=f"Com x negativo e a = 3 positivo, 3x é negativo; tirando mais 4, o resultado tem de ser menor que {M}6."))
# ---------- Q2 (N1, 1,5) lei com valor fixo + por unidade ----------
itens.append(dict(n=2, code=H8, role="Avaliação", level="N1", valor=1.5, short="Lei de uma situação com valor fixo",
  descriptor="Escrever a lei de uma situação com valor fixo e valor por unidade.",
  stem=["Uma academia cobra R$ 60,00 de matrícula, paga uma vez só, e R$ 85,00 por mês."], table=None,
  ask="Qual lei dá o valor V, em reais, pago por quem fica m meses?",
  options=[op("A", "V(m) = 60m + 85", False, "Trocou o valor fixo com o valor por mês. Quem multiplica o m é o que se paga todo mês (85)."),
           op("B", "V(m) = 145m", False, "Somou matrícula e mensalidade e multiplicou tudo por m, como se a matrícula fosse paga todo mês."),
           op("C", "V(m) = 85m", False, "Esqueceu a matrícula, que é o valor fixo."),
           op("D", "V(m) = 85m + 60", True, "Acerto. O que muda com os meses é 85m; a matrícula de 60 entra uma vez só."),
           op("E", "V(m) = 85 + 60 + m", False, "Somou o m em vez de multiplicar: cada mês acrescenta 85 reais, não 1.")],
  resolution=["O valor por mês (85) multiplica o número de meses: 85m.", "A matrícula (60) é paga uma vez: é o valor fixo.", "V(m) = 85m + 60."],
  check="Para 1 mês, V(1) = 85 + 60 = 145 reais, que é o que a pessoa paga no primeiro mês."))
# ---------- Q3 (N1, 1,5) reta sobe/desce e corte no eixo y ----------
itens.append(dict(n=3, code=H9, role="Avaliação", level="N1", valor=1.5, short="A reta sobe ou desce? Onde corta o eixo y?",
  descriptor="Reconhecer pela lei se a reta sobe ou desce e onde corta o eixo y.", stem=[f"O gráfico da função f(x) = {M}2x + 5 é uma reta."], table=None,
  ask="Como é essa reta?",
  options=[op("A", "Desce e corta o eixo y no ponto (0; 5).", True, f"Acerto. O a = {M}2 é negativo, então a reta desce; o b = 5 é onde ela corta o eixo y."),
           op("B", "Sobe e corta o eixo y no ponto (0; 5).", False, f"Não olhou o sinal do a. Com a = {M}2, negativo, a reta desce."),
           op("C", f"Desce e corta o eixo y no ponto (0; {M}2).", False, f"Trocou o a com o b. O {M}2 é a inclinação; o corte no eixo y é o b = 5."),
           op("D", f"Sobe e corta o eixo y no ponto (0; {M}2).", False, "Trocou o a com o b e também o sentido da reta."),
           op("E", "Desce e corta o eixo y no ponto (5; 0).", False, "Trocou as coordenadas. No eixo y, o x vale 0: o ponto é (0; 5).")],
  resolution=[f"Em f(x) = ax + b, aqui a = {M}2 e b = 5.", "a negativo: a reta desce (decrescente).", "A reta corta o eixo y quando x = 0: f(0) = 5, ponto (0; 5)."],
  check=f"f(0) = 5 e f(1) = 3: quando x aumenta, y diminui, então a reta desce."))
# ---------- Q4 (N2, 1,0) completar tabela ----------
g = lambda x: 5 - 2 * x
xs = [-1, 0, 2, 3]; ys = [g(x) for x in xs]
assert ys == [7, 5, 1, -1]
itens.append(dict(n=4, code=H7, role="Avaliação", level="N2", valor=1.0, short="Completar a tabela de uma função",
  descriptor="Completar a tabela de uma função.", stem=[f"A tabela mostra alguns valores de x para a função f(x) = 5 {M} 2x."],
  table={"header": ["x", f"{M}1", "0", "2", "3"], "rows": [["f(x)", "?", "?", "?", "?"]], "caption": "Elaboração própria para fins educacionais."},
  ask="Quais são os valores de f(x), na ordem da tabela?",
  options=[op("A", f"3; 5; 1; {M}1", False, f"Em x = {M}1 fez 5 {M} 2 = 3. Com o parêntese: 5 {M} 2 · ({M}1) = 5 + 2 = 7."),
           op("B", f"7; 3; 1; {M}1", False, f"Em x = 0 fez 5 {M} 2 = 3, como se 2 · 0 fosse 2. Mas 2 · 0 = 0, então f(0) = 5."),
           op("C", f"{M}7; {M}5; {M}1; 1", False, f"Usou 2x {M} 5 no lugar de 5 {M} 2x: todos os sinais ficaram trocados."),
           op("D", "7; 5; 1; 1", False, f"Em x = 3 fez 6 {M} 5 = 1, invertendo a subtração. O certo é 5 {M} 6 = {M}1."),
           op("E", f"7; 5; 1; {M}1", True, f"Acerto. f({M}1) = 7, f(0) = 5, f(2) = 1 e f(3) = {M}1.")],
  resolution=[f"f({M}1) = 5 {M} 2 · ({M}1) = 5 + 2 = 7.", "f(0) = 5 − 2 · 0 = 5.".replace("−", M), f"f(2) = 5 {M} 4 = 1.", f"f(3) = 5 {M} 6 = {M}1."],
  check=f"A cada 1 que o x aumenta, f(x) diminui 2: de 1 (x = 2) para {M}1 (x = 3) está certo."))
# ---------- Q5 (N2, 1,0) zero da função ----------
assert Fr(12, 4) == 3
itens.append(dict(n=5, code=H9, role="Avaliação", level="N2", valor=1.0, short="Zero da função",
  descriptor="Encontrar o zero da função do 1º grau.", stem=[f"Considere a função f(x) = 4x {M} 12."], table=None,
  ask="Qual é o zero dessa função?",
  options=numericas([(-12, f"Respondeu o b. O {M}12 é onde a reta corta o eixo y; o zero é o x que faz f(x) = 0."),
                     (-3, f"Errou o sinal ao passar o 12: 4x = 12, então x = 3, positivo."),
                     (3, f"Acerto. 4x {M} 12 = 0 → 4x = 12 → x = 3."),
                     (8, f"Fez 12 {M} 4 = 8. O 4 multiplica o x; para isolar o x, divida 12 por 4."),
                     (48, "Multiplicou 4 · 12 = 48 em vez de dividir.")], 3),
  resolution=["O zero é o x que faz f(x) = 0.", f"4x {M} 12 = 0 → 4x = 12.", "x = 12 ÷ 4 = 3."],
  check=f"f(3) = 4 · 3 {M} 12 = 0."))
# ---------- Q6 (N3, 1,0) lei a partir do gráfico ----------
fig, ax = plt.subplots(figsize=(3.6, 4.2), dpi=200)
grade(ax, -1, 4, -3, 5)
xx = [-0.2, 3.45]; ax.plot(xx, [2 * x - 2 for x in xx], color=AZUL, lw=2.4)
for (px, py) in [(0, -2), (3, 4)]:
    ax.plot(px, py, "o", color=LARANJA, ms=7, zorder=5)
ax.annotate(f"(0; {M}2)", (0, -2), xytext=(8, -4), textcoords="offset points", fontsize=11, color=LARANJA, fontweight="bold")
ax.annotate("(3; 4)", (3, 4), xytext=(-46, 4), textcoords="offset points", fontsize=11, color=LARANJA, fontweight="bold")
fig.savefig(os.path.join(FIG, "q6.png"), bbox_inches="tight", facecolor="white"); plt.close(fig)
a = Fr(4 - (-2), 3 - 0); assert a == 2
itens.append(dict(n=6, code=H9, role="Avaliação", level="N3", valor=1.0, short="Lei a partir do gráfico",
  descriptor="Escrever a lei de uma função do 1º grau a partir do gráfico.", stem=["O gráfico mostra uma função do 1º grau, f(x) = ax + b, que passa pelos pontos marcados."],
  figure={"file": "assets/figuras/prova/e3-av2/q6.png", "alt": f"Plano cartesiano com uma reta crescente que passa pelos pontos (0; {M}2), no eixo y, e (3; 4).", "caption": "Elaboração própria para fins educacionais.", "scale": 0.8},
  table=None, ask="Qual é a lei dessa função?",
  options=[op("A", f"f(x) = {M}2x + 2", False, "Trocou os sinais do a e do b. A reta sobe, então o a é positivo."),
           op("B", f"f(x) = (4/3)x {M} 2", False, f"Dividiu o y do ponto (4) pelo x (3) sem descontar o ponto de partida. Quanto o y mudou: 4 {M} ({M}2) = 6."),
           op("C", f"f(x) = 3x {M} 2", False, "Usou o 3, que é quanto o x mudou, como se fosse o a. O a é quanto o y muda para cada 1 de x."),
           op("D", "f(x) = 2x + 3", False, f"Pôs o 3 no lugar do b. O b é onde a reta corta o eixo y: {M}2."),
           op("E", f"f(x) = 2x {M} 2", True, f"Acerto. b = {M}2 (corte no eixo y) e a = 6 ÷ 3 = 2.")],
  resolution=[f"A reta corta o eixo y em (0; {M}2), então b = {M}2.", f"De x = 0 a x = 3, o y vai de {M}2 a 4: mudou 6.", f"a = 6 ÷ 3 = 2. Lei: f(x) = 2x {M} 2."],
  check=f"f(3) = 2 · 3 {M} 2 = 4, que é o ponto (3; 4) do gráfico."))
# ---------- Q7 (N3, 1,0) fixo x proporcional ----------
taxi = lambda km: 6 + 3 * km
assert taxi(5) == 21 and taxi(10) == 36
itens.append(dict(n=7, code=H8, role="Avaliação", level="N3", valor=1.0, short="Valor fixo não dobra",
  descriptor="Interpretar valor fixo e taxa e distinguir de uma relação proporcional.",
  stem=["Uma corrida de táxi custa R$ 6,00 de bandeirada mais R$ 3,00 por quilômetro. Uma corrida de 5 km custa R$ 21,00."], table=None,
  ask="Quanto custa, em reais, uma corrida de 10 km?",
  options=numericas([(30, "Esqueceu a bandeirada: fez só 3 · 10 = 30."),
                     (36, "Acerto. 6 + 3 · 10 = 6 + 30 = 36. A bandeirada é paga uma vez só."),
                     (42, "Dobrou os R$ 21,00 da corrida de 5 km, como se fosse proporcional. A bandeirada não dobra."),
                     (51, "Somou o preço da corrida de 5 km com 3 · 10: contou a bandeirada e os primeiros 5 km duas vezes."),
                     (60, "Multiplicou a bandeirada pelos quilômetros: 6 · 10. A bandeirada é fixa.")], 36),
  resolution=["Lei: V(km) = 3 · km + 6.", "V(10) = 3 · 10 + 6 = 36.", "Não é o dobro de 21: só a parte por quilômetro dobra (15 → 30); os 6 fixos continuam 6."],
  check="Diferença de 5 km para 10 km: 5 km a mais, a R$ 3,00 cada, são R$ 15,00 a mais: 21 + 15 = 36."))
# ---------- Q8 (N4, 0,5) lei por tabela que não começa em 0 + caminho de volta ----------
dias = [2, 3, 4, 5]; lit = [130, 160, 190, 220]
h = lambda d: 30 * d + 70
assert [h(d) for d in dias] == lit and h(11) == 400
itens.append(dict(n=8, code=H7, role="Avaliação", level="N4", valor=0.5, short="Da tabela para a lei e de volta para o x",
  descriptor="Achar a lei por uma tabela que não começa em 0 e voltar do valor para o x.",
  stem=["Uma caixa-d'água recebe sempre a mesma quantidade de água por dia. A tabela mostra quantos litros ela tinha em alguns dias."],
  table={"header": ["Dia", "2", "3", "4", "5"], "rows": [["Litros", "130", "160", "190", "220"]], "caption": "Elaboração própria para fins educacionais."},
  ask="Mantendo esse ritmo, em que dia a caixa chega a 400 litros?",
  options=numericas([(6, f"Achou quantos dias faltam depois do dia 5: (400 {M} 220) ÷ 30 = 6. A resposta pede o dia: 5 + 6 = 11."),
                     (8, f"Partiu do dia 3: (400 {M} 160) ÷ 30 = 8, mas não somou os 3 dias que já tinham passado."),
                     (9, f"Usou 130 como valor inicial: (400 {M} 130) ÷ 30 = 9. O 130 é do dia 2, não do dia 0."),
                     (11, f"Acerto. A cada dia entram 30 L; no dia 0 havia 130 {M} 2 · 30 = 70 L. Lei: L = 30d + 70. 30d + 70 = 400 → d = 11."),
                     (13, "Dividiu 400 por 30 (dá 13,3) sem descontar os 70 litros iniciais.")], 11),
  resolution=["Por dia entram 160 − 130 = 30 litros: a = 30.".replace("−", M), f"Voltando do dia 2 até o dia 0: 130 {M} 2 · 30 = 70, então b = 70.", f"Lei: L(d) = 30d + 70. Para 400 L: 30d + 70 = 400 → 30d = 330 → d = 11."],
  check="L(11) = 30 · 11 + 70 = 400."))
# ---------- Q9 (N4, 0,5) duas situações, quando custam o mesmo ----------
A = lambda x: Fr(24) + Fr(2, 5) * x; B = lambda x: Fr(6, 5) * x
assert A(30) == B(30) == 36
itens.append(dict(n=9, code=H8, role="Avaliação", level="N4", valor=0.5, short="Quando duas situações custam o mesmo",
  descriptor="Comparar duas situações e achar quando custam o mesmo.",
  stem=["Para imprimir fotos, a loja A cobra R$ 24,00 de taxa de cadastro mais R$ 0,40 por foto. A loja B cobra R$ 1,20 por foto, sem taxa."], table=None,
  ask="Para quantas fotos as duas lojas cobram o mesmo valor?",
  options=numericas([(15, "Somou as duas taxas: 24 ÷ (1,20 + 0,40) = 15. É a diferença entre os preços por foto que paga a taxa: 1,20 − 0,40 = 0,80.".replace("−", M)),
                     (20, "Fez 24 ÷ 1,20 = 20, esquecendo os R$ 0,40 por foto da loja A."),
                     (30, f"Acerto. 24 + 0,40x = 1,20x → 24 = 0,80x → x = 30 fotos (as duas cobram R$ 36,00)."),
                     (36, "Esse é o valor em reais (R$ 36,00), não o número de fotos."),
                     (60, "Fez 24 ÷ 0,40 = 60, esquecendo o preço da loja B.")], 30),
  resolution=["Loja A: A(x) = 0,40x + 24. Loja B: B(x) = 1,20x.", f"Iguale: 0,40x + 24 = 1,20x → 24 = 0,80x.", "x = 24 ÷ 0,80 = 30 fotos."],
  check="A(30) = 12 + 24 = 36 e B(30) = 36. Com menos de 30 fotos a loja B sai mais barata; com mais, a loja A."))
# ---------- Q10 (N4, 0,5) domínio e imagem no gráfico ----------
pts = [(-2, 1), (1, 3), (3, -1), (4, 1)]
fig, ax = plt.subplots(figsize=(4.2, 3.6), dpi=200)
grade(ax, -3, 5, -2, 4)
ax.plot([p[0] for p in pts], [p[1] for p in pts], color=AZUL, lw=2.4, solid_joinstyle="round")
for p in (pts[0], pts[-1]):
    ax.plot(*p, "o", color=AZUL, ms=7, zorder=5)
fig.savefig(os.path.join(FIG, "q10.png"), bbox_inches="tight", facecolor="white"); plt.close(fig)
xs10 = [p[0] for p in pts]; ys10 = [p[1] for p in pts]
assert (min(xs10), max(xs10), min(ys10), max(ys10)) == (-2, 4, -1, 3)
itens.append(dict(n=10, code=H9, role="Avaliação", level="N4", valor=0.5, short="Domínio e imagem no gráfico",
  descriptor="Ler o domínio e o conjunto imagem de uma função no gráfico.", stem=["O gráfico mostra uma função completa, do primeiro ao último ponto marcado."],
  figure={"file": "assets/figuras/prova/e3-av2/q10.png", "alt": f"Plano cartesiano com uma linha em zigue-zague que começa no ponto ({M}2; 1), sobe até (1; 3), desce até (3; {M}1) e sobe até terminar em (4; 1).", "caption": "Elaboração própria para fins educacionais.", "scale": 0.85},
  table=None, ask="Quais são o domínio e o conjunto imagem dessa função?",
  options=[op("A", f"Domínio: {M}2 ≤ x ≤ 4; imagem: {M}1 ≤ y ≤ 3", True, "Acerto. No eixo x o gráfico vai de −2 a 4; no eixo y, do ponto mais baixo (−1) ao mais alto (3).".replace("−", M)),
           op("B", f"Domínio: {M}1 ≤ x ≤ 3; imagem: {M}2 ≤ y ≤ 4", False, "Trocou os eixos: o domínio se lê no eixo x e a imagem no eixo y."),
           op("C", f"Domínio: {M}2 ≤ x ≤ 4; imagem: {M}2 ≤ y ≤ 4", False, "Leu a imagem também no eixo x. A imagem vai do y mais baixo ao mais alto."),
           op("D", f"Domínio: 0 ≤ x ≤ 4; imagem: {M}1 ≤ y ≤ 3", False, f"Começou o domínio no 0, mas o gráfico começa em x = {M}2."),
           op("E", f"Domínio: {M}2 ≤ x ≤ 4; imagem: 1 ≤ y ≤ 3", False, f"Começou a imagem no y da primeira ponta (1) e esqueceu o ponto mais baixo, em y = {M}1.")],
  resolution=[f"Domínio: olhe o eixo x, do primeiro ao último ponto: de {M}2 a 4.", f"Imagem: olhe o eixo y, do ponto mais baixo ao mais alto: de {M}1 a 3.", "As pontas do gráfico não são, necessariamente, o mais alto e o mais baixo."],
  check=f"O ponto (3; {M}1) está abaixo das duas pontas, por isso a imagem começa em {M}1."))

for it in itens:
    ops = it["options"]; it["key"] = [o["letter"] for o in ops if o["correct"]][0]
    assert sum(o["correct"] for o in ops) == 1
assert sum(it["valor"] for it in itens) == 10
print("gabarito:", "".join(it["key"] for it in itens))
sim = {
 "id": "E3-AV2", "area": "prova", "status": "publicado",
 "titulo": "Simulado da Avaliação Somativa · Etapa 3",
 "subtitulo": "Funções · 10 questões no formato da avaliação: mesmas habilidades, níveis e pesos, com questões novas",
 "etapa": 3, "semana": None, "data": None, "serie": "9º ano", "professor": "Prof. Maicon Centner Germano",
 "temas": "Funções: valor e tabela, lei de situações, gráfico, zero, domínio e imagem",
 "pontuacao": {"tipo": "valores", "max": 10},
 "dicas": {},
 "items": itens,
}
json.dump(sim, open(os.path.join(OUT, "data", "prova", "E3-AV2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
