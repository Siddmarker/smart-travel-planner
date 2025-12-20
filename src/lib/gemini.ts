import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateItinerary(destination: string, days: number, startDate: string) {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      I am planning a trip to ${destination} for ${days} days starting on ${startDate}.
      Create a detailed daily itinerary with 2 activities per day (Morning and Evening).
      
      RETURN ONLY JSON.
      The structure should be an ARRAY of objects.
      
      Example:
      [
        {
          "day_index": 0,
          "activities": [
             { "name": "...", "description": "...", "time_slot": "Morning", "category": "...", "location_name": "..." }
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("AI Raw Output:", text); // <--- DEBUG LOG (Check Vercel logs if this fails again)

    let data = JSON.parse(text);

    // --- THE FIX: SMART UNWRAPPING ---
    // Sometimes Gemini wraps the array in an object like { "itinerary": [...] }
    if (!Array.isArray(data)) {
        if (data.itinerary && Array.isArray(data.itinerary)) {
            data = data.itinerary;
        } else if (data.days && Array.isArray(data.days)) {
            data = data.days;
        } else if (data.trip && Array.isArray(data.trip)) {
             data = data.trip;
        }
    }

    return data;

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null; 
  }
}