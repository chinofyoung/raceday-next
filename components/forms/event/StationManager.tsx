"use client";

import { useState, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { MapContainer, TileLayer, Polyline, useMapEvents, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Droplets, HeartPulse, Plus, X, MapPin, Trash2, Edit2, Check } from "lucide-react";
import { EventFormValues, raceStationSchema } from "@/lib/validations/event";
import { StationType, RaceStation } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Custom icons for stations
const createStationIcon = (type: StationType, color: string) => {
    const iconHtml = `
        <div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${type === 'water' ? '💧' : type === 'aid' ? '🏥' : '➕'}
        </div>
    `;
    return L.divIcon({
        html: iconHtml,
        className: 'custom-station-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const STATION_COLORS = {
    water: "#3b82f6",     // Blue
    aid: "#f59e0b",       // Orange
    first_aid: "#ef4444", // Red
};

interface StationManagerProps {
    categoryIndex: number;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function MapAutoCenter({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [points, map]);
    return null;
}

export function StationManager({ categoryIndex }: StationManagerProps) {
    const { control, watch, setValue, formState: { errors } } = useFormContext<EventFormValues>();
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: `categories.${categoryIndex}.stations`,
    });

    const gpxUrl = watch(`categories.${categoryIndex}.routeMap.gpxFileUrl`);
    const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempStation, setTempStation] = useState<Partial<RaceStation>>({
        type: "water",
        label: "",
        coordinates: { lat: 0, lng: 0 }
    });

    useEffect(() => {
        if (gpxUrl) {
            fetch(gpxUrl)
                .then(res => res.text())
                .then(xmlStr => {
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

    const handleMapClick = (lat: number, lng: number) => {
        setTempStation(prev => ({
            ...prev,
            coordinates: { lat, lng }
        }));
    };

    const handleAddStation = () => {
        if (!tempStation.label || !tempStation.coordinates?.lat || !tempStation.coordinates?.lng) return;

        const newStation: RaceStation = {
            id: crypto.randomUUID(),
            type: tempStation.type as StationType,
            label: tempStation.label,
            coordinates: {
                lat: tempStation.coordinates.lat,
                lng: tempStation.coordinates.lng
            }
        };

        append(newStation);
        setTempStation({
            type: "water",
            label: "",
            coordinates: { lat: 0, lng: 0 }
        });
    };

    const handleEditClick = (station: RaceStation) => {
        setEditingId(station.id);
        setTempStation(station);
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        const index = fields.findIndex(f => f.id === editingId);
        if (index !== -1) {
            update(index, tempStation as RaceStation);
        }
        setEditingId(null);
        setTempStation({
            type: "water",
            label: "",
            coordinates: { lat: 0, lng: 0 }
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTempStation({
            type: "water",
            label: "",
            coordinates: { lat: 0, lng: 0 }
        });
    };

    if (!gpxUrl) {
        return (
            <div className="p-8 bg-surface/30 border border-white/5 rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted">
                    <MapPin size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">GPX Route Required</h3>
                    <p className="text-text-muted text-sm max-w-sm mx-auto mt-1">
                        Please upload a GPX route for this category first to start placing stations on the map.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Map and Controls */}
                <div className="space-y-6">
                    <div className="bg-surface/30 p-6 rounded-3xl border border-white/5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold tracking-tight text-white">
                                {editingId ? 'Edit Station' : 'Add New Station'}
                            </h3>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-text-muted">
                                    <X size={16} />
                                </Button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {(["water", "aid", "first_aid"] as StationType[]).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setTempStation(prev => ({ ...prev, type }))}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2",
                                            tempStation.type === type
                                                ? "border-primary bg-primary/10 text-white"
                                                : "border-white/5 bg-white/5 text-text-muted hover:border-white/20"
                                        )}
                                    >
                                        {type === 'water' && <Droplets size={20} className="text-blue-500" />}
                                        {type === 'aid' && <HeartPulse size={20} className="text-amber-500" />}
                                        {type === 'first_aid' && <Plus size={20} className="text-red-500" />}
                                        <span className="text-xs font-semibold uppercase tracking-wider">
                                            {type.replace('_', ' ')}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Label</Label>
                                    <Input
                                        placeholder="e.g. KM 5 Water Station"
                                        value={tempStation.label}
                                        onChange={e => setTempStation(prev => ({ ...prev, label: e.target.value }))}
                                        className="bg-surface border-white/10"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Latitude</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={tempStation.coordinates?.lat || ""}
                                            onChange={e => setTempStation(prev => ({
                                                ...prev,
                                                coordinates: { ...prev.coordinates!, lat: parseFloat(e.target.value) || 0 }
                                            }))}
                                            className="bg-surface border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-text-muted opacity-70">Longitude</Label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={tempStation.coordinates?.lng || ""}
                                            onChange={e => setTempStation(prev => ({
                                                ...prev,
                                                coordinates: { ...prev.coordinates!, lng: parseFloat(e.target.value) || 0 }
                                            }))}
                                            className="bg-surface border-white/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {!editingId ? (
                                <Button
                                    type="button"
                                    className="w-full h-12 text-sm font-semibold uppercase tracking-wider"
                                    onClick={handleAddStation}
                                    disabled={!tempStation.label || !tempStation.coordinates?.lat}
                                >
                                    Add Station to Map
                                </Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-12 text-xs font-semibold uppercase tracking-wider"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        className="h-12 text-xs font-semibold uppercase tracking-wider"
                                        onClick={handleSaveEdit}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            )}

                            <p className="text-xs text-text-muted font-bold uppercase tracking-wider text-center">
                                Tip: Click on the map to set coordinates
                            </p>
                        </div>
                    </div>

                    {/* Compact Station List */}
                    <div className="space-y-3">
                        {fields.map((field, index) => (
                            <div
                                key={field.id}
                                className={cn(
                                    "flex items-center justify-between p-4 bg-surface/30 border rounded-2xl transition-all group",
                                    editingId === field.id ? "border-primary" : "border-white/5 hover:border-white/20"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: STATION_COLORS[field.type] }}
                                    >
                                        {field.type === 'water' && <Droplets size={18} />}
                                        {field.type === 'aid' && <HeartPulse size={18} />}
                                        {field.type === 'first_aid' && <Plus size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{field.label}</h4>
                                        <p className="text-xs text-text-muted font-medium uppercase tracking-tight">
                                            {field.type.replace('_', ' ')} • {field.coordinates.lat.toFixed(4)}, {field.coordinates.lng.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={() => handleEditClick(field)}
                                        className="text-text-muted hover:text-white"
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="text-text-muted hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Map Preview */}
                <div className="h-[400px] lg:h-auto min-h-[500px] rounded-3xl overflow-hidden border border-white/10 relative">
                    <MapContainer
                        center={routePoints.length > 0 ? routePoints[0] : [14.5491, 121.0450]}
                        zoom={14}
                        style={{ height: "100%", width: "100%", background: "#1f2937" }}
                        scrollWheelZoom={false}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        {routePoints.length > 0 && (
                            <Polyline
                                positions={routePoints}
                                color="#F97316"
                                weight={4}
                                opacity={0.6}
                            />
                        )}

                        {fields.map((field) => (
                            <Marker
                                key={field.id}
                                position={[field.coordinates.lat, field.coordinates.lng]}
                                icon={createStationIcon(field.type, STATION_COLORS[field.type])}
                            >
                                <Popup>
                                    <div className="text-xs font-bold uppercase tracking-tight">
                                        {field.label}
                                    </div>
                                </Popup>
                                <Tooltip permanent direction="top" offset={[0, -15]} className="custom-tooltip">
                                    <span className="text-xs font-semibold uppercase tracking-wider">{field.label}</span>
                                </Tooltip>
                            </Marker>
                        ))}

                        {/* Temp Station Marker (Current Selection) */}
                        {tempStation.coordinates?.lat !== 0 && (
                            <Marker
                                position={[tempStation.coordinates!.lat, tempStation.coordinates!.lng]}
                                icon={createStationIcon(tempStation.type as StationType, '#ffffff')}
                            >
                                <Tooltip permanent direction="top" offset={[0, -15]}>
                                    <span className="text-xs font-semibold uppercase tracking-wider">New Position</span>
                                </Tooltip>
                            </Marker>
                        )}

                        <MapClickHandler onMapClick={handleMapClick} />
                        <MapAutoCenter points={routePoints} />
                    </MapContainer>

                    <div className="absolute bottom-4 left-4 right-4 z-[1000] p-4 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                        <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">
                            Click anywhere on the route to set station location
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-tooltip {
                    background: rgba(17, 24, 39, 0.9) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    font-family: inherit !important;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                    border-radius: 6px !important;
                    padding: 2px 6px !important;
                }
                .custom-tooltip:before {
                    border-top-color: rgba(17, 24, 39, 0.9) !important;
                }
            `}</style>
        </div>
    );
}
