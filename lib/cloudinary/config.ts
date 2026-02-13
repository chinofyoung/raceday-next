// Cloudinary configuration and loader for optimized image delivery
export const CLOUDINARY_CONFIG = {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

export const cloudinaryLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
    const params = [`f_auto`, `c_limit`, `w_${width}`, `q_${quality || 'auto'}`];
    return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${params.join(',')}/${src}`;
};
