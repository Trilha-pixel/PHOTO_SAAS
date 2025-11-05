// API Route para geração de imagens usando Vertex AI Imagen
// Esta rota é segura pois roda no servidor e nunca expõe as chaves de API ao cliente

import { PredictionServiceClient } from '@google-cloud/aiplatform';

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
    // 2. Extrair o prompt do corpo da requisição
    const { prompt } = req.body;

    // 3. Validar se o prompt foi fornecido
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'O campo "prompt" é obrigatório e deve ser uma string não vazia' 
      });
    }

    // 4. Carregar variáveis de ambiente
    const projectId = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION || 'us-central1';

    // 5. Validar variáveis de ambiente
    if (!projectId) {
      console.error('❌ GCP_PROJECT_ID não está configurado');
      return res.status(500).json({ 
        error: 'Falha ao gerar imagem',
        details: 'GCP_PROJECT_ID não está configurado nas variáveis de ambiente' 
      });
    }

    // 6. Inicializar o cliente do Vertex AI
    // O cliente usa automaticamente GOOGLE_APPLICATION_CREDENTIALS se estiver definido
    // ou Application Default Credentials se estiver rodando no Google Cloud
    const client = new PredictionServiceClient({
      // O cliente detecta automaticamente as credenciais via:
      // 1. GOOGLE_APPLICATION_CREDENTIALS (caminho do arquivo JSON)
      // 2. Application Default Credentials (ADC) no ambiente local
      // 3. Credenciais do ambiente do Google Cloud (produção)
    });

    // 7. Configurar o modelo e endpoint
    const model = 'imagegeneration@006';
    const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;

    // 8. Preparar a requisição para o Vertex AI
    const instances = [
      {
        prompt: prompt.trim(),
      },
    ];

    const request = {
      endpoint,
      instances,
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
      },
    };

    console.log(`📡 Enviando requisição para Vertex AI...`);
    console.log(`📍 Endpoint: ${endpoint}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    // 9. Chamar a API do Vertex AI para gerar a imagem
    const [response] = await client.predict(request);

    // 10. Extrair os bytes da imagem da resposta
    // A resposta pode vir em diferentes formatos dependendo da versão da API
    let imageBytes;
    
    // Tentar diferentes estruturas de resposta
    if (response.images && response.images.length > 0) {
      // Formato mencionado nas especificações: response.images[0]._image_bytes
      imageBytes = response.images[0]._image_bytes || response.images[0].imageBytes || response.images[0].bytesBase64Encoded;
    } else if (response.predictions && response.predictions.length > 0) {
      // Formato padrão da API: response.predictions[0]
      const prediction = response.predictions[0];
      imageBytes = prediction.bytesBase64Encoded || prediction.imageBytes || 
                   (prediction.generatedImage && (prediction.generatedImage.bytesBase64Encoded || prediction.generatedImage.imageBytes));
    } else {
      throw new Error('A resposta do Vertex AI não contém dados de imagem em formato reconhecido');
    }

    if (!imageBytes) {
      throw new Error('Não foi possível extrair os bytes da imagem da resposta');
    }

    // 11. Converter os bytes Base64 para Data URI
    // Formato: data:image/png;base64,SEU_BASE_64_AQUI
    const imageDataUri = `data:image/png;base64,${imageBytes}`;

    console.log('✅ Imagem gerada com sucesso!');

    // 12. Retornar sucesso com a imagem em Base64 Data URI
    return res.status(200).json({
      image_data: imageDataUri,
    });

  } catch (error) {
    // 13. Tratamento de erro robusto
    console.error('❌ Erro ao gerar imagem:', error);
    console.error('📋 Stack trace:', error.stack);
    
    // Extrair mensagem de erro detalhada
    let errorMessage = 'Falha ao gerar imagem';
    let errorDetails = error.message || 'Erro desconhecido';

    // Tratamento específico para erros comuns
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'Erro de conexão com o Vertex AI';
      errorDetails = 'Não foi possível conectar ao serviço do Vertex AI. Verifique sua conexão com a internet.';
    } else if (error.message?.includes('authentication') || error.message?.includes('credential')) {
      errorMessage = 'Erro de autenticação';
      errorDetails = 'Credenciais do Google Cloud inválidas ou não configuradas. Verifique GOOGLE_APPLICATION_CREDENTIALS.';
    } else if (error.message?.includes('quota') || error.message?.includes('quota')) {
      errorMessage = 'Quota excedida';
      errorDetails = 'Você excedeu a quota de requisições do Vertex AI. Verifique seu plano.';
    } else if (error.message?.includes('permission') || error.message?.includes('permission')) {
      errorMessage = 'Erro de permissão';
      errorDetails = 'A conta de serviço não tem permissão para usar o Vertex AI. Verifique as permissões IAM.';
    }

    // Retornar erro com status 500
    return res.status(500).json({
      error: errorMessage,
      details: errorDetails,
    });
  }
}

