import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from cwd or server folder
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '../.env'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'james_dev_secret_replace_in_prod_32_chars',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  aiProvider: (process.env.AI_PROVIDER || 'ollama') as 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'mock',
  aiModel: process.env.AI_MODEL || 'llama3',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  ollamaApiKey: process.env.OLLAMA_API_KEY || '18db265093554033a762abc6af2cd65e.W-UdIS4U-AtpIrXpKGaWPFyP',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3',
};
