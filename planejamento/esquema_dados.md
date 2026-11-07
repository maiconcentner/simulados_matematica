# Formato dos dados

Todos os arquivos são JSON em UTF-8. Os simulados Avalia e os de prova usam o mesmo formato de questão. O de prova acrescenta o `valor` de cada questão.

## Simulado (`data/avalia/SNN.json` e `data/prova/<id>.json`)

| Campo | Tipo | Exemplo / observação |
|---|---|---|
| `id` | texto | `"S07"`, `"E3-AV2"` |
| `area` | `"avalia"` ou `"prova"` | |
| `titulo` | texto | `"Simulado Avalia · Semana 7"` |
| `subtitulo` | texto, opcional | linha de apoio no cartão |
| `semana` | número ou `null` | só no Avalia |
| `etapa` | número | 3 |
| `data` | `"AAAA-MM-DD"` ou `null` | semana de aplicação em sala |
| `serie`, `professor`, `temas` | texto | `temas` resume os conteúdos (aparece no cartão) |
| `status` | `"publicado"` (padrão), `"em_breve"` ou `"oculto"` | `em_breve` mostra o cartão sem abrir; `oculto` não mostra |
| `disponivel_ate` | data e hora com fuso, opcional | `"2026-11-07T23:59:59-03:00"`: depois desse momento o cartão aparece como "Encerrado" e o simulado, as versões novas dele e o treino não abrem. O resultado de quem já entregou continua visível. Para liberar de novo, apague o campo (ou ponha outra data) e rode o catálogo |
| `pontuacao` | objeto | `{"tipo": "acertos"}` no Avalia; `{"tipo": "valores", "max": 10}` na prova |
| `dicas` | objeto código → texto | dica por habilidade; se faltar, usar `habilidades.json` |
| `items` | lista de questões | na ordem de aplicação |

## Questão (cada elemento de `items`)

| Campo | Tipo | Uso no site |
|---|---|---|
| `n` | número | número da questão, 1, 2, 3... |
| `code` | texto | código da habilidade; chave de `habilidades.json` |
| `role` | texto | papel da questão no plano do professor: `"Conexão"`, `"Retomada"`, `"Retomada espaçada (6ª questão fixa)"`, `"Novo"`, `"Novo (segunda versão)"` ou `"Avaliação"`. Para o aluno: "Conexão com o 8º ano" quando começa com Conexão, "Revisão" quando começa com Retomada e nada nos outros casos |
| `level` | `"N1"` a `"N4"` | nível de dificuldade; entra no XP |
| `valor` | número | só na prova: quanto a questão vale |
| `short` | texto | título curto da questão (revisão e plano) |
| `descriptor` | texto | descrição longa da habilidade (só na revisão) |
| `stem` | lista de textos | enunciado; cada texto é um parágrafo |
| `table` | objeto ou `null` | `{"header": [...], "rows": [[...], ...], "caption": "..."}`; desenhar como tabela HTML |
| `figure` | objeto, opcional | `{"file": "assets/figuras/...png", "alt": "...", "caption": "...", "scale": 0.8}`. `alt` é obrigatório no `<img>`; `scale` sugere a largura relativa (0,8 = 80% da coluna, no máximo 520 px) |
| `ask` | texto | a pergunta, em destaque |
| `options` | lista de 5 | `{"letter": "A", "text": "576", "value": 576, "correct": true, "why": "..."}`. `why` é o erro provável (ou a justificativa, na correta) |
| `key` | letra | a alternativa correta (igual à que tem `correct: true`) |
| `resolution` | lista de textos | passos da resolução, numerados na tela |
| `check` | texto | conferência do resultado ("como saber se está certo") |

Os textos já vêm com vírgula decimal, sinal de menos tipográfico (−), "R$ 38,40" com espaço não separável e "·" para multiplicação. Mostre como estão. Não há LaTeX.

## `data/habilidades.json`

```json
"D05": {"nome": "Volume do cilindro", "descricao": "Calcular o volume de cilindros...", "tema": "Grandezas e medidas",
        "dica": "divida o diâmetro por 2 ...", "conexao_8ano": false}
```
- `nome` aparece para o aluno; `tema` é um dos cinco de `config.temas`.
- `dica` começa com verbo no imperativo e em minúscula. Ao mostrar sozinha, ponha a primeira letra em maiúscula.

## `data/catalogo.json`

Gerado por `tools/atualizar_catalogo.py`; não editar à mão. Tem:
- `site`: título, autor e série;
- `areas`: lista com `avalia` e `prova`, cada uma com `simulados`;
- para cada simulado: `id`, `titulo`, `subtitulo`, `etapa`, `semana`, `data`, `n_questoes`, `habilidades` (códigos), `status` e `arquivo`.

O painel monta tudo a partir dele e só abre o JSON completo quando o aluno entra no simulado.

## Simulados gerados (só no aparelho do aluno)

O gerador (`js/gerador/`) produz simulados no mesmo formato acima, guardados em `localStorage`, na lista `gerados`. Diferenças:
- `id` começa com `G-` (por exemplo `G-1A2B3C`) e `area` é `"gerado"`;
- campo `gerado`: `{"tipo": "versao", "base": "S07", "semente": 123, "criadoEm": "AAAA-MM-DD"}` ou `{"tipo": "misto", "codigos": ["D30", "D05"], ...}`;
- cada questão tem `modelo` (o id do modelo que a gerou, como `"S07-3"`);
- a figura vem em `figure.svg` (SVG desenhado pelo site) em vez de `figure.file`; `alt` continua obrigatório.

Na versão nova de um simulado de prova, `pontuacao` e o `valor` de cada questão são os do original.

## `data/config.json`

Faixas de nota (`escala`), regras de nota, temas, XP, títulos do jogador, medalhas e conquistas. Ver `planejamento/resultado_gamificado.md`.
