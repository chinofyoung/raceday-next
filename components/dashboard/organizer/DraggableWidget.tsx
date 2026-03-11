"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableWidgetProps {
    id: string;
    isEditing: boolean;
    className?: string;
    children: ReactNode;
}

export function DraggableWidget({ id, isEditing, className, children }: DraggableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isEditing });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative ${className || ""} ${
                isDragging ? "z-50 opacity-75" : ""
            } ${isEditing ? "ring-1 ring-white/10 rounded-2xl" : ""}`}
        >
            {isEditing && (
                <button
                    {...attributes}
                    {...listeners}
                    className="absolute -top-3 -right-3 z-10 p-1.5 rounded-full bg-surface border border-white/10 text-text-muted hover:text-white hover:bg-white/10 transition-colors cursor-grab active:cursor-grabbing"
                    aria-label="Drag to reorder"
                >
                    <GripVertical size={16} />
                </button>
            )}
            {children}
        </div>
    );
}
