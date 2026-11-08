# Páginas de simulado (semana de 10 a 13/11/2026)

Plano de 08/11/2026. As turmas 9A, 9B e 9C fazem nos notebooks da escola, pelo link que o professor manda:
- terça, 10/11: o Simulado Completo, em 4 partes;
- quarta e sexta: a S08, os treinos e a revanche, na mesma página.

As aulas são quebradas: às vezes duas de 50 minutos seguidas, às vezes com pausa ou outra aula no meio. Os notebooks são compartilhados, então vários alunos usam o mesmo computador. O painel completo do site fica para depois; agora são só estas páginas.

## Regras
- Seguir `CLAUDE.md`: sem build, caminhos relativos, sem travessão, sem `alert()`, `confirm()` ou `prompt()`, sem nome institucional, telas de 390 px e 1280 px.
- **Exceção à regra de privacidade (atualizar `CLAUDE.md` e `PLANO.md`):**
  - estas páginas enviam turma, nome e respostas para a planilha do professor, pelo Apps Script;
  - **nenhum nome de aluno nem e-mail entra no repositório.** A lista de alunos fica na planilha e chega à página pelo Apps Script, só com o código da aula;
  - o código da aula fica nas Propriedades do script, nunca no código.
- Não editar os JSON de `data/` nem as figuras. Eles vêm prontos.

## Arquivos
- **`simulado.html?id=<ID>`**: página genérica. Carrega `data/avalia/<ID>.json` (ou `data/prova/<ID>.json`).
  - O campo `modo` do JSON decide o comportamento:
    - `"prova"`: a correção só aparece no fim;
    - `"treino"`: depois de cada resposta, mostra se acertou, o `why` da alternativa marcada e a resolução.
  - Com `&parte=N`, abre só as questões dessa parte (campo `partes` do JSON).
- **`completo.html`**: entrada do Simulado Completo (`id = E3-COMPLETO`).
  - Mostra as 4 partes, com 7 questões cada (campo `partes`).
  - Para o aluno identificado, mostra a situação de cada parte: não começada, em andamento ou enviada.
  - Cada parte começa e é enviada separadamente, em qualquer ordem e em aulas diferentes.

## Identificação (mesma tela para todas as páginas)
1. O aluno escolhe a turma (lista com 9A, 9B e 9C).
2. Digita o código da aula, que o professor escreve na lousa.
3. Escolhe o nome numa lista em ordem alfabética.
   - A lista vem do Apps Script: GET `?acao=alunos&turma=9A&codigo=XXXX` devolve os nomes da aba "Alunos".
   - Código errado: mensagem na própria página.
   - Apps Script fora do ar: campo para digitar o nome, e o envio leva `nome_digitado: true`.
4. Botão "Não sou eu / trocar de aluno" em todas as telas. Depois de enviar uma parte, a página volta para a entrada do simulado. O botão "Sair" limpa a tela para o próximo aluno do mesmo computador.

## Ordem embaralhada
- As questões de cada parte saem em ordem diferente para cada aluno.
- Use semente fixa: hash de turma, nome, id e parte. Assim a ordem é a mesma se o aluno recarregar ou trocar de computador.
- As alternativas **não** são embaralhadas: as numéricas estão em ordem crescente, como no Avalia+.
- Na tela aparece "Questão 3 de 7 · Parte 2". O registro guarda o número original (`n` do JSON).

## Progresso e envio
- Salvar em localStorage a cada resposta, com chave por turma, nome, id e parte. Se a aula acabar ou a aba fechar, o aluno continua de onde parou no mesmo computador.
- Grade das 7 questões da parte; antes de enviar, avisar quais estão em branco.
- **Envio por parte:** POST para `URL_DA_PLANILHA` com `mode: "no-cors"` e `Content-Type: text/plain`. JSON enviado:
  - acao "resposta", codigo, id_envio;
  - id do simulado, parte, turma, nome, nome_digitado;
  - ordem mostrada;
  - respostas e acertos por número original;
  - acertos da parte, tempo em minutos, data e hora.
- Se o envio falhar, guardar e tentar de novo ao abrir a página e por um botão. Mostrar "Parte enviada" ou "Não foi enviada, chame o professor".
- **Situação das partes:** GET `?acao=status&id=E3-COMPLETO&turma=..&nome=..&codigo=..` devolve as partes já recebidas. Assim a entrada mostra certo mesmo se o aluno trocar de computador entre as partes.

## Resultado na tela
- Depois de cada parte: só "Parte N enviada" e quantas partes faltam.
- Depois das 4 partes:
  - nota (acertos ÷ 28 × 10, uma casa decimal);
  - nota da etapa (códigos D) e da conexão (códigos C);
  - barras por eixo (`tema` em `habilidades.json`);
  - dicas das 3 habilidades mais fracas.
  - Como a página não guarda as respostas das partes enviadas de outros computadores, o resultado completo pode vir do Apps Script: GET `?acao=resultado&...`.
- **Revisão bloqueada até `LIBERAR_REVISAO_EM = "2026-11-11"`:** antes dessa data, nada de alternativa correta nem revisão por questão. No modo treino, a correção na hora vale sempre.

## Apps Script (`planejamento/apps_script/Code.gs`)
- **Abas da planilha:**
  - "Alunos": Turma, Numero, Nome. O professor cola o arquivo `Alunos_para_planilha_9EF_2026.csv`, que está na pasta particular dele, fora do repositório.
  - "Respostas": uma linha por parte enviada, com as colunas Data/hora, Simulado, Parte, Turma, Nome, Nome digitado, Tempo (min), Acertos da parte, R1..R28, C1..C28 (só as da parte preenchidas), Ordem mostrada, id_envio.
  - "Resumo": uma linha por aluno e simulado, juntando as partes: partes recebidas, acertos, nota, etapa, conexão, R1..R28, C1..C28. O script atualiza a cada envio.
- **Funções:**
  - `doGet` com as ações alunos, status e resultado;
  - `doPost` com a ação resposta;
  - todas conferem o código da aula, ignoram id_envio repetido e só aceitam as turmas 9A, 9B e 9C.
- **Sem PDF e sem e-mail.** Cada envio grava na hora na planilha do professor, aluno por aluno, sem esperar o fim do dia. A análise é feita na própria planilha.
- **Aba "Por questão"**, atualizada a cada envio: acerto de cada questão (1 a 28) por turma e no total, e a alternativa mais marcada em cada uma. O professor usa essa aba na noite de terça para escolher a retomada e a revanche.
- **Propriedade do script:** `CODIGO_AULA`.
- **No `README.md`, explicar:**
  1. criar a planilha e colar a aba Alunos;
  2. abrir Extensões > Apps Script e colar o código;
  3. preencher a Propriedade `CODIGO_AULA`;
  4. Implantar > Nova implantação > App da Web, executar como "Eu", acesso "Qualquer pessoa";
  5. colar a URL em `URL_DA_PLANILHA`.

## Testes (Playwright, com o Apps Script simulado)
- Fazer as 4 partes com dois alunos no mesmo navegador e conferir que o progresso de um não aparece para o outro.
- Interromper a parte 2 no meio, recarregar e continuar da mesma questão, na mesma ordem.
- Conferir que dois alunos recebem ordens diferentes e que um mesmo aluno recebe sempre a mesma.
- Conferir o JSON enviado em cada parte (respostas pelo número original).
- Ver o aviso de questões em branco; testar código errado e Apps Script fora do ar (nome digitado).
- Conferir que a revisão aparece só depois de 11/11 e que o modo treino corrige na hora.
- `document.documentElement.scrollWidth === 390` em todas as telas, sem erros no console.
- `python3 tools/validar_dados.py` sem erro.

## Publicação
- O gabarito fica no JSON público. Subir o `E3-COMPLETO.json` só na segunda à noite ou na terça antes da aula.
- A S08, os treinos e a revanche entram depois, como `data/avalia/S08.json`, `T1.json` etc., com o `modo` certo. Não precisa mexer no código.
