# Resultado e gamificação

O resultado é a parte mais importante do site. Tem de ser **objetivo** (o aluno entende em 10 segundos como foi e o que fazer), **visual** e **com cara de jogo**, sem virar ranking: não existe comparação entre alunos, porque nada sai do aparelho.

Todas as regras numéricas estão em `data/config.json`. O código lê de lá; não fixe números no JavaScript.

## 1. Cálculo (em `js/correcao.js`, funções puras)

| Item | Simulado Avalia | Simulado de prova |
|---|---|---|
| Nota (0 a 10) | acertos ÷ total × 10, uma casa decimal | soma do `valor` das questões certas |
| Percentual | acertos ÷ total | nota ÷ 10 |
| Faixa | primeira faixa de `config.escala` em que nota ≤ `ate` | igual |
| Medalha | maior medalha com percentual ≥ `min_percentual`; abaixo de 50%, sem medalha | igual |

**Quanto falta para a próxima faixa**: no Avalia, o menor número de acertos a mais que leva a nota acima do `ate` da faixa atual ("Acerte mais 1 questão para chegar ao Adequado"). Na prova, os pontos que faltam ("Faltam 0,5 ponto para o Adequado"). Na faixa mais alta, a frase da faixa.

Casos de teste obrigatórios (`tests/`):
- S07, 6 questões: 4 acertos dão nota 6,7, faixa Adequado; 3 acertos dão 5,0, Básico; 6 acertos dão 10,0, Avançado e medalha Diamante.
- S01, 5 questões: 2 acertos dão 4,0, Abaixo do básico, e "acerte mais 1 questão para chegar ao Básico" (3 acertos dão 6,0).
- E3-AV2: acertar as questões 1, 2, 3, 4 e 5 dá 6,5 (1,5 × 3 + 1,0 × 2), Básico; acertar todas menos a 10 dá 9,5, Avançado.

## 2. Pontos fortes, pontos fracos e plano

Agrupar por habilidade (`code`), porque um simulado pode ter duas questões do mesmo código.

- **Pontos fortes**: habilidades com todas as questões certas. Mostrar até 3, as de nível mais alto primeiro (N4 antes de N1). Texto: "Você mandou bem em **Volume do cilindro**".
- **Pontos a melhorar**: habilidades com pelo menos um erro. Mostrar até 3, as de nível mais baixo primeiro (errar N1 é mais urgente que errar N4); nos simulados de prova, desempate pelo maior `valor`.
- **Plano** (no máximo 3 passos, um por ponto a melhorar), cada passo com:
  1. o nome curto da habilidade e o **erro provável**: o `why` da alternativa que o aluno marcou;
  2. a **dica**: `dicas[code]` do simulado ou, se não houver, `habilidades[code].dica`;
  3. botão **Refazer esta questão** (abre o modo treino com ela);
  4. botão **Treinar em outro simulado**: o primeiro simulado do catálogo, diferente deste, que tem o mesmo código e em que o aluno ainda não acertou essa habilidade. Se não houver, a frase "Peça ao professor uma lista sobre isso".
- Se o aluno acertou tudo: em vez do plano, um desafio ("Tente o simulado X sem errar" ou "Ajude um colega a revisar").
- O plano vira a **Missão** do painel, com caixinhas que o aluno marca (guardadas no aparelho).

## 3. XP, nível e conquistas (em `js/gamificacao.js`)

- **XP do simulado**:
  - acerto no Avalia vale `acerto_por_nivel[level]`;
  - na prova, `valor × prova_por_ponto`;
  - somar `concluir_simulado`, mais `nota_8_ou_mais` quando couber, mais `combo_bonus_por_acerto` para cada acerto a partir do terceiro seguido.
- **Refazer**:
  - repetir um simulado inteiro dá XP só pelo que a nota subir em relação à melhor tentativa anterior, para não "farmar";
  - o modo treino dá `refazer_fator` do XP da questão, uma vez por questão.
- **Nível do jogador** = 1 + XP total ÷ `xp_por_nivel_do_jogador` (parte inteira). Título pelo maior `a_partir_do_nivel` alcançado.
- **Conquistas**: as de `config.conquistas`, verificadas ao entregar um simulado e no modo treino. A de tema vira cinco conquistas, uma por tema de `config.temas`.
- **Sequência de dias**: conta dias seguidos com pelo menos um simulado ou treino concluído.

## 4. Tela do resultado, na ordem

1. **Placar** (tela cheia no celular):
   - anel com a nota subindo de 0 até o valor, com a cor da faixa;
   - "4 de 6 acertos" e a medalha;
   - "+120 XP" contando;
   - a barra do nível do jogador enchendo; se subir de nível, um aviso "Subiu para o nível 5 · Estrategista" com confete.
   - Sem `alert()`: tudo dentro da página.
2. **Faixa**: régua com as 4 faixas e um marcador na nota do aluno, o apelido da faixa ("Mandando bem"), a frase da faixa e quanto falta para a próxima.
3. **Fortes e a melhorar**: duas colunas de etiquetas, verdes e laranja, com o nome curto da habilidade.
4. **Seu plano**: até 3 cartões numerados, como no item 2.
5. **Por tema**: barras horizontais com o acerto deste simulado por tema e, em cinza claro, o acerto acumulado do aluno no tema.
6. **Revisão das questões**, em acordeão, uma por questão:
   - enunciado, figura e a alternativa marcada;
   - a correta e o erro provável (`why`);
   - a resolução em passos numerados (`resolution`) e a conferência (`check`).
7. **Ações**: "Refazer só as que errei", "Voltar ao painel" e "Imprimir ou salvar PDF" (`window.print()` com CSS de impressão que esconde menus e animações).
8. **Conquista nova**: cartão com animação curta, que aparece por cima e fecha com um toque.

## 5. Visual
- Jovem e limpo: cantos arredondados, cores vivas nas faixas (as de `config.escala`), ícones em SVG próprios (medalhas, troféu, chama da sequência, estrela de XP). Nada de imagens de terceiros.
- Textos curtos e diretos, na segunda pessoa ("Você acertou..."), sem infantilizar.
- Movimento com propósito: contagem da nota, barra enchendo, confete só em subida de faixa para Adequado ou Avançado, em subida de nível e em conquista nova. Com `prefers-reduced-motion`, tudo aparece pronto, sem animação.
- Contraste mínimo de 4,5:1 nos textos, nos dois temas. A cor nunca é a única pista: a faixa tem nome e o acerto tem ícone.

## 6. Armazenamento (`js/armazenamento.js`)

Uma chave só, `simulados-mat:v1`, com JSON:

```json
{
 "perfil": {"apelido": "", "criadoEm": "2026-11-02"},
 "tentativas": [
  {"simId": "S07", "modo": "simulado", "inicio": "...", "fim": "...", "respostas": {"1": "A", "2": "D"},
   "acertos": 4, "nota": 6.7, "xp": 120}
 ],
 "emAndamento": {"S06": {"respostas": {"1": "B"}, "questaoAtual": 2, "inicio": "..."}},
 "xp": 840,
 "conquistas": {"primeira_missao": "2026-11-02"},
 "missao": {"origem": "S07", "passos": [{"code": "D05", "feito": false}]},
 "diasDeUso": ["2026-11-01", "2026-11-02"],
 "treino": {"S07": {"3": true}}
}
```

- Toda leitura e escrita dentro de `try/catch`. Se o armazenamento não existir (janela anônima, bloqueio), o site funciona normalmente e só avisa, com discrição, que o progresso não será guardado.
- Campo de versão: ao mudar o formato, migrar os dados antigos em vez de apagar.
