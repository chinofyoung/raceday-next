"use client";

import { useState, useMemo, useCallback } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { LayoutGrid, Check, X } from "lucide-react";

import { OrganizerStats } from "./organizer/OrganizerStats";
import { OrganizerActiveEvents } from "./organizer/OrganizerActiveEvents";
import { OrganizerDraftsNotice } from "./organizer/OrganizerDraftsNotice";
import { OrganizerRegistrationsFeed } from "./organizer/OrganizerRegistrationsFeed";
import { OrganizerRevenueStats } from "./organizer/OrganizerRevenueStats";
import { OrganizerKitFulfillment } from "./organizer/OrganizerKitFulfillment";
import { DraggableWidget } from "./organizer/DraggableWidget";

const DEFAULT_WIDGET_ORDER = [
    "revenue-stats",
    "kit-fulfillment",
    "active-events",
    "registrations-feed",
] as const;

type WidgetId = (typeof DEFAULT_WIDGET_ORDER)[number];

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

    const savedOrder = useMemo(() => {
        const layout = (user as any)?.dashboardLayout as string[] | undefined;
        if (!layout || layout.length !== DEFAULT_WIDGET_ORDER.length) {
            return [...DEFAULT_WIDGET_ORDER];
        }
        return layout as WidgetId[];
    }, [user]);

    const [isEditing, setIsEditing] = useState(false);
    const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(savedOrder);

    // Sync local state when saved order changes (e.g. on first load)
    useMemo(() => {
        if (!isEditing) {
            setWidgetOrder(savedOrder);
        }
    }, [savedOrder, isEditing]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setWidgetOrder((prev) => {
                const oldIndex = prev.indexOf(active.id as WidgetId);
                const newIndex = prev.indexOf(over.id as WidgetId);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    }, []);

    const handleSave = useCallback(async () => {
        await updateLayout({ layout: [...widgetOrder] });
        setIsEditing(false);
    }, [widgetOrder, updateLayout]);

    const handleCancel = useCallback(() => {
        setWidgetOrder(savedOrder);
        setIsEditing(false);
    }, [savedOrder]);

    const widgetMap: Record<WidgetId, React.ReactNode> = {
        "revenue-stats": (
            <OrganizerRevenueStats
                categoryRevenue={categoryRevenue}
                eventRevenue={eventRevenue}
                totalRevenue={stats.revenue}
            />
        ),
        "kit-fulfillment": (
            <OrganizerKitFulfillment
                claimPercentage={claimPercentage}
                claimedKits={claimedKits}
                totalParticipants={stats.secondary}
            />
        ),
        "active-events": (
            <OrganizerActiveEvents items={items} eventKitStats={eventKitStats} />
        ),
        "registrations-feed": (
            <OrganizerRegistrationsFeed recentRegistrations={recentRegistrations} />
        ),
    };

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
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-muted hover:text-white rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                    >
                        <LayoutGrid size={14} />
                        Rearrange
                    </button>
                )}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {widgetOrder.map((id) => (
                            <DraggableWidget key={id} id={id} isEditing={isEditing}>
                                {widgetMap[id]}
                            </DraggableWidget>
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
