
import { GoogleGenAI, Type } from "@google/genai";
import { GuidanceResult, GuidanceVerse, SummaryResult } from "../types";
import { fetchVersesByReference } from "./bibleService";

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

interface GuidanceModelResult {
  title: string;
  encouragement: string;
  prayer: string;
  nextStep: string;
  verses: {
    reference: string;
    reason: string;
    practicalApplication: string;
  }[];
}

const enrichVerseWithBibleText = async (verse: GuidanceModelResult["verses"][number]): Promise<GuidanceVerse> => {
  const verses = await fetchVersesByReference(verse.reference);
  const normalizedReference = verses.length > 0 ? verses[0].reference : verse.reference;
  const verseText = verses.length > 0
    ? verses.map((item) => `${item.reference} — ${item.text}`).join("\n")
    : "Não foi possível carregar o texto automaticamente para esta referência.";

  return {
    reference: normalizedReference,
    reason: verse.reason,
    practicalApplication: verse.practicalApplication,
    verseText
  };
};

export const getLifeGuidanceAI = async (context: string): Promise<GuidanceResult> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Situação atual da pessoa: "${context}"`,
    config: {
      systemInstruction: [
        "Você é um conselheiro cristão bíblico, pastoral e acolhedor.",
        "Analise a situação e forneça direção prática fundamentada em passagens bíblicas.",
        "Sempre retorne JSON válido no formato solicitado.",
        "Selecione entre 3 e 5 referências bíblicas objetivas, evitando repetições."
      ].join(" "),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          encouragement: { type: Type.STRING },
          prayer: { type: Type.STRING },
          nextStep: { type: Type.STRING },
          verses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                reference: { type: Type.STRING },
                reason: { type: Type.STRING },
                practicalApplication: { type: Type.STRING }
              },
              required: ["reference", "reason", "practicalApplication"]
            }
          }
        },
        required: ["title", "encouragement", "prayer", "nextStep", "verses"]
      }
    }
  });

  let parsed: GuidanceModelResult;
  try {
    parsed = JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Erro ao processar orientação do Gemini:", error);
    throw new Error("Não foi possível gerar uma orientação agora.");
  }

  const verses = await Promise.all((parsed.verses || []).slice(0, 5).map(enrichVerseWithBibleText));

  return {
    title: parsed.title || "Orientação bíblica para este momento",
    encouragement: parsed.encouragement || "Busque o Senhor em oração e permaneça firme na Palavra.",
    prayer: parsed.prayer || "Senhor, guia-me com Tua Palavra e fortalece meu coração. Amém.",
    nextStep: parsed.nextStep || "Separe alguns minutos para ler os versículos e orar com calma.",
    verses
  };
};
