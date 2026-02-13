"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
}

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
    className
}: RouteMapViewerProps) {
    const [routePoints, setRoutePoints] = useState<[number, number][]>(points);

    useEffect(() => {
        if (gpxUrl) {
            // In a real app, we'd fetch and parse the GPX here
            // For now, if it's a mock or we don't have a parser yet, we'll just use points if provided
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

    const mapCenter = routePoints.length > 0 ? routePoints[0] : center;

    return (
        <div className={cn("rounded-2xl overflow-hidden border border-white/10 h-full w-full", className)}>
            <MapContainer
                center={mapCenter}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {routePoints.length > 0 && (
                    <>
                        <Polyline positions={routePoints} color="#F97316" weight={4} opacity={0.8} />
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
        </div>
    );
}

// Utility to merge classes since I can't import cn easily in this specific block without full path
function cn(...classes: (string | undefined | boolean | null)[]) {
    return classes.filter(Boolean).join(" ");
}
