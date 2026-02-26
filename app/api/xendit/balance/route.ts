import { NextResponse } from "next/server";
import { xenditFetch } from "@/lib/xendit";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { User } from "@/types/user";

// This should be called by the organizer to check their own balance
export async function GET(req: Request) {
    try {
        // In a real app, you'd get the userId from the session/auth token
        // For now, we'll expect a userId in the headers or query
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.data() as User;
        const xenditAccountId = userData.organizer?.xenditAccountId;

        if (!xenditAccountId) {
            return NextResponse.json({ error: "No Xendit account linked" }, { status: 400 });
        }

        // Fetch balance for the real sub-account
        const balance = await xenditFetch("/balance?account_type=CASH", {
            headers: {
                "for-user-id": xenditAccountId,
            },
        });

        return NextResponse.json(balance);

    } catch (error: any) {
        console.error("Xendit Balance Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
