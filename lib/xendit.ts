const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

export async function xenditFetch(endpoint: string, options: RequestInit = {}) {
    const auth = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString("base64");

    const response = await fetch(`https://api.xendit.co${endpoint}`, {
        ...options,
        headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        console.error(`Xendit API Error [${endpoint}]:`, result);
        throw new Error(result.message || result.error_code || "Xendit API error");
    }

    return result;
}

export async function handleOrganizerTransfer(registrationId: string, regData: any) {
    const { db } = await import("@/lib/firebase/config");
    const { doc, getDoc, addDoc, collection, serverTimestamp } = await import("firebase/firestore");

    console.log(`[Transfer] Checking transfer for reg ${registrationId}: organizerId=${regData.organizerId}, amount=${regData.organizerAmount}`);

    if (!regData.organizerId || !regData.organizerAmount || regData.organizerAmount <= 0) {
        console.log(`[Transfer] No transfer needed for reg ${registrationId}.`);
        return;
    }

    try {
        const organizerRef = doc(db, "users", regData.organizerId);
        const organizerSnap = await getDoc(organizerRef);

        if (!organizerSnap.exists()) {
            throw new Error(`Organizer user ${regData.organizerId} not found`);
        }

        const organizerData = organizerSnap.data();
        const xenditAccountId = organizerData?.organizer?.xenditAccountId;

        if (!xenditAccountId) {
            console.warn(`[Transfer] No Xendit account ID found for organizer ${regData.organizerId}. Skipping transfer.`);
            return;
        }

        console.log(`[Transfer] Attempting Xendit transfer to ${xenditAccountId} for PHP ${regData.organizerAmount}...`);

        const transfer = await xenditFetch("/transfers", {
            method: "POST",
            body: JSON.stringify({
                reference: `reg_${registrationId}`,
                amount: regData.organizerAmount,
                currency: "PHP",
                destination_user_id: xenditAccountId,
                source_user_id: process.env.XENDIT_PLATFORM_ACCOUNT_ID
            }),
        });

        console.log(`[Transfer] Xendit transfer successful: ${transfer.id}`);

        // Record transaction
        await addDoc(collection(db, "organizerTransactions"), {
            organizerId: regData.organizerId,
            eventId: regData.eventId,
            registrationId: registrationId,
            type: "registration_income",
            amount: regData.organizerAmount,
            status: "completed",
            xenditTransferId: transfer.id,
            createdAt: serverTimestamp(),
            metadata: {
                runnerName: regData.participantInfo?.name,
                categoryName: regData.categoryName,
            }
        });

        console.log(`[Transfer] Transaction record created for reg ${registrationId}`);
        return transfer;
    } catch (error: any) {
        console.error(`[Transfer] Failed for reg ${registrationId}:`, error.message || error);
        throw error;
    }
}
