import { AIProvider } from './types.js';
import { MockProvider } from './mockProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { OllamaProvider } from './ollamaProvider.js';
import { config } from '../config.js';

export function getAIProvider(
  overrideProvider?: string,
  apiKey?: string,
  baseUrl?: string,
  model?: string
): AIProvider {
  const providerType = (overrideProvider || config.aiProvider).toLowerCase();

  switch (providerType) {
    case 'gemini':
      return new GeminiProvider(apiKey || config.geminiApiKey, model || config.aiModel || 'gemini-1.5-flash');
    case 'openai':
      return new OpenAIProvider(apiKey || config.openaiApiKey, model || config.aiModel || 'gpt-4o-mini');
    case 'ollama':
      return new OllamaProvider(
        apiKey || config.ollamaApiKey,
        baseUrl || config.ollamaBaseUrl,
        model || config.ollamaModel || 'llama3'
      );
    case 'mock':
    default:
      return new MockProvider();
  }
}
