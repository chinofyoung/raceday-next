import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Resend } from "resend";

export const sendAnnouncementEmail = action({
    args: {
        eventId: v.id("events"),
        title: v.string(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.warn("RESEND_API_KEY not set, skipping email blast");
            return;
        }

        const resend = new Resend(resendApiKey);

        // Get emails through an internal query
        const emails: string[] = await ctx.runQuery(internal.registrations.getEmailsForEventInternal, {
            eventId: args.eventId,
        });

        if (emails.length === 0) return;

        // Get event details for the email context
        const event: any = await ctx.runQuery(internal.events.getByIdInternal, {
            id: args.eventId,
        });

        const eventName = event?.name || "Event";

        const batches = [];
        const batchSize = 100;
        for (let i = 0; i < emails.length; i += batchSize) {
            batches.push(emails.slice(i, i + batchSize));
        }

        for (const batch of batches) {
            const emailRequests = batch.map((email) => ({
                from: "RaceDay <noreply@raceday.ph>",
                to: email,
                subject: `Update: ${eventName} - ${args.title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Important update regarding <strong>${eventName}</strong></h2>
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <h3 style="margin-top: 0; color: #111;">${args.title}</h3>
                            <p style="white-space: pre-wrap; color: #444; line-height: 1.5;">${args.message}</p>
                        </div>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            You are receiving this email because you are registered for ${eventName}.
                        </p>
                    </div>
                `,
            }));
            await resend.batch.send(emailRequests);
        }

        return { sentCount: emails.length };
    },
});
