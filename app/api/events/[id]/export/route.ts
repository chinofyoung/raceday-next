import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

function escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return `"${stringValue}"`;
}

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get("status") || "all";
        const q = searchParams.get("q") || "";

        const { id: eventId } = await context.params;

        // Fetch Event details to map category names
        const eventDoc = await adminDb.collection("events").doc(eventId).get();
        if (!eventDoc.exists) {
            return new NextResponse("Event not found", { status: 404 });
        }
        const eventData = eventDoc.data() as any;
        const categoriesMap = new Map<string, string>();
        if (eventData.categories) {
            eventData.categories.forEach((cat: any) => {
                categoriesMap.set(cat.id || cat.name, cat.name);
            });
        }

        // Fetch Registrations
        let registrationsQuery = adminDb.collection("registrations")
            .where("eventId", "==", eventId);

        if (statusFilter !== "all") {
            registrationsQuery = registrationsQuery.where("status", "==", statusFilter);
        }

        const registrationsSnap = await registrationsQuery.get();
        let registrations = registrationsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));

        // Client-side like search filtering
        if (q) {
            const queryLower = q.toLowerCase();
            registrations = registrations.filter((r: any) =>
                r.participantInfo?.name?.toLowerCase().includes(queryLower) ||
                r.participantInfo?.email?.toLowerCase().includes(queryLower) ||
                (r.raceNumber || "").toLowerCase().includes(queryLower)
            );
        }

        // Define Headers
        const headers = [
            "Registration ID",
            "Added On",
            "Participant Name",
            "Email",
            "Phone",
            "Emergency Contact Name",
            "Emergency Contact Phone",
            "Category",
            "Bib Number",
            "T-Shirt Size",
            "Singlet Size",
            "Medical Conditions",
            "Payment Status",
            "Kit Claimed",
            "Amount Paid",
            "Registered By",
            "Is Proxy"
        ];

        let csvContent = headers.map(escapeCsvValue).join(",") + "\n";

        registrations.forEach((reg: any) => {
            const addedOn = reg.createdAt ? format(reg.createdAt.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A";
            const catName = categoriesMap.get(reg.categoryId) || reg.categoryId;
            const row = [
                reg.id,
                addedOn,
                reg.participantInfo?.name || "",
                reg.participantInfo?.email || "",
                reg.participantInfo?.phone || "",
                reg.participantInfo?.emergencyContact?.name || "",
                reg.participantInfo?.emergencyContact?.phone || "",
                catName,
                reg.raceNumber || "",
                reg.participantInfo?.tShirtSize || "",
                reg.participantInfo?.singletSize || "",
                reg.participantInfo?.medicalConditions || "",
                reg.status || "",
                reg.raceKitClaimed ? "Yes" : "No",
                reg.totalPrice || 0,
                reg.registeredByName || "",
                reg.isProxy ? "Yes" : "No"
            ];
            csvContent += row.map(escapeCsvValue).join(",") + "\n";
        });

        const filename = `event-${eventId}-registrations-${format(new Date(), "yyyyMMdd-HHmmss")}.csv`;

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
