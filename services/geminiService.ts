
import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash-image';

export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];

        if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error("Invalid or empty response from Gemini API:", JSON.stringify(response, null, 2));
            
            const blockReason = response.promptFeedback?.blockReason;
            if (blockReason) {
                throw new Error(`A képgenerálás blokkolva lett a biztonsági szűrők által. Ok: ${blockReason}. Kérlek, próbálj meg egy másik, semlegesebb parancsot.`);
            }

            const finishReason = candidate?.finishReason;
            if (finishReason === 'NO_IMAGE') {
                 throw new Error(`A modell nem generált képet a megadott parancsra. Ennek oka lehet a biztonsági szűrő, vagy a parancs nem volt elég egyértelmű. Kérlek, próbálj más megfogalmazást.`);
            } else if (finishReason) {
                 throw new Error(`A képgenerálás leállt. Ok: ${finishReason}. Próbálj másik parancsot.`);
            }

            throw new Error("Érvénytelen vagy üres választ adott a Gemini API. Kérlek, próbáld újra később.");
        }


        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Nem található képadat a válaszban, bár a kérés sikeresnek tűnt.");
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Sikertelen képgenerálás a Gemini API-val.");
    }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const candidate = response.candidates?.[0];

        if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            console.error("Invalid or empty response from Gemini API during edit:", JSON.stringify(response, null, 2));
            
            const blockReason = response.promptFeedback?.blockReason;
            if (blockReason) {
                throw new Error(`A képszerkesztés blokkolva lett a biztonsági szűrők által. Ok: ${blockReason}. Kérlek, próbálj meg egy másik, semlegesebb parancsot.`);
            }

            const finishReason = candidate?.finishReason;
            if (finishReason === 'NO_IMAGE') {
                 throw new Error(`A modell nem tudta végrehajtani a szerkesztést. Ennek oka lehet a biztonsági szűrő, vagy a parancs nem volt elég egyértelmű. Kérlek, próbálj más megfogalmazást.`);
            } else if (finishReason) {
                 throw new Error(`A képszerkesztés leállt. Ok: ${finishReason}. Próbálj másik parancsot.`);
            }

            throw new Error("Érvénytelen vagy üres választ adott a Gemini API szerkesztés közben. Kérlek, próbáld újra később.");
        }

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Nem található képadat a szerkesztett válaszban, bár a kérés sikeresnek tűnt.");
    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Sikertelen képszerkesztés a Gemini API-val.");
    }
};
