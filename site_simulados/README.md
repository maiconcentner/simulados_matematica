# Simulados de Matemática · 9º ano

Site de simulados do Prof. Maicon Centner Germano. Os alunos fazem os simulados no celular ou no computador e recebem, no fim, um resultado com nota, nível, pontos fortes, pontos a melhorar e um plano de estudo, com XP, medalhas e conquistas.

- **Simulados Avalia**: um simulado por semana, por descritor (Semanas 1 a 7).
- **Simulados de prova**: treino no formato da avaliação de cada etapa (Etapa 3: funções).

Nenhum dado sai do aparelho do aluno: o progresso fica guardado só no navegador.

## Como está organizado
| Pasta | O que tem |
|---|---|
| `data/` | catálogo, configuração (faixas, XP, conquistas), habilidades e um JSON por simulado |
| `assets/figuras/` | figuras das questões |
| `tools/` | importar semana nova, gerar o catálogo e validar os dados |
| `planejamento/` | plano detalhado, especificações, gerador do simulado de prova e referência |
| `PLANO.md` | plano do site |
| `CLAUDE.md` | instruções para o Claude Code implementar |

## Ver no computador
```
python3 -m http.server 8000
```
e abrir `http://localhost:8000`.

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
