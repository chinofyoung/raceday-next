import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await context.params;
        const sourceDoc = await adminDb.collection("events").doc(eventId).get();
        if (!sourceDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const data = sourceDoc.data() as any;
        const newDocRef = adminDb.collection("events").doc();

        // Strip data and create clone payload
        const clonePayload = {
            ...data,
            id: newDocRef.id,
            name: `${data.name} (Copy)`,
            status: "draft",
            date: null, // Clear date
            registrationEndDate: null, // Clear date
            earlyBird: data.earlyBird ? {
                ...data.earlyBird,
                startDate: null,
                endDate: null
            } : null,
            createdAt: new Date(),
            updatedAt: new Date(),
            categories: (data.categories || []).map((cat: any) => ({
                ...cat,
                registeredCount: 0,
                id: Math.random().toString(36).substring(2, 9),
                bibAssignment: cat.bibAssignment ? {
                    ...cat.bibAssignment,
                    currentSequential: cat.bibAssignment.rangeStart
                } : null
            }))
        };

        await newDocRef.set(clonePayload);

        return NextResponse.json({ success: true, newId: newDocRef.id });

    } catch (error) {
        console.error("Clone error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
