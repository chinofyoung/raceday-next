"use client";

import React, { createContext, useContext } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { User } from "@/types/user";

interface AuthContextType {
    user: User | null;

    loading: boolean;
    role: User["role"] | null;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,

    loading: true,
    role: null,
    refreshUser: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, clerkUser, loading, role, refreshUser } = useAuth();

    return (
        <AuthContext.Provider
            value={{
                user,

                loading,
                role,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuthContext = () => useContext(AuthContext);
