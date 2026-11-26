import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { AIProvider } from "@/types";

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || "google").toLowerCase();
  return provider === "openai" ? "openai" : "google";
}

export function isAIConfigured(): boolean {
  const provider = getAIProvider();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    return Boolean(
      key && !key.includes("your_openai_api_key") && key.trim().length > 10
    );
  }
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return Boolean(
    key &&
      !key.includes("your_google_gemini_api_key") &&
      key.trim().length > 10
  );
}

export function getChatModel() {
  const provider = getAIProvider();

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
    const modelName = process.env.AI_MODEL || "gpt-4o";
    return openai(modelName);
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
  });
  const modelName = process.env.AI_MODEL || "gemini-3.5-flash-lite";
  return google(modelName);
}

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
  const modelName = process.env.AI_FAST_MODEL || "gemini-3.1-flash-lite";
  return google(modelName);
}

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
  const modelName = process.env.EMBEDDING_MODEL || "gemini-embedding-001";
  const outputDimensionality = process.env.EMBEDDING_DIMENSIONS
    ? parseInt(process.env.EMBEDDING_DIMENSIONS, 10)
    : 768;
  return google.textEmbeddingModel(modelName, {
    outputDimensionality,
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel = getEmbeddingModel();
  const { embedding } = await embed({
    model: embeddingModel,
    value: text.replace(/\n/g, " ").trim(),
  });
  return embedding;
}
