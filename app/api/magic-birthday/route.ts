import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { generateImageWithVertexAI } from "@/lib/vertex-ai";

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * PASSO 1: O OLHO (OpenAI GPT-4o Vision)
 * Analisa a imagem e retorna descrição da criança
 */
async function analyzeImageWithVision(imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
  try {
    // Validar que temos um base64 válido
    if (!imageBase64 || imageBase64.length === 0) {
      throw new Error("Base64 da imagem está vazio");
    }

    // Garantir que o mimeType seja válido
    const validMimeType = mimeType === "image/png" ? "image/png" : "image/jpeg";
    
    console.log(`📸 Processando imagem: ${validMimeType}, tamanho base64: ${imageBase64.length} chars`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em descrever crianças para artistas digitais. Analise a foto e descreva APENAS as características físicas: Idade aparente, cor/tipo de cabelo, cor dos olhos, tom de pele, expressão facial e roupas atuais. Seja clínico e objetivo."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${validMimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const childDescription = response.choices[0]?.message?.content;
    if (!childDescription) {
      throw new Error("Não foi possível obter descrição da imagem da API OpenAI");
    }

    return childDescription.trim();
  } catch (error) {
    console.error("Erro no PASSO 1 (Vision):", error);
    
    // Melhorar mensagens de erro específicas
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("Chave da API OpenAI inválida ou não configurada");
      }
      if (error.message.includes("rate_limit")) {
        throw new Error("Limite de requisições da OpenAI excedido. Tente novamente em alguns minutos");
      }
      if (error.message.includes("invalid")) {
        throw new Error("Formato de imagem inválido. Use PNG ou JPEG");
      }
    }
    
    throw new Error(`Erro ao analisar imagem: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * PASSO 2: O CÉREBRO (PromptBaby Logic)
 * Gera o prompt final para geração de imagem
 */
async function generateFinalPrompt(
  childDescription: string,
  theme: string,
  age: number
): Promise<string> {
  try {
    const systemPrompt = `Você é o *PromptBaby Studio*, um Designer de Prompts Infantis.
OBJETIVO: Transformar a descrição de uma criança e um tema em um prompt de imagem otimizado para Vertex AI.
REGRAS:
- Mantenha fidelidade facial absoluta baseada na descrição.
- Estilo fotográfico de estúdio, iluminação suave, 8k.
- Nunca gere conteúdo sensível.
- Output: APENAS o prompt em inglês final, sem introduções.

ESTRUTURA DO PROMPT FINAL QUE VOCÊ DEVE GERAR:
"A hyper-realistic studio portrait of [childDescription], [age] years old, wearing [costume description based on theme], in a [background based on theme]. Soft studio lighting, natural skin texture, cinematic composition. 8k resolution. Theme reference: [theme]."`;

    const userMessage = `Criança: ${childDescription}. Idade: ${age}. Tema: ${theme}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const finalPrompt = response.choices[0]?.message?.content;
    if (!finalPrompt) {
      throw new Error("Não foi possível gerar o prompt final");
    }

    return finalPrompt.trim();
  } catch (error) {
    console.error("Erro no PASSO 2 (PromptBaby):", error);
    throw new Error(`Erro ao gerar prompt final: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Handler POST da rota /api/magic-birthday
 */
export async function POST(req: NextRequest) {
  try {
    // Validar API Key do OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY não está configurado");
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY não está configurado" },
        { status: 500 }
      );
    }

    // Parse do corpo da requisição
    const requestData = await req.json().catch((err) => {
      console.error("Erro ao parsear JSON:", err);
      return null;
    });

    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Extrair parâmetros
    const { imageBase64, theme, age } = requestData;

    // Validar parâmetros obrigatórios
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { success: false, error: "imageBase64 é obrigatório e deve ser uma string" },
        { status: 400 }
      );
    }

    if (!theme || typeof theme !== "string") {
      return NextResponse.json(
        { success: false, error: "theme é obrigatório e deve ser uma string" },
        { status: 400 }
      );
    }

    if (!age || typeof age !== "number" || age < 0 || age > 18) {
      return NextResponse.json(
        { success: false, error: "age é obrigatório e deve ser um número entre 0 e 18" },
        { status: 400 }
      );
    }

    // Remover prefixo data URL se presente e detectar mimeType
    let base64Image = imageBase64;
    let mimeType = "image/jpeg"; // padrão
    
    if (imageBase64.includes(",")) {
      const parts = imageBase64.split(",");
      const prefix = parts[0];
      base64Image = parts[1];
      
      // Detectar mimeType do prefixo
      if (prefix.includes("image/png")) {
        mimeType = "image/png";
      } else if (prefix.includes("image/jpeg") || prefix.includes("image/jpg")) {
        mimeType = "image/jpeg";
      }
    }

    // Validar base64
    const cleanBase64 = base64Image.replace(/\s/g, "");
    if (!base64Image || !/^([A-Za-z0-9+/=]+)$/.test(cleanBase64)) {
      return NextResponse.json(
        { success: false, error: "imageBase64 inválido - formato base64 incorreto" },
        { status: 400 }
      );
    }

    // Validar tamanho mínimo
    if (cleanBase64.length < 100) {
      return NextResponse.json(
        { success: false, error: "Imagem muito pequena ou inválida" },
        { status: 400 }
      );
    }

    console.log("🎂 Iniciando Gerador de Aniversário Mágico");
    console.log("📋 Parâmetros:", { theme, age, imageFormat: mimeType, imageSize: `${(cleanBase64.length * 3 / 4 / 1024).toFixed(2)} KB` });

    // PASSO 1: O OLHO - Analisar imagem
    let childDescription: string;
    try {
      console.log("👁️ PASSO 1: Analisando imagem com GPT-4o Vision...");
      childDescription = await analyzeImageWithVision(cleanBase64, mimeType);
      console.log("✅ Descrição obtida:", childDescription.substring(0, 100) + "...");
    } catch (error) {
      console.error("❌ Erro no PASSO 1:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao analisar imagem",
          details: errorMessage,
        },
        { status: 500 }
      );
    }

    // PASSO 2: O CÉREBRO - Gerar prompt final
    let finalPrompt: string;
    try {
      console.log("🧠 PASSO 2: Gerando prompt final com PromptBaby Studio...");
      finalPrompt = await generateFinalPrompt(childDescription, theme, age);
      console.log("✅ Prompt final gerado:", finalPrompt.substring(0, 100) + "...");
    } catch (error) {
      console.error("❌ Erro no PASSO 2:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao gerar prompt final",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // PASSO 3: A MÃO - Gerar imagem com Vertex AI
    let imageBytes: string;
    try {
      console.log("🖼️ PASSO 3: Gerando imagem com Vertex AI...");
      imageBytes = await generateImageWithVertexAI(finalPrompt);
      console.log("✅ Imagem gerada com sucesso!");
    } catch (error) {
      console.error("❌ Erro no PASSO 3:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao gerar imagem com Vertex AI",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }

    // Retornar sucesso com imagem em base64
    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${imageBytes}`,
      prompt_used: finalPrompt,
    });

  } catch (error) {
    console.error("❌ Erro geral no Gerador de Aniversário Mágico:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao processar requisição",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

