// Imports updated
import { useFormContext } from "react-hook-form";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { EventFormValues } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Ensure toast is imported if used directly, though ImageUpload handles its own toasts usually, but context might need it. Actually I don't need toast here if logic is simple. But let's see.

export function Step2Images() {
    const { setValue, watch, formState: { errors } } = useFormContext<EventFormValues>();
    const featuredImage = watch("featuredImage");
    const galleryImages = watch("galleryImages") || [];

    const handleFeaturedChange = (url: string) => {
        setValue("featuredImage", url, { shouldValidate: true });
    };

    const handleGalleryAdd = (url: string) => {
        const updatedGallery = [...galleryImages, url].slice(0, 5);
        setValue("galleryImages", updatedGallery, { shouldValidate: true });
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
                    <div className="w-full">
                        <ImageUpload
                            value={featuredImage}
                            onChange={handleFeaturedChange}
                            onRemove={() => setValue("featuredImage", "", { shouldValidate: true })}
                            aspectRatio="wide"
                            label=""
                            description="1200 x 675 recommended"
                        />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
                                </button>
                            </div>
                        ))}

                        {galleryImages.length < 5 && (
                            <div className="aspect-square">
                                <ImageUpload
                                    onChange={handleGalleryAdd}
                                    aspectRatio="square"
                                    label=""
                                    className="h-full"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
