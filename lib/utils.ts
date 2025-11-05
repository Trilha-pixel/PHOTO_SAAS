import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type PoliticalFigure = "bolsonaro" | "lula";
export type FriendGender = "homem" | "mulher";
export interface SceneOption { key: string; label: string; description: string }

export const SCENARIO_OPTIONS: SceneOption[] = [
  { key: "praia", label: "Praia (fim de tarde)", description: "Fim de tarde dourado na praia de Ipanema, luz lateral suave, céu parcialmente nublado, areia com marcas de passos, ondas suaves ao fundo." },
  { key: "planalto", label: "Planalto", description: "Área externa do Palácio do Planalto, Brasília, arquitetura modernista de Niemeyer ao fundo, luz diurna clara, segurança discreta desfocada ao longe." },
  { key: "cristo", label: "Cristo Redentor", description: "Mirante do Cristo Redentor, Rio de Janeiro, céu azul com nuvens leves, vista panorâmica desfocada, turistas ao fundo em bokeh." },
  { key: "paulista", label: "Avenida Paulista", description: "Calçada larga na Avenida Paulista, edifícios de vidro, bandeiras do Brasil ao longe, trânsito leve desfocado, fim de tarde." },
  { key: "congresso", label: "Congresso Nacional", description: "Gramado do Congresso Nacional, cúpulas ao fundo, céu aberto, bandeira do Brasil, composição simétrica, luz suave." },
  { key: "ibirapuera", label: "Parque do Ibirapuera", description: "Parque do Ibirapuera, árvores frondosas, lago refletindo o céu, pista de caminhada ao fundo em bokeh, luz de manhã." },
  { key: "pelourinho", label: "Pelourinho", description: "Casario colonial do Pelourinho, casas coloridas, pedras irregulares no chão, luz quente, vida urbana leve ao fundo." },
  { key: "estadio", label: "Estádio (evento)", description: "Arquibancada de estádio iluminado, gramado verde ao fundo, torcida desfocada, noite com luzes fortes e flare sutil." },
  { key: "cafe", label: "Café moderno (indoor)", description: "Café moderno com plantas, madeira clara, janela grande com luz natural, fundo em bokeh, tons quentes." },
  { key: "biblioteca", label: "Biblioteca/Escritório", description: "Biblioteca moderna, estantes ao fundo, luz difusa de teto, mesa de madeira, atmosfera serena." },
  { key: "jardim", label: "Jardim Botânico", description: "Jardim Botânico, estufa de vidro ao fundo, vegetação tropical, luz filtrada entre folhas." },
  { key: "por-do-sol", label: "Mirante (pôr do sol)", description: "Mirante com pôr do sol intenso, céu alaranjado, flare suave, silhuetas ao longe, vento leve." },
  { key: "paralelepipedo", label: "Rua antiga de paralelepípedos", description: "Rua de paralelepípedos antiga, fachadas históricas, bandeirolas, luz lateral de manhã." },
  { key: "praia-minimal", label: "Praia minimalista", description: "Praia ampla com linha do horizonte limpa, céu suave, tons pastéis, composição minimalista." },
  { key: "parede-neutra", label: "Interior (parede neutra)", description: "Ambiente interno com parede neutra cinza clara, luz difusa frontal, profundidade rasa em bokeh." }
];

export function buildComposePrompt(figure: PoliticalFigure, gender?: FriendGender, sceneDescription?: string): string {
  const name = figure === "bolsonaro" ? "Jair Bolsonaro" : "Luiz Inácio Lula da Silva";
  const genderLine = gender
    ? (gender === "homem"
        ? "A pessoa da foto é um HOMEM adulto."
        : "A pessoa da foto é uma MULHER adulta.") + " "
    : "";

  // Características físicas da figura política para diferenciação
  const figureTraits = figure === "bolsonaro"
    ? "cabelo grisalho curto, sem barba, traços característicos de Jair Bolsonaro"
    : "barba grisalha curta, cabelo grisalho curto, traços característicos de Lula";

  return (
    `INSTRUÇÕES CRÍTICAS - LEIA COM ATENÇÃO:

1. A PESSOA DA FOTO DEVE SER PRESERVADA EXATAMENTE COMO ESTÁ:
   - A pessoa da foto é INALTERÁVEL. ${genderLine}NÃO mude NADA na aparência dela.
   - Mantenha EXATAMENTE o mesmo rosto, fisionomia, cabelo, barba (se houver), pele, e todos os traços faciais.
   - A pessoa da foto NÃO pode ser transformada em ${name}.
   - A pessoa da foto NÃO pode adquirir traços de ${name}.

2. APENAS UMA FIGURA POLÍTICA DEVE APARECER:
   - ${name} deve aparecer como uma SEGUNDA pessoa DISTINTA ao lado da pessoa da foto.
   - ${name} deve ter ${figureTraits}.
   - NÃO crie dois ${name}s. NÃO crie duas pessoas da foto.
   - A imagem final deve ter EXATAMENTE 2 pessoas: a pessoa da foto (inalterada) + ${name}.

3. COMPOSIÇÃO DA CENA:
   - A pessoa da foto e ${name} devem aparecer juntos, abraçando ou próximos.
   - ${sceneDescription ? `CENÁRIO: ${sceneDescription}. ` : ""}
   - Mantenha a iluminação e perspectiva da foto original.
   - Preserve a pose e expressão facial da pessoa da foto.

4. QUALIDADE E REALISMO:
   - Imagem fotorrealista, alta qualidade, sem artefatos.
   - Mãos e braços anatomicamente corretos.
   - Fundo natural e coerente.
   - Evite: pele plástica, duplicação de pessoas, olhos desalinhados, marcas d'água.

5. USO DA IMAGEM DE REFERÊNCIA:
   - Use a foto enviada como REFERÊNCIA ABSOLUTA para a pessoa da foto.
   - A pessoa da foto DEVE ser uma cópia fiel da foto original.
   - ${name} deve ser gerado como uma segunda pessoa distinta com suas características próprias.

IMPORTANTE: A pessoa da foto mantém 100% da sua identidade original. ${name} aparece como uma segunda pessoa ao lado.`
  );
}
