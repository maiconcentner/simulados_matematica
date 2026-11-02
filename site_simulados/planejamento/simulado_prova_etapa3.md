# Simulado de prova · Etapa 3 · Avaliação Somativa 2 (funções)

Arquivo pronto: `data/prova/E3-AV2.json`, com as figuras das questões 6 e 10 em `assets/figuras/prova/e3-av2/`. O gerador das questões, com as contas conferidas, está em `planejamento/fonte/e3_av2.py`.

## 1. Para que serve
Treinar a turma no formato da Avaliação Somativa 2 da Etapa 3: as mesmas habilidades, níveis e pesos, com **questões novas**. A prova oficial não vai para o site. O repositório é público e o gabarito fica dentro do JSON, então só entram questões paralelas.

Uso sugerido:
- **Antes da prova:** o aluno faz em casa e chega à prova com o plano do resultado já trabalhado.
- **Depois da prova:** serve de recuperação, porque o resultado aponta as habilidades que faltam.

## 2. Formato (igual ao da avaliação)
- 10 questões de múltipla escolha, alternativas A a E, nota de 0 a 10.
- Pesos por nível:

  | Nível | Questões | Valor de cada | Total |
  |---|---|---|---|
  | N1 | 1 a 3 | 1,5 | 4,5 |
  | N2 e N3 | 4 a 7 | 1,0 | 4,0 |
  | N4 | 8 a 10 | 0,5 | 1,5 |

- Faixas da nota:
  - até 4,5: Abaixo do básico;
  - até 6,5: Básico;
  - até 8,5: Adequado;
  - acima de 8,5: Avançado.
- Três habilidades. No site aparece o nome curto, que está em `data/habilidades.json`:
  - **EF.09.MAT.2.87**, valor e tabela de uma função;
  - **EF.09.MAT.2.88**, lei de uma situação com valor fixo e valor por unidade;
  - **EF.09.MAT.2.89**, gráfico da função do 1º grau.

## 3. Matriz das questões

| Q | Habilidade | Nível | Valor | O que cobra | Contexto do simulado | Gabarito | Erros que os distratores pegam |
|---|---|---|---|---|---|---|---|
| 1 | 2.87 | N1 | 1,5 | f(x) para x negativo | f(x) = 3x − 4, f(−2) | B (−10) | sinal do x, esquecer o −4, sinal no fim, multiplicar antes de trocar o x |
| 2 | 2.88 | N1 | 1,5 | lei com fixo + por unidade | academia: R$ 60 de matrícula e R$ 85 por mês | D (V = 85m + 60) | trocar fixo e taxa, multiplicar tudo por m, esquecer o fixo |
| 3 | 2.89 | N1 | 1,5 | sobe ou desce, corte no eixo y | f(x) = −2x + 5 | A (desce, (0; 5)) | ignorar o sinal de a, trocar a com b, trocar coordenadas |
| 4 | 2.87 | N2 | 1,0 | completar tabela | f(x) = 5 − 2x para x = −1, 0, 2, 3 | E (7; 5; 1; −1) | 2 · 0 = 2, sinal com x negativo, inverter a subtração |
| 5 | 2.89 | N2 | 1,0 | zero da função | f(x) = 4x − 12 | C (3) | responder o b, sinal ao passar, subtrair em vez de dividir |
| 6 | 2.89 | N3 | 1,0 | lei pelo gráfico | reta por (0; −2) e (3; 4) | E (f(x) = 2x − 2) | dividir y por x sem descontar o b, usar Δx como taxa, b errado |
| 7 | 2.88 | N3 | 1,0 | fixo não dobra | táxi: R$ 6 + R$ 3 por km; 5 km = R$ 21; e 10 km? | B (36) | dobrar 21 (proporcional), esquecer a bandeirada |
| 8 | 2.87 | N4 | 0,5 | lei por tabela que não começa em 0 e caminho de volta | caixa-d'água: dias 2 a 5, 130 a 220 L; quando chega a 400 L? | D (dia 11) | usar 130 como valor inicial, responder dias que faltam, esquecer o b |
| 9 | 2.88 | N4 | 0,5 | quando duas situações custam o mesmo | fotos: A = 24 + 0,40x; B = 1,20x | C (30 fotos) | somar as taxas, ignorar uma das lojas, responder o valor em reais |
| 10 | 2.89 | N4 | 0,5 | domínio e imagem no gráfico | gráfico de (−2; 1) a (4; 1), com mínimo −1 e máximo 3 | A | trocar eixos, ler a imagem no eixo x, usar só as pontas |

Gabarito: **B D A E C E B D C A**. Cada letra aparece duas vezes.

## 4. Regras usadas na elaboração
- Nenhum número ou contexto repete os da avaliação oficial, das listas ou dos simulados semanais.
- Cada distrator vem de um erro real de aluno, e o campo `why` diz qual é o erro. O resultado do site usa esse texto como "erro provável".
- Nas alternativas numéricas, ordem crescente.
- Todas as contas foram conferidas por script (`planejamento/fonte/e3_av2.py`): uma só alternativa correta por questão e a soma dos valores igual a 10.

## 5. Antes de liberar para a turma
1. O professor resolve as 10 questões no site, como aluno, e confere o resultado.
2. Se quiser mudar uma questão, edite `planejamento/fonte/e3_av2.py` e rode `python3 planejamento/fonte/e3_av2.py`, que regrava o JSON e as figuras. Precisa de Python com matplotlib. Depois rode `python3 tools/atualizar_catalogo.py` e `python3 tools/validar_dados.py`.
3. Para esconder o simulado até a data certa, troque `"status": "publicado"` por `"em_breve"` em `data/prova/E3-AV2.json` e rode o catálogo de novo.

## 6. Próximas etapas
Cada avaliação somativa nova ganha um arquivo `data/prova/E<etapa>-<sigla>.json` no mesmo formato, com a matriz da prova (habilidades, níveis, valores) e questões paralelas. O catálogo agrupa por `etapa` sozinho.
