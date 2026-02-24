"use server";

import OpenAI from "openai";

// Instantiate OpenAI without enforcing the API key at build time
// so that the build passes even if OPENAI_API_KEY is not set yet.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export async function streamChatResponse(
    userMessage: string,
    context: string
): Promise<ReadableStream<string>> {
    if (!userMessage || userMessage.length > 500) {
        throw new Error("Message too long or empty.");
    }
    if (!context || context.length > 8000) {
        throw new Error("Context too long.");
    }

    // Fail fast if true API key is missing
    if (!process.env.OPENAI_API_KEY) {
        // Return a dummy stream so it doesn't hard-crash the client
        return new ReadableStream({
            start(controller) {
                controller.enqueue(
                    "Fehler: OPENAI_API_KEY ist nicht konfiguriert. Bitte fügen Sie den Key in die .env.local ein."
                );
                controller.close();
            },
        });
    }

    const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `Du bist ein freundlicher Produktberater fuer eine 3D-Ausstellung.\nHier sind die Produktinformationen:\n${context}\nBeantworte Fragen kurz und praezise. Maximal 3 Saetze.\nWenn du etwas nicht weisst, sag es ehrlich.`,
            },
            { role: "user", content: userMessage },
        ],
        stream: true,
    });

    const readableStream = new ReadableStream<string>({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content;
                    if (content) {
                        controller.enqueue(content);
                    }
                }
            } catch (error) {
                console.error("OpenAI stream error:", error);
                controller.enqueue("\n\n(Fehler bei der AI-Generierung)");
            } finally {
                controller.close();
            }
        },
    });

    return readableStream;
}
