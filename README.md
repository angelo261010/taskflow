# TaskFlow — Gerenciador de Tarefas

## Objetivo
O TaskFlow é uma aplicação web para cadastrar, organizar e acompanhar tarefas pessoais. O projeto funciona inteiramente no navegador, sem backend, banco de dados, APIs ou frameworks.

## Funcionalidades
- Dashboard com total de tarefas, pendentes, em andamento e concluídas.
- Cadastro de título, descrição, prioridade, prazo, status e categoria.
- Quadro Kanban com as colunas **A Fazer**, **Em Andamento** e **Concluídas**.
- Edição, exclusão e movimentação de tarefas.
- Arrastar e soltar cartões entre as colunas (Drag and Drop).
- Pesquisa por título e filtros simultâneos por prioridade e status.
- Persistência automática com `localStorage`.
- Indicador de progresso e gráfico simples de distribuição.
- Aviso visual de tarefas atrasadas.
- Modo escuro.
- Exportação de backup em JSON pelo atalho `Ctrl + Shift + E` (Windows/Linux) ou `Cmd + Shift + E` (macOS).

## Tecnologias
- HTML5
- CSS3
- JavaScript puro (Vanilla JS)
- `localStorage` e `Blob` do navegador

Não são utilizadas bibliotecas, frameworks, serviços externos, banco de dados ou servidor.

## Estrutura
```text
taskflow/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Como executar
1. Baixe ou clone o repositório.
2. Abra a pasta `taskflow` no Visual Studio Code.
3. Abra o arquivo `index.html` no navegador (clique duas vezes nele ou use **Open with Live Server**, caso tenha essa extensão instalada).
4. Cadastre uma tarefa para começar.

O projeto não precisa de instalação, terminal, dependências ou servidor. A extensão Live Server é opcional; basta abrir `index.html` no navegador.

## Onde os dados ficam salvos?
As tarefas ficam no `localStorage` do navegador e do dispositivo em que o projeto foi aberto. Por isso, os dados permanecem após atualizar ou fechar a página, mas não são sincronizados entre computadores ou navegadores. Limpar os dados do site no navegador pode apagar as tarefas. Use o atalho de exportação para criar um backup JSON.

## Identificação dos integrantes
- Nome(s): ______________________________________
- Turma: ________________________________________

## Conceitos para apresentar
- **Variáveis:** guardam valores usados pelo programa.
- **Arrays:** a variável `tasks` guarda a lista de tarefas.
- **Objetos:** cada tarefa é um objeto com propriedades como `title`, `priority` e `status`.
- **Funções:** organizam ações, como `saveTask()`, `render()` e `moveTask()`.
- **Eventos:** respondem a cliques, envio do formulário, digitação e arrastar/soltar.
- **DOM:** o JavaScript seleciona e atualiza elementos HTML para redesenhar o quadro.
- **JSON:** `JSON.stringify()` converte a lista em texto para salvar; `JSON.parse()` recupera os dados.
- **localStorage:** mantém os dados no navegador.
- **Filtros:** `getFilteredTasks()` cria uma lista exibida conforme a pesquisa e os filtros, sem apagar ou modificar a lista original.

## Observação
O projeto foi desenvolvido para fins educacionais. Revise, teste e esteja preparado para explicar as funções e os conceitos utilizados.
