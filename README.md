# Template: Geração de Imagem com Next.js e Vertex AI

Um template MVP (Minimum Viable Product) focado em educar como conectar um app Next.js à API de Geração de Imagens (Imagen) da Vertex AI de forma segura.

---

## 📋 Sobre Este Template

Este projeto é um **template educacional** desenvolvido para estudantes aprenderem a integrar APIs de IA Generativa em aplicações web. O foco está em:

- ✅ **Segurança**: Demonstra como proteger credenciais de API usando backend seguro
- ✅ **Simplicidade**: Interface minimalista focada apenas na funcionalidade essencial
- ✅ **Educação**: Código limpo e comentado para facilitar o aprendizado

### 🎯 O Que Você Vai Aprender

- Como configurar autenticação segura com Google Cloud Platform
- Como criar API Routes no Next.js para proteger credenciais
- Como integrar Vertex AI Imagen em uma aplicação React
- Boas práticas de segurança para APIs de IA

---

## 🏗️ Fluxo da Aplicação

Este template demonstra uma **arquitetura segura** onde as credenciais da API nunca são expostas ao navegador:

```
Frontend (React) → API Route (Next.js) → Vertex AI (Google Cloud)
     ↓                    ↓                        ↓
  Interface          Backend Seguro           Geração de Imagem
  do Usuário        (Credenciais aqui)        (Serviço Google)
```

### Por Que Esta Arquitetura É Segura?

- 🔒 **As credenciais ficam no servidor**: O arquivo `.env.local` com suas chaves de API nunca é enviado ao navegador
- 🛡️ **Backend como intermediário**: A API Route (`/pages/api/generate.js`) atua como um proxy seguro entre o frontend e a Vertex AI
- 🚫 **Nenhuma exposição**: O código JavaScript no navegador não tem acesso às credenciais do Google Cloud

### 📊 Diagrama de Fluxo Detalhado

```mermaid
graph TD
    A[Início: Aluno abre localhost:3000] --> B(Vê UI: Input + Botão "Gerar")
    B --> C{Aluno digita prompt e clica em "Gerar"}

    subgraph Frontend["Frontend (Navegador do Aluno)"]
        C --> D[1. Mostra "Carregando..." e envia requisição POST /api/generate]
    end

    subgraph Backend["Backend (Servidor Next.js)"]
        D --> E[2. API Route /api/generate recebe o prompt]
        E --> F[3. Lê .env.local e autentica no Google Cloud]
        F --> G[4. Chama a API da Vertex AI (Modelo Imagen) com o prompt]
        G --> H(5. Vertex AI processa e retorna a imagem)
        H --> I[6. Servidor codifica a imagem (Base64) e responde com JSON]
    end

    subgraph Frontend2["Frontend (Navegador do Aluno)"]
        I --> J[7. App recebe o JSON com a imagem]
        J --> K[8. Esconde "Carregando..." e exibe a imagem na tag img]
    end

    K --> Z[Fim: Aluno vê a imagem gerada]
```

---

## 🚀 Primeiros Passos

### Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ **Node.js** instalado (versão 18 ou superior)
  - Baixe em: [nodejs.org](https://nodejs.org/)
  - Verifique com: `node --version`
- ✅ **Conta Google Cloud** com faturamento ativo
  - Crie em: [cloud.google.com](https://cloud.google.com/)
  - ⚠️ **Importante**: O Vertex AI requer um projeto com faturamento habilitado (mas há créditos gratuitos disponíveis)

---

## ⚙️ Configuração

### 1. Configuração do Google Cloud

Siga estes passos no Console do Google Cloud:

#### Passo 1: Criar um Novo Projeto

1. Acesse o [Console do Google Cloud](https://console.cloud.google.com/)
2. No topo da página, clique no seletor de projetos
3. Clique em **"Novo Projeto"**
4. Digite um nome para o projeto (ex: "meu-template-imagen")
5. Clique em **"Criar"**
6. Aguarde alguns segundos e selecione o projeto recém-criado

#### Passo 2: Ativar a API da Vertex AI

1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Na barra de pesquisa, digite: **"Vertex AI API"**
3. Clique no resultado **"Vertex AI API"**
4. Clique no botão **"Ativar"**
5. Aguarde alguns segundos até ver a mensagem "API ativada"

#### Passo 3: Criar uma Service Account

1. No menu lateral, vá em **"IAM e Administração"** > **"Contas de Serviço"**
2. Clique em **"Criar Conta de Serviço"**
3. Preencha:
   - **Nome**: `vertex-ai-generator` (ou outro nome de sua escolha)
   - **Descrição**: `Conta de serviço para geração de imagens com Vertex AI`
4. Clique em **"Criar e Continuar"**
5. Na seção **"Conceder acesso a esta conta de serviço"**, adicione a role:
   - **"Vertex AI User"** (`roles/aiplatform.user`)
6. Clique em **"Continuar"** e depois em **"Concluído"**

#### Passo 4: Baixar a Chave da Service Account

1. Na lista de contas de serviço, encontre a que você acabou de criar
2. Clique nos **três pontos** (⋮) ao lado da conta
3. Selecione **"Gerenciar Chaves"**
4. Clique em **"Adicionar Chave"** > **"Criar Nova Chave"**
5. Selecione o formato **JSON**
6. Clique em **"Criar"**
7. ⚠️ **Importante**: Um arquivo JSON será baixado automaticamente - **GUARDE ESTE ARQUIVO EM UM LOCAL SEGURO!** Ele contém credenciais sensíveis.

---

### 2. Configuração Local

Agora vamos configurar o projeto no seu computador:

#### Passo 1: Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd PHOTO_SAAS
```

#### Passo 2: Instalar Dependências

```bash
npm install
```

#### Passo 3: Configurar Variáveis de Ambiente

1. **Renomeie** o arquivo `.env.local.example` para `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Abra** o arquivo `.env.local` em um editor de texto

3. **Preencha** as variáveis com suas informações:

   ```env
   # ID do seu projeto Google Cloud
   GCP_PROJECT_ID=meu-projeto-gcp-123456
   
   # Região (padrão: us-central1)
   GCP_LOCATION=us-central1
   
   # Caminho para o arquivo JSON da Service Account que você baixou
   # Exemplo no Windows: C:/chaves/meu-projeto-key.json
   # Exemplo no Mac/Linux: /home/usuario/chaves/meu-projeto-key.json
   GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/seu/arquivo.json
   ```

   ⚠️ **Importante**: 
   - Substitua `meu-projeto-gcp-123456` pelo ID real do seu projeto
   - Use o caminho completo (absoluto) para o arquivo JSON da Service Account
   - No Windows, use barras normais (`/`) ou barras invertidas duplas (`\\`)

---

## 🎮 Rodando o Projeto

Após configurar tudo, execute:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador e teste!

### Como Testar

1. Digite um prompt no campo de texto (ex: "um cachorro fofo no espaço")
2. Clique em **"Gerar Imagem"**
3. Aguarde alguns segundos enquanto a imagem é gerada
4. Veja a imagem gerada aparecer na tela! 🎨

---

## 📚 Como Funciona (Pontos de Estudo)

Este template foi projetado para ser estudado. Aqui estão os arquivos principais que você deve analisar:

### 🔵 Frontend: `/pages/index.js`

**O que este arquivo faz:**
- Renderiza a interface do usuário (campo de texto + botão)
- Gerencia o estado da aplicação (prompt, imagem, loading, erro)
- Faz requisições HTTP para a API Route do backend

**Pontos de estudo:**
- ✅ Como usar `useState` para gerenciar estado em React
- ✅ Como fazer requisições `fetch` para APIs
- ✅ Como tratar erros e estados de loading
- ✅ Como exibir imagens em Base64 Data URI

**Dica**: Note que este arquivo **NÃO contém nenhuma chave de API** - toda a comunicação com a Vertex AI acontece através do backend.

### 🔴 Backend: `/pages/api/generate.js`

**O que este arquivo faz:**
- Recebe requisições POST do frontend
- Autentica com Google Cloud usando as credenciais do `.env.local`
- Chama a API da Vertex AI Imagen para gerar imagens
- Retorna a imagem gerada em formato Base64

**Pontos de estudo:**
- ✅ Como criar API Routes no Next.js (Pages Router)
- ✅ Como usar variáveis de ambiente de forma segura
- ✅ Como inicializar o cliente do Vertex AI (`@google-cloud/aiplatform`)
- ✅ Como fazer chamadas para APIs externas no backend
- ✅ Como converter resposta da API em formato útil para o frontend

**Dica**: Este é o arquivo mais importante para entender segurança! Note como:
- As credenciais são lidas de `process.env.*` (nunca hardcoded)
- O arquivo `.env.local` está no `.gitignore` (não será commitado)
- O cliente da Vertex AI é inicializado no servidor, não no navegador

### 🎨 Estilos: `/styles/globals.css`

**O que este arquivo faz:**
- Define o tema escuro da aplicação
- Centraliza o conteúdo na tela
- Estiliza inputs, botões e imagens

**Pontos de estudo:**
- ✅ Como usar CSS puro (sem frameworks) para estilização
- ✅ Como criar layouts responsivos
- ✅ Como aplicar tema escuro

---

## 🔒 Segurança

Este template demonstra várias práticas importantes de segurança:

### ✅ O Que Está Protegido

- **Credenciais no `.env.local`**: Nunca são commitadas no Git (está no `.gitignore`)
- **Arquivos JSON de Service Account**: Ignorados pelo Git (proteção `*.json`)
- **Chaves de API**: Sempre no backend, nunca no frontend

### ⚠️ O Que Você DEVE Fazer

1. ✅ **Nunca commite** o arquivo `.env.local`
2. ✅ **Nunca compartilhe** o arquivo JSON da Service Account
3. ✅ **Use variáveis de ambiente** em produção (Vercel, Railway, etc.)
4. ✅ **Revogue e recrie** chaves se você acidentalmente as expôs

---

## 🛠️ Tecnologias Utilizadas

- **[Next.js](https://nextjs.org/)** - Framework React com suporte a API Routes
- **[Vertex AI Imagen](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)** - API de geração de imagens da Google
- **[@google-cloud/aiplatform](https://www.npmjs.com/package/@google-cloud/aiplatform)** - SDK oficial para Vertex AI
- **React** - Biblioteca JavaScript para interfaces

---

## 📖 Recursos Adicionais

### Documentação Oficial

- [Next.js Documentation](https://nextjs.org/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)

### Aprenda Mais

- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks](https://react.dev/reference/react)
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)

---

## 🤝 Contribuindo

Este é um template educacional! Sinta-se à vontade para:

- 📝 Fazer fork e personalizar para seus projetos
- 🐛 Reportar bugs ou sugerir melhorias
- 📚 Compartilhar com outros estudantes

---

## ⚖️ Licença

Este projeto está sob a licença Apache 2.0 - veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

## 💡 Dicas para Alunos

1. **Leia o código**: Comece pelos arquivos principais mencionados acima
2. **Experimente**: Mude prompts, adicione features, brinque!
3. **Erros são normais**: Aprenda com eles - leia as mensagens de erro cuidadosamente
4. **Google é seu amigo**: Quando tiver dúvidas, pesquise na documentação oficial
5. **Construa em cima**: Use este template como base para seus próprios projetos

---

**Boa sorte com seus estudos! 🚀**

Se tiver dúvidas ou problemas, verifique:
- Se todas as variáveis de ambiente estão configuradas corretamente
- Se o arquivo JSON da Service Account está no caminho correto
- Se a API do Vertex AI está ativada no seu projeto Google Cloud
- Se o faturamento está habilitado no projeto
