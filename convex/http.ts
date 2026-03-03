import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
    path: "/api/tracking/update",
    method: "POST",
    handler: httpAction(async (ctx, request) => {
        const body = await request.json();

        // In a production app, we'd validate a token here.
        // For this stage, we'll accept the userId and eventId directly.

        await ctx.runMutation(api.tracking.update, {
            userId: body.userId,
            eventId: body.eventId,
            lat: body.lat,
            lng: body.lng,
            bearing: body.bearing,
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }),
});

export default http;
