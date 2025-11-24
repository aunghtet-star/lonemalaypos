import { GoogleGenAI } from "@google/genai";
import { Order, MenuItem, Ingredient } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using Gemini 3 Pro with High Thinking Budget for Complex Analysis
export const analyzeBusinessData = async (
  query: string,
  salesData: Order[],
  inventory: Ingredient[],
  menu: MenuItem[]
) => {
  try {
    const context = `
      You are an expert Restaurant Business Analyst AI.
      
      Here is the current restaurant data:
      
      Inventory Status:
      ${JSON.stringify(inventory.map(i => ({ name: i.name, stock: i.stock, unit: i.unit, min: i.minStockLevel })))}
      
      Menu Items & Margins:
      ${JSON.stringify(menu.map(m => ({ name: m.name, price: m.price, cost: m.cost, profit: m.price - m.cost })))}
      
      Recent Sales (Last 3 days sample):
      ${JSON.stringify(salesData.slice(0, 50).map(o => ({ total: o.total, date: o.createdAt, payment: o.paymentMethod })))}
      
      User Question: "${query}"
      
      Please provide a detailed, strategic answer. Use markdown for formatting. 
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Write a short, appetizing menu description (max 20 words) for a dish named "${itemName}" containing: ${ingredients.join(', ')}.`,
    });
    return response.text;
  } catch (error) {
    return "Delicious and fresh.";
  }
};