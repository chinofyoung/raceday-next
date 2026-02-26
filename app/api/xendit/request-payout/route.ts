import { NextResponse } from "next/server";
import { xenditFetch } from "@/lib/xendit";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { User } from "@/types/user";

export async function POST(req: Request) {
    try {
        const userId = req.headers.get("x-user-id");
        const { amount } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userSnap.data() as User;
        const xenditAccountId = userData.organizer?.xenditAccountId;
        const bankDetails = userData.organizer?.bankDetails;

        if (!xenditAccountId || !bankDetails) {
            return NextResponse.json({ error: "Payout setup incomplete" }, { status: 400 });
        }

        // 1. Check balance first
        const balanceData = await xenditFetch("/balance?account_type=CASH", {
            headers: { "for-user-id": xenditAccountId },
        });

        if (balanceData.balance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // 2. Create Payout/Disbursement
        // Reference: https://developers.xendit.co/api-reference/#create-disbursement
        const payout = await xenditFetch("/disbursements", {
            method: "POST",
            headers: { "for-user-id": xenditAccountId },
            body: JSON.stringify({
                external_id: `payout_${Date.now()}_${userId}`,
                amount,
                bank_code: bankDetails.bankCode,
                account_holder_name: bankDetails.accountHolderName,
                account_number: bankDetails.accountNumber,
                currency: "PHP",
            }),
        });

        // 3. Record in Firestore
        await addDoc(collection(db, "payoutRequests"), {
            userId,
            organizerId: userId,
            xenditAccountId,
            amount,
            bankDetails,
            status: "pending",
            xenditPayoutId: payout.id,
            externalId: payout.external_id,
            createdAt: serverTimestamp(),
        });

        return NextResponse.json(payout);

    } catch (error: any) {
        console.error("Xendit Payout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
