"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { CloudUpload, X, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CLOUDINARY_CONFIG } from "@/lib/cloudinary/config";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    onRemove?: () => void;
    disabled?: boolean;
    label?: string;
    className?: string;
    description?: string;
    aspectRatio?: "square" | "video" | "wide"; // basic presets for aspect ratio class
    resourceType?: "image" | "raw" | "auto";
    acceptedFileTypes?: string;
    variant?: "default" | "compact";
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled,
    label = "Upload Image",
    className,
    description,
    aspectRatio = "wide",
    resourceType = "image",
    acceptedFileTypes = "image/*",
    variant = "default"
}: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (resourceType === "image" && !file.type.startsWith("image/")) {
            toast.error("Invalid file type", { description: "Please upload an image file." });
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error("File too large", { description: "Max file size is 10MB." });
            return;
        }

        try {
            setLoading(true);

            // 1. Get Signature from our server
            const paramsToSign = {
                upload_preset: CLOUDINARY_CONFIG.uploadPreset,
            };

            const signResponse = await fetch("/api/cloudinary/sign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paramsToSign }),
            });

            if (!signResponse.ok) {
                throw new Error("Failed to get upload signature from server");
            }

            const { signature, timestamp } = await signResponse.json();

            // 2. Upload to Cloudinary with signature
            const formData = new FormData();
            formData.append("file", file);
            formData.append("api_key", CLOUDINARY_CONFIG.apiKey || "");
            formData.append("timestamp", timestamp.toString());
            formData.append("signature", signature);
            formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset || "");

            const cloudName = CLOUDINARY_CONFIG.cloudName;
            if (!cloudName) throw new Error("Cloudinary cloud name not configured");

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Cloudinary upload failed");
            }

            const data = await response.json();
            onChange(data.secure_url);
            toast.success("File uploaded successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Please try again later.";
            toast.error("Upload failed", {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const aspectRatioClass = {
        square: "aspect-square",
        video: "aspect-video",
        wide: "aspect-[16/9]" // default wide
    }[aspectRatio];

    if (variant === "compact") {
        return (
            <div className={cn("flex items-center gap-2", className)}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept={acceptedFileTypes}
                    className="hidden"
                    disabled={loading || disabled}
                />

                {loading ? (
                    <Button type="button" variant="outline" size="sm" disabled className="gap-2 h-9">
                        <Loader2 className="animate-spin" size={14} />
                        Uploading
                    </Button>
                ) : value ? (
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={triggerUpload}
                            className="h-9 gap-2 text-[10px] font-black uppercase italic"
                        >
                            <CloudUpload size={14} /> Replace
                        </Button>
                        {onRemove && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onRemove}
                                className="h-9 w-9 p-0 text-red-500 border-red-500/20 hover:bg-red-500/10"
                            >
                                <X size={14} />
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={triggerUpload}
                        className="h-9 gap-2 text-[10px] font-black uppercase italic shadow-lg shadow-primary/20"
                    >
                        <CloudUpload size={14} /> Upload GPX
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {(label || description) && (
                <div className="space-y-1">
                    {label && <h3 className="text-xs font-black uppercase tracking-widest text-text-muted italic">{label}</h3>}
                    {description && <p className="text-xs text-text-muted">{description}</p>}
                </div>
            )}

            <div
                className={cn(
                    "relative rounded-3xl overflow-hidden border-2 border-dashed transition-all group",
                    aspectRatioClass,
                    value ? "border-primary/50" : "border-white/10 hover:border-primary/30",
                    disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"
                )}
                onClick={!value ? triggerUpload : undefined}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    accept={acceptedFileTypes}
                    className="hidden"
                    disabled={loading || disabled}
                />

                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
                        <Loader2 className="animate-spin text-primary mb-2" size={32} />
                        <span className="text-xs font-bold uppercase tracking-widest text-white">Uploading...</span>
                    </div>
                ) : value ? (
                    <>
                        {resourceType === "image" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={value}
                                alt="Uploaded"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5">
                                <FileText size={48} className="text-primary mb-2" />
                                <p className="text-xs font-bold uppercase text-white">File Uploaded</p>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10 gap-2">
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerUpload();
                                }}
                                className="h-9 gap-2"
                            >
                                <CloudUpload size={14} /> Change
                            </Button>
                            {onRemove && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove();
                                    }}
                                    className="h-9 w-9 p-0 text-red-500 border-red-500/50 hover:bg-red-500/10"
                                >
                                    <X size={14} />
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-text-muted transition-colors group-hover:text-primary">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CloudUpload size={32} />
                        </div>
                        <div className="text-center px-4">
                            <span className="block font-bold uppercase italic tracking-wider text-sm">Click to upload</span>
                            <span className="text-[10px] font-medium opacity-50 uppercase mt-1">
                                {resourceType === "raw" ? "Any File (Max 10MB)" : "JPG, PNG, WEBP (Max 10MB)"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
