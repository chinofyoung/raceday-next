"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerWrapperProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure: (error: any) => void;
    scannerRef: React.MutableRefObject<any>;
}

export default function QRScannerWrapper({ onScanSuccess, onScanFailure, scannerRef }: QRScannerWrapperProps) {
    useEffect(() => {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        // Start scanning with rear camera
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
        ).catch((err) => {
            console.error("Scanner start error:", err);
            // Fallback to any camera if environment camera fails
            html5QrCode.start(
                { facingMode: "user" },
                config,
                onScanSuccess,
                onScanFailure
            ).catch(e => console.error("Scanner fallback error:", e));
        });

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().catch((err) => console.error("Scanner stop error:", err));
            }
        };
    }, [onScanFailure, onScanSuccess, scannerRef]);

    return <div id="reader" className="w-full aspect-square bg-surface/20 rounded-xl overflow-hidden shadow-2xl border border-white/5" />;
}
