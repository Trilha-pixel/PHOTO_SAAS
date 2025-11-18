// API Route para geração de imagens usando Vertex AI Imagen
// Esta rota é segura pois roda no servidor e nunca expõe as chaves de API ao cliente

import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Helper para obter token de acesso do Google Cloud
 */
async function getAccessToken() {
  let auth;
  
  // Opção 1: Se temos credenciais JSON inline (Service Account)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      // Tentar parsear o JSON - pode estar com quebras de linha ou espaços extras
      let jsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.trim();
      
      // Remover quebras de linha desnecessárias e espaços extras
      jsonString = jsonString.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      
      const credentials = JSON.parse(jsonString);
      
      // Validar se é um JSON válido de Service Account
      if (!credentials.type || credentials.type !== 'service_account') {
        throw new Error('O JSON não parece ser uma Service Account válida. Certifique-se de que o JSON contém "type": "service_account"');
      }
      
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      console.log('✅ Usando GOOGLE_APPLICATION_CREDENTIALS_JSON');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Erro ao parsear GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error.message}. Verifique se o JSON está completo e válido. Dica: o JSON deve estar em UMA ÚNICA LINHA no .env.local, sem quebras.`);
      }
      throw new Error(`Erro ao processar GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error.message}`);
    }
  } 
  // Opção 2: Se temos caminho para arquivo JSON
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS.trim();
    
    // Verificar se parece ser um caminho de arquivo (não um token ou string curta)
    if (!credentialsPath.includes('/') && !credentialsPath.includes('\\') && credentialsPath.length < 50) {
      throw new Error(`GOOGLE_APPLICATION_CREDENTIALS deve ser um caminho para o arquivo JSON da Service Account, não um token. O valor atual "${credentialsPath.substring(0, 30)}..." não parece ser um caminho válido. Configure o caminho completo para o arquivo JSON baixado do Google Cloud Console.`);
    }
    
    // Resolver caminho relativo para absoluto
    const absolutePath = path.isAbsolute(credentialsPath) 
      ? credentialsPath 
      : path.resolve(process.cwd(), credentialsPath);
    
    console.log(`🔍 Verificando arquivo de credenciais: ${absolutePath}`);
    
    if (!existsSync(absolutePath)) {
      throw new Error(`Arquivo de credenciais não encontrado: ${absolutePath}. Verifique se o caminho está correto no .env.local. O arquivo deve ser o JSON baixado do Google Cloud Console (Service Account > Keys > Create Key > JSON).`);
    }
    
    try {
      const credentialsContent = readFileSync(absolutePath, 'utf8');
      const credentials = JSON.parse(credentialsContent);
      
      // Validar se é um JSON válido de Service Account
      if (!credentials.type || credentials.type !== 'service_account') {
        throw new Error('O arquivo JSON não parece ser uma Service Account válida. Certifique-se de baixar o arquivo correto do Google Cloud Console.');
      }
      
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      console.log('✅ Usando GOOGLE_APPLICATION_CREDENTIALS (arquivo)');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Arquivo de credenciais não encontrado: ${absolutePath}`);
      } else if (error instanceof SyntaxError) {
        throw new Error(`Erro ao parsear arquivo JSON de credenciais: ${error.message}. Verifique se o arquivo está correto.`);
      } else {
        throw new Error(`Erro ao ler arquivo de credenciais: ${error.message}`);
      }
    }
  } 
  // Opção 3: Tentar usar Application Default Credentials (ADC)
  else {
    console.log('⚠️ Tentando usar Application Default Credentials (ADC)...');
    auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Token de acesso vazio. Verifique suas credenciais.');
    }
    
    return accessToken.token;
  } catch (error) {
    if (error.message?.includes('Could not load the default credentials')) {
      throw new Error('Credenciais não encontradas. Configure GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_APPLICATION_CREDENTIALS_JSON no arquivo .env.local');
    }
    throw error;
  }
}

/**
 * Handler principal da API Route
 * Aceita apenas requisições POST e retorna imagens geradas pela Vertex AI
 */
export default async function handler(req, res) {
  // 1. Verificar se o método é POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Apenas requisições POST são permitidas' 
    });
  }

  try {
    console.log('📥 Recebida requisição POST para /api/generate');
    console.log('🔍 Variáveis de ambiente disponíveis:', {
      hasProjectId: !!process.env.GCP_PROJECT_ID,
      hasCredentialsPath: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      hasCredentialsJSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      hasApiKey: !!process.env.VERTEX_AI_API_KEY,
      location: process.env.GCP_LOCATION || 'us-central1',
    });
    
    // 2. Extrair o prompt do corpo da requisição
    const { prompt } = req.body;
    console.log('📝 Prompt recebido:', prompt?.substring(0, 50) + '...');

    // 3. Validar se o prompt foi fornecido
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('❌ Prompt inválido ou vazio');
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'O campo "prompt" é obrigatório e deve ser uma string não vazia' 
      });
    }

    // 4. Carregar variáveis de ambiente
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'us-central1';

    console.log('🔧 Configurações:', { projectId: projectId ? '✅' : '❌', location });

    // 5. Validar variáveis de ambiente
    // Se não temos API Key, precisamos de Project ID
    if (!process.env.VERTEX_AI_API_KEY && !projectId) {
      console.error('❌ GCP_PROJECT_ID não está configurado e VERTEX_AI_API_KEY também não');
      return res.status(500).json({ 
        error: 'Configuração necessária',
        details: 'Configure VERTEX_AI_API_KEY OU (GCP_PROJECT_ID + credenciais). Crie um arquivo .env.local na raiz do projeto e configure as variáveis conforme o arquivo .env.local.example. Veja o README.md para instruções completas.' 
      });
    }

    // 6. Obter token de acesso
    console.log('🔑 Obtendo token de acesso...');
    let accessToken;
    
    // IMPORTANTE: Vertex AI não aceita API Keys simples - requer OAuth2 (Service Account)
    // Se VERTEX_AI_API_KEY estiver configurada, vamos tentar, mas provavelmente falhará
    if (process.env.VERTEX_AI_API_KEY) {
      console.log('⚠️ VERTEX_AI_API_KEY detectada, mas Vertex AI requer OAuth2');
      console.log('⚠️ Tentando usar API Key (pode falhar - Vertex AI geralmente não aceita API Keys)');
      accessToken = null; // Não precisa de token, usa API Key diretamente
    } else {
      // Opção 2: Usar Service Account para obter token
      try {
        accessToken = await getAccessToken();
        console.log('✅ Token obtido com sucesso');
      } catch (authError) {
        console.error('❌ Erro ao obter token:', authError.message);
        return res.status(500).json({
          error: 'Erro de autenticação',
          details: `Não foi possível autenticar com Google Cloud: ${authError.message}. Verifique se GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_APPLICATION_CREDENTIALS_JSON ou VERTEX_AI_API_KEY está configurado corretamente no arquivo .env.local.`
        });
      }
    }

    // 7. Configurar o modelo e endpoint
    const model = 'imagegeneration@006';
    
    // Se temos API Key, usar endpoint público com API Key
    // Senão, usar endpoint com autenticação Bearer
    let endpoint;
    let headers;
    
    if (process.env.VERTEX_AI_API_KEY) {
      // Tentar endpoint público com API Key (geralmente não funciona para Vertex AI)
      // Vertex AI requer endpoint regional com OAuth2
      endpoint = `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:predict`;
      headers = {
        'Content-Type': 'application/json',
      };
      // API Key será adicionada como query parameter
      endpoint = `${endpoint}?key=${process.env.VERTEX_AI_API_KEY}`;
      console.log('⚠️ Usando endpoint público com API Key (pode não funcionar)');
    } else {
      endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
      headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };
    }

    // 8. Preparar a requisição para o Vertex AI
    const requestBody = {
      instances: [
        {
          prompt: prompt.trim(),
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
      },
    };

    console.log(`📡 Enviando requisição para Vertex AI...`);
    console.log(`📍 Endpoint: ${endpoint}`);

    // 9. Chamar a API do Vertex AI usando fetch (REST API)
    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log(`📊 Status da resposta: ${apiResponse.status}`);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ Erro da API:', errorText);
      
      // Tentar parsear como JSON para obter mensagem mais detalhada
      let errorMessage = `Vertex AI retornou erro ${apiResponse.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        } else if (errorJson.error) {
          errorMessage = JSON.stringify(errorJson.error);
        } else {
          errorMessage = JSON.stringify(errorJson);
        }
      } catch {
        // Se não for JSON, usar o texto direto
        errorMessage = errorText.substring(0, 500);
      }
      
      throw new Error(`${errorMessage} (Status: ${apiResponse.status})`);
    }

    // 10. Extrair dados da resposta
    const responseData = await apiResponse.json();
    console.log('📦 Resposta recebida, processando...');

    // 11. Extrair os bytes da imagem da resposta
    let imageBytes;
    
    if (responseData.predictions && responseData.predictions.length > 0) {
      const prediction = responseData.predictions[0];
      imageBytes = prediction.bytesBase64Encoded || 
                   prediction.imageBytes || 
                   (prediction.generatedImage && (prediction.generatedImage.bytesBase64Encoded || prediction.generatedImage.imageBytes));
    } else {
      console.error('❌ Estrutura de resposta não reconhecida:', JSON.stringify(responseData, null, 2).substring(0, 500));
      throw new Error('A resposta do Vertex AI não contém predictions. Verifique os logs do servidor.');
    }

    if (!imageBytes) {
      console.error('❌ Não foi possível extrair bytes da imagem');
      throw new Error('Não foi possível extrair os bytes da imagem da resposta');
    }

    console.log(`✅ Imagem gerada com sucesso! Tamanho: ${imageBytes.length} caracteres`);

    // 12. Converter os bytes Base64 para Data URI
    const imageDataUri = `data:image/png;base64,${imageBytes}`;

    // 13. Retornar sucesso com a imagem em Base64 Data URI
    return res.status(200).json({
      image_data: imageDataUri,
    });

  } catch (error) {
    // 14. Tratamento de erro robusto
    console.error('❌ Erro ao gerar imagem:', error);
    console.error('📋 Mensagem de erro:', error.message);
    console.error('📋 Stack trace:', error.stack);
    
    // Extrair mensagem de erro detalhada
    let errorMessage = 'Falha ao gerar imagem';
    let errorDetails = error.message || 'Erro desconhecido';

    // Tratamento específico para erros comuns
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Erro de conexão com o Vertex AI';
      errorDetails = 'Não foi possível conectar ao serviço do Vertex AI. Verifique sua conexão com a internet.';
    } else if (error.message?.includes('API keys are not supported') || error.message?.includes('UNAUTHENTICATED')) {
      errorMessage = 'API Key não suportada pelo Vertex AI';
      errorDetails = 'O Vertex AI não aceita API Keys simples. Você precisa usar autenticação OAuth2 com Service Account. Remova VERTEX_AI_API_KEY do .env.local e configure GOOGLE_APPLICATION_CREDENTIALS_JSON com o JSON completo da Service Account (em uma única linha, sem quebras).';
    } else if (error.message?.includes('authentication') || error.message?.includes('credential') || error.message?.includes('token') || error.message?.includes('Unauthorized') || error.message?.includes('403')) {
      errorMessage = 'Erro de autenticação';
      errorDetails = 'Credenciais do Google Cloud inválidas ou não configuradas. O Vertex AI requer Service Account (OAuth2), não API Keys. Configure GOOGLE_APPLICATION_CREDENTIALS ou GOOGLE_APPLICATION_CREDENTIALS_JSON no arquivo .env.local';
    } else if (error.message?.includes('quota') || error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'Quota excedida';
      errorDetails = 'Você excedeu a quota de requisições do Vertex AI. Verifique seu plano.';
    } else if (error.message?.includes('permission') || error.message?.includes('permission') || error.message?.includes('403')) {
      errorMessage = 'Erro de permissão';
      errorDetails = 'A conta de serviço não tem permissão para usar o Vertex AI. Verifique as permissões IAM.';
    } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      errorMessage = 'Modelo não encontrado';
      errorDetails = 'O modelo do Vertex AI não foi encontrado. Verifique se a API está ativada e se o modelo está disponível na região configurada.';
    } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
      errorMessage = 'Requisição inválida';
      errorDetails = `A requisição para o Vertex AI foi rejeitada: ${error.message}`;
    }

    // Retornar erro com status 500 e mensagem detalhada
    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
      // Incluir mensagem original para debug (apenas em desenvolvimento)
      ...(process.env.NODE_ENV === 'development' && { originalError: error.message }),
    });
  }
}

