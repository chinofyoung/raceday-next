import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface PlatformSettings {
    processingFeePercent: number;
    minimumPayoutAmount: number;
    updatedAt?: any;
    updatedBy?: string;
}

const SETTINGS_DOC_ID = "platform";
const SETTINGS_COLLECTION = "settings";

export async function getPlatformSettings(): Promise<PlatformSettings> {
    try {
        const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            return snap.data() as PlatformSettings;
        }

        // Default settings if not found
        return {
            processingFeePercent: 5,
            minimumPayoutAmount: 500,
        };
    } catch (error) {
        console.error("Error fetching platform settings:", error);
        return {
            processingFeePercent: 5,
            minimumPayoutAmount: 500,
        };
    }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>, userId: string) {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
    }, { merge: true });
}
