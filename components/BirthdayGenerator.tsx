"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Upload as UploadIcon,
  Image as ImageIcon,
  X,
  Sparkles,
  Loader2,
  Download,
  Wand2,
} from "lucide-react";

// Compress and resize image to reduce payload size
function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const reader2 = new FileReader();
            reader2.onload = () => resolve(reader2.result as string);
            reader2.onerror = () =>
              reject(new Error("Failed to read compressed image"));
            reader2.readAsDataURL(blob);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function BirthdayGenerator() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [theme, setTheme] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections) => {
      setError(null);
      if (fileRejections?.length > 0) {
        const error = fileRejections[0].errors[0];
        setError(error.message);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setSelectedFile(file);
      setIsUploading(true);

      try {
        const compressedImage = await compressImage(file, 1920, 1920, 0.85);
        setSelectedImage(compressedImage);
        setGeneratedImage(null); // Reset generated image when new image is uploaded
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Erro ao processar imagem. Por favor, tente novamente."
        );
        console.error("Image compression error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setGeneratedImage(null);
    setPromptUsed(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      setError("Por favor, selecione uma imagem primeiro.");
      return;
    }

    if (!theme.trim()) {
      setError("Por favor, insira o tema da festa.");
      return;
    }

    if (!age || age < 0 || age > 18) {
      setError("Por favor, insira uma idade válida (0-18 anos).");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Enviar o data URL completo para a API identificar o formato corretamente
      // A API irá extrair o base64 e detectar o mimeType automaticamente
      const imageData = selectedImage;

      const response = await fetch("/api/magic-birthday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: imageData,
          theme: theme.trim(),
          age: Number(age),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Erro ao gerar imagem");
      }

      if (data.success && data.image) {
        setGeneratedImage(data.image);
        setPromptUsed(data.prompt_used || null);
      } else {
        throw new Error("Resposta inválida da API");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao gerar foto mágica. Por favor, tente novamente."
      );
      console.error("Generation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `aniversario-magico-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = selectedImage && theme.trim() && age && age >= 0 && age <= 18;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Gerador de Aniversário Mágico
          </h1>
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>
        <p className="text-gray-400 text-sm sm:text-base">
          Transforme a foto do seu pequeno em uma obra mágica de arte
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10">
        <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <UploadIcon className="w-5 h-5" />
          1. Faça upload da foto
        </h2>
        
        {!selectedImage ? (
          <div
            {...getRootProps()}
            className={`
              min-h-[200px] p-8 rounded-lg transition-all duration-300 ease-in-out
              border-2 border-dashed cursor-pointer
              flex flex-col items-center justify-center gap-4
              ${
                isDragActive
                  ? "border-purple-400 bg-purple-900/40 scale-[1.02]"
                  : "border-purple-500/50 bg-purple-900/20 hover:border-purple-400 hover:bg-purple-900/30"
              }
              ${isUploading ? "opacity-50 cursor-wait" : ""}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <UploadIcon className="w-8 h-8 text-white" />
              </div>
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              ) : (
                <>
                  <p className="text-purple-200 font-medium text-center">
                    {isDragActive
                      ? "Solte a imagem aqui"
                      : "Arraste e solte ou clique para selecionar"}
                  </p>
                  <p className="text-gray-400 text-sm text-center">
                    PNG ou JPG até 10MB
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border border-purple-500/30 bg-purple-900/20">
              <img
                src={selectedImage}
                alt="Foto selecionada"
                className="w-full h-auto max-h-[400px] object-contain mx-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-purple-900/80 hover:bg-purple-800/90 text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-400 text-center">
                {selectedFile.name}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Theme and Age Inputs */}
      <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 space-y-4">
        <h2 className="text-xl font-semibold text-purple-300 mb-4 flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          2. Configure a magia
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="theme"
              className="block text-sm font-medium text-purple-200 mb-2"
            >
              Tema da Festa
            </label>
            <Input
              id="theme"
              type="text"
              placeholder="Ex: Patrulha Canina, Super-heróis, Princesa..."
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-purple-900/40 border-purple-500/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="age"
              className="block text-sm font-medium text-purple-200 mb-2"
            >
              Idade
            </label>
            <Input
              id="age"
              type="number"
              placeholder="Ex: 5"
              value={age}
              onChange={(e) => {
                const value = e.target.value;
                setAge(value === "" ? "" : Number(value));
              }}
              min="0"
              max="18"
              className="bg-purple-900/40 border-purple-500/50 text-white placeholder:text-gray-500 focus:border-purple-400 focus:ring-purple-400"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">Idade entre 0 e 18 anos</p>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          className={`
            bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
            text-white font-semibold text-lg px-8 py-6 rounded-xl
            shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50
            transition-all duration-300 transform hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            min-w-[200px]
          `}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando Foto Mágica...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Foto Mágica
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-200">
          <p className="text-sm font-medium">Erro: {error}</p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImage && (
        <div className="bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-purple-300 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Foto Mágica Gerada
            </h2>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-purple-500/50 text-purple-300 hover:bg-purple-900/40"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="rounded-lg overflow-hidden border border-purple-500/30 bg-purple-900/20">
            <img
              src={generatedImage}
              alt="Foto mágica gerada"
              className="w-full h-auto max-h-[600px] object-contain mx-auto"
            />
          </div>

          {promptUsed && (
            <div className="bg-purple-900/40 rounded-lg p-4 border border-purple-500/30">
              <p className="text-xs font-medium text-purple-300 mb-1">
                Prompt usado:
              </p>
              <p className="text-sm text-gray-300 italic">{promptUsed}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

