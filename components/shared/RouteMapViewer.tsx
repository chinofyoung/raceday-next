"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveTracker } from "@/lib/services/liveTrackingService";
import { RaceStation } from "@/types/event";

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
    liveTrackers?: LiveTracker[];
    currentUserId?: string;
    stations?: RaceStation[];
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

const STATION_COLORS = {
    water: "#3b82f6",     // Blue
    aid: "#f59e0b",       // Orange
    first_aid: "#ef4444", // Red
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
    theme = "dark",
    liveTrackers = [],
    currentUserId,
    stations = []
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
                {liveTrackers.map(tracker => {
                    const isMe = tracker.userId === currentUserId;
                    const color = isMe ? "#22c55e" : "#3b82f6"; // green for me, blue for others

                    // Create a cohesive teardrop "navigator" shape that feels like one unit
                    const html = `
                        <div style="transform: rotate(${tracker.bearing || 0}deg); width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));">
                                <path 
                                    d="M12 3 L18 13 A 7 7 0 1 1 6 13 L 12 3 Z" 
                                    fill="${color}" 
                                    stroke="white" 
                                    stroke-width="2.5" 
                                    stroke-linejoin="round"
                                />
                                <circle cx="12" cy="13.5" r="2.5" fill="white" fill-opacity="0.3" />
                            </svg>
                        </div>
                    `;

                    const icon = L.divIcon({
                        html,
                        className: 'custom-live-marker',
                        iconSize: [18, 18],
                        iconAnchor: [9, 9],
                        popupAnchor: [0, -9]
                    });

                    return (
                        <Marker key={tracker.userId} position={[tracker.lat, tracker.lng]} icon={icon}>
                            <Popup>
                                <div className="text-xs font-black italic uppercase tracking-tight">
                                    {tracker.displayName} {isMe && "(You)"}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {stations.map((station) => {
                    const color = STATION_COLORS[station.type];
                    const html = `
                        <div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); font-size: 10px;">
                            ${station.type === 'water' ? '💧' : station.type === 'aid' ? '🏥' : '➕'}
                        </div>
                    `;

                    const icon = L.divIcon({
                        html,
                        className: 'custom-station-marker',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                        popupAnchor: [0, -10]
                    });

                    return (
                        <Marker key={station.id} position={[station.coordinates.lat, station.coordinates.lng]} icon={icon}>
                            <Popup>
                                <div className="text-xs font-black italic uppercase tracking-tight">
                                    {station.label}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* Theme Toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent map click if any
                    setCurrentTheme(t => t === "dark" ? "light" : "dark");
                }}
                className="absolute top-4 right-4 z-[1100] p-2 bg-gray-900/80 backdrop-blur-md rounded-lg border border-white/10 text-white/80 hover:bg-gray-800 hover:text-white transition-all shadow-lg"
                title={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
                type="button"
            >
                {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
    );
}


