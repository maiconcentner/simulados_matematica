# Simulados de Matemática · 9º ano

Site de simulados do Prof. Maicon Centner Germano. Os alunos fazem os simulados no celular ou no computador e recebem, no fim, um resultado com nota, nível, pontos fortes, pontos a melhorar e um plano de estudo, com XP, medalhas e conquistas.

- **Simulados Avalia**: um simulado por semana, por descritor (Semanas 1 a 7).
- **Simulados de prova**: treino no formato da avaliação de cada etapa (Etapa 3: funções).
- **Treinar com números novos**: o aluno gera simulados novos, no mesmo estilo, quantas vezes quiser. Pode pedir uma versão nova de um simulado (mesmas habilidades, níveis e pesos) ou montar o próprio treino escolhendo as habilidades.

Nenhum dado sai do aparelho do aluno: o progresso fica guardado só no navegador.

## Como está organizado
| Pasta | O que tem |
|---|---|
| `data/` | catálogo, configuração (faixas, XP, conquistas), habilidades e um JSON por simulado |
| `assets/figuras/` | figuras das questões |
| `js/` | o site (rotas, telas, armazenamento) e `js/gerador/`, o gerador de questões |
| `tools/` | importar semana nova, gerar o catálogo, validar os dados e a prévia do gerador |
| `tests/` | testes do gerador e do site (Playwright) |
| `planejamento/` | plano detalhado, especificações, gerador do simulado de prova e referência |
| `PLANO.md` | plano do site |
| `CLAUDE.md` | instruções para o Claude Code implementar |

## Ver no computador
```
python3 -m http.server 8000
```
e abrir `http://localhost:8000`.

## Testes
Cobrem o gerador, as telas no celular e no computador (sem rolagem lateral, sem erro no console), o simulado com resposta salva a cada toque e a continuação depois de recarregar.

Precisa de Node 18 ou mais novo.
```
npm install
npx playwright install chromium
npm test
```

## Gerador de simulados
Cada questão dos simulados tem um **modelo** em `js/gerador/` (`modelos_avalia_1.js`, `modelos_avalia_2.js`, `modelos_prova.js`). O modelo sorteia números e contextos, calcula a resposta, monta os distratores com os mesmos erros típicos da questão original (com o "erro provável" de cada um), a resolução e a conferência. As figuras das questões geradas são desenhadas em SVG pelo próprio site.

Para conferir o que o gerador produz, abra `tools/ver_gerador.html` (com o site rodando: `http://localhost:8000/tools/ver_gerador.html`). Ela mostra uma versão de cada modelo, com gabarito, erro provável de cada alternativa e resolução; o botão "Sortear outra" troca os números. A página não aparece no menu dos alunos.

Os treinos gerados ficam guardados só no aparelho do aluno (os 12 últimos).

**Semana nova sem modelo:** o site funciona normalmente; só não mostra o botão "Versão nova" para ela. Para incluir a semana no gerador, crie um modelo por questão com o id `S08-1`, `S08-2`... (mesmo código e nível da questão), seguindo os que já existem, e rode `npm test`.

## Publicar no GitHub Pages
1. Subir esta pasta inteira como raiz do repositório.
2. Em **Settings > Pages**, escolher "Deploy from a branch", branch `main`, pasta `/ (root)`.
3. O site fica em `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Incluir uma semana nova
Com o `SNN_Simulado_digital.html` da semana gerado pelo pipeline de sempre:
```
python3 tools/extrair_semana.py caminho/S08_Simulado_digital.html --data 2026-11-09
python3 tools/atualizar_catalogo.py
python3 tools/validar_dados.py
```
Depois confira em `data/habilidades.json` o nome curto e o tema dos códigos novos (a ferramenta avisa quais são), faça o commit e envie. O site atualiza sozinho em alguns minutos.

## Incluir um simulado de prova
Siga `planejamento/simulado_prova_etapa3.md`: um arquivo `data/prova/E<etapa>-<sigla>.json` no mesmo formato, com questões paralelas às da prova (nunca a prova oficial). Depois rode o catálogo e a validação.
