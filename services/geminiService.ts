import { GoogleGenAI } from "@google/genai";
import { Order, MenuItem, Ingredient } from '../types';

// Prefer Vite-exposed vars; fallback to non-prefixed if user set GEMINI_API_KEY only
const GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || (import.meta.env.GEMINI_API_KEY as string | undefined);

if (!GEMINI_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Missing VITE_GEMINI_API_KEY in .env.local. AI features will return fallback text.');
}

const ai = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

// Using Gemini 3 Pro with High Thinking Budget for Complex Analysis
export const analyzeBusinessData = async (
  query: string,
  salesData: Order[],
  inventory: Ingredient[],
  menu: MenuItem[]
) => {
  try {
    if (!ai) {
      return 'AI disabled: Provide VITE_GEMINI_API_KEY in .env.local to enable analysis.';
    }

    const context = `
      You are an expert Restaurant Business Analyst AI.
      \n      Here is the current restaurant data:
      \n      Inventory Status:
      ${JSON.stringify(inventory.map(i => ({ name: i.name, stock: i.stock, unit: i.unit, min: i.minStockLevel })))}
      \n      Menu Items & Margins:
      ${JSON.stringify(menu.map(m => ({ name: m.name, price: m.price, cost: m.cost, profit: m.price - m.cost })))}
      \n      Recent Sales (Last 3 days sample):
      ${JSON.stringify(salesData.slice(0, 50).map(o => ({ total: o.total, date: o.createdAt, payment: o.paymentMethod })))}
      \n      User Question: "${query}"
      \n      Please provide a detailed, strategic answer. Use markdown for formatting. 
      If the stock is low, warn the user. 
      If sales are trending, mention it.
      Focus on profitability and efficiency.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: context,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for deep analysis
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "I encountered an error analyzing your business data. Please check your API key.";
  }
};

// Faster model for quick tasks like description generation
export const generateMenuDescription = async (itemName: string, ingredients: string[]) => {
  try {
    if (!ai) return "AI disabled";
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, appetizing menu description (max 20 words) for a dish named "${itemName}" containing: ${ingredients.join(', ')}.`,
    });
    return response.text;
  } catch (error) {
    return "Delicious and fresh.";
  }
};