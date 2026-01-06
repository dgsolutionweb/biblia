
import { GoogleGenAI, Type } from "@google/genai";
import { SummaryResult } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const summarizePassage = async (reference: string, text: string): Promise<SummaryResult> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Resuma o seguinte trecho da Bíblia (${reference}):\n\n${text}`,
    config: {
      systemInstruction: "Você é um teólogo e estudioso bíblico experiente. Forneça resumos claros, precisos e enriquecedores. Use linguagem acessível mas respeitosa. O retorno deve ser JSON.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          historicalContext: { type: Type.STRING }
        },
        required: ["title", "content", "keyPoints", "historicalContext"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao processar resposta do Gemini:", error);
    throw new Error("Não foi possível gerar o resumo.");
  }
};

export const searchBibleAI = async (query: string): Promise<{reference: string, reason: string}[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Onde na Bíblia fala sobre: "${query}"? Retorne uma lista de referências precisas e o motivo de cada uma ser relevante.`,
    config: {
      systemInstruction: "Retorne apenas um array JSON com objetos contendo 'reference' (ex: João 3:16) e 'reason' (breve explicação).",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            reference: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["reference", "reason"]
        }
      }
    }
  });
  
  try {
    return JSON.parse(response.text || "[]");
  } catch {
    return [];
  }
};
