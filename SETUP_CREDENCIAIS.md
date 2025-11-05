# 🔑 Guia Rápido: Configurar Credenciais do Google Cloud

## Problema: Erro de Autenticação

Se você está recebendo erro "Erro de autenticação" ao tentar gerar imagens, significa que as credenciais do Google Cloud não estão configuradas corretamente.

## Solução Passo a Passo

### 1. Obter o Arquivo JSON da Service Account

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto (ou crie um novo)
3. Vá em **IAM & Admin** > **Service Accounts**
4. Clique em **Create Service Account**
5. Preencha:
   - **Name**: `vertex-ai-generator`
   - **Description**: `Para geração de imagens com Vertex AI`
6. Clique em **Create and Continue**
7. Na seção **Grant this service account access to project**, adicione:
   - Role: **Vertex AI User** (`roles/aiplatform.user`)
8. Clique em **Continue** > **Done**
9. Clique nos **três pontos** (⋮) ao lado da Service Account criada
10. Selecione **Manage Keys**
11. Clique em **Add Key** > **Create new key**
12. Selecione **JSON**
13. Clique em **Create** - o arquivo será baixado automaticamente

### 2. Configurar o arquivo .env.local

Abra o arquivo `.env.local` na raiz do projeto e configure:

#### Opção A: Usar Caminho do Arquivo JSON

```env
GCP_PROJECT_ID=seu-project-id-aqui
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/caminho/completo/para/seu/arquivo.json
```

**Exemplos de caminho:**
- macOS/Linux: `/Users/seu-usuario/Downloads/service-account-key.json`
- Windows: `C:/Users/seu-usuario/Downloads/service-account-key.json`
- Caminho relativo: `./chaves/service-account-key.json`

#### Opção B: Usar JSON Inline (Recomendado para Vercel/Produção)

1. Abra o arquivo JSON baixado
2. Copie TODO o conteúdo (é um JSON grande)
3. Cole no `.env.local` assim:

```env
GCP_PROJECT_ID=seu-project-id-aqui
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"seu-projeto","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

⚠️ **IMPORTANTE**: O JSON deve estar em UMA LINHA, sem quebras de linha!

### 3. Verificar o Project ID

O `GCP_PROJECT_ID` pode ser encontrado:
- No arquivo JSON baixado (campo `project_id`)
- No Console do Google Cloud (topo da página, ao lado do nome do projeto)
- Na URL: `https://console.cloud.google.com/home/dashboard?project=SEU_PROJECT_ID`

### 4. Reiniciar o Servidor

Após configurar o `.env.local`:

```bash
# Pare o servidor (Ctrl+C ou Cmd+C)
# Depois inicie novamente:
npm run dev
```

### 5. Verificar os Logs

Quando você tentar gerar uma imagem, observe os logs no terminal:

- ✅ `✅ Usando GOOGLE_APPLICATION_CREDENTIALS (arquivo)` - Sucesso!
- ✅ `✅ Usando GOOGLE_APPLICATION_CREDENTIALS_JSON` - Sucesso!
- ❌ `❌ Erro ao obter token:` - Problema de autenticação

## Problemas Comuns

### "Arquivo de credenciais não encontrado"
- Verifique se o caminho está correto
- Use caminho absoluto se possível
- No macOS/Linux, caminhos começam com `/`
- No Windows, use `/` ou `\\` (não `\` sozinho)

### "Erro ao parsear JSON"
- Verifique se o arquivo JSON está válido
- Se usar JSON inline, deve estar em UMA LINHA
- Não adicione quebras de linha no JSON inline

### "Token de acesso vazio"
- Verifique se a Service Account tem a role `Vertex AI User`
- Verifique se o projeto tem faturamento habilitado
- Verifique se a API do Vertex AI está ativada

## Ainda com Problemas?

1. Verifique os logs do terminal quando você clica em "Gerar"
2. Verifique se o arquivo `.env.local` está na raiz do projeto
3. Verifique se não há espaços extras nas variáveis
4. Reinicie o servidor após qualquer mudança no `.env.local`

