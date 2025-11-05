import { useState } from 'react';

/**
 * Componente principal da aplicação
 * Interface minimalista para geração de imagens usando Vertex AI Imagen
 */
export default function Home() {
  // Estados da aplicação
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Função assíncrona para gerar imagem a partir do prompt
   * Faz requisição POST para /api/generate e atualiza os estados
   */
  async function handleGenerate() {
    // Resetar estados antes de iniciar
    setIsLoading(true);
    setError('');
    setImageUrl('');

    try {
      // Fazer requisição POST para a API Route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      // Verificar se a requisição foi bem-sucedida
      if (!response.ok) {
        // Tentar extrair mensagem de erro do JSON
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usar mensagem padrão
        }
        throw new Error(errorMessage);
      }

      // Extrair dados da resposta
      const data = await response.json();

      // Verificar se a resposta contém image_data
      if (!data.image_data) {
        throw new Error('Resposta da API não contém dados de imagem');
      }

      // Atualizar estado com a URL da imagem gerada
      setImageUrl(data.image_data);

    } catch (err) {
      // Tratar erros e atualizar estado de erro
      const errorMessage = err instanceof Error ? err.message : 'Falha ao gerar. Tente novamente.';
      setError(errorMessage);
      console.error('Erro ao gerar imagem:', err);
    } finally {
      // Sempre desativar loading ao finalizar
      setIsLoading(false);
    }
  }

  /**
   * Renderização da interface do usuário
   */
  return (
    <div className="app-container">
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1>Gerador de Imagens com IA</h1>
        <p style={{ color: '#888', marginTop: '8px' }}>
          Digite um prompt e gere uma imagem usando Vertex AI Imagen
        </p>
      </header>

      {/* Formulário de Entrada */}
      <div className="form-group">
        <label htmlFor="prompt">Prompt:</label>
        <input
          id="prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: um cachorro fofo no espaço"
          disabled={isLoading}
        />
      </div>

      {/* Botão de Geração */}
      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="primary"
        style={{ width: '100%', marginBottom: '24px' }}
      >
        {isLoading ? 'Gerando...' : 'Gerar Imagem'}
      </button>

      {/* Feedback Visual */}
      {/* Mensagem de Loading */}
      {isLoading && (
        <div className="loading-message">
          Gerando, aguarde...
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="error-message">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Imagem Gerada */}
      {imageUrl && (
        <div className="image-container">
          <h2>Imagem Gerada:</h2>
          <img
            src={imageUrl}
            alt="Imagem Gerada"
          />
        </div>
      )}
    </div>
  );
}

