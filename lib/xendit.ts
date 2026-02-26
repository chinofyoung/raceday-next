const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function xenditFetch(endpoint: string, options: RequestInit = {}) {
    const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");

    const response = await fetch(`https://api.xendit.co${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        console.error(`Xendit API Error [${endpoint}]:`, result);
        throw new Error(result.message || result.error_code || "Xendit API error");
    }

    return result;
}
