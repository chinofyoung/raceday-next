import { NextResponse } from "next/server";
import { xenditFetch } from "@/lib/xendit";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types/user";

// This is the ADMIN version of the balance route
// It fetches the main platform account balance
export async function GET(req: Request) {
    try {
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || (userSnap.data() as User).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
        }

        // Fetch balance for the main platform account (no for-user-id header)
        // Reference: https://developers.xendit.co/api-reference/#get-balance
        const balance = await xenditFetch("/balance?account_type=CASH");

        return NextResponse.json(balance);

    } catch (error: any) {
        console.error("Xendit Admin Balance Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
