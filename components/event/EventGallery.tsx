"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
// Custom lightbox implementation for full control over design and animations

interface EventGalleryProps {
    images: string[];
    eventName: string;
}

export function EventGallery({ images, eventName }: EventGalleryProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Don't render if no images
    if (!images || images.length === 0) return null;

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsOpen(true);
        // Prevent body scroll
        document.body.style.overflow = "hidden";
    };

    const closeLightbox = useCallback(() => {
        setIsOpen(false);
        // Restore body scroll
        document.body.style.overflow = "auto";
    }, []);

    const nextImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") nextImage();
            if (e.key === "ArrowLeft") prevImage();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, closeLightbox, nextImage, prevImage]);

    // Handle single image differently? Plan says "Show it as a single larger thumbnail".
    if (images.length === 1) {
        return (
            <div className="space-y-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                    Event <span className="text-primary">Gallery</span>
                </h3>
                <div
                    className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 group cursor-pointer"
                    onClick={() => openLightbox(0)}
                >
                    <Image
                        src={images[0]}
                        alt={`${eventName} - Gallery Image 1`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Maximize2 className="text-white drop-shadow-md" size={32} />
                    </div>
                </div>
                {renderLightbox()}
            </div>
        );
    }

    // Grid layout for multiple images
    // Limit to showing first 5 images in grid if there are more? 
    // Plan: "If 5+ images, show a '+N more' overlay on the last visible thumbnail."
    const displayImages = images.slice(0, 5);
    const remainingCount = images.length - 5;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                Event <span className="text-primary">Gallery</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayImages.map((img, index) => {
                    const isLast = index === 4; // 5th image (0-indexed)
                    const showOverlay = isLast && remainingCount > 0;

                    return (
                        <div
                            key={index}
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-surface/50"
                            onClick={() => openLightbox(index)}
                        >
                            <Image
                                src={img}
                                alt={`${eventName} - Gallery Image ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Hover Overlay */}
                            <div className={cn(
                                "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100",
                                showOverlay && "opacity-100 bg-black/60 group-hover:bg-black/70"
                            )}>
                                {showOverlay ? (
                                    <span className="text-xl font-black italic text-white">+{remainingCount}</span>
                                ) : (
                                    <Maximize2 className="text-white drop-shadow-md scale-75" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {renderLightbox()}
        </div>
    );

    function renderLightbox() {
        if (!isOpen) return null;

        return (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={closeLightbox}
            >
                {/* Close Button */}
                <button
                    onClick={closeLightbox}
                    className="absolute top-6 right-6 z-50 p-2 text-white/70 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>

                {/* Counter */}
                <div className="absolute top-6 left-6 z-50 px-3 py-1 bg-black/50 rounded-full border border-white/10 text-xs font-bold text-white tracking-widest">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Navigation - Left */}
                {images.length > 1 && (
                    <button
                        onClick={prevImage}
                        className="absolute left-4 md:left-8 z-50 p-3 rounded-full bg-black/20 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-all backdrop-blur-md"
                    >
                        <ChevronLeft size={32} />
                    </button>
                )}

                {/* Main Image */}
                <div
                    className="relative w-full max-w-5xl h-[85vh] mx-4 md:mx-12"
                    onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing
                >
                    <Image
                        src={images[currentIndex]}
                        alt={`${eventName} - Gallery Image ${currentIndex + 1}`}
                        fill
                        className="object-contain"
                        quality={100}
                        priority
                    />
                </div>

                {/* Navigation - Right */}
                {images.length > 1 && (
                    <button
                        onClick={nextImage}
                        className="absolute right-4 md:right-8 z-50 p-3 rounded-full bg-black/20 hover:bg-white/10 border border-white/5 text-white/70 hover:text-white transition-all backdrop-blur-md"
                    >
                        <ChevronRight size={32} />
                    </button>
                )}
            </div>
        );
    }
}
