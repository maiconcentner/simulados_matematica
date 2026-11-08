# Plano do site: Simulados de Matemática · Prof. Maicon Centner Germano

Versão 1, 02/11/2026. Este arquivo é o plano completo. O `CLAUDE.md` diz em que ordem implementar e como conferir.

## 1. O que é

Um site estático, publicado no GitHub Pages, onde os alunos do 9º ano fazem os simulados de Matemática no celular ou no computador e, no fim de cada um, recebem um resultado visual e gamificado: nota, nível, pontos fortes, pontos fracos e um plano curto do que estudar.

Duas áreas:

| Área | O que tem | Arquivos |
|---|---|---|
| **Simulados Avalia** | os simulados semanais por descritor (Semanas 1 a 7 prontas; as próximas entram com uma ferramenta) | `data/avalia/S01.json` a `S07.json` |
| **Simulado Completo** | 28 questões como o Avalia+ (20 da etapa e 8 de conexão), para casa entre 13 e 17/11; cartão em destaque dentro de Simulados Avalia | `data/avalia/E3-COMPLETO.json` (o professor publica até 12/11; ver `planejamento/simulado_completo_etapa3.md`) |
| **Simulados de prova** | treino no formato da avaliação somativa de cada etapa, organizado por etapa | `data/prova/E3-AV2.json` (Etapa 3, funções) |

## 2. Regras que não mudam

1. **Sem nome institucional.** Nada do nome da rede de ensino, da escola ou da cidade em textos, imagens, nomes de arquivo, título da página ou metadados. A palavra "Avalia" pode aparecer (decisão do professor). `tools/validar_dados.py` procura esses nomes e falha se achar.
2. **Sem dado de aluno no repositório nem na internet.** O site não envia nada a servidor nenhum. Apelido, respostas, notas, XP e conquistas ficam só no navegador do aluno (`localStorage`). Nenhum nome de aluno entra em arquivo do repositório.
   - **Exceção (08/11/2026): as páginas de aula** `simulado.html` e `completo.html`, usadas nos notebooks da escola. Elas enviam turma, nome e respostas para a planilha do professor, pelo Apps Script, e recebem dela a lista de alunos. Nenhum nome de aluno nem e-mail entra no repositório; o código da aula fica nas Propriedades do script. Especificação em `planejamento/pagina_simulado_completo.md`.
3. **A prova oficial nunca entra no site.** O repositório é público, e o gabarito fica dentro dos JSON. Os simulados de prova usam questões paralelas: mesmas habilidades, níveis e pesos, com contextos e números novos.
4. **Português do Brasil, linguagem para 14 e 15 anos**, vírgula decimal, unidade junto do número. Não usar travessão em nenhum texto do site.
5. **Celular primeiro.** Tudo funciona em 360 px de largura, sem rolagem lateral, com botões de pelo menos 44 px de altura.

## 3. Tecnologia

- HTML, CSS e JavaScript puros, com módulos ES (`<script type="module">`). **Sem etapa de build e sem dependência obrigatória.** O GitHub Pages serve os arquivos como estão.
- Navegação por hash (`#/`, `#/avalia`, `#/prova`, `#/simulado/S07`, `#/resultado/S07`, `#/perfil`), que funciona no Pages sem configuração.
- Dados lidos com `fetch` de `data/catalogo.json`, `data/config.json`, `data/habilidades.json` e do JSON de cada simulado.
- Gráficos em SVG feito à mão (anel da nota, barras por tema). Animações em CSS, desligadas com `prefers-reduced-motion`.
- Fonte: uma do Google Fonts com cara jovem e boa leitura de números (sugestão: "Nunito" para texto e "Baloo 2" para títulos), com fonte do sistema como reserva.
- Tema claro e escuro, pelos tokens de cor em `:root`.
- Teste local: `python3 -m http.server 8000` na raiz e abrir `http://localhost:8000`.

Estrutura final do repositório:

```
index.html              página única (o app monta as telas)
css/estilo.css
js/app.js               inicialização e rotas
js/dados.js             leitura do catálogo, config, habilidades e simulados
js/armazenamento.js     localStorage com try/catch e versão do esquema
js/simulado.js          tela de prova (uma questão por tela)
js/correcao.js          nota, faixa, forças, fraquezas e plano (funções puras, testáveis)
js/gamificacao.js       XP, nível do jogador, medalhas, conquistas, sequência de dias
js/resultado.js         tela de resultado
js/graficos.js          anel e barras em SVG
js/gerador/             gerador de simulados de treino (modelos de questão e figuras em SVG)
data/                   (já pronto) catálogo, config, habilidades e simulados
assets/figuras/         (já pronto) figuras das questões
assets/icones/          ícones do site (SVG próprios)
tools/                  (já pronto) importar semana, gerar catálogo, validar
planejamento/           este plano detalhado, especificações e referência
tests/                  testes de ponta a ponta
simulado.html           página de aula genérica (?id=<ID>&parte=N), com identificação e envio à planilha
completo.html           entrada do Simulado Completo, em 4 partes
js/aula/                código das páginas de aula (config.js tem a URL da planilha)
css/aula.css            estilo extra das páginas de aula
planejamento/apps_script/Code.gs  Apps Script da planilha do professor
.nojekyll
```

## 4. Telas

### 4.1 Painel (`#/`)
- Saudação com o apelido (se o aluno quiser dar um) e o **cartão do jogador**: nível, título (Iniciante, Explorador...), barra de XP até o próximo nível, sequência de dias e número de conquistas.
- Dois cartões grandes, lado a lado no computador e empilhados no celular: **Simulados Avalia** e **Simulados de prova**, cada um com quantos simulados há e quantos o aluno já fez.
- **Continue de onde parou**: um simulado começado e não entregue, se existir.
- **Sua missão**: os passos do plano do último resultado, com caixinhas para marcar.
- Últimas conquistas desbloqueadas.

### 4.2 Simulados Avalia (`#/avalia`)
- Lista em cartões, da semana mais recente para a mais antiga: "Semana 7", temas (de `temas`), número de questões, as habilidades em etiquetas com o nome curto de `habilidades.json`.
- Em cada cartão, o estado do aluno: novo, feito (com a melhor nota e a medalha) ou "dá para melhorar" (nota abaixo de 7).
- Filtro por tema (Números, Álgebra e funções, Geometria, Grandezas e medidas, Estatística e probabilidade).

- No topo, o **Simulado Completo** em destaque (`"destaque": true` no catálogo), com o tempo sugerido e, enquanto estiver `em_breve`, o selo "Libera em 12/11". As regras extras dele (cronômetro com pausa, grade 1 a 28, notas da etapa e de conexão, plano até a prova) estão em `planejamento/simulado_completo_etapa3.md`.

### 4.3 Simulados de prova (`#/prova`)
- Agrupados por etapa, com um cabeçalho por etapa ("Etapa 3"). Hoje há um: **Simulado da Avaliação Somativa · Etapa 3** (funções, 10 questões, valendo 10).
- Etapas sem simulado aparecem como "em breve" só se o catálogo tiver uma entrada com `status: "em_breve"`.

### 4.4 Fazer o simulado (`#/simulado/<id>`)
- Abertura: título, número de questões, como é a nota, e o botão "Começar". Sem limite de tempo; o tempo gasto é só mostrado no resultado.
- Uma questão por tela: barra de progresso em bolinhas (respondida, atual, em branco), texto do enunciado (`stem`, uma linha por parágrafo), tabela (`table`) como tabela HTML, figura (`figure.file`) com `alt`, legenda pequena e toque para ampliar, pergunta (`ask`) em destaque e as cinco alternativas como botões grandes "A", "B"...
- Nos simulados de prova, a etiqueta "vale 1,5" (campo `valor`) e o nível da questão.
- O aluno pode voltar e trocar respostas. Antes de entregar, uma tela de revisão mostra as questões em branco.
- **Sem correção questão a questão no modo simulado.** O resultado só aparece depois de entregar (é assim nos simulados em papel).
- Respostas salvas a cada clique, para não perder nada se a página fechar.

### 4.5 Resultado (`#/resultado/<id>`)
Especificação completa em `planejamento/resultado_gamificado.md`. Resumo, de cima para baixo:
1. Anel da nota animado, acertos, medalha e XP ganho.
2. Faixa de desempenho (Abaixo do básico, Básico, Adequado, Avançado) com o apelido divertido da faixa e quanto falta para a próxima.
3. Pontos fortes e pontos a melhorar, por habilidade.
4. Plano em até 3 passos, com dica, "refazer esta questão" e "treinar em outro simulado".
5. Barras por tema (este simulado e o histórico).
6. Revisão comentada de cada questão.
7. Botões: Refazer só as que errei (modo treino), Voltar ao painel, Imprimir ou salvar em PDF.

### 4.6 Modo treino
- Abre a partir do resultado com as questões erradas (ou uma questão do plano).
- Aqui a correção é imediata: depois de escolher, mostra se acertou, o erro provável da alternativa marcada (`why`) e a resolução (`resolution`).
- Dá metade do XP. Não muda a nota oficial do simulado, mas conta para a conquista "Volta por cima" quando o aluno refaz o simulado inteiro.

### 4.6b Treinar com números novos (`#/treinar`)
Pedido do professor: o aluno pode gerar simulados novos para treinar, com valores diferentes.
- **Versão nova de um simulado**: mesmas habilidades, níveis, pesos e ordem do original, com números e contextos sorteados. Também há um botão "Versão nova" em cada cartão das listas e na abertura do simulado.
- **Monte o seu treino**: o aluno escolhe habilidades (agrupadas por tema) e a quantidade de questões (5, 6, 8 ou 10); as questões vêm da mais fácil para a mais difícil.
- Os treinos gerados ficam guardados no aparelho (os 12 últimos), em "Seus treinos gerados", e abrem como qualquer simulado (`#/simulado/G-...`).
- O gerador fica em `js/gerador/`: um modelo por questão dos simulados, que calcula a resposta, os distratores (com o erro provável de cada um), a resolução, a conferência e a figura em SVG. `tools/ver_gerador.html` mostra as questões geradas, com gabarito, para o professor conferir.

### 4.7 Perfil (`#/perfil`)
- Apelido (editável), nível, XP, conquistas (as bloqueadas aparecem em cinza, com a regra).
- Histórico de tentativas e a evolução da nota.
- Mapa das habilidades: percentual de acerto por habilidade em todos os simulados, ordenado do mais fraco para o mais forte.
- Botão "Apagar meus dados deste aparelho", com confirmação feita na própria página.

## 5. Dados (já prontos nesta pasta)

| Arquivo | Conteúdo |
|---|---|
| `data/catalogo.json` | lista das áreas e dos simulados (gerado por `tools/atualizar_catalogo.py`) |
| `data/config.json` | faixas de nota, temas, regras de XP, títulos do jogador, medalhas e conquistas |
| `data/habilidades.json` | para cada código (D05, C27, EF.09.MAT.2.87...): nome curto para o aluno, descrição, tema e dica |
| `data/avalia/SNN.json` | simulado semanal: questões com alternativas, erro provável de cada uma, resolução e conferência |
| `data/prova/E3-AV2.json` | simulado da avaliação somativa da Etapa 3, com o valor de cada questão |
| `assets/figuras/` | figuras das questões, referenciadas em `figure.file` |

O formato está em `planejamento/esquema_dados.md`. Os códigos de descritor e de habilidade ficam só nos dados e na revisão do professor; para o aluno aparece o nome curto. Questão de conexão (`role: "Conexão"`, código começando com C) aparece como "Conexão com o 8º ano".

## 6. Como entra um simulado novo

- **Semana nova (Avalia):** o professor gera a semana com o pipeline de sempre e roda, na raiz do repositório:
  `python3 tools/extrair_semana.py caminho/S08_Simulado_digital.html --data 2026-11-09`
  `python3 tools/atualizar_catalogo.py`
  `python3 tools/validar_dados.py`
  e confere em `data/habilidades.json` o nome e o tema dos códigos novos.
- **Simulado de prova novo:** criar `data/prova/E<etapa>-<sigla>.json` no mesmo formato de `E3-AV2.json`, com as figuras em `assets/figuras/prova/<id em minúsculas>/`, seguindo `planejamento/simulado_prova_etapa3.md` como modelo. Depois catálogo e validação.

## 7. Publicação no GitHub Pages
1. Criar o repositório (por exemplo `simulados-matematica`) e subir esta pasta inteira como raiz.
2. Em Settings > Pages: Source "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. O endereço fica `https://<usuario>.github.io/simulados-matematica/`. Todos os caminhos do site devem ser relativos (sem `/` no começo) para funcionar dentro dessa subpasta.

## 8. Fases de implementação
| Fase | Entrega | Pronto quando |
|---|---|---|
| 1 | `index.html`, estilo, rotas, painel e listas lendo o catálogo | as duas áreas mostram os 7 Avalia e o simulado da Etapa 3 |
| 1b | gerador de simulados de treino (`js/gerador/`, `#/treinar`, prévia em `tools/`) | cada modelo gera questões válidas e variadas (testes em `tests/gerador.test.mjs`) |
| 2 | tela do simulado com salvamento a cada clique | dá para fazer o S07 inteiro no celular, fechar no meio e continuar |
| 3 | correção e resultado (funções puras em `correcao.js`) | a nota e a faixa batem com os casos de teste do `CLAUDE.md` |
| 4 | gamificação: XP, nível, medalhas, conquistas, sequência de dias, missão | as regras de `config.json` funcionam e sobrevivem a recarregar a página |
| 5 | modo treino e perfil | refazer só as erradas funciona; apagar dados limpa tudo |
| 6 | acabamento: tema escuro, impressão, acessibilidade, testes | testes passando e `tools/validar_dados.py` sem erro |
