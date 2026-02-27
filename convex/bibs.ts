import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

export const isTaken = query({
    args: { eventId: v.id("events"), bibNumber: v.string() },
    handler: async (ctx: QueryCtx, args) => {
        const registration = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.eq(q.field("bibNumber"), args.bibNumber))
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
                .filter((q) => q.eq(q.field("bibNumber"), formatted))
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

        let nextCount = counter!.count;
        let finalBib = "";

        // Try up to 100 times to find an available bib (skipping vanity ones)
        for (let i = 0; i < 100; i++) {
            nextCount++;
            const padded = String(nextCount).padStart(maxDigits, "0");
            const formatted = formatBib(padded);

            const existing = await ctx.db
                .query("registrations")
                .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
                .filter((q) => q.eq(q.field("bibNumber"), formatted))
                .first();

            if (!existing) {
                finalBib = formatted;
                break;
            }
        }

        if (!finalBib) throw new Error("Could not generate unique bib number");

        await ctx.db.patch(counter!._id, { count: nextCount });
        return finalBib;
    },
});

export const autoAssign = mutation({
    args: { eventId: v.id("events") },
    handler: async (ctx: MutationCtx, args) => {
        const event = await ctx.db.get(args.eventId);
        if (!event) throw new Error("Event not found");

        const registrations = await ctx.db
            .query("registrations")
            .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
            .filter((q) => q.and(q.eq(q.field("status"), "paid"), q.eq(q.field("raceNumber"), undefined)))
            .collect();

        if (registrations.length === 0) return { assignedCount: 0 };

        let assignedCount = 0;
        const newCategories = [...(event.categories || [])];
        let updatedCategories = false;

        const regsByCategory: Record<string, any[]> = {};
        registrations.forEach(reg => {
            if (!regsByCategory[reg.categoryId]) regsByCategory[reg.categoryId] = [];
            regsByCategory[reg.categoryId].push(reg);
        });

        for (let i = 0; i < newCategories.length; i++) {
            const cat = newCategories[i];
            const catId = cat.id || (cat as any).name;
            const regs = regsByCategory[catId];

            if (regs && regs.length > 0 && cat.bibAssignment?.enabled) {
                let currentSeq = cat.bibAssignment.currentSequential || cat.bibAssignment.rangeStart;

                regs.sort((a, b) => a.createdAt - b.createdAt);

                for (const reg of regs) {
                    const formattedBib = cat.raceNumberFormat
                        ? cat.raceNumberFormat.replace("{number}", currentSeq.toString())
                        : currentSeq.toString();

                    await ctx.db.patch(reg._id, {
                        raceNumber: formattedBib,
                        updatedAt: Date.now()
                    });

                    currentSeq++;
                    assignedCount++;
                }

                newCategories[i] = {
                    ...cat,
                    bibAssignment: {
                        ...cat.bibAssignment,
                        currentSequential: currentSeq
                    }
                };
                updatedCategories = true;
            }
        }

        if (updatedCategories) {
            await ctx.db.patch(args.eventId, {
                categories: newCategories,
                updatedAt: Date.now()
            });
        }

        return { assignedCount };
    }
});
