export default {
    providers: [
        {
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://clerk.raceday.com", // Placeholder, user should update .env.local
            applicationID: "convex",
        },
    ],
};
