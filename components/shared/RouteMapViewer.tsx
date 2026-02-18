"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapViewerProps {
    gpxUrl?: string;
    points?: [number, number][];
    center?: [number, number];
    zoom?: number;
    className?: string;
    theme?: "light" | "dark";
}

const TILE_THEMES = {
    dark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        routeColor: "#F97316", // Orange (primary) still looks good on dark
    },
    light: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        routeColor: "#F97316",
    },
};

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export function RouteMapViewer({
    gpxUrl,
    points = [],
    center = [14.5491, 121.0450], // Default to BGC
    zoom = 13,
    className,
    theme = "dark"
}: RouteMapViewerProps) {
    const [routePoints, setRoutePoints] = useState<[number, number][]>(points);
    const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(theme);

    useEffect(() => {
        if (gpxUrl) {
            fetch(gpxUrl)
                .then(res => res.text())
                .then(xmlStr => {
                    // Basic XML parsing for GPX
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(xmlStr, "text/xml");
                    const trkpts = xml.getElementsByTagName("trkpt");
                    const pts: [number, number][] = [];
                    for (let i = 0; i < trkpts.length; i++) {
                        const lat = parseFloat(trkpts[i].getAttribute("lat") || "0");
                        const lon = parseFloat(trkpts[i].getAttribute("lon") || "0");
                        pts.push([lat, lon]);
                    }
                    if (pts.length > 0) setRoutePoints(pts);
                })
                .catch(err => console.error("Error parsing GPX:", err));
        }
    }, [gpxUrl]);

    // Update local state if prop changes
    useEffect(() => {
        setCurrentTheme(theme);
    }, [theme]);

    const mapCenter = routePoints.length > 0 ? routePoints[0] : center;
    const activeTheme = TILE_THEMES[currentTheme];

    return (
        <div className={cn("rounded-2xl overflow-hidden border border-white/10 h-full w-full relative group", className)}>
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: "100%", width: "100%", background: "#1f2937" }} // match app bg
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution={activeTheme.attribution}
                    url={activeTheme.url}
                />
                {routePoints.length > 0 && (
                    <>
                        <Polyline
                            positions={routePoints}
                            color={activeTheme.routeColor}
                            weight={4}
                            opacity={0.8}
                        />
                        <Marker position={routePoints[0]}>
                            <Popup>Start</Popup>
                        </Marker>
                        <Marker position={routePoints[routePoints.length - 1]}>
                            <Popup>Finish</Popup>
                        </Marker>
                        <MapUpdater center={routePoints[Math.floor(routePoints.length / 2)]} zoom={zoom} />
                    </>
                )}
            </MapContainer>

            {/* Theme Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent map click if any
                    setCurrentTheme(t => t === "dark" ? "light" : "dark");
                }}
                className="absolute top-3 right-3 z-[1000] p-2 bg-gray-900/80 backdrop-blur-md rounded-lg border border-white/10 text-white/80 hover:bg-gray-800 hover:text-white transition-all shadow-lg"
                title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
                type="button"
            >
                {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
    );
}


