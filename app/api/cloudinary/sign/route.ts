import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { paramsToSign } = body;

        // Filter out undefined/null values from paramsToSign
        const filteredParams = Object.fromEntries(
            Object.entries(paramsToSign || {}).filter(([_, v]) => v != null)
        );

        const timestamp = Math.round(new Date().getTime() / 1000);

        // Add timestamp to params
        const signature = cloudinary.utils.api_sign_request(
            {
                ...filteredParams,
                timestamp,
            },
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({ signature, timestamp });
    } catch (error) {
        console.error('Error signing request:', error);
        return NextResponse.json({ error: 'Failed to sign request' }, { status: 500 });
    }
}
