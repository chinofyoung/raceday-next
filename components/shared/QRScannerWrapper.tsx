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

    return (
        <div className="relative w-full aspect-square bg-surface/20 rounded-xl overflow-hidden shadow-2xl border border-white/5">
            <div id="reader" className="w-full h-full" />

            {/* Visual Scan Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-2xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                    {/* Scanning Line Animation */}
                    <div className="absolute left-0 right-0 h-0.5 bg-primary/40 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-scan-line top-0" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes scan-line {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-line {
                    animation: scan-line 3s linear infinite;
                }
                #reader video {
                    object-fit: cover !important;
                }
            `}</style>
        </div>
    );
}
