"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";

export function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);
    const syncedRef = useRef(false);

    useEffect(() => {
        if (isLoaded && user && !syncedRef.current) {
            syncedRef.current = true;
            syncUser({
                uid: user.id,
                email: user.primaryEmailAddress?.emailAddress || "",
                displayName: user.fullName || user.username || "User",
                photoURL: user.imageUrl,
            }).catch((err) => {
                console.error("Failed to sync user to Convex:", err);
                syncedRef.current = false;
            });
        }
    }, [isLoaded, user, syncUser]);

    return null;
}
