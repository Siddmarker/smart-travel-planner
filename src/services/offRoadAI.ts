import { GoogleGenerativeAI } from "@google/generative-ai";
import { Place } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key");

interface OffRoadAnalysis {
    difficultyLevel: 'Easy' | 'Intermediate' | 'Hard' | 'Expert';
    bikeSuitability: string[];
    terrainDescription: string;
    hazards: string[];
}

export const analyzeOffRoadTerrain = async (
    placeName: string,
    description?: string,
    reviews: string[] = []
): Promise<OffRoadAnalysis | null> => {
    if (!API_KEY) {
        console.warn("Gemini API key missing, skipping off-road analysis");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Combine available context
    const context = `
        Place: ${placeName}
        Description: ${description || "N/A"}
        Reviews: ${reviews.slice(0, 5).join(" | ") || "N/A"}
    `;

    const prompt = `
        You are an expert off-road biking guide. Analyze the following place metadata to determine its suitability for off-road motorcycling.
        
        Context:
        ${context}

        Tasks:
        1. Determine Difficulty Level (Easy=Gravel/Dirt, Intermediate=Rocks/Inclines, Hard=Mud/Technical, Expert=Dangerous).
        2. Identify Bike Suitability (Adventure, Enduro, Scrambler, etc.).
        3. Write a short (<10 words) "Vibe Check" terrain description (e.g. "Loose sand dunes", "Rocky forest trail").
        4. List major hazards (e.g. "Deep water", "Steep drops").
        
        Return ONLY a JSON object with this shape:
        {
            "difficultyLevel": "Easy" | "Intermediate" | "Hard" | "Expert",
            "bikeSuitability": ["string", "string"],
            "terrainDescription": "string",
            "hazards": ["string"]
        }
        Do not include markdown blocks.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error analyzing off-road terrain:", error);
        return {
            difficultyLevel: 'Intermediate', // Fallback
            bikeSuitability: ['Adventure'],
            terrainDescription: 'Terrain analysis unavailable',
            hazards: []
        };
    }
};
