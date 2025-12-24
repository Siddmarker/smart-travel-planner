import dotenv from 'dotenv';

// 1. Load your API Key
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

async function checkModels() {
  console.log("🔍 Checking available models for your API Key...");

  if (!API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY is missing from .env.local");
    return;
  }

  // 2. Direct Query to Google's Server
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ API Error:", data.error.message);
      console.log("👉 Suggestion: Go to https://aistudio.google.com/app/apikey and ensure the key is active.");
    } else if (data.models) {
      console.log(`✅ Success! Found ${data.models.length} available models.`);
      console.log("---------------------------------------------------");
      
      // Filter for "generateContent" models
      const contentModels = data.models
        .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      console.log("📋 Usable Model Names (Copy one of these exactly):");
      console.log(contentModels.join("\n"));
      console.log("---------------------------------------------------");
    } else {
      console.log("⚠️ No models found. This is unusual.");
    }

  } catch (error) {
    console.error("❌ Network Error:", error);
  }
}

checkModels();