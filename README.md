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

## O que o site faz
- **Painel**: nível, XP, sequência de dias, conquistas, "continue de onde parou", a missão (o plano do último resultado) e as áreas.
- **Simulado**: uma questão por tela, resposta salva a cada toque (fechou a página, continua de onde parou), figura que amplia com um toque e revisão das questões em branco antes de entregar.
- **Resultado**: nota no anel, acertos, medalha, XP, faixa com quanto falta para a próxima, pontos fortes e a melhorar, plano em até 3 passos, acertos por tema e revisão comentada de cada questão. Dá para imprimir ou salvar em PDF.
- **Modo treino**: refaz só as erradas, com a correção na hora e metade do XP.
- **Treinos**: os treinos do professor (T1, T2...), com correção a cada questão, e o gerador de números novos (abaixo).
- **Perfil**: apelido, conquistas, evolução da nota, mapa das habilidades, histórico, tema e "Apagar meus dados deste aparelho". O tema claro é o padrão; o aluno troca para o escuro pelo botão do topo (lua/sol) ou no Perfil.
- **Organização**: o Avalia mostra o simulado completo em destaque (`"destaque": true`) e as semanas (com número de semana); simulados sem semana e sem destaque (os treinos, `"modo": "treino"`) ficam em Treinos. Não precisa mexer no código: basta o JSON do simulado e rodar o catálogo.

## Testes
`tests/aula.test.mjs` e `tests/apps_script.test.mjs` cobrem as páginas de aula, com o Apps Script simulado (dois alunos no mesmo computador, recarregar no meio da parte, ordem por aluno, JSON enviado, questões em branco, código errado, planilha fora do ar, revisão só depois de 11/11 e modo treino).

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

## Páginas de aula: planilha do professor
Para as aulas nos notebooks da escola há duas páginas que **enviam as respostas para a planilha do professor** (é a única parte do site que envia dados):
- `completo.html`: o Simulado Completo em 4 partes de 7 questões. Cada parte começa e é enviada separadamente, em qualquer ordem e em aulas diferentes.
- `simulado.html?id=<ID>`: qualquer simulado de `data/avalia` ou `data/prova` (por exemplo `simulado.html?id=S08` ou `simulado.html?id=T1`). O campo `modo` do JSON decide: `"prova"` corrige só no fim; `"treino"` corrige a cada questão. Com `&parte=N`, abre direto a parte N.

O aluno escolhe a turma, digita o **código da aula** (que o professor escreve na lousa) e escolhe o nome na lista que vem da planilha. As questões de cada parte saem numa ordem diferente para cada aluno (sempre a mesma para o mesmo aluno). O progresso fica salvo no computador a cada resposta; o botão "Não sou eu / trocar de aluno" (ou "Sair") libera o computador para o próximo. Antes de `LIBERAR_REVISAO_EM` (em `js/aula/config.js`), o resultado não mostra as alternativas corretas.

### Montar a planilha (uma vez)
1. Crie uma planilha no Google Sheets e uma aba chamada **Alunos**, com as colunas `Turma`, `Numero`, `Nome`. Cole ali o conteúdo do `Alunos_para_planilha_9EF_2026.csv`, que está na sua pasta particular. **Esse arquivo não vai para o repositório.**
2. Abra **Extensões > Apps Script**, apague o que estiver lá e cole todo o conteúdo de `planejamento/apps_script/Code.gs`. Salve.
3. No Apps Script, abra **Configurações do projeto** (engrenagem) > **Propriedades do script** e crie **um código por turma**: `CODIGO_9A`, `CODIGO_9B` e `CODIGO_9C`, cada um com o código que você vai escrever na lousa daquela turma. O código de uma turma não funciona na outra. Uma turma sem código próprio usa a propriedade `CODIGO_AULA`, se ela existir. Para trocar o código numa aula, é só mudar o valor aqui.
4. Clique em **Implantar > Nova implantação**, tipo **App da Web**, "Executar como": **Eu**, "Quem pode acessar": **Qualquer pessoa**. Autorize e copie a URL (termina em `/exec`).
5. Cole essa URL em `URL_DA_PLANILHA`, no arquivo `js/aula/config.js`, faça o commit e envie.

Depois de mudar o `Code.gs`, faça **Implantar > Gerenciar implantações**, lápis, **Nova versão**, **Implantar**: a URL continua a mesma.

As outras abas (**Respostas**, **Resumo**, **Por questão** e **Códigos**) a planilha cria sozinha no primeiro envio. **A planilha manda:** se você apagar a linha de uma parte na aba Respostas, ela volta a ficar disponível para o aluno, do zero, na próxima vez que ele abrir a página (se a planilha estiver fora do ar, vale o que o computador sabe). Cada parte enviada vira uma linha em Respostas na hora; o Resumo junta as partes de cada aluno (nota, etapa e conexão); Por questão mostra o acerto de cada questão por turma e a alternativa mais marcada. Se o Apps Script estiver fora do ar, o aluno digita o nome (o envio chega com "Nome digitado: sim") e a página guarda o envio que falhou para tentar de novo.

**Gabarito:** o JSON de cada simulado é público. Publique o simulado só perto da aula.

## O site se atualiza sozinho
O navegador guarda os arquivos do site por um tempo. Para ninguém precisar limpar nada:
- cada publicação tem uma **versão**, carimbada nos endereços dos arquivos (`?v=...`) por `python3 tools/carimbar_versao.py`. **Rode esse comando antes de cada commit que mexe em `js/`, `css/` ou nas páginas `.html`** (os testes conferem). Mudar só os dados (`data/*.json`) não precisa: eles são lidos sempre sem cache;
- ao abrir, o site confere `versao.json`; se tiver versão nova, recarrega sozinho, uma vez. Com a página já aberta, aparece o aviso "Atualizar".

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
