"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerWrapperProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure: (error: any) => void;
    scannerRef: React.MutableRefObject<any>;
}

export default function QRScannerWrapper({ onScanSuccess, onScanFailure, scannerRef }: QRScannerWrapperProps) {
    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
        };
    }, [onScanFailure, onScanSuccess, scannerRef]);

    return <div id="reader" className="w-full aspect-square bg-surface/20 rounded-xl overflow-hidden" />;
}
