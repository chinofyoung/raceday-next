"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { User } from "@/types/user";

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    role: User["role"] | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    role: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUser: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
            setFirebaseUser(authUser);

            // Cleanup previous user listener if it exists
            if (unsubscribeUser) {
                unsubscribeUser();
                unsubscribeUser = undefined;
            }

            if (!authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Fetch user doc from Firestore with real-time updates
            const userDocRef = doc(db, "users", authUser.uid);
            unsubscribeUser = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setUser(doc.data() as User);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user document:", error);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUser) unsubscribeUser();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                firebaseUser,
                loading,
                role: user?.role || null,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
