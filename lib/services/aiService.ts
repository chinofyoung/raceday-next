export interface AISuggestion {
    title: string;
    description: string;
    categories?: {
        name: string;
        distance: string;
        description: string;
    }[];
}

export async function getAISuggestions(prompt: string): Promise<AISuggestion> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "complete" }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch AI suggestions");
    }

    return response.json();
}

/**
 * Fetches a suggested timeline for an event from Claude AI.
 */
export async function getAITimeline(eventInfo: string): Promise<{ timeline: { time: string; activity: string; description: string }[] }> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: eventInfo, type: "timeline" }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch AI timeline");
    }

    const data = await response.json();
    return data;
}

export async function improveText(text: string): Promise<{ improvedText: string }> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, type: "improve" }),
    });

    if (!response.ok) {
        throw new Error("Failed to improve text");
    }

    return response.json();
}
