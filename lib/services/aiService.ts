export interface AISuggestion {
    title: string;
    description: string;
    categories?: {
        name: string;
        distance: string;
        description: string;
    }[];
}

async function getAuthHeaders(token?: string): Promise<Record<string, string>> {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

export async function getAISuggestions(prompt: string, token?: string): Promise<AISuggestion> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders(token)),
        },
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
export async function getAITimeline(eventInfo: string, token?: string): Promise<{ timeline: { time: string; activity: string; description: string }[] }> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders(token)),
        },
        body: JSON.stringify({ prompt: eventInfo, type: "timeline" }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch AI timeline: ${response.status} ${text}`);
    }

    const data = await response.json();
    return data;
}

export async function improveText(text: string, token?: string): Promise<{ improvedText: string }> {
    const response = await fetch("/api/ai/event-suggest", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(await getAuthHeaders(token)),
        },
        body: JSON.stringify({ prompt: text, type: "improve" }),
    });

    if (!response.ok) {
        throw new Error("Failed to improve text");
    }

    return response.json();
}
