"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    ResponsiveGridLayout,
    useContainerWidth,
    verticalCompactor,
    type Layout,
    type LayoutItem,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { LayoutGrid, Check, X, RotateCcw } from "lucide-react";

import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";
import { DraggableWidget } from "./organizer/DraggableWidget";

const WIDGET_IDS = [
    "active-events",
    "revenue-stats",
    "kit-fulfillment",
    "registrations-feed",
] as const;

type WidgetId = (typeof WIDGET_IDS)[number];

const COLS = { lg: 4, md: 2, sm: 1, xs: 1 };
const BREAKPOINTS = { lg: 996, md: 768, sm: 480, xs: 0 };
const ROW_HEIGHT = 220;

const DEFAULT_LG_LAYOUT: LayoutItem[] = [
    { i: "active-events", x: 0, y: 0, w: 2, h: 1, minW: 1, maxW: 4, minH: 1, maxH: 4 },
    { i: "revenue-stats", x: 2, y: 0, w: 2, h: 1, minW: 1, maxW: 4, minH: 1, maxH: 4 },
    { i: "kit-fulfillment", x: 0, y: 1, w: 2, h: 1, minW: 1, maxW: 4, minH: 1, maxH: 4 },
    { i: "registrations-feed", x: 0, y: 2, w: 4, h: 1, minW: 1, maxW: 4, minH: 1, maxH: 4 },
];

function layoutToSaveData(layout: LayoutItem[]) {
    const order = [...layout].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
    return {
        layout: order.map((l) => l.i),
        widgetSizes: order.map((l) => ({
            id: l.i,
            x: l.x,
            y: l.y,
            colSpan: l.w,
            rowSpan: l.h,
        })),
    };
}

function savedDataToLayout(
    dashboardLayout?: string[],
    widgetSizes?: { id: string; x: number; y: number; colSpan: number; rowSpan: number }[]
): LayoutItem[] {
    if (!dashboardLayout || dashboardLayout.length !== WIDGET_IDS.length) {
        return DEFAULT_LG_LAYOUT.map((l) => ({ ...l }));
    }

    const sizeMap = new Map<string, { x: number; y: number; colSpan: number; rowSpan: number }>();
    if (widgetSizes) {
        for (const s of widgetSizes) sizeMap.set(s.id, s);
    }

    // If saved data includes positions, restore them directly
    const hasPositions = widgetSizes?.every((s) => s.x !== undefined && s.y !== undefined);
    if (hasPositions && widgetSizes) {
        return dashboardLayout.map((id) => {
            const size = sizeMap.get(id);
            return {
                i: id,
                x: size?.x ?? 0,
                y: size?.y ?? 0,
                w: Math.min(4, Math.max(1, size?.colSpan ?? 2)),
                h: Math.min(4, Math.max(1, size?.rowSpan ?? 1)),
                minW: 1,
                maxW: 4,
                minH: 1,
                maxH: 4,
            };
        });
    }

    // Legacy fallback: reconstruct from order + sizes only
    const items: LayoutItem[] = [];
    let curX = 0;
    let curY = 0;

    for (const id of dashboardLayout) {
        const size = sizeMap.get(id);
        const w = Math.min(4, Math.max(1, size?.colSpan ?? 2));
        const h = Math.min(4, Math.max(1, size?.rowSpan ?? 1));

        if (curX + w > 4) {
            curX = 0;
            curY += 1;
        }

        items.push({ i: id, x: curX, y: curY, w, h, minW: 1, maxW: 4, minH: 1, maxH: 4 });
        curX += w;
        if (curX >= 4) {
            curX = 0;
            curY += 1;
        }
    }

    return items;
}

interface OrganizerViewProps {
    items: any[];
    publishedEvents: any[];
    draftEvents: any[];
    stats: { total: number; secondary: number; revenue: number };
    claimedKits: number;
    claimPercentage: number;
    eventKitStats: any[];
    recentRegistrations: any[];
    categoryRevenue: any[];
    eventRevenue: any[];
}

export function OrganizerView({
    items,
    publishedEvents,
    draftEvents,
    stats,
    claimedKits,
    claimPercentage,
    eventKitStats,
    recentRegistrations,
    categoryRevenue,
    eventRevenue,
}: OrganizerViewProps) {
    const { user } = useAuth();
    const updateLayout = useMutation(api.users.updateDashboardLayout);

    const savedLgLayout = useMemo(
        () => savedDataToLayout(user?.dashboardLayout, user?.widgetSizes),
        [user]
    );

    const [isEditing, setIsEditing] = useState(false);
    const [currentLgLayout, setCurrentLgLayout] = useState<LayoutItem[]>(savedLgLayout);
    const layoutBeforeEditRef = useRef<LayoutItem[]>(savedLgLayout);

    const { width, containerRef } = useContainerWidth();

    // Sync when saved data changes
    useEffect(() => {
        if (!isEditing) {
            setCurrentLgLayout(savedLgLayout);
            layoutBeforeEditRef.current = savedLgLayout;
        }
    }, [savedLgLayout, isEditing]);

    const handleLayoutChange = useCallback(
        (layout: Layout) => {
            if (isEditing) {
                setCurrentLgLayout(layout as LayoutItem[]);
            }
        },
        [isEditing]
    );

    const handleSave = useCallback(async () => {
        try {
            const data = layoutToSaveData(currentLgLayout);
            await updateLayout(data);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save layout", err);
        }
    }, [currentLgLayout, updateLayout]);

    const handleCancel = useCallback(() => {
        setCurrentLgLayout(layoutBeforeEditRef.current);
        setIsEditing(false);
    }, []);

    const handleStartEdit = useCallback(() => {
        layoutBeforeEditRef.current = currentLgLayout;
        setIsEditing(true);
    }, [currentLgLayout]);

    const handleReset = useCallback(() => {
        setCurrentLgLayout(DEFAULT_LG_LAYOUT.map((l) => ({ ...l })));
    }, []);

    const renderWidget = useCallback(
        (id: WidgetId) => {
            switch (id) {
                case "revenue-stats":
                    return (
                        <OrganizerRevenueStats
                            eventRevenue={eventRevenue}
                            totalRevenue={stats.revenue}
                        />
                    );
                case "kit-fulfillment":
                    return (
                        <OrganizerKitFulfillment
                            claimPercentage={claimPercentage}
                            claimedKits={claimedKits}
                            totalParticipants={stats.secondary}
                        />
                    );
                case "active-events":
                    return (
                        <OrganizerActiveEvents
                            items={items}
                            eventKitStats={eventKitStats}
                        />
                    );
                case "registrations-feed":
                    return (
                        <OrganizerRegistrationsFeed
                            recentRegistrations={recentRegistrations}
                        />
                    );
            }
        },
        [items, eventKitStats, recentRegistrations, eventRevenue, stats, claimedKits, claimPercentage]
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <OrganizerDraftsNotice draftEventsCount={draftEvents.length} />

            <OrganizerStats
                stats={stats}
                publishedEventsCount={publishedEvents.length}
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
            />

            {/* Edit mode controls */}
            <div className="flex justify-end gap-2">
                {isEditing ? (
                    <>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                        >
                            <X size={14} />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/80 rounded-lg transition-colors"
                        >
                            <Check size={14} />
                            Save Layout
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <LayoutGrid size={14} />
                        Rearrange
                    </button>
                )}
            </div>

            {isEditing && (
                <div className="text-xs text-text-muted text-center">
                    Drag widgets to reorder. Resize from the bottom-right corner.
                </div>
            )}

            <div ref={containerRef} className={isEditing ? "rgl-editing" : "rgl-static"}>
                <ResponsiveGridLayout
                    width={width}
                    layouts={{ lg: currentLgLayout }}
                    breakpoints={BREAKPOINTS}
                    cols={COLS}
                    rowHeight={ROW_HEIGHT}
                    margin={[24, 24]}
                    containerPadding={isEditing ? [24, 32] : [0, 0]}
                    dragConfig={{
                        enabled: isEditing,
                        handle: ".drag-handle",
                        threshold: 5,
                    }}
                    resizeConfig={{
                        enabled: isEditing,
                        handles: ["se"],
                    }}
                    compactor={verticalCompactor}
                    onLayoutChange={handleLayoutChange}
                    autoSize
                >
                    {currentLgLayout.map((item) => (
                        <div key={item.i}>
                            <DraggableWidget id={item.i} isEditing={isEditing}>
                                {renderWidget(item.i as WidgetId)}
                            </DraggableWidget>
                        </div>
                    ))}
                </ResponsiveGridLayout>
            </div>
        </div>
    );
}
