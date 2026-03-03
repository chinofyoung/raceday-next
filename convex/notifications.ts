import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendPush = internalAction({
    args: {
        tokens: v.array(v.string()),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        if (args.tokens.length === 0) return;

        const messages = args.tokens.map(token => ({
            to: token,
            sound: "default",
            title: args.title,
            body: args.body,
            data: args.data || {},
        }));

        await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messages),
        });
    },
});
