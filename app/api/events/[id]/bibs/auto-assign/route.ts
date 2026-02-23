import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { EventCategory } from "@/types/event";

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: eventId } = await context.params;

        const eventDocRef = adminDb.collection("events").doc(eventId);
        const eventDoc = await eventDocRef.get();

        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }

        const eventData = eventDoc.data() as any;
        const categories = eventData.categories as EventCategory[];

        if (!categories) {
            return new NextResponse("No categories found", { status: 400 });
        }

        // Fetch all paid registrations for this event
        const registrationsQuery = adminDb.collection("registrations")
            .where("eventId", "==", eventId)
            .where("status", "==", "paid");

        const registrationsSnap = await registrationsQuery.get();
        if (registrationsSnap.empty) {
            return new NextResponse("No paid registrations found", { status: 200 });
        }

        const batch = adminDb.batch();
        let updatedCategories = false;
        let assignedCount = 0;

        // Group registrations by categoryId
        const regsByCategory: Record<string, any[]> = {};
        registrationsSnap.docs.forEach((doc: any) => {
            const reg = { id: doc.id, ...doc.data() as any };
            // Only assign if they don't have a raceNumber yet
            if (!reg.raceNumber) {
                if (!regsByCategory[reg.categoryId]) regsByCategory[reg.categoryId] = [];
                regsByCategory[reg.categoryId].push(reg);
            }
        });

        // For each category, assign bibs sequentially
        categories.forEach(cat => {
            const catId = cat.id || cat.name;
            const regs = regsByCategory[catId];

            if (regs && regs.length > 0 && cat.bibAssignment?.enabled) {
                let currentSeq = cat.bibAssignment.currentSequential || cat.bibAssignment.rangeStart;

                // Sort by createdAt so assignment is in order of registration
                regs.sort((a, b) => {
                    const timeA = a.createdAt?.toMillis() || 0;
                    const timeB = b.createdAt?.toMillis() || 0;
                    return timeA - timeB;
                });

                regs.forEach((reg: any) => {
                    const formattedBib = cat.raceNumberFormat
                        ? cat.raceNumberFormat.replace("{number}", currentSeq.toString())
                        : currentSeq.toString();

                    batch.update(adminDb.collection("registrations").doc(reg.id), {
                        raceNumber: formattedBib,
                        updatedAt: new Date()
                    });

                    currentSeq++;
                    assignedCount++;
                });

                // Update category currentSequential
                cat.bibAssignment.currentSequential = currentSeq;
                updatedCategories = true;
            }
        });

        if (assignedCount > 0) {
            if (updatedCategories) {
                batch.update(eventDocRef, {
                    categories,
                    updatedAt: new Date()
                });
            }
            await batch.commit();
        }

        return NextResponse.json({ success: true, assignedCount }, { status: 200 });

    } catch (error) {
        console.error("Auto-assign error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
