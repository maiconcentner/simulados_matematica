# Instruções para o Claude Code

Você vai implementar o site descrito em `PLANO.md`. Os dados, as figuras e as ferramentas já estão prontos nesta pasta. Falta o site em si (`index.html`, `css/`, `js/`) e os testes.

## Leia antes, nesta ordem
1. `PLANO.md`: o que é o site, telas, tecnologia e fases.
2. `planejamento/resultado_gamificado.md`: cálculo da nota, faixas, plano, XP, conquistas e a tela de resultado. É a parte mais importante.
3. `planejamento/esquema_dados.md`: formato dos JSON.
3b. `planejamento/simulado_completo_etapa3.md`: o simulado de 28 questões, com as telas e os testes próprios dele.
4. `data/config.json`, `data/catalogo.json`, `data/habilidades.json` e um simulado (`data/avalia/S07.json`, `data/prova/E3-AV2.json`).
5. `planejamento/referencia/template_simulado_antigo.html`: o simulado digital que os alunos já usaram, arquivo único com o painel de resultado antigo. Serve só de referência do que eles conhecem. Não copie o visual; o novo é mais jogo e mais claro.

## Regras
- **Sem build e sem framework.** HTML, CSS e JavaScript puros com módulos ES. Nenhum `package.json` é necessário para o site funcionar (pode existir só para os testes).
- **Nada sai do aparelho do aluno.** Sem servidor, sem formulário que envia dados, sem analytics, sem rastreador. A única requisição externa permitida é a do Google Fonts. Progresso só em `localStorage`, como em `resultado_gamificado.md`, item 6.
  - **Exceção: as páginas de aula** (`simulado.html` e `completo.html`, ver `planejamento/pagina_simulado_completo.md`). Elas enviam turma, nome e respostas para a planilha do professor, pelo Apps Script (`planejamento/apps_script/Code.gs`), e recebem dela a lista de alunos.
  - Mesmo nelas: **nenhum nome de aluno nem e-mail entra no repositório** (a lista fica na aba "Alunos" da planilha e chega à página só com o código da aula), e o código da aula (um por turma: `CODIGO_9A`, `CODIGO_9B`, `CODIGO_9C`) fica nas Propriedades do script, nunca no código. Nos testes, só nomes de mentira.
  - O site principal (`index.html`) continua sem enviar nada.
- **Sem nome institucional.** Não escreva o nome da rede de ensino, da escola ou da cidade em lugar nenhum. A palavra "Avalia" é permitida. `python3 tools/validar_dados.py` confere isso.
- **Não edite à mão** `data/avalia/*.json` nem `data/catalogo.json`. Eles saem de `tools/`. Mudança de conteúdo é com o professor.
- **Caminhos relativos** (sem `/` no começo), porque o site roda em `https://<usuario>.github.io/<repositorio>/`.
- Português do Brasil; linguagem para 14 e 15 anos; **sem travessão** nos textos do site; sem `alert()`, `confirm()` ou `prompt()`.
- Celular primeiro: 360 px sem rolagem lateral, toque de pelo menos 44 px, tema claro e escuro, `prefers-reduced-motion` respeitado, imagens com `alt`.
- Regras numéricas (faixas, XP, medalhas, conquistas) vêm de `data/config.json`, nunca fixas no código.

## Ordem de trabalho
Siga as fases da seção 8 do `PLANO.md`. Ao fim de cada fase, rode o site localmente (`python3 -m http.server 8000`) e confira no navegador em 390 px e em 1280 px. Faça um commit por fase.

## Testes (pasta `tests/`)
Use Playwright para Python ou para Node. Cobrir pelo menos:
1. **Funções de correção** (`js/correcao.js`), com os casos do item 1 de `resultado_gamificado.md`: S07 com 4, 3 e 6 acertos; S01 com 2 acertos; E3-AV2 acertando de 1 a 5 e acertando todas menos a 10.
2. **Percurso completo no celular (390 × 844)**:
   - abrir o painel, entrar em Simulados Avalia e no S07;
   - responder tudo, entregar e ver o resultado com nota, faixa, fortes, a melhorar e plano;
   - conferir `document.documentElement.scrollWidth === 390` em todas as telas.
3. **Continuar depois de recarregar**: responder 2 questões do S06, recarregar a página e continuar da questão 3.
4. **Simulado de prova**: fazer o E3-AV2 todo certo e ver nota 10,0, Avançado e medalha Diamante.
5. **Modo treino**: refazer só as erradas; a correção aparece na hora e o XP soma metade.
6. **Gamificação**: XP e conquistas continuam depois de recarregar; "Apagar meus dados" zera tudo.
7. **Sem erros no console** em nenhuma tela.
8. **Validação dos dados**: `python3 tools/validar_dados.py` sem erro.

## Pronto para publicar quando
- os testes passam e `tools/validar_dados.py` termina com 0 erro;
- as 7 semanas do Avalia e o simulado da Etapa 3 abrem, funcionam e mostram as figuras;
- o `README.md` explica como publicar no GitHub Pages e como incluir semana nova (já está escrito; atualize se mudar algo).
