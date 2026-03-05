import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractFoodMenuData(fileBase64: string, mimeType: string, customInstructions: string) {
  const prompt = `You are an expert data extractor. Extract EVERY SINGLE menu item from the provided restaurant menu. Do not skip any items. Do not summarize. It is critical that the extraction is 100% complete.
${customInstructions ? `\nUser provided custom instructions/structure:\n${customInstructions}\n` : ''}
Extract the Name, Description, Price, Category, Variations (e.g., sizes and their prices), and Options (e.g., add-ons, bread choices, sides and their prices).
If a price is not found, use 0.
For ImageUrl, use a placeholder like "https://picsum.photos/400/300".
For Variations and Options, generate a unique string ID (e.g., timestamp-like "1771796424750") for each item.

CRITICAL INSTRUCTIONS FOR OPTIONS:
Use your analysis knowledge to infer and create options where they logically apply to a particular food category or item description, even if not explicitly listed next to the item:
1. Steak Meals: Add meat preparation options (Rare, Medium Rare, Medium, Medium to Well Done, Well Done) with price 0.
2. Breakfast Meals (with eggs): Add egg preparation options (Scrambled, Poached, Sunny Side, Fried) with price 0.
3. Bread Options: If a meal comes with toast or bread, add "White Bread" and "Brown Bread" options with price 0. If the menu explicitly lists other bread options, add those too.
4. Burgers: If the menu has a general "Sauces" section (e.g., Cheese Sauce, Mushroom Sauce), add those sauces as options to the Burger items with their respective prices. If the menu says "Served with chips or salad", add "Chips" and "Salad" as options with price 0.

Return the data strictly in the requested JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      },
      prompt,
    ],
    config: {
      systemInstruction: "You are a meticulous data extraction assistant. Your primary goal is to extract EVERY SINGLE item from the provided menu without missing a single one. Take your time to scan the entire document. Do not truncate the output.",
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                Name: { type: Type.STRING, description: "Name of the menu item" },
                Description: { type: Type.STRING, description: "Description of the menu item" },
                Price: { type: Type.NUMBER, description: "Base price of the item" },
                Category: { type: Type.STRING, description: "Category of the item, e.g., Breakfast, Burgers" },
                ImageUrl: { type: Type.STRING, description: "Placeholder image URL" },
                Variations: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER }
                    }
                  },
                  description: "Variations of the item, e.g., Double, Tripple"
                },
                Options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER }
                    }
                  },
                  description: "Options or add-ons for the item, e.g., Brown Bread, Chips, Cheese Sauce"
                }
              }
            }
          },
          errors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List any items, sections, or text from the menu that could not be parsed, were illegible, or had missing information."
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const parsed = JSON.parse(text);
  return { items: parsed.items || [], errors: parsed.errors || [] };
}

export async function extractDrinkMenuData(fileBase64: string, mimeType: string, customInstructions: string) {
  const prompt = `You are an expert data extractor. Extract EVERY SINGLE DRINK item from the provided restaurant menu. Do not skip any drinks. Do not summarize. It is critical that the extraction is 100% complete. Ignore food items.
${customInstructions ? `\nUser provided custom instructions/structure:\n${customInstructions}\n` : ''}
Extract the following for each drink:
- AlcoholicStatus: Categorize as "Alcohol" or "Non Alcohol" based on your knowledge of the drink.
- Category: The specific category of the drink (e.g., Whiskey, Brandy, Water, Milkshake, Soft Drinks, Beer, Cider).
- Name: The name of the drink (e.g., Jack Daniels, Fanta Orange, Strawberry Milkshake, Still Water, Heineken Silver).
- Unknown: Always set this to the exact string "Unknown".
- Price: The price of the drink. If not found, use 0.

CRITICAL INSTRUCTION FOR DRINK VARIATIONS:
If a drink has multiple sizes or variations (e.g., Wine sold by the Glass and by the Bottle, or a Spirit sold as Single and Double), you MUST create a SEPARATE item for each variation. 
For example, if 'Merlot' is 50 for a Glass and 150 for a Bottle, create one item named 'Merlot (Glass)' with price 50, and another item named 'Merlot (Bottle)' with price 150. Both should have the same Category and AlcoholicStatus.

Return the data strictly in the requested JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      },
      prompt,
    ],
    config: {
      systemInstruction: "You are a meticulous data extraction assistant. Your primary goal is to extract EVERY SINGLE drink item from the provided menu without missing a single one. Take your time to scan the entire document. Do not truncate the output.",
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                AlcoholicStatus: { type: Type.STRING, description: "'Alcohol' or 'Non Alcohol'" },
                Category: { type: Type.STRING, description: "e.g., Whiskey, Brandy, Water, Milkshake, Soft Drinks, Beer, Cider" },
                Name: { type: Type.STRING, description: "Name of the drink" },
                Unknown: { type: Type.STRING, description: "Always 'Unknown'" },
                Price: { type: Type.NUMBER, description: "Price of the drink" }
              }
            }
          },
          errors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List any items, sections, or text from the menu that could not be parsed, were illegible, or had missing information."
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  const parsed = JSON.parse(text);
  return { items: parsed.items || [], errors: parsed.errors || [] };
}
