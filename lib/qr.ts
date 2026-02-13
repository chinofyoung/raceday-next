import QRCode from "qrcode";

/**
 * Generates a Data URL for a QR code based on the provided text
 */
export async function generateQRCode(text: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(text, {
            margin: 2,
            scale: 10,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });
        return dataUrl;
    } catch (err) {
        console.error("Error generating QR code:", err);
        throw err;
    }
}
