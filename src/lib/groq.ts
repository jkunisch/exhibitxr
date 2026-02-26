import Groq from "groq-sdk";

let groq: Groq | null = null;

function getGroqClient() {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is missing in .env.local");
    }
    groq = new Groq({ apiKey });
  }
  return groq;
}

export interface TikTokCreative {
  caption: string;
  hashtags: string[];
  vibe: "energetic" | "luxury" | "mysterious" | "clean" | "creative";
  musicQuery: string;
}

/**
 * Uses Groq (Llama 3) to generate a viral TikTok creative for a 3D model.
 */
export async function generateTikTokCreative(title: string, category: string = "Produkt"): Promise<TikTokCreative> {
  const prompt = `Du bist ein TikTok Growth Hacker. Erstelle ein kreatives Briefing für ein 3D-Modell eines "${title}" (${category}).
Das Video zeigt einen 360° Spin des Modells.

Antworte NUR mit einem JSON Objekt in diesem Format:
{
  "caption": "Ein kurzer, packender Satz (deutsch), der Neugier weckt oder den Nutzen betont.",
  "hashtags": ["3D", "Tech", "Innovation", "Plus 2 passende"],
  "vibe": "Wähle einen: energetic, luxury, mysterious, clean, creative",
  "musicQuery": "Ein Suchbegriff für passende Hintergrundmusik (z.B. 'Cyberpunk Phonk', 'Lo-Fi Chill', 'Corporate Tech')"
}`;

  try {
    const client = getGroqClient();
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Keine Antwort von Groq erhalten.");

    return JSON.parse(content) as TikTokCreative;
  } catch (error) {
    console.error("Groq Error:", error);
    // Fallback
    return {
      caption: `Check out dieses 3D-Modell von ${title}! 🔥`,
      hashtags: ["3D", "Design", "Tech", "3DSnap"],
      vibe: "clean",
      musicQuery: "Tech Deep House"
    };
  }
}
