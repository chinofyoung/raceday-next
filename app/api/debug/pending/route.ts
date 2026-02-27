import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function GET() {
    try {
        const regs = await fetchQuery(api.registrations.list, {
            status: "pending",
            paginationOpts: { numItems: 5, cursor: null }
        });
        return NextResponse.json(regs.page);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
