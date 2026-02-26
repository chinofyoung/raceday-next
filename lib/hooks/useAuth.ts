"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User } from "@/types/user";

export const useAuth = () => {
    const { user: clerkUser, isLoaded: clerkLoading } = useUser();
    const { signOut } = useClerk();
    const convexUser = useQuery(api.users.current);

    // Convex loading is true if it's undefined
    const loading = !clerkLoading || (!!clerkUser && convexUser === undefined);

    return {
        user: convexUser as User | null,
        clerkUser,
        loading,
        role: convexUser?.role || null,
        signOut,
        refreshUser: async () => {
            // Convex queries are reactive, no manual refresh needed in most cases.
            // But we could trigger a sync if absolutely necessary.
        },
    };
};
