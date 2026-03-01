import { Anthropic } from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Module-level rate limiter (persists per serverless instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;      // max 15 requests
const WINDOW_MS = 60_000;   // per 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) return false;

    entry.count++;
    return true;
}

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    try {
        const { title, message, action } = await req.json();

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
        }

        let systemPrompt = "You are an expert race director and communications manager for a major marathon events company. Your goal is to write clear, compelling, and professional announcements to be sent to registered runners. Ensure the tone is informative and encouraging, avoiding overly robotic language.";

        let userPrompt = "";

        // Determine prompt based on action
        if (action === "draft") {
            userPrompt = `Write a professional short announcement to runners based on this title: "${title}".
            If context is provided in the message field: "${message}", use it, otherwise invent standard, helpful details.
            
            Return ONLY a JSON object in this exact format, with no other text around it:
            {
                "message": "The generated announcement text goes here."
            }`;
        } else if (action === "improve") {
            userPrompt = `Improve the grammar, clarity, and professionalism of this announcement message: 
            "${message}" (The title is: "${title}")
            
            Return ONLY a JSON object in this exact format, with no other text around it:
            {
                "message": "The improved announcement text goes here."
            }`;
        } else if (action === "make-formal") {
            userPrompt = `Rewrite this announcement to sound highly formal, serious, and official, suitable for a strict policy update or major change.
            Message to rewrite: "${message}" (Title: "${title}")
            
            Return ONLY a JSON object in this exact format, with no other text around it:
            {
                "message": "The formal announcement text goes here."
            }`;
        } else if (action === "make-exciting") {
            userPrompt = `Rewrite this announcement to sound extremely high-energy, exciting, and hype-building! Use strong verbs and an encouraging tone.
            Message to rewrite: "${message}" (Title: "${title}")
            
            Return ONLY a JSON object in this exact format, with no other text around it:
            {
                "message": "The exciting announcement text goes here."
            }`;
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
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
            // Fallback if Claude doesn't return JSON
            return NextResponse.json({ message: textBlock.text });
        }

    } catch (error: any) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
