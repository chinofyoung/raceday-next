import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export async function GET() {
    try {
        const q = query(
            collection(db, "registrations"),
            where("status", "==", "pending"),
            limit(5)
        );
        const snap = await getDocs(q);
        const regs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json(regs);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
