# 🚀 Template: Geração de Imagem com Next.js e Vertex AI

Este é um template MVP (Minimum Viable Product) focado em educar como conectar um app Next.js à API de Geração de Imagens (Imagen) da Vertex AI de forma segura e profissional.

O objetivo é fornecer um ponto de partida limpo para que você possa focar em entender a integração, sem se preocupar com a complexidade de um app completo.

## 🎯 O Conceito de Segurança

Este projeto usa uma arquitetura de "Backend para Frontend" (BFF) para proteger suas chaves de API:

1.  **Frontend (React em `/pages/index.js`):** É a parte pública que seu usuário vê no navegador. Ela **NUNCA** toca em chaves de API.
2.  **Backend (API Route em `/pages/api/generate.js`):** É um mini-servidor que roda "escondido". Só ele tem permissão para ler seu arquivo `.env.local`, se comunicar com o Google Cloud e, então, enviar o resultado final para o Frontend.

**Nunca exponha suas chaves ou arquivos `.json` no código do Frontend!**

## 🏁 Pré-requisitos

Antes de começar, garanta que você tenha:

1.  **Node.js** (versão 18 ou superior) instalado.
2.  Uma **Conta Google Cloud** com o **Faturamento Ativado**. A Vertex AI não funciona sem faturamento ativo, embora ofereça um nível gratuito generoso para começar.

---

## 🛠️ Guia de Configuração (Passo a Passo)

Siga estes passos para fazer o template funcionar.

### Parte 1: Configuração no Google Cloud

Você precisa de 3 coisas do Google Cloud: **Projeto**, **API Ativada** e **Credenciais (Chave JSON)**.

**1. Habilitar a API da Vertex AI:**
* Acesse o [Console do Google Cloud](https://console.cloud.google.com/).
* Selecione ou crie um novo projeto. Anote o **ID do Projeto** (ex: `meu-projeto-gcp-123456`).
* No menu de busca, procure por **"Vertex AI API"**.
* Clique nela e depois clique em **"Enable"** (Ativar).

**2. Criar uma Conta de Serviço (Service Account):**
* No menu de busca, procure por **"Service Accounts"** (Contas de Serviço).
* Clique em **"Create Service Account"** (Criar Conta de Serviço).
* Dê um nome a ela (ex: `vertex-ai-executor`).
* **Importante:** Na etapa "Grant this service account access to project", adicione os seguintes papéis (Roles):
    * `Vertex AI User` (Usuário da Vertex AI)
    * `Storage Object Viewer` (Visualizador de objetos do Storage) - *Opcional, mas recomendado.*
* Clique em "Done" (Concluído).

**3. Baixar a Chave JSON da Conta de Serviço:**
* Na lista de Contas de Serviço, encontre a que você acabou de criar.
* Clique nos três pontos (⋮) ao final da linha e selecione **"Manage keys"** (Gerenciar chaves).
* Clique em **"Add Key"** > **"Create new key"** (Criar nova chave).
* Escolha o formato **JSON** e clique em **"Create"**.
* Um arquivo `.json` será baixado para o seu computador. **Guarde este arquivo, ele é sua senha!**

### Parte 2: Configuração Local do Projeto

Agora que você tem suas credenciais, vamos configurar o projeto.

**1. Clone o Repositório:**
```bash
git clone https://github.com/Trilha-pixel/PHOTO_SAAS
cd PHOTO_SAAS

2. Instale as Dependências:
Bash
npm install
# ou
yarn install

3. Crie seu Arquivo de Credenciais:
Este projeto vem com um arquivo de exemplo chamado .env.local.example.
Copie este arquivo e renomeie a cópia para .env.local.
Bash
cp .env.local.example .env.local


4. Preencha o .env.local:
Abra o arquivo .env.local que você acabou de criar.
Preencha os valores que você obteve na Parte 1:
GCP_PROJECT_ID: Coloque o ID do seu projeto do Google Cloud.
GCP_LOCATION: Deixe us-central1 (ou mude para a região que você ativou).
GOOGLE_APPLICATION_CREDENTIALS: Coloque o caminho completo para o arquivo .json que você baixou.
Exemplo de preenchimento:
Ini, TOML
# ID do seu projeto
GCP_PROJECT_ID=meu-projeto-gcp-123456

# Região
GCP_LOCATION=us-central1

# Caminho para o arquivo .json (Exemplos)
# Windows: GOOGLE_APPLICATION_CREDENTIALS=C:/chaves-gcp/meu-projeto-key.json
# macOS/Linux: GOOGLE_APPLICATION_CREDENTIALS=/home/usuario/chaves-gcp/meu-projeto-key.json
GOOGLE_APPLICATION_CREDENTIALS=COLOQUE_O_CAMINHO_PARA_O_SEU_ARQUIVO_JSON_AQUI


Parte 3: Rode o Projeto!
Está tudo pronto.
Bash
npm run dev
# ou
yarn dev

Acesse http://localhost:3000 no seu navegador e teste!
🎓 Pontos de Estudo
Para entender como isso funciona, explore estes arquivos:
/pages/index.js: Veja como o Frontend (React) usa fetch para enviar o prompt para a nossa própria API, sem nunca saber sobre chaves ou credenciais.
/pages/api/generate.js: Veja como o Backend (API Route) lê o .env.local de forma segura, usa o SDK @google-cloud/aiplatform para falar com o Google e retorna a imagem para o Frontend.

