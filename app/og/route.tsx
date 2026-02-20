import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "#111827",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ fontSize: 72, fontWeight: 900, color: "#f97316", letterSpacing: "-2px" }}>
                    RACEDAY
                </div>
                <div style={{ fontSize: 28, color: "#9ca3af", marginTop: 16 }}>
                    The Ultimate Running Platform
                </div>
                <div style={{ fontSize: 18, color: "#4b5563", marginTop: 8 }}>
                    Discover • Register • Race
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}
