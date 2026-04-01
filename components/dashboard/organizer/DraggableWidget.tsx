"use client";

import type { ReactNode } from "react";
import { GripVertical } from "lucide-react";

interface DraggableWidgetProps {
    id: string;
    isEditing: boolean;
    children: ReactNode;
}

export function DraggableWidget({
    id,
    isEditing,
    children,
}: DraggableWidgetProps) {
    return (
        <div className={`h-full relative group ${isEditing ? "ring-1 ring-primary/30 rounded-2xl" : ""}`}>
            {isEditing && (
                <div className="drag-handle absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-white/10 text-text-muted hover:text-white hover:bg-white/10 hover:border-primary/30 transition-colors cursor-grab active:cursor-grabbing shadow-lg">
                    <GripVertical size={14} />
                    <span className="text-[10px] font-medium uppercase tracking-wider">Drag</span>
                </div>
            )}
            {children}
        </div>
    );
}
