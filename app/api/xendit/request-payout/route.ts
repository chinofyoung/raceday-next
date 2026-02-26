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

        console.log(`[Payout] Processing request for user ${userId}: account=${xenditAccountId}, amount=${amount}`);

        // 1. Validate against minimum payout
        try {
            const { getPlatformSettings } = await import("@/lib/services/settingsService");
            const settings = await getPlatformSettings();
            if (amount < settings.minimumPayoutAmount) {
                return NextResponse.json({
                    error: `Minimum withdrawal amount is ₱${settings.minimumPayoutAmount.toLocaleString()}`
                }, { status: 400 });
            }
        } catch (settingsError) {
            console.warn("[Payout] Failed to fetch settings, using defaults.");
        }

        // 2. Real Xendit API Call
        try {
            // Check balance first
            const balanceData = await xenditFetch("/balance?account_type=CASH", {
                headers: { "for-user-id": xenditAccountId },
            });

            if (balanceData.balance < amount) {
                return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
            }

            // Create Disbursement
            const payout = await xenditFetch("/disbursements", {
                method: "POST",
                headers: { "for-user-id": xenditAccountId },
                body: JSON.stringify({
                    external_id: `payout_${Date.now()}_${userId.substring(0, 8)}`,
                    amount: Math.floor(amount * 100) / 100,
                    bank_code: bankDetails.bankCode,
                    account_holder_name: bankDetails.accountHolderName.substring(0, 40),
                    account_number: bankDetails.accountNumber,
                    currency: "PHP",
                    description: `RaceDay Payout (Net: ₱${(amount - 10).toLocaleString()}, Fee: ₱10.00)`,
                }),
            });

            // Record in Firestore
            await addDoc(collection(db, "payoutRequests"), {
                userId,
                organizerId: userId,
                xenditAccountId,
                amount: amount,
                netAmount: amount - 10,
                fee: 10,
                bankDetails,
                status: "pending",
                xenditPayoutId: payout.id,
                externalId: payout.external_id,
                createdAt: serverTimestamp(),
            });

            return NextResponse.json(payout);
        } catch (xenditError: any) {
            console.error("[Payout] Xendit Error Details:", xenditError);

            // Provide more descriptive errors if possible
            let errorMessage = xenditError.message || "Xendit transfer failed";
            if (errorMessage.includes("format submitted")) {
                errorMessage = "Disbursement failed due to invalid bank details or sub-account status.";
            }

            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

    } catch (error: any) {
        console.error("[Payout] Unexpected Server Error:", error);
        return NextResponse.json({ error: "An unexpected server error occurred." }, { status: 500 });
    }
}
