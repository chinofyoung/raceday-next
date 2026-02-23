import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { getAnnouncementsByEventId, createAnnouncement } from "@/lib/services/announcementService";
import { sendEmailBlast } from "@/lib/services/emailService";
import { CreateAnnouncementInput } from "@/types/announcement";

export const dynamic = "force-dynamic";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await context.params;

        // No strict auth required to fetch announcements (participants need to see them too)
        // If we wanted to, we could check if user is registered or is the organizer.
        // For now, announcements are public to anyone who knows the eventId.

        const announcements = await getAnnouncementsByEventId(eventId);
        return NextResponse.json(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const sessionCookie = request.cookies.get("session")?.value;
        if (!sessionCookie) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify session
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedToken.uid;

        const { id: eventId } = await context.params;

        // Verify the user is the organizer of the event
        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const eventData = eventDoc.data();
        if (eventData?.organizerId !== uid) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await request.json();
        const { title, message, sendEmail } = body;

        if (!title || !message) {
            return new NextResponse("Missing title or message", { status: 400 });
        }

        const createData: CreateAnnouncementInput = {
            eventId,
            organizerId: uid,
            title,
            message,
            sendEmail,
            createdBy: uid,
        };

        let sentCount = 0;

        // Handle optional email blast
        if (sendEmail) {
            // Fetch all registered participants' emails
            // Note: In a production app, this could be offloaded to a background worker
            // if the list of registrations is very large.
            const registrationsSnap = await adminDb
                .collection("registrations")
                .where("eventId", "==", eventId)
                .where("status", "in", ["paid", "pending"]) // Avoid sending to cancelled/abandoned
                .get();

            const emails = registrationsSnap.docs
                .map(doc => doc.data().participantInfo?.email)
                .filter(Boolean); // Remove empty/falsy

            // Deduplicate emails
            const uniqueEmails = [...new Set(emails)];
            sentCount = uniqueEmails.length;

            if (uniqueEmails.length > 0) {
                // Determine event name for the email subject
                const eventName = eventData?.name || "Event";

                // Construct basic HTML for the email
                const emailHtml = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Important update regarding <strong>${eventName}</strong></h2>
                        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
                            <h3 style="margin-top: 0; color: #111;">${title}</h3>
                            <p style="white-space: pre-wrap; color: #444; line-height: 1.5;">${message}</p>
                        </div>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            You are receiving this email because you are registered for ${eventName}.
                        </p>
                    </div>
                `;

                // Fire and forget (or await) the email sending
                await sendEmailBlast({
                    to: uniqueEmails,
                    subject: `Update: ${eventName} - ${title}`,
                    html: emailHtml,
                });
            }
        }

        const announcement = await createAnnouncement({ ...createData, sentCount });

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("Error creating announcement:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
