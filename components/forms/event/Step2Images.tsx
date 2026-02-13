"use client";

import { useFormContext } from "react-hook-form";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/Button";
import { EventFormValues } from "@/lib/validations/event";
import { CloudUpload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Step2Images() {
    const { setValue, watch, formState: { errors } } = useFormContext<EventFormValues>();
    const featuredImage = watch("featuredImage");
    const galleryImages = watch("galleryImages") || [];

    const handleFeaturedSuccess = (result: any) => {
        if (result.event === "success") {
            setValue("featuredImage", result.info.secure_url, { shouldValidate: true });
        }
    };

    const handleGallerySuccess = (result: any) => {
        if (result.event === "success") {
            const updatedGallery = [...galleryImages, result.info.secure_url].slice(0, 5);
            setValue("galleryImages", updatedGallery, { shouldValidate: true });
        }
    };

    const removeGalleryImage = (index: number) => {
        const updatedGallery = galleryImages.filter((_, i) => i !== index);
        setValue("galleryImages", updatedGallery, { shouldValidate: true });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">Event Images</h2>
                <p className="text-text-muted font-medium">Visuals are key to attracting runners. Upload high-quality posters and photos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Featured Image */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary italic">Featured Event Poster</h3>
                    <div className={cn(
                        "relative aspect-[4/5] md:aspect-[16/9] rounded-3xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center transition-all group",
                        featuredImage ? "border-primary/50" : "border-white/10 hover:border-primary/30"
                    )}>
                        {featuredImage ? (
                            <>
                                <img src={featuredImage} alt="Featured" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <CldUploadWidget
                                        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                        onSuccess={handleFeaturedSuccess}
                                    >
                                        {({ open }) => (
                                            <Button type="button" variant="primary" size="sm" onClick={() => open?.()} className="gap-2">
                                                <CloudUpload size={16} /> Update Poster
                                            </Button>
                                        )}
                                    </CldUploadWidget>
                                </div>
                            </>
                        ) : (
                            <CldUploadWidget
                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                onSuccess={handleFeaturedSuccess}
                            >
                                {({ open }) => (
                                    <button
                                        type="button"
                                        onClick={() => open?.()}
                                        className="w-full h-full flex flex-col items-center justify-center gap-4 text-text-muted transition-colors hover:text-primary"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                            <CloudUpload size={32} />
                                        </div>
                                        <div className="text-center">
                                            <span className="block font-bold uppercase italic tracking-wider">Click to upload poster</span>
                                            <span className="text-xs font-medium opacity-50 uppercase">1200 x 675 recommended</span>
                                        </div>
                                    </button>
                                )}
                            </CldUploadWidget>
                        )}
                    </div>
                    {errors.featuredImage?.message && (
                        <p className="text-xs text-red-500 font-bold uppercase italic tracking-wide">{errors.featuredImage.message}</p>
                    )}
                </div>

                {/* Gallery Images */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-cta italic">Event Gallery</h3>
                        <span className="text-[10px] font-bold text-text-muted opacity-50 uppercase">Max 5 Images</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {galleryImages.map((img, i) => (
                            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/5">
                                <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeGalleryImage(i)}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}

                        {galleryImages.length < 5 && (
                            <CldUploadWidget
                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                                onSuccess={handleGallerySuccess}
                            >
                                {({ open }) => (
                                    <button
                                        type="button"
                                        onClick={() => open?.()}
                                        className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-text-muted hover:border-cta/30 hover:text-cta transition-all"
                                    >
                                        <ImageIcon size={24} />
                                        <span className="text-[10px] font-bold uppercase italic tracking-wider">Add Photo</span>
                                    </button>
                                )}
                            </CldUploadWidget>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
