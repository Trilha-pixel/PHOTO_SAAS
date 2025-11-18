import { GoogleAuth } from 'google-auth-library';

/**
 * Helper para obter token de acesso do Google Cloud
 */
export async function getAccessToken(): Promise<string> {
  let auth;
  
  // Opção 1: Se temos credenciais JSON inline (Service Account)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      let jsonString = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.trim();
      jsonString = jsonString.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      
      const credentials = JSON.parse(jsonString);
      
      if (!credentials.type || credentials.type !== 'service_account') {
        throw new Error('O JSON não parece ser uma Service Account válida.');
      }
      
      auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Erro ao parsear GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error.message}`);
      }
      throw new Error(`Erro ao processar GOOGLE_APPLICATION_CREDENTIALS_JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  } 
  // Opção 2: Tentar usar Application Default Credentials (ADC)
  else {
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
    if (error instanceof Error && error.message?.includes('Could not load the default credentials')) {
      throw new Error('Credenciais não encontradas. Configure GOOGLE_APPLICATION_CREDENTIALS_JSON no arquivo .env.local');
    }
    throw error;
  }
}

/**
 * Gera uma imagem usando Vertex AI Imagen
 * @param prompt - O prompt de texto para geração da imagem
 * @returns A imagem em base64
 */
export async function generateImageWithVertexAI(prompt: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || 'us-central1';
  const model = 'imagegeneration@006';

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID não está configurado no .env.local');
  }

  // Obter token de acesso
  const accessToken = await getAccessToken();

  // Configurar endpoint
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // Preparar requisição
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

  // Chamar API do Vertex AI
  const apiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    let errorMessage = `Vertex AI retornou erro ${apiResponse.status}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || JSON.stringify(errorJson.error || errorJson);
    } catch {
      errorMessage = errorText.substring(0, 500);
    }
    
    throw new Error(`${errorMessage} (Status: ${apiResponse.status})`);
  }

  // Extrair imagem da resposta
  const responseData = await apiResponse.json();
  
  if (!responseData.predictions || responseData.predictions.length === 0) {
    throw new Error('A resposta do Vertex AI não contém predictions.');
  }

  const prediction = responseData.predictions[0];
  const imageBytes = prediction.bytesBase64Encoded || 
                     prediction.imageBytes || 
                     (prediction.generatedImage && (prediction.generatedImage.bytesBase64Encoded || prediction.generatedImage.imageBytes));

  if (!imageBytes) {
    throw new Error('Não foi possível extrair os bytes da imagem da resposta');
  }

  return imageBytes;
}

