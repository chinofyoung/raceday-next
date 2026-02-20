"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { User } from "@/types/user";

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    role: User["role"] | null;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    role: null,
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserDoc = useCallback(async (uid: string) => {
        try {
            const snap = await getDoc(doc(db, "users", uid));
            setUser(snap.exists() ? (snap.data() as User) : null);
        } catch (error) {
            console.error("Error fetching user document:", error);
            setUser(null);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        if (!firebaseUser) return;
        await fetchUserDoc(firebaseUser.uid);
    }, [firebaseUser, fetchUserDoc]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
            setFirebaseUser(authUser);

            if (!authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            await fetchUserDoc(authUser.uid);
            setLoading(false);
        });

        return () => unsubscribeAuth();
    }, [fetchUserDoc]);

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                role: user?.role || null,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
