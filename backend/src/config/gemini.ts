import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './index';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export const getGeminiModel = (modelName: string = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

export default genAI;
