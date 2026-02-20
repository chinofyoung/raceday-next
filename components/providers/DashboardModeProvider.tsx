"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";

type DashboardMode = "runner" | "organizer";

interface DashboardModeContextType {
    mode: DashboardMode;
    setMode: (mode: DashboardMode) => void;
    canSwitchMode: boolean;
}

const DashboardModeContext = createContext<DashboardModeContextType>({
    mode: "runner",
    setMode: () => { },
    canSwitchMode: false,
});

const STORAGE_KEY = "raceday-dashboard-mode";

export function DashboardModeProvider({ children }: { children: React.ReactNode }) {
    const { role } = useAuth();
    const canSwitchMode = role === "organizer" || role === "admin";

    const [mode, setModeState] = useState<DashboardMode>(() => {
        // Default: organizer if they have the role, runner otherwise
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "runner" || stored === "organizer") return stored;
        }
        return canSwitchMode ? "organizer" : "runner";
    });

    // Sync when role changes (e.g. after auth loads)
    useEffect(() => {
        if (!canSwitchMode) {
            setModeState("runner");
        } else {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "runner" || stored === "organizer") {
                setModeState(stored);
            }
        }
    }, [canSwitchMode]);

    const setMode = useCallback((newMode: DashboardMode) => {
        setModeState(newMode);
        localStorage.setItem(STORAGE_KEY, newMode);
    }, []);

    return (
        <DashboardModeContext.Provider value={{ mode, canSwitchMode, setMode }}>
            {children}
        </DashboardModeContext.Provider>
    );
}

export const useDashboardMode = () => useContext(DashboardModeContext);
