import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const isTaken = query({
    args: { eventId: v.id("events"), bibNumber: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        const registration = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("raceNumber"), args.bibNumber))
            .first();
        return !!registration;
    },
});

export const generate = mutation({
    args: {
        eventId: v.id("events"),
        categoryId: v.string(),
        vanityNumber: v.optional(v.string()),
    },
    // Called from server-side API routes (create-checkout, webhook, sync) via fetchMutation.
    // Auth is enforced at the API route layer; Convex fetchMutation doesn't forward user identity.
    handler: async (ctx: MutationCtx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        const category = event.categories?.find((c: any) => c.id === args.categoryId);
        const format = category?.raceNumberFormat || "{number}";
        const maxDigits = event.vanityRaceNumber?.maxDigits || 4;

        const formatBib = (num: string) => format.replace("{number}", num);

        if (args.vanityNumber) {
            const padded = args.vanityNumber.padStart(maxDigits, "0");
            const formatted = formatBib(padded);

            const existing = await ctx.db
                .query("registrations")
                .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
                .filter((q) => q.eq(q.field("raceNumber"), formatted))
                .first();

            if (existing) throw new Error(`Bib ${formatted} is already taken`);
            return formatted;
        }

        // Sequential generation
        let counter = await ctx.db
            .query("bibCounters")
            .withIndex("by_event_category", (q) =>
                q.eq("eventId", args.eventId).eq("categoryId", args.categoryId)
            )
            .unique();

        if (!counter) {
            const id = await ctx.db.insert("bibCounters", {
                eventId: args.eventId,
                categoryId: args.categoryId,
                count: 0,
            });
            counter = await ctx.db.get(id);
        }

        // Fetch bib numbers for this event in one query so we can find
        // the first gap without issuing a separate DB read per candidate number.
        // Capped at 10000 to prevent unbounded reads for large events.
        const existingBibs = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .take(10000);
        const usedNumbers = new Set(existingBibs.map(r => r.raceNumber).filter(Boolean));

        let nextCount = counter!.count;
        let finalBib = "";

        const maxNumber = Math.pow(10, maxDigits) - 1;

        // Scan up to 100 candidates entirely in memory (no per-iteration DB round-trips)
        for (let i = 0; i < 100; i++) {
            nextCount++;
            if (nextCount > maxNumber) {
                throw new Error(
                    `Bib number range exhausted for category ${args.categoryId} (max ${maxDigits}-digit number is ${maxNumber})`
                );
            }
            const padded = String(nextCount).padStart(maxDigits, "0");
            const formatted = formatBib(padded);

            if (!usedNumbers.has(formatted)) {
                finalBib = formatted;
                break;
            }
        }

        if (!finalBib) throw new Error("Could not generate unique bib number");

        // Atomically advance the counter to the chosen value so concurrent
        // mutations start from a higher sequence and won't re-select this bib.
        await ctx.db.patch(counter!._id, { count: nextCount });

        // Final uniqueness guard: verify the bib is still unclaimed after the
        // counter has been claimed. If a concurrent mutation already inserted it,
        // throw so the caller can retry from the application layer.
        const collision = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("raceNumber"), finalBib))
            .first();

        if (collision) throw new Error(`Bib ${finalBib} collision detected, please retry`);

        return finalBib;
    },
});

