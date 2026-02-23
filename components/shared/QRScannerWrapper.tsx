"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

interface QRScannerWrapperProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure: (error: any) => void;
    scannerRef: React.MutableRefObject<any>;
    onPermissionStatus?: (status: "granted" | "denied" | "prompt") => void;
}

export default function QRScannerWrapper({ onScanSuccess, onScanFailure, scannerRef, onPermissionStatus }: QRScannerWrapperProps) {
    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.floor(minEdge * 0.7);
                return { width: size, height: size };
            },
            aspectRatio: 1.0
        };

        // Handle the camera start logic
        const startScanner = async () => {
            try {
                onPermissionStatus?.("prompt");
                // If we get an explicit list of devices, ALWAYS grab the first one by ID. 
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    onPermissionStatus?.("granted");
                    // On desktop, the first camera is usually the default webcam.
                    // We can also look for keywords in labels if we want to be fancy.
                    const preferredCamera = devices.find(d =>
                        d.label.toLowerCase().includes("back") ||
                        d.label.toLowerCase().includes("rear") ||
                        d.label.toLowerCase().includes("external")
                    ) || devices[0];

                    try {
                        console.log("Using camera:", preferredCamera.label);
                        await html5QrCode.start(preferredCamera.id, config, onScanSuccess, onScanFailure);
                        return; // Successfully started
                    } catch (idErr) {
                        console.warn("Explicit ID failed, falling back to unconstrained query...", idErr);
                    }
                }

                // If explicit ID fails or enumerate devices fails (but didn't throw), try dumb fallbacks
                console.log("No specific cameras enumerated or ID failed. Trying generic fallbacks.");
                try {
                    await html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure);
                    onPermissionStatus?.("granted");
                } catch (envErr) {
                    console.log("Environment failed, trying user facing mode...");
                    await html5QrCode.start({ facingMode: "user" }, config, onScanSuccess, onScanFailure);
                    onPermissionStatus?.("granted");
                }

            } catch (err: any) {
                console.error("All camera initialization strategies failed:", err);
                const isPermissionError = err?.name === "NotAllowedError" || err?.message?.toLowerCase().includes("permission");
                if (isPermissionError) {
                    onPermissionStatus?.("denied");
                }

                toast.error("Camera Access Denied", {
                    description: isPermissionError
                        ? "Please allow camera permissions in your browser settings to use the scanner."
                        : "Could not find a camera connected to your device."
                });
            }
        };

        startScanner();

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch((err) => console.error("Scanner stop error:", err));
            }
        };
    }, [onScanFailure, onScanSuccess, scannerRef, onPermissionStatus]);

    return (
        <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group-hover:border-primary/50 transition-colors">
            <div id="reader" className="w-full h-full" />

            <style jsx global>{`
                #reader video {
                    object-fit: cover !important;
                    width: 100% !important;
                    height: 100% !important;
                }
                #reader__scan_region {
                    background: transparent !important;
                }
            `}</style>
        </div>
    );
}
