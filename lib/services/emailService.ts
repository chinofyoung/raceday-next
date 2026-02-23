import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendEmailBlastOptions {
    to: string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export async function sendEmailBlast({
    to,
    subject,
    html,
    from = "RaceDay <noreply@raceday.ph>",
    replyTo,
}: SendEmailBlastOptions) {
    if (!resend) {
        console.warn("\n=============================================");
        console.warn("RESEND_API_KEY is not set.");
        console.warn(`Mocking email blast to: ${to.length} recipients`);
        console.warn(`Subject: ${subject}`);
        console.warn(`HTML snippet: ${html.substring(0, 100)}...`);
        console.warn("=============================================\n");
        return { success: true, mocked: true };
    }

    try {
        // Resend batch API requires arrays of email objects. Limit per batch is 100.
        const batchSize = 100;
        const batches = [];

        for (let i = 0; i < to.length; i += batchSize) {
            batches.push(to.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const emailRequests = batch.map((email) => ({
                from,
                to: email, // Each email goes individually so they don't see each other
                replyTo,
                subject,
                html,
            }));
            await resend.batch.send(emailRequests);
        }

        return { success: true, mocked: false };
    } catch (error) {
        console.error("Error sending email blast:", error);
        return { success: false, error };
    }
}
