PRD: Template MVP - Gerador de Imagem (Vertex AI)
Versão: 1.0 (Educacional)
Autor: (realfelipetop)
Status: Proposta
Data: 05 de Novembro de 2025
Histórico de Alterações
v1.0 (05/11/2025): Criação inicial. O foco é migrar de um produto de nicho (ex: "Gerador de Meme") para um template de aprendizado genérico e minimalista. A funcionalidade principal é o "Prompt-to-Image" puro, por ser o MVP mais simples para fins educacionais.

1. Visão Geral e Objetivo
1.1. O Produto
Um repositório "template" (boilerplate) no GitHub. O projeto é um app Next.js minimalista que provê a funcionalidade mais básica de IA Generativa: Prompt-to-Image. Ele é desenhado para ser um ponto de partida limpo e seguro para estudantes.
1.2. O Problema (do Aluno)
Alunos que desejam aprender a integrar APIs de IA (como a Vertex AI) em aplicações web enfrentam três barreiras comuns:
Complexidade de Setup: Configurar um ambiente de desenvolvimento seguro.
Segurança de Chaves: Não sabem como proteger suas chaves de API, arriscando-se a expô-las no GitHub.
Foco: Exemplos oficiais são complexos demais ou focados em casos de uso que desviam do aprendizado principal.
1.3. A Solução
Um template Next.js que resolve esses problemas:
UI Mínima: Um frontend (React) com apenas um campo de texto e um botão.
Backend Seguro: Uma API Route (/pages/api/...) que é o único ponto de contato com a Vertex AI.
Segurança: As chaves de API são carregadas no backend via variáveis de ambiente (.env.local) e nunca são expostas ao navegador.
Foco: O código é focado 100% em "receber um prompt -> enviar à Vertex AI -> retornar a imagem".

2. Público-Alvo
Público Primário: Alunos (do seu curso) que precisam de um ponto de partida funcional para projetos e aprendizado.
Público Secundário: Desenvolvedores que buscam um "quickstart" limpo para a API de imagem da Vertex AI com Next.js.

3. Histórias de Usuário (Focadas no Aluno)
ID
Como um...
Eu quero...
Para que...
A-101
Aluno
Clonar (ou usar como template) um repositório no GitHub.
Começar meu projeto rapidamente sem configurar o Next.js do zero.
A-102
Aluno
Ler um README.md claro.
Entender como configurar minhas credenciais do Google Cloud (Service Account) em um arquivo .env.local.
A-103
Aluno
Rodar npm run dev após a configuração.
Ver o app funcionando imediatamente no localhost.
A-104
Aluno
Inspecionar o arquivo /pages/api/generate.js.
Entender exatamente como o backend (servidor) chama a API da Vertex AI de forma segura.
A-105
Aluno
Inspecionar o arquivo /pages/index.js.
Entender como o frontend (cliente) envia o prompt para sua própria API de backend.
A-106
Aluno
Ver um código "limpo" e minimalista.
Não me distrair com lógicas de negócio complexas (como login, banco de dados, ou ferramentas de edição).


4. Requisitos Funcionais (A UI do Template)
A interface deve ser a mais simples possível para focar na funcionalidade.
(F-01) Entrada de Prompt: Um (1) campo de texto (<input type="text">) para o usuário digitar o prompt.
(F-02) Ação de Geração: Um (1) botão ("Gerar") para submeter o pedido.
(F-03) Feedback de Processamento: O botão deve ficar desabilitado e um indicador de "Carregando..." deve aparecer enquanto a API processa a imagem.
(F-04) Exibição de Resultado: Uma área (<img>) que exibe a imagem gerada pela Vertex AI.
(F-05) Tratamento de Erro: Se a API falhar, uma mensagem de erro simples deve ser exibida ao usuário (ex: alert("Erro ao gerar imagem")).
(F-06) Download (Opcional, mas recomendado): Um botão de "Baixar Imagem" aparece após a geração bem-sucedida.
5. Requisitos Não-Funcionais (A Arquitetura do Template)
Estes são os requisitos mais importantes para um template educacional.
(NF-01) Stack de Tecnologia: Next.js (com API Routes) e o SDK google-cloud-aiplatform.
(NF-02) Arquitetura de Segurança:
O frontend (React) não pode conter NENHUMA chave de API ou SDK do Google.
Toda a lógica da Vertex AI deve residir em uma API Route (ex: /pages/api/generate).
(NF-03) Gerenciamento de Credenciais:
O projeto deve incluir um arquivo .env.local.example listando as variáveis necessárias (ex: GCP_PROJECT_ID, GCP_LOCATION, GOOGLE_APPLICATION_CREDENTIALS).
O projeto deve incluir um .gitignore que bloqueia .env.local, *.json e node_modules/.
(NF-04) Documentação (README.md): O README é o manual principal e deve conter:
Instruções claras de Setup do Google Cloud (Ativar API, Criar Service Account).
Instruções claras de Setup Local (npm install, npm run dev).

6. Fluxo da Aplicação (Visão do Aluno)
O aluno roda npm run dev e abre localhost:3000.
Frontend: Ele vê um campo de texto e um botão "Gerar".
Frontend: Ele digita "um cachorro fofo no espaço" e clica em "Gerar".
Frontend: O app mostra "Carregando..." e faz uma chamada fetch para POST /api/generate com o prompt no corpo (body) da requisição.
Backend: A API Route (/api/generate) recebe a requisição.
Backend: O servidor lê as credenciais do .env.local e autentica no Google Cloud.
Backend: O servidor chama a API da Vertex AI (modelo Imagen) com o prompt recebido.
Backend: A Vertex AI processa e retorna os bytes da imagem.
Backend: O servidor converte a imagem (ex: para Base64) e a envia como resposta JSON para o frontend.
Frontend: O app recebe o JSON, atualiza o estado (state) com a imagem Base64, e a exibe na tag <img>.




graph TD
    A[Início: Aluno abre localhost:3000] --> B(Vê UI: Input + Botão "Gerar")
    B --> C{Aluno digita prompt e clica em "Gerar"}

    subgraph Frontend (Navegador do Aluno)
        C --> D[1. Mostra "Carregando..." e envia requisição POST /api/generate]
    end

    subgraph Backend (Servidor Next.js)
        D --> E[2. API Route /api/generate recebe o prompt]
        E --> F[3. Lê .env.local e autentica no Google Cloud]
        F --> G[4. Chama a API da Vertex AI (Modelo Imagen) com o prompt]
        G --> H(5. Vertex AI processa e retorna a imagem)
        H --> I[6. Servidor codifica a imagem (ex: Base64) e responde com JSON]
    end

    subgraph Frontend (Navegador do Aluno)
        I --> J[7. App recebe o JSON com a imagem]
        J --> K[8. Esconde "Carregando..." e exibe a imagem na tag <img>]
    end

    K --> Z[Fim: Aluno vê a imagem gerada]

