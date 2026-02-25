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

export async function sendVolunteerInvitation({
    to,
    eventName,
    organizerName,
    acceptUrl,
    permissions,
}: {
    to: string;
    eventName: string;
    organizerName: string;
    acceptUrl: string;
    permissions: string[];
}) {
    const permissionsList = permissions.map(p => {
        if (p === 'kiosk') return 'Race Kit Claiming (Kiosk Mode)';
        if (p === 'participants') return 'Participant Management';
        if (p === 'announcements') return 'Send Announcements';
        return p;
    }).join(', ');

    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h2 style="color: #111;">You're invited to volunteer!</h2>
            <p><strong>${organizerName}</strong> has invited you to help manage <strong>${eventName}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin-top: 0; font-weight: bold;">Permissions granted:</p>
                <p style="color: #4b5563;">${permissionsList}</p>
            </div>

            <p>To accept this invitation and get started, click the button below:</p>
            
            <a href="${acceptUrl}" 
               style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 10px 0;">
               Accept Invitation
            </a>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Note: You will need to sign in with your Google/Gmail account to accept this invitation.
            </p>
        </div>
    `;

    return sendEmailBlast({
        to: [to],
        subject: `Volunteer Invitation: ${eventName}`,
        html,
    });
}

