import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { AIProvider } from "@/types";

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "google").toLowerCase();
  return provider === "openai" ? "openai" : "google";
}

/**
 * Mengambil instance model AI Chat utama (misal: gemini-2.5-pro atau gpt-4o)
 */
export function getChatModel() {
  const provider = getAIProvider();

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const modelName = process.env.AI_MODEL || "gpt-4o";
    return openai(modelName);
  }

  // Default Google Gemini
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  });
  // Gunakan gemini-1.5-pro / gemini-2.5-pro
  const modelName = process.env.AI_MODEL || "gemini-1.5-pro";
  return google(modelName);
}

/**
 * Mengambil instance model AI cepat dan ringan untuk background task
 * (misal ekstraksi memori dan judul percakapan: gemini-1.5-flash atau gpt-4o-mini)
 */
export function getFastModel() {
  const provider = getAIProvider();

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const modelName = process.env.AI_FAST_MODEL || "gpt-4o-mini";
    return openai(modelName);
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  });
  const modelName = process.env.AI_FAST_MODEL || "gemini-1.5-flash";
  return google(modelName);
}

/**
 * Model Embedding Vektor
 * - Google Gemini: text-embedding-004 (768 dimensi)
 * - OpenAI: text-embedding-3-small (1536 dimensi)
 */
export function getEmbeddingModel() {
  const provider = getAIProvider();

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const modelName = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
    return openai.textEmbeddingModel(modelName);
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  });
  const modelName = process.env.EMBEDDING_MODEL || "text-embedding-004";
  return google.textEmbeddingModel(modelName);
}

/**
 * Helper fungsi untuk menghasilkan representasi vektor embedding dari string teks
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = getEmbeddingModel();
  const { embedding } = await embed({
    model: embeddingModel,
    value: text.replace(/\n/g, " ").trim(),
  });
  return embedding;
}
