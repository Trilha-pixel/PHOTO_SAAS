import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { HistoryItem, HistoryPart } from "@/lib/types";

// Initialize the Google Gen AI client with your API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Define the model ID for Gemini 2.0 Flash experimental
const MODEL_ID = "gemini-2.0-flash-exp-image-generation";

/**
 * Cria o prompt multimodal dinâmico para a IA
 * Força o uso da imagem de referência e evita duplicação do político
 */
function getGenerationPrompt(
  politicalFigure: string,
  genero: string,
  cenario: string,
  friendImageBase64: string,
  mimeType: string
) {
  // Mapeia os nomes completos para garantir que a IA entenda
  const figureName = politicalFigure.toLowerCase() === 'bolsonaro' 
    ? 'Jair Bolsonaro' 
    : 'Luiz Inácio Lula da Silva';
  
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    // 1. Descreve a cena e o político
    { text: `Gere uma fotografia realista de alta qualidade de ${figureName}.` },
    { text: `O cenário é: ${cenario}.` },
    { text: `Na foto, ${figureName} está ao lado ou abraçando outra pessoa (um ${genero}).` },
    { text: `Ambos estão sorrindo para a câmera em uma pose amigável e casual.` },
    // 2. FORÇA o uso da referência e EVITA a clonagem
    { text: `A pessoa ao lado de ${figureName} NÃO DEVE ser outra versão dele mesmo ou qualquer outro político.` },
    { text: `É ABSOLUTAMENTE CRUCIAL que o ROSTO e as CARACTERÍSTICAS FACIAIS dessa segunda pessoa sejam IDÊNTICOS aos da pessoa nesta imagem de referência:` },
    // 3. A imagem de referência (O Amigo)
    { inlineData: { mimeType, data: friendImageBase64 } },
    // 4. Instrução final de fusão
    { text: `Use o rosto da imagem de referência e o integre de forma fotorrealista no corpo do ${genero} ao lado de ${figureName}.` },
    { text: `Ajuste a iluminação, sombras e o estilo da imagem para que a fusão pareça 100% autêntica.` },
    { text: `IMPORTANTE: A pessoa da foto de referência mantém 100% da sua identidade original. ${figureName} aparece como uma segunda pessoa distinta ao lado.` }
  ];
  
  return {
    contents: [
      { role: 'user' as const, parts }
    ]
  };
}

// Define interface for the formatted history item
interface FormattedHistoryItem {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inlineData?: { data: string; mimeType: string };
  }>;
}

export async function POST(req: NextRequest) {
  try {
    // Make sure we have an API key configured
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Parse JSON request
    const requestData = await req.json().catch((err) => {
      console.error("Failed to parse JSON body:", err);
      return null;
    });
    
    if (!requestData) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Support both old format (prompt + image) and new format (politicalFigure + genero + cenario + image)
    const { 
      prompt: oldPrompt, 
      image: inputImage, 
      history,
      // New format parameters
      politicalFigure,
      genero,
      cenario
    } = requestData;

    // Validate required fields
    if (!inputImage) {
      return NextResponse.json(
        { success: false, error: "Image is required" },
        { status: 400 }
      );
    }

    // Validate image format
    if (typeof inputImage !== "string" || !inputImage.startsWith("data:")) {
      console.error("Invalid image data URL format", { inputImage });
      return NextResponse.json(
        { success: false, error: "Invalid image data URL format" },
        { status: 400 }
      );
    }

    const imageParts = inputImage.split(",");
    if (imageParts.length < 2) {
      console.error("Malformed image data URL", { inputImage });
      return NextResponse.json(
        { success: false, error: "Malformed image data URL" },
        { status: 400 }
      );
    }

    const base64Image = imageParts[1];
    const mimeType = inputImage.includes("image/png") ? "image/png" : "image/jpeg";
    
    // Check for non-empty and valid base64 (basic check)
    if (!base64Image || !/^([A-Za-z0-9+/=]+)$/.test(base64Image.replace(/\s/g, ""))) {
      console.error("Image data is empty or not valid base64", { base64Image });
      return NextResponse.json(
        { success: false, error: "Image data is empty or not valid base64" },
        { status: 400 }
      );
    }

    let response;

    try {
      // Use new format if parameters are provided
      if (politicalFigure && genero && cenario) {
        console.log("Processing image generation with new format:", { politicalFigure, genero, cenario });
        
        const promptObject = getGenerationPrompt(
          politicalFigure,
          genero,
          cenario,
          base64Image,
          mimeType
        );

        // Generate the content using the new prompt structure
        response = await ai.models.generateContent({
          model: MODEL_ID,
          contents: promptObject.contents,
          config: {
            temperature: 0.7, // Lower temperature for more consistent results
            topP: 0.95,
            topK: 40,
            responseModalities: ["Text", "Image"],
          },
        });
      } else {
        // Fallback to old format for backward compatibility
        if (!oldPrompt) {
          return NextResponse.json(
            { success: false, error: "Prompt or (politicalFigure + genero + cenario) are required" },
            { status: 400 }
          );
        }

        console.log("Processing image edit request with old format");

        // Convert history to the format expected by Gemini API
        const formattedHistory =
          history && history.length > 0
            ? history
                .map((item: HistoryItem) => {
                  return {
                    role: item.role,
                    parts: item.parts
                      .map((part: HistoryPart) => {
                        if (part.text) {
                          return { text: part.text };
                        }
                        if (part.image && item.role === "user") {
                          const imgParts = part.image.split(",");
                          if (imgParts.length > 1) {
                            return {
                              inlineData: {
                                data: imgParts[1],
                                mimeType: part.image.includes("image/png")
                                  ? "image/png"
                                  : "image/jpeg",
                              },
                            };
                          }
                        }
                        return { text: "" };
                      })
                      .filter((part) => Object.keys(part).length > 0), // Remove empty parts
                  };
                })
                .filter((item: FormattedHistoryItem) => item.parts.length > 0) // Remove items with no parts
            : [];

        // Prepare the current message parts
        const messageParts = [];

        // Add the text prompt
        messageParts.push({ text: oldPrompt });

        // Add the image to message parts
        messageParts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });

        // Add the message parts to the history
        formattedHistory.push(messageParts);

        // Generate the content
        response = await ai.models.generateContent({
          model: MODEL_ID,
          contents: formattedHistory,
          config: {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            responseModalities: ["Text", "Image"],
          },
        });
      }
    } catch (error) {
      console.error("Error in chat.sendMessage:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error in AI processing";
      return NextResponse.json(
        { success: false, error: "Gemini API error", details: errorMessage },
        { status: 500 }
      );
    }

    let textResponse = null;
    let imageData = null;
    let responseMimeType = "image/png";

    // Process the response
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      console.log("Number of parts in response:", parts.length);

      for (const part of parts) {
        if ("inlineData" in part && part.inlineData) {
          // Get the image data
          imageData = part.inlineData.data;
          responseMimeType = part.inlineData.mimeType || "image/png";
          console.log(
            "Image data received, length:",
            imageData?.length || 0,
            "MIME type:",
            responseMimeType
          );
        } else if ("text" in part && part.text) {
          // Store the text
          textResponse = part.text;
          console.log(
            "Text response received:",
            textResponse.substring(0, 50) + "..."
          );
        }
      }
    } else {
      console.error("No response from Gemini API", { response });
      return NextResponse.json(
        { success: false, error: "No response from Gemini API" },
        { status: 500 }
      );
    }

    if (!imageData) {
      console.error("No image data in Gemini response", { response });
      return NextResponse.json(
        { success: false, error: "No image data in Gemini response" },
        { status: 500 }
      );
    }

    // Return the base64 image and description as JSON
    return NextResponse.json({
      success: true,
      image: `data:${responseMimeType};base64,${imageData}`,
      description: textResponse || null
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
