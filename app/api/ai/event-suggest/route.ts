import { Anthropic } from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { prompt, type } = await req.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
        }

        let systemPrompt = "You are a professional marathon and race event coordinator with 20 years of experience in marketing and logistics. Your goal is to help organizers create world-class racing events.";

        let userPrompt = "";
        if (type === "complete") {
            userPrompt = `Based on these keywords or partial info: "${prompt}", generate:
            1. A high-energy, professional event title.
            2. A compelling event description (min 150 words) that includes registration call-to-action, race highlights, and atmosphere.
            3. 3-4 race categories with suggested distances and target participant types.
            
            Return the response in JSON format:
            {
                "title": "string",
                "description": "string",
                "categories": [
                    { "name": "string", "distance": "string", "description": "string" }
                ]
            }`;
        } else if (type === "timeline") {
            userPrompt = `Based on this event: "${prompt}", generate a professional race day timeline/schedule.
            Include standard activities like: Race kit collection, assembly time, gun start for different categories, awarding, and post-race activities.
            
            Return the response in JSON format:
            {
                "timeline": [
                    { "time": "string (e.g. 03:00 AM)", "activity": "string", "description": "string" }
                ]
            }`;
        } else if (type === "improve") {
            userPrompt = `Improve this event description to be more professional, exciting, and clear: "${prompt}". 
            Return the response in JSON format:
            {
                "improvedText": "string"
            }`;
        }

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1500,
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        });

        // Content is an array of content blocks
        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error("No text response from Claude");
        }

        // Parse JSON from the response
        try {
            const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: textBlock.text };
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json({ text: textBlock.text });
        }

    } catch (error: any) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
