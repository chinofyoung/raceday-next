import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";

const XENDIT_CALLBACK_TOKEN = process.env.XENDIT_CALLBACK_TOKEN;

export async function POST(req: Request) {
    try {
        const callbackToken = req.headers.get("x-callback-token");

        if (callbackToken !== XENDIT_CALLBACK_TOKEN) {
            return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
        }

        const body = await req.json();
        const { id, status, external_id, failure_code } = body;

        // Find the payout request in Firestore
        const payoutQuery = query(
            collection(db, "payoutRequests"),
            where("externalId", "==", external_id)
        );
        const payoutSnap = await getDocs(payoutQuery);

        if (payoutSnap.empty) {
            return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
        }

        const payoutDoc = payoutSnap.docs[0];
        const newStatus = status === "COMPLETED" ? "completed" : status === "FAILED" ? "failed" : "processing";

        await updateDoc(doc(db, "payoutRequests", payoutDoc.id), {
            status: newStatus,
            updatedAt: serverTimestamp(),
            completedAt: status === "COMPLETED" ? serverTimestamp() : null,
            failureReason: failure_code || null,
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Xendit Payout Webhook Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
